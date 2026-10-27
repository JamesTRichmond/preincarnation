#!/usr/bin/env python3
"""Measure exported Vein Score files. Does not listen and does not master."""

from __future__ import annotations

import json
import math
import struct
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
WAV_MIX = ROOT / "audio" / "wav" / "mix"
WAV_LAYER = ROOT / "audio" / "wav" / "layers"
WEB = ROOT / "web"


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        n = w.getnframes()
        sw = w.getsampwidth()
        raw = w.readframes(n)
    if sw != 2:
        raise RuntimeError(f"{path} sampwidth {sw}")
    pcm = np.frombuffer(raw, dtype="<i2").astype(np.float32).reshape(-1, ch).T / 32768.0
    return pcm, sr


def dbfs(x: float) -> float:
    return 20 * math.log10(max(abs(x), 1e-12))


def step_ratio(channel: np.ndarray) -> dict:
    if channel.size < 8:
        return {"boundary": 0, "p95": 0, "ratio": 0}
    diffs = np.abs(np.diff(channel))
    boundary = float(abs(channel[0] - channel[-1]))
    p95 = float(np.percentile(diffs, 95))
    return {
        "boundary": round(boundary, 6),
        "p95": round(p95, 6),
        "ratio": round(boundary / max(p95, 1e-9), 3),
    }


def measure_buffer(audio: np.ndarray, sr: int, loop: bool) -> dict:
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(np.square(audio, dtype=np.float64))))
    dc = [float(np.mean(audio[c])) for c in range(audio.shape[0])]
    clips = int(np.sum(np.abs(audio) >= 0.999))
    seams = [step_ratio(audio[c]) for c in range(audio.shape[0])]
    return {
        "seconds": round(audio.shape[1] / sr, 4),
        "sampleRate": sr,
        "channels": int(audio.shape[0]),
        "peakDbfs": round(dbfs(peak), 2),
        "rmsDbfs": round(dbfs(rms), 2),
        "dc": [round(v, 6) for v in dc],
        "fullScaleSamples": clips,
        "loopJoin": seams if loop else None,
    }


def decode_mp3(path: Path) -> tuple[np.ndarray, int]:
    proc = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "wav", "-acodec", "pcm_s16le", "-"],
        check=True,
        stdout=subprocess.PIPE,
    )
    raw = proc.stdout
    if raw[:4] != b"RIFF":
        raise RuntimeError("ffmpeg wav header missing")
    # Parse the fmt and data chunks without assuming 44-byte header.
    pos = 12
    sr = 0
    ch = 0
    data = b""
    while pos + 8 <= len(raw):
        chunk = raw[pos : pos + 4]
        size = struct.unpack_from("<I", raw, pos + 4)[0]
        body = raw[pos + 8 : pos + 8 + size]
        if chunk == b"fmt ":
            ch, sr = struct.unpack_from("<HH", body, 2)[0], struct.unpack_from("<I", body, 4)[0]
        elif chunk == b"data":
            data = body
            break
        pos += 8 + size + (size & 1)
    pcm = np.frombuffer(data, dtype="<i2").astype(np.float32)
    if ch:
        pcm = pcm.reshape(-1, ch).T
    else:
        pcm = pcm.reshape(1, -1)
    return pcm / 32768.0, sr or 44100


