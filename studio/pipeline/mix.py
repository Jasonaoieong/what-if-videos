#!/usr/bin/env python3
"""5-layer mixer with automatic event sound design.

  L1 NARRATION   voice files from the timeline
  L2 MUSIC       adaptive score (music.py), ducked under narration and under big accents
  L3 ENVIRONMENT wind that follows simulated speed, high-altitude hiss, birds after landing
  L4 VISUAL FX   auto-placed from what is on screen: counter clicks, thousand-mark ticks,
                 heading/transition whooshes, fact-card chimes, number-chip hits,
                 caption sparkles, marker pops, force-gauge blips, verdict dings, doppler pass-bys
  L5 ACCENTS     risers, bass hits, reveal hits, pre-reveal silence, impact + debris + echo

Writes <out>.wav and <out>.plan.json (every event with time, layer, reason).
usage: mix.py <episode_dir> <frames.json> <out.wav>
"""
import json, os, re, subprocess, sys
import numpy as np
from scipy.io import wavfile

SR = 48000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SFX = os.path.join(ROOT, "assets", "sfx")
NUM_RE = re.compile(r"(−?\d[\d.,]*\d?\s?(?:°C|km/h|km|meters|minutes|seconds|m\b|N\b)?|¼)", re.I)
CONTROL = {"silence", "silence_drop", "wind_low", "wind_rise", "wind_peak"}
_cache = {}


def load(path):
    if path in _cache: return _cache[path]
    if path.endswith(".npy"): x = np.load(path)
    else:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
    _cache[path] = x; return x


def sfx(name): return load(os.path.join(SFX, name + ".wav"))


def place(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    g = np.array([gain * min(1, 1 - pan), gain * min(1, 1 + pan)], np.float32)
    buf[i:i + n] += x[:n] * g


def smooth(x, sec):
    k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, mode="same")


