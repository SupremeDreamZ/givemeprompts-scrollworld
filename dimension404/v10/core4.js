function drawDeco(){
 // Authored street-lab props make the roads worth exploring without filling every pixel.
 const props=[[-300,-60,'eye',palette.pink,-.08,.9],[310,-95,'tape',palette.cyan,.08,.9],[-330,220,'shard',palette.acid,-.12,1],[350,215,'node',palette.violet,.08,.95],[-160,390,'eye',palette.gold,.08,.8],[170,420,'shard',palette.cyan,-.1,.85],[610,-30,'tape',palette.red,.08,.8],[-610,30,'node',palette.acid,-.08,.8],[-90,-470,'eye',palette.cyan,.05,.8],[100,-540,'shard',palette.pink,-.06,.8]];
 props.forEach(q=>drawStickerProp(...q));
 // Central portal reactor gives the starting composition a hero object instead of empty grid.
 const c=worldToScreen(0,0);ctx.save();ctx.translate(c[0],c[1]-14*state.zoom);
 for(let k=0;k<3;k++){ctx.strokeStyle=[palette.violet,palette.cyan,palette.acid][k];ctx.globalAlpha=.45-k*.08;ctx.lineWidth=(8-k*2)*state.zoom;ctx.beginPath();ctx.ellipse(0,0,(82-k*18)*state.zoom,(32-k*7)*state.zoom,-.08,0,Math.PI*2);ctx.stroke()}
 ctx.globalAlpha=1;shadowText('404',0,-8*state.zoom,46*state.zoom,palette.paper,'center');text('CENTRAL LAB',0,27*state.zoom,7.5*state.zoom,palette.acid,'center',1000);ctx.restore();
 const dec=[[-245,-115,'// RAW IDEA',palette.acid,-.08],[245,120,'SHIP >',palette.cyan,.05],[-110,470,'SYSTEMS / NOT TRICKS',palette.paper,-.04]];
 for(const [x,y,t,c,rot] of dec){const p=worldToScreen(x,y);ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(rot);ctx.globalAlpha=.38;text(t,0,0,10*state.zoom,c,'center',1000);ctx.restore()}
}

function drawIsoBox(x,y,w,d,h,c,edge='#08060d'){
 const A=worldToScreen(x-w/2,y-d/2),B=worldToScreen(x+w/2,y-d/2),C=worldToScreen(x+w/2,y+d/2),D=worldToScreen(x-w/2,y+d/2);
 const lift=h*state.zoom;poly([A,B,C,D],c,edge,1.5);poly([[D[0],D[1]],[C[0],C[1]],[C[0],C[1]-lift],[D[0],D[1]-lift]],'#09060d',edge,1);poly([[B[0],B[1]],[C[0],C[1]],[C[0],C[1]-lift],[B[0],B[1]-lift]],'#120a19',edge,1);return {A,B,C,D,lift};
}
function drawZoneSet(z,idx){
 const t=state.time;
 // raised island gives each poster-world a physical home
 const plat=[[-155,-105],[155,-105],[155,105],[-155,105]].map(p=>[z.x+p[0],z.y+p[1]]);
 worldPoly(plat,'#100a18',z.c,2);
 const lip=plat.map(p=>worldToScreen(p[0],p[1]));
 poly([[lip[3][0],lip[3][1]],[lip[2][0],lip[2][1]],[lip[2][0],lip[2][1]+10*state.zoom],[lip[3][0],lip[3][1]+10*state.zoom]],'#050308');
 if(z.id==='image'){
   for(let k=0;k<3;k++){const x=z.x-150+k*70,y=z.y+90+(k%2)*28,p=worldToScreen(x,y);drawIsoBox(x,y,44,44,27,z.c2);ctx.strokeStyle=z.c;ctx.lineWidth=4*state.zoom;ctx.beginPath();ctx.arc(p[0],p[1]-25*state.zoom,14*state.zoom,0,Math.PI*2);ctx.stroke();}
 }else if(z.id==='video'){
   for(let k=0;k<3;k++){const x=z.x-120+k*80,y=z.y+100;drawIsoBox(x,y,62,38,32,k===1?z.c:z.c2);const p=worldToScreen(x,y);line(p[0]-15*state.zoom,p[1]-35*state.zoom,p[0]+15*state.zoom,p[1]-35*state.zoom,4*state.zoom,'#08060d',1)}
 }else if(z.id==='brand'){
   drawIsoBox(z.x-125,z.y+105,74,64,74,z.c);drawIsoBox(z.x-35,z.y+118,52,52,48,z.c2);drawIsoBox(z.x+45,z.y+105,82,60,32,palette.paper);
 }else if(z.id==='code'){
   for(let k=0;k<4;k++){const x=z.x-130+k*70,y=z.y+105+(k%2)*18;drawIsoBox(x,y,30,30,64+k*11,k%2?z.c2:z.c)}
 }else{
   for(let k=0;k<5;k++){const a=k/5*Math.PI*2+t*.18,x=z.x+Math.cos(a)*105,y=z.y+110+Math.sin(a)*52,p=worldToScreen(x,y);ctx.fillStyle=k%2?z.c:z.c2;ctx.beginPath();ctx.arc(p[0],p[1]-18*state.zoom,9*state.zoom,0,Math.PI*2);ctx.fill();line(p[0],p[1]-9*state.zoom,p[0],p[1]+6*state.zoom,2*state.zoom,'#4d3e58',.7)}
 }
}
