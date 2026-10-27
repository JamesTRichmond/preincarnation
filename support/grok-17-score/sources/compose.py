#!/usr/bin/env python3
"""PREINCARNATION — Vein Score renderer.

Original synthesis mixes for twelve cues, plus the menu veil and death sting
the adaptive controller needs. Not a soundfont playback and not a mastered
master. Regeneration:

    python3 support/grok-17-score/sources/compose.py

Motifs (interval sets, semitones from a local tonic):
    ELLIS  [0, +3, +2, +7, +6]     return that refuses the last step
    VEIN   [0, -5, -10, -6]        four unrealized lives; the last leaps a tritone
    VOICE  [0, +2, -3]             one mythology, accepted telling
    OTHER  [0, -2, +3]             same mythology, inverted telling
"""

from __future__ import annotations

import json
import math
import random
import struct
import subprocess
import wave
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
WAV_MIX = ROOT / "audio" / "wav" / "mix"
WAV_LAYER = ROOT / "audio" / "wav" / "layers"
MP3_MIX = ROOT / "web" / "mix"
MP3_LAYER = ROOT / "web" / "layers"
MIDI_DIR = ROOT / "midi"
WEB = ROOT / "web"

# Canonical interval sets. Do not "improve" these without rewriting MOTIF-MAP.
ELLIS = [0, 3, 2, 7, 6]
VEIN = [0, -5, -10, -6]
VOICE = [0, 2, -3]
OTHER = [0, -2, 3]

ELLIS_WALK = [1.0, 1.5, 0.5, 2.0, 2.0]  # 7 beats, the limp
ELLIS_FAST = [0.5, 0.75, 0.25, 1.0, 1.0]  # danger diminution
ELLIS_LONG = [3.0, 4.5, 1.5, 6.0, 6.0]  # afterlife dilation
VOICE_LONG = [2.0, 2.0, 4.0]
VOICE_SHORT = [1.0, 1.0, 2.0]
OTHER_SHORT = [0.5, 0.5, 1.5]
VEIN_LONG = [4.0, 4.0, 4.0, 4.0]
VEIN_HALF = [2.0, 2.0, 2.0, 2.0]

NOTE_PC = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
}


def midi_name(token: str) -> int:
    pc = ""
    i = 0
    while i < len(token) and token[i].isalpha() or (i < len(token) and token[i] in "#b"):
        # letters then optional accidental
        break
    # split trailing octave, which may be negative
    for k in range(1, len(token)):
        if token[k] == "-" or token[k].isdigit():
            pc = token[:k]
            octave = int(token[k:])
            return (octave + 1) * 12 + NOTE_PC[pc]
    raise ValueError(token)


def hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def pan_gains(pan: float) -> tuple[float, float]:
    p = max(-1.0, min(1.0, pan))
    angle = (p + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


@dataclass
class Note:
    beat: float
    dur: float
    midi: float
    vel: float
    timbre: str
    pan: float
    layer: str


@dataclass
class Drone:
    midi: float
    amp: float
    pan: float
    layer: str
    partials: tuple[tuple[float, float], ...]
    vib: float = 0.0
    vib_rate: float = 0.0


@dataclass
class Piece:
    id: str
    title: str
    era: str  # familiar | later | return | utility
    group: str
    blurb: str
    bpm: float
    bars: int
    bpb: int = 4
    loop: bool = True
    fade: float = 2.4
    menu: str = "veil"  # veil | duck-only
    role: str = "music"  # music | sting | veil
    default_intensity: int = 1
    layers: list[tuple[str, int, str]] = field(default_factory=list)
    notes: list[Note] = field(default_factory=list)
    drones: list[Drone] = field(default_factory=list)
    rng: random.Random = field(default_factory=lambda: random.Random(1))

    def seconds(self) -> float:
        return self.bars * self.bpb * 60.0 / self.bpm

    def declare(self, name: str, intensity: int, label: str) -> None:
        self.layers.append((name, intensity, label))

    def drone(
        self,
        layer: str,
        midi: float,
        amp: float,
        pan: float = 0.0,
        partials: tuple[tuple[float, float], ...] | None = None,
        vib: float = 0.012,
        vib_rate: float = 0.18,
    ) -> None:
        if partials is None:
            partials = ((1.0, 0.62), (1.004, 0.38), (2.0, 0.14), (3.0, 0.05))
        self.drones.append(Drone(midi, amp, pan, layer, partials, vib, vib_rate))

    def n(
        self,
        layer: str,
        beat: float,
        dur: float,
        midi: float,
        vel: float,
        timbre: str,
        pan: float = 0.0,
        human: bool = True,
    ) -> None:
        if human:
            beat += self.rng.uniform(-0.018, 0.018)
            vel *= self.rng.uniform(0.97, 1.03)
        beat = max(0.0, beat)
        self.notes.append(Note(beat, dur, midi, vel, timbre, pan, layer))

    def motif(
        self,
        layer: str,
        intervals: list[int],
        rhythm: list[float],
        beat: float,
        tonic: float,
        vel: float,
        timbre: str,
        pan: float = 0.0,
        dur_scale: float = 0.92,
        count: int | None = None,
    ) -> None:
        k = min(len(intervals), len(rhythm)) if count is None else count
        t = beat
        for i in range(k):
            step = rhythm[i % len(rhythm)]
            self.n(layer, t, step * dur_scale, tonic + intervals[i % len(intervals)], vel, timbre, pan)
            t += step


BREATH = ((1.0, 0.62), (1.0035, 0.36), (2.0, 0.12), (3.0, 0.04))
BREATH_THIN = ((1.0, 0.7), (1.006, 0.22), (2.01, 0.08))


def env(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n, dtype=np.float32)
    na = min(n // 2, max(2, int(attack * SR)))
    nr = min(n // 2, max(2, int(release * SR)))
    e[:na] = np.linspace(0.0, 1.0, na, dtype=np.float32)
    e[-nr:] = np.linspace(1.0, 0.0, nr, dtype=np.float32)
    return e


def synth(note: Note, sr: int = SR) -> np.ndarray:
    dur = max(0.05, note.dur)
    n = int(dur * sr)
    t = np.arange(n, dtype=np.float32) / sr
    f = hz(note.midi)
    kind = note.timbre
    if kind == "marble":
        ratios = (1.0, 2.37, 2.79, 4.13, 5.48, 6.9)
        amps = (0.52, 0.26, 0.2, 0.11, 0.06, 0.035)
        decays = (1.7, 1.05, 0.8, 0.48, 0.32, 0.2)
        sig = np.zeros(n, dtype=np.float32)
        for r, a, d in zip(ratios, amps, decays):
            sig += np.float32(a) * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d).astype(np.float32)
        sig *= env(n, 0.006, 0.07)
        gain = 0.42
    elif kind == "dulcimer":
        sig = (
            np.sin(2 * np.pi * f * t)
            + 0.38 * np.sin(2 * np.pi * f * 2.003 * t) * np.exp(-t * 6.5)
            + 0.16 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 11.0)
        ).astype(np.float32)
        sig *= np.exp(-t * 1.35).astype(np.float32)
        click_n = min(n, 280)
        click = np.zeros(n, dtype=np.float32)
        burst = np.random.default_rng(int(note.midi * 1000 + note.beat * 17) & 0xFFFFFFFF).standard_normal(click_n).astype(np.float32)
        click[:click_n] = burst * np.exp(-np.arange(click_n, dtype=np.float32) / 45.0) * 0.18
        sig = (sig + click) * env(n, 0.004, 0.05)
        gain = 0.38
    elif kind == "bass":
        sig = (
            np.sin(2 * np.pi * f * t) * np.exp(-t * 0.85)
            + 0.45 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 2.4)
            + 0.12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 4.5)
        ).astype(np.float32)
        sig *= env(n, 0.01, 0.08)
        gain = 0.5
    elif kind == "pulse":
        # Stone heartbeat: pitch drop, not a drum sample.
        drop = f * (1.0 + 1.4 * np.exp(-t * 28.0))
        phase = 2 * np.pi * np.cumsum(drop) / sr
        sig = (np.sin(phase) * np.exp(-t * 8.0)).astype(np.float32)
        tick_n = min(n, 180)
        tick = np.zeros(n, dtype=np.float32)
        rng = np.random.default_rng(int(note.beat * 100 + note.midi) & 0xFFFFFFFF)
        tick[:tick_n] = rng.standard_normal(tick_n).astype(np.float32) * np.exp(-np.arange(tick_n) / 28.0) * 0.22
        sig = (sig + tick) * env(n, 0.003, 0.06)
        gain = 0.48
    elif kind in ("voice", "other"):
        other = kind == "other"
        vib_rate = 5.4 if other else 4.5
        vib_amt = 0.28 if other else 0.11
        det = 1.007 if other else 1.002
        harms = (1, 2, 3, 4, 5, 6)
        amps = (0.34, 0.22, 0.62, 0.3, 0.38, 0.12) if other else (0.72, 0.4, 0.22, 0.1, 0.05, 0.02)
        vib = vib_amt * np.sin(2 * np.pi * vib_rate * t)
        sig = np.zeros(n, dtype=np.float32)
        for h, a in zip(harms, amps):
            sig += np.float32(a) * np.sin(2 * np.pi * f * h * t + vib)
            sig += np.float32(a * 0.35) * np.sin(2 * np.pi * f * h * det * t + vib * 0.8)
        # Slow bloom. Still reaches exact 0 at both ends.
        bloom = np.clip(t / 0.18, 0, 1).astype(np.float32)
        sig *= bloom * env(n, 0.02, 0.12 if other else 0.16)
        gain = 0.26 if other else 0.28
    elif kind == "breath":
        vib = 0.08 * np.sin(2 * np.pi * 0.25 * t + note.midi)
        sig = (
            np.sin(2 * np.pi * f * t + vib)
            + 0.55 * np.sin(2 * np.pi * f * 1.004 * t + vib * 0.7)
            + 0.18 * np.sin(2 * np.pi * f * 2 * t)
        ).astype(np.float32)
        sig *= env(n, 0.08, 0.18)
        gain = 0.22
    else:
        raise ValueError(kind)
    peak = float(np.max(np.abs(sig))) or 1.0
    sig *= np.float32(note.vel * gain / peak)
    return sig


