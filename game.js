const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const coinCount=document.getElementById("coinCount"),healthBar=document.getElementById("healthBar");
const slot=document.querySelector(".itemSlot"),state=document.getElementById("flashlightState"),batteryBar=document.getElementById("batteryBar");
let W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener("resize",resize);resize();
const keys=new Set(),mouse={x:W/2,y:H/2};
addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys.add(k);if(["a","d","e","arrowleft","arrowright"].includes(k))e.preventDefault();if(k==="e")interact()});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
addEventListener("mousemove",e=>{mouse.x=e.clientX;mouse.y=e.clientY});slot.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();toggleLight()});
const world={w:3200,floor:690},player={x:340,y:574,w:82,h:116,speed:270,health:100,maxHealth:100,coins:0,dir:1,walk:0,hideState:"none",hideProgress:0,hideStartX:0,hideTargetX:0},cam={x:0},lamp={on:true,battery:100,max:100,drain:100/240};
let room=1,msg="",msgTime=0,darkRoom=Math.random()<1/300;const rusher={active:false,x:0,speed:1050,warning:0,hit:false};
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function say(t){msg=t;msgTime=1}
function coin(){player.coins++;coinCount.textContent=player.coins}
function table(x,y){return{type:"table",x,y,w:230,h:90,drawers:[{open:false,loot:Math.random()<.5?1:0},{open:false,loot:Math.random()<.5?1:0},{open:false,loot:Math.random()<.5?1:0}]}}
function wardrobe(x,y){return{type:"wardrobe",x,y,w:145,h:216,open:false,hiding:false}}
function battery(x,y){return{type:"battery",x,y,w:24,h:34,taken:false}}
function overlaps(a,b,pad=30){return a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y}
function randomRoomObjects(){
 const result=[];
 const types=["table","wardrobe","wardrobe"];
 for(const type of types.sort(()=>Math.random()-.5)){
  let placed=null;
  const w=type==="table"?230:145;
  const h=type==="table"?90:216;
  const y=type==="table"?600:474;
  for(let i=0;i<60&&!placed;i++){
   const x=520+Math.random()*1700;
   const candidate={x,y,w,h};
   if(!result.some(o=>overlaps(candidate,o,110)))placed=candidate;
  }
  if(placed)result.push(type==="table"?table(placed.x,placed.y):wardrobe(placed.x,placed.y));
 }
 if(Math.random()<0.01){
  const bx=1900+Math.random()*520;
  result.push(battery(bx,656));
 }
 result.push({type:"door",x:2740,y:380,w:145,h:310,open:false,openProgress:0});
 return result;
}
let objects=randomRoomObjects();
function dist(o){return Math.hypot(player.x+41-o.x-o.w/2,player.y+58-o.y-o.h/2)}
function drawer(t){let b=-1,bd=1e9;for(let i=0;i<3;i++){if(t.drawers[i].open)continue;const d=Math.hypot(player.x+41-t.x-115,player.y+58-t.y-28-i*22);if(d<bd){bd=d;b=i}}return b}
function target(){let b=null,bd=125;for(const o of objects){if(o.type==="battery"&&o.taken)continue;if(o.type==="table"&&drawer(o)<0)continue;if(o.type==="door"&&Math.abs(player.x+41-o.x-o.w/2)>220)continue;const d=dist(o);if(d<bd){bd=d;b=o}}return b}
function enterWardrobe(o){if(player.hideState!=="none")return;player.hideState="in";player.hideProgress=0;player.hideStartX=player.x;player.hideTargetX=o.x+o.w/2-player.w/2;o.hiding=true;lamp.on=false}
function leaveWardrobe(){if(player.hideState!=="hidden")return;player.hideState="out";player.hideProgress=1;player.hideStartX=player.x;player.hideTargetX=player.x+(player.dir>=0?105:-105);const o=objects.find(v=>v.type==="wardrobe"&&v.hiding);if(o)o.hiding=false}
function interact(){
 if(player.hideState==="hidden"){leaveWardrobe();return}
 if(player.hideState!=="none")return
 const o=target();
 if(!o)return;
 if(o.type==="table"){const i=drawer(o);o.drawers[i].open=true;if(o.drawers[i].loot){o.drawers[i].loot=0;coin();say("Coin collected")}else say("Empty drawer")}
 else if(o.type==="wardrobe")enterWardrobe(o);
 else if(o.type==="battery"){o.taken=true;lamp.battery=Math.min(lamp.max,lamp.battery+40);say("Battery +40%")}
 else if(o.type==="door")return
}
function nextRoom(){
 room++;darkRoom=Math.random()<1/300;rusher.active=false;rusher.hit=false;rusher.warning=Math.random()<0.25?2+Math.random()*3:0;
 player.x=180;
 player.hideState="none";
 player.hideProgress=0;
 objects=randomRoomObjects();
 say("Room "+room);
}
function toggleLight(){if(player.hideState!=="none")return;if(lamp.on)lamp.on=false;else if(lamp.battery>0)lamp.on=true;hud()}
function hud(){batteryBar.style.width=Math.max(0,lamp.battery)+"%";state.textContent=lamp.on?"USED":"NOT USED";slot.classList.toggle("active",lamp.on);slot.classList.toggle("empty",lamp.battery<=0)}
function update(dt){
 if(player.hideState==="in"){
  player.hideProgress=Math.min(1,player.hideProgress+dt*2.5);
  player.x=player.hideStartX+(player.hideTargetX-player.hideStartX)*player.hideProgress;
  player.y=world.floor-player.h;
  if(player.hideProgress>=1)player.hideState="hidden";
 }else if(player.hideState==="hidden"){
  player.y=world.floor-player.h;
 }else if(player.hideState==="out"){
  player.hideProgress=Math.max(0,player.hideProgress-dt*2.5);
  player.x=player.hideStartX+(player.hideTargetX-player.hideStartX)*(1-player.hideProgress);
  player.y=world.floor-player.h;
  if(player.hideProgress<=0)player.hideState="none";
 }else{
  let dx=(keys.has("d")||keys.has("arrowright"))-(keys.has("a")||keys.has("arrowleft"));
  if(dx){player.x+=dx*player.speed*dt;player.dir=dx;player.walk+=dt*10}else player.walk+=dt*2;
  player.x=clamp(player.x,60,world.w-player.w-70);
  player.y=world.floor-player.h;
  const door=objects.find(o=>o.type==="door");
  if(door&&player.x+player.w>door.x-90)door.open=true;
  if(door&&door.open)door.openProgress=Math.min(1,door.openProgress+dt*2.8);
  if(door&&door.openProgress>0.65&&player.x>door.x+80)nextRoom();
 }
 if(lamp.on){lamp.battery=Math.max(0,lamp.battery-lamp.drain*dt);if(lamp.battery===0)lamp.on=false}
 if(rusher.warning>0){rusher.warning-=dt;if(rusher.warning<=0&&!rusher.active){rusher.active=true;rusher.x=Math.min(world.w-80,player.x+W+cam.x*.15);rusher.hit=false}}
 if(rusher.active){rusher.x-=rusher.speed*dt;if(!rusher.hit&&Math.abs(rusher.x-(player.x+player.w/2))<70){rusher.hit=true;if(player.hideState!=="hidden")player.health=Math.max(0,player.health-45)}if(rusher.x<player.x-180)rusher.active=false}
 cam.x+=(clamp(player.x-W*.42,0,Math.max(0,world.w-W))-cam.x)*Math.min(1,dt*7);
 msgTime=Math.max(0,msgTime-dt);
 hud();
}
function ceiling(){for(let x=260;x<world.w;x+=520){const g=ctx.createRadialGradient(x,70,5,x,70,280);g.addColorStop(0,"rgba(255,225,150,.2)");g.addColorStop(1,"rgba(255,210,120,0)");ctx.fillStyle=g;ctx.fillRect(x-280,0,560,420);ctx.strokeStyle="#8f6d3d";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,35);ctx.stroke();ctx.fillStyle="#a4814a";ctx.beginPath();ctx.arc(x,48,12,0,7);ctx.fill();ctx.fillStyle="#fff0b0";ctx.beginPath();ctx.arc(x,48,7,0,7);ctx.fill();ctx.strokeStyle="#9b7b45";ctx.lineWidth=3;for(let i=-1;i<2;i++){ctx.beginPath();ctx.moveTo(x,51);ctx.lineTo(x+i*25,80);ctx.stroke();ctx.fillStyle="#ffe7a4";ctx.beginPath();ctx.arc(x+i*25,85,7,0,7);ctx.fill()}}}
function drawTable(o){ctx.fillStyle="#4a3022";ctx.fillRect(o.x,o.y,o.w,14);ctx.fillStyle="#563727";ctx.fillRect(o.x+16,o.y+14,14,o.h-14);ctx.fillRect(o.x+o.w-30,o.y+14,14,o.h-14);for(let i=0;i<3;i++){const y=o.y+18+i*22;ctx.fillStyle="#38251d";ctx.fillRect(o.x+42,y,o.w-84,18);ctx.strokeStyle="#80513a";ctx.strokeRect(o.x+42,y,o.w-84,18);ctx.fillStyle="#c69d62";ctx.fillRect(o.x+110,y+6,10,5)}}
function drawWardrobe(o){
 ctx.save();
 ctx.fillStyle="#4c2c20";ctx.fillRect(o.x-4,o.y-9,o.w+8,9);
 ctx.fillStyle="#6b3e2b";ctx.fillRect(o.x,o.y,o.w,o.h);
 ctx.fillStyle="#7d4a32";ctx.fillRect(o.x+6,o.y+7,63,o.h-14);ctx.fillRect(o.x+76,o.y+7,63,o.h-14);
 ctx.strokeStyle="#321e16";ctx.lineWidth=4;ctx.strokeRect(o.x+6,o.y+7,63,o.h-14);ctx.strokeRect(o.x+76,o.y+7,63,o.h-14);
 ctx.strokeStyle="#a66a48";ctx.lineWidth=2;ctx.strokeRect(o.x+15,o.y+20,45,o.h-40);ctx.strokeRect(o.x+85,o.y+20,45,o.h-40);
 ctx.fillStyle="#d3a45e";ctx.beginPath();ctx.arc(o.x+65,o.y+108,5,0,Math.PI*2);ctx.arc(o.x+80,o.y+108,5,0,Math.PI*2);ctx.fill();
 if(o.hiding){ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(o.x+6,o.y+7,133,o.h-14)}
 ctx.restore();
}
function drawBattery(o){if(o.taken)return;ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle="#d9d9d9";ctx.fillRect(2,5,20,27);ctx.fillStyle="#8fbf63";ctx.fillRect(5,8,14,21);ctx.fillStyle="#ddd";ctx.fillRect(8,0,8,6);ctx.fillStyle="#202020";ctx.font="bold 8px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("40",12,19);ctx.restore()}
function drawDoor(o){
 const open=o.openProgress||0;
 ctx.save();
 ctx.fillStyle="#21140e";ctx.fillRect(o.x,o.y,o.w,o.h);
 ctx.strokeStyle="#684329";ctx.lineWidth=7;ctx.strokeRect(o.x,o.y,o.w,o.h);
 ctx.fillStyle="#d8d2c7";ctx.beginPath();ctx.roundRect(o.x+18,o.y+68,o.w-36,74,10);ctx.fill();
 ctx.strokeStyle="#4a4640";ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle="#171615";ctx.font="700 38px Georgia,serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(room,o.x+o.w/2,o.y+105);
 ctx.save();ctx.translate(o.x+4,o.y+4);ctx.rotate(-open*1.28);
 ctx.fillStyle="#4b2c1b";ctx.fillRect(0,0,o.w-8,o.h-8);
 ctx.strokeStyle="#815433";ctx.lineWidth=5;ctx.strokeRect(2,2,o.w-12,o.h-12);
 ctx.fillStyle="#5c3823";ctx.fillRect(12,12,o.w-32,o.h-32);
 ctx.strokeStyle="#352014";ctx.lineWidth=3;ctx.strokeRect(12,12,o.w-32,o.h-32);
 ctx.fillStyle="#c7a66b";ctx.beginPath();ctx.arc(o.w-28,o.h/2,5,0,Math.PI*2);ctx.fill();
 ctx.restore();ctx.restore();
}
function drawRig(){
 const x=player.x+41,y=player.y+116;
 const moving=keys.has("a")||keys.has("d")||keys.has("arrowleft")||keys.has("arrowright");
 const swing=moving?Math.sin(player.walk)*12:0;
 const hide=player.hideState==="in"?player.hideProgress:player.hideState==="hidden"?1:player.hideState==="out"?player.hideProgress:0;
 const sx=player.x+41-cam.x,sy=player.y+46;
 let aim=Math.atan2(mouse.y-sy,mouse.x-sx);if(player.dir<0)aim=Math.atan2(mouse.y-sy,sx-mouse.x);aim=clamp(aim,-1.45,1.45);
 ctx.save();ctx.translate(x,y);if(player.dir<0)ctx.scale(-1,1);ctx.translate(0,hide*42);ctx.globalAlpha=1-hide;
 ctx.fillStyle="#17843d";
 ctx.save();ctx.translate(-12,-35);ctx.rotate(swing*Math.PI/180);ctx.fillRect(-9,0,18,35);ctx.restore();
 ctx.save();ctx.translate(12,-35);ctx.rotate(-swing*Math.PI/180);ctx.fillRect(-9,0,18,35);ctx.restore();
 ctx.fillStyle="#1687d2";ctx.fillRect(-20,-78,40,43);
 ctx.fillStyle="#ffd33d";
 ctx.save();ctx.translate(-27,-70);ctx.rotate(-swing*.8*Math.PI/180);ctx.fillRect(-7,0,14,38);ctx.restore();
 ctx.save();ctx.translate(27,-70);ctx.rotate(aim);ctx.fillRect(-7,0,14,35);ctx.translate(0,32);
 if(lamp.on){ctx.fillStyle="#d6d6d6";ctx.fillRect(-5,0,10,24);ctx.fillStyle="#fff0a0";ctx.beginPath();ctx.ellipse(0,25,6,4,0,0,Math.PI*2);ctx.fill()}
 ctx.restore();
 ctx.fillStyle="#f5c62f";ctx.fillRect(-17,-112,34,34);ctx.fillStyle="#e3a91f";ctx.fillRect(-17,-112,34,4);
 ctx.fillStyle="#191919";ctx.fillRect(-9,-99,4,4);ctx.fillRect(5,-99,4,4);ctx.fillRect(-7,-89,14,3);
 ctx.restore();
}
function drawRusher(){
 if(!rusher.active)return;
 ctx.save();ctx.translate(rusher.x-cam.x,world.floor-112);ctx.shadowColor="#f22";ctx.shadowBlur=28;
 ctx.fillStyle="#12090b";ctx.beginPath();ctx.ellipse(0,44,48,55,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#b71924";ctx.beginPath();ctx.ellipse(0,44,35,43,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-13,28,8,12,-.2,0,Math.PI*2);ctx.ellipse(13,28,8,12,.2,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#171010";ctx.beginPath();ctx.ellipse(-13,30,3,7,0,0,Math.PI*2);ctx.ellipse(13,30,3,7,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#f3d6d6";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-17,57);ctx.lineTo(-8,65);ctx.lineTo(0,57);ctx.lineTo(8,65);ctx.lineTo(17,57);ctx.stroke();ctx.restore();
}
const lightCanvas=document.createElement("canvas"),lightCtx=lightCanvas.getContext("2d");
function lighting(){
 if(!darkRoom||!lamp.on)return;
 lightCanvas.width=Math.max(1,Math.floor(W));lightCanvas.height=Math.max(1,Math.floor(H));
 lightCtx.setTransform(1,0,0,1,0,0);lightCtx.globalCompositeOperation="source-over";lightCtx.clearRect(0,0,W,H);
 lightCtx.fillStyle="rgba(0,0,0,.68)";lightCtx.fillRect(0,0,W,H);
 const sx=player.x+41-cam.x,sy=player.y+52,a=Math.atan2(mouse.y-sy,mouse.x-sx),len=430*(.6+lamp.battery/lamp.max*.4);
 lightCtx.globalCompositeOperation="destination-out";
 const glow=lightCtx.createRadialGradient(sx,sy,8,sx,sy,170);glow.addColorStop(0,"rgba(0,0,0,1)");glow.addColorStop(.45,"rgba(0,0,0,.95)");glow.addColorStop(.8,"rgba(0,0,0,.45)");glow.addColorStop(1,"rgba(0,0,0,0)");
 lightCtx.fillStyle=glow;lightCtx.beginPath();lightCtx.arc(sx,sy,170,0,Math.PI*2);lightCtx.fill();
 const tipX=sx+Math.cos(a)*len,tipY=sy+Math.sin(a)*len,cone=lightCtx.createLinearGradient(sx,sy,tipX,tipY);
 cone.addColorStop(0,"rgba(0,0,0,1)");cone.addColorStop(.18,"rgba(0,0,0,.98)");cone.addColorStop(.55,"rgba(0,0,0,.72)");cone.addColorStop(1,"rgba(0,0,0,0)");
 lightCtx.fillStyle=cone;lightCtx.beginPath();lightCtx.moveTo(sx,sy);lightCtx.lineTo(sx+Math.cos(a-.5)*len,sy+Math.sin(a-.5)*len);lightCtx.arc(sx,sy,len,a-.5,a+.5);lightCtx.lineTo(sx,sy);lightCtx.closePath();lightCtx.fill();
 lightCtx.globalCompositeOperation="source-over";ctx.drawImage(lightCanvas,0,0,W,H);
}
function scene(){
 ctx.fillStyle="#151515";ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam.x,0);
 ctx.fillStyle=darkRoom?"#080808":"#1d1c1c";ctx.fillRect(0,0,world.w,world.floor);
 for(let x=0;x<world.w;x+=160){ctx.fillStyle=darkRoom?"#101010":(x%320?"#242222":"#292727");ctx.fillRect(x,0,2,world.floor)}
 if(!darkRoom)ceiling();ctx.fillStyle="#0a0a0a";ctx.fillRect(0,world.floor,world.w,H-world.floor);ctx.fillStyle="#3a3531";ctx.fillRect(0,world.floor-10,world.w,10);
 objects.forEach(o=>{if(o.type==="table")drawTable(o);if(o.type==="wardrobe")drawWardrobe(o);if(o.type==="battery")drawBattery(o);if(o.type==="door")drawDoor(o)});
 drawRig();drawRusher();ctx.restore();lighting();
}
let last=performance.now();
function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);scene();healthBar.style.width=player.health/player.maxHealth*100+"%";if(msgTime>0){ctx.fillStyle="#fff";ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.fillText(msg,W/2,80)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);