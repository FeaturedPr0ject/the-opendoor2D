const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const roomNumber=document.getElementById("roomNumber");
const coinCount=document.getElementById("coinCount");
const healthBar=document.getElementById("healthBar");

let width=innerWidth;
let height=innerHeight;
let dpr=Math.min(devicePixelRatio||1,2);

function resize(){
  width=innerWidth;
  height=innerHeight;
  canvas.width=Math.floor(width*dpr);
  canvas.height=Math.floor(height*dpr);
  canvas.style.width=width+"px";
  canvas.style.height=height+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize);
resize();

const keys=new Set();
addEventListener("keydown",e=>{
  keys.add(e.key.toLowerCase());
  if(["w","a","s","d","e","arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase())) e.preventDefault();
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

const pointer={x:width/2,y:height/2,down:false};
addEventListener("mousemove",e=>{
  pointer.x=e.clientX;
  pointer.y=e.clientY;
});
addEventListener("mousedown",()=>pointer.down=true);
addEventListener("mouseup",()=>pointer.down=false);

const world={
  width:2600,
  height:900,
  floorY:680
};

const player={
  x:340,
  y:585,
  w:38,
  h:72,
  speed:270,
  health:100,
  maxHealth:100,
  coins:0,
  facing:1
};

const camera={x:0,y:0};

let room=1;
let messageTimer=0;

function makeRoom(){
  const objects=[
    {type:"table",x:820,y:560,w:180,h:80},
    {type:"cabinet",x:1290,y:455,w:125,h:185},
    {type:"cabinet",x:1510,y:485,w:105,h:155},
    {type:"coins",x:865,y:505,w:28,h:28,collected:false},
    {type:"coins",x:1340,y:410,w:28,h:28,collected:false},
    {type:"coins",x:1740,y:590,w:28,h:28,collected:false},
    {type:"door",x:2220,y:390,w:120,h:290,open:false}
  ];
  return objects;
}
let objects=makeRoom();

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function rectsOverlap(a,b){
  return a.x<a.bx+b.w && a.x+a.w>b.x && a.y<a.by+b.h && a.y+a.h>b.y;
}

function nearestInteractable(){
  let best=null;
  let bestDist=110;
  for(const o of objects){
    if(o.type==="coins" && o.collected) continue;
    const ox=o.x+o.w/2;
    const oy=o.y+o.h/2;
    const d=Math.hypot(player.x+player.w/2-ox,player.y+player.h/2-oy);
    if(d<bestDist){
      best=o;
      bestDist=d;
    }
  }
  return best;
}

function interact(){
  const o=nearestInteractable();
  if(!o) return;
  if(o.type==="coins"){
    o.collected=true;
    player.coins++;
    coinCount.textContent=player.coins;
    messageTimer=1.2;
  }else if(o.type==="cabinet"){
    messageTimer=1.2;
  }else if(o.type==="table"){
    messageTimer=1.2;
  }else if(o.type==="door" && Math.abs((player.x+player.w/2)-(o.x+o.w/2))<150){
    o.open=true;
    room++;
    roomNumber.textContent=room;
    player.x=180;
    objects=makeRoom();
    for(const o2 of objects){
      o2.x+=Math.min(room*80,700);
      if(o2.type==="door") o2.x=2220+Math.min(room*80,700);
    }
  }
}

addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="e") interact();
});

function update(dt){
  let dx=0,dy=0;
  if(keys.has("a")||keys.has("arrowleft")) dx-=1;
  if(keys.has("d")||keys.has("arrowright")) dx+=1;
  if(keys.has("w")||keys.has("arrowup")) dy-=1;
  if(keys.has("s")||keys.has("arrowdown")) dy+=1;
  const len=Math.hypot(dx,dy)||1;
  if(dx||dy){
    player.x+=dx/len*player.speed*dt;
    player.y+=dy/len*player.speed*dt;
    player.facing=dx<0?-1:dx>0?1:player.facing;
  }
  player.x=clamp(player.x,60,world.width-player.w-80);
  player.y=clamp(player.y,world.floorY-player.h,world.floorY-player.h);

  const targetCamera=player.x-width*0.38;
  camera.x+=(clamp(targetCamera,0,world.width-width)-camera.x)*Math.min(1,dt*7);

  const target=nearestInteractable();
  canvas.style.cursor=target?"pointer":"none";

  messageTimer=Math.max(0,messageTimer-dt);
}

function drawRoom(){
  ctx.fillStyle="#131313";
  ctx.fillRect(0,0,width,height);

  ctx.save();
  ctx.translate(-camera.x,-camera.y);

  ctx.fillStyle="#1c1b1b";
  ctx.fillRect(0,0,world.width,world.floorY);

  for(let x=0;x<world.width;x+=160){
    ctx.fillStyle=x%320===0?"#2a2827":"#262423";
    ctx.fillRect(x,0,2,world.floorY);
  }

  ctx.fillStyle="#0d0c0c";
  ctx.fillRect(0,world.floorY,world.width,world.height-world.floorY);

  ctx.fillStyle="#3a3531";
  ctx.fillRect(0,world.floorY-10,world.width,10);

  for(const o of objects){
    if(o.type==="table"){
      ctx.fillStyle="#4a3022";
      ctx.fillRect(o.x,o.y,o.w,16);
      ctx.fillRect(o.x+18,o.y+16,14,o.h-16);
      ctx.fillRect(o.x+o.w-32,o.y+16,14,o.h-16);
      ctx.fillStyle="#694331";
      ctx.fillRect(o.x+20,o.y-8,o.w-40,8);
    }else if(o.type==="cabinet"){
      ctx.fillStyle="#3a2920";
      ctx.fillRect(o.x,o.y,o.w,o.h);
      ctx.strokeStyle="#80543b";
      ctx.lineWidth=4;
      ctx.strokeRect(o.x+2,o.y+2,o.w-4,o.h-4);
      ctx.fillStyle="#4c3428";
      for(let i=1;i<3;i++) ctx.fillRect(o.x+12,o.y+i*(o.h/3),o.w-24,6);
      ctx.fillStyle="#c6a36a";
      for(let i=1;i<3;i++) ctx.fillRect(o.x+o.w/2-4,o.y+i*(o.h/3)-10,8,8);
    }else if(o.type==="coins"&&!o.collected){
      ctx.fillStyle="#e5bf4a";
      ctx.beginPath();
      ctx.arc(o.x+14,o.y+14,12,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#8f6b16";
      ctx.font="bold 13px Arial";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText("$",o.x+14,o.y+14);
    }else if(o.type==="door"){
      ctx.fillStyle=o.open?"#24170f":"#2d1a10";
      ctx.fillRect(o.x,o.y,o.w,o.h);
      ctx.strokeStyle="#684329";
      ctx.lineWidth=6;
      ctx.strokeRect(o.x,o.y,o.w,o.h);
      ctx.fillStyle="#d0a25a";
      ctx.fillRect(o.x+o.w-24,o.y+o.h/2,10,10);
    }
  }

  drawPlayer();
  drawLight();

  ctx.restore();
}

function drawPlayer(){
  const px=player.x+player.w/2;
  const py=player.y+player.h/2;
  ctx.save();
  ctx.translate(px,py);
  ctx.scale(player.facing,1);

  ctx.fillStyle="#e7c7a3";
  ctx.beginPath();
  ctx.arc(0,-22,15,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#222";
  ctx.fillRect(-18,-6,36,43);
  ctx.fillStyle="#555";
  ctx.fillRect(-16,0,10,38);
  ctx.fillRect(6,0,10,38);

  ctx.fillStyle="#d7d7d7";
  ctx.fillRect(-14,-2,28,6);

  const angle=Math.atan2(pointer.y-height/2,pointer.x-width/2);
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle="#bda36d";
  ctx.fillRect(10,-4,34,8);
  ctx.restore();

  ctx.restore();
}

function drawLight(){
  const sx=player.x-camera.x+player.w/2;
  const sy=player.y+player.h/2;
  const mx=pointer.x;
  const my=pointer.y;

  const g=ctx.createRadialGradient(sx,sy,30,sx,sy,260);
  g.addColorStop(0,"rgba(255,245,210,.18)");
  g.addColorStop(.45,"rgba(255,230,180,.08)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(sx,sy,260,0,Math.PI*2);
  ctx.fill();

  const angle=Math.atan2(my-height/2,mx-width/2);
  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(angle);
  const cone=ctx.createRadialGradient(80,0,10,80,0,300);
  cone.addColorStop(0,"rgba(255,250,220,.14)");
  cone.addColorStop(1,"rgba(255,250,220,0)");
  ctx.fillStyle=cone;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0,0,320,-0.55,0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

let last=performance.now();
function loop(now){
  const dt=Math.min((now-last)/1000,.05);
  last=now;
  update(dt);
  drawRoom();
  healthBar.style.width=Math.max(0,player.health)/player.maxHealth*100+"%";
  if(messageTimer>0){
    ctx.fillStyle="rgba(255,255,255,.95)";
    ctx.font="bold 16px Arial";
    ctx.textAlign="center";
    ctx.fillText("Press E to interact",width/2,80);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
