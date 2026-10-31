#!/usr/bin/env python3
"""Generate an original procedural SFX + music library (48 kHz stereo WAV).
Any file can be replaced by an ElevenLabs/own sound with the same name."""
import os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
R = np.random.default_rng(7)


def env(n, a, d):  # attack/decay envelope in samples (exp decay)
    e = np.ones(n); a = max(1, int(a * SR))
    e[:a] = np.linspace(0, 1, a)
    e[a:] = np.exp(-np.arange(n - a) / (d * SR))
    return e


def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(sec): return R.standard_normal(int(sec * SR))
def t_(sec): return np.arange(int(sec * SR)) / SR


def stereo(x, width=0.3):
    d = int(0.011 * SR)
    l = x; r = np.concatenate([np.zeros(d), x[:-d]]) if width else x
    return np.stack([l * (1 - width / 2) + r * width / 2, r * (1 - width / 2) + l * width / 2], 1)


def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak


def sub_drop(sec, f0, f1):
    t = t_(sec); f = f0 * (f1 / f0) ** (t / sec)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


LIB = {}
LIB['tick'] = lambda: norm(hp(noise(.03) * env(int(.03 * SR), .0005, .004), 2500) + np.sin(2 * np.pi * 2200 * t_(.03)) * env(int(.03 * SR), .0003, .006), .5)
LIB['whoosh'] = lambda: norm(bp(noise(1.2), 300, 3000) * np.sin(np.pi * t_(1.2) / 1.2) ** 3)
LIB['cloud_whoosh'] = lambda: norm(lp(noise(2.2), 1400) * np.sin(np.pi * t_(2.2) / 2.2) ** 2)
LIB['hit_open'] = lambda: norm(sub_drop(2.5, 90, 35) * env(int(2.5 * SR), .003, .7) + lp(noise(2.5), 300) * env(int(2.5 * SR), .001, .15) * .6)
LIB['bass_hit'] = lambda: norm(sub_drop(2.0, 70, 32) * env(int(2 * SR), .002, .6) + lp(noise(2.0), 180) * env(int(2 * SR), .001, .2))
LIB['hit_reveal'] = lambda: norm(sum(np.sin(2 * np.pi * f * t_(3.0)) * env(int(3 * SR), .002, 1.1) / (i + 1) for i, f in enumerate([55, 110, 164.8, 220])) + lp(noise(3.0), 500) * env(int(3 * SR), .001, .1))
LIB['hit_final'] = lambda: norm(sum(np.sin(2 * np.pi * f * t_(5.0)) * env(int(5 * SR), .004, 2.2) / (i + 1) for i, f in enumerate([41.2, 82.4, 123.5, 164.8, 246.9])))
LIB['impact_huge'] = lambda: norm(sub_drop(3.5, 120, 28) * env(int(3.5 * SR), .001, .9) * 1.2 + lp(noise(3.5), 900) * env(int(3.5 * SR), .0005, .25) + hp(noise(3.5), 3000) * env(int(3.5 * SR), .0005, .03) * .5)
LIB['ice_crackle'] = lambda: norm(hp(noise(1.6) * (R.random(int(1.6 * SR)) > .9985).astype(float) * 30, 3000) * env(int(1.6 * SR), .01, .7), .6)
LIB['heartbeat'] = lambda: norm(np.concatenate([np.concatenate([lp(noise(.12), 90) * env(int(.12 * SR), .005, .03), np.zeros(int(.16 * SR)), lp(noise(.12), 80) * env(int(.12 * SR), .005, .04) * .7, np.zeros(int(.45 * SR))]) for _ in range(5)]), .8)


def riser(sec):
    t = t_(sec); f = 200 * (8 ** (t / sec))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * .3
    return norm((bp(noise(sec), 400, 6000) * .7 + tone) * (t / sec) ** 2.2)


LIB['riser_short'] = lambda: riser(2.5)
LIB['riser_long'] = lambda: riser(5.0)


def drone(sec, root=41.2):
    t = t_(sec)
    x = sum(np.sin(2 * np.pi * root * m * t + R.random() * 6) * (1 + .3 * np.sin(2 * np.pi * (.05 + i * .03) * t)) / (i + 1)
            for i, m in enumerate([1, 1.5, 2, 3, 4.01]))
    return norm(lp(x + lp(noise(sec), 120) * .5, 900))


