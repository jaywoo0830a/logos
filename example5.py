#!/usr/bin/env python3
"""Generate trig graphs -- textbook quality with LaTeX."""
import numpy as np, matplotlib, os
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Arc
from matplotlib.lines import Line2D
C={'bg':'#f8f9fa','fg':'#1a1a2e','sin':'#e74c3c','cos':'#2980b9','tan':'#27ae60','csc':'#e67e22','sec':'#9b59b6','cot':'#1abc9c','asymp':'#ccc','hl':'#f1c40f','circ':'#2c3e50'}
D=300;F=16
A=os.path.join(os.path.dirname(__file__),'11A')
B_=os.path.join(os.path.dirname(__file__),'11B')
os.makedirs(A,exist_ok=True);os.makedirs(B_,exist_ok=True)
plt.rcParams.update({'font.family':'serif','font.size':F,'axes.facecolor':C['bg'],'figure.facecolor':'white','axes.edgecolor':'#333','axes.grid':True,'grid.color':'#e0e0e0','grid.alpha':0.4,'axes.spines.top':False,'axes.spines.right':False,'text.usetex':True,'pgf.rcfonts':False,'text.latex.preamble':r'\usepackage{noto-serif}'})
bb=dict(boxstyle='round,pad=0.12',facecolor='white',edgecolor='none',alpha=0.85)
def sv(n,fig,F=A):
  plt.tight_layout();fig.savefig(os.path.join(F,n),dpi=D,bbox_inches='tight')
  fig.savefig(os.path.join(F,n.replace('.png','.pdf')),dpi=D,bbox_inches='tight');plt.close(fig)
def ar(ax,cx,cy,r,a1,a2,**kw):
  t=np.linspace(np.radians(a1),np.radians(a2),50);ax.plot(cx+r*np.cos(t),cy+r*np.sin(t),**kw)

def a1():
  fig,ax=plt.subplots(figsize=(6,6));ax.set_aspect('equal');ax.set_xlim(-1.8,1.8);ax.set_ylim(-1.8,1.8)
  ax.set_title(r"1 Radian",fontsize=22,fontweight='bold');r=1.2;th=1.0
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=2))
  ax.plot([0,r],[0,0],color=C['fg'],lw=2);ax.plot([0,r*np.cos(th)],[0,r*np.sin(th)],color=C['fg'],lw=2)
  ax.plot(r*np.cos(np.linspace(0,th,100)),r*np.sin(np.linspace(0,th,100)),color=C['sin'],lw=3)
  ar(ax,0,0,0.35,0,np.degrees(th),color=C['hl'],lw=2)
  ax.annotate(r'1 rad',(0.2,0.1),fontsize=16,color=C['hl'],fontweight='bold',bbox=bb)
  ax.annotate(r'$r$',(r/2,-0.15),fontsize=18,ha='center')
  ax.annotate(r'$r$',(r/2*np.cos(th/2),r/2*np.sin(th/2)+0.1),fontsize=18,ha='center',color=C['sin'],bbox=bb)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);sv('11a1-radian-definition.png',fig)

def a2():
  fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.5,1.5)
  ax.set_title(r'Degrees $\leftrightarrow$ Radians',fontsize=22,fontweight='bold');ax.axis('off');r=1.2
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=2))
  deg=[0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330]
  ld=[r'$0^\circ$',r'$30^\circ$',r'$45^\circ$',r'$60^\circ$',r'$90^\circ$',r'$120^\circ$',r'$135^\circ$',r'$150^\circ$',r'$180^\circ$',r'$210^\circ$',r'$225^\circ$',r'$240^\circ$',r'$270^\circ$',r'$300^\circ$',r'$315^\circ$',r'$330^\circ$']
  lr=[r'$0$',r'$\frac{\pi}{6}$',r'$\frac{\pi}{4}$',r'$\frac{\pi}{3}$',r'$\frac{\pi}{2}$',r'$\frac{2\pi}{3}$',r'$\frac{3\pi}{4}$',r'$\frac{5\pi}{6}$',r'$\pi$',r'$\frac{7\pi}{6}$',r'$\frac{5\pi}{4}$',r'$\frac{4\pi}{3}$',r'$\frac{3\pi}{2}$',r'$\frac{5\pi}{3}$',r'$\frac{7\pi}{4}$',r'$\frac{11\pi}{6}$']
  for d,dl,rl in zip(deg,ld,lr):
    th=np.radians(d);ax.plot([0,r*np.cos(th)],[0,r*np.sin(th)],color='#ddd',lw=0.8);ax.plot(1.05*np.cos(th),1.05*np.sin(th),'o',color=C['fg'],ms=4)
    ax.annotate(dl,((r+0.4)*np.cos(th),(r+0.4)*np.sin(th)),fontsize=11,ha='center',va='center',color='#e74c3c',fontweight='bold')
    ax.annotate(rl,((r-0.4)*np.cos(th),(r-0.4)*np.sin(th)),fontsize=11,ha='center',va='center',color='#2980b9',fontweight='bold')
  ax.legend(handles=[Line2D([0],[0],color='#e74c3c',lw=2),Line2D([0],[0],color='#2980b9',lw=2)],labels=['Degrees','Radians'],fontsize=12,loc='upper right')
  sv('11a2-degree-radian-circle.png',fig)

def a3():
  fig,ax=plt.subplots(figsize=(6.5,6));ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.2,1.2)
  ax.set_title(r'$\cos\theta$, $\sin\theta$',fontsize=22,fontweight='bold')
  th=np.linspace(0,2*np.pi,200);ax.plot(np.cos(th),np.sin(th),color=C['circ'],lw=2)
  ang=np.radians(50);x0,y0=np.cos(ang),np.sin(ang)
  ax.plot([0,x0],[0,y0],color=C['fg'],lw=1.5);ax.plot(x0,y0,'o',color=C['sin'],ms=8)
  ax.plot([0,x0],[y0,y0],'--',color=C['cos'],lw=2);ax.plot([x0,x0],[0,y0],'--',color=C['sin'],lw=2)
  ax.annotate(r'$\sin\theta$',(0.05,y0/2),fontsize=18,color=C['sin'],fontweight='bold',bbox=bb)
  ax.annotate(r'$\cos\theta$',(x0/2,-0.12),fontsize=18,color=C['cos'],fontweight='bold',bbox=bb)
  ar(ax,0,0,0.3,0,np.degrees(ang),color=C['hl'],lw=2);ax.annotate(r'$\theta$',(0.18,0.06),fontsize=18,fontweight='bold',bbox=bb)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.set_xlabel(r'$x$',fontsize=18);ax.set_ylabel(r'$y$',fontsize=18)
  ax.legend(handles=[Line2D([0],[0],color=C['sin'],lw=2),Line2D([0],[0],color=C['cos'],lw=2)],labels=[r'$\sin\theta$',r'$\cos\theta$'],fontsize=14,loc='lower left')
  sv('11a3-unit-circle-cos-sin.png',fig)

