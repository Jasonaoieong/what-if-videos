"""Procedural cartoon audio for Norbert episodes: bouncy music bed + pops + boing + fly buzz.

python3 audio.py <out.wav> <seconds> --pops 0.3,2.0,... [--boing 3.8] [--buzz]
"""
import sys

import numpy as np
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(3)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a, d):
    e = np.ones(n)
    a = max(1, int(a * SR))
    e[:a] = np.linspace(0, 1, a)
    e[a:] = np.exp(-np.arange(n - a) / (d * SR))
    return e


def add(buf, x, at):
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if i < len(buf):
        buf[i:j] += x[: j - i]


def pluck(f, sec=0.35, vol=0.25):
    t = t_(sec)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 + np.sin(2 * np.pi * f * t)
    return x * env(len(t), 0.003, 0.09) * vol


def music(sec, bpm=118):
    buf = np.zeros(int(sec * SR))
    beat = 60 / bpm
    prog = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7)]
    melody = [0, 2, 1, 2, 0, 1, 2, 1]
    n = int(sec / beat) + 1
    for i in range(n):
        at = i * beat
        ch = prog[(i // 4) % 4]
        # bass on every beat
        add(buf, pluck(ch[0] / 2, 0.25, 0.32), at)
        # bouncy offbeat chord
        for f in ch:
            add(buf, pluck(f, 0.18, 0.07), at + beat / 2)
        # little melody on 8ths
        add(buf, pluck(ch[melody[i % 8]] * 2, 0.15, 0.06), at + beat * 0.25 * (i % 2))
        # kick + hat
        tk = t_(0.15)
        add(buf, np.sin(2 * np.pi * (110 - 400 * tk) * tk) * env(len(tk), 0.001, 0.05) * 0.45, at)
        add(buf, rng.standard_normal(int(0.03 * SR)) * env(int(0.03 * SR), 0.001, 0.008) * 0.06, at + beat / 2)
    return buf


def pop():
    t = t_(0.12)
    f = 500 + 1400 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.035) * 0.5


def boing():
    t = t_(0.7)
    f = 160 + 90 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 3)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.005, 0.25) * 0.5


def whoosh():
    n = int(0.3 * SR)
    x = rng.standard_normal(n)
    from scipy.signal import butter, sosfilt
    out = np.zeros(n)
    for i, f in enumerate(np.linspace(600, 3000, 6)):
        seg = slice(i * n // 6, (i + 1) * n // 6)
        out[seg] = sosfilt(butter(2, [f * 0.7, f * 1.3], "band", fs=SR, output="sos"), x)[seg]
    return out * np.sin(np.linspace(0, np.pi, n)) * 0.35


def ding():
    t = t_(1.0)
    return (np.sin(2 * np.pi * 2093 * t) + 0.5 * np.sin(2 * np.pi * 3136 * t)) * env(len(t), 0.002, 0.25) * 0.3


def scratch():
    t = t_(0.45)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3.5 * t))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + rng.standard_normal(len(t)) * 0.5
    return x * env(len(t), 0.002, 0.2) * 0.35


def vibrate():
    t = t_(0.9)
    x = np.sign(np.sin(2 * np.pi * 150 * t)) * (np.sin(2 * np.pi * 2.2 * t) > 0)
    return x * 0.12


def drill():
    t = t_(3.0)
    f = 2400 + 300 * np.sin(2 * np.pi * 5 * t) + 200 * np.sin(2 * np.pi * 0.7 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR))
    am = np.clip(np.sin(np.pi * t / 3.0) * 3, 0, 1) * (0.7 + 0.3 * (np.sin(2 * np.pi * 1.3 * t) > 0))
    return x * am * 0.12


def tick():
    out = np.zeros(int(1.6 * SR))
    for i in range(8):
        tt = t_(0.03)
        add(out, np.sin(2 * np.pi * 3000 * tt) * env(len(tt), 0.001, 0.006) * 0.25, i * 0.2)
    return out


def chime():
    out = np.zeros(int(1.4 * SR))
    for i, f in enumerate((1568, 2093, 2637, 3136)):
        tt = t_(0.9)
        add(out, np.sin(2 * np.pi * f * tt) * env(len(tt), 0.002, 0.3) * 0.18, i * 0.07)
    return out


def drone(sec):
    """Low horror bed: detuned sub tones + slowly breathing filtered noise."""
    from scipy.signal import butter, sosfilt
    t = t_(sec)
    x = (np.sin(2 * np.pi * 43.65 * t) + 0.7 * np.sin(2 * np.pi * 46.2 * t) + 0.35 * np.sin(2 * np.pi * 87.3 * t + np.sin(t * 0.3)))
    n = sosfilt(butter(2, [180, 900], "band", fs=SR, output="sos"), rng.standard_normal(len(t)))
    breath = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t)
    hi = np.sin(2 * np.pi * 1760 * t + 3 * np.sin(2 * np.pi * 0.2 * t)) * 0.03 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
    return x * 0.5 + n * 0.25 * breath + hi


