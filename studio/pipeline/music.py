#!/usr/bin/env python3
"""Adaptive original score, generated to the episode timeline.

Moods per segment (episode.json "mood"):
  opening  – mysterious: low pad, bell motif, sub pulse
  explain  – light rhythm: soft kick, airy hats, bright pluck arpeggio
  escalate – faster: 16th hats, driving bass, busier arpeggio
  reveal   – tension: drums drop out, pad + pulse + rising line
  climax   – powerful: full drums, toms, big bass, saw stabs
  ending   – resolution: D minor → D major, bells, fade
Single key (D minor) and tempo (100 bpm) so sections flow; layer gains are
smoothed between sections so changes never jump.
usage: music.py <episode_dir> <out.wav>
"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000; BPM = 100; BEAT = 60 / BPM
R = np.random.default_rng(11)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

# Dm – Bb – F – C (i–VI–III–VII), one chord per bar
PROG = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
#            mood:      pad  pluck kick hat  bass  drums_big  bell  pulse
GAINS = dict(opening=  (.8,  0,    0,   0,   0,    0,         .7,   .7),
             explain=  (.5,  .55,  .45, .3,  .25,  0,         .15,  0),
             escalate= (.5,  .7,   .7,  .55, .6,   0,         0,    0),
             reveal=   (.75, .2,   0,   0,   0,    0,         .3,   .9),
             climax=   (.6,  .6,   .9,  .7,  .9,   .9,        0,    .4),
             ending=   (.8,  .25,  0,   0,   .3,   0,         .8,   0))
LAYERS = ["pad", "pluck", "kick", "hat", "bass", "big", "bell", "pulse"]


def adsr(n, a=.01, r=.2):
    e = np.ones(n); ai = max(1, int(a * SR)); e[:ai] = np.linspace(0, 1, ai)
    e[ai:] = np.exp(-np.arange(n - ai) / (r * SR)); return e


def add(buf, x, at):
    i = int(at * SR)
    if i >= len(buf) or i < 0: return
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n]


def saw(f, sec, det=0.0):
    t = np.arange(int(sec * SR)) / SR
    return sum(np.sin(2 * np.pi * f * (1 + det * k) * t * h) / h for k in (-1, 0, 1) for h in range(1, 9)) / 3


def main(ep, out):
    tl = json.load(open(os.path.join(ep, "timeline.json")))
    T = tl["duration"]; N = int(T * SR) + SR
    L = {k: np.zeros(N) for k in LAYERS}
    impact = next((s["end"] for s in tl["segments"] if s["camera"] == "impact_cut"), T + 10)
    end_start = next((s["start"] for s in tl["segments"] if s.get("mood") == "ending"), T)
    bars = int(T / (4 * BEAT)) + 2
    for b in range(bars):
        t0 = b * 4 * BEAT
        ending = t0 >= end_start
        chord = PROG[b % 4] if not ending else ([50, 54, 57] if b % 2 == 0 else [45, 49, 52])  # D major / A major
        # pad: detuned saws, filtered
        for m in chord:
            add(L["pad"], lp(saw(mtof(m), 4 * BEAT + .6, .004), 1400) * adsr(int((4 * BEAT + .6) * SR), .5, 1.6) * .18, t0)
        # pluck arpeggio (8ths), up an octave, pentatonic-friendly
        arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 24]
        for i in range(8):
            f = mtof(arp[i % 4] + (12 if i in (3, 7) else 0))
            n = int(.35 * SR); t = np.arange(n) / SR
            add(L["pluck"], (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * adsr(n, .002, .09) * .22, t0 + i * BEAT / 2)
        # kick on beats, hats on 8ths/16ths (density chosen later by gain)
        for i in range(4):
            n = int(.4 * SR); t = np.arange(n) / SR
            k = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t * 30)) / SR) * adsr(n, .001, .12)
            add(L["kick"], k * .7, t0 + i * BEAT)
        for i in range(16):
            n = int(.06 * SR)
            h = hp(R.standard_normal(n), 7000) * adsr(n, .0005, .015) * (.5 if i % 2 else .25) * (.6 if i % 4 else 1)
            add(L["hat"], h * .35, t0 + i * BEAT / 4)
        # bass: root, 8th-note drive
        for i in range(8):
            n = int(BEAT / 2 * SR * .9)
            add(L["bass"], lp(saw(mtof(chord[0] - 12), BEAT / 2 * .9), 300 + 200 * (i % 2)) * adsr(n, .005, .25) * .35, t0 + i * BEAT / 2)
        # big drums: toms + stabs on 1 and the "and of 2"
        for at in (0, 1.5, 2, 3.5):
            n = int(.5 * SR); t = np.arange(n) / SR
            tom = np.sin(2 * np.pi * np.cumsum(90 + 60 * np.exp(-t * 18)) / SR) * adsr(n, .001, .2)
            add(L["big"], tom * .6 + lp(R.standard_normal(n), 2500) * adsr(n, .001, .05) * .3, t0 + at * BEAT)
        add(L["big"], lp(sum(saw(mtof(m + 12), .35) for m in chord), 2500) * adsr(int(.35 * SR), .005, .12) * .12, t0)
        # bell motif every bar (sparse)
        for j, m in enumerate([chord[2] + 24, chord[0] + 24]):
            n = int(1.4 * SR); t = np.arange(n) / SR; f = mtof(m)
            bell = sum(a * np.sin(2 * np.pi * f * p * t) for p, a in ((1, 1), (2.01, .45), (3.02, .2), (4.2, .1)))
            add(L["bell"], bell * adsr(n, .002, .55) * .12, t0 + j * 2 * BEAT + BEAT)
        # sub pulse (heartbeat-like, quarter notes)
        for i in range(4):
            n = int(.3 * SR); t = np.arange(n) / SR
            add(L["pulse"], np.sin(2 * np.pi * 41.2 * t) * adsr(n, .01, .12) * .5, t0 + i * BEAT)
    # layer automation from segment moods, smoothed (0.6 s), silenced around impact
    t = np.arange(N) / SR
    mix = np.zeros(N)
    for li, name in enumerate(LAYERS):
        g = np.zeros(N)
        for s in tl["segments"]:
            g[int(s["start"] * SR):int(s["end"] * SR)] = GAINS.get(s.get("mood", "explain"))[li]
        g[int(tl["segments"][-1]["end"] * SR):] = g[int(tl["segments"][-1]["end"] * SR) - 1]
        k = int(.6 * SR); g = np.convolve(g, np.ones(k) / k, mode="same")
        mix += L[name] * g
    # reveal: rising line across reveal segments; silence just before impact; ending fade
    rv = [s for s in tl["segments"] if s.get("mood") == "reveal"]
    if rv:
        a, b = rv[0]["start"], rv[-1]["end"]; n = int((b - a) * SR); tt = np.arange(n) / SR
        f = mtof(62) * 2 ** (tt / (b - a))
        add(mix, np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / (b - a)) ** 1.5 * .12, a)
    gate = np.ones(N)
    gate[(t > impact - .9) & (t < impact + 1.6)] = 0
    gate = np.convolve(gate, np.ones(4800) / 4800, mode="same")
    fade = np.clip((T - t) / 3.0, 0, 1)
    mix = mix * gate * fade
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * .9
    st = np.stack([mix, np.roll(mix, int(.012 * SR)) * .96 + mix * .04], 1)[:int(T * SR)]
    wavfile.write(out, SR, st.astype(np.float32))
    print(json.dumps(dict(music=out, seconds=round(T, 2))))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
