#!/usr/bin/env python3
"""Headless renderer: drives src/engine/index.html frame by frame.

  render.py stills  <episode_dir> <out_dir> t1 t2 ...       -> PNG per time
  render.py video   <episode_dir> <out.mp4> [--scale 0.5] [--from T --to T] [--fps 30]
                     writes video-only H.264 + <out>.frames.json (per-frame state)
"""
import argparse, functools, http.server, json, os, subprocess, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--ignore-gpu-blocklist", "--disable-gpu-vsync"]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


def serve():
    h = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def open_page(p, ep, scale=1.0, mb=1, r3d=1.0):
    port = serve()
    b = p.chromium.launch(args=ARGS)
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=scale)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    rel = "/" + os.path.relpath(os.path.abspath(ep), ROOT)
    eng = json.load(open(os.path.join(ep, "timeline.json"))).get("engine", "main")
    pg.goto(f"http://127.0.0.1:{port}/engine/index.html?ep={rel}&engine={eng}&scale={scale}&mb={mb}&r3d={r3d}")
    try:
        pg.wait_for_function("window.ENGINE_READY === true", timeout=60000)
    except Exception:
        raise SystemExit("engine failed to load: " + "; ".join(errs))
    pg.evaluate("document.fonts.ready")
    return b, pg, errs


def stills(ep, out, times, mb=1):
    os.makedirs(out, exist_ok=True)
    with sync_playwright() as p:
        b, pg, errs = open_page(p, ep, 1.0, mb)
        res = []
        for t in times:
            stt = pg.evaluate(f"window.renderAt({t})")
            path = os.path.join(out, f"t{t:06.2f}.png")
            pg.screenshot(path=path, timeout=300000)
            res.append(dict(stt, file=path))
        b.close()
    if errs: print("PAGE ERRORS:", errs, file=sys.stderr)
    return res


def video(ep, out, scale=1.0, t0=None, t1=None, fps=30, quality="final", mb=1, r3d=1.0):
    tl = json.load(open(os.path.join(ep, "timeline.json")))
    t0 = 0.0 if t0 is None else t0
    t1 = tl["duration"] if t1 is None else t1
    nframes = int(round((t1 - t0) * fps))
    w, h = int(1080 * scale) // 2 * 2, int(1920 * scale) // 2 * 2
    tmp = out[:-4] + ".part.mp4"
    crf, preset = ("18", "veryfast") if quality == "final" else ("24", "veryfast")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps),
                           "-c:v", "mjpeg", "-i", "-", "-vf", f"scale={w}:{h}:flags=lanczos,format=yuv420p",
                           "-c:v", "libx264", "-preset", preset, "-crf", crf, "-r", str(fps),
                           "-movflags", "+faststart", tmp], stdin=subprocess.PIPE)
    states, t_start = [], time.time()
    with sync_playwright() as p:
        b, pg, errs = open_page(p, ep, scale, mb, r3d)
        for i in range(nframes):
            t = t0 + i / fps
            states.append(pg.evaluate(f"window.renderAt({t:.5f})"))
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92, timeout=300000))
            if i % 30 == 0:
                el = time.time() - t_start
                eta = el / (i + 1) * (nframes - i - 1)
                print(json.dumps(dict(progress=round(i / nframes, 4), frame=i, of=nframes, eta_s=round(eta))), flush=True)
        b.close()
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg failed")
    os.replace(tmp, out)
    json.dump(states, open(out[:-4] + ".frames.json", "w"))
    print(json.dumps(dict(progress=1, out=out, frames=nframes, secs=round(time.time() - t_start))), flush=True)
    if errs: print("PAGE ERRORS:", errs, file=sys.stderr)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "video"])
    ap.add_argument("ep"); ap.add_argument("out")
    ap.add_argument("times", nargs="*", type=float)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--from", dest="t0", type=float)
    ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--quality", default="final")
    ap.add_argument("--mb", type=int, default=1, help="motion-blur sub-frames")
    ap.add_argument("--r3d", type=float, default=1.0, help="3D internal resolution factor (HUD stays full res)")
    a = ap.parse_args()
    if a.mode == "stills":
        for r in stills(a.ep, a.out, a.times, a.mb): print(json.dumps(r))
    else:
        video(a.ep, a.out, a.scale, a.t0, a.t1, a.fps, a.quality, a.mb, a.r3d)
