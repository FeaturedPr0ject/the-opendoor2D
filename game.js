const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const coinCount=document.getElementById("coinCount");
const healthBar=document.getElementById("healthBar");
const flashlightSlot=document.querySelector(".itemSlot");
const flashlightState=document.getElementById("flashlightState");
const batteryBar=document.getElementById("batteryBar");

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
  const key=e.key.toLowerCase();
  keys.add(key);
  if(["w","a","s","d","e","f","arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();
  if(key==="e")interact();
  if(key==="f")toggleFlashlight();
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

const pointer={x:width/2,y:height/2};
addEventListener("mousemove",e=>{
  pointer.x=e.clientX;
  pointer.y=e.clientY;
});
flashlightSlot.addEventListener("click",toggleFlashlight);

const world={width:2800,height:900,floorY:690};
const player={
  x:340,y:world.floorY-116,w:82,h:116,speed:270,
  health:100,maxHealth:100,coins:0,facing:1,walkTime:0
};
const camera={x:0};
const flashlight={on:true,battery:100,maxBattery:100,drainRate:7.5};
let room=1;
let messageTimer=0;
let messageText="";

function makeTable(x,y){
  return{type:"table",x,y,w:230,h:90,drawers:[
    {open:false,loot:"coins"},{open:false,loot:null},{open:false,loot:"coins"}
  ]};
}

function makeWardrobe(x,y){
  return{type:"wardrobe",x,y,w:145,h:216,open:false};
}

function makeRoom(){
  return[
    makeTable(760,world.floorY-90),
    makeWardrobe(1230,world.floorY-216),
    makeWardrobe(1510,world.floorY-216),
    {type:"coins",x:1810,y:world.floorY-24,w:28,h:28,collected:false},
    {type:"door",x:2310,y:world.floorY-310,w:145,h:310,open:false}
  ];
}

let objects=makeRoom();

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function distanceToObject(o){
  return Math.hypot(
    player.x+player.w/2-(o.x+o.w/2),
    player.y+player.h/2-(o.y+o.h/2)
  );
}

function getNearestDrawer(table){
  let best=-1;
  let bestDistance=Infinity;
  for(let i=0;i<table.drawers.length;i++){
    if(table.drawers[i].open)continue;
    const drawerY=table.y+18+i*22;
    const d=Math.hypot(
      player.x+player.w/2-(table.x+table.w/2),
      player.y+player.h/2-(drawerY+10)
    );
    if(d<bestDistance){bestDistance=d;best=i;}
  }
  return best;
}

function getInteractable(){
  let best=null;
  let bestDist=125;
  for(const o of objects){
    if(o.type==="coins"&&o.collected)continue;
    if(o.type==="table"&&getNearestDrawer(o)<0)continue;
    if(o.type==="door"){
      if(o.open)continue;
      if(Math.abs(player.x+player.w/2-(o.x+o.w/2))>180)continue;
    }
    const d=distanceToObject(o);
    if(d<bestDist){best=o;bestDist=d;}
  }
  return best;
}

function showMessage(text,time=1){
  messageText=text;
  messageTimer=time;
}

function collectCoin(){
  player.coins++;
  coinCount.textContent=player.coins;
}

function interact(){
  const o=getInteractable();
  if(!o)return;

  if(o.type==="table"){
    const index=getNearestDrawer(o);
    if(index<0)return;
    const drawer=o.drawers[index];
    drawer.open=true;
    if(drawer.loot==="coins"){
      drawer.loot=null;
      collectCoin();
      showMessage("Coin collected");
    }else showMessage("Empty drawer");
    return;
  }

  if(o.type==="wardrobe"){
    o.open=!o.open;
    showMessage(o.open?"Wardrobe opened":"Wardrobe closed");
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
    player.x=180;
    player.y=world.floorY-player.h;
    objects=makeRoom();
    const shift=Math.min(room*90,800);
    for(const item of objects){
      if(item.type==="table"||item.type==="wardrobe"||item.type==="coins")item.x+=shift;
      if(item.type==="door")item.x=2310+shift;
    }
    showMessage("Room "+room);
  }
}

function toggleFlashlight(){
  if(flashlight.on){
    flashlight.on=false;
    showMessage("Flashlight off");
    return;
  }
  if(flashlight.battery<=0){
    showMessage("Battery empty");
    return;
  }
  flashlight.on=true;
  showMessage("Flashlight on");
}

function updateFlashlightHud(){
  const pct=Math.max(0,flashlight.battery/flashlight.maxBattery*100);
  batteryBar.style.width=pct+"%";
  flashlightState.textContent=flashlight.on?"USED":"NOT USED";
  flashlightSlot.classList.toggle("active",flashlight.on);
  flashlightSlot.classList.toggle("empty",flashlight.battery<=0);
}

function update(dt){
  let dx=0;
  if(keys.has("a")||keys.has("arrowleft"))dx-=1;
  if(keys.has("d")||keys.has("arrowright"))dx+=1;

  if(dx){
    player.x+=dx*player.speed*dt;
    player.facing=dx<0?-1:1;
    player.walkTime+=dt*10;
  }else{
    player.walkTime+=dt*2;
  }

  player.x=clamp(player.x,60,world.width-player.w-70);
  player.y=world.floorY-player.h;

  if(flashlight.on){
    flashlight.battery=Math.max(0,flashlight.battery-flashlight.drainRate*dt);
    if(flashlight.battery<=0){
      flashlight.on=false;
      showMessage("Flashlight battery empty");
    }
  }

  const targetCamera=player.x-width*.42;
  camera.x+=(clamp(targetCamera,0,Math.max(0,world.width-width))-camera.x)*Math.min(1,dt*7);
  canvas.style.cursor="default";
  messageTimer=Math.max(0,messageTimer-dt);
  updateFlashlightHud();
}

function drawRoom(){
  ctx.fillStyle="#121212";
  ctx.fillRect(0,0,width,height);

  ctx.save();
  ctx.translate(-camera.x,0);

  ctx.fillStyle="#1d1c1c";
  ctx.fillRect(0,0,world.width,world.floorY);

  for(let x=0;x<world.width;x+=160){
    ctx.fillStyle=x%320===0?"#292727":"#242222";
    ctx.fillRect(x,0,2,world.floorY);
  }

  drawCeilingLights();

  ctx.fillStyle="#0a0a0a";
  ctx.fillRect(0,world.floorY,world.width,height-world.floorY);
  ctx.fillStyle="#3a3531";
  ctx.fillRect(0,world.floorY-10,world.width,10);

  for(const o of objects){
    if(o.type==="table")drawTable(o);
    if(o.type==="wardrobe")drawWardrobe(o);
    if(o.type==="coins"&&!o.collected)drawCoin(o.x+14,o.y+14);
    if(o.type==="door")drawDoor(o);
  }

  drawPlayer();
  ctx.restore();
  drawLighting();
}

function drawCeilingLights(){
  for(let x=260;x<world.width;x+=520){
    const glow=ctx.createRadialGradient(x,70,10,x,70,270);
    glow.addColorStop(0,"rgba(255,226,155,.16)");
    glow.addColorStop(.45,"rgba(255,210,125,.07)");
    glow.addColorStop(1,"rgba(255,200,100,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(x-280,0,560,430);

    ctx.strokeStyle="#8f6d3d";
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,35);
    ctx.stroke();

    ctx.fillStyle="#8c7044";
    ctx.beginPath();
    ctx.arc(x,48,12,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#f8e3a4";
    ctx.beginPath();
    ctx.arc(x,48,7,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="#9b7b45";
    ctx.lineWidth=3;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();
      ctx.moveTo(x,50);
      ctx.lineTo(x+i*25,78);
      ctx.stroke();
      ctx.fillStyle="#f5dda0";
      ctx.beginPath();
      ctx.arc(x+i*25,84,7,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle="#c29a54";
    ctx.beginPath();
    ctx.arc(x,58,8,0,Math.PI*2);
    ctx.fill();
  }
}

function drawTable(o){
  ctx.fillStyle="#4a3022";
  ctx.fillRect(o.x,o.y,o.w,14);
  ctx.fillStyle="#563727";
  ctx.fillRect(o.x+16,o.y+14,14,o.h-14);
  ctx.fillRect(o.x+o.w-30,o.y+14,14,o.h-14);

  for(let i=0;i<3;i++){
    const drawerY=o.y+18+i*22;
    ctx.fillStyle="#38251d";
    ctx.fillRect(o.x+42,drawerY,o.w-84,18);
    ctx.strokeStyle="#80513a";
    ctx.lineWidth=2;
    ctx.strokeRect(o.x+42,drawerY,o.w-84,18);
    ctx.fillStyle="#c69d62";
    ctx.fillRect(o.x+o.w/2-5,drawerY+6,10,5);
    if(o.drawers[i].open){
      ctx.fillStyle="#16100d";
      ctx.fillRect(o.x+37,drawerY-3,o.w-74,6);
    }
  }
}

function drawWardrobe(o){
  ctx.fillStyle="#5a3525";
  ctx.fillRect(o.x,o.y,o.w,o.h);
  ctx.fillStyle="#6c402c";
  ctx.fillRect(o.x+5,o.y+5,o.w/2-8,o.h-10);
  ctx.fillRect(o.x+o.w/2+3,o.y+5,o.w/2-8,o.h-10);
  ctx.strokeStyle="#3b241b";
  ctx.lineWidth=4;
  ctx.strokeRect(o.x+5,o.y+5,o.w/2-8,o.h-10);
  ctx.strokeRect(o.x+o.w/2+3,o.y+5,o.w/2-8,o.h-10);
  ctx.strokeStyle="#85523a";
  ctx.lineWidth=2;
  ctx.strokeRect(o.x+14,o.y+18,o.w/2-26,o.h-36);
  ctx.strokeRect(o.x+o.w/2+14,o.y+18,o.w/2-26,o.h-36);
  ctx.fillStyle="#c49b5d";
  ctx.beginPath();
  ctx.arc(o.x+o.w/2-16,o.y+o.h/2,5,0,Math.PI*2);
  ctx.arc(o.x+o.w/2+16,o.y+o.h/2,5,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle="#70432e";
  ctx.fillRect(o.x-5,o.y,o.w+10,10);
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
  ctx.fillRect(o.x+o.w-25,o.y+o.h/2,10,10);

  ctx.fillStyle="#d8d2c7";
  ctx.fillRect(o.x+18,o.y+70,o.w-36,70);
  ctx.strokeStyle="#4a4640";
  ctx.lineWidth=3;
  ctx.strokeRect(o.x+18,o.y+70,o.w-36,70);

  ctx.fillStyle="#171615";
  ctx.font="bold 42px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(String(room),o.x+o.w/2,o.y+105);
}

function drawPlayer(){
  const x=player.x+player.w/2;
  const baseY=player.y+player.h;
  const moving=keys.has("a")||keys.has("d")||keys.has("arrowleft")||keys.has("arrowright");
  const swing=moving?Math.sin(player.walkTime)*0.5:0;

  ctx.save();
  ctx.translate(x,baseY);
  if(player.facing<0)ctx.scale(-1,1);

  const legSwing=swing*20;
  const armSwing=-swing*16;

  ctx.fillStyle="#176c38";
  ctx.save();
  ctx.translate(-14,-36);
  ctx.rotate(legSwing*Math.PI/180);
  ctx.fillRect(-9,0,18,34);
  ctx.restore();

  ctx.save();
  ctx.translate(14,-36);
  ctx.rotate(-legSwing*Math.PI/180);
  ctx.fillRect(-9,0,18,34);
  ctx.restore();

  ctx.fillStyle="#1687d2";
  ctx.fillRect(-25,-76,50,42);

  ctx.fillStyle="#ffd23f";
  ctx.save();
  ctx.translate(-32,-69);
  ctx.rotate(armSwing*Math.PI/180);
  ctx.fillRect(-7,0,14,39);
  ctx.restore();

  ctx.save();
  ctx.translate(32,-69);
  ctx.rotate(-armSwing*Math.PI/180);
  ctx.fillRect(-7,0,14,39);
  ctx.restore();

  ctx.fillStyle="#f4c32e";
  ctx.fillRect(-18,-102,36,26);

  ctx.fillStyle="#1c1c1c";
  ctx.fillRect(-9,-94,4,4);
  ctx.fillRect(5,-94,4,4);
  ctx.fillRect(-7,-84,14,3);

  if(flashlight.on){
    ctx.save();
    ctx.translate(39,-45);
    ctx.rotate(-0.18);
    ctx.fillStyle="#d6d6d6";
    ctx.fillRect(-3,-12,7,25);
    ctx.fillStyle="#f6d66f";
    ctx.beginPath();
    ctx.arc(1,-14,5,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawLighting(){
  if(!flashlight.on)return;

  const sx=player.x+player.w/2-camera.x;
  const sy=player.y+player.h*.46;
  const angle=Math.atan2(pointer.y-sy,pointer.x-sx);

  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.68)";
  ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation="destination-out";

  const beamLength=390*(0.55+flashlight.battery/flashlight.maxBattery*.45);
  const beamWidth=.48;
  const gradient=ctx.createRadialGradient(
    sx+Math.cos(angle)*90,sy+Math.sin(angle)*90,10,
    sx+Math.cos(angle)*140,sy+Math.sin(angle)*140,beamLength
  );
  gradient.addColorStop(0,"rgba(0,0,0,.96)");
  gradient.addColorStop(.22,"rgba(0,0,0,.78)");
  gradient.addColorStop(.55,"rgba(0,0,0,.32)");
  gradient.addColorStop(1,"rgba(0,0,0,0)");

  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.moveTo(sx,sy);
  ctx.arc(sx,sy,beamLength,angle-beamWidth,angle+beamWidth);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation="source-over";

  const warm=ctx.createRadialGradient(sx,sy,0,sx,sy,90);
  warm.addColorStop(0,"rgba(255,245,205,.12)");
  warm.addColorStop(1,"rgba(255,245,205,0)");
  ctx.fillStyle=warm;
  ctx.beginPath();
  ctx.arc(sx,sy,90,0,Math.PI*2);
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