LIB['drone_resolve'] = lambda: norm(drone(8, 55) * env(int(8 * SR), 1.5, 4))
LIB['rumble_low'] = lambda: norm(lp(noise(4), 70) * np.sin(np.pi * t_(4) / 4))


# ---------- satisfying / bright / futuristic --------------------------------
def tone(f, sec, partials=((1, 1),), decay=.3, attack=.002):
    t = t_(sec); x = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in partials)
    return x * env(len(t), attack, decay)

BELL = ((1, 1), (2.01, .5), (3.02, .25), (4.17, .12), (5.43, .06))
LIB['pop'] = lambda: norm(np.sin(2 * np.pi * np.cumsum(np.linspace(900, 260, int(.09 * SR))) / SR) * env(int(.09 * SR), .001, .025), .6)
LIB['bubble'] = lambda: norm(np.sin(2 * np.pi * np.cumsum(np.linspace(300, 1300, int(.12 * SR))) / SR) * env(int(.12 * SR), .002, .04), .5)
LIB['blip'] = lambda: norm(tone(1320, .12, ((1, 1), (2, .3)), .04) + tone(1980, .12, ((1, .5),), .03), .45)
LIB['click'] = lambda: norm(hp(noise(.02), 4000) * env(int(.02 * SR), .0002, .002) + tone(3400, .02, decay=.003), .35)
def mixat(sec, parts):
    out = np.zeros(int(sec * SR))
    for x, off in parts:
        i = int(off * SR); n = min(len(x), len(out) - i); out[i:i + n] += x[:n]
    return out


LIB['mech_tick'] = lambda: norm(mixat(.2, [(bp(noise(.03), 1500, 6000) * env(int(.03 * SR), .0002, .004), 0),
                                           (bp(noise(.03), 1200, 5000) * env(int(.03 * SR), .0002, .005) * .7, .065),
                                           (tone(880, .1, decay=.02) * .3, 0)]), .5)
LIB['chime'] = lambda: norm(mixat(1.0, [(tone(1046.5, .9, BELL, .35), 0), (tone(1568, .9, BELL, .45), .09)]), .55)
LIB['ding'] = lambda: norm(tone(1760, 1.2, ((1, 1), (2.76, .4), (5.4, .2), (8.93, .1)), .5), .45)
LIB['sparkle'] = lambda: norm(mixat(.6, [(tone(f, .25, BELL, .06), i * .035) for i, f in enumerate([2093, 2637, 3136, 3951, 4699])]), .35)
LIB['shimmer'] = lambda: norm(sum(np.sin(2 * np.pi * f * t_(2.5) + R.random() * 6) * (1 + np.sin(2 * np.pi * (3 + i) * t_(2.5))) for i, f in enumerate([1568, 2093, 2349, 3136])) * np.sin(np.pi * t_(2.5) / 2.5) ** 2, .35)
LIB['rise_tone'] = lambda: norm(np.sin(2 * np.pi * np.cumsum(np.geomspace(330, 990, int(1.2 * SR))) / SR) * np.linspace(0, 1, int(1.2 * SR)) ** 2 * env(int(1.2 * SR), .9, .2), .4)
LIB['whoosh_trans'] = lambda: norm(bp(noise(.7), 800, 7000) * np.sin(np.pi * t_(.7) / .7) ** 4, .55)
LIB['wide_atmos'] = lambda: norm(lp(noise(5), 400) * .7 * np.sin(np.pi * t_(5) / 5) + drone(5, 82.4) * .5 * np.sin(np.pi * t_(5) / 5) ** 2, .7)
LIB['number_hit'] = lambda: norm(mixat(1.2, [(sub_drop(1.2, 80, 40) * env(int(1.2 * SR), .002, .35), 0), (tone(1318.5, 1.1, BELL, .4) * .5, .01)]), .8)
LIB['debris'] = lambda: norm(mixat(2.0, [(bp(noise(.15), 300 + 400 * R.random(), 2500 + 2000 * R.random()) * env(int(.15 * SR), .001, .03) * (1 - k / 40), R.random() * 1.6) for k in range(40)]) * env(int(2 * SR), .01, .9), .5)
LIB['heartbeat'] = LIB['heartbeat']


def doppler(sec=1.6):
    t = t_(sec); mid = sec / 2
    shift = 1 + .35 * np.tanh((mid - t) * 5)                   # pitch falls as it passes
    n = bp(noise(sec), 300, 4000)
    carrier = np.sin(2 * np.pi * np.cumsum(180 * shift) / SR) * .3
    amp = 1 / (1 + ((t - mid) * 6) ** 2)
    x = (n + carrier) * amp
    pan = np.tanh((t - mid) * 4)
    return np.stack([x * (1 - pan) * .7, x * (1 + pan) * .7], 1) / np.max(np.abs(x))


