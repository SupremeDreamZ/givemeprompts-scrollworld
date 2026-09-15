function drawCar(){
 const [sx,baseSy]=worldToScreen(state.x,state.y);const sy=baseSy-state.jump*state.zoom;state.carScreen=[sx,sy];const sc=state.zoom*1.55;const vx=Math.cos(state.angle),vy=Math.sin(state.angle),sa=Math.atan2((vx+vy)*.30,(vx-vy)*.58);ctx.save();ctx.translate(sx,sy-5*state.zoom);ctx.rotate(sa);
 // speed trail
 if(Math.abs(state.speed)>40){ctx.globalAlpha=Math.min(.28,Math.abs(state.speed)/360);for(let i=1;i<4;i++)line(-34*sc-i*11*sc,0, -12*sc-i*8*sc,0,4*sc,palette.acid,.4);ctx.globalAlpha=1}
 // shadow
 ctx.save();ctx.rotate(-state.angle);ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(7*sc,13*sc,34*sc,13*sc,0,0,Math.PI*2);ctx.fill();ctx.restore();
 // wheels
 ctx.fillStyle='#050408';for(const yy of [-14,14]){rr(-25*sc,yy*sc-5*sc,16*sc,10*sc,3*sc);ctx.fill();rr(12*sc,yy*sc-5*sc,16*sc,10*sc,3*sc);ctx.fill()}
 // body extrusion
 poly([[-25*sc,-16*sc],[23*sc,-16*sc],[31*sc,-9*sc],[31*sc,15*sc],[-23*sc,15*sc],[-30*sc,9*sc]],'#050408');
 poly([[-28*sc,-19*sc],[20*sc,-19*sc],[28*sc,-12*sc],[28*sc,12*sc],[-25*sc,12*sc],[-33*sc,6*sc]],palette.acid,'#08060d',2.4*sc);
 // cabin
 poly([[-9*sc,-14*sc],[15*sc,-14*sc],[20*sc,-7*sc],[18*sc,6*sc],[-10*sc,6*sc]],'#2a1640','#08060d',2*sc);
 // glass
 poly([[-4*sc,-11*sc],[12*sc,-11*sc],[15*sc,-7*sc],[14*sc,-1*sc],[-5*sc,-1*sc]],palette.cyan,'#08060d',1.6*sc);
 // hood slash
 line(-24*sc,-5*sc,-2*sc,-5*sc,4*sc,palette.pink,.95);
 // head light
 ctx.fillStyle=palette.paper;ctx.shadowColor=palette.paper;ctx.shadowBlur=10*sc;ctx.fillRect(-31*sc,-10*sc,4*sc,7*sc);ctx.fillRect(-31*sc,4*sc,4*sc,7*sc);ctx.shadowBlur=0;
 ctx.restore();
 return [sx,sy];
}

let posterRects=[];
function draw(){
 drawGround();drawDeco();posterRects=zones.map(drawPoster);const car=drawCar();
 // simple camera lerp after render state
 state.camX+=(state.x-state.camX)*.105;state.camY+=(state.y-state.camY)*.105;
 // zone tag
 let nearest=zones[0],nd=Infinity;zones.forEach(z=>{const d=Math.hypot(state.x-z.x,state.y-z.y);if(d<nd){nd=d;nearest=z}});
 if(nd<210){ui.zoneTag.classList.add('show');ui.zoneTag.querySelector('span').textContent=nearest.n;ui.zoneTag.querySelector('small').textContent=state.seen.has(nearest.id)?'TRANSMISSION LOGGED':'TAP THE POSTER OR KEEP DRIVING';}else ui.zoneTag.classList.remove('show');
 // drive indicator line
 if(state.drag && state.dragPt){const [cx,cy]=car,dx=state.dragPt[0]-cx,dy=state.dragPt[1]-cy,len=Math.hypot(dx,dy);ui.indicator.style.left=state.dragPt[0]+'px';ui.indicator.style.top=state.dragPt[1]+'px';ui.indicator.classList.add('active');ui.line.style.left=cx+'px';ui.line.style.top=cy+'px';ui.line.style.width=len+'px';ui.line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;ui.line.classList.add('active');} else {ui.indicator.classList.remove('active');ui.line.classList.remove('active')}
}
