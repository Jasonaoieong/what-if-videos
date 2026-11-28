# Placeholder narrator (swap later): Kokoro am_michael, made younger with WORLD
# (tone x1.28, pitch ~160 Hz, 1.5x livelier), same settings every line.
import json,os,sys,numpy as np,soundfile as sf,pyworld as pw,librosa,subprocess
SC=sys.argv[1]
from kokoro_onnx import Kokoro
k=Kokoro(f'{SC}/kok/model.onnx',f'{SC}/kok/voices.bin.npz')
os.makedirs('vo',exist_ok=True)
for L in json.load(open('lines.json')):
    if 'say' not in L: continue
    a,sr=k.create(L['say'],voice='am_michael',speed=1.3,lang='en-us')
    a,_=librosa.effects.trim(a,top_db=38);x=a.astype(np.float64)
    f0,t=pw.harvest(x,sr,f0_floor=60,f0_ceil=500,frame_period=5);sp=pw.cheaptrick(x,f0,t,sr);ap=pw.d4c(x,f0,t,sr)
    v=f0>0;med=110.0  # fixed anchor so every line gets identical treatment
    f=f0.copy();f[v]=np.exp(np.log(160)+(np.log(f[v])-np.log(med))*1.5)
    n=sp.shape[1];fr=np.arange(n);src=np.clip(fr/1.28,0,n-1)
    sp=np.array([np.interp(src,fr,r) for r in sp]);ap=np.array([np.interp(src,fr,r) for r in ap])
    y=pw.synthesize(f,sp,ap,sr,frame_period=5);y=y/np.abs(y).max()*.9
    sf.write('t.wav',y,sr)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i','t.wav','-af','loudnorm=I=-15:TP=-1.5','-ar','44100','-ac','1',f"vo/{L['id']}.wav"],check=True)
os.remove('t.wav');print('ok')
