#!/usr/bin/env node
/** Deterministic raster-only MVP texture generator. Emits PNG textures only. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(import.meta.dirname, '../..');
const ASSETS = resolve(ROOT, 'public/assets');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}
function savePng(img, path) {
  mkdirSync(dirname(path), { recursive: true });
  const stride = img.w * 4;
  const raw = Buffer.alloc((stride + 1) * img.h);
  for (let y = 0; y < img.h; y += 1) {
    const dst = y * (stride + 1);
    raw[dst] = 0;
    img.data.copy(raw, dst + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}
function image(w, h, color = [0,0,0,0]) {
  const data = Buffer.alloc(w * h * 4);
  const img = { w, h, data };
  if (color[3] !== 0) fillRect(img, 0, 0, w, h, color);
  return img;
}
function blend(img, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || color[3] <= 0) return;
  const i = (y * img.w + x) * 4;
  const sa = color[3] / 255; const da = img.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  for (let c = 0; c < 3; c += 1) img.data[i + c] = Math.round((color[c] * sa + img.data[i + c] * da * (1 - sa)) / oa);
  img.data[i + 3] = Math.round(oa * 255);
}
function fillRect(img, x0, y0, x1, y1, color) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(img.w, Math.ceil(x1)); y1 = Math.min(img.h, Math.ceil(y1));
  for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) blend(img, x, y, color);
}
function ellipse(img, cx, cy, rx, ry, color, feather = 0) {
  const minX = Math.max(0, Math.floor(cx-rx-feather)); const maxX = Math.min(img.w-1, Math.ceil(cx+rx+feather));
  const minY = Math.max(0, Math.floor(cy-ry-feather)); const maxY = Math.min(img.h-1, Math.ceil(cy+ry+feather));
  for (let y=minY; y<=maxY; y+=1) for (let x=minX; x<=maxX; x+=1) {
    const d = Math.sqrt(((x-cx)/rx)**2 + ((y-cy)/ry)**2);
    if (d <= 1 + feather/Math.max(rx,ry)) {
      let a = color[3];
      if (d > 1 && feather > 0) a = Math.round(a * Math.max(0, 1 - (d-1)*Math.max(rx,ry)/feather));
      blend(img,x,y,[color[0],color[1],color[2],a]);
    }
  }
}
function line(img, x0,y0,x1,y1,width,color) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1-x0,y1-y0)));
  for (let i=0;i<=steps;i+=1) {
    const t=i/steps; ellipse(img, x0+(x1-x0)*t, y0+(y1-y0)*t, width/2,width/2,color);
  }
}
function polygon(img, points, color) {
  const ys = points.map(p=>p[1]); const minY=Math.max(0,Math.floor(Math.min(...ys))); const maxY=Math.min(img.h-1,Math.ceil(Math.max(...ys)));
  for (let y=minY;y<=maxY;y+=1) {
    const xs=[];
    for (let i=0,j=points.length-1;i<points.length;j=i++) {
      const [xi,yi]=points[i], [xj,yj]=points[j];
      if ((yi>y)!==(yj>y)) xs.push(xi+(y-yi)*(xj-xi)/(yj-yi));
    }
    xs.sort((a,b)=>a-b);
    for (let k=0;k+1<xs.length;k+=2) for (let x=Math.ceil(xs[k]);x<=Math.floor(xs[k+1]);x+=1) blend(img,x,y,color);
  }
}
function rng(seed) { let s=seed>>>0; return ()=>{ s ^= s<<13; s ^= s>>>17; s ^= s<<5; return (s>>>0)/4294967296; }; }
function addNoise(img, seed, strength, onlyOpaque=true) {
  const rand=rng(seed);
  for(let i=0;i<img.data.length;i+=4){ if(onlyOpaque && img.data[i+3]===0) continue; const n=(rand()-0.5)*2*strength; for(let c=0;c<3;c+=1) img.data[i+c]=Math.max(0,Math.min(255,Math.round(img.data[i+c]+n))); }
}
function highlight(img,cx,cy,radius,alpha=55){
  const r2=radius*radius;
  for(let y=Math.max(0,cy-radius);y<Math.min(img.h,cy+radius);y+=1) for(let x=Math.max(0,cx-radius);x<Math.min(img.w,cx+radius);x+=1){
    const d2=(x-cx)**2+(y-cy)**2; if(d2>r2) continue; const a=Math.round(alpha*(1-Math.sqrt(d2)/radius)); blend(img,x,y,[255,255,255,a]);
  }
}
const W=768,H=768;
function pigeonBody(index, spec){ const img=image(W,H); ellipse(img,spec.cx,spec.cy,spec.rx,spec.ry,[spec.c[0],spec.c[1],spec.c[2],255],8); ellipse(img,spec.cx+20,spec.cy+110,spec.rx*.82,spec.ry*.65,[20,24,30,30],22); addNoise(img,index,18); highlight(img,330,360,190,58); savePng(img,resolve(ASSETS,`pigeon/body_t${index}.png`)); }
function generatePigeon(){
  pigeonBody(1,{cx:400,cy:495,rx:175,ry:195,c:[78,91,106]});
  pigeonBody(2,{cx:400,cy:485,rx:210,ry:215,c:[82,94,108]});
  pigeonBody(3,{cx:398,cy:478,rx:245,ry:232,c:[86,97,112]});
  const head=image(W,H); ellipse(head,388,292,113,113,[92,105,118,255],6); ellipse(head,355,385,95,85,[39,139,129,85],12); ellipse(head,425,385,90,82,[102,80,166,68],12); addNoise(head,7,16); highlight(head,350,240,115,62); savePng(head,resolve(ASSETS,'pigeon/head.png'));
  const eyes=image(W,H); ellipse(eyes,419,255,16,16,[245,235,205,255]); ellipse(eyes,423,257,8,10,[22,21,20,255]); ellipse(eyes,421,252,3,3,[255,255,255,230]); line(eyes,397,238,434,232,8,[34,37,43,230]); savePng(eyes,resolve(ASSETS,'pigeon/eyes.png'));
  const beakSpecs=[[[450,272],[555,300],[453,326],[210,150,85,255]],[[448,268],[585,298],[450,333],[225,168,92,255]],[[444,264],[610,298],[447,338],[238,193,55,255]]];
  beakSpecs.forEach((s,idx)=>{const img=image(W,H); polygon(img,s.slice(0,3),s[3]); line(img,s[0][0],s[0][1],s[1][0],s[1][1],3,[95,65,35,150]); ellipse(img,475,290,7,5,[80,52,30,170]); savePng(img,resolve(ASSETS,`pigeon/beak_t${idx+1}.png`));});
  const wingSpecs=[[[225,350],[115,405],[170,585],[300,520]],[[210,335],[78,400],[148,610],[315,525]],[[200,320],[50,385],[125,635],[320,530]]];
  wingSpecs.forEach((pts,idx)=>{const img=image(W,H); polygon(img,pts,[66-idx*3,80-idx*3,96,245]); for(let b=0;b<4;b+=1) line(img,150,430+b*35,270,465+b*35,5,[145,155,165,90]); savePng(img,resolve(ASSETS,`pigeon/wing_t${idx+1}.png`));});
  const legs=image(W,H); for(const x of [315,420]){line(legs,x,620,x,700,18,[190,96,85,255]);line(legs,x,700,x-30,730,12,[190,96,85,255]);line(legs,x,700,x+32,728,12,[190,96,85,255]);} savePng(legs,resolve(ASSETS,'pigeon/legs.png'));
  const glasses=image(W,H); fillRect(glasses,365,228,430,265,[18,20,24,235]); fillRect(glasses,431,228,496,265,[18,20,24,235]); line(glasses,430,244,434,244,5,[215,195,90,230]); line(glasses,365,236,330,226,5,[215,195,90,220]); savePng(glasses,resolve(ASSETS,'pigeon/glasses.png'));
  const chain=image(W,H); for(let a=0;a<=180;a+=18){const r=a*Math.PI/180; ellipse(chain,372+95*Math.cos(r),420+48*Math.sin(r),9,6,[238,196,55,245]);} ellipse(chain,373,471,20,20,[230,181,48,255]); savePng(chain,resolve(ASSETS,'pigeon/chain.png'));
  const nest=image(W,H); const rand=rng(99); for(let i=0;i<42;i+=1){const x=180+rand()*380,y=630+rand()*80; line(nest,x,y,x+(rand()-.5)*150,y+(rand()-.5)*30,5+rand()*4,[150+rand()*25,100+rand()*25,50,220]);} savePng(nest,resolve(ASSETS,'pigeon/nest.png'));
  const shadow=image(W,H); ellipse(shadow,380,700,205,42,[0,0,0,95],22); savePng(shadow,resolve(ASSETS,'pigeon/shadow.png'));
}
function generateWorld(){ const w=1600,h=1000,img=image(w,h); for(let y=0;y<h;y+=1){const t=Math.min(y/h,.55); const c=[185+(231-185)*t,211+(215-211)*t,222+(184-222)*t,255]; fillRect(img,0,y,w,y+1,c);} const rand=rng(12); for(let i=0;i<18;i+=1){const x=i*100-20+rand()*50,bh=160+rand()*200;fillRect(img,x,460-bh,x+90,460,[125,138,145,150]);} for(const x of [80,260,1320,1510]){fillRect(img,x-18,390,x+20,720,[91,69,47,255]);ellipse(img,x-50,360,100,100,[76,128,82,230]);ellipse(img,x+30,340,115,115,[76,128,82,230]);ellipse(img,x+5,410,120,120,[76,128,82,230]);} fillRect(img,0,620,w,h,[113,143,92,255]); polygon(img,[[0,820],[w,700],[w,h],[0,h]],[181,169,146,255]); fillRect(img,480,640,1000,690,[100,61,40,255]);fillRect(img,500,705,980,750,[118,72,45,255]);fillRect(img,540,685,565,850,[65,53,45,255]);fillRect(img,920,685,945,820,[65,53,45,255]);fillRect(img,1180,370,1200,720,[49,55,60,255]);ellipse(img,1190,360,45,40,[245,232,190,215]);addNoise(img,22,5,false);savePng(img,resolve(ASSETS,'world/park_bg.png')); }
function icon(name,draw){const img=image(256,256);ellipse(img,128,128,110,110,[27,31,38,245]);ellipse(img,128,128,104,104,[27,31,38,245]);draw(img);savePng(img,resolve(ASSETS,`ui/${name}.png`));}
function generateUi(){ icon('feather',img=>{polygon(img,[[125,36],[170,70],[146,182],[105,220],[112,156],[74,172],[108,126]],[242,200,75,255]);line(img,100,205,153,70,8,[255,240,165,255]);}); icon('beak',img=>polygon(img,[[52,110],[205,78],[98,168]],[225,168,92,255])); icon('body',img=>ellipse(img,130,135,60,85,[98,110,124,255])); icon('nest',img=>{for(let i=0;i<6;i+=1)line(img,55,125+i*10,205,145+i*7,7,[184,126,62,240]);}); icon('wings',img=>{polygon(img,[[125,110],[35,70],[60,190],[125,150]],[105,120,138,255]);polygon(img,[[125,110],[220,70],[195,190],[125,150]],[105,120,138,255]);}); icon('swag',img=>{fillRect(img,45,80,118,130,[14,16,20,255]);fillRect(img,138,80,211,130,[14,16,20,255]);line(img,118,102,138,102,6,[237,198,63,255]);}); icon('brain',img=>{ellipse(img,105,112,45,52,[102,196,216,255]);ellipse(img,155,118,43,50,[102,196,216,255]);line(img,128,80,128,185,7,[230,245,250,220]);}); const burst=image(128,128);for(let i=0;i<14;i+=1){const a=2*Math.PI*i/14;line(burst,64+Math.cos(a)*20,64+Math.sin(a)*20,64+Math.cos(a)*54,64+Math.sin(a)*54,4,[242,200,75,160]);}ellipse(burst,64,64,22,22,[255,230,115,210]);savePng(burst,resolve(ASSETS,'ui/tap_burst.png')); }
mkdirSync(ASSETS,{recursive:true}); generatePigeon(); generateWorld(); generateUi(); console.log(`Generated raster PNG texture pack at ${ASSETS}`);