def a4():
  fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-1.6,1.6);ax.set_ylim(-1.6,1.6)
  ax.set_title(r"Special Angles",fontsize=22,fontweight='bold');ax.axis('off');r=1.3
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=2))
  sp=[(0,r'$0$',r'$(1,0)$'),(30,r'$\frac{\pi}{6}$',r'$(\frac{\sqrt{3}}{2},\frac12)$'),(45,r'$\frac{\pi}{4}$',r'$(\frac{\sqrt{2}}{2},\frac{\sqrt{2}}{2})$'),(60,r'$\frac{\pi}{3}$',r'$(\frac12,\frac{\sqrt{3}}{2})$'),(90,r'$\frac{\pi}{2}$',r'$(0,1)$')]
  for d,lr,coord in sp:
    th=np.radians(d);x,y=np.cos(th),np.sin(th)
    for q in range(4):
      if q==0: xq,yq=x,y
      elif q==1: xq,yq=-x,y
      elif q==2: xq,yq=-x,-y
      else: xq,yq=x,-y
      if d==0 and q>0: continue
      if d==90 and q%2==1: continue
      ax.plot(xq,yq,'o',color=C['fg'],ms=5);ax.plot([0,xq],[0,yq],color='#ddd',lw=0.5)
    ax.annotate(f'{lr}\n{coord}',(x+0.08,y+0.08),fontsize=11,ha='left',va='bottom',fontweight='bold',bbox=dict(boxstyle='round,pad=0.15',facecolor='white',alpha=0.85))
  sv('11a4-special-angles-unit-circle.png',fig)