def birds(sec=10):
    out = np.zeros(int(sec * SR))
    for k in range(18):
        at = R.random() * (sec - .5); f0 = 2500 + R.random() * 2500
        n = int((.08 + R.random() * .12) * SR); tt = np.arange(n) / SR
        f = f0 * (1 + .25 * np.sin(2 * np.pi * (12 + R.random() * 10) * tt))
        out[int(at * SR):int(at * SR) + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .01, .04) * (.3 + R.random() * .5)
    return norm(out + lp(noise(sec), 600) * .05, .4)


LIB['doppler'] = doppler
LIB['birds'] = birds
LIB['echo_tail'] = lambda: norm(mixat(3.0, [(lp(noise(.4), 500) * env(int(.4 * SR), .001, .12) * g, d) for d, g in [(0, 1), (.28, .5), (.61, .28), (.99, .15), (1.42, .08)]]), .5)


def music_bed(sec=90):
    """Evolving cinematic bed: drone + slow pulses; intensity curve applied in mix."""
    t = t_(sec)
    d = drone(sec, 41.2)
    pulse_env = (np.sin(2 * np.pi * t * (1 / 1.0)) > .97).astype(float)  # 60 bpm
    pulse = lp(np.convolve(pulse_env, np.exp(-np.arange(int(.4 * SR)) / (.12 * SR)))[:len(t)] * np.sin(2 * np.pi * 55 * t), 200)
    pad = sum(np.sin(2 * np.pi * f * t) for f in [164.8, 196.0, 246.9]) * .12 * (0.5 + .5 * np.sin(2 * np.pi * t / 16))
    return np.stack([d * .8 + pulse * .9 + lp(pad, 1200), d * .8 + pulse * .9 + lp(np.roll(pad, 400), 1200)], 1)


def wind_bed(sec=90):
    n = noise(sec)
    lo = lp(n, 500); mid = bp(noise(sec), 500, 2500); hi = hp(noise(sec), 2500)
    return np.stack([lo, mid, hi], 1)  # 3 bands, mixed by speed in mixer


def tink():
    """coin hitting stone: three bright metallic pings (bounces), decaying"""
    t = np.arange(int(.9 * SR)) / SR; out = np.zeros_like(t)
    for at, a in ((0, 1.), (.12, .55), (.2, .3), (.25, .15)):
        tt = np.clip(t - at, 0, None); on = t >= at
        for f, d, g in ((4180, 18, 1.), (6230, 26, .6), (9410, 34, .35), (2790, 14, .4)):
            out += on * a * g * np.sin(2 * np.pi * f * tt) * np.exp(-d * tt)
    return out / np.abs(out).max() * .9


LIB["tink"] = tink


def splash():
    """small water drop hitting stone: sharp click + bright droplet plinks + short hiss"""
    n = int(.6 * SR); t = np.arange(n) / SR; rng = np.random.default_rng(4)
    out = rng.standard_normal(n) * np.exp(-t * 40) * .5
    for at, f in ((0, 2600), (.03, 3900), (.06, 3100), (.09, 4700), (.13, 3500)):
        tt = np.clip(t - at, 0, None); out += (t >= at) * np.sin(2 * np.pi * (f + 1500 * tt) * tt) * np.exp(-tt * 45) * .6
    return out / np.abs(out).max() * .8


LIB["splash"] = splash


def save(path, x):
    x = np.asarray(x, dtype=np.float32)
    if x.ndim == 1: x = stereo(x)
    wavfile.write(path, SR, x)


def main(root):
    sd, md = os.path.join(root, "assets", "sfx"), os.path.join(root, "assets", "music")
    os.makedirs(sd, exist_ok=True); os.makedirs(md, exist_ok=True)
    for k, f in LIB.items():
        p = os.path.join(sd, f"{k}.wav")
        save(p, f())
    if not os.path.exists(os.path.join(md, "bed_main.wav")): save(os.path.join(md, "bed_main.wav"), norm(music_bed(), .9))
    np.save(os.path.join(sd, "wind_bands.npy"), wind_bed().astype(np.float32))
    print("sfx library:", sorted(os.listdir(sd)))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
