"""Original DSP primitives for Preincarnation cues. No sample libraries."""

from __future__ import annotations

import numpy as np


def t_of(n: int, sr: int) -> np.ndarray:
    return np.arange(n, dtype=np.float64) / sr


def silence(seconds: float, sr: int, channels: int = 1) -> np.ndarray:
    n = int(round(seconds * sr))
    if channels == 1:
        return np.zeros(n, dtype=np.float64)
    return np.zeros((n, channels), dtype=np.float64)


def white(n: int, rng: np.random.Generator, amp: float = 1.0) -> np.ndarray:
    return rng.normal(0.0, amp, n).astype(np.float64)


def pink(n: int, rng: np.random.Generator) -> np.ndarray:
    spec = np.fft.rfft(rng.normal(0.0, 1.0, n))
    freqs = np.fft.rfftfreq(n, d=1.0)
    spec[0] = 0.0
    spec[1:] /= np.sqrt(freqs[1:])
    y = np.fft.irfft(spec, n=n).astype(np.float64)
    peak = np.max(np.abs(y))
    if peak > 0:
        y /= peak
    return y


def sine(freq: float, n: int, sr: int, phase: float = 0.0) -> np.ndarray:
    t = t_of(n, sr)
    return np.sin(2.0 * np.pi * freq * t + phase)


def tone_stack(partials: list[tuple[float, float]], n: int, sr: int) -> np.ndarray:
    y = np.zeros(n, dtype=np.float64)
    for freq, amp in partials:
        y += amp * sine(freq, n, sr)
    return y


def exp_decay(n: int, sr: int, tau: float, attack: float = 0.0015) -> np.ndarray:
    t = t_of(n, sr)
    att = np.minimum(1.0, t / max(attack, 1e-5))
    return att * np.exp(-t / max(tau, 1e-4))