def a5():
  fig,axes=plt.subplots(1,2,figsize=(12,5.5))
  ax=axes[0];ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.5,1.5)
  ax.set_title(r"Reference Angle",fontsize=20,fontweight='bold');r=1.2
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  ang=np.radians(150);x,y=np.cos(ang),np.sin(ang);ax.plot([0,x],[0,y],color=C['fg'],lw=1.5);ax.plot(x,y,'o',color=C['sin'],ms=6)
  ax.annotate(r'$\theta=150^\circ$',(x-0.02,y+0.1),fontsize=14,color=C['sin'],bbox=bb)
  ar(ax,0,0,0.4,150,180,color=C['hl'],lw=2.5);ax.annotate(r'$\alpha=30^\circ$',(-0.65,0.22),fontsize=14,color=C['hl'],fontweight='bold',bbox=bb)
  ax.plot([x,x],[0,y],'--',color=C['hl'],lw=1.5);ax.axis('off')
  ax=axes[1];ax.set_aspect('equal');ax.set_xlim(-1.6,1.6);ax.set_ylim(-1.6,1.6)
  ax.set_title(r"ASTC Signs",fontsize=20,fontweight='bold')
  ax.add_patch(plt.Circle((0,0),1.2,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.8);ax.axvline(0,color='#999',lw=0.8)
  for x,y,t,c in [(0.6,0.6,r'QI\\ $\sin+$\ $\cos+$','#27ae60'),(-0.6,0.6,r'QII\\ $\sin+$\ $\cos-$','#e74c3c'),(-0.6,-0.6,r'QIII\\ $\sin-$\ $\cos-$','#e67e22'),(0.6,-0.6,r'QIV\\ $\sin-$\ $\cos+$','#2980b9')]:
    ax.annotate(t,(x,y),fontsize=12,ha='center',va='center',color=c,fontweight='bold',bbox=bb)
  for l,x,y in [(r'A',1.35,1.35),(r'S',-1.35,1.35),(r'T',-1.35,-1.35),(r'C',1.35,-1.35)]:
    ax.annotate(l,(x,y),fontsize=14,ha='center',va='center',fontweight='bold',bbox=bb)
  ax.axis('off');sv('11a5-reference-angles-astc.png',fig)

def a6():
  fig,((a1,a2),(a3,a4))=plt.subplots(2,2,figsize=(12,7),gridspec_kw={'height_ratios':[1,1.2]})
  ax=a1;ax.set_aspect('equal');th=np.linspace(0,2*np.pi,200);ax.plot(np.cos(th),np.sin(th),color='#ccc',lw=1.5)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  for a in np.linspace(0,2*np.pi,13):
    x,y=np.cos(a),np.sin(a);ax.plot([0,x],[0,y],color='#ddd',lw=0.5);ax.plot(x,y,'o',color=C['sin'],ms=3);ax.plot([x,x],[0,y],'--',color=C['sin'],lw=1,alpha=0.5)
  ax.set_title(r'$\sin\theta=y$',fontsize=16,color=C['sin']);ax.axis('off')
  ax=a2;ax.set_aspect('equal');ax.plot(np.cos(th),np.sin(th),color='#ccc',lw=1.5);ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  for a in np.linspace(0,2*np.pi,13):
    x,y=np.cos(a),np.sin(a);ax.plot([0,x],[0,y],color='#ddd',lw=0.5);ax.plot(x,y,'o',color=C['cos'],ms=3);ax.plot([0,x],[y,y],'--',color=C['cos'],lw=1,alpha=0.5)
  ax.set_title(r'$\cos\theta=x$',fontsize=16,color=C['cos']);ax.axis('off')
  ax=a3;x=np.linspace(-np.pi,4*np.pi,500)
  ax.plot(x,np.sin(x),color=C['sin'],lw=2,label=r'$\sin\theta$');ax.plot(x,np.cos(x),color=C['cos'],lw=2,label=r'$\cos\theta$')
  ax.axhline(0,color='#999',lw=0.5);ax.axhline(1,color='#999',lw=0.5,ls=':');ax.axhline(-1,color='#999',lw=0.5,ls=':')
  for n in range(-1,5):
    ax.axvline(n*np.pi,color='#ddd',lw=0.5,ls='--')
    if n%2==0: ax.annotate(f'${n}\\pi$' if n else '$0$',(n*np.pi,-1.3),fontsize=10,ha='center',color='#999')
  ax.set_xlim(-np.pi,4*np.pi);ax.set_ylim(-1.5,1.5);ax.set_xlabel(r'$\theta$',fontsize=16);ax.set_ylabel(r'$y$',fontsize=16)
  ax.set_title(r'$\sin\theta$ and $\cos\theta$',fontsize=18,fontweight='bold');ax.legend(fontsize=14,loc='upper right');ax.grid(True,alpha=0.3)
  ax=a4;ax.axis('off');ax.annotate(r'Period $2\pi$\\Amplitude $1$\\Range $[-1,1]$',(0.1,0.5),fontsize=16,va='center',bbox=bb)
  sv('11a6-sin-cos-graphs.png',fig)

def a7():
  fig,(ax1,ax2)=plt.subplots(1,2,figsize=(12,5))
  ax=ax1;ax.set_aspect('equal');ax.set_xlim(-1.8,1.8);ax.set_ylim(-1.8,1.8)
  ax.set_title(r'$\tan\theta$ = Slope',fontsize=20,fontweight='bold');r=1.2
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  ax.plot([1,1],[-1.5,1.5],':',color=C['tan'],lw=1,label=r'$x=1$');ang=np.radians(35)
  ax.plot([0,1.7*np.cos(ang)],[0,1.7*np.sin(ang)],color=C['tan'],lw=2);yt=np.tan(ang);ax.plot(1,yt,'o',color=C['tan'],ms=6)
  ax.plot([1,1],[0,yt],'--',color=C['tan'],lw=1.5,alpha=0.6)
  ax.annotate(r'$\tan\theta=%.2f$'%yt,(1.05,yt/2),fontsize=16,color=C['tan'],fontweight='bold',bbox=bb)
  ar(ax,0,0,0.3,0,np.degrees(ang),color=C['hl'],lw=2);ax.annotate(r'$\theta$',(0.18,0.05),fontsize=16,bbox=bb);ax.legend(fontsize=14,loc='upper left');ax.axis('off')
  ax=ax2;x=np.linspace(-np.pi/2+0.05,np.pi/2-0.05,400);x2=np.linspace(np.pi/2+0.05,3*np.pi/2-0.05,400)
  ax.plot(x,np.tan(x),color=C['tan'],lw=2);ax.plot(x2,np.tan(x2),color=C['tan'],lw=2)
  for n in range(-1,3): a=n*np.pi+np.pi/2;ax.axvline(a,color=C['asymp'],lw=1.5,ls='--')
  ax.axhline(0,color='#999',lw=0.5);ax.axhline(1,color='#999',lw=0.5,ls=':');ax.axhline(-1,color='#999',lw=0.5,ls=':')
  ax.set_xlim(-np.pi/2-0.3,3*np.pi/2+0.3);ax.set_ylim(-6,6);ax.set_xlabel(r'$\theta$',fontsize=16);ax.set_ylabel(r'$y$',fontsize=16)
  ax.set_title(r'$y=\tan\theta$ --- Period $\pi$',fontsize=18,fontweight='bold');ax.grid(True,alpha=0.3)
  ax.annotate(r'Period $\pi$',(np.pi,5.5),fontsize=14,ha='center',bbox=bb)
  sv('11a7-tan-graph.png',fig)

def a8():
  fig,axes=plt.subplots(3,1,figsize=(10,9))
  x=np.linspace(0.01,2*np.pi-0.01,600)
  for i,(nm,fn,cl,asyms) in enumerate([(r'$\csc\theta=1/\sin\theta$',lambda t:1/np.sin(t),C['csc'],[0,np.pi,2*np.pi]),(r'$\sec\theta=1/\cos\theta$',lambda t:1/np.cos(t),C['sec'],[np.pi/2,3*np.pi/2]),(r'$\cot\theta=1/\tan\theta$',lambda t:1/np.tan(t),C['cot'],[0,np.pi,2*np.pi])]):
    ax=axes[i];y=fn(x);y=np.where(np.abs(y)>8,np.nan,y);ax.plot(x,y,color=cl,lw=2)
    for a in asyms: ax.axvline(a,color=C['asymp'],lw=1,ls='--')
    ax.axhline(0,color='#999',lw=0.5);ax.axhline(1,color='#999',lw=0.5,ls=':');ax.axhline(-1,color='#999',lw=0.5,ls=':');ax.set_xlim(0,2*np.pi);ax.set_ylim(-6,6)
    ax.set_title(nm,fontsize=16,color=cl,fontweight='bold');ax.set_ylabel(r'$y$',fontsize=16);ax.grid(True,alpha=0.3)
    for n in range(5): v=n*np.pi/2;ax.annotate(f'${n}\\pi/2$'if n%2==1 else f'${n//2}\\pi$',(v,-5.8),fontsize=10,ha='center',color='#999')
  axes[2].set_xlabel(r'$\theta$',fontsize=16)
  fig.suptitle(r'Cosecant, Secant, Cotangent',fontsize=22,fontweight='bold',y=1.01);sv('11a8-csc-sec-cot-graphs.png',fig)

def a9():
  for suff,title,rng in [('sin-cos-tan',r'sin, cos, tan',2.0),('csc-sec-cot',r'csc, sec, cot',1.5)]:
    fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-rng,rng);ax.set_ylim(-rng,rng)
    ax.set_title(r"%s on Unit Circle"%title,fontsize=20,fontweight='bold');r=1.2
    ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=2));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
    ang=np.radians(40);x,y=np.cos(ang),np.sin(ang);ax.plot([0,1.9*np.cos(ang)],[0,1.9*np.sin(ang)],color=C['fg'],lw=1.5);ax.plot(x,y,'o',color=C['fg'],ms=6)
    if 'sin' in suff:
      ax.plot([x,x],[0,y],'-',color=C['sin'],lw=3);ax.annotate(r'$\sin$',(x+0.15,y/2),fontsize=18,color=C['sin'],fontweight='bold',bbox=bb)
      ax.plot([0,x],[y,y],'-',color=C['cos'],lw=3);ax.annotate(r'$\cos$',(x/2,y-0.25),fontsize=18,color=C['cos'],fontweight='bold',bbox=bb)
      tv=np.tan(ang);ax.plot([1,1],[0,tv],'-',color=C['tan'],lw=3);ax.plot(1,tv,'o',color=C['tan'],ms=6)
      ax.annotate(r'$\tan$',(1.08,tv/2),fontsize=18,color=C['tan'],fontweight='bold',bbox=bb)
    else:
      cv=1/np.tan(ang) if np.tan(ang) else 0
      if abs(cv)<2: ax.plot([0,cv],[1,1],'-',color=C['cot'],lw=3);ax.plot(cv,1,'o',color=C['cot'],ms=6);ax.annotate(r'$\cot$',(cv/2,1.12),fontsize=18,color=C['cot'],fontweight='bold',bbox=bb)
      svc=1/np.cos(ang);cscv=1/np.sin(ang)
      if abs(svc)<2.5: ax.plot([0,svc*np.cos(ang)],[0,svc*np.sin(ang)],'-',color=C['sec'],lw=3);ax.plot(svc*np.cos(ang),svc*np.sin(ang),'o',color=C['sec'],ms=6);ax.annotate(r'$\sec$',(svc*np.cos(ang)*0.5+0.1,svc*np.sin(ang)*0.5),fontsize=18,color=C['sec'],fontweight='bold',bbox=bb)
      if abs(cscv)<2.5: ax.plot([0,cscv*np.cos(ang)],[0,cscv*np.sin(ang)],'-',color=C['csc'],lw=3);ax.plot(cscv*np.cos(ang),cscv*np.sin(ang),'o',color=C['csc'],ms=6);ax.annotate(r'$\csc$',(cscv*np.cos(ang)*0.5+0.1,cscv*np.sin(ang)*0.5),fontsize=18,color=C['csc'],fontweight='bold',bbox=bb)
      ax.plot([1,1],[-1.5,1.8],':',color='#999',lw=0.8);ax.annotate(r'$x=1$',(1.02,-1.5),fontsize=14,color='#999',bbox=bb)
      ax.plot([0,1],[1,1],':',color='#999',lw=0.8);ax.annotate(r'$y=1$',(-0.1,1.02),fontsize=14,color='#999',rotation=90,bbox=bb)
    ar(ax,0,0,0.35,0,np.degrees(ang),color=C['hl'],lw=2);ax.annotate(r'$\theta$',(0.22,0.07),fontsize=18,bbox=bb);ax.axis('off')
    sv('11a9-%s.png'%suff,fig)