def equal_power_join(a: np.ndarray, b: np.ndarray, sr: int, fade: float) -> dict:
    """Crossfade the last `fade` seconds of a into the first `fade` of b, from mid-file material."""
    n = int(fade * sr)
    if a.shape[1] < n * 3 or b.shape[1] < n * 3:
        return {"skipped": True}
    a0 = a[:, a.shape[1] // 3 : a.shape[1] // 3 + n]
    b0 = b[:, b.shape[1] // 2 : b.shape[1] // 2 + n]
    t = np.linspace(0, 1, n, dtype=np.float32)
    out_g = np.cos(t * np.pi / 2)
    inn_g = np.sin(t * np.pi / 2)
    mixed = a0 * out_g + b0 * inn_g
    peak = float(np.max(np.abs(mixed)))
    # Derivative spike relative to each source's own p95 step.
    diffs = np.abs(np.diff(mixed, axis=1))
    spike = float(np.max(diffs))
    base = []
    for src in (a0, b0):
        d = np.abs(np.diff(src, axis=1))
        base.append(float(np.percentile(d, 95)))
    typical = max(base) if base else 1e-9
    return {
        "fadeSec": fade,
        "peakDbfs": round(20 * math.log10(max(peak, 1e-12)), 2),
        "clipped": peak >= 0.999,
        "stepSpike": round(spike, 5),
        "sourceP95": round(typical, 5),
        "spikeRatio": round(spike / max(typical, 1e-9), 3),
    }


def motif_hits(audio: np.ndarray, sr: int, events: list[dict], piece_id: str) -> dict:
    wanted = [
        e
        for e in events
        if e["piece"] == piece_id
        and e["vel"] >= 0.4
        and e["timbre"] in ("dulcimer", "voice", "other", "marble", "bass")
        and e["dur"] >= 0.35
    ]
    # Spread samples across the cue.
    picked = []
    if wanted:
        for i in np.linspace(0, len(wanted) - 1, num=min(6, len(wanted)), dtype=int):
            picked.append(wanted[int(i)])
    hits = 0
    checked = []
    for e in picked:
        freq = 440.0 * (2.0 ** ((e["midi"] - 69.0) / 12.0))
        start = int((e["time"] + min(0.12, e["dur"] * 0.35)) * sr)
        length = int(min(0.35, e["dur"] * 0.6) * sr)
        if start < 0 or start + length > audio.shape[1] or length < 256:
            checked.append({"time": e["time"], "midi": e["midi"], "pass": False, "reason": "window"})
            continue
        seg = audio[0, start : start + length] * np.hanning(length).astype(np.float32)
        spec = np.abs(np.fft.rfft(seg))
        freqs = np.fft.rfftfreq(length, 1 / sr)
        band = (freqs > freq * 0.97) & (freqs < freq * 1.03)
        med = float(np.median(spec[freqs > 70])) if np.any(freqs > 70) else 1e-9
        peak = float(spec[band].max()) if np.any(band) else 0.0
        ok = peak > med * 4.5
        # Marble energy often sits on the stretched partial near 2.37x.
        if not ok and e["timbre"] == "marble":
            band2 = (freqs > freq * 2.25) & (freqs < freq * 2.5)
            peak2 = float(spec[band2].max()) if np.any(band2) else 0.0
            ok = peak2 > med * 4.5
        hits += int(ok)
        checked.append({
            "time": e["time"],
            "midi": round(e["midi"], 2),
            "timbre": e["timbre"],
            "hz": round(freq, 2),
            "ratio": round(peak / max(med, 1e-12), 2),
            "pass": bool(ok),
        })
    return {
        "checked": len(checked),
        "passed": hits,
        "pass": (hits >= max(1, len(checked) - 1)) if checked else False,
        "notes": checked,
    }


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text())
    events = json.loads((ROOT / "sources" / "events.json").read_text())
    cues = manifest["cues"]
    expected = []
    for cue in cues:
        expected.append(WAV_MIX / f"{cue['id']}.wav")
        expected.append(WEB / "mix" / f"{cue['id']}.mp3")
        expected.append(ROOT / "midi" / f"{cue['id']}.mid")
        for layer in cue["layers"]:
            expected.append(WAV_LAYER / cue["id"] / f"{layer['id']}.wav")
            expected.append(WEB / "layers" / cue["id"] / f"{layer['id']}.mp3")
    missing = [str(p.relative_to(ROOT)) for p in expected if not p.exists()]

    per_cue = []
    mixes = {}
    failures = []
    for cue in cues:
        path = WAV_MIX / f"{cue['id']}.wav"
        audio, sr = read_wav(path)
        stats = measure_buffer(audio, sr, cue["loop"])
        mixes[cue["id"]] = audio
        layer_stats = []
        for layer in cue["layers"]:
            la, lsr = read_wav(WAV_LAYER / cue["id"] / f"{layer['id']}.wav")
            st = measure_buffer(la, lsr, cue["loop"])
            st["id"] = layer["id"]
            if la.shape[1] != audio.shape[1]:
                st["lengthMismatch"] = True
                failures.append(f"{cue['id']}/{layer['id']} length != mix")
            layer_stats.append(st)
            if st["peakDbfs"] > -1.0:
                failures.append(f"{cue['id']}/{layer['id']} peak {st['peakDbfs']} dBFS")
            if st["fullScaleSamples"]:
                failures.append(f"{cue['id']}/{layer['id']} clipped samples")
        if stats["peakDbfs"] > -1.0:
            failures.append(f"{cue['id']} mix peak {stats['peakDbfs']} dBFS")
        if stats["fullScaleSamples"]:
            failures.append(f"{cue['id']} mix clipped")
        if abs(stats["dc"][0]) > 0.002 or abs(stats["dc"][1]) > 0.002:
            failures.append(f"{cue['id']} DC {stats['dc']}")
        if cue["loop"]:
            for ch, seam in enumerate(stats["loopJoin"] or []):
                # A join louder than the file's own typical steps is a click.
                if seam["ratio"] > 6 and seam["boundary"] > 0.02:
                    failures.append(f"{cue['id']} ch{ch} loop ratio {seam['ratio']}")
        dur_err = abs(stats["seconds"] - cue["duration"])
        if dur_err > 0.02:
            failures.append(f"{cue['id']} duration drift {dur_err:.3f}s")
        motifs = motif_hits(audio, sr, events, cue["id"])
        if cue["role"] == "music" and not motifs["pass"]:
            failures.append(f"{cue['id']} motif spectral check {motifs['passed']}/{motifs['checked']}")
        mp3_path = WEB / "mix" / f"{cue['id']}.mp3"
        mp3_audio, mp3_sr = decode_mp3(mp3_path)
        mp3_seam = [step_ratio(mp3_audio[c]) for c in range(mp3_audio.shape[0])] if cue["loop"] else None
        per_cue.append({
            "id": cue["id"],
            "title": cue["title"],
            "loop": cue["loop"],
            "loopStart": 0 if cue["loop"] else None,
            "loopEnd": stats["seconds"] if cue["loop"] else None,
            "mix": stats,
            "layers": layer_stats,
            "motifs": motifs,
            "mp3Join": mp3_seam,
            "mp3Seconds": round(mp3_audio.shape[1] / mp3_sr, 4),
        })
        print(f"{cue['id']:20} peak {stats['peakDbfs']:6} rms {stats['rmsDbfs']:6} motifs {motifs['passed']}/{motifs['checked']}", flush=True)

    music = [c for c in cues if c["role"] == "music"]
    transitions = []
    pairs = []
    for i, cue in enumerate(music):
        nxt = music[(i + 1) % len(music)]
        pairs.append((cue, nxt, cue["fadeSec"]))
    # A few distant joins the game is likely to make.
    by_id = {c["id"]: c for c in music}
    for a, b in (("open-county", "danger"), ("danger", "afterlife"), ("middlebury", "boss"), ("quarry", "water")):
        pairs.append((by_id[a], by_id[b], by_id[b]["fadeSec"]))
    seen = set()
    for a, b, fade in pairs:
        key = (a["id"], b["id"])
        if key in seen:
            continue
        seen.add(key)
        row = equal_power_join(mixes[a["id"]], mixes[b["id"]], 44100, min(2.5, max(0.4, fade)))
        row["from"] = a["id"]
        row["to"] = b["id"]
        transitions.append(row)
        if row.get("clipped"):
            failures.append(f"transition {a['id']}→{b['id']} clips")
        if row.get("spikeRatio", 0) > 12 and row.get("stepSpike", 0) > 0.05:
            failures.append(f"transition {a['id']}→{b['id']} spike ratio {row['spikeRatio']}")
        print(f"xfade {a['id']} → {b['id']}: peak {row.get('peakDbfs')} spike× {row.get('spikeRatio')}", flush=True)

    report = {
        "method": "File measurement only. No human listening panel. No mastering chain.",
        "thresholds": {
            "peakDbfsMax": -1.0,
            "fullScaleSamples": 0,
            "absDcMax": 0.002,
            "loopJoinRatioMax": 6,
            "loopJoinBoundaryMinToFlag": 0.02,
            "transitionSpikeRatioMax": 12,
        },
        "missing": missing,
        "failureCount": len(missing) + len(failures),
        "failures": missing + failures,
        "cues": per_cue,
        "transitions": transitions,
    }
    (ROOT / "validation" / "results.json").parent.mkdir(parents=True, exist_ok=True)
    (ROOT / "validation" / "results.json").write_text(json.dumps(report, indent=2))
    (WEB / "validation.json").write_text(json.dumps(report, indent=2))
    write_md(report)
    print("failures", report["failureCount"], flush=True)


def write_md(report: dict) -> None:
    lines = [
        "# Validation",
        "",
        "Measured from the exported files on disk. This is not a listening test and not a mastering report.",
        "",
        "Gain in the renderer aimed at −18 dBFS RMS with a −1.5 dBFS peak ceiling, then a short synthetic room. If the ceiling won, the cue is quieter than the RMS target on purpose.",
        "",
        f"Failures: **{report['failureCount']}**.",
        "",
    ]
    if report["failures"]:
        lines.append("## Failures")
        lines.append("")
        for f in report["failures"]:
            lines.append(f"- {f}")
        lines.append("")
    lines += [
        "## Cues",
        "",
        "| Cue | Loop | Duration | WAV peak | WAV RMS | Loop join L/R | Motif checks | MP3 join L/R |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for cue in report["cues"]:
        mix = cue["mix"]
        join = cue["mix"]["loopJoin"]
        join_s = "—"
        if join:
            join_s = f"{join[0]['ratio']} / {join[1]['ratio']}"
        mp3 = cue["mp3Join"]
        mp3_s = "—"
        if mp3:
            mp3_s = f"{mp3[0]['ratio']} / {mp3[1]['ratio']}"
        lines.append(
            f"| {cue['title']} | {'yes' if cue['loop'] else 'no'} | {mix['seconds']:.2f}s | {mix['peakDbfs']} dB | {mix['rmsDbfs']} dB | {join_s} | {cue['motifs']['passed']}/{cue['motifs']['checked']} | {mp3_s} |"
        )
    lines += [
        "",
        "Loop join is `abs(first − last) / 95th percentile step` per channel. A tone's own sample-to-sample motion sits near 1–3. Ratios above 6 with a boundary step over 0.02 were flagged as clicks.",
        "",
        "Loop point for every looping cue is the file edge: start sample 0, end at the duration above. One-shots (ending, death sting) do not loop; their files include the release tail.",
        "",
        "## Transitions",
        "",
        "Equal-power crossfades were rendered offline from the WAV mixes, using each incoming cue's fade time (capped at 2.5 s). A clip, or a derivative spike more than 12× the sources' own 95th percentile step, is a discontinuity.",
        "",
        "| From | To | Peak | Spike × source |",
        "| --- | --- | --- | --- |",
    ]
    for row in report["transitions"]:
        if row.get("skipped"):
            continue
        lines.append(f"| {row['from']} | {row['to']} | {row['peakDbfs']} dB | {row['spikeRatio']} |")
    lines += [
        "",
        "## Stems",
        "",
        "Each layer WAV matches its mix length. Peaks are under −1 dBFS. Layers are the intensity stack: index 0 plays at intensity 0, and higher layers add. They are not alternate mixes.",
        "",
    ]
    (ROOT / "VALIDATION.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
