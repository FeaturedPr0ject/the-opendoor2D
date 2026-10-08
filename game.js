const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const coinCount=document.getElementById("coinCount"),healthBar=document.getElementById("healthBar");
const slot=document.querySelector(".itemSlot"),state=document.getElementById("flashlightState"),batteryBar=document.getElementById("batteryBar");
let W=innerWidth,H=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
function resize(){W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener("resize",resize);resize();
const keys=new Set(),mouse={x:W/2,y:H/2};
addEventListener("keydown",e=>{const k=e.key.toLowerCase();keys.add(k);if(["a","d","e","f","arrowleft","arrowright"].includes(k))e.preventDefault();if(k==="e")interact();if(k==="f")toggleLight()});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
addEventListener("mousemove",e=>{mouse.x=e.clientX;mouse.y=e.clientY});slot.onclick=toggleLight;
const world={w:2800,floor:690},player={x:340,y:574,w:82,h:116,speed:270,health:100,maxHealth:100,coins:0,dir:1,walk:0},cam={x:0},lamp={on:true,battery:100,max:100,drain:7.5};
let room=1,msg="",msgTime=0;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function say(t){msg=t;msgTime=1}function coin(){player.coins++;coinCount.textContent=player.coins}
function table(x,y){return{type:"table",x,y,w:230,h:90,drawers:[{open:false,loot:1},{open:false,loot:0},{open:false,loot:1}]}}
function wardrobe(x,y){return{type:"wardrobe",x,y,w:145,h:216,open:false}}
function newRoom(){return[table(760,600),wardrobe(1230,474),wardrobe(1510,474),{type:"coin",x:1810,y:666,w:28,h:28,taken:false},{type:"door",x:2310,y:380,w:145,h:310,open:false}]}
let objects=newRoom();
function dist(o){return Math.hypot(player.x+41-o.x-o.w/2,player.y+58-o.y-o.h/2)}
function drawer(t){let b=-1,bd=1e9;for(let i=0;i<3;i++){if(t.drawers[i].open)continue;const d=Math.hypot(player.x+41-t.x-115,player.y+58-t.y-28-i*22);if(d<bd){bd=d;b=i}}return b}
function target(){let b=null,bd=125;for(const o of objects){if(o.type==="coin"&&o.taken)continue;if(o.type==="table"&&drawer(o)<0)continue;if(o.type==="door"&&Math.abs(player.x+41-o.x-o.w/2)>180)continue;const d=dist(o);if(d<bd){bd=d;b=o}}return b}
function interact(){const o=target();if(!o)return;if(o.type==="table"){const i=drawer(o);o.drawers[i].open=true;if(o.drawers[i].loot){o.drawers[i].loot=0;coin();say("Coin collected")}else say("Empty drawer")}else if(o.type==="wardrobe"){o.open=!o.open;say(o.open?"Wardrobe opened":"Wardrobe closed")}else if(o.type==="coin"){o.taken=true;coin();say("Coin collected")}else if(o.type==="door"){room++;player.x=180;objects=newRoom();const s=Math.min(room*90,800);objects.forEach(v=>{if(["table","wardrobe","coin"].includes(v.type))v.x+=s;if(v.type==="door")v.x=2310+s});say("Room "+room)}}
function toggleLight(){if(lamp.on){lamp.on=false;say("Flashlight off")}else if(lamp.battery>0){lamp.on=true;say("Flashlight on")}else say("Battery empty")}
function hud(){batteryBar.style.width=Math.max(0,lamp.battery)+"%";state.textContent=lamp.on?"USED":"NOT USED";slot.classList.toggle("active",lamp.on);slot.classList.toggle("empty",lamp.battery<=0)}
function update(dt){let dx=(keys.has("d")||keys.has("arrowright"))-(keys.has("a")||keys.has("arrowleft"));if(dx){player.x+=dx*player.speed*dt;player.dir=dx;player.walk+=dt*10}else player.walk+=dt*2;player.x=clamp(player.x,60,world.w-player.w-70);player.y=world.floor-player.h;if(lamp.on){lamp.battery=Math.max(0,lamp.battery-lamp.drain*dt);if(lamp.battery===0){lamp.on=false;say("Flashlight battery empty")}}cam.x+=(clamp(player.x-W*.42,0,Math.max(0,world.w-W))-cam.x)*Math.min(1,dt*7);msgTime=Math.max(0,msgTime-dt);hud()}
function ceiling(){for(let x=260;x<world.w;x+=520){const g=ctx.createRadialGradient(x,70,5,x,70,280);g.addColorStop(0,"rgba(255,225,150,.2)");g.addColorStop(1,"rgba(255,210,120,0)");ctx.fillStyle=g;ctx.fillRect(x-280,0,560,420);ctx.strokeStyle="#8f6d3d";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,35);ctx.stroke();ctx.fillStyle="#a4814a";ctx.beginPath();ctx.arc(x,48,12,0,7);ctx.fill();ctx.fillStyle="#fff0b0";ctx.beginPath();ctx.arc(x,48,7,0,7);ctx.fill();ctx.strokeStyle="#9b7b45";ctx.lineWidth=3;for(let i=-1;i<2;i++){ctx.beginPath();ctx.moveTo(x,51);ctx.lineTo(x+i*25,80);ctx.stroke();ctx.fillStyle="#ffe7a4";ctx.beginPath();ctx.arc(x+i*25,85,7,0,7);ctx.fill()}}}
function drawTable(o){ctx.fillStyle="#4a3022";ctx.fillRect(o.x,o.y,o.w,14);ctx.fillStyle="#563727";ctx.fillRect(o.x+16,o.y+14,14,o.h-14);ctx.fillRect(o.x+o.w-30,o.y+14,14,o.h-14);for(let i=0;i<3;i++){const y=o.y+18+i*22;ctx.fillStyle="#38251d";ctx.fillRect(o.x+42,y,o.w-84,18);ctx.strokeStyle="#80513a";ctx.strokeRect(o.x+42,y,o.w-84,18);ctx.fillStyle="#c69d62";ctx.fillRect(o.x+110,y+6,10,5)}}
function drawWardrobe(o){ctx.fillStyle="#5a3525";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle="#70432e";ctx.fillRect(o.x+5,o.y+5,64,o.h-10);ctx.fillRect(o.x+76,o.y+5,64,o.h-10);ctx.strokeStyle="#382219";ctx.lineWidth=4;ctx.strokeRect(o.x+5,o.y+5,64,o.h-10);ctx.strokeRect(o.x+76,o.y+5,64,o.h-10);ctx.strokeStyle="#9a6042";ctx.lineWidth=2;ctx.strokeRect(o.x+15,o.y+18,44,o.h-36);ctx.strokeRect(o.x+86,o.y+18,44,o.h-36);ctx.fillStyle="#d0a25f";ctx.beginPath();ctx.arc(o.x+64,o.y+108,5,0,7);ctx.arc(o.x+81,o.y+108,5,0,7);ctx.fill()}
function drawCoin(x,y){ctx.fillStyle="#e8c04c";ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill();ctx.fillStyle="#8d6815";ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("$",x,y)}
function drawDoor(o){ctx.fillStyle="#2d1a10";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle="#684329";ctx.lineWidth=6;ctx.strokeRect(o.x,o.y,o.w,o.h);ctx.fillStyle="#d8d2c7";ctx.fillRect(o.x+18,o.y+70,o.w-36,70);ctx.strokeStyle="#4a4640";ctx.lineWidth=3;ctx.strokeRect(o.x+18,o.y+70,o.w-36,70);ctx.fillStyle="#171615";ctx.font="bold 42px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(room,o.x+o.w/2,o.y+105)}
function drawRig(){const x=player.x+41,y=player.y+116,moving=keys.has("a")||keys.has("d")||keys.has("arrowleft")||keys.has("arrowright"),s=moving?Math.sin(player.walk)*18:0;ctx.save();ctx.translate(x,y);if(player.dir<0)ctx.scale(-1,1);ctx.fillStyle="#176c38";ctx.save();ctx.translate(-14,-35);ctx.rotate(s*Math.PI/180);ctx.fillRect(-9,0,18,35);ctx.restore();ctx.save();ctx.translate(14,-35);ctx.rotate(-s*Math.PI/180);ctx.fillRect(-9,0,18,35);ctx.restore();ctx.fillStyle="#1687d2";ctx.fillRect(-25,-77,50,43);ctx.fillStyle="#ffd23f";ctx.save();ctx.translate(-32,-70);ctx.rotate(-s*.8*Math.PI/180);ctx.fillRect(-7,0,14,39);ctx.restore();ctx.save();ctx.translate(32,-70);ctx.rotate(s*.8*Math.PI/180);ctx.fillRect(-7,0,14,39);ctx.restore();ctx.fillStyle="#f4c32e";ctx.fillRect(-18,-103,36,26);ctx.fillStyle="#191919";ctx.fillRect(-9,-95,4,4);ctx.fillRect(5,-95,4,4);ctx.fillRect(-7,-85,14,3);if(lamp.on){ctx.fillStyle="#d6d6d6";ctx.fillRect(36,-52,7,25);ctx.fillStyle="#fff0a0";ctx.beginPath();ctx.arc(40,-54,5,0,7);ctx.fill()}ctx.restore()}
const lightCanvas=document.createElement("canvas"),lightCtx=lightCanvas.getContext("2d");
function lighting(){
 if(!lamp.on)return;
 lightCanvas.width=Math.ceil(W*dpr);
 lightCanvas.height=Math.ceil(H*dpr);
 lightCtx.setTransform(dpr,0,0,dpr,0,0);
 lightCtx.clearRect(0,0,W,H);
 lightCtx.fillStyle="rgba(0,0,0,.72)";
 lightCtx.fillRect(0,0,W,H);
 const sx=player.x+41-cam.x,sy=player.y+52;
 const a=Math.atan2(mouse.y-sy,mouse.x-sx);
 const len=400*(.55+lamp.battery/lamp.max*.45);
 lightCtx.save();
 lightCtx.globalCompositeOperation="destination-out";
 const g=lightCtx.createRadialGradient(sx+Math.cos(a)*90,sy+Math.sin(a)*90,5,sx+Math.cos(a)*140,sy+Math.sin(a)*140,len);
 g.addColorStop(0,"rgba(0,0,0,1)");
 g.addColorStop(.18,"rgba(0,0,0,.9)");
 g.addColorStop(.5,"rgba(0,0,0,.4)");
 g.addColorStop(1,"rgba(0,0,0,0)");
 lightCtx.fillStyle=g;
 lightCtx.beginPath();
 lightCtx.moveTo(sx,sy);
 lightCtx.arc(sx,sy,len,a-.48,a+.48);
 lightCtx.closePath();
 lightCtx.fill();
 lightCtx.restore();
 ctx.drawImage(lightCanvas,0,0,W,H);
}
function scene(){ctx.fillStyle="#151515";ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam.x,0);ctx.fillStyle="#1d1c1c";ctx.fillRect(0,0,world.w,world.floor);for(let x=0;x<world.w;x+=160){ctx.fillStyle=x%320?"#242222":"#292727";ctx.fillRect(x,0,2,world.floor)}ceiling();ctx.fillStyle="#0a0a0a";ctx.fillRect(0,world.floor,world.w,H-world.floor);ctx.fillStyle="#3a3531";ctx.fillRect(0,world.floor-10,world.w,10);objects.forEach(o=>{if(o.type==="table")drawTable(o);if(o.type==="wardrobe")drawWardrobe(o);if(o.type==="coin"&&!o.taken)drawCoin(o.x+14,o.y+14);if(o.type==="door")drawDoor(o)});drawRig();ctx.restore();lighting()}
let last=performance.now();function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);scene();healthBar.style.width=player.health/player.maxHealth*100+"%";if(msgTime>0){ctx.fillStyle="#fff";ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.fillText(msg,W/2,80)}requestAnimationFrame(loop)}requestAnimationFrame(loop);