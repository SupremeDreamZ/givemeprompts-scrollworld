C.addEventListener('pointerdown',e=>{if(e.button===2)return;try{C.setPointerCapture?.(e.pointerId)}catch(_){};const hit=hitPoster(e.clientX,e.clientY);if(hit!==null&&posterRects[hit].near){openProject(zones[hit]);return}startDrive(e.clientX,e.clientY)});
C.addEventListener('pointermove',e=>{if(state.drag)state.dragPt=[e.clientX,e.clientY]});
C.addEventListener('pointerup',e=>endDrive(e.clientX,e.clientY));C.addEventListener('pointercancel',()=>endDrive());C.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')endDrive()});
C.addEventListener('contextmenu',e=>e.preventDefault());
C.addEventListener('wheel',e=>{state.zoom=Math.max(.72,Math.min(1.6,state.zoom-Math.sign(e.deltaY)*.08));e.preventDefault()},{passive:false});
let pinch=null;C.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:state.zoom};endDrive()}},{passive:false});
C.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);state.zoom=Math.max(.72,Math.min(1.6,pinch.z*d/pinch.d));e.preventDefault()}},{passive:false});
C.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null},{passive:true});