def a10():
  fig,axes=plt.subplots(5,1,figsize=(10,10),sharex=True);x=np.linspace(0,2*np.pi,400)
  stages=[(r'$y=\sin\theta$',np.sin(x),r'Period $2\pi$'),(r'$y=2\sin\theta$',2*np.sin(x),r'Amp $2$'),(r'$y=2\sin(3\theta)$',2*np.sin(3*x),r'Period $2\pi/3$'),(r'$y=2\sin(3\theta-\pi/2)$',2*np.sin(3*x-np.pi/2),r'Shift $+\pi/6$'),(r'$y=2\sin(3\theta-\pi/2)+1$',2*np.sin(3*x-np.pi/2)+1,r'Midline $y=1$')]
  for i,(t,yn,note) in enumerate(stages):
    ax=axes[i];ax.plot(x,yn,color=C['sin'],lw=2);ax.axhline(0,color='#999',lw=0.5);ax.set_ylabel(r'$y$',fontsize=14)
    ax.set_title(f'{i+1}. {t}',fontsize=14,fontweight='bold',loc='left');ax.annotate(note,(0.98,0.85),fontsize=13,ha='right',transform=ax.transAxes,bbox=bb)
    ax.set_ylim(-3.5,3.5);ax.grid(True,alpha=0.3)
  axes[-1].set_xlabel(r'$\theta$',fontsize=16);axes[-1].set_xticks([0,np.pi/2,np.pi,3*np.pi/2,2*np.pi]);axes[-1].set_xticklabels([r'$0$',r'$\pi/2$',r'$\pi$',r'$3\pi/2$',r'$2\pi$'],fontsize=12)
  fig.suptitle(r'Building $y=2\sin(3\theta-\pi/2)+1$',fontsize=20,fontweight='bold');sv('11a10-trig-transformations.png',fig)

def a11():
  fig,ax=plt.subplots(figsize=(7,6));ax.set_title(r'$y=\arcsin x$',fontsize=22,fontweight='bold')
  xs=np.linspace(-np.pi/2,np.pi/2,200);ys=np.sin(xs);xa=np.linspace(-1,1,200);ya=np.arcsin(xa)
  ax.plot(xs,ys,'--',color=C['sin'],lw=2,alpha=0.5,label=r'$\sin\theta$');ax.plot(xa,ya,color=C['sin'],lw=2.5,label=r'$\arcsin x$')
  lim=[-np.pi/2-0.3,np.pi/2+0.3];ax.plot(lim,lim,':',color='#999',lw=1,label=r'$y=x$')
  for xp,yp in [(-np.pi/2,-1),(0,0),(np.pi/2,1)]: ax.plot(xp,yp,'o',color=C['sin'],ms=5);ax.plot(yp,xp,'o',color=C['sin'],ms=5)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.set_xlim(lim);ax.set_ylim(lim);ax.set_xlabel(r'$x$',fontsize=18);ax.set_ylabel(r'$y$',fontsize=18)
  ax.legend(fontsize=14,loc='upper left');ax.grid(True,alpha=0.3);ax.set_aspect('equal');sv('11a11-arcsin-graph.png',fig)

def a12():
  fig,ax=plt.subplots(figsize=(7,6));ax.set_title(r'$y=\arccos x$',fontsize=22,fontweight='bold')
  xc=np.linspace(0,np.pi,200);yc=np.cos(xc);xa=np.linspace(-1,1,200);ya=np.arccos(xa)
  ax.plot(xc,yc,'--',color=C['cos'],lw=2,alpha=0.5,label=r'$\cos\theta$');ax.plot(xa,ya,color=C['cos'],lw=2.5,label=r'$\arccos x$')
  lim=[-0.3,np.pi+0.3];ax.plot(lim,lim,':',color='#999',lw=1,label=r'$y=x$')
  for xp,yp in [(0,1),(np.pi/2,0),(np.pi,-1)]: ax.plot(xp,yp,'o',color=C['cos'],ms=5);ax.plot(yp,xp,'o',color=C['cos'],ms=5)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.set_xlim(lim);ax.set_ylim(lim);ax.set_xlabel(r'$x$',fontsize=18);ax.set_ylabel(r'$y$',fontsize=18)
  ax.legend(fontsize=14,loc='upper left');ax.grid(True,alpha=0.3);ax.set_aspect('equal');sv('11a12-arccos-graph.png',fig)

def a13():
  fig,ax=plt.subplots(figsize=(7,6));ax.set_title(r'$y=\arctan x$',fontsize=22,fontweight='bold')
  x=np.linspace(-8,8,300);y=np.arctan(x);ax.plot(x,y,color=C['tan'],lw=2.5,label=r'$\arctan x$')
  ax.axhline(np.pi/2,color=C['asymp'],lw=1.5,ls='--',label=r'$\pi/2$');ax.axhline(-np.pi/2,color=C['asymp'],lw=1.5,ls='--',label=r'$-\pi/2$')
  ax.plot(1,np.pi/4,'o',color=C['tan'],ms=5);ax.annotate(r'$(1,\pi/4)$',(1.1,np.pi/4+0.1),fontsize=14,color=C['tan'],bbox=bb)
  ax.plot(-1,-np.pi/4,'o',color=C['tan'],ms=5);ax.annotate(r'$(-1,-\pi/4)$',(-1-2.5,-np.pi/4-0.1),fontsize=14,color=C['tan'],bbox=bb)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.set_xlim(-8,8);ax.set_ylim(-np.pi/2-0.3,np.pi/2+0.3);ax.set_xlabel(r'$x$',fontsize=18);ax.set_ylabel(r'$y$',fontsize=18)
  ax.legend(fontsize=14,loc='lower right');ax.grid(True,alpha=0.3);sv('11a13-arctan-graph.png',fig)