def write_drone(buf: np.ndarray, drone: Drone, n_loop: int) -> None:
    n = n_loop
    t = np.arange(n, dtype=np.float32) / SR
    base = hz(drone.midi)
    sig = np.zeros(n, dtype=np.float32)
    fv = 0.0
    if drone.vib and drone.vib_rate > 0:
        fv = round(drone.vib_rate * n / SR) * SR / n
    for ratio, amp in drone.partials:
        f = base * ratio
        if f < 28 or f > 14000:
            continue
        fl = round(f * n / SR) * SR / n
        if fl <= 0:
            continue
        phase = 2 * np.pi * fl * t
        if fv:
            phase = phase + drone.vib * np.sin(2 * np.pi * fv * t)
        sig += np.float32(amp) * np.sin(phase).astype(np.float32)
    scale = max(1e-6, float(np.max(np.abs(sig))))
    sig *= np.float32(drone.amp / scale)
    gL, gR = pan_gains(drone.pan)
    buf[0, :n] += sig * np.float32(gL)
    buf[1, :n] += sig * np.float32(gR)


def place(buf: np.ndarray, start: int, sig: np.ndarray, pan: float, wrap: bool) -> None:
    n = sig.shape[0]
    L = buf.shape[1]
    if n <= 0:
        return
    gL, gR = pan_gains(pan)
    left = sig * np.float32(gL)
    right = sig * np.float32(gR)
    if wrap:
        idx = (start + np.arange(n)) % L
        np.add.at(buf[0], idx, left)
        np.add.at(buf[1], idx, right)
    else:
        if start >= L:
            return
        end = min(L, start + n)
        k = end - start
        buf[0, start:end] += left[:k]
        buf[1, start:end] += right[:k]


def reverb_send(x: np.ndarray) -> np.ndarray:
    """Short marble-room taps. Linear, so a periodic input stays periodic."""
    n = x.shape[1]
    out = np.zeros_like(x)
    taps = (
        ((23, 0.34), (41, 0.26), (67, 0.18), (97, 0.12), (131, 0.08)),
        ((29, 0.34), (47, 0.26), (73, 0.18), (103, 0.12), (139, 0.08)),
    )
    for ch in (0, 1):
        acc = np.zeros(n, dtype=np.float32)
        src = x[ch]
        for ms, g in taps[ch]:
            d = int(SR * ms / 1000)
            if d < n:
                acc[d:] += np.float32(g) * src[:-d]
        d2 = int(SR * 0.083)
        if d2 < n:
            acc[d2:] += np.float32(0.22) * acc[:-d2]
        out[ch] = acc
    return out


def wet_loop(dry: np.ndarray) -> np.ndarray:
    twice = np.concatenate([dry, dry], axis=1)
    rev = reverb_send(twice)
    n = dry.shape[1]
    out = dry + 0.38 * rev[:, n : 2 * n]
    out -= out.mean(axis=1, keepdims=True)
    return out.astype(np.float32)


def wet_shot(dry: np.ndarray) -> np.ndarray:
    rev = reverb_send(dry)
    out = dry + 0.4 * rev
    out -= out.mean(axis=1, keepdims=True)
    return out.astype(np.float32)


def render_layers(piece: Piece) -> dict[str, np.ndarray]:
    musical = piece.seconds()
    if piece.loop:
        n = int(round(musical * SR))
        rendered: dict[str, np.ndarray] = {}
        by_layer: dict[str, list[Note]] = {name: [] for name, _, _ in piece.layers}
        for note in piece.notes:
            by_layer.setdefault(note.layer, []).append(note)
        drones: dict[str, list[Drone]] = {name: [] for name, _, _ in piece.layers}
        for d in piece.drones:
            drones.setdefault(d.layer, []).append(d)
        beat_s = 60.0 / piece.bpm
        for name, _, _ in piece.layers:
            dry = np.zeros((2, n), dtype=np.float32)
            for d in drones[name]:
                write_drone(dry, d, n)
            for note in by_layer[name]:
                start = int(round(note.beat * beat_s * SR))
                dur_s = max(0.05, note.dur * beat_s)
                # Keep releases inside the wrap model: synth already fades to 0.
                sig = synth(note_with_seconds(note, dur_s))
                place(dry, start % n, sig, note.pan, wrap=True)
            rendered[name] = wet_loop(dry)
            print(f"  layer {piece.id}/{name} {n / SR:.2f}s", flush=True)
        return rendered
    # One-shot: musical content plus a ring/reverb tail.
    tail = 5.0
    n = int(round((musical + tail) * SR))
    by_layer = {name: [] for name, _, _ in piece.layers}
    for note in piece.notes:
        by_layer.setdefault(note.layer, []).append(note)
    drones = {name: [] for name, _, _ in piece.layers}
    for d in piece.drones:
        drones.setdefault(d.layer, []).append(d)
    beat_s = 60.0 / piece.bpm
    rendered = {}
    for name, _, _ in piece.layers:
        dry = np.zeros((2, n), dtype=np.float32)
        # Drones on a one-shot are long faded notes, not periodic writers.
        for d in drones[name]:
            # Approximate the drone as a breath note across the musical span.
            fake = Note(0.2, piece.bars * piece.bpb - 0.4, d.midi, d.amp * 3.2, "breath", d.pan, name)
            sig = synth(note_with_seconds(fake, fake.dur * beat_s))
            place(dry, int(0.05 * SR), sig, d.pan, wrap=False)
        for note in by_layer[name]:
            start = int(round(note.beat * beat_s * SR))
            dur_s = max(0.05, note.dur * beat_s)
            sig = synth(note_with_seconds(note, dur_s))
            place(dry, start, sig, note.pan, wrap=False)
        rendered[name] = wet_shot(dry)
        print(f"  layer {piece.id}/{name} {n / SR:.2f}s (one-shot)", flush=True)
    return rendered


def note_with_seconds(note: Note, dur_s: float) -> Note:
    """Synth reads note.dur as seconds. Build a temporary with dur in seconds."""
    return Note(note.beat, dur_s, note.midi, note.vel, note.timbre, note.pan, note.layer)


