function drawPoster(z,idx){
 const [sx,sy]=worldToScreen(z.x,z.y);const d=Math.hypot(state.x-z.x,state.y-z.y);const near=d<155;
 drawZoneSet(z,idx);
 const depthScale=Math.max(.78,Math.min(1.12,1-((z.x+z.y)-(state.camX+state.camY))/2200));
 const scale=state.zoom*depthScale*(near?1.055:1); const w=205*scale,h=132*scale,depth=17*scale;
 const word={image:'IMAGE',video:'MOTION',brand:'BRAND',code:'BUILD',agent:'AGENTS'}[z.id];
 ctx.save();ctx.translate(sx,sy);
 // ground shadow / portal rim
 ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(10*scale,40*scale,140*scale,30*scale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=z.c;ctx.lineWidth=2*scale;ctx.globalAlpha=.28+.12*Math.sin(state.time*2+idx);ctx.beginPath();ctx.ellipse(0,52*scale,112*scale,18*scale,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
 // deep extrusion
 poly([[-w/2+depth,-h/2+depth],[w/2+depth,-h/2+depth],[w/2+depth,h/2+depth],[-w/2+depth,h/2+depth]],'#030206','#030206',1);
 // graphic face
 rr(-w/2,-h/2,w,h,4*scale);ctx.fillStyle=z.c;ctx.fill();ctx.lineWidth=3*scale;ctx.strokeStyle='#08060d';ctx.stroke();
 // black editorial cutout on left
 poly([[-w/2,-h/2],[-w/2+w*.58,-h/2],[-w/2+w*.49,h/2],[-w/2,h/2]],'#0b0811');
 // tiny label
 ctx.fillStyle=z.c2;ctx.font=`1000 ${7.5*scale}px Inter,system-ui`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('0'+(idx+1)+' // '+z.sub,-w/2+14*scale,-h/2+13*scale);
 // giant category word
 ctx.fillStyle=palette.paper;ctx.font=`1000 ${26*scale}px Inter,system-ui`;ctx.fillText(word,-w/2+14*scale,-h/2+35*scale);
 ctx.fillStyle=z.c2;ctx.font=`1000 ${7.2*scale}px Inter,system-ui`;ctx.fillText(z.n,-w/2+15*scale,-h/2+69*scale);
 // right-side vector glyph, black for graphic contrast
 ctx.save();ctx.translate(w*.23,5*scale);ctx.strokeStyle='#08060d';ctx.fillStyle='#08060d';ctx.lineWidth=5*scale;
 if(z.id==='image'){
   ctx.beginPath();ctx.arc(0,0,27*scale,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,8*scale,0,Math.PI*2);ctx.fill();line(-38*scale,-30*scale,-13*scale,8*scale,6*scale,'#08060d',1);
 }else if(z.id==='video'){
   ctx.strokeRect(-30*scale,-25*scale,60*scale,46*scale);for(let k=0;k<4;k++)line((-30+k*18)*scale,-31*scale,(-20+k*18)*scale,-20*scale,5*scale,'#08060d',1);poly([[-8*scale,-13*scale],[-8*scale,14*scale],[17*scale,0]],'#08060d');
 }else if(z.id==='brand'){
   poly([[-30*scale,-24*scale],[0,-33*scale],[31*scale,-17*scale],[23*scale,19*scale],[-9*scale,31*scale],[-34*scale,10*scale]],'#08060d');rr(-14*scale,-11*scale,33*scale,21*scale,4*scale);ctx.fillStyle=z.c;ctx.fill();
 }else if(z.id==='code'){
   line(-34*scale,-2*scale,-12*scale,-23*scale,6*scale,'#08060d');line(-34*scale,-2*scale,-12*scale,19*scale,6*scale,'#08060d');line(34*scale,-2*scale,12*scale,-23*scale,6*scale,'#08060d');line(34*scale,-2*scale,12*scale,19*scale,6*scale,'#08060d');line(-4*scale,27*scale,8*scale,-29*scale,6*scale,'#08060d');
 }else{
   for(let k=0;k<5;k++){const a=k/5*Math.PI*2,xx=Math.cos(a)*28*scale,yy=Math.sin(a)*21*scale;ctx.beginPath();ctx.arc(xx,yy,6.5*scale,0,Math.PI*2);ctx.fill()}ctx.beginPath();ctx.arc(0,0,10*scale,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 // interaction footer
 ctx.fillStyle='#08060d';ctx.font=`1000 ${7.5*scale}px Inter,system-ui`;ctx.fillText(near?'OPEN TRANSMISSION ↗':'DRIVE HERE',w*.06,h/2-17*scale);
 if(state.seen.has(z.id)){ctx.fillStyle=palette.paper;ctx.beginPath();ctx.arc(w/2-14*scale,-h/2+14*scale,5.5*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#08060d';ctx.font=`1000 ${6*scale}px Inter`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✓',w/2-14*scale,-h/2+14*scale)}
 ctx.restore();
 return {sx,sy,w,h,near,d};
}