def a14():
  fig,ax=plt.subplots(figsize=(10,5));ax.set_title(r'$\arcsin(\sin\theta)$',fontsize=22,fontweight='bold')
  x=np.linspace(-2*np.pi,2*np.pi,1000);y=np.arcsin(np.sin(x));ax.plot(x,y,color=C['sin'],lw=2.5,label=r'$\arcsin(\sin\theta)$')
  ax.plot(x,x,':',color='#999',lw=1,alpha=0.5,label=r'$y=\theta$');ax.axvspan(-np.pi/2,np.pi/2,alpha=0.08,color=C['sin'])
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.set_xlim(-2*np.pi,2*np.pi);ax.set_ylim(-np.pi/2-0.3,np.pi/2+0.3)
  for n in range(-2,3): ax.axvline(n*np.pi,color='#ddd',lw=0.5,ls='--')
  ax.set_xticks([-2*np.pi,-np.pi,0,np.pi,2*np.pi]);ax.set_xticklabels([r'$-2\pi$',r'$-\pi$',r'$0$',r'$\pi$',r'$2\pi$'],fontsize=12)
  ax.set_xlabel(r'$\theta$',fontsize=18);ax.set_ylabel(r'$y$',fontsize=18);ax.legend(fontsize=14,loc='upper left');ax.grid(True,alpha=0.3)
  sv('11a14-arcsin-composition.png',fig)

def a15():
  fig=plt.figure(figsize=(10,5));gs=fig.add_gridspec(1,2)
  ax=fig.add_subplot(gs[0,0]);ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.5,1.5)
  ax.set_title(r"Unit Circle",fontsize=18,fontweight='bold')
  th=np.linspace(0,2*np.pi,200);ax.plot(np.cos(th),np.sin(th),color=C['circ'],lw=1.5);ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  for a in np.linspace(0,2*np.pi,13): x,y=np.cos(a),np.sin(a);ax.plot(x,y,'o',color=C['sin'],ms=3);ax.plot([0,x],[0,y],color='#ddd',lw=0.5)
  curr=np.radians(60);cx,cy=np.cos(curr),np.sin(curr);ax.plot(cx,cy,'o',color=C['sin'],ms=8);ax.plot([0,cx],[0,cy],color=C['fg'],lw=2);ax.plot([cx,cx],[0,cy],'--',color=C['sin'],lw=1.5)
  ax.annotate(r'$P(\theta)$',(cx+0.08,cy+0.08),fontsize=14,fontweight='bold',bbox=bb);ax.axis('off')
  ax=fig.add_subplot(gs[0,1]);ax.set_title(r"Sine Wave",fontsize=18,fontweight='bold')
  t=np.linspace(0,2*np.pi,300);ax.plot(t,np.sin(t),color=C['sin'],lw=2.5)
  for a in np.linspace(0,2*np.pi,13): ax.axvline(a,color='#ddd',lw=0.5,ls='--');ax.plot(a,np.sin(a),'o',color=C['sin'],ms=3)
  ax.plot(curr,np.sin(curr),'o',color=C['sin'],ms=8);ax.axhline(0,color='#999',lw=0.5);ax.set_xlim(0,2*np.pi);ax.set_ylim(-1.5,1.5)
  ax.set_xlabel(r'$\theta$',fontsize=16);ax.set_ylabel(r'$\sin\theta$',fontsize=16,color=C['sin']);ax.grid(True,alpha=0.3)
  for n in range(5): v=n*np.pi/2;ax.annotate(f'${n}\\pi/2$'if n%2==1 else f'${n//2}\\pi$',(v,-1.3),fontsize=10,ha='center',color='#999')
  sv('11a15-unit-circle-to-sine-unwrap.png',fig)

def a16():
  examples=[('cos-arcsin',r'$\cos(\arcsin\frac{3}{5})$',3/5,5,'arcsin',C['sin']),
            ('tan-arccos',r'$\tan(\arccos(-\frac{5}{13}))$',-5/13,13,'arccos',C['cos']),
            ('sin-arctan',r'$\sin(\arctan\frac{3}{4})$',3/4,4,'arctan',C['tan'])]
  for suff,title,val,scale,mode,color in examples:
    fig,ax=plt.subplots(figsize=(5,5));ax.set_aspect('equal');ax.axis('off')
    if mode=='arcsin': opp=val*scale;adj=np.sqrt(1-val**2)*scale;h=1*scale
    elif mode=='arccos': adj=val*scale;opp=np.sqrt(1-val**2)*scale;h=1*scale
    else: opp=val*scale;adj=1*scale;h=np.sqrt(1+val**2)*scale
    pad=0.4;mx=max(abs(adj),opp,h)+pad
    ax.set_xlim(-mx if adj<0 else -pad,mx);ax.set_ylim(-pad,mx)
    ax.plot([0,adj,adj,0],[0,0,opp,0],'o-',color=C['fg'],lw=2.5,ms=7)
    ax.annotate(r'$\theta$',(abs(adj)*0.12+0.05,0.08),fontsize=20,fontweight='bold',bbox=bb)
    ax.annotate(r'$%d$'%abs(int(opp)),(adj+(0.5 if adj>=0 else -0.5),opp/2),fontsize=18,color=color,fontweight='bold',ha='center',va='center',bbox=bb)
    ax.annotate(r'$%d$'%int(abs(adj)),(adj/2,-0.35),fontsize=17,ha='center',va='center',bbox=bb)
    if h>0:
      perp=0.5;nx,ny=-opp/h,adj/h
      ax.annotate(r'$%d$'%int(h),(adj/2+nx*perp,opp/2+ny*perp),fontsize=17,ha='center',va='center',bbox=bb)
    rs=0.2
    if adj>=0: ax.plot([adj-rs,adj-rs,adj],[0,rs,rs],color='#999',lw=1.5)
    else: ax.plot([adj+rs,adj+rs,adj],[0,rs,rs],color='#999',lw=1.5)
    ax.set_title(title,fontsize=14,fontweight='bold',color=color)
    sv('11a16-%s.png'%suff,fig)

# ===== 11B =====
def b1():
  fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-1.8,1.8);ax.set_ylim(-1.8,1.8)
  ax.set_title(r'$e^{i(A+B)}=e^{iA}e^{iB}$',fontsize=20,fontweight='bold');r=1.3
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  A=np.radians(35);B=np.radians(55);AB=A+B
  ax.plot([0,r*np.cos(A)],[0,r*np.sin(A)],color=C['sin'],lw=3,label=r'$e^{iA}$');ax.plot(r*np.cos(A),r*np.sin(A),'o',color=C['sin'],ms=6)
  ax.plot([0,r*np.cos(AB)],[0,r*np.sin(AB)],color=C['cos'],lw=3,label=r'$e^{i(A+B)}$');ax.plot(r*np.cos(AB),r*np.sin(AB),'o',color=C['cos'],ms=6)
  ar(ax,0,0,0.35,0,np.degrees(A),color=C['sin'],lw=2);ax.annotate(r'$A$',(0.22,0.08),fontsize=16,color=C['sin'],bbox=bb)
  ar(ax,0,0,0.5,np.degrees(A),np.degrees(A)+np.degrees(B),color=C['cos'],lw=2);ax.annotate(r'$B$',(0.32,0.25),fontsize=16,color=C['cos'],bbox=bb)
  ax.legend(fontsize=14,loc='upper right');ax.axis('off');sv('11b1-sum-formula-geometric.png',fig,B_)

