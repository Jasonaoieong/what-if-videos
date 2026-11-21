import json, numpy as np, subprocess
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=44100; R=np.random.default_rng(7); TL=json.load(open('timeline.json')); D=TL['duration']+0.3
S={s['shot']:s for s in TL['scenes']}
def at(shot,k): s=S[shot]; return s['t0']+k*(s['t1']-s['t0'])
lp=lambda x,f:sosfilt(butter(4,f,'low',fs=SR,output='sos'),x)
hp=lambda x,f:sosfilt(butter(4,f,'high',fs=SR,output='sos'),x)
bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def T(sec): return np.arange(int(sec*SR))/SR
def nz(sec): return R.standard_normal(int(sec*SR))
def env(sec,a=.005,dec=.3): t=T(sec); return np.minimum(1,t/a)*np.exp(-t/dec)
def norm(x,p=1): return x/(np.abs(x).max()+1e-9)*p
def whoosh(sec=.45,up=True):
    t=T(sec); e=np.sin(np.pi*t/sec)**2; x=nz(sec); f=np.linspace(400,3000,len(t)) if up else np.linspace(3000,300,len(t))
    y=np.zeros_like(x); 
    for i in range(0,len(x),1024): y[i:i+1024]=bp(x[i:i+1024+256],max(80,f[i]*.5),min(18000,f[i]*1.5))[:len(x[i:i+1024])]
    return norm(y*e,.8)
def boom(sec=2.5,f0=70): t=T(sec); s=np.sin(2*np.pi*np.cumsum(np.linspace(f0,28,len(t)))/SR)*np.exp(-t/.7); n=lp(nz(sec),400)*np.exp(-t/.5); return norm(s+n*.8,1)
def thunder(sec=3): t=T(sec); n=lp(nz(sec),300); cr=hp(nz(sec),1500)*np.exp(-t/.08); return norm(n*np.exp(-t/1.1)*(1+.5*np.sin(t*9))+cr*.4,.9)
def clink(f=2600): t=T(.35); return norm(sum(np.sin(2*np.pi*f*m*t)*np.exp(-t/(.12/m)) for m in (1,2.76,5.4))*np.minimum(1,t/.001),.5)
def bonk(): t=T(.4); return norm(np.sin(2*np.pi*np.cumsum(np.linspace(420,160,len(t)))/SR)*np.exp(-t/.12)+lp(nz(.4),900)*np.exp(-t/.02),.9)
def hammer(): t=T(.25); return norm(np.sin(2*np.pi*1900*t)*np.exp(-t/.05)+np.sin(2*np.pi*3100*t)*np.exp(-t/.03)+lp(nz(.25),2500)*np.exp(-t/.015)*2,.8)
def ding(f=1320): t=T(1.2); return norm((np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*2*t)+.25*np.sin(2*np.pi*f*3*t))*np.exp(-t/.4)*np.minimum(1,t/.002),.6)
def bass_hit(): t=T(1.4); return norm(np.sin(2*np.pi*np.cumsum(np.linspace(110,40,len(t)))/SR)*np.exp(-t/.45)+hp(nz(1.4),3000)*np.exp(-t/.04)*.6,1)
def wind(sec): t=T(sec); x=lp(nz(sec),700)*(0.6+.4*np.sin(t*1.7)+.2*np.sin(t*4.3)); return norm(x*np.minimum(1,t/.8)*np.minimum(1,(sec-t)/.4),.6)
def vacuum(sec,f0=180,f1=420):
    t=T(sec); f=np.linspace(f0,f1,len(t)); s=np.sin(2*np.pi*np.cumsum(f)/SR)+.5*np.sin(2*np.pi*np.cumsum(f*2.01)/SR); n=bp(nz(sec),600,4000)
    return norm((s*.4+n*.6)*np.minimum(1,t/.4)*np.minimum(1,(sec-t)/.15),.5)
def riser(sec): t=T(sec); f=np.geomspace(150,1200,len(t)); return norm(np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*.3*(t/sec)**2+bp(nz(sec),800,6000)*(t/sec)**2,.5)
def flutter(sec): t=T(sec); x=bp(nz(sec),1500,7000)*(0.5+.5*np.abs(np.sin(t*37)*np.sin(t*11))); return norm(x*np.minimum(1,t/.2)*np.minimum(1,(sec-t)/.3),.35)
def chaching():
    a=np.concatenate([clink(3200)[:int(.08*SR)],np.zeros(int(.02*SR))]); b=ding(2093)+ding(2637)*.7
    return norm(np.concatenate([bp(nz(.06),2000,8000)*.6,a,b]),.8)
