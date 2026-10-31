# What If: you fell from 10,000 m

```bash
pip install playwright numpy scipy && python3 -m playwright install chromium   # + ffmpeg
python3 make.py fall           # → out/fall.mp4  (1080×1920, 30 fps)
python3 make.py spin           # → out/spin.mp4
python3 make.py spin --preview # fast half-res check
```

Voice: `export ELEVENLABS_API_KEY=...` (optional `ELEVENLABS_VOICE_ID`), or put `seg01.mp3`… in `episodes/<name>/voice/`. Timing, captions and sound re-sync to the voice automatically.

- `episodes/<name>/` script (`episode.json`), physics output, sources
- `engine/` Three.js scene, character, cameras, HUD
- `pipeline/` physics, timing, render, sound effects, music, mix, QA