def gain_stage(layers: dict[str, np.ndarray], order: list[str]) -> tuple[dict[str, np.ndarray], np.ndarray, dict]:
    mix = np.zeros_like(next(iter(layers.values())))
    for name in order:
        mix += layers[name]
    # Active RMS ignores a quiet tail on one-shots by using the whole file;
    # peak ceiling always wins if the RMS gain would clip.
    rms = float(np.sqrt(np.mean(np.square(mix, dtype=np.float64))))
    peak = float(np.max(np.abs(mix))) or 1e-9
    target_rms = 10 ** (-18.0 / 20.0)  # -18 dBFS
    ceiling = 10 ** (-1.5 / 20.0)  # -1.5 dBFS
    gain = target_rms / max(rms, 1e-9)
    limited = False
    if peak * gain > ceiling:
        gain = ceiling / peak
        limited = True
    # Stems must not clip either. Same gain, then verify.
    staged = {k: (v * np.float32(gain)) for k, v in layers.items()}
    mix = mix * np.float32(gain)
    stem_peak = max(float(np.max(np.abs(staged[k]))) for k in staged)
    if stem_peak > ceiling:
        trim = ceiling / stem_peak
        gain *= trim
        staged = {k: (v * np.float32(trim)) for k, v in staged.items()}
        mix = mix * np.float32(trim)
        limited = True
    info = {
        "gain": gain,
        "pre_rms_dbfs": 20 * math.log10(max(rms, 1e-12)),
        "pre_peak_dbfs": 20 * math.log10(max(peak, 1e-12)),
        "peak_limited": limited,
    }
    return staged, mix, info


def float_to_pcm(x: np.ndarray) -> np.ndarray:
    rng = np.random.default_rng(19)
    dither = (rng.random(x.shape) - rng.random(x.shape)).astype(np.float32) / np.float32(32768.0)
    y = np.clip(x + dither, -1.0, 1.0)
    return (y * 32767.0).astype(np.int16)


def write_wav(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = float_to_pcm(audio)
    interleaved = pcm.T.reshape(-1)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(interleaved.tobytes())


def encode_mp3(wav_path: Path, mp3_path: Path) -> None:
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(wav_path),
            "-c:a", "libmp3lame", "-b:a", "160k",
            str(mp3_path),
        ],
        check=True,
    )


def peaks_of(audio: np.ndarray, buckets: int = 180) -> list[float]:
    mono = np.max(np.abs(audio), axis=0)
    n = mono.shape[0]
    edges = np.linspace(0, n, buckets + 1).astype(int)
    out = []
    for i in range(buckets):
        a, b = edges[i], max(edges[i + 1], edges[i] + 1)
        out.append(round(float(np.max(mono[a:b])), 4))
    return out


# --- MIDI -------------------------------------------------------------------------

def vlq(n: int) -> bytes:
    buf = [n & 0x7F]
    n >>= 7
    while n:
        buf.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(buf))


def midi_track(events: list[tuple[int, bytes]]) -> bytes:
    events = sorted(events, key=lambda e: (e[0], e[1][0] if e[1] else 0))
    data = bytearray()
    last = 0
    for tick, payload in events:
        data += vlq(max(0, tick - last))
        data += payload
        last = tick
    if not events or events[-1][1] != b"\xFF\x2F\x00":
        data += vlq(0)
        data += b"\xFF\x2F\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data


GM = {
    "marble": 11,  # vibraphone — a hint, not the rendered timbre
    "dulcimer": 15,
    "breath": 89,
    "voice": 53,
    "other": 54,
    "pulse": 47,
    "bass": 32,
}


def write_midi(piece: Piece, path: Path) -> None:
    ppq = 480
    events_tempo: list[tuple[int, bytes]] = []
    name = piece.title.encode("ascii", "ignore")[:48] or b"cue"
    events_tempo.append((0, b"\xFF\x03" + bytes([len(name)]) + name))
    mpq = int(round(60_000_000 / piece.bpm))
    events_tempo.append((0, b"\xFF\x51\x03" + mpq.to_bytes(3, "big")))
    nn, dd = piece.bpb, 2  # quarter-note denominator
    events_tempo.append((0, bytes([0xFF, 0x58, 0x04, nn & 0xFF, dd, 24, 8])))
    end_tick = int(round(piece.bars * piece.bpb * ppq)) + ppq
    events_tempo.append((end_tick, b"\xFF\x2F\x00"))

    tracks = [midi_track(events_tempo)]
    layer_names = [name for name, _, _ in piece.layers]
    for layer, _, label in piece.layers:
        ev: list[tuple[int, bytes]] = []
        raw = label.encode("ascii", "ignore")[:40] or layer.encode()
        ev.append((0, b"\xFF\x03" + bytes([len(raw)]) + raw))
        # program change from the first note's timbre in the layer, else breath
        timbres = [n.timbre for n in piece.notes if n.layer == layer]
        program = GM.get(timbres[0] if timbres else "breath", 0)
        ev.append((0, bytes([0xC0, program & 0x7F])))
        for n in piece.notes:
            if n.layer != layer:
                continue
            on = int(round(n.beat * ppq))
            off = int(round((n.beat + max(0.05, n.dur * 0.95)) * ppq))
            if off <= on:
                off = on + 20
            note = int(round(n.midi))
            if note < 0 or note > 127:
                continue
            vel = max(1, min(127, int(round(n.vel * 100))))
            ev.append((on, bytes([0x90, note, vel])))
            ev.append((off, bytes([0x80, note, 0])))
        for d in piece.drones:
            if d.layer != layer:
                continue
            note = int(round(d.midi))
            if 0 <= note <= 127:
                ev.append((0, bytes([0x90, note, 40])))
                ev.append((int(piece.bars * piece.bpb * ppq), bytes([0x80, note, 0])))
        ev.append((end_tick, b"\xFF\x2F\x00"))
        tracks.append(midi_track(ev))

    path.parent.mkdir(parents=True, exist_ok=True)
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), ppq)
    path.write_bytes(header + b"".join(tracks))
    _ = layer_names


# --- Score ------------------------------------------------------------------------

def M(token: str) -> int:
    return midi_name(token)


def build_title() -> Piece:
    p = Piece(
        "title", "Title", "return", "The return",
        "All three motifs, none of them finished. The county has not started.",
        bpm=60, bars=16, fade=2.6, menu="duck-only", default_intensity=2,
        rng=random.Random(17),
    )
    p.declare("slab", 0, "Slab")
    p.declare("voice", 1, "Voice")
    p.declare("return", 2, "Return")
    p.drone("slab", M("D3"), 0.07, -0.15, BREATH, vib=0.01, vib_rate=0.15)
    p.drone("slab", M("A3"), 0.045, 0.2, BREATH_THIN, vib=0.008, vib_rate=0.12)
    # Vein, interior — bar 0 stays drone-only so the seam is the ground.
    for bar, token in ((1, "D3"), (2, "A2"), (3, "E3"), (4, "Bb2")):
        p.n("slab", bar * 4 + 0.15, 3.6, M(token), 0.62, "marble", -0.05)
    for bar, token in ((12, "D4"), (13, "A3"), (14, "E4")):
        p.n("slab", bar * 4 + 0.2, 3.2, M(token), 0.38, "marble", 0.1)
    # Voice, the accepted telling, unhurried.
    p.motif("voice", VOICE, VOICE_LONG, 5 * 4, M("A4"), 0.55, "voice", 0.35)
    p.motif("voice", VOICE, VOICE_LONG, 8 * 4, M("A4"), 0.42, "voice", 0.15)
    p.motif("voice", VOICE, [2, 2, 3], 12 * 4, M("C5"), 0.34, "voice", 0.45)
    # Ellis: a fragment early, the full limp later, an answer that does not land.
    p.motif("return", ELLIS, ELLIS_WALK, 2 * 4 + 1, M("D4"), 0.5, "dulcimer", -0.1, count=3)
    p.motif("return", ELLIS, ELLIS_WALK, 9 * 4, M("D4"), 0.66, "dulcimer", 0.0)
    p.n("return", 12 * 4 + 1, 1.6, M("G4"), 0.4, "dulcimer", -0.05)
    p.n("return", 12 * 4 + 2.8, 1.2, M("F4"), 0.36, "dulcimer", 0.0)
    p.n("return", 13 * 4 + 0.2, 1.4, M("D4"), 0.34, "dulcimer", 0.05)
    p.n("return", 13 * 4 + 1.8, 2.2, M("C4"), 0.3, "dulcimer", 0.0)
    return p