def b2():
  fig,(ax1,ax2)=plt.subplots(1,2,figsize=(12,5.5));a=3;b=4;R=np.sqrt(a**2+b**2);phi=np.arctan2(b,a)
  ax=ax1;ax.set_aspect('equal');ax.set_xlim(-0.5,5.5);ax.set_ylim(-0.5,5.5)
  ax.set_title(r"Phasor Triangle",fontsize=20,fontweight='bold')
  ax.arrow(0,0,a,0,head_width=0.15,head_length=0.15,fc=C['sin'],ec=C['sin'],lw=2.5,label=r'$a=3$')
  ax.arrow(a,0,0,b,head_width=0.15,head_length=0.15,fc=C['cos'],ec=C['cos'],lw=2.5,label=r'$b=4$')
  ax.arrow(0,0,R*np.cos(phi),R*np.sin(phi),head_width=0.15,head_length=0.15,fc=C['tan'],ec=C['tan'],lw=3,label=r'$R=5$')
  r=0.2;ax.plot([a-r,a-r,a],[0,r,0],color='#999',lw=1)
  ar(ax,0,0,0.5,0,np.degrees(phi),color=C['hl'],lw=2);ax.annotate(r'$\phi$',(0.3,0.1),fontsize=18,fontweight='bold',bbox=bb)
  ax.legend(fontsize=14,loc='upper right');ax.grid(True,alpha=0.3)
  ax=ax2;x=np.linspace(0,2*np.pi,300)
  ax.plot(x,a*np.sin(x)+b*np.cos(x),color=C['sin'],lw=2,alpha=0.3)
  ax.plot(x,R*np.sin(x+phi),color=C['tan'],lw=2.5,label=r'$5\sin(x+\phi)$')
  ax.axhline(0,color='#999',lw=0.5);ax.axhline(R,color='#999',lw=0.5,ls=':');ax.axhline(-R,color='#999',lw=0.5,ls=':');ax.set_xlim(0,2*np.pi);ax.set_ylim(-R-0.5,R+0.5)
  ax.set_title(r"Combined Wave",fontsize=20,fontweight='bold');ax.set_xlabel(r'$x$',fontsize=16);ax.set_ylabel(r'$y$',fontsize=16);ax.legend(fontsize=14,loc='upper right');ax.grid(True,alpha=0.3)
  sv('11b2-harmonic-addition.png',fig,B_)

def b3():
  fig,axes=plt.subplots(3,1,figsize=(10,8),sharex=True);x=np.linspace(0,4*np.pi,500);y1=np.sin(10*x/4);y2=np.sin(12*x/4)
  axes[0].plot(x,y1,color=C['sin'],lw=1.5,label=r'$\sin(\omega_1t)$');axes[0].plot(x,y2,'--',color=C['cos'],lw=1.5,alpha=0.7,label=r'$\sin(\omega_2t)$')
  axes[0].set_title(r"Two Frequencies",fontsize=16,fontweight='bold');axes[0].set_ylabel(r'$y$',fontsize=14);axes[0].legend(fontsize=12);axes[0].set_ylim(-1.5,1.5);axes[0].grid(True,alpha=0.2)
  ys=y1+y2;axes[1].plot(x,ys,color=C['tan'],lw=2);axes[1].set_title(r"Beat Pattern",fontsize=16,fontweight='bold');axes[1].set_ylabel(r'$y$',fontsize=14);axes[1].set_ylim(-2.5,2.5);axes[1].grid(True,alpha=0.2)
  env=2*np.cos(0.5*x);axes[2].plot(x,ys,color=C['tan'],lw=2,label=r'$\sin\omega_1+\sin\omega_2$');axes[2].plot(x,env,'--',color=C['sin'],lw=1.5,label=r'Envelope');axes[2].plot(x,-env,'--',color=C['sin'],lw=1.5)
  axes[2].set_title(r"Envelope Revealed",fontsize=16,fontweight='bold');axes[2].set_xlabel(r'$t$',fontsize=16);axes[2].set_ylabel(r'$y$',fontsize=14);axes[2].legend(fontsize=12);axes[2].set_ylim(-2.5,2.5);axes[2].grid(True,alpha=0.2)
  fig.suptitle(r'Beat Patterns',fontsize=20,fontweight='bold');sv('11b3-sum-product-waves.png',fig,B_)

def b4():
  fig,axes=plt.subplots(3,1,figsize=(10,9))
  exs=[(r'$\sin x=\frac12$',0.5,'sin',C['sin']),(r'$\cos x=-\frac{\sqrt3}{2}$',-np.sqrt(3)/2,'cos',C['cos']),(r'$\tan x=-1$',-1,'tan',C['tan'])]
  for i,(t,k,fn,cl) in enumerate(exs):
    ax=axes[i];x=np.linspace(-np.pi,5*np.pi,500)
    if fn=='sin': y=np.sin(x)
    elif fn=='cos': y=np.cos(x)
    else: y=np.tan(x);y=np.where(np.abs(y)>5,np.nan,y)
    ax.plot(x,y,color=cl,lw=2);ax.axhline(k,color=C['hl'],lw=1.5,ls='--',label=r'$y=%.2f$'%k);ax.axhline(0,color='#999',lw=0.5)
    if fn=='sin': bs=[np.arcsin(k),np.pi-np.arcsin(k)]
    elif fn=='cos': bs=[np.arccos(k),2*np.pi-np.arccos(k)]
    else: bs=[np.arctan(k)]
    per=2*np.pi if fn!='tan' else np.pi
    for s in bs:
      for n in range(-1,3):
        xs=s+n*per
        if -np.pi<=xs<=5*np.pi: ax.plot(xs,k,'o',color=cl,ms=4)
    ax.set_xlim(-np.pi,5*np.pi)
    if fn!='tan': ax.set_ylim(-2,2)
    else: ax.set_ylim(-5,5)
    ax.set_title(t,fontsize=18,color=cl,fontweight='bold');ax.set_ylabel(r'$y$',fontsize=14);ax.legend(fontsize=12,loc='upper right');ax.grid(True,alpha=0.3)
  axes[-1].set_xlabel(r'$x$',fontsize=16);fig.suptitle(r'Trig Equations --- Periodic Solutions',fontsize=20,fontweight='bold')
  sv('11b4-trig-equation-solutions.png',fig,B_)

