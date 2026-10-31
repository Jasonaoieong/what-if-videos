#!/usr/bin/env python3
"""Build timeline.json, captions.json, script.md and the ElevenLabs manifest.

Voice durations come from real files in <episode>/audio/voice/segNN.(mp3|wav)
when present (ffprobe), otherwise from an estimate (words / WPS) and the
segment is flagged "voice": "missing". Nothing is ever reported as generated
if the file isn't there.

usage: build_timeline.py episodes/episode-001
"""
import json, os, re, subprocess, sys

FPS = 30
WPS = 2.6          # estimated narration speed when no audio exists
PAD_AFTER = 0.45   # breath after each line
LEAD_IN = 0.25     # voice starts this long after segment start
MAX_WORDS = 6      # per caption


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True)
    return float(out.stdout.strip())


NUM, WEIGHT = [], {}   # spoken phrase -> caption display; filled from episode.json "display"


def display(text):
    for spoken, disp in NUM:
        text = text.replace(spoken, disp)
    return text


def weight(chunk):
    return sum(WEIGHT.get(w.rstrip(",.?!"), 1) for w in chunk.split())


def chunk_caption(text):
    text = display(text)
    parts = [p.strip() for p in re.split(r"(?<=[,.?!])\s+", text) if p.strip()]
    out = []
    for p in parts:
        w = p.split()
        n = -(-len(w) // MAX_WORDS)  # balanced pieces
        size = -(-len(w) // n)
        for i in range(0, len(w), size):
            out.append(" ".join(w[i:i + size]))
    return out


def find_voice(ep, sid):
    for ext in ("wav", "mp3", "m4a"):
        p = os.path.join(ep, "voice", f"{sid}.{ext}")
        if os.path.exists(p):
            return p
    return None


def main(ep):
    spec = json.load(open(os.path.join(ep, "episode.json")))
    NUM[:] = [tuple(x) for x in spec.get("display", [])]
    WEIGHT.update({d: len(sp.split()) for sp, d in NUM})
    t = 0.0
    segs, caps, sfx, missing = [], [], [], []
    for s in spec["segments"]:
        text = s["text"]
        vpath = find_voice(ep, s["id"]) if text else None
        if text:
            if vpath:
                vdur, status = probe(vpath), "file"
            else:
                vdur, status = len(text.split()) / WPS, "missing"
                missing.append(s["id"])
            dur = LEAD_IN + vdur + PAD_AFTER
        else:
            vdur, status, dur = 0.0, "none", s.get("silent_duration", 1.0)
        start = round(t, 3)
        end = round(t + dur, 3)
        vstart = start + LEAD_IN if text else None
        seg = dict(s, start=start, end=end, voice_start=vstart,
                   voice_dur=round(vdur, 3), voice=status,
                   voice_file=os.path.relpath(vpath, ep) if vpath else None)
        segs.append(seg)
        if text:
            chunks = chunk_caption(text)
            total_w = sum(weight(c) for c in chunks)
            ct = vstart
            for c in chunks:
                d = vdur * weight(c) / total_w
                caps.append(dict(seg=s["id"], text=c.replace(" ", " "), start=round(ct, 3),
                                 end=round(ct + d + 0.12, 3)))
                ct += d
        for i, name in enumerate(s.get("sfx", [])):
            at = start if i == 0 else start + min(0.6, dur * 0.3)
            if name in ("impact_huge", "tink", "splash"):
                at = end - 0.05
            sfx.append(dict(name=name, at=round(at, 3), seg=s["id"]))
        t += dur
    total = round(t + 0.8, 3)  # hold last frame
    tl = dict(fps=FPS, width=1080, height=1920, duration=total,
              frames=int(round(total * FPS)), segments=segs, captions=caps,
              sfx=sfx, engine=spec.get("engine", "main"), hook_em=spec.get("hook_em"), danger_h=spec.get("danger_h"), vmax=spec.get("vmax"), marker_label=spec.get("marker_label"), object=spec.get("object"), spin_mode=spec.get("spin_mode"), morph_sign=spec.get("morph_sign"), foot=spec.get("foot"), counter=spec["counter"], title=spec["title"],
              hook_text=spec["hook_text"], voice_missing=missing)
    json.dump(tl, open(os.path.join(ep, "timeline.json"), "w"), indent=1)
    print(f"timeline: {total:.2f}s, {tl['frames']} frames, {len(caps)} captions, "
          f"{len(sfx)} sfx; voice missing: {len(missing)}/{sum(1 for s in segs if s['text'])}")


if __name__ == "__main__":
    main(sys.argv[1].rstrip("/"))
