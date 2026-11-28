import json, subprocess
L=json.load(open("lines.json"))
def dur(p): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True).stdout)
t=0.0; scenes=[]; lines=[]; huss=[]
for x in L:
    if "say" in x:
        d=dur(f"vo/{x['id']}.wav"); vo0=t+0.12; vo1=vo0+d
        toks=x["say"].lower().split(); wts=[len(w)+(4 if w.endswith("...") else 2.5 if w[-1] in ",.!?" else 1.5) for w in toks]
        tot=sum(wts); acc=vo0; words=[]
        for w,wt in zip(toks,wts): words.append({"w":w,"t0":round(acc,3)}); acc+=d*wt/tot
        lines.append({"id":x["id"],"vo0":round(vo0,3),"vo1":round(vo1,3),"words":words}); t1=vo1+0.3
    else:
        t1=t+x["huss"]; huss.append(round(t+.05,2))
    scenes.append({"shot":x["shot"],"t0":round(t,3),"t1":round(t1,3)}); t=t1
t+=0.6; scenes[-1]["t1"]=round(t,3)
json.dump({"duration":round(t,3),"scenes":scenes,"lines":lines,"huss":huss},open("timeline.json","w"),indent=1)
print("duration",round(t,2),"huss",huss)