def knock():
    out = np.zeros(int(1.4 * SR))
    for i, at in enumerate((0.0, 0.32, 0.64)):
        tt = t_(0.18)
        hit = (np.sin(2 * np.pi * 95 * tt) + 0.6 * rng.standard_normal(len(tt)) * np.exp(-tt * 60)) * env(len(tt), 0.001, 0.05)
        add(out, hit * 0.8, at)
    return out


def heartbeat():
    out = np.zeros(int(3.0 * SR))
    for k in range(4):
        for j, d in enumerate((0.0, 0.22)):
            tt = t_(0.2)
            add(out, np.sin(2 * np.pi * 55 * tt) * env(len(tt), 0.004, 0.06) * (0.9 - 0.3 * j), k * 0.75 + d)
    return out


def stinger():
    t = t_(1.6)
    x = sum(np.sin(2 * np.pi * f * t) for f in (311, 329.6, 466, 493.9, 987.8)) / 3
    x += rng.standard_normal(len(t)) * 0.8
    x += np.sin(2 * np.pi * (60 - 30 * t) * t) * 1.2
    return np.clip(x * env(len(t), 0.002, 0.45), -1, 1) * 0.95


def creak():
    t = t_(1.2)
    f = 180 + 80 * np.sin(2 * np.pi * 0.8 * t) + 30 * np.sin(2 * np.pi * 13 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    return x * np.sin(np.pi * t / 1.2) * 0.12


def clock3():
    out = np.zeros(int(3.2 * SR))
    for i in range(4):
        tt = t_(0.04)
        add(out, np.sin(2 * np.pi * 2200 * tt) * env(len(tt), 0.001, 0.01) * 0.3, i * 1.0)
    return out


def cry(sec=3.0):
    """Synthetic baby cry: vibrato 'waah' bursts through two formant bands."""
    from scipy.signal import butter, sosfilt
    out = np.zeros(int(sec * SR))
    at = 0.0
    while at < sec - 0.5:
        d = 0.55 + 0.25 * rng.random()
        tt = t_(d)
        f0 = 480 + 120 * np.sin(np.pi * tt / d) + 25 * np.sin(2 * np.pi * 7 * tt)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)) * 0.6 + np.sin(2 * np.pi * np.cumsum(f0) / SR)
        x = sosfilt(butter(2, [900, 1500], "band", fs=SR, output="sos"), x) + 0.6 * sosfilt(butter(2, [2600, 3400], "band", fs=SR, output="sos"), x)
        add(out, x * np.sin(np.pi * tt / d) ** 0.6 * 0.5, at)
        at += d + 0.18
    return out


def ring():
    out = np.zeros(int(2.6 * SR))
    for k in range(2):
        tt = t_(0.9)
        add(out, (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * 0.12 * (np.sin(2 * np.pi * 20 * tt) > 0), k * 1.3)
    return out


def static(sec=0.8):
    from scipy.signal import butter, sosfilt
    x = sosfilt(butter(2, 1500, "high", fs=SR, output="sos"), rng.standard_normal(int(sec * SR)))
    return x * env(len(x), 0.005, sec * 0.6) * 0.35


def siren(sec=6.0):
    t = t_(sec)
    f = 620 + 280 * np.sin(2 * np.pi * 0.25 * t - np.pi / 2)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return x * 0.16 * np.clip(t * 2, 0, 1) * np.clip((sec - t) * 1.5, 0, 1)


def rumble(sec=4.0):
    from scipy.signal import butter, sosfilt
    n = sosfilt(butter(3, 120, "low", fs=SR, output="sos"), rng.standard_normal(int(sec * SR)))
    t = t_(sec)
    hit = np.sin(2 * np.pi * (45 - 20 * t / sec) * t)
    return (n * 6 + hit) * env(len(t), 0.01, sec * 0.45) * 0.9


def slam():
    tt = t_(0.6)
    x = np.sin(2 * np.pi * (70 - 30 * tt) * tt) + rng.standard_normal(len(tt)) * np.exp(-tt * 40) * 0.8
    return x * env(len(tt), 0.001, 0.15) * 0.9


def crowd(sec=5.0):
    from scipy.signal import butter, sosfilt
    x = sosfilt(butter(2, [300, 2500], "band", fs=SR, output="sos"), rng.standard_normal(int(sec * SR)))
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 3.3 * t_(sec)) * np.sin(2 * np.pi * 0.7 * t_(sec))
    return x * am * 0.18 * np.clip((sec - t_(sec)) * 2, 0, 1)


def buzz(sec):
    t = t_(sec)
    f = 210 + 25 * np.sin(2 * np.pi * 0.7 * t) + 15 * np.sin(2 * np.pi * 1.9 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t) ** 2
    return x * am * 0.018


def main():
    out, sec = sys.argv[1], float(sys.argv[2])
    args = sys.argv[3:]
    buf = music(sec) * 0.55
    if "--pops" in args:
        for p in args[args.index("--pops") + 1].split(","):
            add(buf, pop(), float(p))
    if "--boing" in args:
        for p in args[args.index("--boing") + 1].split(","):
            add(buf, boing(), float(p))
    if "--buzz" in args:
        buf += buzz(sec)
    fade = int(0.4 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.85
    wavfile.write(out, SR, (np.stack([buf, buf], 1) * 32767).astype(np.int16))
    print("wrote", out)


if __name__ == "__main__":
    main()