def b5():
  fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-1.8,2.5);ax.set_ylim(-1.8,1.8)
  ax.set_title(r'$t=\tan\frac{x}{2}$',fontsize=20,fontweight='bold')
  ax.add_patch(plt.Circle((0,0),1,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  ang=np.radians(50);px,py=np.cos(ang),np.sin(ang)
  ax.plot(px,py,'o',color=C['sin'],ms=7,zorder=5)
  ax.annotate(r'$P=(\cos 50^\circ,\sin 50^\circ)$',(px+0.05,py+0.12),fontsize=11,color=C['sin'],bbox=bb)
  ax.plot(-1,0,'o',color=C['fg'],ms=6,zorder=5);ax.annotate(r'$(-1,0)$',(-1-0.3,-0.15),fontsize=13,bbox=bb)
  t_val=np.tan(ang/2);ax.plot([-1,0],[0,t_val],color=C['tan'],lw=2,ls='--',zorder=3)
  ax.plot(0,t_val,'o',color=C['tan'],ms=7,zorder=5)
  ax.annotate(r'$t=\tan\frac{x}{2}=%.2f$'%t_val,(0.08,t_val+0.1),fontsize=15,color=C['tan'],fontweight='bold',bbox=bb)
  ar(ax,0,0,0.35,0,np.degrees(ang),color=C['hl'],lw=2);ax.annotate(r'$x$',(0.22,0.08),fontsize=16,bbox=bb)
  ax.axis('off');sv('11b5-weierstrass-substitution.png',fig,B_)

def b6():
  fig,axes=plt.subplots(1,3,figsize=(14,4.5))
  exs=[(r'$\sin x>\frac12$',0.5,'sin',C['sin']),(r'$\cos x\leq-\frac{\sqrt2}{2}$',-np.sqrt(2)/2,'cos',C['cos']),(r'$\tan x>1$',1,'tan',C['tan'])]
  for i,(t,k,fn,cl) in enumerate(exs):
    ax=axes[i];ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.5,1.5);ax.set_title(t,fontsize=16,color=cl,fontweight='bold')
    r=1.2;ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
    if fn=='sin':
      th=np.arcsin(k);pts=np.linspace(th,np.pi-th,100);ax.fill(np.append([0],np.cos(pts)),np.append([0],np.sin(pts)),color=cl,alpha=0.15);ax.axhline(k,color=cl,lw=1.5,ls='--')
    elif fn=='cos':
      th=np.arccos(k);pts=np.linspace(th,2*np.pi-th,100);ax.fill(np.append([0],np.cos(pts)),np.append([0],np.sin(pts)),color=cl,alpha=0.15);ax.axvline(k,color=cl,lw=1.5,ls='--')
    else:
      th=np.arctan(k);pts1=np.linspace(th,np.pi/2-0.05,50);ax.fill(np.append([0],np.cos(pts1)),np.append([0],np.sin(pts1)),color=cl,alpha=0.15)
      pts2=np.linspace(np.pi+th,3*np.pi/2-0.05,50);ax.fill(np.append([0],np.cos(pts2)),np.append([0],np.sin(pts2)),color=cl,alpha=0.15)
    ax.axis('off')
  sv('11b6-trig-inequalities.png',fig,B_)

def b7():
  fig,ax=plt.subplots(figsize=(7,7));ax.set_aspect('equal');ax.set_xlim(-2.2,2.2);ax.set_ylim(-2.2,2.2)
  ax.set_title(r'$e^{i\theta}=\cos\theta+i\sin\theta$',fontsize=18,fontweight='bold');r=1.8
  ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=1);ax.axvline(0,color='#999',lw=1)
  ax.annotate(r'Re',(2.0,0.05),fontsize=16,color='#555');ax.annotate(r'Im',(0.05,2.0),fontsize=16,color='#555')
  ang=np.radians(50);x,y=r*np.cos(ang),r*np.sin(ang);ax.arrow(0,0,x,y,head_width=0.1,head_length=0.1,fc=C['fg'],ec=C['fg'],lw=2.5)
  ax.plot(x,y,'o',color=C['fg'],ms=6)
  ax.plot([x,x],[0,y],'--',color=C['sin'],lw=2);ax.plot([0,x],[y,y],'--',color=C['cos'],lw=2);ax.plot(x,0,'o',color=C['cos'],ms=4);ax.plot(0,y,'o',color=C['sin'],ms=4)
  ax.annotate(r'$\cos\theta$',(x/2,-0.12),fontsize=16,color=C['cos'],fontweight='bold',bbox=bb)
  ax.annotate(r'$\sin\theta$',(-0.12,y/2),fontsize=16,color=C['sin'],fontweight='bold',bbox=bb)
  ar(ax,0,0,0.35,0,np.degrees(ang),color=C['hl'],lw=2);ax.annotate(r'$\theta$',(0.22,0.07),fontsize=18,fontweight='bold',bbox=bb)
  sv('11b7-euler-formula-complex.png',fig,B_)

def b8():
  fig,ax=plt.subplots(figsize=(9,6));ax.set_title(r"Chebyshev $T_n(x)$",fontsize=22,fontweight='bold')
  x=np.linspace(-1,1,300);cs=['#e74c3c','#2980b9','#27ae60','#e67e22','#9b59b6']
  for n in range(1,6): ax.plot(x,np.cos(n*np.arccos(x)),color=cs[n-1],lw=2,label=r'$T_{%d}(x)$'%n)
  ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5);ax.axhline(1,color='#999',lw=0.5,ls=':');ax.axhline(-1,color='#999',lw=0.5,ls=':')
  ax.set_xlim(-1.05,1.05);ax.set_ylim(-1.3,1.3);ax.set_xlabel(r'$x$',fontsize=18);ax.set_ylabel(r'$T_n(x)$',fontsize=18);ax.legend(fontsize=14,loc='lower right',ncol=2);ax.grid(True,alpha=0.3)
  sv('11b8-chebyshev-polynomials.png',fig,B_)

def b9():
  fig,(a1,a2)=plt.subplots(1,2,figsize=(12,5.5))
  ax=a1;x=np.linspace(-3,3,300);y=x**3-3*x-1;ax.plot(x,y,color=C['fg'],lw=2,label=r'$f(x)=x^3-3x-1$');ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  roots=[2*np.cos(np.pi/9),2*np.cos(7*np.pi/9),2*np.cos(13*np.pi/9)]
  for r in roots: ax.plot(r,0,'o',color=C['sin'],ms=6)
  ax.set_xlim(-2.5,2.5);ax.set_ylim(-4,4);ax.set_title(r"$x^3-3x-1=0$",fontsize=18,fontweight='bold');ax.set_xlabel(r'$x$',fontsize=16);ax.set_ylabel(r'$f(x)$',fontsize=16);ax.legend(fontsize=14);ax.grid(True,alpha=0.3)
  ax=a2;ax.set_aspect('equal');ax.set_xlim(-1.5,1.5);ax.set_ylim(-1.5,1.5);ax.set_title(r"3 Roots on Unit Circle",fontsize=18,fontweight='bold')
  r=1.2;ax.add_patch(plt.Circle((0,0),r,fill=False,color=C['circ'],lw=1.5));ax.axhline(0,color='#999',lw=0.5);ax.axvline(0,color='#999',lw=0.5)
  sa=[np.pi/9,7*np.pi/9,13*np.pi/9];cs=[C['sin'],C['cos'],C['tan']]
  for i,a in enumerate(sa): ax.plot([0,r*np.cos(a)],[0,r*np.sin(a)],color=cs[i],lw=2);ax.plot(r*np.cos(a),r*np.sin(a),'o',color=cs[i],ms=6)
  ax.axis('off');fig.suptitle(r'Cubic via Trigonometry',fontsize=20,fontweight='bold');sv('11b9-cubic-trigonometric.png',fig,B_)

