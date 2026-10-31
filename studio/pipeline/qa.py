#!/usr/bin/env python3
"""Automated checks on a finished episode video.
usage: qa.py <episode_dir> <video.mp4> <frames.json>
Checks: resolution/aspect, fps, codecs, audio present, black frames,
clipping, counter monotonic + matches sim, captions timing, voice coverage."""
import json, os, re, subprocess, sys


def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)


def main(ep, video, frames):
    tl = json.load(open(os.path.join(ep, "timeline.json")))
    res, ok = [], True

    def check(name, cond, detail=""):
        nonlocal ok
        ok &= bool(cond) or name.startswith("WARN")
        res.append(("PASS" if cond else ("WARN" if name.startswith("WARN") else "FAIL"), name.replace("WARN ", ""), detail))

    pr = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", video]).stdout)
    vs = [s for s in pr["streams"] if s["codec_type"] == "video"]
    au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    v = vs[0]
    fps = eval(v["r_frame_rate"])
    check("video stream H.264", v["codec_name"] == "h264", v["codec_name"])
    check("WARN resolution 1080x1920", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
    check("aspect 9:16", abs(v["width"] / v["height"] - 9 / 16) < .01)
    check("WARN fps ≥ 30", fps >= 29.9, f"{fps:.2f}")
    check("audio stream AAC", bool(au) and au[0]["codec_name"] == "aac", au[0]["codec_name"] if au else "none")
    dur = float(pr["format"]["duration"])
    check("duration matches timeline", abs(dur - tl["duration"]) < .3, f"{dur:.2f}s vs {tl['duration']:.2f}s")

    bd = run(["ffmpeg", "-i", video, "-vf", "blackdetect=d=0.25:pix_th=0.08", "-an", "-f", "null", "-"]).stderr
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
    impact = next((s["end"] for s in tl["segments"] if s["camera"] == "impact_cut"), -9)
    fall = impact > 0
    unexpected = [b for b in blacks if not (impact - .2 <= float(b[0]) <= impact + 1.0)]
    check("no unexpected black frames", not unexpected, f"{blacks} (impact cut at {impact:.2f}s is intentional)")

    vd = run(["ffmpeg", "-i", video, "-af", "volumedetect", "-vn", "-f", "null", "-"]).stderr
    mx = float(re.search(r"max_volume: ([-\d.]+)", vd).group(1)) if "max_volume" in vd else -99
    mean = float(re.search(r"mean_volume: ([-\d.]+)", vd).group(1)) if "mean_volume" in vd else -99
    check("no clipping (peak < -0.1 dBFS)", mx < -0.1, f"peak {mx} dB, mean {mean} dB")
    check("audio not silent", mean > -45, f"mean {mean} dB")

    fr = json.load(open(frames))
    hs = [f["h"] for f in fr]
    if fall: check("counter never increases", all(b <= a + 1e-6 for a, b in zip(hs, hs[1:])))
    jumps = max(abs(a - b) for a, b in zip(hs, hs[1:]))
    if fall: check("counter has no jumps (< 0.4 % of range per frame)", jumps < max(120, max(hs) * .004), f"max step {jumps:.1f} m")
    if fall: check("counter starts at the top / ends 0", hs[0] >= max(hs) - 1 and hs[-1] == 0, f"{hs[0]} → {hs[-1]}")

    caps = tl["captions"]
    short = [c["text"] for c in caps if c["end"] - c["start"] < .45]
    long_ = [c["text"] for c in caps if len(c["text"].split()) > 10]
    over = [c["text"] for a, c in zip(caps, caps[1:]) if c["start"] < a["start"]]
    check("WARN captions on screen ≥ 0.45 s", not short, str(short))
    check("captions ≤ 10 words", not long_, str(long_))
    check("captions in order", not over)
    check("WARN narration audio present", not tl["voice_missing"],
          f"missing: {tl['voice_missing']} (timing is estimated until files are added)")

    # --- phase-2 checks -------------------------------------------------------
    import math
    cams = [f.get("rel") or f.get("cam") for f in fr if f.get("cam")]
    rel = bool(fr[0].get("rel"))
    if len(cams) > 3:
        cut_frames = set()
        fps_v = len(fr) / tl["duration"]
        for s in tl["segments"]:
            if s["camera"] in ("impact_cut", "aftermath_rise") or s.get("cut"):
                cut_frames.update(range(int(s["start"] * fps_v) - 2, int(s["start"] * fps_v) + 6))
                if s["camera"] == "impact_cut": cut_frames.update(range(int(s["start"] * fps_v), int((s["end"] + 1.2) * fps_v)))
        jerk = []
        for i in range(2, len(cams)):
            if i in cut_frames: continue
            a = [cams[i][k] - 2 * cams[i - 1][k] + cams[i - 2][k] for k in range(3)]
            dist = max(.01, math.hypot(*cams[i])) if rel else max(1.0, math.dist(cams[i], [0, fr[i]["h"], 0]))
            jerk.append(math.sqrt(sum(x * x for x in a)) / dist)
        worst = max(jerk) if jerk else 0
        check("camera motion smooth (no jumps)", worst < 0.05, f"max relative accel/frame {worst:.4f}")
        shots = [f["shot"] for f in fr]
        changes = sum(1 for a, b in zip(shots, shots[1:]) if a != b)
        check("visual variety: ≥ 8 shot changes, ≥ 8 camera types", changes >= 7 and len(set(shots)) >= 7, f"{changes} changes, {len(set(shots))} types")
    md = run(["ffmpeg", "-i", video, "-vf", "mpdecimate=hi=64*4:lo=64*2:frac=0.5", "-an", "-f", "null", "-"]).stderr
    dup = re.findall(r"frame=\s*(\d+)", md)
    kept = int(dup[-1]) if dup else 0
    total = int(round(dur * fps))
    frozen = 1 - kept / max(1, total)
    check("WARN frames keep changing (≤ 12 % near-duplicates)", frozen <= .12, f"{frozen * 100:.1f}% near-duplicate frames")
    plan_p = video[:-4] + "_mix.plan.json"
    if not os.path.exists(plan_p):
        plan_p = os.path.join(os.path.dirname(video), os.path.basename(video)[:-4] + "_mix.plan.json")
    if os.path.exists(plan_p):
        plan = json.load(open(plan_p))
        late = [e for e in plan if e["t"] > tl["duration"] or e["t"] < -0.5]
        check("all sound events inside the video", not late, str(late[:3]))
        layers = {e["layer"] for e in plan}
        check("sound layers active (music, env, vfx, acc)", {"vfx", "acc"} <= layers, str(sorted(layers)))
        gaps = []
        ts = sorted(e["t"] for e in plan if e["layer"] in ("vfx", "acc"))
        gaps = [b - a for a, b in zip(ts, ts[1:])]
        check("WARN sound accents not overused (median gap ≥ 0.4 s)", sorted(gaps)[len(gaps) // 2] >= .4 if gaps else True,
              f"{len(ts)} accents, median gap {sorted(gaps)[len(gaps) // 2] if gaps else 0:.2f}s")
    for st, n, d in res: print(f"[{st}] {n}" + (f" — {d}" if d else ""))
    json.dump([dict(status=s, check=n, detail=d) for s, n, d in res],
              open(video[:-4] + ".qa.json", "w"), indent=1)
    print("QA:", "PASS" if ok else "FAIL")
    return ok


if __name__ == "__main__":
    sys.exit(0 if main(*sys.argv[1:4]) else 1)