def build_middlebury() -> Piece:
    p = Piece(
        "middlebury", "Middlebury", "familiar", "Familiar county",
        "The town still walks. Ellis's limp is a civic melody, not a wound yet.",
        bpm=92, bars=32, fade=2.4, default_intensity=1, rng=random.Random(92),
    )
    p.declare("town", 0, "Town")
    p.declare("street", 1, "Street")
    p.declare("evening", 2, "Evening")
    p.drone("town", M("G2"), 0.075, -0.1, BREATH)
    p.drone("town", M("D3"), 0.04, 0.15, BREATH_THIN, vib=0.008)
    roots = [M("G2"), M("G2"), M("Bb2"), M("F2"), M("C3"), M("Eb2"), M("D2"), M("G2")]
    for bar in range(32):
        if bar == 31:
            continue
        root = M("Ab2") if bar == 21 else roots[bar % 8]
        p.n("town", bar * 4 + 0.02, 0.85, root, 0.46, "bass", -0.05)
        if bar % 8 not in (0, 7) and bar < 30:
            p.n("town", bar * 4 + 2, 0.7, root + 7, 0.28, "dulcimer", 0.05)
        # soft civic pulse, holes every 8th bar
        if bar % 8 != 7:
            p.n("town", bar * 4 + 0.02, 0.35, M("G2"), 0.22, "pulse", 0.0, human=False)
            if bar % 8 != 3:
                p.n("town", bar * 4 + 2, 0.3, M("D3"), 0.14, "pulse", 0.1, human=False)
        # visiting harmony swell, clear of the seam
        if bar % 8 == 3 and bar < 28:
            p.n("town", bar * 4, 5.5, root, 0.18, "breath", -0.3)
            p.n("town", bar * 4, 5.5, root + 3, 0.14, "breath", 0.0)
            p.n("town", bar * 4, 5.5, root + 7, 0.12, "breath", 0.35)
    p.motif("street", ELLIS, ELLIS_WALK, 0 * 4 + 1.0, M("G4"), 0.62, "dulcimer", -0.08)
    p.motif("street", VOICE, VOICE_LONG, 4 * 4 + 0.5, M("G4"), 0.4, "voice", 0.4)
    p.motif("street", ELLIS, ELLIS_WALK, 8 * 4 + 1.0, M("G4"), 0.58, "dulcimer", 0.0)
    # brighter welcome: last step up instead of the lean, once
    p.motif("street", ELLIS, ELLIS_WALK, 9 * 4 + 2.0, M("D5"), 0.28, "marble", 0.2, count=4)
    p.n("street", 10 * 4 + 1.5, 1.5, M("F5"), 0.24, "marble", 0.25)
    p.motif("street", VOICE, VOICE_SHORT, 12 * 4 + 0.5, M("D5"), 0.36, "voice", 0.3)
    p.motif("street", ELLIS, ELLIS_WALK, 16 * 4 + 1.0, M("G4"), 0.64, "dulcimer", -0.05)
    p.motif("street", VOICE, VOICE_LONG, 21 * 4, M("Ab4"), 0.34, "voice", 0.15)
    p.motif("street", ELLIS, ELLIS_WALK, 24 * 4 + 1.0, M("G4"), 0.6, "dulcimer", 0.0)
    p.motif("street", VOICE, VOICE_SHORT, 28 * 4 + 0.5, M("B4"), 0.3, "voice", 0.35)
    # Evening: unrealized lives above the roofs, sparse.
    vein_high = [M("D5"), M("A4"), M("E5"), M("Bb4")]
    for i, bar in enumerate((2, 6, 10, 14, 18, 22, 26)):
        p.n("evening", bar * 4 + 0.4, 2.4, vein_high[i % 4], 0.26, "marble", 0.45)
    return p


