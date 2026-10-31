#!/usr/bin/env python3
"""Make a video.   python3 make.py <fall|spin> [--preview]

episodes/<name>/episode.json  script, cameras, sound cues   (edit this)
episodes/<name>/voice/  seg01.mp3 … narration         (ElevenLabs; auto if ELEVENLABS_API_KEY is set)
out/<name>.mp4                                       the finished video
"""
import json, os, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = "out"
PY = sys.executable
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")  # "Adam": deep male narrator


def sh(*a):
    print("$", " ".join(a), flush=True)
    subprocess.run(a, check=True, cwd=ROOT)


def voice(EP):
    key = os.environ.get("ELEVENLABS_API_KEY")
    spec = json.load(open(os.path.join(ROOT, EP, "episode.json")))
    os.makedirs(os.path.join(ROOT, EP, "voice"), exist_ok=True)
    for s in spec["segments"]:
        if not s["text"]: continue
        dst = os.path.join(ROOT, EP, "voice", s["id"] + ".mp3")
        if any(os.path.exists(dst[:-4] + e) for e in (".mp3", ".wav", ".m4a")): continue
        if not key:
            print(f"voice missing: {s['id']} (set ELEVENLABS_API_KEY or drop the file in {EP}/voice/)"); continue
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_192",
            data=json.dumps({"text": s["text"], "model_id": "eleven_multilingual_v2",
                             "voice_settings": {"stability": .5, "similarity_boost": .8, "style": .25}}).encode(),
            headers={"xi-api-key": key, "Content-Type": "application/json"})
        data = urllib.request.urlopen(req, timeout=120).read()
        open(dst, "wb").write(data)
        print("voice saved:", dst)


def main(name, preview):
    EP = f"episodes/{name}"
    os.makedirs(os.path.join(ROOT, OUT), exist_ok=True)
    if not os.path.exists(os.path.join(ROOT, "assets", "sfx", "tick.wav")):
        sh(PY, "pipeline/sfx.py", ".")
    voice(EP)
    sh(PY, "pipeline/timeline.py", EP)
    name = name + ("_preview" if preview else "")
    vid = f"{OUT}/{name}_video.mp4"
    args = ("--scale", ".5", "--fps", "15", "--quality", "preview") if preview else \
           ("--scale", "1", "--fps", "30", "--quality", "final", "--mb", "2", "--r3d", ".75")
    sh(PY, "pipeline/render.py", "video", EP, vid, *args)
    frames, wav, mp4 = vid[:-4] + ".frames.json", f"{OUT}/{name}_mix.wav", f"{OUT}/{name}.mp4"
    sh(PY, "pipeline/mix.py", EP, frames, wav)
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
       "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", mp4[:-4] + ".part.mp4")
    os.replace(os.path.join(ROOT, mp4[:-4] + ".part.mp4"), os.path.join(ROOT, mp4))
    subprocess.run([PY, "pipeline/qa.py", EP, mp4, frames], cwd=ROOT)
    print("done:", mp4)


if __name__ == "__main__":
    main(next((a for a in sys.argv[1:] if not a.startswith("-")), "fall"), "--preview" in sys.argv)
