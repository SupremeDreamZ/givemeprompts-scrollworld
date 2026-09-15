'use strict';
const C=document.getElementById('world'), ctx=C.getContext('2d',{alpha:false});
const DPR=()=>Math.min(devicePixelRatio||1,2);
let W=0,H=0,dpr=1;
function resize(){dpr=DPR();W=innerWidth;H=innerHeight;C.width=Math.round(W*dpr);C.height=Math.round(H*dpr);C.style.width=W+'px';C.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize,{passive:true}); resize();

const palette={ink:'#08060d',paper:'#f4f0e7',acid:'#b5ff48',cyan:'#36e7ff',pink:'#ff4ec7',violet:'#6b3cff',red:'#ff5a61',gold:'#ffd454'};
const zones=[
 {id:'image',n:'IMAGE SYSTEMS',sub:'AURELIA / KNOT',x:-460,y:-300,c:palette.pink,c2:palette.cyan,title:'MAKE THE IMAGE FEEL LIKE A WORLD.',body:'AURELIA and KNOT are visual-system studies built around continuity, material language and repeatable art direction. The point is not one good render. The point is a visual language that survives the next twenty.',tags:['VISUAL SYSTEMS','CHARACTERS','PRODUCT WORLDS','ART DIRECTION']},
 {id:'video',n:'MOTION LAB',sub:'THE ALGORITHM / SPEC ADS',x:450,y:-320,c:palette.red,c2:palette.pink,title:'MOTION WITH A MEMORY.',body:'Short-form ads and cinematic sequences designed around repeatable shot logic, continuity rules and deliberate camera language instead of hoping every generation remembers what the last one looked like.',tags:['VIDEO','SCENE BOARDS','CONTINUITY','CAMPAIGNS']},
 {id:'brand',n:'BRAND MUTATION',sub:'FORM/01 / GRIDLINE',x:-450,y:340,c:palette.acid,c2:palette.gold,title:'A BRAND SHOULD HAVE A PHYSICS ENGINE.',body:'Identity, packaging, mascot logic, product language and web art direction designed to feel like the same universe. Fewer disconnected assets. More recognizable behavior.',tags:['BRAND SYSTEMS','PACKAGING','IDENTITY','ART DIRECTION']},
 {id:'code',n:'INTERACTIVE BUILDS',sub:'GIVEMEPROMPTS / DIMENSION 404',x:470,y:330,c:palette.cyan,c2:palette.violet,title:'THE PITCH SHOULD BE SOMETHING YOU CAN TOUCH.',body:'Interactive prototypes and sites that prove the idea by existing. Motion, tools and playable systems are part of the communication, not decorative garnish around a sales paragraph.',tags:['WEB','INTERACTION','PROTOTYPES','PRODUCT']},
 {id:'agent',n:'AGENT FACTORY',sub:'FRONT OFFICE / GAUNTLET',x:0,y:600,c:palette.gold,c2:palette.acid,title:'TURN THE GOOD IDEA INTO A REPEATABLE WORKER.',body:'Research, follow-up, production and QA workflows that move repetitive work out of people’s heads and into systems that can be tested, improved and reused.',tags:['AGENTS','AUTOMATION','WORKFLOWS','QA']}
];
