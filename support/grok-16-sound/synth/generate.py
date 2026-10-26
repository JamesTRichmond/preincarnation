"""Render the Preincarnation cue library from original synthesis.

Rerun from this directory's parent package path:

    python3 synth/generate.py

Seeds are fixed. No recorded samples, no network, no third-party audio.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dsp import (  # noqa: E402
    amp_db,
    bandpass,
    comb,
    dc_block,
    exp_decay,
    highpass,
    karplus,
    limit_true_peak,
    lowpass,
    mix,
    modes,
    normalize_peak,
    pink,
    place,
    release,
    seamless,
    sine,
    stereo_bed,
    t_of,
    white,
)
from measure import analyze_file, integrated_loudness, write_wav  # noqa: E402

SR = 44100
MASTER_SEED = 16014
POOL_LIMITS = {"music": 2, "ambience": 2, "effects": 10, "ui": 4}


@dataclass
class Spec:
    id: str
    category: str
    bus: str
    event: str
    recipe: str
    timing_notes: str
    variants: int = 1
    priority: int = 5
    peak_db: float | None = -8.0
    lufs_db: float | None = None
    loop: bool = False
    seamless_fade_ms: float = 0.0
    overlap: dict = field(default_factory=dict)
    warning: dict | None = None
    pitch_jitter: float = 0.0
    surface: str | None = None
    event_key: str | None = None
    variant_mode: str = "round-robin"
    duck: dict | None = None
    seconds: float = 0.3


def S(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def burst(sr, rng, seconds, f0, q, tau, kind="bp", attack=0.002, color="white"):
    n = max(8, int(sr * seconds))
    src = white(n, rng) if color == "white" else pink(n, rng)
    if kind == "bp":
        src = bandpass(src, f0, q, sr)
    elif kind == "lp":
        src = lowpass(src, f0, q, sr)
    elif kind == "hp":
        src = highpass(src, f0, q, sr)
    else:
        raise ValueError(kind)
    return src * exp_decay(n, sr, tau, attack)


def whoosh(sr, rng, seconds, f_start, f_end, q=0.8):
    n = int(sr * seconds)
    noise = white(n, rng)
    # Two static bands mixed across the gesture, cheaper than a time-varying filter
    # and still a directional sweep.
    a = bandpass(noise, f_start, q, sr)
    b = bandpass(noise, f_end, q, sr)
    t = np.linspace(0.0, 1.0, n)
    env = np.sin(np.pi * t) ** 1.3
    return (a * (1.0 - t) + b * t) * env


def bubbles(sr, rng, count, seconds, f_lo, f_hi):
    n = int(sr * seconds)
    y = np.zeros(n)
    for _ in range(count):
        dur = int(sr * float(rng.uniform(0.03, 0.09)))
        f = float(rng.uniform(f_lo, f_hi))
        at = int(rng.integers(0, max(1, n - dur)))
        t = t_of(dur, sr)
        slip = np.linspace(f, f * float(rng.uniform(1.15, 1.6)), dur)
        phase = 2.0 * np.pi * np.cumsum(slip) / sr
        blip = np.sin(phase) * np.exp(-t / float(rng.uniform(0.02, 0.045)))
        y[at : at + dur] += blip * float(rng.uniform(0.25, 0.7))
    return y


def chirp(sr, rng, f0, seconds=0.16):
    n = int(sr * seconds)
    t = t_of(n, sr)
    fall = float(rng.uniform(2.5, 6.5))
    f = f0 * np.exp(-t * fall)
    phase = 2.0 * np.pi * np.cumsum(f) / sr
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.5
    return (np.sin(phase) * env).astype(np.float64)


def fm_bell(sr, f_car, ratio, index, seconds, decay):
    n = int(sr * seconds)
    t = t_of(n, sr)
    mod = np.sin(2.0 * np.pi * f_car * ratio * t)
    idx = index * np.exp(-t / max(decay, 0.05))
    y = np.sin(2.0 * np.pi * f_car * t + idx * mod)
    return y * exp_decay(n, sr, decay, 0.004)


def ui_tone(sr, f0, f1, seconds, body=0.7):
    n = int(sr * seconds)
    t = t_of(n, sr)
    f = np.linspace(f0, f1, n)
    phase = 2.0 * np.pi * np.cumsum(f) / sr
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 1.1
    partial = 0.28 * np.sin(2.0 * phase)
    return (body * np.sin(phase) + partial) * env


def finish_one_shot(x, sr, peak_db):
    y = dc_block(np.asarray(x, dtype=np.float64), sr)
    y = release(y, sr, 14.0)
    y = normalize_peak(y, peak_db)
    y = limit_true_peak(y, -1.0)
    return y


def finish_bed(x, sr, lufs_db, fade_ms):
    y = dc_block(np.asarray(x, dtype=np.float64), sr, 32.0)
    y = seamless(y, sr, fade_ms)
    current = integrated_loudness(y, sr)["lufs"]
    y = y * (10 ** ((lufs_db - current) / 20.0))
    y = limit_true_peak(y, -1.0)
    # True-peak limiting can move loudness. Report whatever remains; do not
    # chase the target back up through the ceiling.
    return y


# --- movement -----------------------------------------------------------------

def step_grass(sr, rng, v):
    nsec = 0.20 + 0.015 * v
    body_f = 98 + 14 * v
    n = int(sr * nsec)
    body = sine(body_f, n, sr) * exp_decay(n, sr, 0.045, 0.004)
    air = burst(sr, rng, nsec, 720 + 40 * v, 0.7, 0.04, "lp")
    return body * 0.65 + fit(air, n) * 0.55


def step_dirt(sr, rng, v):
    nsec = 0.16 + 0.01 * v
    grit = burst(sr, rng, nsec, 480 + 30 * v, 0.9, 0.03, "bp")
    n = grit.shape[0]
    thud = sine(140 + 8 * v, n, sr) * exp_decay(n, sr, 0.03, 0.002)
    bits = np.zeros(n)
    for k in range(4 + v):
        at = int(rng.integers(0, max(1, n // 3)))
        bits[at] += float(rng.uniform(0.4, 1.0))
    bits = bandpass(bits, 1400, 1.2, sr) * exp_decay(n, sr, 0.02, 0.001)
    return thud * 0.7 + grit * 0.5 + bits * 0.35


def step_stone(sr, rng, v):
    n = int(sr * (0.22 + 0.02 * v))
    click = np.zeros(n)
    click[8] = 1.0
    click = highpass(click, 1600 + 80 * v, 0.7, sr)
    ring = modes(
        [820 + 30 * v, 1310 + 20 * v, 2080],
        [0.045, 0.03, 0.018],
        n,
        sr,
        [0.7, 0.45, 0.28],
    )
    dust = burst(sr, rng, n / sr, 2200, 1.4, 0.02, "hp")
    return ring * 0.8 + click * 0.9 + fit(dust, n) * 0.25


def step_wood(sr, rng, v):
    n = int(sr * (0.26 + 0.02 * v))
    ring = modes(
        [168 + 6 * v, 312 + 8 * v, 488],
        [0.09, 0.06, 0.04],
        n,
        sr,
        [0.8, 0.55, 0.3],
    )
    knock = burst(sr, rng, 0.05, 900, 1.5, 0.012, "bp")
    return ring + fit(knock, n) * 0.45


def step_snow(sr, rng, v):
    nsec = 0.28 + 0.02 * v
    air = burst(sr, rng, nsec, 280 - 15 * v, 0.6, 0.09, "lp", attack=0.018, color="pink")
    n = air.shape[0]
    body = sine(70 + 4 * v, n, sr) * exp_decay(n, sr, 0.08, 0.02)
    return air * 0.75 + body * 0.4


def step_gravel(sr, rng, v):
    n = int(sr * (0.24 + 0.02 * v))
    y = np.zeros(n)
    ticks = 5 + v
    for _ in range(ticks):
        dur = int(sr * float(rng.uniform(0.012, 0.03)))
        at = int(rng.integers(0, n - dur))
        f = float(rng.uniform(1400, 3200))
        tick = modes([f, f * 1.47], [0.012, 0.008], dur, sr, [1.0, 0.4])
        y[at : at + dur] += tick * float(rng.uniform(0.35, 1.0))
    bed = burst(sr, rng, n / sr, 1100, 0.8, 0.05, "bp")
    return y * 0.8 + fit(bed, n) * 0.2


def step_shallow(sr, rng, v):
    nsec = 0.32 + 0.02 * v
    splash = burst(sr, rng, nsec, 900 + 40 * v, 0.7, 0.06, "bp")
    bub = bubbles(sr, rng, 4 + v, nsec, 500, 1400)
    return fit(splash, bub.shape[0]) * 0.55 + bub * 0.8


def step_board(sr, rng, v):
    wood = step_wood(sr, rng, v)
    creak = karplus(210 + 15 * v, 0.18, sr, 0.992, rng, brightness=0.35)
    creak *= np.linspace(0.2, 1.0, creak.shape[0])
    return mix(wood * 0.85, creak * 0.35)


def swim_stroke(sr, rng, v):
    sweep = whoosh(sr, rng, 0.36 + 0.02 * v, 900 + 40 * v, 280, 0.7)
    bub = bubbles(sr, rng, 3, 0.36, 400, 1100)
    return mix(sweep * 0.8, bub * 0.55)


def swim_surface(sr, rng, v):
    splash = burst(sr, rng, 0.28, 1600, 0.6, 0.05, "hp")
    bub = bubbles(sr, rng, 6, 0.3, 700, 1800)
    return mix(splash, bub * 0.7)


def land_soft(sr, rng, v):
    n = int(sr * 0.30)
    body = sine(78, n, sr) * exp_decay(n, sr, 0.07, 0.006)
    air = burst(sr, rng, 0.30, 300, 0.7, 0.06, "lp", color="pink")
    return body * 0.8 + fit(air, n) * 0.4


def land_hard(sr, rng, v):
    n = int(sr * 0.28)
    body = modes([92, 160, 310], [0.08, 0.05, 0.03], n, sr, [1.0, 0.5, 0.25])
    tick = np.zeros(n)
    tick[6] = 1
    tick = highpass(tick, 1200, 0.7, sr)
    return body + tick * 0.6


def soul_step(sr, rng, v):
    n = int(sr * (0.34 + 0.03 * v))
    f = 620 + 40 * v
    y = modes([f, f * 2.01, f * 3.2], [0.16, 0.09, 0.05], n, sr, [0.6, 0.25, 0.12])
    air = burst(sr, rng, n / sr, 2400, 2.0, 0.08, "bp")
    return y * 0.9 + fit(air, n) * 0.08


# --- combat -------------------------------------------------------------------

def blade_swing(sr, rng, v):
    return whoosh(sr, rng, 0.18 + 0.012 * v, 2600 - 80 * v, 640, 1.1) * 1.2


def blade_flesh(sr, rng, v):
    n = int(sr * 0.22)
    wet = burst(sr, rng, 0.22, 420 + 20 * v, 0.8, 0.04, "lp")
    body = sine(150 + 8 * v, n, sr) * exp_decay(n, sr, 0.045, 0.002)
    return body * 0.75 + fit(wet, n) * 0.7


def blade_stone(sr, rng, v):
    n = int(sr * 0.26)
    ring = modes(
        [980 + 40 * v, 1540, 2470, 3180],
        [0.07, 0.05, 0.03, 0.02],
        n,
        sr,
        [0.7, 0.5, 0.35, 0.2],
    )
    tick = highpass(place(np.array([1.0]), 4, n), 2000, 0.7, sr)
    return ring + tick * 0.8


def blade_wood(sr, rng, v):
    n = int(sr * 0.2)
    return modes([240 + 10 * v, 470, 890], [0.06, 0.04, 0.025], n, sr, [0.8, 0.5, 0.3])


def bow_draw(sr, rng, v):
    n = int(sr * 0.42)
    creak = burst(sr, rng, 0.42, 700, 1.6, 0.18, "bp", attack=0.04)
    rise = np.linspace(0.15, 1.0, creak.shape[0])
    string = karplus(180, 0.42, sr, 0.996, rng, 0.25) * rise * 0.4
    return fit(creak, n) * rise * 0.7 + fit(string, n)


def bow_loose(sr, rng, v):
    string = karplus(196 + 12 * v, 0.34, sr, 0.988, rng, 0.85)
    air = whoosh(sr, rng, 0.12, 1800, 700, 0.9)
    return mix(string * 0.85, air * 0.35)


def arrow_hit(sr, rng, v):
    n = int(sr * 0.18)
    thunk = modes([130 + 8 * v, 260, 540], [0.05, 0.03, 0.02], n, sr, [1.0, 0.4, 0.2])
    tick = burst(sr, rng, 0.04, 1800, 1.5, 0.01, "hp")
    return thunk + fit(tick, n) * 0.4


def rod_raise(sr, rng, v):
    return karplus(140, 0.16, sr, 0.99, rng, 0.4) * np.linspace(0.3, 1.0, int(sr * 0.16))


def rod_block(sr, rng, v):
    n = int(sr * 0.24)
    wood = modes([190 + 8 * v, 410, 860], [0.05, 0.035, 0.02], n, sr, [0.7, 0.45, 0.25])
    metal = modes([1480, 2210], [0.04, 0.025], n, sr, [0.45, 0.25])
    return wood + metal


def fuse_hiss(sr, rng, v):
    n = int(sr * 0.85)
    noise = highpass(white(n, rng), 2500, 0.7, sr)
    gates = rng.random(n) ** 8
    crackle = noise * gates
    hiss = highpass(pink(n, rng), 1800, 0.6, sr) * 0.15
    env = np.linspace(0.4, 1.0, n) * np.sin(np.pi * np.linspace(0, 1, n))
    return (crackle * 0.8 + hiss) * env


def powder_blast(sr, rng, v):
    n = int(sr * 1.15)
    t = t_of(n, sr)
    f = np.linspace(95, 32, n)
    phase = 2.0 * np.pi * np.cumsum(f) / sr
    sub = np.sin(phase) * np.exp(-t / 0.28)
    boom = lowpass(white(n, rng), 420, 0.6, sr) * np.exp(-t / 0.16)
    crack = highpass(white(n, rng), 1800, 0.7, sr)
    crack *= (rng.random(n) > 0.92) * np.exp(-t / 0.35)
    air = bandpass(white(n, rng), 900, 0.5, sr) * np.exp(-t / 0.45)
    return sub * 0.9 + boom * 0.55 + crack * 0.35 + air * 0.2


def hurt_light(sr, rng, v):
    n = int(sr * 0.16)
    body = sine(230 + 12 * v, n, sr) * exp_decay(n, sr, 0.04, 0.002)
    slap = burst(sr, rng, 0.12, 1000, 1.0, 0.025, "bp")
    return body * 0.55 + fit(slap, n) * 0.6


def hurt_heavy(sr, rng, v):
    n = int(sr * 0.28)
    body = modes([70 + 4 * v, 112, 180], [0.1, 0.07, 0.04], n, sr, [1.0, 0.6, 0.3])
    slap = burst(sr, rng, 0.18, 360, 0.7, 0.05, "lp", color="pink")
    return body * 0.85 + fit(slap, n) * 0.4


def death_sting(sr, rng, v):
    n = int(sr * 0.9)
    t = t_of(n, sr)
    f1 = np.linspace(196, 92, n)
    f2 = np.linspace(233, 98, n)
    p1 = 2 * np.pi * np.cumsum(f1) / sr
    p2 = 2 * np.pi * np.cumsum(f2) / sr
    y = np.sin(p1) * 0.6 + np.sin(p2) * 0.4
    y *= np.exp(-t / 0.35)
    y += lowpass(white(n, rng), 500, 0.7, sr) * np.exp(-t / 0.12) * 0.3
    return y


# --- tools --------------------------------------------------------------------

def shovel_dig(sr, rng, v):
    scrape = burst(sr, rng, 0.34, 520 + 25 * v, 0.6, 0.12, "bp", attack=0.01)
    n = scrape.shape[0]
    # grit grains
    grains = np.zeros(n)
    for _ in range(10 + 2 * v):
        at = int(rng.integers(0, n - 10))
        grains[at] = float(rng.uniform(-1, 1))
    grains = bandpass(grains, 1600, 0.8, sr) * 0.7
    thud_n = int(sr * 0.12)
    thud = sine(90, thud_n, sr) * exp_decay(thud_n, sr, 0.04, 0.003)
    y = scrape * 0.75 + grains * 0.4
    start = int(n * 0.62)
    y[start : start + thud_n] += thud * 0.8
    return y


def shovel_lift(sr, rng, v):
    return mix(
        burst(sr, rng, 0.22, 1400, 0.7, 0.05, "bp") * 0.8,
        bubbles(sr, rng, 2, 0.2, 300, 700) * 0.2,
    )


def sugar_tap(sr, rng, v):
    n = int(sr * 0.28)
    mallet = modes([120 + 6 * v, 214, 330], [0.08, 0.05, 0.035], n, sr, [0.9, 0.45, 0.25])
    tap = burst(sr, rng, 0.04, 800, 2.0, 0.01, "bp")
    return mallet + fit(tap, n) * 0.35


def sugar_drip(sr, rng, v):
    n = int(sr * (0.36 + 0.02 * v))
    f = 1680 + 90 * v + float(rng.uniform(-30, 30))
    ping = modes([f, f * 2.76], [0.12, 0.04], n, sr, [0.7, 0.2])
    drop = sine(420, int(sr * 0.05), sr) * exp_decay(int(sr * 0.05), sr, 0.02, 0.002)
    y = ping * 0.8
    y[: drop.shape[0]] += drop * 0.45
    return y


def hammer_strike(sr, rng, v):
    n = int(sr * 0.32)
    iron = modes(
        [210 + 8 * v, 430, 888, 1410],
        [0.09, 0.06, 0.04, 0.025],
        n,
        sr,
        [0.75, 0.5, 0.32, 0.18],
    )
    click = highpass(place(np.array([1.0]), 3, n), 2500, 0.7, sr)
    return iron + click * 0.55


def hammer_nail(sr, rng, v):
    n = int(sr * 0.26)
    y = np.zeros(n)
    for at_s, amp, f in ((0.0, 1.0, 2100 + 40 * v), (0.09, 0.55, 2480)):
        at = int(sr * at_s)
        dur = int(sr * 0.12)
        hit = modes([f, f * 1.33], [0.03, 0.02], dur, sr, [1.0, 0.4]) * amp
        y[at : at + dur] += hit
    return y


def net_cast(sr, rng, v):
    return whoosh(sr, rng, 0.28, 700, 1600, 0.6)


def net_catch(sr, rng, v):
    rustle = burst(sr, rng, 0.2, 1800, 0.8, 0.05, "bp")
    splash = burst(sr, rng, 0.26, 600, 0.6, 0.07, "lp")
    bub = bubbles(sr, rng, 4, 0.26, 500, 1300)
    return mix(rustle * 0.5, splash * 0.4, bub * 0.6)


def lamp_light(sr, rng, v):
    n = int(sr * 0.45)
    strike = highpass(white(int(sr * 0.03), rng), 3000, 0.7, sr)
    strike = strike * exp_decay(strike.shape[0], sr, 0.008, 0.0006)
    t = t_of(n, sr)
    bloom = lowpass(pink(n, rng), 900, 0.6, sr) * (1 - np.exp(-t / 0.04)) * np.exp(-t / 0.25)
    y = np.zeros(n)
    y[: strike.shape[0]] += strike
    return y + bloom * 0.8


def lamp_hum(sr, rng, v):
    seconds = 2.0
    n = int(round(sr * seconds))
    t = t_of(n, sr)
    flicker = 0.78 + 0.22 * np.sin(2 * np.pi * 6.0 * t)
    y = flicker * (
        0.72 * np.sin(2 * np.pi * 120 * t)
        + 0.22 * np.sin(2 * np.pi * 240 * t)
        + 0.08 * np.sin(2 * np.pi * 360 * t)
    )
    return y


def warp_away(sr, rng, v):
    n = int(sr * 0.7)
    t = t_of(n, sr)
    f = np.linspace(280, 920, n)
    phase = 2 * np.pi * np.cumsum(f) / sr
    mod = np.sin(2 * np.pi * np.linspace(420, 1600, n) * t)
    idx = np.linspace(0.4, 4.5, n)
    y = np.sin(phase + idx * mod)
    air = highpass(white(n, rng), 3000, 0.7, sr) * np.linspace(0.0, 1.0, n)
    env = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 0.8
    return (y * 0.75 + air * 0.15) * env


def warp_arrive(sr, rng, v):
    n = int(sr * 0.8)
    t = t_of(n, sr)
    f = np.linspace(880, 240, n)
    phase = 2 * np.pi * np.cumsum(f) / sr
    mod = np.sin(phase * 1.5)
    idx = np.linspace(3.2, 0.3, n)
    y = np.sin(phase + idx * mod)
    env = np.sin(np.pi * np.clip(t / 0.8, 0, 1)) ** 1.1
    glass = modes([1560, 2210, 3080], [0.2, 0.12, 0.08], n, sr, [0.25, 0.12, 0.06])
    return y * env * 0.7 + glass * 0.35


def cape_snap(sr, rng, v):
    return whoosh(sr, rng, 0.30 + 0.02 * v, 500 + 30 * v, 1400, 0.55)


def boots_scuff(sr, rng, v):
    return burst(sr, rng, 0.14, 900 + 40 * v, 0.7, 0.035, "bp")


def fins_kick(sr, rng, v):
    push = burst(sr, rng, 0.26, 240 + 10 * v, 0.6, 0.07, "lp", color="pink")
    bub = bubbles(sr, rng, 5, 0.28, 450, 1200)
    return mix(push * 0.7, bub)


# --- puzzles ------------------------------------------------------------------

def stone_slide(sr, rng, v):
    n = int(sr * 0.55)
    scrape = lowpass(pink(n, rng), 700, 0.5, sr)
    t = t_of(n, sr)
    env = np.sin(np.pi * t / 0.55) ** 0.7
    grit = bandpass(white(n, rng), 1300, 0.8, sr) * (rng.random(n) > 0.85)
    return (scrape * 0.7 + grit * 0.4) * env


def lock_turn(sr, rng, v):
    n = int(sr * 0.42)
    y = np.zeros(n)
    for at_s, f in ((0.02, 1860.0), (0.16, 1420.0)):
        at = int(sr * at_s)
        dur = int(sr * 0.12)
        hit = modes([f, f * 2.2, 240], [0.025, 0.015, 0.04], dur, sr, [0.6, 0.25, 0.45])
        y[at : at + dur] += hit
    mech = burst(sr, rng, 0.08, 600, 2.0, 0.03, "bp")
    y[int(sr * 0.1) : int(sr * 0.1) + mech.shape[0]] += mech * 0.3
    return y


def puzzle_solve(sr, rng, v):
    # Just 4:5:6 on an original base, not a borrowed fanfare.
    base = 392.0
    n = int(sr * 0.72)
    y = np.zeros(n)
    ratios = (1.0, 5 / 4, 3 / 2)
    for i, ratio in enumerate(ratios):
        at = int(sr * (0.02 + i * 0.12))
        dur = n - at
        partial = sine(base * ratio, dur, sr) * exp_decay(dur, sr, 0.28, 0.006)
        y[at:] += partial * (0.55 - i * 0.08)
    return y


def puzzle_fail(sr, rng, v):
    n = int(sr * 0.28)
    return modes([98, 142, 210], [0.09, 0.05, 0.04], n, sr, [0.9, 0.35, 0.2])


def glass_hum(sr, rng, v):
    n = int(sr * 1.15)
    f = 988.0
    y = modes(
        [f, f * 2.76, f * 4.07, f * 5.4],
        [0.45, 0.22, 0.14, 0.08],
        n,
        sr,
        [0.55, 0.22, 0.1, 0.05],
    )
    return y


def lever_pull(sr, rng, v):
    n = int(sr * 0.34)
    clunk = modes([160, 310, 90], [0.06, 0.04, 0.1], n, sr, [0.7, 0.4, 0.5])
    spring = karplus(90, 0.2, sr, 0.97, rng, 0.5)
    return clunk + fit(spring, n) * 0.35


# --- ui -----------------------------------------------------------------------

def ui_confirm(sr, rng, v):
    return ui_tone(sr, 610, 915, 0.11)


def ui_back(sr, rng, v):
    return ui_tone(sr, 780, 520, 0.10)


def ui_focus(sr, rng, v):
    f = 1680 if v == 0 else 1840
    return ui_tone(sr, f, f, 0.045, body=0.55)


def ui_open(sr, rng, v):
    return ui_tone(sr, 430, 690, 0.13)


def ui_close(sr, rng, v):
    return ui_tone(sr, 690, 410, 0.12)


def ui_error(sr, rng, v):
    n = int(sr * 0.18)
    t = t_of(n, sr)
    y = np.sin(2 * np.pi * 142 * t) + 0.8 * np.sin(2 * np.pi * 151 * t)
    y *= np.sin(np.pi * np.clip(t / 0.18, 0, 1))
    return y


def ui_pause(sr, rng, v):
    n = int(sr * 0.14)
    air = lowpass(white(n, rng), 500, 0.7, sr)
    tone = sine(300, n, sr) * 0.4
    env = np.sin(np.pi * np.linspace(0, 1, n))
    return (air * 0.35 + tone) * env


def ui_inventory(sr, rng, v):
    return burst(sr, rng, 0.09, 2200, 1.2, 0.02, "bp")


def damage_tick(sr, rng, v):
    n = int(sr * 0.07)
    return modes([540, 880], [0.02, 0.015], n, sr, [0.7, 0.4])


def warn_health(sr, rng, v):
    n = int(sr * 0.62)
    y = np.zeros(n)
    freqs = (98.0, 146.0) if v == 0 else (92.0, 138.0)
    for i, f in enumerate(freqs):
        at = int(sr * (0.02 + i * 0.26))
        dur = int(sr * 0.28)
        pulse = sine(f, dur, sr) * exp_decay(dur, sr, 0.08, 0.008)
        y[at : at + dur] += pulse
    return y


def warn_drown(sr, rng, v):
    bed = burst(sr, rng, 0.55, 280, 0.5, 0.2, "lp", attack=0.01, color="pink")
    bub = bubbles(sr, rng, 7, 0.55, 280, 700)
    return mix(bed * 0.35, bub)


def warn_cold(sr, rng, v):
    n = int(sr * 0.5)
    air = highpass(pink(n, rng), 4000, 0.6, sr)
    t = t_of(n, sr)
    shimmer = np.sin(2 * np.pi * (2400 + 30 * v) * t) * np.exp(-t / 0.2)
    env = np.sin(np.pi * np.clip(t / 0.5, 0, 1))
    return (air * 0.35 + shimmer * 0.4) * env


# --- bosses, death, return ----------------------------------------------------

def boss_stinger(sr, rng, v):
    n = int(sr * 0.85)
    y = modes([55, 63, 82, 110], [0.4, 0.32, 0.24, 0.16], n, sr, [0.9, 0.7, 0.55, 0.25])
    return y


def boss_telegraph(sr, rng, v):
    n = int(sr * 0.48)
    noise = white(n, rng)
    hi = bandpass(noise, 1800, 1.4, sr)
    lo = bandpass(noise, 420, 1.2, sr)
    t = np.linspace(0, 1, n)
    scrape = (lo * (1 - t) + hi * t) * (t ** 1.4)
    metal = modes([760, 1280], [0.12, 0.08], n, sr, [0.25, 0.15]) * t
    return scrape + metal


def boss_roar(sr, rng, v):
    n = int(sr * 1.05)
    t = t_of(n, sr)
    f = 68 + 6 * np.sin(2 * np.pi * 11 * t)
    phase = 2 * np.pi * np.cumsum(f) / sr
    body = np.sin(phase) + 0.5 * np.sin(phase * 1.97) + 0.25 * np.sin(phase * 2.71)
    grit = lowpass(white(n, rng), 500, 0.5, sr)
    env = np.sin(np.pi * np.clip(t / 1.05, 0, 1)) ** 0.7
    return (body * 0.55 + grit * 0.3) * env


def boss_hit(sr, rng, v):
    n = int(sr * 0.4)
    body = modes([48, 96, 180, 340], [0.16, 0.1, 0.06, 0.04], n, sr, [1.0, 0.6, 0.35, 0.2])
    crack = highpass(white(n, rng), 900, 0.7, sr) * exp_decay(n, sr, 0.04, 0.001)
    return body + crack * 0.35


def boss_fall(sr, rng, v):
    n = int(sr * 1.3)
    t = t_of(n, sr)
    f = np.linspace(140, 40, n)
    phase = 2 * np.pi * np.cumsum(f) / sr
    tone = np.sin(phase) * np.exp(-t / 0.55)
    debris = np.zeros(n)
    for _ in range(8):
        at = int(rng.integers(0, int(n * 0.7)))
        dur = int(sr * float(rng.uniform(0.04, 0.1)))
        f0 = float(rng.uniform(300, 1400))
        debris[at : at + dur] += modes([f0], [0.03], dur, sr) * float(rng.uniform(0.2, 0.6))
    return tone * 0.7 + lowpass(debris, 2000, 0.7, sr) * 0.5


def death_cross(sr, rng, v):
    n = int(sr * 1.8)
    t = t_of(n, sr)
    noise = pink(n, rng)
    # Static bands crossfaded to imitate a falling cutoff without per-sample filtering.
    bands = []
    cuts = (2400, 900, 280)
    for c in cuts:
        bands.append(lowpass(noise, c, 0.6, sr))
    w = t
    y = bands[0] * np.clip(1 - w * 1.6, 0, 1)
    y += bands[1] * np.clip(1 - np.abs(w - 0.45) * 2.2, 0, 1)
    y += bands[2] * np.clip((w - 0.35) / 0.65, 0, 1)
    sub = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 36, n)) / sr) * np.exp(-t / 0.8)
    env = np.linspace(1.0, 0.0, n) ** 0.6
    return (y * 0.45 + sub * 0.4) * env


def afterlife_arrive(sr, rng, v):
    n = int(sr * 1.6)
    t = t_of(n, sr)
    swell = np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 1.4
    y = modes([660, 990, 1485, 1980], [0.7, 0.5, 0.35, 0.22], n, sr, [0.45, 0.28, 0.16, 0.08])
    air = bandpass(pink(n, rng), 1800, 0.8, sr) * 0.08
    return (y + air) * swell


def return_years(sr, rng, v):
    """Fourteen pulses. The count is the point, and the audit measures it."""
    seconds = 2.1
    n = int(sr * seconds)
    t = t_of(n, sr)
    tone = 0.62 * np.sin(2 * np.pi * 174 * t) + 0.38 * np.sin(2 * np.pi * 174 * 1.25 * t)
    pulse = np.zeros(n)
    centers = np.linspace(0.08, 2.00, 14)
    for c in centers:
        pulse += np.exp(-((t - c) ** 2) / (2 * (0.022 ** 2)))
    pulse /= np.max(pulse) + 1e-9
    wood = modes([174, 348], [0.4, 0.2], n, sr, [0.25, 0.08])
    y = tone * (0.08 + 0.92 * pulse) * 0.7 + wood * 0.15
    # Land on the last pulse.
    land_at = int(sr * centers[-1])
    land = sine(87, int(sr * 0.25), sr) * exp_decay(int(sr * 0.25), sr, 0.08, 0.004)
    end = min(n, land_at + land.shape[0])
    y[land_at:end] += land[: end - land_at] * 0.55
    return y


# --- ambience -----------------------------------------------------------------

def _wind(n, rng, f0, q):
    return bandpass(pink(n, rng), f0, q, SR)


def amb_town(sr, rng, v):
    n = int(sr * 12.35)
    t = t_of(n, sr)
    wind = _wind(n, rng, 380, 0.45) * (0.65 + 0.35 * np.sin(2 * np.pi * (1 / 12.35) * t))
    # Synthetic activity: narrow noise, not speech.
    babble = bandpass(pink(n, rng), 650, 1.3, sr)
    babble *= 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.37 * t + 1.2))
    bed = lowpass(wind, 900, 0.7, sr) * 0.8 + babble
    bell = lowpass(fm_bell(sr, 466, 1.41, 1.2, 1.8, 0.55), 1600, 0.7, sr) * 0.22
    y = bed
    for at_s in (3.2, 8.4):
        y = mix(y, place(bell, int(sr * at_s), n) * 0.8)
    left = y
    right = lowpass(_wind(n, rng, 520, 0.5), 1000, 0.7, sr) * 0.55 + babble * 0.4
    # Keep a shared low center.
    center = lowpass(pink(n, rng), 180, 0.6, sr) * 0.35
    return stereo_bed([(left + center, -0.35), (right + center, 0.4)])


def amb_forest(sr, rng, v):
    n = int(sr * 12.35)
    t = t_of(n, sr)
    leaves = bandpass(pink(n, rng), 1400, 0.55, sr)
    leaves *= 0.55 + 0.45 * np.sin(2 * np.pi * (2 / 12.35) * t)
    low = lowpass(pink(n, rng), 240, 0.5, sr) * 0.6
    air = leaves * 0.7 + low
    y = air.copy()
    # Chirps stay out of the crossfade tails.
    for at_s, f0 in ((1.1, 2100), (2.4, 2680), (4.6, 1920), (6.3, 2440), (7.8, 1760), (9.4, 2300)):
        c = chirp(sr, rng, f0 * float(rng.uniform(0.97, 1.03)), float(rng.uniform(0.12, 0.2)))
        y += place(c, int(sr * at_s), n) * 0.18
    side = bandpass(pink(n, rng), 1800, 0.6, sr) * 0.25
    return stereo_bed([(y, -0.25), (y * 0.3 + side + low * 0.5, 0.45)])


def amb_water(sr, rng, v):
    n = int(sr * 12.35)
    t = t_of(n, sr)
    wash = lowpass(pink(n, rng), 360, 0.5, sr)
    wash *= 0.7 + 0.3 * np.sin(2 * np.pi * (3 / 12.35) * t)
    laps = np.zeros(n)
    rng_laps = np.random.default_rng(rng.integers(0, 2**31 - 1))
    for k in range(18):
        at = int(sr * (0.6 + k * 0.62))
        if at >= n - 10:
            break
        dur = float(rng_laps.uniform(0.25, 0.55))
        lap = burst(sr, rng_laps, dur, float(rng_laps.uniform(280, 700)), 0.6, dur * 0.45, "bp", attack=0.02)
        laps += place(lap, at, n) * 0.35
    bub = bubbles(sr, rng, 14, 11.2, 400, 1200) * 0.25
    bub = place(bub, int(sr * 0.5), n)
    left = wash * 0.85 + laps
    right = lowpass(pink(n, rng), 420, 0.55, sr) * 0.55 + bub
    return stereo_bed([(left, -0.4), (right, 0.35)])


def amb_quarry(sr, rng, v):
    n = int(sr * 12.35)
    t = t_of(n, sr)
    wind = bandpass(pink(n, rng), 480, 0.4, sr)
    slap = comb(wind, int(sr * 0.041), 0.42, 0.25)
    open_air = lowpass(pink(n, rng), 220, 0.5, sr) * (0.6 + 0.2 * np.sin(2 * np.pi * t / 12.35))
    bed = slap * 0.55 + open_air * 0.5
    y = bed.copy()
    for at_s in (2.2, 5.1, 7.4, 10.2):
        tick = modes([float(rng.uniform(900, 1800))], [0.05], int(sr * 0.12), sr)
        y += place(tick, int(sr * at_s), n) * 0.12
    drip = modes([2200], [0.08], int(sr * 0.2), sr) * 0.15
    y += place(drip, int(sr * 6.6), n)
    side = comb(bandpass(pink(n, rng), 700, 0.5, sr), int(sr * 0.057), 0.3, 0.3) * 0.25
    return stereo_bed([(y, -0.2), (side + open_air * 0.4, 0.55)])


def amb_interior(sr, rng, v):
    n = int(sr * 12.35)
    room = lowpass(pink(n, rng), 180, 0.5, sr) * 0.7
    fire = np.zeros(n)
    for _ in range(70):
        at = int(rng.integers(int(sr * 0.4), int(sr * 11.6)))
        dur = int(sr * float(rng.uniform(0.008, 0.03)))
        if at + dur >= n:
            continue
        pop = highpass(white(dur, rng), 1600, 0.7, sr) * exp_decay(dur, sr, 0.01, 0.0007)
        fire[at : at + dur] += pop * float(rng.uniform(0.15, 0.7))
    fire = lowpass(fire, 5000, 0.7, sr)
    # Soft timber, one creak, not a melody.
    creak = karplus(96, 0.7, sr, 0.995, rng, 0.3) * 0.15
    y = room + fire * 0.45
    y += place(creak, int(sr * 4.4), n)
    ember = bandpass(pink(n, rng), 320, 0.8, sr) * 0.08
    return stereo_bed([(y + ember, -0.15), (room * 0.8 + fire * 0.25, 0.25)])


def amb_afterlife(sr, rng, v):
    seconds = 12.0
    # Build the seamless length directly from integer-cycle partials, then
    # still run the crossfade by synthesizing a little extra.
    n = int(sr * 12.35)
    t = t_of(n, sr)
    # Partials chosen so 12 seconds holds an integer cycle count. The extra
    # 0.35s is only the crossfade tail.
    partials = [
        (110.0, 0.28, 0.5),
        (132.0, 0.18, 0.7),
        (165.0, 0.16, 1.1),
        (220.0, 0.12, 0.9),
        (264.0, 0.08, 1.4),
    ]
    y = np.zeros(n)
    for f, amp, lfo_hz in partials:
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * lfo_hz * t)
        y += amp * lfo * np.sin(2 * np.pi * f * t)
    air = bandpass(pink(n, rng), 2000, 1.0, sr) * 0.04
    y = y + air
    side = bandpass(pink(n, rng), 2600, 1.2, sr) * 0.03
    for f, amp, _ in partials[2:]:
        side = side + amp * 0.25 * np.sin(2 * np.pi * f * t + 0.4)
    return stereo_bed([(y, -0.3), (side + y * 0.35, 0.3)])


def fit(x, n):
    if x.shape[0] == n:
        return x
    if x.shape[0] > n:
        return x[:n]
    y = np.zeros(n, dtype=np.float64)
    y[: x.shape[0]] = x
    return y


RECIPES = {
    name: fn
    for name, fn in globals().items()
    if callable(fn) and (name.startswith("step_") or name.startswith("amb_") or name in {
        "swim_stroke", "swim_surface", "land_soft", "land_hard", "soul_step",
        "blade_swing", "blade_flesh", "blade_stone", "blade_wood", "bow_draw",
        "bow_loose", "arrow_hit", "rod_raise", "rod_block", "fuse_hiss",
        "powder_blast", "hurt_light", "hurt_heavy", "death_sting",
        "shovel_dig", "shovel_lift", "sugar_tap", "sugar_drip", "hammer_strike",
        "hammer_nail", "net_cast", "net_catch", "lamp_light", "lamp_hum",
        "warp_away", "warp_arrive", "cape_snap", "boots_scuff", "fins_kick",
        "stone_slide", "lock_turn", "puzzle_solve", "puzzle_fail", "glass_hum",
        "lever_pull", "ui_confirm", "ui_back", "ui_focus", "ui_open", "ui_close",
        "ui_error", "ui_pause", "ui_inventory", "damage_tick", "warn_health",
        "warn_drown", "warn_cold", "boss_stinger", "boss_telegraph", "boss_roar",
        "boss_hit", "boss_fall", "death_cross", "afterlife_arrive", "return_years",
    })
}


def specs() -> list[Spec]:
    foot = dict(mode="protect", group="footstep", minIntervalMs=85, maxVoices=2)
    ui_soft = dict(mode="protect", group="ui-focus", minIntervalMs=45, maxVoices=1)
    return [
        Spec("step_grass", "movement", "effects", "avatar.footstep", "step_grass",
             "Play on the contact frame. Grass is the softest living surface.",
             variants=3, priority=2, peak_db=-10, overlap=foot, pitch_jitter=0.05,
             surface="grass", event_key="grass", variant_mode="random-no-repeat"),
        Spec("step_dirt", "movement", "effects", "avatar.footstep", "step_dirt",
             "Contact frame. Grit sits forward of the thud.",
             variants=3, priority=2, peak_db=-10, overlap=foot, pitch_jitter=0.05,
             surface="dirt", event_key="dirt", variant_mode="random-no-repeat"),
        Spec("step_stone", "movement", "effects", "avatar.footstep", "step_stone",
             "Contact frame. Transient is the click, not the ring.",
             variants=3, priority=2, peak_db=-9, overlap=foot, pitch_jitter=0.045,
             surface="stone", event_key="stone", variant_mode="random-no-repeat"),
        Spec("step_wood", "movement", "effects", "avatar.footstep", "step_wood",
             "Contact frame on bridges and porches.",
             variants=3, priority=2, peak_db=-9, overlap=foot, pitch_jitter=0.04,
             surface="wood", event_key="wood", variant_mode="random-no-repeat"),
        Spec("step_snow", "movement", "effects", "avatar.footstep", "step_snow",
             "Contact frame. Attack is deliberately late and dull.",
             variants=3, priority=2, peak_db=-11, overlap=foot, pitch_jitter=0.03,
             surface="snow", event_key="snow", variant_mode="random-no-repeat"),
        Spec("step_gravel", "movement", "effects", "avatar.footstep", "step_gravel",
             "Contact frame on quarry paths and road shoulders.",
             variants=3, priority=2, peak_db=-9, overlap=foot, pitch_jitter=0.05,
             surface="gravel", event_key="gravel", variant_mode="random-no-repeat"),
        Spec("step_shallow", "movement", "effects", "avatar.footstep", "step_shallow",
             "Contact frame in wade-depth water, not swimming.",
             variants=3, priority=2, peak_db=-9, overlap=foot, pitch_jitter=0.04,
             surface="shallow", event_key="shallow", variant_mode="random-no-repeat"),
        Spec("step_board", "movement", "effects", "avatar.footstep", "step_board",
             "Contact frame on interior floorboards. Shares the footstep guard with other surfaces.",
             variants=3, priority=2, peak_db=-9, overlap=foot, pitch_jitter=0.04,
             surface="board", event_key="board", variant_mode="random-no-repeat"),
        Spec("swim_stroke", "movement", "effects", "avatar.swim", "swim_stroke",
             "Once per stroke cycle, at the catch.",
             variants=3, priority=3, peak_db=-9, pitch_jitter=0.03, event_key="stroke",
             variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="swim", minIntervalMs=120, maxVoices=2)),
        Spec("swim_surface", "movement", "effects", "avatar.swim", "swim_surface",
             "Breaking the surface. Do not also play a stroke on the same frame.",
             priority=4, peak_db=-8, event_key="surface",
             overlap=dict(mode="protect", group="swim", minIntervalMs=150, maxVoices=2)),
        Spec("land_soft", "movement", "effects", "avatar.land", "land_soft",
             "Frame the feet meet grass, dirt, or snow.",
             priority=5, peak_db=-8, event_key="soft", surface="soft",
             overlap=dict(mode="protect", group="land", minIntervalMs=120, maxVoices=1)),
        Spec("land_hard", "movement", "effects", "avatar.land", "land_hard",
             "Frame the feet meet stone, wood, or board.",
             priority=5, peak_db=-7, event_key="hard", surface="hard",
             overlap=dict(mode="protect", group="land", minIntervalMs=120, maxVoices=1)),
        Spec("soul_step", "movement", "effects", "avatar.soulstep", "soul_step",
             "Afterlife contact. Do not use living surfaces there.",
             variants=3, priority=3, peak_db=-12, pitch_jitter=0.02,
             variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="footstep", minIntervalMs=110, maxVoices=2)),
        Spec("blade_swing", "combat", "effects", "weapon.blade", "blade_swing",
             "Start of the swing, about 40 ms before the earliest possible hit.",
             variants=3, priority=6, peak_db=-7, pitch_jitter=0.04, event_key="swing",
             variant_mode="random-no-repeat",
             overlap=dict(mode="poly", group="blade-swing", minIntervalMs=70, maxVoices=2)),
        Spec("blade_flesh", "combat", "effects", "weapon.blade", "blade_flesh",
             "On damage confirmation against a soft body.",
             variants=2, priority=7, peak_db=-6, event_key="flesh",
             overlap=dict(mode="poly", group="blade-hit", minIntervalMs=40, maxVoices=3)),
        Spec("blade_stone", "combat", "effects", "weapon.blade", "blade_stone",
             "On a blade connecting with stone.",
             variants=2, priority=7, peak_db=-6, event_key="stone",
             overlap=dict(mode="poly", group="blade-hit", minIntervalMs=40, maxVoices=3)),
        Spec("blade_wood", "combat", "effects", "weapon.blade", "blade_wood",
             "On a blade connecting with wood.",
             variants=2, priority=7, peak_db=-6, event_key="wood",
             overlap=dict(mode="poly", group="blade-hit", minIntervalMs=40, maxVoices=3)),
        Spec("bow_draw", "combat", "effects", "weapon.bow", "bow_draw",
             "Start when the draw begins. Cut if the draw is cancelled; the tail is short.",
             priority=5, peak_db=-10, event_key="draw",
             overlap=dict(mode="replace", group="bow", minIntervalMs=0, maxVoices=1)),
        Spec("bow_loose", "combat", "effects", "weapon.bow", "bow_loose",
             "The frame the string leaves the fingers. Stops a draw if one is still playing.",
             variants=2, priority=7, peak_db=-7, event_key="loose",
             overlap=dict(mode="protect", group="bow-loose", minIntervalMs=80, maxVoices=2)),
        Spec("arrow_hit", "combat", "effects", "weapon.arrow", "arrow_hit",
             "On impact, not on release.",
             variants=2, priority=7, peak_db=-7, event_key="hit",
             overlap=dict(mode="poly", group="arrow", minIntervalMs=30, maxVoices=4)),
        Spec("rod_raise", "combat", "effects", "weapon.rod", "rod_raise",
             "Block-rod comes up. Lead the pose by the attack, about 20 ms.",
             priority=5, peak_db=-9, event_key="raise",
             overlap=dict(mode="replace", group="rod", minIntervalMs=60, maxVoices=1)),
        Spec("rod_block", "combat", "effects", "weapon.rod", "rod_block",
             "A hit was stopped by the rod.",
             variants=2, priority=8, peak_db=-6, event_key="block",
             overlap=dict(mode="poly", group="rod-block", minIntervalMs=50, maxVoices=2)),
        Spec("fuse_hiss", "combat", "effects", "weapon.keg", "fuse_hiss",
             "When a keg is lit. Stop it if the fuse is quenched.",
             priority=6, peak_db=-12, event_key="fuse",
             overlap=dict(mode="replace", group="fuse", minIntervalMs=0, maxVoices=2)),
        Spec("powder_blast", "combat", "effects", "weapon.keg", "powder_blast",
             "Detonation frame. Ducks ambience. Visual flash is mandatory even if muted.",
             priority=10, peak_db=-4, event_key="blast",
             overlap=dict(mode="protect", group="blast", minIntervalMs=250, maxVoices=2),
             duck=dict(bus="ambience", gain=0.32, holdMs=700, releaseMs=600),
             warning=dict(kind="flash", copy="The keg goes up.", tone="danger", persistMs=420)),
        Spec("hurt_light", "damage", "effects", "avatar.hurt", "hurt_light",
             "Small health loss. Do not also play a weapon hit on the avatar.",
             variants=2, priority=8, peak_db=-7, event_key="light",
             overlap=dict(mode="protect", group="hurt", minIntervalMs=140, maxVoices=2)),
        Spec("hurt_heavy", "damage", "effects", "avatar.hurt", "hurt_heavy",
             "Large health loss.",
             variants=2, priority=8, peak_db=-6, event_key="heavy",
             overlap=dict(mode="protect", group="hurt", minIntervalMs=180, maxVoices=2)),
        Spec("death_sting", "death", "effects", "avatar.death", "death_sting",
             "The frame health reaches zero. Visual iris starts with it.",
             priority=10, peak_db=-6,
             overlap=dict(mode="replace", group="death", minIntervalMs=0, maxVoices=1),
             warning=dict(kind="iris", copy="The light leaves.", tone="danger", persistMs=900)),
        Spec("shovel_dig", "tools", "effects", "tool.shovel", "shovel_dig",
             "Each dig stroke, at the moment the blade enters.",
             variants=3, priority=4, peak_db=-8, event_key="dig", pitch_jitter=0.03,
             variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="shovel", minIntervalMs=110, maxVoices=2)),
        Spec("shovel_lift", "tools", "effects", "tool.shovel", "shovel_lift",
             "Soil leaving the blade.",
             priority=4, peak_db=-10, event_key="lift",
             overlap=dict(mode="protect", group="shovel", minIntervalMs=90, maxVoices=2)),
        Spec("sugar_tap", "tools", "effects", "tool.sugar", "sugar_tap",
             "Spile driven into the trunk.",
             variants=2, priority=4, peak_db=-8, event_key="tap",
             overlap=dict(mode="protect", group="sugar", minIntervalMs=120, maxVoices=2)),
        Spec("sugar_drip", "tools", "effects", "tool.sugar", "sugar_drip",
             "A single drip into the bucket. Safe to call on a slow timer.",
             variants=3, priority=2, peak_db=-12, event_key="drip", pitch_jitter=0.05,
             variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="drip", minIntervalMs=120, maxVoices=3)),
        Spec("hammer_strike", "tools", "effects", "tool.hammer", "hammer_strike",
             "Each hammer fall.",
             variants=3, priority=5, peak_db=-7, event_key="strike", pitch_jitter=0.03,
             variant_mode="random-no-repeat",
             overlap=dict(mode="poly", group="hammer", minIntervalMs=60, maxVoices=3)),
        Spec("hammer_nail", "tools", "effects", "tool.hammer", "hammer_nail",
             "Nail set. Two transients are already inside the cue; do not double-trigger.",
             variants=2, priority=5, peak_db=-8, event_key="nail",
             overlap=dict(mode="protect", group="nail", minIntervalMs=150, maxVoices=2)),
        Spec("net_cast", "tools", "effects", "tool.net", "net_cast",
             "The throw.",
             variants=2, priority=5, peak_db=-8, event_key="cast",
             overlap=dict(mode="protect", group="net", minIntervalMs=150, maxVoices=1)),
        Spec("net_catch", "tools", "effects", "tool.net", "net_catch",
             "Something lands in the net.",
             variants=2, priority=6, peak_db=-8, event_key="catch",
             overlap=dict(mode="protect", group="net", minIntervalMs=100, maxVoices=2)),
        Spec("lamp_light", "tools", "effects", "tool.lamp", "lamp_light",
             "Ignition. Follow with lamp_hum if the lamp stays lit.",
             priority=5, peak_db=-9, event_key="light",
             overlap=dict(mode="replace", group="lamp-light", minIntervalMs=80, maxVoices=1)),
        Spec("lamp_hum", "tools", "effects", "tool.lamp", "lamp_hum",
             "Seamless two-second loop while the lamp burns. Replace, do not stack.",
             priority=2, peak_db=-16, loop=True, event_key="hum",
             overlap=dict(mode="replace", group="lamp-hum", minIntervalMs=0, maxVoices=1)),
        Spec("warp_away", "tools", "effects", "tool.warp", "warp_away",
             "Glass warp departure. Hold gameplay for the cue's onset, not its tail.",
             priority=8, peak_db=-7, event_key="away",
             overlap=dict(mode="replace", group="warp", minIntervalMs=0, maxVoices=1)),
        Spec("warp_arrive", "tools", "effects", "tool.warp", "warp_arrive",
             "Glass warp arrival, when the destination is already on screen.",
             priority=8, peak_db=-7, event_key="arrive",
             overlap=dict(mode="replace", group="warp", minIntervalMs=0, maxVoices=1)),
        Spec("cape_snap", "tools", "effects", "tool.cape", "cape_snap",
             "Cape opens or a hard turn catches it. Not every frame of movement.",
             variants=3, priority=3, peak_db=-10, pitch_jitter=0.04, variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="cape", minIntervalMs=160, maxVoices=2)),
        Spec("boots_scuff", "tools", "effects", "tool.boots", "boots_scuff",
             "A pivot or short skid. Not a footstep.",
             variants=2, priority=3, peak_db=-11, event_key="scuff",
             overlap=dict(mode="protect", group="scuff", minIntervalMs=90, maxVoices=2)),
        Spec("fins_kick", "tools", "effects", "tool.fins", "fins_kick",
             "Kick cycle while fins are equipped. Replaces swim_stroke, do not layer both.",
             variants=3, priority=3, peak_db=-9, pitch_jitter=0.03, variant_mode="random-no-repeat",
             overlap=dict(mode="protect", group="swim", minIntervalMs=120, maxVoices=2)),
        Spec("stone_slide", "puzzles", "effects", "puzzle.slide", "stone_slide",
             "While a stone is moving. Restart if it stops and starts again.",
             priority=5, peak_db=-9,
             overlap=dict(mode="replace", group="slide", minIntervalMs=0, maxVoices=1)),
        Spec("lock_turn", "puzzles", "effects", "puzzle.lock", "lock_turn",
             "A mechanism advances one step.",
             priority=5, peak_db=-8,
             overlap=dict(mode="protect", group="lock", minIntervalMs=80, maxVoices=2)),
        Spec("puzzle_solve", "puzzles", "effects", "puzzle.solve", "puzzle_solve",
             "Puzzle completed. One-shot, do not retrigger on the same solve.",
             priority=7, peak_db=-10,
             overlap=dict(mode="replace", group="solve", minIntervalMs=400, maxVoices=1)),
        Spec("puzzle_fail", "puzzles", "effects", "puzzle.fail", "puzzle_fail",
             "Rejected move.",
             priority=6, peak_db=-8,
             overlap=dict(mode="protect", group="fail", minIntervalMs=120, maxVoices=1)),
        Spec("glass_hum", "puzzles", "effects", "puzzle.glass", "glass_hum",
             "A glass piece is seated and rings.",
             priority=5, peak_db=-12,
             overlap=dict(mode="poly", group="glass", minIntervalMs=40, maxVoices=3)),
        Spec("lever_pull", "puzzles", "effects", "puzzle.lever", "lever_pull",
             "Lever changes state.",
             priority=6, peak_db=-8,
             overlap=dict(mode="protect", group="lever", minIntervalMs=150, maxVoices=1)),
        Spec("ui_confirm", "ui", "ui", "ui.confirm", "ui_confirm",
             "Accept, equip, or close a choice. Keep it off the effects bus.",
             priority=5, peak_db=-14,
             overlap=dict(mode="protect", group="ui-action", minIntervalMs=40, maxVoices=2)),
        Spec("ui_back", "ui", "ui", "ui.back", "ui_back",
             "Cancel or step back.",
             priority=5, peak_db=-15,
             overlap=dict(mode="protect", group="ui-action", minIntervalMs=40, maxVoices=2)),
        Spec("ui_focus", "ui", "ui", "ui.focus", "ui_focus",
             "Cursor moved. Overlap guard is tight because lists scroll fast.",
             variants=2, priority=1, peak_db=-18, variant_mode="round-robin",
             overlap=ui_soft),
        Spec("ui_open", "ui", "ui", "ui.open", "ui_open",
             "A panel opens.",
             priority=5, peak_db=-14,
             overlap=dict(mode="replace", group="ui-panel", minIntervalMs=30, maxVoices=1)),
        Spec("ui_close", "ui", "ui", "ui.close", "ui_close",
             "A panel closes.",
             priority=5, peak_db=-15,
             overlap=dict(mode="replace", group="ui-panel", minIntervalMs=30, maxVoices=1)),
        Spec("ui_error", "ui", "ui", "ui.error", "ui_error",
             "Rejected UI action. Banner is the visual equivalent; do not rely on the tone alone.",
             priority=9, peak_db=-10,
             overlap=dict(mode="protect", group="ui-error", minIntervalMs=180, maxVoices=1),
             warning=dict(kind="banner", copy="That won't take.", tone="danger", persistMs=900)),
        Spec("ui_pause", "ui", "ui", "ui.pause", "ui_pause",
             "Pause menu toggled. This is not the engine suspend.",
             priority=6, peak_db=-14,
             overlap=dict(mode="replace", group="ui-pause", minIntervalMs=80, maxVoices=1)),
        Spec("ui_inventory", "ui", "ui", "ui.inventory", "ui_inventory",
             "An item moved between slots.",
             priority=3, peak_db=-16,
             overlap=dict(mode="protect", group="ui-inv", minIntervalMs=50, maxVoices=2)),
        Spec("damage_tick", "damage", "effects", "status.damage", "damage_tick",
             "Repeating hazard tick (brambles, cold drip, quarry dust). Pair with the meter, not instead of it.",
             priority=7, peak_db=-9,
             overlap=dict(mode="protect", group="dot", minIntervalMs=160, maxVoices=1)),
        Spec("warn_health", "damage", "effects", "status.warn", "warn_health",
             "Low health threshold crossed or re-armed. Vignette is required.",
             variants=2, priority=9, peak_db=-9, event_key="health", variant_mode="round-robin",
             overlap=dict(mode="protect", group="warn-health", minIntervalMs=500, maxVoices=1),
             warning=dict(kind="vignette", copy="You are badly hurt.", tone="danger", persistMs=800)),
        Spec("warn_drown", "damage", "effects", "status.warn", "warn_drown",
             "Breath nearly gone. The rising breath mark is the visual equivalent.",
             variants=2, priority=9, peak_db=-10, event_key="drown", variant_mode="round-robin",
             overlap=dict(mode="protect", group="warn-drown", minIntervalMs=600, maxVoices=1),
             warning=dict(kind="drown", copy="You need air.", tone="danger", persistMs=800)),
        Spec("warn_cold", "damage", "effects", "status.warn", "warn_cold",
             "Cold is about to take health. Frost on the frame is the visual equivalent.",
             variants=2, priority=9, peak_db=-12, event_key="cold", variant_mode="round-robin",
             overlap=dict(mode="protect", group="warn-cold", minIntervalMs=700, maxVoices=1),
             warning=dict(kind="frost", copy="The cold is in you.", tone="danger", persistMs=800)),
        Spec("boss_stinger", "boss", "effects", "boss.stinger", "boss_stinger",
             "Boss encounter starts. Not a music cue; the score bus stays free.",
             priority=9, peak_db=-6,
             overlap=dict(mode="replace", group="boss-stinger", minIntervalMs=500, maxVoices=1)),
        Spec("boss_telegraph", "boss", "effects", "boss.telegraph", "boss_telegraph",
             "Play about 450 ms before the hit lands. The ring on the ground is mandatory.",
             priority=10, peak_db=-7,
             overlap=dict(mode="replace", group="telegraph", minIntervalMs=200, maxVoices=1),
             warning=dict(kind="telegraph", copy="It is about to strike.", tone="danger", persistMs=480)),
        Spec("boss_roar", "boss", "effects", "boss.roar", "boss_roar",
             "Boss vocalization or heavy tell that is the attack itself. Ducks ambience.",
             priority=9, peak_db=-5,
             overlap=dict(mode="protect", group="roar", minIntervalMs=300, maxVoices=1),
             duck=dict(bus="ambience", gain=0.4, holdMs=600, releaseMs=500),
             warning=dict(kind="shake", copy="The ground answers.", tone="danger", persistMs=500)),
        Spec("boss_hit", "boss", "effects", "boss.hit", "boss_hit",
             "A heavy boss blow connected.",
             priority=9, peak_db=-5,
             overlap=dict(mode="poly", group="boss-hit", minIntervalMs=80, maxVoices=2)),
        Spec("boss_fall", "boss", "effects", "boss.fall", "boss_fall",
             "Boss defeated. Do not also play the ordinary death sting.",
             priority=9, peak_db=-6,
             overlap=dict(mode="replace", group="boss-fall", minIntervalMs=0, maxVoices=1)),
        Spec("death_cross", "death", "effects", "avatar.death.cross", "death_cross",
             "Passage into the afterlife after the sting. Iris continues.",
             priority=10, peak_db=-8,
             overlap=dict(mode="replace", group="death-cross", minIntervalMs=0, maxVoices=1),
             warning=dict(kind="iris", copy="Fourteen years will pass.", tone="afterlife", persistMs=1600)),
        Spec("afterlife_arrive", "afterlife", "effects", "afterlife.arrive", "afterlife_arrive",
             "The afterlife zone is visible. Start amb_afterlife underneath, quieter.",
             priority=8, peak_db=-10,
             overlap=dict(mode="replace", group="afterlife-arrive", minIntervalMs=0, maxVoices=1)),
        Spec("return_years", "return", "effects", "world.return", "return_years",
             "The return, fourteen years on. Fourteen pulses are in the file; land gameplay on the last one.",
             priority=10, peak_db=-8,
             overlap=dict(mode="replace", group="return", minIntervalMs=0, maxVoices=1),
             warning=dict(kind="return", copy="Fourteen years later.", tone="return", persistMs=2100)),
        Spec("amb_town", "ambience", "ambience", "ambience.zone", "amb_town",
             "Seamless town bed: wind, distant activity, two far bell strokes. Not music.",
             priority=1, lufs_db=-26, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="town",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
        Spec("amb_forest", "ambience", "ambience", "ambience.zone", "amb_forest",
             "Seamless woods. Chirps are synthetic and sit inside the loop, clear of the join.",
             priority=1, lufs_db=-26, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="forest",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
        Spec("amb_water", "ambience", "ambience", "ambience.zone", "amb_water",
             "Seamless shore or river. Lap pattern stays out of the crossfade.",
             priority=1, lufs_db=-26, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="water",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
        Spec("amb_quarry", "ambience", "ambience", "ambience.zone", "amb_quarry",
             "Seamless quarry. Comb delay is the stone slapback.",
             priority=1, lufs_db=-26, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="quarry",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
        Spec("amb_interior", "ambience", "ambience", "ambience.zone", "amb_interior",
             "Seamless room: hush, fire, one timber creak.",
             priority=1, lufs_db=-28, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="interior",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
        Spec("amb_afterlife", "ambience", "ambience", "ambience.zone", "amb_afterlife",
             "Seamless afterlife bed. Partials are an original just cluster, not a quoted theme.",
             priority=1, lufs_db=-28, peak_db=None, loop=True, seamless_fade_ms=350,
             event_key="afterlife",
             overlap=dict(mode="replace", group="ambience", minIntervalMs=0, maxVoices=1)),
    ]


def render_spec(spec: Spec) -> list[Path]:
    paths = []
    sub = "ambience" if spec.bus == "ambience" else spec.bus
    folder = ROOT / "audio" / sub
    for v in range(spec.variants):
        seed = MASTER_SEED * 100000 + _id_seed(spec.id) * 10 + v
        rng = S(seed)
        audio = RECIPES[spec.recipe](SR, rng, v)
        if spec.loop and spec.seamless_fade_ms:
            audio = finish_bed(audio, SR, spec.lufs_db, spec.seamless_fade_ms)
        elif spec.loop:
            audio = normalize_peak(np.asarray(audio, dtype=np.float64), spec.peak_db)
            audio = limit_true_peak(audio, -1.0)
        else:
            audio = finish_one_shot(audio, SR, spec.peak_db)
        name = f"{spec.id}.wav" if spec.variants == 1 else f"{spec.id}_{v+1:02d}.wav"
        path = folder / name
        write_wav(path, audio, SR)
        paths.append(path)
        print(f"  {path.relative_to(ROOT)}", flush=True)
    return paths


def _id_seed(cue_id: str) -> int:
    acc = 0
    for ch in cue_id:
        acc = (acc * 33 + ord(ch)) & 0x7FFFFFFF
    return acc


def build_manifest(rendered: list[tuple[Spec, list[Path]]]) -> dict:
    cues = []
    routing: dict[str, dict] = {}
    for spec, paths in rendered:
        files = []
        for path in paths:
            measured = analyze_file(path)
            measured["path"] = str(path.relative_to(ROOT))
            files.append(measured)
        cue = {
            "id": spec.id,
            "category": spec.category,
            "bus": spec.bus,
            "event": spec.event,
            "eventKey": spec.event_key,
            "surface": spec.surface,
            "priority": spec.priority,
            "loop": spec.loop,
            "pitchJitter": spec.pitch_jitter,
            "variantMode": spec.variant_mode,
            "overlap": spec.overlap,
            "duck": spec.duck,
            "warning": spec.warning,
            "timingNotes": spec.timing_notes,
            "syncMs": min(f["onsetMs"] for f in files),
            "peakAtMs": [f["peakMs"] for f in files],
            "durationMs": [f["durationMs"] for f in files],
            "files": files,
            "source": {
                "generator": "synth/generate.py",
                "recipe": spec.recipe,
                "sampleRate": SR,
                "masterSeed": MASTER_SEED,
                "license": "original-synthesis",
                "thirdPartySamples": False,
            },
        }
        cues.append(cue)
        if spec.event_key:
            routing.setdefault(spec.event, {})[spec.event_key] = spec.id
        else:
            routing.setdefault(spec.event, {})["default"] = spec.id
    return {
        "game": "PREINCARNATION",
        "title": "Addison County cue manifest",
        "version": 1,
        "loudness": {
            "method": "Peak, RMS, and estimated true peak are measured from the written 16-bit files. LUFS uses ITU-R BS.1770 K-weighting (pre-filter + RLB highpass) with absolute and relative gating when the file is at least one second. Shorter cues are reported as ungated K-weighted loudness because a 400 ms gate does not fit.",
            "headroomRule": "Float audio is true-peak limited to -1 dBTP before 16-bit quantization. The audit fails if any sample hits ±32767.",
        },
        "buses": ["music", "ambience", "effects", "ui"],
        "poolLimits": POOL_LIMITS,
        "music": {
            "bundled": False,
            "note": "The music bus is empty on purpose. Another session owns the score. Do not drop music files into this folder.",
        },
        "gameplayCoupling": False,
        "muteContract": "Mute and suspend change gain or the audio device clock only. They do not write health, position, inventory, or quest state. Warning cues still emit their visual payload when muted, suspended, or locked.",
        "routing": routing,
        "cueCount": len(cues),
        "cues": cues,
    }


def main() -> None:
    catalogue = specs()
    missing = [s.recipe for s in catalogue if s.recipe not in RECIPES]
    if missing:
        raise SystemExit(f"missing recipes: {missing}")
    ids = [s.id for s in catalogue]
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate cue ids")
    print(f"rendering {len(catalogue)} cues", flush=True)
    rendered = []
    for spec in catalogue:
        print(spec.id, flush=True)
        rendered.append((spec, render_spec(spec)))
    manifest = build_manifest(rendered)
    out = ROOT / "manifest" / "cues.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"wrote {out.relative_to(ROOT)} cues={manifest['cueCount']}", flush=True)


if __name__ == "__main__":
    main()
