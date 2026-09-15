function drawGround(){
 ctx.fillStyle='#08050c';ctx.fillRect(0,0,W,H);
 const g=ctx.createRadialGradient(W*.52,H*.48,20,W*.52,H*.48,Math.max(W,H)*.8);g.addColorStop(0,'#221036');g.addColorStop(.42,'#100918');g.addColorStop(1,'#06040a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // isometric grid
 ctx.save();ctx.globalAlpha=.18;
 const span=1500,step=100;
 for(let x=-span;x<=span;x+=step){const a=worldToScreen(x,-span),b=worldToScreen(x,span);line(a[0],a[1],b[0],b[1],1,'#78638f',.13)}
 for(let y=-span;y<=span;y+=step){const a=worldToScreen(-span,y),b=worldToScreen(span,y);line(a[0],a[1],b[0],b[1],1,'#78638f',.13)}
 ctx.restore();
 // two extruded road ribbons
 worldPoly([[-900,-58],[900,-58],[900,58],[-900,58]],'#15101e','#24182f',1);
 worldPoly([[-58,-900],[58,-900],[58,900],[-58,900]],'#15101e','#24182f',1);
 const ca=worldToScreen(-900,0),cb=worldToScreen(900,0),cc=worldToScreen(0,-900),cd=worldToScreen(0,900);
 line(ca[0],ca[1],cb[0],cb[1],2,palette.acid,.18);line(cc[0],cc[1],cd[0],cd[1],2,palette.cyan,.16);
 // central floating lab slab
 worldPoly([[-135,-135],[135,-135],[135,135],[-135,135]],'#1b1027','#443052',2);
 worldPoly([[-120,-120],[120,-120],[120,120],[-120,120]],'#0c0912','#6b3cff',1.5);
 // authored routes bind the poster-islands into one world
 zones.forEach(z=>{const a=worldToScreen(0,0),b=worldToScreen(z.x,z.y);line(a[0],a[1],b[0],b[1],11*state.zoom,'#08060d',.72);line(a[0],a[1],b[0],b[1],2.2*state.zoom,z.c,.38)});
}

function drawStickerProp(x,y,type,c,rot=0,sc=1){
 const p=worldToScreen(x,y),S=state.zoom*sc;ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(rot);
 // hard offset shadow makes the prop feel like a die-cut object standing in space
 ctx.save();ctx.translate(6*S,7*S);ctx.globalAlpha=.55;ctx.fillStyle='#020104';
 if(type==='eye'){ctx.fillRect(-4*S,-40*S,8*S,44*S);ctx.beginPath();ctx.ellipse(0,-47*S,23*S,15*S,0,0,Math.PI*2);ctx.fill()}
 else if(type==='tape')ctx.fillRect(-13*S,-48*S,26*S,56*S);
 else if(type==='shard')poly([[-22*S,-34*S],[18*S,-44*S],[28*S,-3*S],[-13*S,9*S]],'#020104');
 else {ctx.beginPath();ctx.arc(0,-28*S,22*S,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 if(type==='eye'){
   ctx.fillStyle='#0b0811';ctx.fillRect(-3*S,-40*S,6*S,42*S);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,-48*S,22*S,14*S,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#08060d';ctx.lineWidth=3*S;ctx.stroke();ctx.fillStyle='#08060d';ctx.beginPath();ctx.arc(3*S,-48*S,6*S,0,Math.PI*2);ctx.fill();
 }else if(type==='tape'){
   ctx.fillStyle=c;ctx.fillRect(-12*S,-48*S,24*S,55*S);ctx.fillStyle='#08060d';ctx.fillRect(-12*S,-18*S,24*S,6*S);ctx.fillStyle='#08060d';ctx.font=`1000 ${6*S}px Inter`;ctx.textAlign='center';ctx.fillText('404',0,-32*S);
 }else if(type==='shard'){
   poly([[-22*S,-34*S],[18*S,-44*S],[28*S,-3*S],[-13*S,9*S]],c,'#08060d',2*S);line(-11*S,-22*S,17*S,-29*S,3*S,'#08060d',1);line(-7*S,-10*S,12*S,-15*S,2*S,'#08060d',1);
 }else{
   ctx.strokeStyle=c;ctx.lineWidth=3*S;ctx.beginPath();ctx.arc(0,-28*S,21*S,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,-28*S,9*S,0,Math.PI*2);ctx.stroke();line(-30*S,-28*S,30*S,-28*S,2*S,c,.8);
 }
 ctx.restore();
}
