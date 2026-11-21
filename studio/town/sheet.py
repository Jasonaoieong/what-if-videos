import subprocess,sys
ts=sys.argv[1:];fs=[f'stills/t{float(t):.2f}.jpg' for t in ts];inp=[]
for f in fs: inp+=['-i',f]
n=len(fs);cols=6
lay='|'.join(f'{(i%cols)*270}_{(i//cols)*480}' for i in range(n))
fl=''.join(f'[{i}:v]scale=270:480,drawtext=text={ts[i]}:x=8:y=8:fontsize=28:fontcolor=red[v{i}];' for i in range(n))+''.join(f'[v{i}]' for i in range(n))+f'xstack=inputs={n}:layout={lay}:fill=black'
subprocess.run(['ffmpeg','-y','-loglevel','error']+inp+['-filter_complex',fl,'sheet.jpg'],check=True)
