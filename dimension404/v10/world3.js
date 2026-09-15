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
