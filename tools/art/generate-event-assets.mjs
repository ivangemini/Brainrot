#!/usr/bin/env node
/** Deterministic raster-only Pigeon Event textures. Emits PNG only. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'public/assets/events');
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buffer) { let c=0xffffffff; for(const byte of buffer)c=crcTable[(c^byte)&0xff]^(c>>>8); return (c^0xffffffff)>>>0; }
function chunk(type,data){const t=Buffer.from(type),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out;}
function image(w,h){return {w,h,data:Buffer.alloc(w*h*4)};}
function blend(img,x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=img.w||y>=img.h||c[3]<=0)return;const i=(y*img.w+x)*4,sa=c[3]/255,da=img.data[i+3]/255,oa=sa+da*(1-sa);if(oa<=0)return;for(let k=0;k<3;k+=1)img.data[i+k]=Math.round((c[k]*sa+img.data[i+k]*da*(1-sa))/oa);img.data[i+3]=Math.round(oa*255);}
function ellipse(img,cx,cy,rx,ry,color){for(let y=Math.max(0,Math.floor(cy-ry));y<=Math.min(img.h-1,Math.ceil(cy+ry));y+=1)for(let x=Math.max(0,Math.floor(cx-rx));x<=Math.min(img.w-1,Math.ceil(cx+rx));x+=1){if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)blend(img,x,y,color);}}
function line(img,x0,y0,x1,y1,width,color){const steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let i=0;i<=steps;i+=1){const t=i/steps;ellipse(img,x0+(x1-x0)*t,y0+(y1-y0)*t,width/2,width/2,color);}}
function polygon(img,points,color){const ys=points.map(p=>p[1]),minY=Math.max(0,Math.floor(Math.min(...ys))),maxY=Math.min(img.h-1,Math.ceil(Math.max(...ys)));for(let y=minY;y<=maxY;y+=1){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const[xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y))xs.push(xi+(y-yi)*(xj-xi)/(yj-yi));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.ceil(xs[k]);x<=Math.floor(xs[k+1]);x+=1)blend(img,x,y,color);}}
function save(img,path){mkdirSync(dirname(path),{recursive:true});const stride=img.w*4,raw=Buffer.alloc((stride+1)*img.h);for(let y=0;y<img.h;y+=1){const d=y*(stride+1);raw[d]=0;img.data.copy(raw,d+1,y*stride,(y+1)*stride);}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(img.w,0);ihdr.writeUInt32BE(img.h,4);ihdr[8]=8;ihdr[9]=6;const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);writeFileSync(path,png);}
function bread(golden=false){
  const img=image(320,220);
  ellipse(img,160,123,118,66,golden?[238,190,48,255]:[204,139,72,255]);
  ellipse(img,160,108,105,54,golden?[255,220,88,255]:[232,174,99,255]);
  polygon(img,[[58,120],[262,120],[240,176],[82,176]],golden?[222,158,28,255]:[177,105,54,255]);
  for(const x of [105,150,195]) line(img,x,78,x-12,118,8,golden?[255,239,156,210]:[247,213,158,200]);
  ellipse(img,126,102,34,18,[255,255,255,golden?65:38]);
  if(golden){for(let a=0;a<12;a+=1){const r=a*Math.PI/6;line(img,160+Math.cos(r)*105,108+Math.sin(r)*70,160+Math.cos(r)*142,108+Math.sin(r)*95,4,[255,226,92,150]);}}
  return img;
}

save(bread(false),resolve(OUT,'bread_normal.png'));
save(bread(true),resolve(OUT,'bread_golden.png'));
console.log(`Generated Bread Rush raster textures at ${OUT}`);
