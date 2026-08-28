#!/usr/bin/env node
/** Deterministic raster mutation treatment generator. Runtime consumes PNGs only. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'public/assets/generated');
const W = 1600;
const H = 1000;

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
function image() { return { w: W, h: H, data: Buffer.alloc(W * H * 4) }; }
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
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}
function blend(img, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || rgba[3] <= 0) return;
  const i = (y * img.w + x) * 4;
  const sa = rgba[3] / 255;
  const da = img.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  for (let c = 0; c < 3; c += 1) {
    img.data[i + c] = Math.round((rgba[c] * sa + img.data[i + c] * da * (1 - sa)) / oa);
  }
  img.data[i + 3] = Math.round(oa * 255);
}
function ellipse(img, cx, cy, rx, ry, rgba) {
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(img.h - 1, Math.ceil(cy + ry)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(img.w - 1, Math.ceil(cx + rx)); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) blend(img, x, y, rgba);
    }
  }
}
function ring(img, cx, cy, rx, ry, thickness, rgba) {
  const outerRx = rx + thickness;
  const outerRy = ry + thickness;
  for (let y = Math.max(0, Math.floor(cy - outerRy)); y <= Math.min(img.h - 1, Math.ceil(cy + outerRy)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - outerRx)); x <= Math.min(img.w - 1, Math.ceil(cx + outerRx)); x += 1) {
      const outer = ((x - cx) / outerRx) ** 2 + ((y - cy) / outerRy) ** 2;
      const inner = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (outer <= 1 && inner >= 1) blend(img, x, y, rgba);
    }
  }
}
function line(img, x0, y0, x1, y1, width, rgba) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    ellipse(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width, width, rgba);
  }
}
function polygon(img, points, rgba) {
  const ys = points.map((point) => point[1]);
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(img.h - 1, Math.ceil(Math.max(...ys))); y += 1) {
    const xs = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + (y - yi) * (xj - xi) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x += 1) blend(img, x, y, rgba);
    }
  }
}
function glow(img, cx, cy, rx, ry, rgba, layers = 14) {
  for (let i = layers; i >= 1; i -= 1) {
    const t = i / layers;
    ring(img, cx, cy, rx + i * 5, ry + i * 4, 6, [rgba[0], rgba[1], rgba[2], Math.round(rgba[3] * (1 - t * 0.7) / layers * 2.4)]);
  }
}

function muscle() {
  const img = image();
  glow(img, 815, 525, 330, 370, [243, 106, 98, 180], 18);
  ring(img, 815, 525, 320, 360, 12, [242, 200, 75, 118]);
  line(img, 520, 515, 610, 430, 18, [243, 106, 98, 158]);
  line(img, 1010, 430, 1115, 515, 18, [243, 106, 98, 158]);
  line(img, 570, 390, 625, 335, 11, [242, 200, 75, 175]);
  line(img, 1040, 335, 1095, 390, 11, [242, 200, 75, 175]);
  ellipse(img, 815, 690, 245, 52, [0, 0, 0, 44]);
  savePng(img, resolve(OUT, 'mutation_muscle.png'));
}

function business() {
  const img = image();
  glow(img, 815, 530, 318, 360, [102, 199, 232, 132], 14);
  polygon(img, [[610, 545], [740, 500], [800, 770], [650, 748]], [22, 27, 34, 148]);
  polygon(img, [[1025, 545], [890, 500], [832, 770], [985, 748]], [22, 27, 34, 148]);
  polygon(img, [[782, 500], [850, 500], [830, 705], [808, 746], [786, 705]], [242, 200, 75, 210]);
  ring(img, 816, 516, 305, 350, 8, [102, 199, 232, 96]);
  polygon(img, [[1045, 620], [1160, 610], [1185, 720], [1065, 732]], [35, 38, 44, 210]);
  line(img, 1083, 614, 1132, 608, 7, [242, 200, 75, 170]);
  savePng(img, resolve(OUT, 'mutation_business.png'));
}

function chaos() {
  const img = image();
  glow(img, 815, 525, 332, 374, [143, 92, 244, 190], 22);
  ring(img, 800, 515, 332, 372, 10, [102, 199, 232, 112]);
  ring(img, 832, 535, 318, 356, 8, [243, 106, 98, 104]);
  const shards = [
    [[480, 420], [560, 390], [520, 505]],
    [[1090, 355], [1165, 405], [1080, 455]],
    [[500, 695], [575, 645], [555, 760]],
    [[1080, 690], [1160, 650], [1135, 770]],
  ];
  shards.forEach((points, index) => polygon(img, points, index % 2 === 0 ? [102, 199, 232, 155] : [243, 106, 98, 155]));
  line(img, 570, 330, 610, 385, 7, [242, 200, 75, 175]);
  line(img, 610, 385, 575, 430, 7, [143, 92, 244, 195]);
  line(img, 1070, 520, 1110, 565, 7, [143, 92, 244, 195]);
  line(img, 1110, 565, 1075, 615, 7, [102, 199, 232, 185]);
  savePng(img, resolve(OUT, 'mutation_chaos.png'));
}

muscle();
business();
chaos();
console.log(`Generated raster mutation treatments at ${OUT}`);
