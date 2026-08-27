#!/usr/bin/env node
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
function image(w, h) { return { w, h, data: Buffer.alloc(w * h * 4) }; }
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
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}
function clamp(v, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, v)); }
function setPixel(img, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4;
  const sa = rgba[3] / 255;
  const da = img.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  for (let c = 0; c < 3; c += 1) img.data[i + c] = Math.round((rgba[c] * sa + img.data[i + c] * da * (1 - sa)) / oa);
  img.data[i + 3] = Math.round(oa * 255);
}
function fillRect(img, x0, y0, x1, y1, rgba) {
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(img.h, Math.ceil(y1)); y += 1)
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(img.w, Math.ceil(x1)); x += 1) setPixel(img, x, y, rgba);
}
function ellipse(img, cx, cy, rx, ry, rgba) {
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(img.h - 1, Math.ceil(cy + ry)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(img.w - 1, Math.ceil(cx + rx)); x += 1) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) setPixel(img, x, y, rgba);
    }
  }
}
function line(img, x0, y0, x1, y1, width, rgba, mask) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    for (let y = Math.floor(cy - width); y <= Math.ceil(cy + width); y += 1)
      for (let x = Math.floor(cx - width); x <= Math.ceil(cx + width); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > width ** 2) continue;
        if (!mask || mask(x, y)) setPixel(img, x, y, rgba);
      }
  }
}
function polygon(img, points, rgba) {
  const ys = points.map((p) => p[1]);
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(img.h - 1, Math.ceil(Math.max(...ys))); y += 1) {
    const xs = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + (y - yi) * (xj - xi) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x += 1) setPixel(img, x, y, rgba);
  }
}
function rng(seed) { let s = seed >>> 0; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
function bodyMask(x, y, cx, cy, rx, ry) { return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; }

function bodyTexture(tier, cx, cy, rx, ry) {
  const img = image(768, 768);
  const rand = rng(900 + tier);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const edge = Math.min(1, (1 - d) * 9);
      const light = 30 * (1 - Math.sqrt((nx + 0.34) ** 2 + (ny + 0.38) ** 2) / 1.6);
      const lower = Math.max(0, ny) * -24;
      const noise = (rand() - 0.5) * 18;
      const base = 84 + tier * 3;
      setPixel(img, x, y, [clamp(base + light + lower + noise), clamp(base + 12 + light + lower + noise), clamp(base + 28 + light + lower + noise), Math.round(255 * edge)]);
    }
  }
  const mask = (x, y) => bodyMask(x, y, cx, cy, rx, ry);
  for (let row = 0; row < 12; row += 1) {
    const yy = cy - ry * 0.55 + row * (ry * 0.105);
    const stagger = row % 2 ? 11 : 0;
    for (let col = -8; col <= 8; col += 1) {
      const xx = cx + col * 23 + stagger;
      if (!mask(xx, yy)) continue;
      line(img, xx - 10, yy, xx, yy + 7, 1.4, [34, 45, 58, 58], mask);
      line(img, xx, yy + 7, xx + 10, yy, 1.4, [34, 45, 58, 58], mask);
    }
  }
  ellipse(img, cx - rx * 0.28, cy - ry * 0.3, rx * 0.22, ry * 0.3, [185, 204, 216, 18]);
  savePng(img, resolve(ASSETS, `pigeon/body_t${tier}.png`));
}

function generatePigeon() {
  bodyTexture(1, 400, 495, 176, 196);
  bodyTexture(2, 400, 486, 212, 216);
  bodyTexture(3, 398, 478, 246, 234);

  const head = image(768, 768);
  const rand = rng(77);
  for (let y = 190; y < 480; y += 1) for (let x = 270; x < 520; x += 1) {
    const neckD = ((x - 388) / 104) ** 2 + ((y - 395) / 125) ** 2;
    const headD = ((x - 390) / 112) ** 2 + ((y - 292) / 113) ** 2;
    if (neckD > 1 && headD > 1) continue;
    const d = Math.min(neckD, headD);
    const edge = Math.min(1, (1 - d) * 10);
    const n = (rand() - 0.5) * 14;
    const irid = Math.max(0, 1 - Math.abs(y - 388) / 105);
    const green = irid * Math.max(0, 1 - Math.abs(x - 352) / 105);
    const purple = irid * Math.max(0, 1 - Math.abs(x - 438) / 105);
    setPixel(head, x, y, [clamp(91 + n + purple * 26), clamp(104 + n + green * 48), clamp(117 + n + purple * 48 + green * 8), Math.round(255 * edge)]);
  }
  ellipse(head, 354, 245, 42, 32, [220, 230, 232, 22]);
  for (let i = 0; i < 40; i += 1) {
    const x = 305 + rand() * 165, y = 330 + rand() * 105;
    line(head, x - 4, y, x + 5, y + 2, 1, [235, 245, 240, 42]);
  }
  savePng(head, resolve(ASSETS, 'pigeon/head.png'));

  for (let tier = 1; tier <= 3; tier += 1) {
    const wing = image(768, 768);
    const extra = (tier - 1) * 22;
    polygon(wing, [[235,345],[112-extra,405],[154-extra,600+extra],[310,520]], [64,77,94,248]);
    for (let i = 0; i < 9 + tier * 2; i += 1) {
      const yy = 392 + i * 18;
      line(wing, 135 - extra * 0.5, yy, 285, yy + 46, 5.5, [126,143,160,135]);
      line(wing, 145 - extra * 0.5, yy + 6, 277, yy + 46, 2.2, [213,222,225,72]);
    }
    savePng(wing, resolve(ASSETS, `pigeon/wing_t${tier}.png`));
  }

  const eyes = image(768, 768);
  ellipse(eyes, 420, 255, 18, 18, [244,238,213,255]);
  ellipse(eyes, 424, 257, 9, 11, [20,20,22,255]);
  ellipse(eyes, 421, 252, 3.5, 3.5, [255,255,255,255]);
  line(eyes, 397, 237, 436, 231, 4.5, [35,38,44,240]);
  savePng(eyes, resolve(ASSETS, 'pigeon/eyes.png'));

  for (let tier = 1; tier <= 3; tier += 1) {
    const beak = image(768, 768);
    const tip = 545 + tier * 24;
    polygon(beak, [[448,270],[tip,299],[449,333]], [220 + tier * 6, 145 + tier * 10, 70 - tier * 3,255]);
    line(beak, 454, 302, tip - 8, 300, 2, [105,66,34,165]);
    ellipse(beak, 475, 289, 6, 4, [72,48,31,190]);
    savePng(beak, resolve(ASSETS, `pigeon/beak_t${tier}.png`));
  }

  const legs = image(768,768);
  for (const x of [319, 420]) {
    line(legs,x,616,x,698,8,[198,92,81,255]);
    line(legs,x,696,x-28,728,5,[198,92,81,255]);
    line(legs,x,696,x+32,726,5,[198,92,81,255]);
    line(legs,x,697,x+2,734,4,[198,92,81,240]);
    for (let y=628;y<694;y+=12) line(legs,x-6,y,x+6,y,1,[238,142,123,110]);
  }
  savePng(legs, resolve(ASSETS,'pigeon/legs.png'));

  const shadow = image(768,768);
  for (let r=1;r<=28;r+=1) ellipse(shadow,382,704,215+r,38+r*0.42,[0,0,0,Math.max(1,5-r*0.13)]);
  ellipse(shadow,382,704,196,31,[0,0,0,60]);
  savePng(shadow, resolve(ASSETS,'pigeon/shadow.png'));
}

