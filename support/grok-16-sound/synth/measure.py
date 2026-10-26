"""Measured loudness, timing, and loop-seam metrics. BS.1770-style K-weight."""

from __future__ import annotations

import hashlib
import wave
from pathlib import Path

import numpy as np

from dsp import true_peak_dbfs


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        n = wf.getnframes()
        sw = wf.getsampwidth()
        if sw != 2:
            raise RuntimeError(f"{path} is not 16-bit PCM")
        raw = wf.readframes(n)
    pcm = np.frombuffer(raw, dtype="<i2").astype(np.float64)
    if ch == 1:
        audio = pcm / 32768.0
    else:
        audio = (pcm.reshape(-1, ch) / 32768.0)
    return audio, sr


def write_wav(path: Path, audio: np.ndarray, sr: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = np.asarray(audio, dtype=np.float64)
    if data.ndim == 1:
        interleaved = data
        channels = 1
    elif data.ndim == 2:
        interleaved = np.ascontiguousarray(data).reshape(-1)
        channels = data.shape[1]
    else:
        raise RuntimeError("audio rank")
    peak = float(np.max(np.abs(interleaved))) if interleaved.size else 0.0
    if peak >= 1.0:
        raise RuntimeError(f"refusing clipped float {path} peak={peak}")
    seed = int.from_bytes(hashlib.sha256(str(path).encode()).digest()[:4], "little")
    rng = np.random.default_rng(seed)
    dither = (rng.random(interleaved.shape) - rng.random(interleaved.shape)) / 32768.0
    pcm = np.round(interleaved * 32767.0 + dither)
    if np.max(np.abs(pcm)) >= 32767:
        raise RuntimeError(f"quantized sample hit the rail in {path}")
    frames = pcm.astype("<i2").tobytes()
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(frames)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def peak_dbfs(x: np.ndarray) -> float:
    peak = float(np.max(np.abs(x)))
    return 20.0 * np.log10(peak + 1e-12)


def rms_dbfs(x: np.ndarray) -> float:
    if x.ndim == 1:
        ms = float(np.mean(x * x))
    else:
        ms = float(np.mean(x * x))
    return 10.0 * np.log10(ms + 1e-20)


def dc_offset(x: np.ndarray) -> float:
    return float(np.mean(x))


def _k_coefficients(sr: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """ITU-R BS.1770 pre-filter + RLB highpass, bilinear, any sample rate."""
    f0 = 1681.974450955533
    G = 3.999843853973347
    Q = 0.7071752369554196
    K = np.tan(np.pi * f0 / sr)
    Vh = 10 ** (G / 20.0)
    Vb = Vh ** 0.4996667741545416
    a0 = 1.0 + K / Q + K * K
    b_pre = np.array(
        [
            (Vh + Vb * K / Q + K * K) / a0,
            2.0 * (K * K - Vh) / a0,
            (Vh - Vb * K / Q + K * K) / a0,
        ]
    )
    a_pre = np.array([1.0, 2.0 * (K * K - 1.0) / a0, (1.0 - K / Q + K * K) / a0])

    f0 = 38.13547087602444
    Q = 0.5003270373238773
    K = np.tan(np.pi * f0 / sr)
    a0 = 1.0 + K / Q + K * K
    b_hp = np.array([1.0 / a0, -2.0 / a0, 1.0 / a0])
    a_hp = np.array([1.0, 2.0 * (K * K - 1.0) / a0, (1.0 - K / Q + K * K) / a0])
    return b_pre, a_pre, b_hp, a_hp


def _filter(x: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
    from dsp import biquad

    if x.ndim == 1:
        return biquad(x, b, a)
    y = np.empty_like(x)
    for c in range(x.shape[1]):
        y[:, c] = biquad(x[:, c], b, a)
    return y


def k_weight(x: np.ndarray, sr: int) -> np.ndarray:
    b1, a1, b2, a2 = _k_coefficients(sr)
    return _filter(_filter(x, b1, a1), b2, a2)


def _channel_weights(channels: int) -> np.ndarray:
    # Stereo and mono use weight 1 per channel. No surrounds are produced.
    return np.ones(channels, dtype=np.float64)


def momentary_powers(weighted: np.ndarray, sr: int) -> tuple[np.ndarray, int]:
    window = int(round(0.4 * sr))
    hop = int(round(0.1 * sr))
    if weighted.ndim == 1:
        weighted = weighted[:, None]
    n = weighted.shape[0]
    if n < window:
        return np.zeros(0), window
    weights = _channel_weights(weighted.shape[1])
    blocks = []
    for start in range(0, n - window + 1, hop):
        seg = weighted[start : start + window]
        ms = 0.0
        for c in range(seg.shape[1]):
            ms += weights[c] * float(np.mean(seg[:, c] * seg[:, c]))
        blocks.append(ms)
    return np.asarray(blocks, dtype=np.float64), window


def _loudness_from_ms(ms: float) -> float:
    return -0.691 + 10.0 * np.log10(ms + 1e-20)


def integrated_loudness(x: np.ndarray, sr: int) -> dict:
    weighted = k_weight(x, sr)
    if weighted.ndim == 1:
        ms = float(np.mean(weighted * weighted))
        channels = 1
    else:
        w = _channel_weights(weighted.shape[1])
        ms = 0.0
        for c in range(weighted.shape[1]):
            ms += w[c] * float(np.mean(weighted[:, c] * weighted[:, c]))
        channels = weighted.shape[1]
    ungated = _loudness_from_ms(ms)
    blocks, window = momentary_powers(weighted, sr)
    duration = (x.shape[0] / sr) if x.ndim >= 1 else 0.0
    if blocks.size == 0 or duration < 1.0:
        return {
            "lufs": round(float(ungated), 2),
            "mode": "ungated-short",
            "kWeightDbAt1k": None,
            "channels": channels,
        }
    block_lufs = -0.691 + 10.0 * np.log10(blocks + 1e-20)
    abs_mask = block_lufs >= -70.0
    if not np.any(abs_mask):
        return {"lufs": round(float(ungated), 2), "mode": "ungated-below-gate", "channels": channels}
    abs_ms = float(np.mean(blocks[abs_mask]))
    abs_lufs = _loudness_from_ms(abs_ms)
    rel_mask = abs_mask & (block_lufs >= (abs_lufs - 10.0))
    if not np.any(rel_mask):
        rel_mask = abs_mask
    gated = _loudness_from_ms(float(np.mean(blocks[rel_mask])))
    return {
        "lufs": round(float(gated), 2),
        "ungatedLufs": round(float(ungated), 2),
        "mode": "integrated-bs1770",
        "channels": channels,
        "blocks": int(blocks.size),
    }


def onset_ms(x: np.ndarray, sr: int) -> float:
    mono = x if x.ndim == 1 else x.mean(axis=1)
    peak = float(np.max(np.abs(mono))) + 1e-12
    hit = np.flatnonzero(np.abs(mono) >= peak * 0.2)
    if hit.size == 0:
        return 0.0
    return round(float(hit[0]) * 1000.0 / sr, 2)


def peak_ms(x: np.ndarray, sr: int) -> float:
    mono = x if x.ndim == 1 else x.mean(axis=1)
    return round(float(np.argmax(np.abs(mono))) * 1000.0 / sr, 2)


def duration_ms(x: np.ndarray, sr: int) -> float:
    return round(x.shape[0] * 1000.0 / sr, 2)


def seam_ratio(x: np.ndarray) -> dict:
    data = x[:, None] if x.ndim == 1 else x
    ratios = []
    jumps = []
    for c in range(data.shape[1]):
        ch = data[:, c]
        jump = abs(float(ch[0] - ch[-1]))
        diffs = np.abs(np.diff(ch))
        typical = float(np.median(diffs)) + 1e-12
        ratios.append(jump / typical)
        jumps.append(jump)
    return {
        "maxRatio": round(float(max(ratios)), 3),
        "maxJump": float(max(jumps)),
    }


def edge_rms_delta_db(x: np.ndarray, sr: int, ms: float = 40.0) -> float:
    n = max(8, int(sr * ms / 1000.0))
    data = x if x.ndim == 1 else x.mean(axis=1)
    a = float(np.sqrt(np.mean(data[:n] ** 2) + 1e-20))
    b = float(np.sqrt(np.mean(data[-n:] ** 2) + 1e-20))
    return round(20.0 * np.log10((a + 1e-12) / (b + 1e-12)), 3)


def correlation(a: np.ndarray, b: np.ndarray) -> float:
    xa = a if a.ndim == 1 else a.mean(axis=1)
    xb = b if b.ndim == 1 else b.mean(axis=1)
    n = min(xa.shape[0], xb.shape[0])
    xa = xa[:n] - np.mean(xa[:n])
    xb = xb[:n] - np.mean(xb[:n])
    denom = float(np.linalg.norm(xa) * np.linalg.norm(xb))
    if denom < 1e-12:
        return 1.0
    return float(np.dot(xa, xb) / denom)


def spectral_centroid(x: np.ndarray, sr: int) -> float:
    mono = x if x.ndim == 1 else x.mean(axis=1)
    if mono.shape[0] < 16:
        return 0.0
    window = np.hanning(mono.shape[0])
    spec = np.abs(np.fft.rfft(mono * window))
    freqs = np.fft.rfftfreq(mono.shape[0], d=1.0 / sr)
    mag = spec + 1e-12
    return float(np.sum(freqs * mag) / np.sum(mag))


def envelope_peak_count(x: np.ndarray, sr: int, min_gap_s: float = 0.09) -> int:
    mono = np.abs(x if x.ndim == 1 else x.mean(axis=1))
    w = max(1, int(sr * 0.02))
    kernel = np.ones(w) / w
    env = np.convolve(mono, kernel, mode="same")
    # Ignore the outer 30 ms.
    guard = int(sr * 0.03)
    env[:guard] = 0
    env[-guard:] = 0
    thresh = float(np.max(env)) * 0.45
    gap = int(sr * min_gap_s)
    count = 0
    i = 1
    last = -gap
    while i < env.shape[0] - 1:
        if env[i] >= thresh and env[i] >= env[i - 1] and env[i] >= env[i + 1] and i - last >= gap:
            count += 1
            last = i
            i += gap
        else:
            i += 1
    return count


def full_scale_hits(path: Path) -> int:
    with wave.open(str(path), "rb") as wf:
        raw = wf.readframes(wf.getnframes())
    pcm = np.frombuffer(raw, dtype="<i2")
    return int(np.count_nonzero(np.abs(pcm) >= 32767))


def analyze_file(path: Path) -> dict:
    audio, sr = read_wav(path)
    loud = integrated_loudness(audio, sr)
    seam = seam_ratio(audio)
    return {
        "file": path.name,
        "sha256": sha256(path),
        "sampleRate": sr,
        "channels": 1 if audio.ndim == 1 else int(audio.shape[1]),
        "durationMs": duration_ms(audio, sr),
        "peakDbfs": round(peak_dbfs(audio), 2),
        "truePeakDbfs": round(true_peak_dbfs(audio), 2),
        "rmsDbfs": round(rms_dbfs(audio), 2),
        "lufs": loud["lufs"],
        "lufsMode": loud["mode"],
        "dc": round(dc_offset(audio), 5),
        "onsetMs": onset_ms(audio, sr),
        "peakMs": peak_ms(audio, sr),
        "fullScaleHits": full_scale_hits(path),
        "seamRatio": seam["maxRatio"],
        "edgeRmsDeltaDb": edge_rms_delta_db(audio, sr),
        "centroidHz": round(spectral_centroid(audio, sr), 1),
    }
