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

const pointer={x:width/2,y:height/2};
addEventListener("mousemove",e=>{
  pointer.x=e.clientX;
  pointer.y=e.clientY;
});

const world={
  width:2600,
  height:900,
  floorY:680
};

const player={
  x:340,
  y:world.floorY-72,
  w:38,
  h:72,
  speed:270,
  health:100,
  maxHealth:100,
  coins:0,
  facing:1
};

const camera={x:0};
let room=1;
let messageTimer=0;
let messageText="";

function makeTable(x,y){
  return {
    type:"table",
    x,
    y,
    w:210,
    h:80,
    drawers:[
      {open:false,loot:"coins"},
      {open:false,loot:null},
      {open:false,loot:"coins"}
    ]
  };
}

function makeCabinet(x,y,w=125,h=185){
  return {
    type:"cabinet",
    x,
    y,
    w,
    h,
    opened:false
  };
}

function makeRoom(){
  return [
    makeTable(820,world.floorY-80),
    makeCabinet(1290,world.floorY-185),
    makeCabinet(1510,world.floorY-155,105,155),
    {type:"coins",x:1740,y:world.floorY-28,w:28,h:28,collected:false},
    {type:"door",x:2220,y:world.floorY-290,w:120,h:290,open:false}
  ];
}

let objects=makeRoom();

function clamp(v,a,b){
  return Math.max(a,Math.min(b,v));
}

function distanceToObject(o){
  const ox=o.x+o.w/2;
  const oy=o.y+o.h/2;
  return Math.hypot(player.x+player.w/2-ox,player.y+player.h/2-oy);
}

function getInteractable(){
  let best=null;
  let bestDist=125;

  for(const o of objects){
    if(o.type==="coins" && o.collected) continue;

    if(o.type==="table"){
      const drawerIndex=getNearestDrawer(o);
      if(drawerIndex<0) continue;
    }

    if(o.type==="door"){
      if(o.open) continue;
      if(Math.abs((player.x+player.w/2)-(o.x+o.w/2))>170) continue;
    }

    const d=distanceToObject(o);
    if(d<bestDist){
      best=o;
      bestDist=d;
    }
  }

  return best;
}

function getNearestDrawer(table){
  let best=-1;
  let bestDistance=Infinity;

  for(let i=0;i<table.drawers.length;i++){
    if(table.drawers[i].open) continue;

    const drawerY=table.y+18+i*20;
    const d=Math.hypot(
      player.x+player.w/2-(table.x+table.w/2),
      player.y+player.h/2-(drawerY+10)
    );

    if(d<bestDistance){
      bestDistance=d;
      best=i;
    }
  }

  return best;
}

function showMessage(text,time=1.2){
  messageText=text;
  messageTimer=time;
}

function collectCoin(){
  player.coins++;
  coinCount.textContent=player.coins;
}

function interact(){
  const o=getInteractable();
  if(!o) return;

  if(o.type==="table"){
    const drawerIndex=getNearestDrawer(o);
    if(drawerIndex<0) return;

    const drawer=o.drawers[drawerIndex];
    drawer.open=true;

    if(drawer.loot==="coins"){
      drawer.loot=null;
      collectCoin();
      showMessage("Coin collected");
    }else{
      showMessage("Empty drawer");
    }
    return;
  }

  if(o.type==="cabinet"){
    if(!o.opened){
      o.opened=true;
      showMessage("Cabinet opened");
    }
    return;
  }

  if(o.type==="coins"){
    o.collected=true;
    collectCoin();
    showMessage("Coin collected");
    return;
  }

  if(o.type==="door"){
    o.open=true;
    room++;
    roomNumber.textContent=room;
    player.x=180;
    player.y=world.floorY-player.h;
    objects=makeRoom();

    for(const o2 of objects){
      if(o2.type==="table") o2.x+=Math.min(room*80,700);
      if(o2.type==="cabinet") o2.x+=Math.min(room*80,700);
      if(o2.type==="coins") o2.x+=Math.min(room*80,700);
      if(o2.type==="door") o2.x=2220+Math.min(room*80,700);
    }

    showMessage("Room "+room);
  }
}

addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="e") interact();
});

function update(dt){
  let dx=0;
  let dy=0;

  if(keys.has("a")||keys.has("arrowleft")) dx-=1;
  if(keys.has("d")||keys.has("arrowright")) dx+=1;
  if(keys.has("w")||keys.has("arrowup")) dy-=1;
  if(keys.has("s")||keys.has("arrowdown")) dy+=1;

  const len=Math.hypot(dx,dy)||1;

  if(dx||dy){
    player.x+=dx/len*player.speed*dt;
    player.y+=dy/len*player.speed*dt;
    if(dx<0) player.facing=-1;
    if(dx>0) player.facing=1;
  }

  player.x=clamp(player.x,60,world.width-player.w-80);
  player.y=world.floorY-player.h;

  const targetCamera=player.x-width*0.42;
  camera.x+=(clamp(targetCamera,0,Math.max(0,world.width-width))-camera.x)*Math.min(1,dt*7);

  canvas.style.cursor=getInteractable()?"pointer":"none";
  messageTimer=Math.max(0,messageTimer-dt);
}

function drawRoom(){
  ctx.fillStyle="#131313";
  ctx.fillRect(0,0,width,height);

  ctx.save();
  ctx.translate(-camera.x,0);

  ctx.fillStyle="#1c1b1b";
  ctx.fillRect(0,0,world.width,world.floorY);

  for(let x=0;x<world.width;x+=160){
    ctx.fillStyle=x%320===0?"#2a2827":"#262423";
    ctx.fillRect(x,0,2,world.floorY);
  }

  ctx.fillStyle="#0d0c0c";
  ctx.fillRect(0,world.floorY,world.width,height-world.floorY);

  ctx.fillStyle="#3a3531";
  ctx.fillRect(0,world.floorY-10,world.width,10);

  for(const o of objects){
    if(o.type==="table") drawTable(o);
    if(o.type==="cabinet") drawCabinet(o);
    if(o.type==="coins"&&!o.collected) drawCoin(o.x+14,o.y+14);
    if(o.type==="door") drawDoor(o);
  }

  drawPlayer();
  drawLight();

  ctx.restore();
}

function drawTable(o){
  ctx.fillStyle="#4a3022";
  ctx.fillRect(o.x,o.y,o.w,14);

  ctx.fillStyle="#563727";
  ctx.fillRect(o.x+16,o.y+14,14,o.h-14);
  ctx.fillRect(o.x+o.w-30,o.y+14,14,o.h-14);

  ctx.fillStyle="#633e2c";
  ctx.fillRect(o.x+20,o.y-7,o.w-40,7);

  for(let i=0;i<3;i++){
    const drawerY=o.y+18+i*20;

    ctx.fillStyle="#38251d";
    ctx.fillRect(o.x+42,drawerY,o.w-84,17);

    ctx.strokeStyle="#80513a";
    ctx.lineWidth=2;
    ctx.strokeRect(o.x+42,drawerY,o.w-84,17);

    ctx.fillStyle=o.drawers[i].open?"#d3ad73":"#b98c55";
    ctx.fillRect(o.x+o.w/2-5,drawerY+6,10,5);

    if(o.drawers[i].open){
      ctx.fillStyle="#1a1411";
      ctx.fillRect(o.x+38,drawerY-3,o.w-76,6);
    }
  }
}

function drawCabinet(o){
  ctx.fillStyle=o.opened?"#261b17":"#3a2920";
  ctx.fillRect(o.x,o.y,o.w,o.h);

  ctx.strokeStyle="#80543b";
  ctx.lineWidth=4;
  ctx.strokeRect(o.x+2,o.y+2,o.w-4,o.h-4);

  ctx.fillStyle="#4c3428";
  for(let i=1;i<3;i++){
    ctx.fillRect(o.x+12,o.y+i*(o.h/3),o.w-24,6);
  }

  ctx.fillStyle="#c6a36a";
  for(let i=1;i<3;i++){
    ctx.fillRect(o.x+o.w/2-4,o.y+i*(o.h/3)-10,8,8);
  }
}

