function loadSeen(){try{return JSON.parse(localStorage.getItem('d404-v10-seen')||'[]')}catch(e){return []}}
const state={started:false,seen:new Set(loadSeen()),x:0,y:40,angle:-Math.PI/2,speed:0,target:null,drag:false,dragStart:null,dragPt:null,zoom:(innerWidth<700?1.02:1.28),camX:0,camY:40,time:0,selected:null,jump:0,jumpV:0,downAt:0,downPos:null,carScreen:[0,0]};
const ui={intro:document.getElementById('intro'),project:document.getElementById('project'),map:document.getElementById('map'),progress:document.querySelector('#progress strong'),zoneTag:document.getElementById('zoneTag'),hint:document.getElementById('hint'),indicator:document.getElementById('driveIndicator'),line:document.getElementById('driveLine'),toast:document.getElementById('toast')};
function persist(){try{localStorage.setItem('d404-v10-seen',JSON.stringify([...state.seen]))}catch(e){}}
function toast(msg){ui.toast.querySelector('div').textContent=msg;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),2600)}
function updateProgress(){ui.progress.textContent=state.seen.size+'/5';renderMap()}

// Isometric 2.5D camera. The floor lives in world X/Y; everything projects into a diamond stage.
function worldToScreen(x,y){const rx=x-state.camX, ry=y-state.camY;return [W/2+(rx-ry)*.58*state.zoom,H*.60+(rx+ry)*.30*state.zoom]}
function screenToWorld(sx,sy){const a=(sx-W/2)/(.58*state.zoom)+(state.camX-state.camY);const b=(sy-H*.60)/(.30*state.zoom)+(state.camX+state.camY);return [(a+b)/2,(b-a)/2]}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function line(x1,y1,x2,y2,w,c,a=1){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1}
function poly(points,fill,stroke=null,lw=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function text(t,x,y,size,c=palette.paper,align='left',weight=900){ctx.fillStyle=c;ctx.font=`${weight} ${size}px Inter, system-ui, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(t,x,y)}
function shadowText(t,x,y,size,c,align='left'){text(t,x+4,y+5,size,'rgba(0,0,0,.52)',align,1000);text(t,x,y,size,c,align,1000)}

function worldPoly(points,fill,stroke=null,lw=1){poly(points.map(p=>worldToScreen(p[0],p[1])),fill,stroke,lw)}
