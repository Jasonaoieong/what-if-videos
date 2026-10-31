# Daily production playbook (read fully before starting)

Goal: make the day's 5 videos from `IDEAS.md`, check them, upload them here, and schedule them on TikTok via Metricool. Quality over speed. Never invent a statistic.

## Setup
```bash
cd studio
pip install --break-system-packages numpy scipy playwright >/dev/null 2>&1   # chromium + ffmpeg are preinstalled
python3 pipeline/sfx.py .        # regenerates assets/
```

## Make one episode
1. Pick the engine that fits (see existing examples in `studio/episodes/`):
   - `main` — a person falling from height (fall, space). Physics: `pipeline/sim.py simulate(h0, mass, vt_sea)`.
   - `penny` — an object dropped next to the Burj Khalifa over a city: `object.type` coin | ball | drop | hail. Add a new object type in `engine/penny.js` when the idea needs one (copy the hail/ball blocks: geometry, material, impact behaviour, RAD).
   - `spin` — the globe + surface scenes (spin, faster). Shots: space, zoom, flung, wind, float, latitude, oceans, day, ending.
2. Research every number with WebSearch, then put sources in `episodes/<id>/sources.md`. Run the sim for anything falling.
3. Write `episodes/<id>/episode.json` (copy the closest existing one). Rules: hook in the first 2 s, a twist in the middle, a surprising true ending; 8–10 segments; ~35–45 s; captions come from the text; add `display` pairs for spoken numbers.
4. `python3 pipeline/timeline.py episodes/<id>` then check stills BEFORE rendering:
   `python3 pipeline/render.py stills episodes/<id> /tmp/st <6–10 times>` and look at them (subject visible, nothing clipped, no white/black frames, HUD readable). Fix and repeat.
5. `python3 make.py <id>` (≈45 min; run two at once at most, each as a background task). Check the QA lines in the output and sample 8 frames from `out/<id>.mp4`. Fix real problems; QA warnings about missing narration are expected.

## Publish
1. Re-encode to keep the repo small: `ffmpeg -i out/<id>.mp4 -c:v libx264 -preset veryfast -crf 24 -c:a copy -movflags +faststart ../videos/<id>.mp4`
2. Commit + push `videos/<id>.mp4` (one file per push).
3. Metricool brand `7773062`, TikTok only, `isAigc: true`, media `https://raw.githubusercontent.com/Jasonaoieong/what-if-videos/main/videos/<id>.mp4`. Caption: the hook question + emoji + 5 hashtags incl. #whatif #science #fyp. Times (America/Los_Angeles) for the day's 5: 10:00, 12:00, 15:00, 18:00, 20:00 — if a time already passed, use the next free hour.
4. After Metricool confirms (it copies the file to static.metricool.com), delete videos older than 3 days from `videos/` and push, to keep the repo small.
5. Mark the ideas done in `IDEAS.md` (`- [x]`), commit the episode folders + any engine changes, push.

## Rules
- No brands, logos, real people's likenesses, or harm to animals. Historical record holders may be mentioned without names.
- No narration exists (no voice API). Captions carry the story.
- If a day's idea can't be made accurately with the engines, swap it for a better one and note why in IDEAS.md.
