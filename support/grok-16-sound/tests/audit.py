"""Re-measure the rendered library. Fails if a cue is missing, clipped, or only described."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "synth"))

from measure import (  # noqa: E402
    analyze_file,
    correlation,
    envelope_peak_count,
    integrated_loudness,
    k_weight,
    read_wav,
)

REQUIRED_ZONES = {"town", "forest", "water", "quarry", "interior", "afterlife"}
REQUIRED_EVENTS = {
    "weapon.blade",
    "weapon.bow",
    "weapon.rod",
    "weapon.keg",
    "tool.shovel",
    "tool.sugar",
    "tool.hammer",
    "tool.net",
    "tool.lamp",
    "tool.warp",
    "tool.cape",
    "tool.boots",
    "tool.fins",
    "avatar.footstep",
    "avatar.death",
    "avatar.death.cross",
    "world.return",
    "afterlife.arrive",
    "boss.telegraph",
    "ui.error",
    "status.warn",
}


def calibration(sr: int = 44100) -> dict:
    n = sr * 4
    t = np.arange(n) / sr
    amplitude = 10 ** (-20 / 20)
    sine = amplitude * np.sin(2 * np.pi * 1000 * t)
    mean_square = float(np.mean(sine * sine))
    expected = -0.691 + 10 * np.log10(mean_square)
    weighted = k_weight(sine, sr)
    weighted_ms = float(np.mean(weighted * weighted))
    gain_db = 10 * np.log10((weighted_ms + 1e-20) / mean_square)
    measured = integrated_loudness(sine, sr)
    return {
        "expectedUngated": round(expected, 3),
        "kWeightGainDbAt1k": round(gain_db, 3),
        "measuredLufs": measured["lufs"],
        "mode": measured["mode"],
    }


def main() -> None:
    manifest_path = ROOT / "manifest" / "cues.json"
    failures: list[str] = []
    if not manifest_path.exists():
        raise SystemExit("manifest/cues.json is missing — render first")
    manifest = json.loads(manifest_path.read_text())
    cues = manifest["cues"]
    if len(cues) < 48:
        failures.append(f"cue count {len(cues)} < 48")

    music_dir = ROOT / "audio" / "music"
    if music_dir.exists() and any(music_dir.iterdir()):
        failures.append("music files are present; the score belongs to another session")

    seen_files = []
    zones = set()
    events = set()
    warnings = []
    variation_sets = 0
    centroids = {}
    measured_rows = []

    for cue in cues:
        events.add(cue["event"])
        if cue.get("event") == "ambience.zone":
            zones.add(cue.get("eventKey"))
        if cue.get("warning"):
            if not cue["warning"].get("kind") or not cue["warning"].get("copy"):
                failures.append(f"{cue['id']} warning has no visual kind and copy")
            warnings.append(cue["id"])
        else:
            # Important state changes that must not be audio-only are flagged on the cue.
            pass
        files = cue["files"]
        if len(files) >= 2:
            variation_sets += 1
        if len(files) >= 2:
            first = None
            for index, record in enumerate(files):
                audio, _sr = read_wav(ROOT / record["path"])
                if first is None:
                    first = audio
                elif index == 1:
                    corr = abs(correlation(first, audio))
                    if corr >= 0.93:
                        failures.append(f"{cue['id']} variants correlate at {corr:.3f}")
        for record in files:
            path = ROOT / record["path"]
            if not path.exists():
                failures.append(f"missing {record['path']}")
                continue
            fresh = analyze_file(path)
            seen_files.append(fresh)
            for key in ("peakDbfs", "rmsDbfs", "lufs", "truePeakDbfs", "durationMs", "onsetMs"):
                if abs(float(fresh[key]) - float(record[key])) > 0.05:
                    failures.append(
                        f"{record['path']} {key} manifest {record[key]} remeasured {fresh[key]}"
                    )
            if fresh["fullScaleHits"] != 0:
                failures.append(f"{record['path']} hit full scale {fresh['fullScaleHits']} times")
            if fresh["peakDbfs"] > -0.9:
                failures.append(f"{record['path']} peak {fresh['peakDbfs']} dBFS is too hot")
            if fresh["truePeakDbfs"] > -0.4:
                failures.append(f"{record['path']} true peak {fresh['truePeakDbfs']} dBTP")
            if abs(fresh["dc"]) > 0.02:
                failures.append(f"{record['path']} dc offset {fresh['dc']}")
            if fresh["sampleRate"] != 44100:
                failures.append(f"{record['path']} sample rate {fresh['sampleRate']}")
            if cue["loop"] and fresh["seamRatio"] > 6:
                failures.append(f"{record['path']} loop seam ratio {fresh['seamRatio']}")
            if cue["bus"] == "ambience":
                if fresh["channels"] != 2:
                    failures.append(f"{record['path']} ambience is not stereo")
                if not (11500 <= fresh["durationMs"] <= 12500):
                    failures.append(f"{record['path']} ambience duration {fresh['durationMs']}")
                if fresh["lufs"] > -22 or fresh["lufs"] < -40:
                    failures.append(f"{record['path']} ambience LUFS {fresh['lufs']} outside -40..-22")
            else:
                if fresh["channels"] != 1:
                    failures.append(f"{record['path']} effect is not mono")
                if fresh["peakDbfs"] < -36:
                    failures.append(f"{record['path']} is effectively silent at {fresh['peakDbfs']} dBFS")
            measured_rows.append({**fresh, "cue": cue["id"], "bus": cue["bus"], "loop": cue["loop"]})
        if cue["id"].startswith("step_"):
            centroids[cue["id"]] = files[0]["centroidHz"]

    if variation_sets < 8:
        failures.append(f"only {variation_sets} variation sets")
    if len(seen_files) < 48:
        failures.append(f"only {len(seen_files)} files")
    missing_zones = REQUIRED_ZONES - zones
    if missing_zones:
        failures.append(f"missing ambience zones {sorted(missing_zones)}")
    missing_events = REQUIRED_EVENTS - events
    if missing_events:
        failures.append(f"missing events {sorted(missing_events)}")

    if centroids:
        values = list(centroids.values())
        spread = max(values) - min(values)
        if spread < 200:
            failures.append(f"footstep centroids span only {spread:.0f} Hz")

    def cue_peak(cue_id: str) -> float:
        cue = next(item for item in cues if item["id"] == cue_id)
        return max(file["peakDbfs"] for file in cue["files"])

    order = ["powder_blast", "hurt_heavy", "step_grass", "ui_focus"]
    peaks = [cue_peak(item) for item in order]
    if not (peaks[0] > peaks[1] > peaks[2] > peaks[3]):
        failures.append(f"loudness hierarchy {dict(zip(order, peaks))} is not blast > hurt > step > focus")

    returns, sr = read_wav(ROOT / "audio" / "effects" / "return_years.wav")
    pulses = envelope_peak_count(returns, sr, 0.09)
    if pulses != 14:
        failures.append(f"return_years pulse count {pulses} != 14")

    lamp, _sr = read_wav(ROOT / "audio" / "effects" / "lamp_hum.wav")
    if not (1.9 <= lamp.shape[0] / sr <= 2.1):
        failures.append("lamp_hum is not a 2 second loop")

    cal = calibration()
    if abs(cal["kWeightGainDbAt1k"]) > 0.75:
        failures.append(f"K-weight at 1 kHz is {cal['kWeightGainDbAt1k']} dB, expected near 0")
    expected_measured = cal["expectedUngated"] + cal["kWeightGainDbAt1k"]
    if abs(cal["measuredLufs"] - expected_measured) > 0.35:
        failures.append(
            f"calibration LUFS {cal['measuredLufs']} != {expected_measured:.2f}"
        )

    by_id = {row["cue"]: row for row in measured_rows}
    summary = {
        "cues": len(cues),
        "files": len(seen_files),
        "variationSets": variation_sets,
        "warnings": warnings,
        "returnPulses": pulses,
        "calibration": cal,
        "hierarchyDbfs": dict(zip(order, peaks)),
        "footstepCentroidHz": centroids,
        "failures": failures,
        "passed": not failures,
    }
    out_dir = ROOT / "tests" / "results"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "audit.json").write_text(json.dumps({"summary": summary, "files": measured_rows}, indent=2) + "\n")
    report = render_report(manifest, summary, measured_rows)
    (ROOT / "REPORT.md").write_text(report)
    print(json.dumps(summary, indent=2))
    if failures:
        raise SystemExit(1)


def render_report(manifest: dict, summary: dict, rows: list[dict]) -> str:
    lines = [
        "# Preincarnation sound audit",
        "",
        "Numbers below were measured from the written 16-bit files by `tests/audit.py`.",
        "They are not estimates typed in by hand.",
        "",
        f"- Cues: {summary['cues']}",
        f"- Files: {summary['files']}",
        f"- Variation sets: {summary['variationSets']}",
        f"- Return cue pulses: {summary['returnPulses']}",
        f"- Result: {'pass' if summary['passed'] else 'fail'}",
        "",
        "## Calibration",
        "",
        "A 1 kHz sine at -20 dBFS peak has a known mean-square. K-weighting at 1 kHz should be about 0 dB.",
        "",
        f"- Expected ungated loudness before K-weight: {summary['calibration']['expectedUngated']} LU",
        f"- Measured K-weight gain at 1 kHz: {summary['calibration']['kWeightGainDbAt1k']} dB",
        f"- Measured integrated loudness: {summary['calibration']['measuredLufs']} LUFS ({summary['calibration']['mode']})",
        "",
        "## Hierarchy (sample peak, dBFS)",
        "",
        "| Cue | Peak |",
        "| --- | --- |",
    ]
    for cue_id, peak in summary["hierarchyDbfs"].items():
        lines.append(f"| {cue_id} | {peak} |")
    lines.extend(["", "## Failures", ""])
    if summary["failures"]:
        lines.extend(f"- {item}" for item in summary["failures"])
    else:
        lines.append("None.")
    lines.extend(
        [
            "",
            "## Files",
            "",
            "| File | Peak dBFS | True peak dBTP | RMS dBFS | LUFS | Mode | Onset ms | Seam |",
            "| --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
    )
    for row in rows:
        lines.append(
            f"| {row['file']} | {row['peakDbfs']} | {row['truePeakDbfs']} | {row['rmsDbfs']} | {row['lufs']} | {row['lufsMode']} | {row['onsetMs']} | {row['seamRatio']} |"
        )
    lines.extend(
        [
            "",
            "## Method",
            "",
            manifest["loudness"]["method"],
            "",
            "Loop seam ratio is the jump from the last sample back to the first, divided by the median absolute sample-to-sample difference. A seamless join sits near 1.",
            "",
        ]
    )
    return "\n".join(lines)


if __name__ == "__main__":
    main()
