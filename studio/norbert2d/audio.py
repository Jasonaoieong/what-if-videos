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
