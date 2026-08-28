#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'public/assets/generated');
const SIZE = 512;

function image() {
  return { width: SIZE, height: SIZE, channels: 4, data: Buffer.alloc(SIZE * SIZE * 4) };
}

function blend(img, x, y, [r, g, b, a]) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || a <= 0) return;
  const i = (y * SIZE + x) * 4;
  const sa = a / 255;
  const da = img.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  img.data[i] = Math.round((r * sa + img.data[i] * da * (1 - sa)) / oa);
  img.data[i + 1] = Math.round((g * sa + img.data[i + 1] * da * (1 - sa)) / oa);
  img.data[i + 2] = Math.round((b * sa + img.data[i + 2] * da * (1 - sa)) / oa);
  img.data[i + 3] = Math.round(oa * 255);
}

function ellipse(img, cx, cy, rx, ry, rgba) {
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(SIZE - 1, Math.ceil(cy + ry)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(SIZE - 1, Math.ceil(cx + rx)); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) blend(img, x, y, rgba);
    }
  }
}

function rect(img, x0, y0, x1, y1, rgba) {
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(SIZE, Math.ceil(y1)); y += 1) {
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(SIZE, Math.ceil(x1)); x += 1) blend(img, x, y, rgba);
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
  const minY = Math.floor(Math.min(...points.map((point) => point[1])));
  const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
  for (let y = Math.max(0, minY); y <= Math.min(SIZE - 1, maxY); y += 1) {
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

async function save(img, name) {
  const path = resolve(OUT, name);
  mkdirSync(dirname(path), { recursive: true });
  await sharp(img.data, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(path);
}

async function targetAsset() {
  const img = image();
  ellipse(img, 256, 388, 210, 46, [0, 0, 0, 52]);
  rect(img, 76, 248, 436, 366, [43, 49, 58, 255]);
  polygon(img, [[126, 248], [178, 172], [340, 172], [392, 248]], [81, 100, 116, 255]);
  rect(img, 193, 190, 319, 238, [102, 199, 232, 185]);
  line(img, 256, 176, 256, 365, 5, [242, 200, 75, 220]);
  for (const [radius, alpha] of [[92, 80], [62, 125], [31, 235]]) {
    const ringWidth = 10;
    for (let r = radius; r < radius + ringWidth; r += 1) {
      for (let a = 0; a < Math.PI * 2; a += 0.012) {
        blend(img, 256 + Math.cos(a) * r, 255 + Math.sin(a) * r * 0.45, [242, 200, 75, alpha]);
      }
    }
  }
  ellipse(img, 140, 366, 48, 48, [25, 28, 34, 255]);
  ellipse(img, 372, 366, 48, 48, [25, 28, 34, 255]);
  ellipse(img, 140, 366, 22, 22, [115, 122, 128, 255]);
  ellipse(img, 372, 366, 22, 22, [115, 122, 128, 255]);
  await save(img, 'pigeon_drop_target.png');
}

async function projectileAsset() {
  const img = image();
  ellipse(img, 256, 264, 82, 112, [245, 241, 232, 245]);
  ellipse(img, 228, 222, 34, 44, [255, 255, 255, 92]);
  ellipse(img, 292, 294, 28, 38, [201, 193, 180, 118]);
  polygon(img, [[218, 346], [246, 410], [266, 345]], [245, 241, 232, 220]);
  polygon(img, [[268, 345], [302, 398], [300, 326]], [245, 241, 232, 190]);
  await save(img, 'pigeon_drop_projectile.png');
}

async function impactAsset() {
  const img = image();
  const points = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const radius = i % 2 === 0 ? 188 : 86;
    points.push([256 + Math.cos(angle) * radius, 256 + Math.sin(angle) * radius]);
  }
  polygon(img, points, [242, 200, 75, 215]);
  ellipse(img, 256, 256, 105, 78, [245, 241, 232, 245]);
  ellipse(img, 235, 235, 36, 28, [255, 255, 255, 125]);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    line(img, 256 + Math.cos(angle) * 122, 256 + Math.sin(angle) * 92,
      256 + Math.cos(angle) * 210, 256 + Math.sin(angle) * 174, 4, [243, 106, 98, 165]);
  }
  await save(img, 'pigeon_drop_impact.png');
}

await targetAsset();
await projectileAsset();
await impactAsset();
console.log(`Generated Pigeon Drop raster assets at ${OUT}`);