def build_open_county() -> Piece:
    p = Piece(
        "open-county", "Open county", "familiar", "Familiar county",
        "Long daylight. The limp crosses the fields; the leaning tone finds one field where it belongs.",
        bpm=80, bars=32, fade=2.8, default_intensity=1, rng=random.Random(80),
    )
    p.declare("bed", 0, "Bed")
    p.declare("path", 1, "Path")
    p.declare("weather", 2, "Weather")
    p.drone("bed", M("D2"), 0.08, -0.1, BREATH, vib=0.01, vib_rate=0.12)
    p.drone("bed", M("A2"), 0.045, 0.2, BREATH_THIN)
    roots = [M("D2"), M("F2"), M("C3"), M("G2"), M("Bb2"), M("A2"), M("G2"), M("D2"),
             M("D2"), M("Ab2"), M("C3"), M("G2"), M("Bb2"), M("A2"), M("G2"), M("D2")]
    for i, root in enumerate(roots):
        bar = i * 2
        if bar >= 30:
            p.n("bed", bar * 4 + 0.1, 6.5, M("D2"), 0.34, "bass", -0.1)
            break
        p.n("bed", bar * 4 + 0.1, 6.2, root, 0.4, "bass", -0.08)
        if i % 2 == 0 and bar not in (0, 28):
            p.n("bed", bar * 4 + 0.1, 5.5, root + 7, 0.16, "breath", 0.25)
            p.n("bed", bar * 4 + 0.1, 5.5, root + 3, 0.12, "breath", -0.2)
        if bar % 4 == 2 and bar < 30:
            p.n("bed", bar * 4 + 0.05, 0.4, M("D2"), 0.16, "pulse", 0.0, human=False)
    p.motif("path", ELLIS, ELLIS_WALK, 0 * 4 + 1.0, M("D4"), 0.6, "dulcimer", -0.05)
    p.motif("path", VOICE, VOICE_LONG, 4 * 4 + 0.5, M("A4"), 0.32, "voice", 0.55)
    p.motif("path", ELLIS, ELLIS_WALK, 8 * 4 + 1.0, M("A4"), 0.5, "dulcimer", 0.1)
    p.motif("path", VOICE, VOICE_SHORT, 12 * 4 + 1.0, M("F4"), 0.28, "voice", 0.4)
    # Over the Ab field the last three Ellis tones are consonant.
    p.motif("path", ELLIS, [2.0, 2.0, 3.0], 18 * 4, M("E4"), 0.48, "dulcimer", 0.0, count=3)
    p.motif("path", VOICE, VOICE_LONG, 20 * 4 + 0.5, M("Ab4"), 0.3, "voice", 0.35)
    p.motif("path", ELLIS, [1.5, 2.0, 0.75, 2.5, 2.5], 24 * 4 + 1.0, M("D4"), 0.58, "dulcimer", -0.08)
    p.motif("path", VOICE, VOICE_SHORT, 28 * 4 + 0.2, M("D4"), 0.26, "voice", 0.45)
    # Weather: a little motion, then rest. Not a constant arpeggio.
    for bar in (8, 9, 24, 25):
        root = roots[bar // 2]
        for k, iv in enumerate((0, 7, 3, 10)):
            p.n("weather", bar * 4 + k * 0.5, 0.42, root + 24 + iv, 0.16, "dulcimer", 0.3)
    p.motif("weather", VEIN, VEIN_HALF, 14 * 4, M("E5"), 0.22, "marble", 0.5)
    p.motif("weather", VEIN, VEIN_HALF, 22 * 4, M("B4"), 0.18, "marble", -0.35)
    return p


def build_high_woods() -> Piece:
    p = Piece(
        "high-woods", "High woods", "familiar", "Familiar county",
        "Thin canopy. Ellis never gets to the end of his own name up here.",
        bpm=74, bars=24, fade=3.0, default_intensity=1, rng=random.Random(74),
    )
    p.declare("bed", 0, "Bed")
    p.declare("canopy", 1, "Canopy")
    p.declare("memory", 2, "Memory")
    p.drone("bed", M("A3"), 0.055, 0.05, BREATH_THIN, vib=0.015, vib_rate=0.16)
    p.drone("bed", M("E4"), 0.03, 0.25, BREATH_THIN, vib=0.01, vib_rate=0.11)
    p.n("bed", 0 * 4 + 1.0, 3.0, M("A2"), 0.4, "marble", -0.2)
    p.n("bed", 12 * 4 + 1.0, 3.0, M("A2"), 0.28, "marble", -0.1)
    p.motif("canopy", VEIN, [4, 4, 4, 4], 2 * 4, M("E5"), 0.34, "marble", 0.4)
    p.motif("canopy", VEIN, [4, 4, 4, 4], 14 * 4, M("B4"), 0.28, "marble", 0.2)
    p.motif("memory", ELLIS, [1.5, 1.5, 2.0], 4 * 4, M("A4"), 0.42, "dulcimer", -0.15, count=3)
    p.motif("memory", ELLIS, [2.0, 2.0, 3.0], 11 * 4, M("E5"), 0.36, "voice", 0.2, count=3)
    # One quiet Other — the woods already know the second telling.
    p.motif("memory", OTHER, OTHER_SHORT, 8 * 4 + 0.5, M("Eb5"), 0.22, "other", -0.35)
    p.motif("memory", ELLIS, [1.5, 2.0, 2.0], 20 * 4, M("A4"), 0.3, "dulcimer", 0.0, count=3)
    return p


def build_water() -> Piece:
    p = Piece(
        "water", "Water", "familiar", "Familiar county",
        "Five beats, like a current that will not square itself. The deep current is Ellis, slowed.",
        bpm=68, bars=16, bpb=5, fade=2.8, default_intensity=1, rng=random.Random(68),
    )
    p.declare("bed", 0, "Bed")
    p.declare("surface", 1, "Surface")
    p.declare("depth", 2, "Depth")
    p.drone("bed", M("F2"), 0.08, -0.1, BREATH, vib=0.01, vib_rate=0.14)
    p.drone("bed", M("C3"), 0.04, 0.2, BREATH_THIN)
    vein_f = [M(x) for x in ("F3", "C3", "G2", "Bb2")]
    for bar in range(16):
        p.n("bed", bar * 5 + 0.05, 2.1, vein_f[bar % 4], 0.42, "dulcimer", -0.05)
        if bar not in (0, 15) and bar % 2 == 0:
            p.n("bed", bar * 5 + 3.0, 1.2, vein_f[bar % 4] + 7, 0.16, "marble", 0.25)
    p.motif("surface", VOICE, VOICE_LONG, 1 * 5, M("C5"), 0.4, "voice", 0.4)
    p.motif("surface", VOICE, VOICE_LONG, 5 * 5, M("A4"), 0.34, "voice", 0.2)
    p.motif("surface", VOICE, VOICE_LONG, 9 * 5, M("Ab4"), 0.32, "voice", 0.45)
    p.motif("surface", VOICE, [2, 2, 3], 13 * 5, M("C5"), 0.3, "voice", 0.15)
    # Depth: Ellis, one note per bar. Second statement is the future Ab life.
    slow = [4.6, 4.6, 4.6, 4.6, 4.6]
    p.motif("depth", ELLIS, slow, 3 * 5, M("F3"), 0.4, "bass", -0.15, dur_scale=0.9)
    p.motif("depth", ELLIS, slow, 10 * 5, M("Ab3"), 0.32, "dulcimer", 0.1, dur_scale=0.85)
    return p


def build_quarry() -> Piece:
    p = Piece(
        "quarry", "Quarry", "later", "Later county",
        "The vein is cut open for stone. Labor takes the limp's rhythm. Ellis is only a fragment in the gallery.",
        bpm=108, bars=32, fade=1.6, default_intensity=1, rng=random.Random(108),
    )
    p.declare("bed", 0, "Bed")
    p.declare("cut", 1, "Cut")
    p.declare("gallery", 2, "Gallery")
    p.drone("bed", M("E2"), 0.07, -0.05, BREATH, vib=0.008, vib_rate=0.1)
    p.drone("bed", M("B2"), 0.035, 0.15, BREATH_THIN)
    for bar in range(32):
        if bar == 31:
            continue
        if 16 <= bar <= 23:
            offsets = (0.02, 2.5)
        else:
            offsets = (0.02, 1.0, 1.5, 2.5)
        for j, off in enumerate(offsets):
            vel = 0.4 if j == 0 else 0.26
            p.n("bed", bar * 4 + off, 0.28, M("E2") if j % 2 == 0 else M("B2"), vel, "pulse", 0.0, human=False)
    for bar in (0, 8, 16, 24):
        p.motif("cut", VEIN, VEIN_HALF, bar * 4 + 0.05, M("E4"), 0.58, "marble", 0.05)
        p.motif("cut", VEIN, VEIN_HALF, bar * 4 + 0.05, M("E3"), 0.34, "bass", -0.1)
    p.motif("cut", ELLIS, [1.0, 1.0, 1.5], 28 * 4 + 0.5, M("E3"), 0.26, "dulcimer", -0.2, count=3)
    for bar, pan in ((4, 0.45), (12, -0.4), (20, 0.35), (28, -0.2)):
        p.motif("gallery", OTHER, OTHER_SHORT, bar * 4 + 0.4, M("Bb4"), 0.36, "other", pan)
    return p


def build_dungeon() -> Piece:
    p = Piece(
        "ordinary-dungeon", "Ordinary dungeon", "later", "Later county",
        "A small confined rocking. The other telling lives here. Pressure comes in short spells, then leaves.",
        bpm=64, bars=24, fade=2.2, default_intensity=1, rng=random.Random(64),
    )
    p.declare("bed", 0, "Bed")
    p.declare("leak", 1, "Leak")
    p.declare("pressure", 2, "Pressure")
    p.drone("bed", M("Bb2"), 0.07, -0.1, BREATH, vib=0.01, vib_rate=0.1)
    p.drone("bed", M("F3"), 0.035, 0.15, BREATH_THIN)
    cycle = [M("Bb2"), M("C3"), M("Ab2")]
    beat = 0.0
    total = 24 * 4
    k = 0
    while beat < total - 3:
        p.n("bed", beat + 0.04, 2.15, cycle[k % 3], 0.34, "dulcimer", -0.05 if k % 2 == 0 else 0.08)
        beat += 3
        k += 1
    for i, beat0 in enumerate((6, 30, 54, 78)):
        p.motif("leak", OTHER, VOICE_SHORT, beat0, M("F4"), 0.4, "other", 0.4 if i % 2 == 0 else -0.4)
    for bar in list(range(8, 12)) + list(range(16, 20)):
        if bar in (8, 10, 16, 18):
            p.n("pressure", bar * 4 + 0.02, 0.3, M("Bb2"), 0.36, "pulse", 0.0, human=False)
            p.n("pressure", bar * 4 + 2.5, 0.25, M("F2"), 0.24, "pulse", 0.0, human=False)
    p.motif("pressure", ELLIS, [0.5, 0.5, 0.5, 0.5, 0.5], 9 * 4, M("Bb3"), 0.48, "dulcimer", 0.0)
    p.motif("pressure", ELLIS, [0.5, 0.5, 0.5, 0.5, 0.5], 17 * 4 + 0.5, M("Bb3"), 0.44, "dulcimer", 0.05)
    return p


def build_danger() -> Piece:
    p = Piece(
        "danger", "Danger", "later", "Later county",
        "The limp becomes the fight. Holes are written into the loop so it can run without sanding the ear down.",
        bpm=120, bars=32, fade=0.7, default_intensity=1, rng=random.Random(120),
    )
    p.declare("alert", 0, "Alert")
    p.declare("engaged", 1, "Engaged")
    p.declare("crisis", 2, "Crisis")
    p.drone("alert", M("E2"), 0.06, 0.0, BREATH, vib=0.006, vib_rate=0.08)
    p.drone("alert", M("B2"), 0.03, 0.1, BREATH_THIN, vib=0.004, vib_rate=0.08)
    riff_bars = {0, 1, 2, 3, 6, 8, 10, 12, 13, 14, 16, 17, 18, 19, 22, 24, 26, 29}
    for bar in range(31):
        if bar == 15:
            continue
        p.n("alert", bar * 4 + 0.02, 0.22, M("E2"), 0.42, "pulse", 0.0, human=False)
        p.n("alert", bar * 4 + 1.5, 0.18, M("B2"), 0.24, "pulse", 0.05, human=False)
        if bar in riff_bars:
            tonic = M("F4") if 16 <= bar <= 19 else M("E4")
            count = 5
            if bar in (8, 10, 29):
                count = 3
            p.motif("alert", ELLIS, ELLIS_FAST, bar * 4 + 0.02, tonic, 0.55, "dulcimer", -0.08, dur_scale=0.9, count=count)
        if bar in (25, 27):
            p.motif("alert", ELLIS, ELLIS_FAST, bar * 4 + 0.02, M("Bb4"), 0.4, "dulcimer", 0.15, dur_scale=0.9, count=4)
    for bar in (4, 6, 12, 14, 20, 22, 25, 27):
        p.n("engaged", bar * 4 + 0.02, 0.7, M("E4"), 0.4, "marble", -0.2)
        p.n("engaged", bar * 4 + 0.02, 0.7, M("Bb3"), 0.36, "marble", 0.25)
    for bar in range(16, 24):
        p.n("engaged", bar * 4 + 0.1, 0.8, M("E2") + (bar % 4) * 2, 0.32, "bass", -0.1)
    p.motif("crisis", OTHER, [2, 2, 4, 2, 2, 4], 16 * 4, M("Bb4"), 0.34, "other", 0.4, count=6)
    for bar in range(24, 30):
        p.motif("crisis", ELLIS, ELLIS_FAST, bar * 4 + 0.02, M("E5"), 0.22, "marble", 0.3, dur_scale=0.88, count=3)
    return p


def build_boss() -> Piece:
    p = Piece(
        "boss", "Boss", "later", "Later county",
        "Voice and Other Voice at once: one mythology, split. Ellis arrives late, under them.",
        bpm=114, bars=32, fade=0.85, default_intensity=2, rng=random.Random(114),
    )
    p.declare("bed", 0, "Bed")
    p.declare("challenge", 1, "Challenge")
    p.declare("crisis", 2, "Crisis")
    p.drone("bed", M("B2"), 0.065, -0.05, BREATH, vib=0.008, vib_rate=0.09)
    p.drone("bed", M("F#2"), 0.035, 0.12, BREATH_THIN)
    for bar in range(31):
        degree = VEIN[bar % 4]
        p.n("bed", bar * 4 + 0.04, 3.1, M("B2") + degree, 0.48, "bass", -0.1)
        if bar % 2 == 0 and bar not in (0, 30):
            p.n("bed", bar * 4 + 0.02, 0.25, M("B1"), 0.3, "pulse", 0.0, human=False)
    # Call, then both.
    p.motif("challenge", VOICE, VOICE_LONG, 1 * 4, M("D5"), 0.48, "voice", -0.25)
    p.motif("challenge", OTHER, VOICE_SHORT, 5 * 4, M("G4"), 0.46, "other", 0.35)
    p.motif("challenge", VOICE, VOICE_LONG, 9 * 4, M("E5"), 0.44, "voice", -0.2)
    p.motif("challenge", OTHER, [1, 1, 2, 1, 1, 2], 9 * 4 + 1.0, M("A4"), 0.36, "other", 0.4, count=6)
    p.motif("challenge", VOICE, VOICE_LONG, 17 * 4, M("F5"), 0.4, "voice", -0.15)
    p.motif("challenge", OTHER, VOICE_SHORT, 19 * 4, M("Bb4"), 0.38, "other", 0.3)
    p.motif("challenge", VOICE, [2, 2, 3], 25 * 4, M("D5"), 0.36, "voice", 0.0)
    p.motif("challenge", OTHER, OTHER_SHORT, 27 * 4, M("Ab4"), 0.34, "other", 0.2)
    for bar in (8, 12, 18, 22, 26):
        p.motif("crisis", ELLIS, ELLIS_FAST, bar * 4 + 0.05, M("B4"), 0.5, "dulcimer", 0.0, dur_scale=0.9)
    return p


def build_afterlife() -> Piece:
    p = Piece(
        "afterlife", "Afterlife", "return", "The return",
        "The four lives sound together, then peel away. Ellis is stretched until he is almost only a tone.",
        bpm=44, bars=16, fade=3.6, menu="veil", default_intensity=1, rng=random.Random(44),
    )
    p.declare("drift", 0, "Drift")
    p.declare("memory", 1, "Memory")
    p.declare("pings", 2, "Unnamed")
    p.drone("drift", M("D3"), 0.06, -0.1, BREATH, vib=0.014, vib_rate=0.1)
    p.drone("drift", M("A3"), 0.032, 0.18, BREATH_THIN, vib=0.01, vib_rate=0.08)
    # Gather, then stop striking. Overlap is the chord of stored lives.
    p.n("drift", 0 * 4 + 1.0, 18, M("D3"), 0.5, "marble", -0.15)
    p.n("drift", 2 * 4, 14, M("A2"), 0.42, "marble", -0.05)
    p.n("drift", 4 * 4, 10, M("E3"), 0.4, "marble", 0.1)
    p.n("drift", 6 * 4, 7, M("Bb2"), 0.38, "marble", 0.2)
    p.motif("memory", ELLIS, ELLIS_LONG, 1 * 4, M("D5"), 0.42, "voice", 0.05, dur_scale=0.96)
    p.motif("memory", VOICE, VOICE_LONG, 9 * 4, M("A4"), 0.36, "voice", -0.2)
    p.motif("memory", OTHER, VOICE_LONG, 12 * 4, M("Eb5"), 0.3, "other", 0.35)
    for bar, token in ((3, "F#6"), (7, "C6"), (11, "G5"), (14, "E6")):
        p.n("pings", bar * 4 + 0.8, 2.2, M(token), 0.2, "marble", 0.4)
    return p


def build_reincarnation() -> Piece:
    p = Piece(
        "reincarnation", "Reincarnation", "return", "The return",
        "The old leaning-tone is the new tonic. The motif reassembles from its own last note. The two voices meet.",
        bpm=72, bars=24, fade=3.2, menu="veil", default_intensity=2, rng=random.Random(72),
    )
    p.declare("bed", 0, "Bed")
    p.declare("becoming", 1, "Becoming")
    p.declare("union", 2, "Union")
    p.drone("bed", M("Ab2"), 0.075, -0.08, BREATH, vib=0.01, vib_rate=0.12)
    p.drone("bed", M("Eb3"), 0.04, 0.16, BREATH_THIN)
    # Major third blooms only in the middle, so the seam stays the open fifth — the cycle resets.
    p.n("bed", 8 * 4, 13 * 4, M("C4"), 0.16, "breath", 0.0)
    # Assembly from the wound (D, the old tonic) toward the full new Ellis.
    p.n("becoming", 0 * 4 + 1.0, 2.6, M("D4"), 0.55, "marble", 0.0)
    p.n("becoming", 2 * 4 + 0.5, 2.4, M("D4"), 0.4, "marble", 0.1)
    p.motif("becoming", ELLIS, [2.0, 2.2], 4 * 4, M("Eb4"), 0.48, "dulcimer", -0.05, count=2)
    # last three of Ellis-in-Ab: Bb Eb D, which are intervals 2, 7, 6 from Ab — use the tail.
    p.n("becoming", 8 * 4, 1.4, M("Bb4"), 0.46, "dulcimer", 0.0)
    p.n("becoming", 8 * 4 + 1.6, 1.8, M("Eb5"), 0.44, "dulcimer", 0.05)
    p.n("becoming", 8 * 4 + 3.6, 2.2, M("D5"), 0.42, "marble", 0.1)
    p.motif("becoming", ELLIS, ELLIS_WALK, 12 * 4 + 0.5, M("Ab4"), 0.62, "voice", -0.05)
    p.motif("becoming", ELLIS, ELLIS_WALK, 16 * 4 + 0.5, M("Ab4"), 0.58, "dulcimer", 0.05)
    # Convergence: major 2nd, minor 2nd, unison on the new major third.
    p.n("becoming", 20 * 4, 1.8, M("C5"), 0.4, "voice", -0.25)
    p.n("becoming", 20 * 4, 1.8, M("D5"), 0.36, "other", 0.3)
    p.n("becoming", 21 * 4, 1.8, M("Db5"), 0.38, "voice", -0.2)
    p.n("becoming", 21 * 4, 1.8, M("D5"), 0.34, "other", 0.25)
    p.n("becoming", 22 * 4, 3.2, M("C5"), 0.42, "voice", -0.05)
    p.n("becoming", 22 * 4, 3.2, M("C5"), 0.36, "other", 0.08)
    p.motif("union", ELLIS, ELLIS_WALK, 12 * 4 + 0.5, M("Ab5"), 0.2, "marble", 0.35)
    p.n("union", 16 * 4, 10, M("Ab5"), 0.12, "breath", 0.4)
    p.n("union", 16 * 4, 10, M("Eb5"), 0.1, "breath", -0.3)
    return p


def build_ending() -> Piece:
    p = Piece(
        "ending", "Ending", "return", "The return",
        "Ellis's minor second finally steps on, to G. One vein is left unfinished. Not a triumph.",
        bpm=54, bars=22, loop=False, fade=3.4, menu="duck-only", default_intensity=2,
        rng=random.Random(54),
    )
    p.declare("ground", 0, "Ground")
    p.declare("myth", 1, "Myth")
    p.declare("return", 2, "Return")
    p.n("ground", 0.2, 58, M("D2"), 0.5, "breath", -0.1, human=False)
    p.n("ground", 0.2, 58, M("A2"), 0.28, "breath", 0.15, human=False)
    p.n("ground", 13 * 4, 28, M("G2"), 0.55, "bass", -0.05, human=False)
    p.n("ground", 13 * 4, 26, M("D3"), 0.22, "breath", 0.1, human=False)
    # Vein, then a second vein that does not finish.
    p.motif("ground", VEIN, VEIN_LONG, 4 * 4, M("D3"), 0.5, "marble", 0.0)
    p.n("ground", 20 * 4, 3.2, M("D3"), 0.42, "marble", -0.1)
    p.n("ground", 21 * 4, 2.6, M("A2"), 0.36, "marble", 0.05)
    p.motif("myth", VOICE, VOICE_LONG, 8 * 4, M("A4"), 0.42, "voice", -0.2)
    p.motif("myth", OTHER, VOICE_LONG, 10 * 4, M("Eb5"), 0.32, "other", 0.3)
    p.motif("myth", VOICE, VOICE_LONG, 16 * 4, M("B4"), 0.36, "voice", 0.05)
    # Full Ellis, unresolved.
    p.motif("return", ELLIS, ELLIS_WALK, 1 * 4, M("D4"), 0.6, "dulcimer", 0.0)
    # Ellis again, but the last step continues down to G (major 2nd past the lean).
    p.motif("return", ELLIS, ELLIS_WALK, 13 * 4, M("D4"), 0.58, "dulcimer", -0.05, count=4)
    p.n("return", 13 * 4 + 5.2, 2.4, M("G4"), 0.56, "dulcimer", 0.0)
    # Greeting in the new home: first three of Ellis on G, no leaning tone after.
    p.motif("return", ELLIS, [1.2, 1.6, 2.4], 18 * 4, M("G4"), 0.4, "voice", 0.1, count=3)
    return p


def build_menu() -> Piece:
    p = Piece(
        "menu-veil", "Menu veil", "utility", "Utility",
        "A thin Voice-colored air for when a menu ducks the county. Not a thirteenth piece of drama.",
        bpm=56, bars=8, fade=0.6, menu="duck-only", role="veil", default_intensity=0,
        rng=random.Random(56),
    )
    p.declare("veil", 0, "Veil")
    p.drone("veil", M("D3"), 0.05, 0.0, BREATH_THIN, vib=0.012, vib_rate=0.12)
    p.drone("veil", M("A3"), 0.028, 0.2, BREATH_THIN, vib=0.008, vib_rate=0.1)
    p.motif("veil", VOICE, VOICE_LONG, 1 * 4, M("A4"), 0.28, "breath", 0.15)
    p.motif("veil", VOICE, [2, 2, 3], 5 * 4, M("F4"), 0.22, "breath", -0.1)
    return p


def build_death() -> Piece:
    p = Piece(
        "death-sting", "Death sting", "utility", "Utility",
        "The unresolved minor second struck as one stone, then Ellis backwards, then a low D that stops.",
        bpm=60, bars=2, loop=False, fade=0.12, menu="duck-only", role="sting", default_intensity=0,
        rng=random.Random(7),
    )
    p.declare("sting", 0, "Sting")
    p.n("sting", 0.02, 1.4, M("A4"), 0.8, "marble", -0.1, human=False)
    p.n("sting", 0.02, 1.6, M("Ab4"), 0.75, "marble", 0.15, human=False)
    # Reverse the limp: A, E, F, D — the phrase unwinds. (Ellis in D was D F E A Ab.)
    for beat, token, vel in (
        (0.7, "A4", 0.55),
        (1.15, "E4", 0.48),
        (1.75, "F4", 0.42),
        (2.5, "D4", 0.5),
    ):
        p.n("sting", beat, 0.7, M(token), vel, "dulcimer", 0.0, human=False)
    p.n("sting", 3.1, 2.6, M("D2"), 0.7, "bass", 0.0, human=False)
    p.n("sting", 3.1, 2.8, M("D3"), 0.25, "breath", 0.0, human=False)
    return p


def all_pieces() -> list[Piece]:
    return [
        build_title(),
        build_middlebury(),
        build_open_county(),
        build_high_woods(),
        build_water(),
        build_quarry(),
        build_dungeon(),
        build_danger(),
        build_boss(),
        build_afterlife(),
        build_reincarnation(),
        build_ending(),
        build_menu(),
        build_death(),
    ]


def piece_to_manifest(piece: Piece, duration: float, mix_peaks: list[float], layer_peaks: dict[str, list[float]], gain_info: dict) -> dict:
    return {
        "id": piece.id,
        "title": piece.title,
        "era": piece.era,
        "group": piece.group,
        "blurb": piece.blurb,
        "role": piece.role,
        "bpm": piece.bpm,
        "bars": piece.bars,
        "meter": [piece.bpb, 4],
        "loop": piece.loop,
        "fadeSec": piece.fade,
        "menu": piece.menu,
        "defaultIntensity": piece.default_intensity,
        "duration": round(duration, 4),
        "loopStart": 0,
        "loopEnd": round(duration, 4) if piece.loop else None,
        "mix": f"mix/{piece.id}.mp3",
        "wavMix": f"../audio/wav/mix/{piece.id}.wav",
        "peaks": mix_peaks,
        "gain": gain_info,
        "layers": [
            {
                "id": name,
                "intensity": intensity,
                "label": label,
                "file": f"layers/{piece.id}/{name}.mp3",
                "peaks": layer_peaks[name],
            }
            for name, intensity, label in piece.layers
        ],
    }


def events_dump(piece: Piece) -> list[dict]:
    beat_s = 60.0 / piece.bpm
    rows = []
    for n in piece.notes:
        rows.append({
            "piece": piece.id,
            "layer": n.layer,
            "time": round(n.beat * beat_s, 4),
            "dur": round(n.dur * beat_s, 4),
            "midi": n.midi,
            "vel": round(n.vel, 4),
            "timbre": n.timbre,
            "pan": round(n.pan, 3),
        })
    return rows


def write_motif_map() -> None:
    text = """# Motif map — PREINCARNATION

Original interval sets. They are not quotations. Pitch examples are one stating of the set, not the only legal key.

## Ellis — the return

Intervals from a local tonic: **0, +3, +2, +7, +6**.

The last move is a minor second down. The phrase almost arrives and then leans off the note it was owed. That lean is fourteen years.

Rhythm in the familiar county (beats): `1, 1.5, 0.5, 2, 2`. The long-short limp.

| World | What happens to Ellis |
| --- | --- |
| Familiar county | Full phrase, walking tempo, dulcimer. In Middlebury the tonic is G (`G Bb A D Db`). In the open county one statement sits on an A-flat field so the leaning tone is briefly a root, not an ache. High woods only ever gets the first three notes. Water stretches him to one note per bar; the second statement is already the future A-flat life. |
| Later county | Quarry buries a three-note fragment. The ordinary dungeon compresses him into straight eighths, and only inside the pressure layer, in two short spells. Danger divides the rhythm by two (`0.5, 0.75, 0.25, 1, 1`) and makes that the fight. The boss withholds him until the loop is already underway. |
| Afterlife and return | Afterlife multiplies the rhythm by three and gives the phrase to the voice timbre. Reincarnation's new tonic is the old leaning tone: Ellis-in-D ended on A-flat, so reincarnation is in A-flat and begins from D — the old tonic, now the new ache (`Ab C Bb Eb D`). The ending plays the phrase once unresolved, then lets the minor second step again, down to G. Home is beside the old home. |

## Vein — unrealized lives

Intervals: **0, −5, −10, −6**. Three descending fourths would be neat. The last note refuses and rises a tritone instead.

| World | What happens to the Vein |
| --- | --- |
| Familiar county | Slow marble single tones under the town and the fields. High woods rings it in the canopy, twice, then stops. Water uses it as the five-beat current, one life per bar. |
| Later county | The quarry puts it in the foreground, doubled in the bass, four times. The tritone is the cut. Danger and the boss turn that tritone into stabs and a bass cycle. |
| Afterlife and return | Afterlife strikes all four and lets them overlap — stored at once — then peels them. The ending starts a vein and stops after two notes. One life stays unrealized. |

## Voice and Other Voice — one mythology

Voice: **0, +2, −3**. A step up, then a fourth down. Long notes.

Other Voice: **0, −2, +3**. The same two intervals, inverted. Shorter, a little more brittle, detuned partials in the synth.

They are not two stories. They are two readings.

| World | Who speaks |
| --- | --- |
| Familiar county | Voice only, distant, often panned off center. One exception: a single quiet Other phrase in the high woods, so the second reading exists before anyone is ready for it. |
| Later county | The dungeon leaks Other Voice on a three-beat rocking bed. Danger holds Other as a long warning in the second half of the loop. The boss states Voice, answers with Other, then runs them together. |
| Afterlife and return | Afterlife lets Voice finish, then Other, same slow rhythm — a conversation, not a collision. Reincarnation starts them a major second apart, moves to a minor second, and lands in unison on C, the major third of the new A-flat life. The ending hears both readings peacefully, then leaves Ellis to step toward G. |

## Eras of the county, as harmony

The score does not depict six dated maps. It depicts three musical climates the six eras pass through:

- **Familiar** — open fifth drones, daylight register, Voice consonant or nearly so, loops with long rests.
- **Later** — compressed rhythm, the tritone exposed, Other Voice present, loops that still contain written valleys (empty bars, dropped hits) so a long fight does not become a short loop in disguise.
- **Return** — dilation, simultaneous lives, then a new tonic. The ending is the only cue that does not loop.

## Loop and layer contract

Exploration and dungeon cues are vertical layers on one horizontal loop. Layer 0 is a complete bed. Higher layers add path, weather, leak, or pressure. They are the same length, the same tempo, and are meant to sum. Intensity does not jump to a different piece.

Seam rule used by the renderer: every looping cue has a periodic ground drone (loop-locked partials) across the join, and gestures end before the last bar or wrap as adjacent samples with envelopes that reach zero. Reverb is applied to two copies of the dry loop and the second copy is kept, so the room tone is in steady state.

## Utility cues (not part of the twelve)

- **Menu veil** — quiet Voice-shaped breath. The controller ducks gameplay under a menu and fades this in, except on Title and Ending, which only duck.
- **Death sting** — A and A-flat struck together (the unresolved second), then the Ellis phrase unwound backwards, then a low D. Musical interruption only. No scream, no impact effect owned by the sound-effects session.
"""
    (ROOT / "MOTIF-MAP.md").write_text(text)


def write_engine_note() -> None:
    text = """# Engine inspection

Searched this workspace before choosing an interface.

- No PREINCARNATION runtime, scene graph, event bus, or audio service is mounted.
- `src/` has platform auth and preview helpers only. Nothing calls Web Audio, Howler, or a music bus.
- Sound effects are explicitly another session and are not imported here.

Because there was no engine API to implement against, the adaptive controller is isolated:

- Module: `controller/adaptive-music.ts`
- It imports no game code and does not read game state.
- A later session binds it by calling the methods below from that session's own transitions.

## Call surface

Construct once. Call `unlock()` synchronously inside the first pointer or key gesture.

- `unlock()` — resume `AudioContext`. Required before any sound on mobile browsers.
- `load(cueId?)` — decode cues. Death sting and menu veil are preloaded on unlock.
- `transitionTo(cueId, fadeSec?)` — equal-power crossfade. Incoming cue's manifest fade is the default. Danger and boss are short; afterlife, reincarnation, and ending are long.
- `setIntensity(0 | 1 | 2, fadeSec?)` — vertical layers. 0 is the bed alone.
- `setMenu(open)` — duck the current cue. If the cue's menu mode is `veil`, fade in the menu veil. Title and ending are `duck-only`.
- `interruptDeath()` — fast duck of music and veil, then the death sting. `transitionTo` during the sting fades the sting and starts the next cue (so a death may continue into afterlife).
- `mute(on?)` — master gain. Music keeps its place.
- `suspend()` / `resume()` — user pause. `suspend` ramps the master down and suspends the context; `resume` reverses it. Hiding the tab also suspends the context without counting as a user suspend.
- `setSolo(layerIndex | null)` — audition-only. Not required by gameplay.
- `getState()` — plain snapshot for UI.

Layers of one cue start on the same audio-clock time. Loop points are the file edges. Canonical WAV loops are sample-constructed to be periodic after reverb; the browser plays the 160 kbps MP3 encode of that WAV. Loop-join measurements for both are in `VALIDATION.md`.
"""
    (ROOT / "ENGINE.md").write_text(text)


def write_readme() -> None:
    text = """# Vein Score — PREINCARNATION

Synthesis mixes for an original pixel-art adventure in Addison County. Ellis returns fourteen years after death. The Marble Vein stores unrealized lives. The Voice and the Other Voice are two readings of one mythology.

This folder is the score session. It does not contain sound effects.

## What is playable

Twelve cues, each a real audio file, plus two utility cues the controller needs:

`title`, `middlebury`, `open-county`, `high-woods`, `water`, `quarry`, `ordinary-dungeon`, `danger`, `boss`, `afterlife`, `reincarnation`, `ending`, and `menu-veil`, `death-sting`.

- `audio/wav/` — canonical 44.1 kHz 16-bit stereo mixes and stems. These are the measured files.
- `web/` — 160 kbps MP3 encodes the audition desk plays. Same render, lossy encode, not a second arrangement.
- `midi/` — SMF type 1, one track per layer, for editing the notes. General MIDI program numbers are labels only. The WAV is not a General MIDI rendering.
- `sources/compose.py` — the instrument and the score. Edit and rerun to regenerate.

## What these mixes are not

They are not professionally mastered. They are not a human listening test. Gain was set in the renderer to about −18 dBFS RMS with a −1.5 dBFS peak ceiling, plus a short synthetic room. `VALIDATION.md` is measurement (peak, RMS, DC, loop join, crossfade joins, motif-frequency checks), plus waveform inspection. If a person has not listened, this file will not pretend otherwise.

## Motifs

See `MOTIF-MAP.md`. Three families: Ellis, Vein, Voice/Other.

## Controller

`controller/adaptive-music.ts` is isolated. Read `ENGINE.md` for why it does not import a game engine (there isn't one in this workspace) and for the call surface: transitions, intensity, menu, death, mute, suspend, resume.

## Audition

The desk in the running app plays through that controller. Pick a cue, move intensity, open the menu, fire the death sting, mute, suspend. Layer solos are for checking stems.
"""
    (ROOT / "README.md").write_text(text)


def main() -> None:
    write_motif_map()
    write_engine_note()
    write_readme()
    pieces = all_pieces()
    manifest_cues = []
    all_events = []
    encode_jobs: list[tuple[Path, Path]] = []
    for piece in pieces:
        print(f"render {piece.id}", flush=True)
        layers = render_layers(piece)
        order = [name for name, _, _ in piece.layers]
        staged, mix, info = gain_stage(layers, order)
        print(f"  gain {info['gain']:.3f} limited {info['peak_limited']}", flush=True)
        mix_path = WAV_MIX / f"{piece.id}.wav"
        write_wav(mix_path, mix)
        encode_jobs.append((mix_path, MP3_MIX / f"{piece.id}.mp3"))
        layer_peaks = {}
        for name in order:
            lp = WAV_LAYER / piece.id / f"{name}.wav"
            write_wav(lp, staged[name])
            encode_jobs.append((lp, MP3_LAYER / piece.id / f"{name}.mp3"))
            layer_peaks[name] = peaks_of(staged[name])
        write_midi(piece, MIDI_DIR / f"{piece.id}.mid")
        manifest_cues.append(piece_to_manifest(piece, mix.shape[1] / SR, peaks_of(mix), layer_peaks, info))
        all_events.extend(events_dump(piece))
    print(f"encode {len(encode_jobs)} mp3", flush=True)
    for wav_path, mp3_path in encode_jobs:
        encode_mp3(wav_path, mp3_path)
    manifest = {
        "title": "PREINCARNATION — Vein Score",
        "kind": "synthesis-mix",
        "not": "Not a mastered recording. Not a human listening panel.",
        "sampleRate": SR,
        "mp3Bitrate": 160000,
        "motifs": {
            "ellis": {"intervals": ELLIS, "rhythmFamiliar": ELLIS_WALK},
            "vein": {"intervals": VEIN},
            "voice": {"intervals": VOICE},
            "other": {"intervals": OTHER, "relation": "inversion of voice"},
        },
        "cues": manifest_cues,
    }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    (WEB / "manifest.json").write_text(json.dumps(manifest, indent=2))
    (ROOT / "sources" / "events.json").write_text(json.dumps(all_events, indent=2))
    print("done", flush=True)


if __name__ == "__main__":
    main()
