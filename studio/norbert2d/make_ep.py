"""Build a full Norbert episode: voices -> timeline + lip sync -> sound mix -> render -> mp4.

python3 make_ep.py episodes/ep01.json out/ep01.mp4 [--stills 1,5,9]
Voices come from Kokoro (free, local). Model files are looked up in $KOKORO_DIR (default /tmp/claude-0/kokoro);
download them from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import audio  # noqa: E402

SR = audio.SR
FPS = 30
KOKORO = os.environ.get("KOKORO_DIR", "/tmp/claude-0/kokoro")


def tts(lines, voices, work):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(KOKORO, "kokoro-v1.0.onnx"), os.path.join(KOKORO, "voices-v1.0.bin"))
    out = []
    for i, ln in enumerate(lines):
        if ln.get("silent"):
            out.append(np.zeros(int(ln["silent"] * SR)))
            print(f"voice {i} (silent {ln['silent']}s)", flush=True)
            continue
        v = voices[ln.get("voice_override", ln["who"])]
        a, sr = k.create(ln["text"], voice=v["voice"], speed=v["speed"], lang="en-gb" if v["voice"].startswith("b") else "en-us")
        raw = os.path.join(work, f"l{i}_raw.wav")
        sf.write(raw, a, sr)
        fixed = os.path.join(work, f"l{i}.wav")
        p = v.get("pitch", 1.0)
        filt = f"aresample={SR},rubberband=pitch={p}:pitchq=quality:formant=shifted" if p != 1.0 else f"aresample={SR}"
        if v.get("fx"):
            filt += "," + v["fx"]
        filt += ",highpass=f=90,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,deesser,equalizer=f=3200:t=q:w=1.2:g=2.5,aecho=0.8:0.6:18|31:0.10|0.06,loudnorm=I=-16:TP=-2,aresample=48000"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", filt, "-ac", "1", "-ar", "48000", fixed], check=True)
        x, xsr = sf.read(fixed)
        assert xsr == SR, xsr
        # trim leading/trailing silence
        nz = np.where(np.abs(x) > 0.02)[0]
        if len(nz):
            x = x[max(0, nz[0] - 600): nz[-1] + 1200]
        out.append(x)
        print(f"voice {i} {ln['who']} {len(x) / SR:.2f}s", flush=True)
    return out


def chunks(text):
    words = text.replace("?!", "?! ").split()
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 3 or re.search(r"[.,?!]$", w):
            groups.append(" ".join(cur))
            cur = []
    if cur:
        groups.append(" ".join(cur))
    return groups


def build(ep_path, out_mp4, stills=None):
    ep = json.load(open(ep_path))
    work = tempfile.mkdtemp(prefix="ep-")
    clips = tts(ep["lines"], ep["voices"], work)

    t = ep.get("start", 0.35)
    for ln, x in zip(ep["lines"], clips):
        ln["t0"] = round(t, 3)
        ln["t1"] = round(t + len(x) / SR, 3)
        t = ln["t1"] + ln.get("gap", 0.3)
    dur = round(t + 0.2, 2)

    # captions: word groups timed by character share
    caps = []
    for ln in ep["lines"]:
        if not ln["text"].strip():
            continue
        gs = chunks(ln["text"].upper())
        total = sum(len(g) for g in gs)
        c = ln["t0"]
        for g in gs:
            d = (ln["t1"] - ln["t0"]) * len(g) / total
            caps.append({"t0": round(c, 3), "t1": round(c + d + 0.08, 3), "text": g, "who": ln["who"]})
            c += d

    # lip sync: one mouth envelope per speaking character
    n = int(dur * FPS) + 1
    voice = np.zeros(int(dur * SR) + SR)
    tracks = {}
    for ln, x in zip(ep["lines"], clips):
        i = int(ln["t0"] * SR)
        voice[i:i + len(x)] += x
        tracks.setdefault(ln["who"], np.zeros_like(voice))[i:i + len(x)] += x
    hop = SR // FPS
    mouths = {}
    for who, tr in tracks.items():
        m = np.array([np.sqrt(np.mean(tr[f * hop:(f + 1) * hop] ** 2)) for f in range(n)])
        if m.max() > 0:
            m = np.clip(m / (np.percentile(m[m > 0], 90) + 1e-9), 0, 1)
        mouths[who] = [round(float(v), 3) for v in np.where(m > 0.12, m, 0)]

    # sound design
    music = {"drone": audio.drone, "score": audio.score}.get(ep.get("music"), audio.music)(dur + 1)[: len(voice)]
    vol_env = np.abs(voice)
    k = int(0.25 * SR)
    duck = np.convolve(vol_env > 0.02, np.ones(k) / k, mode="same")
    music *= 0.42 - 0.3 * np.clip(duck * 3, 0, 1)
    sfx = np.zeros_like(voice)
    scene_t0 = {}
    for i, ln in enumerate(ep["lines"]):
        st = 0 if i == 0 else ln["t0"] - 0.12
        scene_t0.setdefault(ln["scene"], st)
        if i > 0 and ep.get("whoosh", True):
            audio.add(sfx, audio.whoosh() * 0.8, max(0, st - 0.05))
        for name, at in ln.get("sfx", []):
            audio.add(sfx, getattr(audio, name)(), st + at)
        if ln.get("sfx_end") == "buzz_phone":
            audio.add(sfx, audio.vibrate(), ln["t1"] + 0.1)
        elif ln.get("sfx_end"):
            audio.add(sfx, getattr(audio, ln["sfx_end"])(), ln["t1"] + ln.get("sfx_end_at", 0.2))
    if "teeth" in scene_t0:
        audio.add(sfx, audio.ding(), scene_t0["teeth"] + 0.6)
    if "maya" in scene_t0:
        audio.add(sfx, audio.boing(), scene_t0["maya"] + 0.05)
        ml = next(l for l in ep["lines"] if l["scene"] == "maya")
        audio.add(sfx, audio.pop(), ml["t0"] + (ml["t1"] - ml["t0"]) * 0.42)
    if "mirror" in scene_t0:
        m0 = scene_t0["mirror"]
        audio.add(sfx, audio.scratch(), m0 + 0.55)
        a, b = int((m0 + 0.55) * SR), int((m0 + 0.55 + 2.2) * SR)
        music[a:b] = 0  # dead silence after the record scratch
    if "meter" in scene_t0:
        audio.add(sfx, audio.pop(), scene_t0["meter"] + 0.1)
    if "vote" in scene_t0 and not any(l.get("sfx") for l in ep["lines"] if l["scene"] == "vote"):
        for i in range(4):
            audio.add(sfx, audio.pop(), scene_t0["vote"] + 0.25 + i * 0.22)
    if ep.get("caption_pops", True):
        for c in caps:
            audio.add(sfx, audio.pop() * 0.25, c["t0"])
    if ep.get("flies", True):
        sfx += audio.buzz(len(sfx) / SR)[: len(sfx)] * 0.6
    mix = voice * 1.0 + music + sfx * 0.9
    mix = mix[: int(dur * SR)]
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.9
    wav = os.path.join(work, "mix.wav")
    sf.write(wav, np.stack([mix, mix], 1), SR)

    data = {"lines": ep["lines"], "caps": caps, "mouth": mouths, "fps": FPS, "dur": dur}
    for key in ("days_left", "glow", "glow_to", "vote", "vote_emoji", "vote_title", "look", "nohud", "title", "vote_pill"):
        if key in ep:
            data[key] = ep[key]
    if "cap_colors" in ep:
        data["capColors"] = ep["cap_colors"]
    dj = os.path.join(work, "ep.json")
    json.dump(data, open(dj, "w"))
    page = os.path.join(os.path.dirname(os.path.abspath(ep_path)), ep["page"]) if "page" in ep else os.path.join(HERE, "ep.html")
    render = os.path.join(HERE, "render.js")
    if stills:
        subprocess.run(["node", render, page, out_mp4, "0", str(FPS), "--data", dj, "--stills", stills], check=True)
        return
    silent = os.path.join(work, "video.mp4")
    subprocess.run(["node", render, page, silent, str(dur), str(FPS), "--data", dj], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "192k", "-shortest", "-movflags", "+faststart", out_mp4], check=True)
    print("wrote", out_mp4, f"{dur:.1f}s")


if __name__ == "__main__":
    a = sys.argv[1:]
    st = a[a.index("--stills") + 1] if "--stills" in a else None
    build(a[0], a[1], st)
