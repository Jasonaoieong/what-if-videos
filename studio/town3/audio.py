import json,numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt
SR=44100;R=np.random.default_rng(5);TL=json.load(open('timeline.json'));D=TL['duration'];n=int(D*SR)
SC={};[SC.setdefault(s['shot'],s) for s in TL['scenes']]
LN={l['id']:l for l in TL['lines']}
def at(shot,k):s=SC[shot];return s['t0']+k*(s['t1']-s['t0'])
def word(lid,w):return next(x['t0'] for x in LN[lid]['words'] if x['w'].startswith(w))
F=lambda x,f,ty:sosfilt(butter(4,f,ty,fs=SR,output='sos'),x);T=lambda s:np.arange(int(s*SR))/SR;nz=lambda s:R.standard_normal(int(s*SR))
norm=lambda x,p=1:x/(np.abs(x).max()+1e-9)*p
bed=np.zeros(n);fx=np.zeros(n)
def put(b,x,t,g=1.):i=int(t*SR);x=x[:max(0,n-i)];b[i:i+len(x)]+=x*g
# night ambience: crickets + soft air
t=T(D);air=F(nz(D),400,'low')*.15
cr=np.zeros(n)
for j in range(int(D*3)):
    d=T(.18);c=np.sin(2*np.pi*4400*d)*(np.sin(2*np.pi*45*d)>0)*np.exp(-d/.06);put(cr,c*R.uniform(.05,.15),R.uniform(0,D))
bed=air+cr
# dance music (original 4-on-the-floor, muffled) in hall scenes
hall=[s for s in TL['scenes'] if s['shot'] in('dance','juice','door','hussgirl','walkup','talk1','talk2','dancing')]
def beat(sec,bpm=118):
    y=np.zeros(int(sec*SR));spb=60/bpm
    for i in range(int(sec/spb)):
        k=T(.25);put_i=int(i*spb*SR);kick=np.sin(2*np.pi*np.cumsum(np.linspace(120,45,len(k)))/SR)*np.exp(-k/.09)
        y[put_i:put_i+len(kick)]+=kick[:len(y)-put_i]
        hh=F(nz(.05),7000,'high')*np.exp(-T(.05)/.012);j=int((i+.5)*spb*SR);y[j:j+len(hh)]+=hh[:max(0,len(y)-j)]*.3
        notes=[220,277,330,277];bt=T(spb*.45);pl=np.sign(np.sin(2*np.pi*notes[i%4]*bt))*np.exp(-bt/.12)*.12;y[put_i:put_i+len(pl)]+=pl[:len(y)-put_i]
    return y
mus=np.zeros(n);h0,h1=hall[0]['t0'],hall[-1]['t1'];put(mus,beat(h1-h0),h0,.5)
stop=word('l13','stopped')+.1;a=int(stop*SR);b=int(at('dancing',0)*SR)
mus[a:b]*=0.0
mus=F(mus,2500,'low')
# record scratch at music stop, door creak, footsteps
d=T(.4);put(fx,norm(F(nz(.4),2500,'low')*np.sin(2*np.pi*np.cumsum(np.linspace(900,150,len(d)))/SR)),stop-.05,.5)
d=T(1.2);put(fx,norm(np.sin(2*np.pi*np.cumsum(220+60*np.sin(d*14))/SR)*F(nz(1.2),1500,'low')*np.exp(-d/.6)),at('door',.4),.35)
# whoosh for letter, chomp for dog
d=T(1.0);put(fx,norm(F(nz(1),1200,'low')*np.sin(np.pi*d)),word('l09','wind'),.45)
for j in range(4):d=T(.12);put(fx,norm(F(nz(.12),900,'low')*np.exp(-d/.03)),word('l10','dog')+j*.18,.5)
d=T(.3);put(fx,norm(np.sin(2*np.pi*np.cumsum(np.linspace(700,500,len(d)))/SR)*np.exp(-d/.1)),word('l10','dog')-.3,.3)
# straw slurp
d=T(.5);put(fx,norm(F(nz(.5),3000,'low')*(np.sin(d*60)>0)*np.exp(-d/.3)),word('l12','juice')+.25,.3)
mix=bed+mus+fx
for h in TL['huss']:
    a=int((h-.02)*SR);b=int((h+1.95)*SR);mix[a:b]*=.15  # quiet gap for the huss sound
e=int((D-.6)*SR);mix[e:]*=np.linspace(1,0,n-e)
wavfile.write('sfx.wav',SR,(np.clip(np.tanh(mix*1.4)*.5,-1,1)*32767).astype(np.int16))
vo=np.zeros(n)
for L in TL['lines']:
    sr,x=wavfile.read(f"vo/{L['id']}.wav");x=x.astype(np.float32)/32768;i=int(L['vo0']*SR);vo[i:i+len(x)]+=x[:n-i]
wavfile.write('vo.wav',SR,(np.clip(vo,-1,1)*32767).astype(np.int16))
with open('huss_markers.txt','w') as f:
    f.write("HUSS spots (seconds) - 2.0 s gaps, the screen shows 'HUSS!' 3 times in each:\n")
    for h in TL['huss']:f.write(f"  {h:.2f}s  ({int(h//60)}:{h%60:05.2f})\n")
print(open('huss_markers.txt').read())
