import json, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=44100; R=np.random.default_rng(3); TL=json.load(open('timeline.json')); D=TL['duration']
SC={s['shot']:s for s in TL['scenes']}; LN={l['id']:l for l in TL['lines']}
def at(shot,k): s=SC[shot]; return s['t0']+k*(s['t1']-s['t0'])
def word(lid,w): return next(x['t0'] for x in LN[lid]['words'] if x['w'].startswith(w))
filt=lambda x,f,ty:sosfilt(butter(4,f,ty,fs=SR,output='sos'),x)
T=lambda s:np.arange(int(s*SR))/SR; nz=lambda s:R.standard_normal(int(s*SR))
norm=lambda x,p=1:x/(np.abs(x).max()+1e-9)*p
n=int(D*SR); bed=np.zeros(n); fx=np.zeros(n)
def put(buf,x,t,g=1.):
    i=int(t*SR); x=x[:max(0,n-i)]; buf[i:i+len(x)]+=x*g
# ambience: rain hiss + drips + low drone (no music)
t=T(D); rain=filt(filt(nz(D),500,'high'),6000,'low')*.25
drips=np.zeros(n)
for j in range(int(D*14)):
    d=T(.03); put(drips,np.sin(2*np.pi*(2000+R.random()*2500)*d)*np.exp(-d/.006)*R.random()*.4,R.random()*D)
drone=(np.sin(2*np.pi*55*t)+.6*np.sin(2*np.pi*82.4*t+np.sin(t*.3))+.3*np.sin(2*np.pi*110.3*t))*(.5+.5*np.sin(t*.21))*.12
bed=rain+drips+drone
night=at('walk',0); bed*=np.clip((t-night+4)/4,.55,1)  # rain grows at night
# whistles
def whistle(notes,dur=.32,dist=False):
    out=[]
    for f in notes:
        d=T(dur); ph=2*np.pi*np.cumsum(f*(1+.012*np.sin(2*np.pi*6*d)))/SR
        e=np.minimum(1,d/.04)*np.minimum(1,(dur-d)/.06); out.append((np.sin(ph)+.15*filt(nz(dur),f*1.5,'low'))*e)
    x=np.concatenate(out)
    if dist:
        x=filt(x,2500,'low'); y=np.zeros(len(x)+int(1.5*SR))
        for k,(dl,g) in enumerate([(0,1),(.11,.5),(.23,.35),(.41,.25),(.67,.15)]): y[int(dl*SR):int(dl*SR)+len(x)]+=x*g
        x=y
    return norm(x,.5)
put(fx,whistle([1320,1568,1175,1320]),word('l07','he'),.8)
put(fx,whistle([1320,1568,1175,1320],.36,True),word('l09','something')+0.15,.7)
# footsteps
def step(heavy=False):
    d=T(.5 if heavy else .12)
    return norm(filt(nz(len(d)/SR),180 if heavy else 1200,'low')*np.exp(-d/(.12 if heavy else .025))+(np.sin(2*np.pi*45*d)*np.exp(-d/.25) if heavy else 0),1)
for k in np.arange(0,SC['walk']['t1']-SC['walk']['t0'],.385): put(fx,step(),SC['walk']['t0']+k,.25)
for k in np.arange(0,SC['run']['t1']-SC['run']['t0'],.19): put(fx,step(),SC['run']['t0']+k,.3)
for k in np.arange(.4,SC['run']['t1']-SC['run']['t0'],.75): put(fx,step(True),SC['run']['t0']+k,.8)
for k in (.2,1.1): put(fx,step(True),at('monster',0)+k,.5)
# streetlight buzz on
d=T(1.2); put(fx,norm(np.sign(np.sin(2*np.pi*120*d))*np.exp(-d/.8)*.3+filt(nz(1.2),3000,'high')*np.exp(-d/.03),.4),at('street',.5),.5)
# fall thud + bag
d=T(.6); put(fx,norm(filt(nz(.6),300,'low')*np.exp(-d/.08)+np.sin(2*np.pi*60*d)*np.exp(-d/.15),1),at('fall',.33),.9)
d=T(.4); put(fx,norm(filt(nz(.4),4000,'low')*np.exp(-d/.1),1),at('bag',.5),.4)
# low hits on monster reveal + point
for tt in (at('monster',0),at('point',.3)):
    d=T(2.5); put(fx,norm(np.sin(2*np.pi*np.cumsum(np.linspace(70,35,len(d)))/SR)*np.exp(-d/.8),1),tt,.6)
# hundred whistles at the end
w0=word('l18','hundred')
for j in range(40):
    sh=R.uniform(.85,1.2); put(fx,whistle([1320*sh,1568*sh,1175*sh,1320*sh],.3+R.random()*.1,True),w0+R.uniform(-.2,1.6),.18)
# keep huss gaps clean: duck ambience, mute fx
for h in TL['huss']:
    a=int((h-.05)*SR); b=int((h+1.55)*SR); bed[a:b]*=.35; fx[a:b]*=0
end=int((D-.5)*SR); bed[end:]*=np.linspace(1,0,n-end); 
amb=np.tanh(bed*1.2)*.5; sfx=np.tanh(fx)*.8
wavfile.write('sfx.wav',SR,(np.clip(amb*.55+sfx*.6,-1,1)*32767).astype(np.int16))
vo=np.zeros(n)
for L in TL['lines']:
    sr,x=wavfile.read(f"vo/{L['id']}.wav"); x=x.astype(np.float32)/32768; i=int(L['vo0']*SR); vo[i:i+len(x)]+=x[:n-i]
wavfile.write('vo.wav',SR,(np.clip(vo,-1,1)*32767).astype(np.int16))
with open('huss_markers.txt','w') as f:
    f.write("Drop your 'huss huss huss' sound at these times - each gap is 1.6 s with the voice silent:\n")
    for h in TL['huss']: f.write(f"  {h:.2f}s  ({int(h//60)}:{h%60:05.2f})\n")
print(open('huss_markers.txt').read())