def release(x: np.ndarray, sr: int, ms: float = 12.0) -> np.ndarray:
    n = x.shape[0]
    r = min(n // 2, max(2, int(sr * ms / 1000.0)))
    y = x.copy()
    ramp = np.linspace(1.0, 0.0, r)
    if y.ndim == 1:
        y[-r:] *= ramp
    else:
        y[-r:, :] *= ramp[:, None]
    return y


def biquad(x: np.ndarray, b: np.ndarray, a: np.ndarray) -> np.ndarray:
    """Transposed DF-II, a[0] assumed 1. Mono."""
    b0, b1, b2 = float(b[0]), float(b[1]), float(b[2])
    a1, a2 = float(a[1]), float(a[2])
    y = np.empty_like(x, dtype=np.float64)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(x.shape[0]):
        xi = float(x[i])
        yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1
        x1 = xi
        y2 = y1
        y1 = yi
        y[i] = yi
    return y


def _rbj(kind: str, f0: float, q: float, sr: int, gain_db: float = 0.0) -> tuple[np.ndarray, np.ndarray]:
    f0 = float(np.clip(f0, 20.0, sr * 0.45))
    q = max(0.15, float(q))
    w0 = 2.0 * np.pi * f0 / sr
    cw = np.cos(w0)
    sw = np.sin(w0)
    alpha = sw / (2.0 * q)
    if kind == "lp":
        b0 = (1 - cw) / 2
        b1 = 1 - cw
        b2 = (1 - cw) / 2
        a0 = 1 + alpha
        a1 = -2 * cw
        a2 = 1 - alpha
    elif kind == "hp":
        b0 = (1 + cw) / 2
        b1 = -(1 + cw)
        b2 = (1 + cw) / 2
        a0 = 1 + alpha
        a1 = -2 * cw
        a2 = 1 - alpha
    elif kind == "bp":
        b0 = alpha
        b1 = 0.0
        b2 = -alpha
        a0 = 1 + alpha
        a1 = -2 * cw
        a2 = 1 - alpha
    elif kind == "hs":
        A = 10 ** (gain_db / 40.0)
        b0 = A * ((A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha)
        b1 = -2 * A * ((A - 1) + (A + 1) * cw)
        b2 = A * ((A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha)
        a0 = (A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha
        a1 = 2 * ((A - 1) - (A + 1) * cw)
        a2 = (A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha
    else:
        raise ValueError(kind)
    b = np.array([b0, b1, b2], dtype=np.float64) / a0
    a = np.array([1.0, a1 / a0, a2 / a0], dtype=np.float64)
    return b, a


def lowpass(x: np.ndarray, f0: float, q: float, sr: int) -> np.ndarray:
    b, a = _rbj("lp", f0, q, sr)
    return biquad(x, b, a)


def highpass(x: np.ndarray, f0: float, q: float, sr: int) -> np.ndarray:
    b, a = _rbj("hp", f0, q, sr)
    return biquad(x, b, a)


def bandpass(x: np.ndarray, f0: float, q: float, sr: int) -> np.ndarray:
    b, a = _rbj("bp", f0, q, sr)
    return biquad(x, b, a)


def highshelf(x: np.ndarray, f0: float, q: float, gain_db: float, sr: int) -> np.ndarray:
    b, a = _rbj("hs", f0, q, sr, gain_db)
    return biquad(x, b, a)


def dc_block(x: np.ndarray, sr: int, f0: float = 25.0) -> np.ndarray:
    if x.ndim == 1:
        return highpass(x, f0, 0.707, sr)
    y = np.empty_like(x)
    for c in range(x.shape[1]):
        y[:, c] = highpass(x[:, c], f0, 0.707, sr)
    return y


def modes(freqs: list[float], decays: list[float], n: int, sr: int, amps: list[float] | None = None) -> np.ndarray:
    y = np.zeros(n, dtype=np.float64)
    t = t_of(n, sr)
    if amps is None:
        amps = [1.0] * len(freqs)
    for f, d, a in zip(freqs, decays, amps):
        y += a * np.sin(2.0 * np.pi * f * t) * np.exp(-t / d)
    att = np.minimum(1.0, t / 0.0012)
    return y * att


def karplus(freq: float, seconds: float, sr: int, decay: float, rng: np.random.Generator, brightness: float = 0.5) -> np.ndarray:
    n = max(8, int(sr / max(freq, 30.0)))
    buf = rng.uniform(-1.0, 1.0, n)
    # One-pole smooth of the noise burst controls brightness.
    if brightness < 0.99:
        for i in range(1, n):
            buf[i] = brightness * buf[i] + (1 - brightness) * buf[i - 1]
    out_n = int(seconds * sr)
    out = np.empty(out_n, dtype=np.float64)
    idx = 0
    for i in range(out_n):
        out[i] = buf[idx]
        nxt = (idx + 1) % n
        buf[idx] = decay * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out


def comb(x: np.ndarray, delay: int, feedback: float, damp: float) -> np.ndarray:
    n = x.shape[0]
    y = np.zeros(n, dtype=np.float64)
    lp = 0.0
    d = max(1, int(delay))
    fb = float(feedback)
    damp = float(np.clip(damp, 0.0, 0.99))
    for i in range(n):
        delayed = y[i - d] if i >= d else 0.0
        lp = (1.0 - damp) * delayed + damp * lp
        y[i] = float(x[i]) + fb * lp
    return y


def normalize_peak(x: np.ndarray, peak_dbfs: float) -> np.ndarray:
    peak = float(np.max(np.abs(x)))
    if peak < 1e-8:
        raise RuntimeError("refusing to normalize silence")
    target = 10 ** (peak_dbfs / 20.0)
    return x * (target / peak)


def true_peak_dbfs(x: np.ndarray, oversample: int = 4) -> float:
    data = x if x.ndim == 1 else x.reshape(-1, x.shape[-1])
    if data.ndim == 1:
        channels = [data]
    else:
        channels = [data[:, c] for c in range(data.shape[1])]
    worst = 0.0
    for ch in channels:
        n = ch.shape[0]
        spec = np.fft.rfft(ch)
        up_n = n * oversample
        spec_up = np.zeros(up_n // 2 + 1, dtype=np.complex128)
        spec_up[: spec.shape[0]] = spec * oversample
        y = np.fft.irfft(spec_up, n=up_n)
        worst = max(worst, float(np.max(np.abs(y))))
    return 20.0 * np.log10(worst + 1e-12)


def limit_true_peak(x: np.ndarray, ceiling_db: float = -1.0) -> np.ndarray:
    y = x
    for _ in range(8):
        tp = true_peak_dbfs(y)
        if tp <= ceiling_db:
            return y
        y = y * (10 ** (-(tp - ceiling_db + 0.08) / 20.0))
    return y


def pan_stereo(mono: np.ndarray, amount: float) -> np.ndarray:
    """Equal-power pan. amount -1..1."""
    a = float(np.clip(amount, -1.0, 1.0))
    left = np.cos((a + 1.0) * np.pi / 4.0)
    right = np.sin((a + 1.0) * np.pi / 4.0)
    return np.column_stack((mono * left, mono * right))


def stereo_bed(layers: list[tuple[np.ndarray, float]]) -> np.ndarray:
    n = layers[0][0].shape[0]
    out = np.zeros((n, 2), dtype=np.float64)
    for mono, pan in layers:
        if mono.shape[0] != n:
            raise RuntimeError("stereo layer length mismatch")
        out += pan_stereo(mono, pan)
    return out


def seamless(x: np.ndarray, sr: int, fade_ms: float = 350.0) -> np.ndarray:
    """Equal-power head/tail join. Loop point is two adjacent source samples."""
    fade = int(sr * fade_ms / 1000.0)
    mono = x.ndim == 1
    data = x[:, None] if mono else x
    n, ch = data.shape
    if fade < 8 or fade >= n // 3:
        raise RuntimeError("bad seamless fade")
    out_n = n - fade
    out = np.zeros((out_n, ch), dtype=np.float64)
    ramp = np.linspace(0.0, 1.0, fade, endpoint=False)
    fi = np.sin(ramp * np.pi / 2.0)[:, None]
    fo = np.cos(ramp * np.pi / 2.0)[:, None]
    out[:fade] = data[:fade] * fi + data[-fade:] * fo
    out[fade:] = data[fade : n - fade]
    return out[:, 0] if mono else out


def fit_length(x: np.ndarray, n: int) -> np.ndarray:
    if x.shape[0] == n:
        return x
    if x.shape[0] > n:
        return x[:n]
    if x.ndim == 1:
        y = np.zeros(n, dtype=np.float64)
    else:
        y = np.zeros((n, x.shape[1]), dtype=np.float64)
    y[: x.shape[0]] = x
    return y


def mix(*parts: np.ndarray) -> np.ndarray:
    n = max(p.shape[0] for p in parts)
    acc = None
    for p in parts:
        q = fit_length(p, n)
        acc = q if acc is None else acc + q
    return acc


def place(spike: np.ndarray, at: int, n: int) -> np.ndarray:
    y = np.zeros(n, dtype=np.float64)
    end = min(n, at + spike.shape[0])
    if at >= n or end <= at:
        return y
    src_end = end - at
    y[at:end] += spike[:src_end]
    return y


def amp_db(db: float) -> float:
    return 10 ** (db / 20.0)
