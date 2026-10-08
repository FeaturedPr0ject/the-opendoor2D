const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
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
  if(["w","a","s","d","e","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));

const pointer={x:width/2,y:height/2};
addEventListener("mousemove",e=>{
  pointer.x=e.clientX;
  pointer.y=e.clientY;
});

const playerImage=new Image();
playerImage.crossOrigin="anonymous";
playerImage.src="https://devforum-uploads.s3.dualstack.us-east-2.amazonaws.com/uploads/original/4X/2/7/7/277fdfd558e1a41735ccc16397fb311a2be5231d.png";

const wardrobeImage=new Image();
wardrobeImage.crossOrigin="anonymous";
wardrobeImage.src="https://freedesignfile.com/image/preview/16802/wardrobe-drawing-clipart.png";

const world={width:2800,height:900,floorY:690};
const player={
  x:340,
  y:world.floorY-116,
  w:82,
  h:116,
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
  return{
    type:"table",
    x,y,w:230,h:90,
    drawers:[
      {open:false,loot:"coins"},
      {open:false,loot:null},
      {open:false,loot:"coins"}
    ]
  };
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
    if(table.drawers[i].open) continue;
    const drawerY=table.y+18+i*22;
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

function getInteractable(){
  let best=null;
  let bestDist=125;
  for(const o of objects){
    if(o.type==="coins"&&o.collected) continue;
    if(o.type==="table"&&getNearestDrawer(o)<0) continue;
    if(o.type==="door"){
      if(o.open) continue;
      if(Math.abs(player.x+player.w/2-(o.x+o.w/2))>180) continue;
    }
    const d=distanceToObject(o);
    if(d<bestDist){
      best=o;
      bestDist=d;
    }
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
    }else{
      showMessage("Empty drawer");
    }
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
      if(item.type==="table"||item.type==="wardrobe"||item.type==="coins") item.x+=shift;
      if(item.type==="door") item.x=2310+shift;
    }
    showMessage("Room "+room);
  }
}

addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="e")interact();
});

function update(dt){
  let dx=0;
  if(keys.has("a")||keys.has("arrowleft"))dx-=1;
  if(keys.has("d")||keys.has("arrowright"))dx+=1;
  if(dx){
    player.x+=dx*player.speed*dt;
    player.facing=dx<0?-1:1;
  }

  player.x=clamp(player.x,60,world.width-player.w-70);
  player.y=world.floorY-player.h;

  const targetCamera=player.x-width*.42;
  camera.x+=(clamp(targetCamera,0,Math.max(0,world.width-width))-camera.x)*Math.min(1,dt*7);

  canvas.style.cursor=getInteractable()?"pointer":"none";
  messageTimer=Math.max(0,messageTimer-dt);
}

function drawRoom(){
  ctx.fillStyle="#151515";
  ctx.fillRect(0,0,width,height);

  ctx.save();
  ctx.translate(-camera.x,0);

  ctx.fillStyle="#1d1c1c";
  ctx.fillRect(0,0,world.width,world.floorY);

  for(let x=0;x<world.width;x+=160){
    ctx.fillStyle=x%320===0?"#2a2827":"#262423";
    ctx.fillRect(x,0,2,world.floorY);
  }

  ctx.fillStyle="#0b0b0b";
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
  drawLight();

  ctx.restore();
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
  if(wardrobeImage.complete&&wardrobeImage.naturalWidth){
    ctx.drawImage(wardrobeImage,o.x,o.y,o.w,o.h);
  }else{
    ctx.fillStyle="#5a3525";
    ctx.fillRect(o.x,o.y,o.w,o.h);
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
  const y=player.y+player.h;

  ctx.save();
  ctx.translate(x,y);
  if(player.facing<0)ctx.scale(-1,1);

  if(playerImage.complete&&playerImage.naturalWidth){
    ctx.drawImage(playerImage,-player.w/2,-player.h,player.w,player.h);
  }

  ctx.restore();
}

function drawLight(){
  const sx=player.x+player.w/2;
  const sy=player.y+player.h*.45;
  const screenX=sx-camera.x;
  const screenY=sy;
  const angle=Math.atan2(pointer.y-screenY,pointer.x-screenX);

  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(angle);

  const cone=ctx.createRadialGradient(70,0,5,70,0,360);
  cone.addColorStop(0,"rgba(255,250,220,.24)");
  cone.addColorStop(.35,"rgba(255,240,190,.12)");
  cone.addColorStop(1,"rgba(255,240,190,0)");

  ctx.fillStyle=cone;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0,0,360,-.48,.48);
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
