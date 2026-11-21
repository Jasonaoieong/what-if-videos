# One storyteller voice for every line: Piper ryan-high, identical settings + identical processing.
import json, subprocess, os, sys
M=sys.argv[1]; os.makedirs("vo",exist_ok=True)
FX="asetrate=22050*0.95,aresample=44100,atempo=1.0,equalizer=f=150:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=100,loudnorm=I=-15:TP=-1.5"
TRIM="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
for L in json.load(open("lines.json")):
    if "say" not in L: continue
    raw=f"vo/{L['id']}_raw.wav"
    subprocess.run(["python3","-m","piper","-m",M,"--length-scale","0.97","--sentence-silence","0.25","-f",raw],input=L["say"].encode(),check=True,capture_output=True)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",raw,"-af",FX+","+TRIM,"-ar","44100","-ac","1",f"vo/{L['id']}.wav"],check=True); os.remove(raw)
