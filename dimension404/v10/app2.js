function drawPoster(z,idx){
 const [sx,sy]=worldToScreen(z.x,z.y);const d=Math.hypot(state.x-z.x,state.y-z.y);const near=d<155;
 drawZoneSet(z,idx);
 const depthScale=Math.max(.78,Math.min(1.12,1-((z.x+z.y)-(state.camX+state.camY))/2200));
 const scale=state.zoom*depthScale*(near?1.055:1); const w=205*scale,h=132*scale,depth=17*scale;
 const word={image:'IMAGE',video:'MOTION',brand:'BRAND',code:'BUILD',agent:'AGENTS'}[z.id];
 ctx.save();ctx.translate(sx,sy);
 ctx.globalAlpha=.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(10*scale,40*scale,140*scale,30*scale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle=z.c;ctx.lineWidth=2*scale;ctx.globalAlpha=.28+.12*Math.sin(state.time*2+idx);ctx.beginPath();ctx.ellipse(0,52*scale,112*scale,18*scale,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
 poly([[-w/2+depth,-h/2+depth],[w/2+depth,-h/2+depth],[w/2+depth,h/2+depth],[-w/2+depth,h/2+depth]],'#030206','#030206',1);
 rr(-w/2,-h/2,w,h,4*scale);ctx.fillStyle=z.c;ctx.fill();ctx.lineWidth=3*scale;ctx.strokeStyle='#08060d';ctx.stroke();
 poly([[-w/2,-h/2],[-w/2+w*.58,-h/2],[-w/2+w*.49,h/2],[-w/2,h/2]],'#0b0811');
 ctx.fillStyle=z.c2;ctx.font=`1000 ${7.5*scale}px Inter,system-ui`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('0'+(idx+1)+' // '+z.sub,-w/2+14*scale,-h/2+13*scale);
 ctx.fillStyle=palette.paper;ctx.font=`1000 ${26*scale}px Inter,system-ui`;ctx.fillText(word,-w/2+14*scale,-h/2+35*scale);
 ctx.fillStyle=z.c2;ctx.font=`1000 ${7.2*scale}px Inter,system-ui`;ctx.fillText(z.n,-w/2+15*scale,-h/2+69*scale);
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
 ctx.fillStyle='#08060d';ctx.font=`1000 ${7.5*scale}px Inter,system-ui`;ctx.fillText(near?'OPEN TRANSMISSION ↗':'DRIVE HERE',w*.06,h/2-17*scale);
 if(state.seen.has(z.id)){ctx.fillStyle=palette.paper;ctx.beginPath();ctx.arc(w/2-14*scale,-h/2+14*scale,5.5*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#08060d';ctx.font=`1000 ${6*scale}px Inter`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✓',w/2-14*scale,-h/2+14*scale)}
 ctx.restore();
 return {sx,sy,w,h,near,d};
}

function drawCar(){
 const [sx,baseSy]=worldToScreen(state.x,state.y);const sy=baseSy-state.jump*state.zoom;state.carScreen=[sx,sy];const sc=state.zoom*1.55;const vx=Math.cos(state.angle),vy=Math.sin(state.angle),sa=Math.atan2((vx+vy)*.30,(vx-vy)*.58);ctx.save();ctx.translate(sx,sy-5*state.zoom);ctx.rotate(sa);
 if(Math.abs(state.speed)>40){ctx.globalAlpha=Math.min(.28,Math.abs(state.speed)/360);for(let i=1;i<4;i++)line(-34*sc-i*11*sc,0, -12*sc-i*8*sc,0,4*sc,palette.acid,.4);ctx.globalAlpha=1}
 ctx.save();ctx.rotate(-state.angle);ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(7*sc,13*sc,34*sc,13*sc,0,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle='#050408';for(const yy of [-14,14]){rr(-25*sc,yy*sc-5*sc,16*sc,10*sc,3*sc);ctx.fill();rr(12*sc,yy*sc-5*sc,16*sc,10*sc,3*sc);ctx.fill()}
 poly([[-25*sc,-16*sc],[23*sc,-16*sc],[31*sc,-9*sc],[31*sc,15*sc],[-23*sc,15*sc],[-30*sc,9*sc]],'#050408');
 poly([[-28*sc,-19*sc],[20*sc,-19*sc],[28*sc,-12*sc],[28*sc,12*sc],[-25*sc,12*sc],[-33*sc,6*sc]],palette.acid,'#08060d',2.4*sc);
 poly([[-9*sc,-14*sc],[15*sc,-14*sc],[20*sc,-7*sc],[18*sc,6*sc],[-10*sc,6*sc]],'#2a1640','#08060d',2*sc);
 poly([[-4*sc,-11*sc],[12*sc,-11*sc],[15*sc,-7*sc],[14*sc,-1*sc],[-5*sc,-1*sc]],palette.cyan,'#08060d',1.6*sc);
 line(-24*sc,-5*sc,-2*sc,-5*sc,4*sc,palette.pink,.95);
 ctx.fillStyle=palette.paper;ctx.shadowColor=palette.paper;ctx.shadowBlur=10*sc;ctx.fillRect(-31*sc,-10*sc,4*sc,7*sc);ctx.fillRect(-31*sc,4*sc,4*sc,7*sc);ctx.shadowBlur=0;
 ctx.restore();
 return [sx,sy];
}

let posterRects=[];
function draw(){
 drawGround();drawDeco();posterRects=zones.map(drawPoster);const car=drawCar();
 state.camX+=(state.x-state.camX)*.105;state.camY+=(state.y-state.camY)*.105;
 let nearest=zones[0],nd=Infinity;zones.forEach(z=>{const d=Math.hypot(state.x-z.x,state.y-z.y);if(d<nd){nd=d;nearest=z}});
 if(nd<210){ui.zoneTag.classList.add('show');ui.zoneTag.querySelector('span').textContent=nearest.n;ui.zoneTag.querySelector('small').textContent=state.seen.has(nearest.id)?'TRANSMISSION LOGGED':'TAP THE POSTER OR KEEP DRIVING';}else ui.zoneTag.classList.remove('show');
 if(state.drag && state.dragPt){const [cx,cy]=car,dx=state.dragPt[0]-cx,dy=state.dragPt[1]-cy,len=Math.hypot(dx,dy);ui.indicator.style.left=state.dragPt[0]+'px';ui.indicator.style.top=state.dragPt[1]+'px';ui.indicator.classList.add('active');ui.line.style.left=cx+'px';ui.line.style.top=cy+'px';ui.line.style.width=len+'px';ui.line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;ui.line.classList.add('active');} else {ui.indicator.classList.remove('active');ui.line.classList.remove('active')}
}

function shortest(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function update(dt){
 state.time+=dt;if(state.jump>0||state.jumpV>0){state.jumpV-=620*dt;state.jump+=state.jumpV*dt;if(state.jump<0){state.jump=0;state.jumpV=0}}if(!state.started||ui.project.classList.contains('open')||ui.map.classList.contains('open')||ui.intro.classList.contains('open')){state.speed*=Math.pow(.02,dt);return}
 if(state.drag&&state.dragPt){const target=screenToWorld(state.dragPt[0],state.dragPt[1]);const dx=target[0]-state.x,dy=target[1]-state.y,dist=Math.hypot(dx,dy);const desired=Math.atan2(dy,dx);const turn=shortest(desired-state.angle);state.angle+=turn*Math.min(1,dt*5.8);const throttle=Math.min(1,dist/230);const desiredSpeed=throttle*300;state.speed+=(desiredSpeed-state.speed)*Math.min(1,dt*4.8);}else state.speed*=Math.pow(.11,dt);
 state.x+=Math.cos(state.angle)*state.speed*dt;state.y+=Math.sin(state.angle)*state.speed*dt;
 state.x=Math.max(-820,Math.min(820,state.x));state.y=Math.max(-760,Math.min(820,state.y));
 zones.forEach(z=>{const d=Math.hypot(state.x-z.x,state.y-z.y);if(d<145&&!state.seen.has(z.id)){state.seen.add(z.id);persist();updateProgress();toast(z.n+' DISCOVERED')}});
}
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

function hitPoster(x,y){let best=null,bd=Infinity;posterRects.forEach((r,i)=>{const d=Math.hypot(x-r.sx,y-r.sy);if(d<Math.max(85,r.w*.45)&&d<bd){best=i;bd=d}});return best}
function startDrive(x,y){state.drag=true;state.dragStart=[x,y];state.dragPt=[x,y];state.downAt=performance.now();state.downPos=[x,y];ui.hint.classList.add('used')}
function endDrive(x=null,y=null){const pos=(x===null||y===null)?state.dragPt:[x,y];if(state.downPos&&pos){const moved=Math.hypot(pos[0]-state.downPos[0],pos[1]-state.downPos[1]);const tapTime=performance.now()-state.downAt;const carDist=Math.hypot(pos[0]-state.carScreen[0],pos[1]-state.carScreen[1]);if(moved<14&&tapTime<380&&carDist<58&&state.jump<=1){state.jumpV=260;toast('BUGGY POP // WARRANTY STILL VOID')}}state.drag=false;state.dragPt=null;state.downPos=null}
C.addEventListener('pointerdown',e=>{if(e.button===2)return;try{C.setPointerCapture?.(e.pointerId)}catch(_){};const hit=hitPoster(e.clientX,e.clientY);if(hit!==null&&posterRects[hit].near){openProject(zones[hit]);return}startDrive(e.clientX,e.clientY)});
C.addEventListener('pointermove',e=>{if(state.drag)state.dragPt=[e.clientX,e.clientY]});
C.addEventListener('pointerup',e=>endDrive(e.clientX,e.clientY));C.addEventListener('pointercancel',()=>endDrive());C.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')endDrive()});
C.addEventListener('contextmenu',e=>e.preventDefault());
C.addEventListener('wheel',e=>{state.zoom=Math.max(.72,Math.min(1.6,state.zoom-Math.sign(e.deltaY)*.08));e.preventDefault()},{passive:false});
let pinch=null;C.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:state.zoom};endDrive()}},{passive:false});
C.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);state.zoom=Math.max(.72,Math.min(1.6,pinch.z*d/pinch.d));e.preventDefault()}},{passive:false});
C.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null},{passive:true});