function drawCoin(x,y){
  ctx.fillStyle="#e5bf4a";
  ctx.beginPath();
  ctx.arc(x,y,12,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#8f6b16";
  ctx.font="bold 13px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("$",x,y);
}

function drawDoor(o){
  ctx.fillStyle=o.open?"#24170f":"#2d1a10";
  ctx.fillRect(o.x,o.y,o.w,o.h);

  ctx.strokeStyle="#684329";
  ctx.lineWidth=6;
  ctx.strokeRect(o.x,o.y,o.w,o.h);

  ctx.fillStyle="#d0a25a";
  ctx.fillRect(o.x+o.w-24,o.y+o.h/2,10,10);

  const labelW=72;
  const labelH=42;
  const labelX=o.x+o.w/2-labelW/2;
  const labelY=o.y-62;

  ctx.fillStyle="#d8d2c7";
  ctx.fillRect(labelX,labelY,labelW,labelH);
  ctx.strokeStyle="#4a4640";
  ctx.lineWidth=3;
  ctx.strokeRect(labelX,labelY,labelW,labelH);

  ctx.fillStyle="#171615";
  ctx.font="bold 24px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(String(room),o.x+o.w/2,labelY+labelH/2);
}

function drawPlayer(){
  const px=player.x+player.w/2;
  const py=player.y+player.h/2;

  ctx.save();
  ctx.translate(px,py);
  ctx.scale(player.facing,1);

  ctx.fillStyle="#e6b98c";
  ctx.fillRect(-15,-52,30,30);

  ctx.fillStyle="#3b241b";
  ctx.fillRect(-16,-56,32,9);
  ctx.fillRect(-16,-50,7,10);
  ctx.fillRect(9,-50,7,10);

  ctx.fillStyle="#f0c9a0";
  ctx.fillRect(-5,-40,5,4);
  ctx.fillRect(6,-40,5,4);

  ctx.fillStyle="#2b6f9e";
  ctx.fillRect(-18,-22,36,31);

  ctx.fillStyle="#1f4f72";
  ctx.fillRect(-18,4,36,8);

  ctx.fillStyle="#e6b98c";
  ctx.fillRect(-29,-20,11,30);
  ctx.fillRect(18,-20,11,30);

  ctx.fillStyle="#d7d7d7";
  ctx.fillRect(-12,12,10,36);
  ctx.fillRect(2,12,10,36);

  ctx.fillStyle="#252525";
  ctx.fillRect(-14,46,13,8);
  ctx.fillRect(1,46,13,8);

  const playerScreenX=player.x-camera.x+player.w/2;
  const playerScreenY=player.y+player.h/2;
  const angle=Math.atan2(pointer.y-playerScreenY,pointer.x-playerScreenX);

  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle="#bda36d";
  ctx.fillRect(20,-4,34,8);
  ctx.restore();

  ctx.restore();
}

function drawLight(){
  const sx=player.x+player.w/2;
  const sy=player.y+player.h/2;
  const playerScreenX=player.x-camera.x+player.w/2;
  const playerScreenY=player.y+player.h/2;
  const angle=Math.atan2(pointer.y-playerScreenY,pointer.x-playerScreenX);

  const g=ctx.createRadialGradient(sx,sy,30,sx,sy,260);
  g.addColorStop(0,"rgba(255,245,210,.18)");
  g.addColorStop(.45,"rgba(255,230,180,.08)");
  g.addColorStop(1,"rgba(0,0,0,0)");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(sx,sy,260,0,Math.PI*2);
  ctx.fill();

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
    ctx.fillText(messageText,width/2,80);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
