# In This Town — "When It Rains Money" (Roblox-style short)

Output: `series/in-this-town/in-this-town-ep01.mp4` (1080x1920, 30 fps, ~40 s, narration + SFX, no music)
Stems: `vo.wav` (narrator only), `sfx.wav` (sound effects only), `huss_markers.txt` (where to drop the "huss huss huss").

Rebuild:
```bash
pip install --break-system-packages piper-tts numpy scipy
python3 voice.py /path/to/en_US-ryan-high.onnx   # one narrator voice, same settings every line
python3 timeline.py                               # scene + caption timing from the voice lengths
NODE_PATH=$(npm root -g) node render.js stills 1 5 10   # check frames
NODE_PATH=$(npm root -g) node render.js frames 0 1201 frames
python3 audio.py                                  # sfx.wav, vo.wav, huss_markers.txt
```
Edit the story in `lines.json`, shots in `index.html` (SHOTS).