function generateWorld() {
  const img = image(1600,1000);
  const rand = rng(450);
  for (let y=0;y<1000;y+=1) {
    let c;
    if (y < 620) {
      const t=y/620;
      c=[194-20*t,219-14*t,229-8*t,255];
    } else if (y < 790) {
      const t=(y-620)/170;
      c=[108+8*t,145+10*t,91+4*t,255];
    } else {
      const t=(y-790)/210;
      c=[197-18*t,185-16*t,157-12*t,255];
    }
    fillRect(img,0,y,1600,y+1,c);
  }

  const buildings = [
    [245,155,350,470],[370,192,500,470],[522,98,610,470],[635,155,730,470],[748,75,825,470],[850,136,942,470],[975,108,1065,470],[1100,220,1194,470],[1230,156,1334,470],[1365,105,1485,470],
  ];
  buildings.forEach(([x0,y0,x1,y1], bi) => {
    fillRect(img,x0,y0,x1,y1,[118+bi%3*7,137+bi%2*7,145+bi%4*4,118]);
    for (let y=y0+28;y<y1-20;y+=42) for (let x=x0+18;x<x1-12;x+=28) {
      if (rand()<0.42) fillRect(img,x,y,x+11,y+17,[226,232,218,40+Math.floor(rand()*38)]);
    }
  });

  for (const tx of [68,230,1325,1510]) {
    fillRect(img,tx-13,350,tx+17,655,[81,61,43,255]);
    for (let i=0;i<42;i+=1) {
      const a=rand()*Math.PI*2, r=Math.sqrt(rand())*125;
      const cx=tx+Math.cos(a)*r, cy=340+Math.sin(a)*r*0.72;
      const shade=rand()*30;
      ellipse(img,cx,cy,40+rand()*28,32+rand()*20,[clamp(64+shade),clamp(116+shade*0.7),clamp(73+shade*0.4),185+rand()*55]);
    }
  }

  for (let i=0;i<9500;i+=1) {
    const x=Math.floor(rand()*1600), y=620+Math.floor(rand()*190);
    const g=rand()<0.5 ? [69,113,62,28] : [165,177,103,22];
    setPixel(img,x,y,g);
  }
  for (let i=0;i<6500;i+=1) {
    const x=Math.floor(rand()*1600), y=790+Math.floor(rand()*210);
    const v=(rand()-0.5)*22;
    setPixel(img,x,y,[clamp(185+v),clamp(171+v),clamp(144+v),35]);
  }

  fillRect(img,440,632,940,676,[116,68,41,255]);
  fillRect(img,457,690,925,735,[126,76,45,255]);
  for (let x=455;x<935;x+=13) line(img,x,635,x+40,674,1,[211,143,77,42]);
  for (let x=470;x<915;x+=17) line(img,x,692,x+35,731,1,[207,139,72,38]);
  fillRect(img,486,676,511,846,[59,50,44,255]);
  fillRect(img,871,676,896,818,[59,50,44,255]);

  fillRect(img,1190,360,1208,704,[50,56,61,255]);
  ellipse(img,1199,348,42,38,[246,234,194,210]);
  ellipse(img,1199,348,24,20,[255,247,213,120]);

  for (let y=0;y<1000;y+=1) for (let x=0;x<1600;x+=1) {
    const dx=(x-800)/800, dy=(y-500)/500;
    const vignette=Math.max(0,(dx*dx+dy*dy-0.6))*16;
    if (vignette>0) setPixel(img,x,y,[20,24,28,Math.min(30,Math.round(vignette))]);
  }
  savePng(img, resolve(ASSETS,'world/park_bg.png'));
}

generatePigeon();
generateWorld();
console.log(`Refined raster production textures at ${ASSETS}`);