def sparkle():
    x=np.zeros(int(1.2*SR))
    for i,f in enumerate([2093,2637,3136,4186]): s=int(i*.07*SR); d=ding(f)[:len(x)-s]; x[s:s+len(d)]+=d
    return norm(x,.6)
def womp(): t=T(.9); return norm(np.sign(np.sin(2*np.pi*np.cumsum(np.linspace(300,90,len(t)))/SR))*np.exp(-t/.3)*.5,.6)
def scratch(): t=T(.35); f=200+600*np.abs(np.sin(t*28)); return norm(bp(nz(.35),200,3000)*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/.2),.7)

mix=np.zeros(int(D*SR))
def put(x,t,g=1.):
    i=int(t*SR); x=x[:max(0,len(mix)-i)]; mix[i:i+len(x)]+=x*g
put(thunder(2.2),0,.9); put(boom(1.5,60),0,.7); put(whoosh(1.2,False),0.05,.6)
for j in range(14): put(clink(2200+R.random()*1800),0.4+j*.33+R.random()*.1,.35)
put(flutter(at('huss1',0)-0.3),0.3,.5)
put(whoosh(.35),at('except',0)-.12,.8); put(bonk(),at('except',.45),.8)
s=S['plan']; d=s['t1']-s['t0']
for k in (0,1/3,2/3): put(whoosh(.3),s['t0']+k*d-.1,.7)
for j in range(5): put(hammer(),s['t0']+d/3+.15+j*.28,.8)
put(ding(),s['t0']+2*d/3+.1,.6)
put(whoosh(.3),at('rich',0)-.1,.7); put(bass_hit(),at('rich',.05),.9); put(scratch(),at('rich',.6),.5)
put(thunder(3),at('storm',0),1.0); put(wind(S['storm']['t1']-S['storm']['t0']+S['full']['t1']-S['full']['t0']),at('storm',0),.7)
put(vacuum(S['full']['t1']-at('storm',.4),160,300),at('storm',.4),.7); put(vacuum(S['full']['t1']-S['full']['t0'],300,700),at('full',0),.5)
put(riser(S['full']['t1']-S['full']['t0']),at('full',0),.6)
put(boom(3,70),at('boom',0),1.0); put(hp(nz(.6),2500)*env(.6,.001,.15),at('boom',0),.5); put(flutter(2.5),at('boom',.2),.6)
put(whoosh(.35),at('hole',0)-.1,.6); put(flutter(S['hole']['t1']-S['hole']['t0']),at('hole',0),.6); put(womp(),at('hole',.6),.6)
put(whoosh(1.2,False),at('pipe',0),.9); put(boom(1.2,90),at('pipe',.3),.6); put(chaching(),at('pipe',.5),.8)
for j in range(10): put(clink(1800+R.random()*1500),at('pipe',.35)+j*.25,.3)
put(whoosh(.3),at('richest',0)-.1,.6); put(sparkle(),at('richest',.48),.8)
put(thunder(2.5),at('gold',.3),.8)
for j in range(10): put(clink(900+R.random()*600),at('gold',.45)+j*.13,.45)
put(boom(2.2,50),at('gold',.84),.9)
for h in TL['huss']:  # keep the huss gaps clean
    a=int((h-.02)*SR); b=int((h+1.5)*SR); mix[a:b]*=np.linspace(1,0,b-a)**0 * 0.15
mix=np.tanh(mix*.9)*.55
wavfile.write('sfx.wav',SR,(mix*32767).astype(np.int16))
# VO stem
vo=np.zeros(int(D*SR))
for L in TL['lines']:
    sr,x=wavfile.read(f"vo/{L['id']}.wav"); x=x.astype(np.float32)/32768; i=int(L['vo0']*SR); vo[i:i+len(x)]+=x[:len(vo)-i]
wavfile.write('vo.wav',SR,(np.clip(vo,-1,1)*32767).astype(np.int16))
with open('huss_markers.txt','w') as f:
    f.write("Drop your 'huss huss huss' sound at these times (seconds) - each gap is 1.6 s of near-silence:\n")
    for h in TL['huss']: f.write(f"  {h:.2f}s  ({int(h//60)}:{h%60:05.2f})\n")
print(open('huss_markers.txt').read())