def b10():
  fig,axes=plt.subplots(3,1,figsize=(10,8),sharex=True);x=np.linspace(-np.pi,3*np.pi,1000)
  for idx,(terms,title) in enumerate(zip([1,3,10],[r'1 term',r'3 terms',r'10 terms'])):
    ax=axes[idx];y=np.zeros_like(x)
    for n in range(1,terms*2,2): y+=(4/np.pi)*np.sin(n*x)/n
    ax.plot(x,y,color=C['sin'],lw=1.5);sq=np.where((x%(2*np.pi))<np.pi,1,-1);ax.plot(x,sq,'--',color='#999',lw=1,alpha=0.5)
    ax.set_ylim(-1.8,1.8);ax.set_ylabel(r'$f(x)$',fontsize=14);ax.set_title(r'%s'%title,fontsize=16,fontweight='bold',color=C['sin']);ax.grid(True,alpha=0.3)
  axes[-1].set_xlabel(r'$x$',fontsize=16);axes[-1].set_xticks([-np.pi,0,np.pi,2*np.pi,3*np.pi]);axes[-1].set_xticklabels([r'$-\pi$',r'$0$',r'$\pi$',r'$2\pi$',r'$3\pi$'],fontsize=12)
  fig.suptitle(r'Fourier: Square Wave',fontsize=20,fontweight='bold');sv('11b10-fourier-series.png',fig,B_)

def b11():
  fig,ax=plt.subplots(figsize=(10,6));ax.axis('off');ax.set_xlim(0,10);ax.set_ylim(0,7)
  ax.set_title(r"Identity Connections",fontsize=20,fontweight='bold',y=1.02)
  nodes={'euler':(5,6.2,r"Euler's Formula\\ $e^{i\theta}=\cos\theta+i\sin\theta$",'#2c3e50','#fef9e7'),
         'sum':(3,4.5,r'Sum/Difference\\ $\sin(A\pm B)$','#c0392b','#fadbd8'),
         'double':(1,3.0,r'Double-Angle\\ $\sin2\theta$','#e67e22','#fdebd0'),
         'power':(1,1.5,r'Power-Reduction\\ $\sin^2\theta$','#27ae60','#d5f5e3'),
         'harmonic':(8,4.5,r'Harmonic Add\\ $a\sin x+b\cos x$','#2980b9','#d6eaf8'),
         'prodsum':(5,3.0,r'Product$\leftrightarrow$Sum\\ $\sin A\cos B$','#8e44ad','#e8daef'),
         'chebyshev':(8,3.0,r'Chebyshev\\ $T_n(\cos\theta)$','#16a085','#d1f2eb'),
         'weierstrass':(8,1.5,r'Weierstrass\\ $t=\tan\frac{x}{2}$','#e74c3c','#fadbd8')}
  edges=[('euler','sum'),('sum','double'),('double','power'),('euler','harmonic'),('sum','prodsum'),('double','chebyshev'),('harmonic','weierstrass')]
  for s,d in edges: ax.annotate('',xy=(nodes[d][0],nodes[d][1]-0.2),xytext=(nodes[s][0],nodes[s][1]-0.2),arrowprops=dict(arrowstyle='->',color='#999',lw=1.5,connectionstyle='arc3,rad=0.1'))
  for k,(x,y,lb,tc,bc) in nodes.items(): ax.annotate(lb,(x,y),fontsize=12,ha='center',va='center',color=tc,fontweight='bold',bbox=dict(boxstyle='round,pad=0.4',facecolor=bc,edgecolor=tc,alpha=0.9))
  sv('11b11-identity-family-tree.png',fig,B_)

def b12():
  fig,axes=plt.subplots(1,2,figsize=(12,5.5))
  ax=axes[0];ax.set_aspect('equal');ax.set_title(r"Law of Sines",fontsize=20,fontweight='bold')
  pts=[(0,0),(5,0),(2,3.5)];ax.fill([p[0] for p in pts],[p[1] for p in pts],alpha=0.08,color=C['sin'])
  ax.plot([p[0] for p in pts]+[pts[0][0]],[p[1] for p in pts]+[pts[0][1]],'o-',color=C['fg'],lw=2)
  for p,l,o in [(pts[0],'A',(-0.35,-0.3)),(pts[1],'B',(5.1,-0.3)),(pts[2],'C',(2.1,3.8))]: ax.annotate(l,p,xytext=o,fontsize=18,fontweight='bold')
  ax.annotate(r'$a$',((5+2)/2+0.2,(0+3.5)/2),fontsize=16,color=C['sin'],fontweight='bold');ax.annotate(r'$b$',((0+2)/2-0.3,(0+3.5)/2+0.1),fontsize=16,color=C['cos'],fontweight='bold');ax.annotate(r'$c$',((0+5)/2,-0.25),fontsize=16,color=C['tan'],fontweight='bold')
  ax.set_xlim(-0.8,5.8);ax.set_ylim(-0.8,4.2);ax.axis('off')
  ax=axes[1];ax.set_aspect('equal');ax.set_title(r"Law of Cosines",fontsize=20,fontweight='bold')
  pts=[(0,0),(4,0),(1.5,2.8)];ax.fill([p[0] for p in pts],[p[1] for p in pts],alpha=0.08,color=C['cos'])
  ax.plot([p[0] for p in pts]+[pts[0][0]],[p[1] for p in pts]+[pts[0][1]],'o-',color=C['fg'],lw=2)
  for p,l,o in [(pts[0],'A',(-0.35,-0.3)),(pts[1],'B',(4.1,-0.3)),(pts[2],'C',(1.6,3.2))]: ax.annotate(l,p,xytext=o,fontsize=18,fontweight='bold')
  ax.annotate(r'$a$',((4+1.5)/2+0.2,(0+2.8)/2),fontsize=16,color=C['sin'],fontweight='bold');ax.annotate(r'$b$',((0+1.5)/2-0.3,(0+2.8)/2+0.1),fontsize=16,color=C['cos'],fontweight='bold');ax.annotate(r'$c$',((0+4)/2,-0.25),fontsize=16,color=C['tan'],fontweight='bold')
  hx=pts[2][0];ax.plot([hx,hx],[0,pts[2][1]],'--',color='#999',lw=1);r=0.15;ax.plot([hx-r,hx-r,hx],[0,r,r],color='#999',lw=1)
  ax.set_xlim(-0.8,4.8);ax.set_ylim(-0.8,3.6);ax.axis('off');sv('11b12-law-of-sines-cosines.png',fig,B_)

# ===== MAIN =====
print("Generating 11A...")
[print(f"  OK {f.__name__}") or f() for f in [a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16]]
print("Generating 11B...")
[print(f"  OK {f.__name__}") or f() for f in [b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12]]
print("All done!")
