# One narrator for every line: Piper "ryan-high", same settings, then the same deepening chain.
import json, subprocess, os, sys
M = sys.argv[1]
os.makedirs("vo", exist_ok=True)
FX = "asetrate=22050*0.90,aresample=44100,atempo=1.08,equalizer=f=120:t=q:w=1:g=4,equalizer=f=3000:t=q:w=1.5:g=3,acompressor=threshold=-18dB:ratio=4:attack=5:release=80,loudnorm=I=-14:TP=-1.5"
for L in json.load(open("lines.json")):
    if "say" not in L: continue
    raw = f"vo/{L['id']}_raw.wav"
    subprocess.run(["python3","-m","piper","-m",M,"--length-scale","0.88","--sentence-silence","0.1","-f",raw], input=L["say"].encode(), check=True, capture_output=True)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",raw,"-af",FX+",silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse","-ar","44100","-ac","1",f"vo/{L['id']}.wav"], check=True)
    os.remove(raw)
    d = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"vo/{L['id']}.wav"],capture_output=True,text=True).stdout.strip()
    print(L["id"], d)