def main(ep, frames_path, out):
    tl = json.load(open(os.path.join(ep, "timeline.json")))
    fr = json.load(open(frames_path))
    T = tl["duration"]; N = int(T * SR) + SR
    fps = len(fr) / T
    segs = tl["segments"]
    impact = next((s["end"] for s in segs if s["camera"] == "impact_cut"), None)
    fall = impact is not None
    if impact is None: impact = T + 10
    bus = {k: np.zeros((N, 2), np.float32) for k in ("voice", "music", "env", "vfx", "acc")}
    plan = []

    pending = []   # visual-FX candidates, filtered by priority before placing

    def ev(layer, name, at, gain, why, pan=0.0):
        if not os.path.exists(os.path.join(SFX, name + ".wav")): print("missing", name); return
        if layer == "vfx":
            pending.append((name, at, gain, why, pan)); return
        place(bus[layer], sfx(name), at, gain, pan)
        plan.append(dict(t=round(at, 3), layer=layer, sound=name, gain=round(gain, 2), why=why))

    # ---- L1 narration
    voice_env = np.zeros(N, np.float32)
    for s in segs:
        if s.get("voice_file"):
            v = load(os.path.join(ep, s["voice_file"]))
            place(bus["voice"], v, s["voice_start"])
            i = int(s["voice_start"] * SR); voice_env[i:i + len(v)] = 1
            plan.append(dict(t=s["voice_start"], layer="voice", sound=s["voice_file"], why=s["id"]))
    # ---- L2 music
    mpath = os.path.join(ep, "music.wav")
    if not os.path.exists(mpath) or os.path.getmtime(mpath) < os.path.getmtime(os.path.join(ep, "timeline.json")):
        os.makedirs(os.path.dirname(mpath), exist_ok=True)
        subprocess.run([sys.executable, os.path.join(ROOT, "pipeline", "music.py"), ep, mpath], check=True)
    m = load(mpath); place(bus["music"], m, 0, 1.0)

    # ---- L3 environment: wind follows speed
    wb = load(os.path.join(SFX, "wind_bands.npy"))
    wb = np.tile(wb, (N // len(wb) + 1, 1))[:N]
    v = np.interp(np.arange(N) / SR, np.arange(len(fr)) / fps, [f["v"] for f in fr])
    h = np.interp(np.arange(N) / SR, np.arange(len(fr)) / fps, [f["h"] for f in fr])
    vt = np.clip(v / 90, 0, 1)
    alive = smooth((np.arange(N) / SR < impact).astype(np.float32), .02)
    w = (wb[:, 0] * (.2 + .55 * vt) + wb[:, 1] * .4 * vt ** 1.5 + wb[:, 2] * .22 * vt ** 2) * alive
    bus["env"] += np.stack([w, np.roll(w, 300)], 1).astype(np.float32) * .2
    hiss = wb[:, 2] * np.clip((h - 6000) / 4000, 0, 1) * .05 * alive * fall          # thin cold air up high
    bus["env"] += np.stack([hiss, np.roll(hiss, 500)], 1).astype(np.float32)
    end_seg = next((s for s in segs if s.get("mood") == "ending"), None)
    if end_seg and fall: ev("env", "birds", impact + 1.6, .5, "calm after landing — life goes on")

    # ---- L4 visual FX (derived from what the HUD/engine shows)
    hs = [f["h"] for f in fr]
    for i in range(1, len(hs)):
        t = i / fps
        if hs[i] <= 0: continue
        if int(hs[i - 1] // 1000) != int(hs[i] // 1000):
            ev("vfx", "mech_tick", t, .5, f"altimeter rolls past {int(hs[i - 1] // 1000) * 1000} m")
        elif int(hs[i - 1] // 250) != int(hs[i] // 250):
            ev("vfx", "click", t, .22, "altimeter 250 m step")
    prev_shot = None
    for s in segs:
        if s["camera"] != prev_shot and s["start"] > 0 and s["camera"] not in ("impact_cut",):
            ev("vfx", "whoosh_trans", s["start"] - .25, .35, f"camera move → {s['camera']}", pan=.3)
        prev_shot = s["camera"]
        if s.get("heading") and s["start"] > 3.8:
            ev("vfx", "blip", s["start"] + .05, .3, f"heading '{s['heading']}'")
        if s.get("fact"):
            ev("vfx", "chime", s["start"] + .6, .45, f"fact card: {s['fact']['title']}")
        if s["camera"] == "pull_back_wide":
            ev("vfx", "pop", s["start"] + (s["end"] - s["start"]) * .25, .4, "YOU marker appears")
            ev("vfx", "shimmer", s["start"] + (s["end"] - s["start"]) * .4, .35, "Everest reveal")
    # force gauge on/off + verdict changes
    fsegs = [s for s in segs if s.get("forces")]
    if fsegs:
        ev("vfx", "bubble", fsegs[0]["start"] + .1, .4, "force gauge appears")
        prev, cand, since = None, None, 0.0
        for i in range(0, len(fr)):
            t = i / fps
            if not any(s["start"] <= t < s["end"] for s in fsegs): continue
            a = fr[i].get("a")
            if a is None: a = (fr[i]["v"] - fr[max(0, i - 3)]["v"]) / max(fr[i]["simT"] - fr[max(0, i - 3)]["simT"], 1e-3)
            verdict = "bal" if abs(a) < 0.2 else ("up" if a > 0 else "dn")
            if verdict != cand: cand, since = verdict, t
            if cand != prev and t - since >= .4:
                if prev is not None: ev("vfx", "ding", since, .35, f"force verdict → {cand}")
                prev = cand
    # caption: number chips hit; key words sparkle (not every caption — only meaningful ones)
    for c in tl["captions"]:
        if c["start"] < 3.9: continue
        words = c["text"].split()
        n = max(1, len(words)); span = max(.25, (c["end"] - c["start"]) * .75)
        mt = NUM_RE.search(c["text"])
        if mt:
            idx = len(c["text"][:mt.start()].split())
            at = c["start"] + idx / n * span
            big = any(k in mt.group(0) for k in ("km/h", "°C")) or "314" in mt.group(0)
            ev("vfx", "number_hit" if big else "pop", at, .5 if big else .35, f"number chip '{mt.group(0)}'")
            ev("vfx", "sparkle", at + .05, .25, "chip spark burst")
    # doppler pass-bys while fast (streaks rushing past) — every ~3.5 s above 75 m/s
    last = -9
    for i in range(len(fr)):
        t = i / fps
        if fr[i]["v"] > 75 and t - last > 3.5 and fr[i]["shot"] not in ("pull_back_wide",):
            ev("vfx", "doppler", t, .25, f"air rushing past at {fr[i]['v'] * 3.6:.0f} km/h", pan=(-1) ** int(t) * .4)
            last = t

    # priority filter: important sounds win; nothing within 0.3 s of a kept sound; clicks ≥ 0.9 s apart
    PRI = ["number_hit", "chime", "pop", "shimmer", "ding", "bubble", "mech_tick", "whoosh_trans", "doppler", "sparkle", "blip", "click"]
    MIN_SELF = {"click": .9, "doppler": 3.0, "blip": 1.0}
    kept = []
    for name, at, gain, why, pan in sorted(pending, key=lambda e: (PRI.index(e[0]) if e[0] in PRI else 99, e[1])):
        near = 0.12 if name == "sparkle" else 0.3      # sparkle rides on its chip hit
        if any(abs(at - k[1]) < near and not (name == "sparkle" and k[0] in ("number_hit", "pop")) for k in kept): continue
        if any(k[0] == name and abs(at - k[1]) < MIN_SELF.get(name, 0) for k in kept): continue
        kept.append((name, at, gain, why, pan))
    for name, at, gain, why, pan in kept:
        place(bus["vfx"], sfx(name), at, gain, pan)
        plan.append(dict(t=round(at, 3), layer="vfx", sound=name, gain=round(gain, 2), why=why))

    # ---- L5 accents from the script's sfx lists
    gains = {"impact_huge": 1.0, "hit_open": .8, "bass_hit": .8, "hit_reveal": .75, "hit_final": .7,
             "riser_short": .35, "riser_long": .4, "whoosh": .5, "cloud_whoosh": .5, "ice_crackle": .45,
             "heartbeat": .6, "rumble_low": .5, "drone_resolve": .4, "wide_atmos": .5, "number_hit": .7,
             "doppler": .35, "debris": .55}
    duck_acc = np.zeros(N, np.float32)
    for e in tl["sfx"]:
        name, at = e["name"], e["at"]
        if name in CONTROL: continue
        layer = "acc"
        if name.startswith("riser"):
            at = max(0, next(s for s in segs if s["id"] == e["seg"])["end"] - len(sfx(name)) / SR)
        if name == "debris": at = impact + .05
        if name in ("hit_reveal",):          # reveal lands after a beat of silence
            at = next(s for s in segs if s["id"] == e["seg"])["start"] + .35
        ev(layer, name, at, gains.get(name, .5), f"script cue in {e['seg']}")
        if name in ("impact_huge", "hit_reveal", "hit_open", "number_hit", "bass_hit", "hit_final"):
            i = int(at * SR); duck_acc[i:i + int(.8 * SR)] = 1
    if fall: ev("acc", "echo_tail", impact + .1, .5, "impact echo")
    # pre-reveal silence: pull everything but voice down for 0.35 s before the twist hit
    silence = np.zeros(N, np.float32)
    for e in tl["sfx"]:
        if e["name"] == "silence_drop":
            s0 = next(s for s in segs if s["id"] == e["seg"])["start"]
            silence[int((s0 - .05) * SR):int((s0 + .35) * SR)] = 1
    silence = smooth(silence, .06)

    # ---- automation: ducking + emphasis
    vduck = smooth(voice_env, .25)
    acc_duck = smooth(duck_acc, .12)
    music_g = (.30 * (1 - .6 * vduck) * (1 - .45 * acc_duck) * (1 - silence))[:, None]
    env_g = ((1 - .35 * vduck) * (1 - .4 * acc_duck) * (1 - .9 * silence))[:, None]
    vfx_g = ((1 - .2 * vduck))[:, None]
    master = bus["voice"] * 1.0 + bus["music"] * music_g + bus["env"] * env_g + bus["vfx"] * vfx_g * .9 + bus["acc"] * .85

    # ---- master: gentle bus compression + soft limiter at ≈ -1 dBFS
    pre_peak = float(np.max(np.abs(master)))
    rms = np.sqrt(smooth((master ** 2).mean(1), .05) + 1e-9)
    comp = np.where(rms > .25, (.25 / rms) ** .5, 1.0)[:, None]
    master = master * comp
    master = np.tanh(master * 1.15) * .89
    master = master[:int(T * SR)]
    wavfile.write(out, SR, master.astype(np.float32))
    plan.sort(key=lambda e: e["t"])
    json.dump(plan, open(out[:-4] + ".plan.json", "w"), indent=1)
    by = {}
    for e in plan: by[e["layer"]] = by.get(e["layer"], 0) + 1
    print(json.dumps(dict(out=out, events=len(plan), by_layer=by, pre_limit_peak=round(pre_peak, 3))))


if __name__ == "__main__":
    main(*sys.argv[1:4])
