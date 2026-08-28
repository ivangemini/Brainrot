#!/usr/bin/env node
/**
 * Deterministic generated-raster Growth scenes for major Total Level milestones.
 * Runtime consumes the emitted PNGs only; no vector/SVG asset is produced.
 */
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

function image() {
  return { w: W, h: H, data: Buffer.alloc(W * H * 4) };
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

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t));
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function blend(img, x, y, rgba) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || rgba[3] <= 0) return;
  const i = (y * img.w + x) * 4;
  const sa = rgba[3] / 255;
  const da = img.data[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;
  for (let c = 0; c < 3; c += 1) {
    img.data[i + c] = Math.round((rgba[c] * sa + img.data[i + c] * da * (1 - sa)) / outA);
  }
  img.data[i + 3] = Math.round(outA * 255);
}

function fillRect(img, x0, y0, x1, y1, rgba) {
  const left = Math.max(0, Math.floor(x0));
  const right = Math.min(img.w, Math.ceil(x1));
  const top = Math.max(0, Math.floor(y0));
  const bottom = Math.min(img.h, Math.ceil(y1));
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) blend(img, x, y, rgba);
  }
}

function ellipse(img, cx, cy, rx, ry, rgba) {
  const left = Math.max(0, Math.floor(cx - rx));
  const right = Math.min(img.w - 1, Math.ceil(cx + rx));
  const top = Math.max(0, Math.floor(cy - ry));
  const bottom = Math.min(img.h - 1, Math.ceil(cy + ry));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) blend(img, x, y, rgba);
    }
  }
}

function texturedEllipse(img, cx, cy, rx, ry, base, seed, highlight = [36, 40, 48]) {
  const rand = rng(seed);
  const left = Math.max(0, Math.floor(cx - rx));
  const right = Math.min(img.w - 1, Math.ceil(cx + rx));
  const top = Math.max(0, Math.floor(cy - ry));
  const bottom = Math.min(img.h - 1, Math.ceil(cy + ry));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const edge = Math.min(1, (1 - d) * 10);
      const directional = clamp((0.58 - nx * 0.32 - ny * 0.22) * 0.9, 0, 1);
      const noise = (rand() - 0.5) * 16;
      const color = [
        clamp(base[0] + highlight[0] * directional + noise),
        clamp(base[1] + highlight[1] * directional + noise),
        clamp(base[2] + highlight[2] * directional + noise),
        Math.round(255 * edge),
      ];
      blend(img, x, y, color);
    }
  }
}

function line(img, x0, y0, x1, y1, width, rgba) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    ellipse(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width, width, rgba);
  }
}

function polygon(img, points, rgba) {
  const ys = points.map((point) => point[1]);
  const top = Math.max(0, Math.floor(Math.min(...ys)));
  const bottom = Math.min(img.h - 1, Math.ceil(Math.max(...ys)));
  for (let y = top; y <= bottom; y += 1) {
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

function paintSky(img, topColor, bottomColor, horizonY, seed) {
  for (let y = 0; y < horizonY; y += 1) {
    const t = y / Math.max(1, horizonY - 1);
    const color = mix(topColor, bottomColor, t);
    fillRect(img, 0, y, W, y + 1, [...color, 255]);
  }
  const rand = rng(seed);
  for (let i = 0; i < 1600; i += 1) {
    const x = rand() * W;
    const y = rand() * horizonY;
    blend(img, x, y, [255, 255, 255, 8 + Math.floor(rand() * 12)]);
  }
}

function drawCloud(img, cx, cy, scale, alpha = 70) {
  ellipse(img, cx - 55 * scale, cy + 4 * scale, 75 * scale, 30 * scale, [245, 247, 247, alpha]);
  ellipse(img, cx, cy - 10 * scale, 90 * scale, 42 * scale, [250, 252, 252, alpha]);
  ellipse(img, cx + 66 * scale, cy + 5 * scale, 66 * scale, 29 * scale, [245, 247, 247, alpha]);
}

function drawBuilding(img, x, groundY, width, height, palette, seed, alpha = 255) {
  const rand = rng(seed);
  const top = groundY - height;
  fillRect(img, x, top, x + width, groundY, [...palette, alpha]);
  fillRect(img, x + width * 0.08, top, x + width * 0.14, groundY, [255, 255, 255, Math.round(alpha * 0.06)]);
  const cols = Math.max(2, Math.floor(width / 34));
  const rows = Math.max(2, Math.floor(height / 44));
  const gapX = width / (cols + 1);
  const gapY = height / (rows + 1);
  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      if (rand() < 0.3) continue;
      const wx = x + col * gapX - 5;
      const wy = top + row * gapY - 7;
      const lit = rand() < 0.32;
      fillRect(
        img,
        wx,
        wy,
        wx + 10,
        wy + 14,
        lit ? [244, 217, 143, Math.round(alpha * 0.62)] : [94, 142, 163, Math.round(alpha * 0.34)],
      );
    }
  }
}

function drawCar(img, cx, groundY, scale, bodyColor) {
  ellipse(img, cx - 62 * scale, groundY, 25 * scale, 25 * scale, [31, 34, 38, 255]);
  ellipse(img, cx + 62 * scale, groundY, 25 * scale, 25 * scale, [31, 34, 38, 255]);
  ellipse(img, cx - 62 * scale, groundY, 12 * scale, 12 * scale, [150, 155, 160, 210]);
  ellipse(img, cx + 62 * scale, groundY, 12 * scale, 12 * scale, [150, 155, 160, 210]);
  polygon(img, [
    [cx - 110 * scale, groundY - 18 * scale],
    [cx - 78 * scale, groundY - 70 * scale],
    [cx + 58 * scale, groundY - 78 * scale],
    [cx + 116 * scale, groundY - 26 * scale],
    [cx + 106 * scale, groundY - 7 * scale],
    [cx - 108 * scale, groundY - 7 * scale],
  ], [...bodyColor, 255]);
  polygon(img, [
    [cx - 55 * scale, groundY - 66 * scale],
    [cx - 25 * scale, groundY - 104 * scale],
    [cx + 45 * scale, groundY - 104 * scale],
    [cx + 72 * scale, groundY - 72 * scale],
  ], [108, 147, 167, 205]);
}

function drawHuman(img, x, groundY, scale, coat = [54, 61, 72]) {
  ellipse(img, x, groundY - 82 * scale, 13 * scale, 14 * scale, [190, 148, 118, 255]);
  line(img, x, groundY - 68 * scale, x, groundY - 25 * scale, 10 * scale, [...coat, 255]);
  line(img, x - 2 * scale, groundY - 54 * scale, x - 23 * scale, groundY - 34 * scale, 5 * scale, [...coat, 255]);
  line(img, x + 2 * scale, groundY - 54 * scale, x + 25 * scale, groundY - 72 * scale, 5 * scale, [...coat, 255]);
  line(img, x, groundY - 25 * scale, x - 14 * scale, groundY, 5 * scale, [38, 42, 49, 255]);
  line(img, x, groundY - 25 * scale, x + 15 * scale, groundY, 5 * scale, [38, 42, 49, 255]);
}

function drawPigeon(img, cfg) {
  const {
    stage,
    bodyX,
    bodyY,
    bodyRx,
    bodyRy,
    headX,
    headY,
    headRx,
    headRy,
    neckRx,
    neckRy,
    legVisible,
  } = cfg;

  ellipse(img, bodyX, bodyY + bodyRy * 0.93, bodyRx * 0.88, bodyRy * 0.12, [0, 0, 0, 65]);

  const wingColor = [55 + stage * 2, 69 + stage * 2, 88 + stage * 2];
  polygon(img, [
    [bodyX - bodyRx * 0.55, bodyY - bodyRy * 0.38],
    [bodyX - bodyRx * 1.02, bodyY - bodyRy * 0.02],
    [bodyX - bodyRx * 0.72, bodyY + bodyRy * 0.58],
    [bodyX - bodyRx * 0.16, bodyY + bodyRy * 0.32],
  ], [...wingColor, 244]);
  polygon(img, [
    [bodyX + bodyRx * 0.46, bodyY - bodyRy * 0.36],
    [bodyX + bodyRx * 0.95, bodyY - bodyRy * 0.02],
    [bodyX + bodyRx * 0.68, bodyY + bodyRy * 0.56],
    [bodyX + bodyRx * 0.12, bodyY + bodyRy * 0.3],
  ], [...wingColor, 238]);

  texturedEllipse(
    img,
    bodyX,
    bodyY,
    bodyRx,
    bodyRy,
    [73 + stage * 2, 82 + stage * 2, 102 + stage * 2],
    1800 + stage,
    [48, 48, 54],
  );

  const chestGlow = Math.min(52, 22 + stage * 5);
  ellipse(
    img,
    bodyX - bodyRx * 0.18,
    bodyY - bodyRy * 0.18,
    bodyRx * 0.4,
    bodyRy * 0.42,
    [204, 217, 220, chestGlow],
  );

  for (let row = 0; row < 14; row += 1) {
    const y = bodyY - bodyRy * 0.55 + row * bodyRy * 0.085;
    const spread = bodyRx * (0.55 + row * 0.018);
    const count = 7 + Math.floor(stage / 2);
    for (let col = -count; col <= count; col += 1) {
      const x = bodyX + (col / count) * spread * 0.86 + (row % 2 ? 7 : 0);
      line(img, x - 8, y, x, y + 7, 1.2, [28, 35, 47, 55]);
      line(img, x, y + 7, x + 8, y, 1.2, [224, 229, 228, 28]);
    }
  }

  texturedEllipse(
    img,
    headX - 8,
    headY + neckRy * 0.68,
    neckRx,
    neckRy,
    [73, 98, 106],
    2700 + stage,
    [42, 62, 64],
  );
  ellipse(img, headX - neckRx * 0.35, headY + neckRy * 0.7, neckRx * 0.52, neckRy * 0.48, [39, 150, 133, 72]);
  ellipse(img, headX + neckRx * 0.3, headY + neckRy * 0.72, neckRx * 0.48, neckRy * 0.46, [120, 76, 176, 60]);

  texturedEllipse(
    img,
    headX,
    headY,
    headRx,
    headRy,
    [80 + stage, 92 + stage, 108 + stage],
    3300 + stage,
    [44, 47, 51],
  );

  const eyeScale = 1 + stage * 0.025;
  ellipse(img, headX + headRx * 0.32, headY - headRy * 0.24, 20 * eyeScale, 20 * eyeScale, [239, 233, 210, 255]);
  ellipse(img, headX + headRx * 0.35, headY - headRy * 0.22, 10 * eyeScale, 11 * eyeScale, [17, 20, 24, 255]);
  ellipse(img, headX + headRx * 0.31, headY - headRy * 0.28, 3.5 * eyeScale, 3.5 * eyeScale, [255, 255, 255, 250]);
  line(
    img,
    headX + headRx * 0.13,
    headY - headRy * 0.42,
    headX + headRx * 0.48,
    headY - headRy * 0.48,
    4 + stage * 0.35,
    [28, 31, 38, 220],
  );

  const beakLength = headRx * (0.86 + stage * 0.025);
  polygon(img, [
    [headX + headRx * 0.68, headY - headRy * 0.03],
    [headX + headRx * 0.68 + beakLength, headY + headRy * 0.12],
    [headX + headRx * 0.68, headY + headRy * 0.3],
  ], [225, 156 + stage * 3, 65, 255]);
  line(
    img,
    headX + headRx * 0.74,
    headY + headRy * 0.13,
    headX + headRx * 0.68 + beakLength * 0.92,
    headY + headRy * 0.13,
    2.5,
    [97, 62, 34, 170],
  );

  if (legVisible) {
    const legScale = 1 + stage * 0.035;
    for (const offset of [-bodyRx * 0.24, bodyRx * 0.22]) {
      const x = bodyX + offset;
      const knee = bodyY + bodyRy * 0.73;
      const footY = Math.min(H - 32, bodyY + bodyRy * 1.03);
      line(img, x, knee, x, footY - 22, 8 * legScale, [187, 87, 80, 255]);
      line(img, x, footY - 22, x - 30 * legScale, footY, 5 * legScale, [187, 87, 80, 255]);
      line(img, x, footY - 22, x + 33 * legScale, footY - 2, 5 * legScale, [187, 87, 80, 255]);
    }
  }
}

function vignette(img, strength = 38) {
  for (let y = 0; y < H; y += 1) {
    const ny = (y - H / 2) / (H / 2);
    for (let x = 0; x < W; x += 2) {
      const nx = (x - W / 2) / (W / 2);
      const d = nx * nx + ny * ny;
      if (d < 0.65) continue;
      const alpha = Math.min(strength, Math.round((d - 0.65) * strength));
      blend(img, x, y, [17, 20, 25, alpha]);
      blend(img, x + 1, y, [17, 20, 25, alpha]);
    }
  }
}

function stage4Human() {
  const img = image();
  paintSky(img, [166, 205, 224], [218, 226, 217], 610, 4104);
  drawCloud(img, 245, 170, 0.9, 62);
  drawCloud(img, 1330, 220, 0.7, 52);
  fillRect(img, 0, 610, W, H, [92, 132, 77, 255]);
  fillRect(img, 0, 790, W, H, [189, 178, 151, 255]);
  const rand = rng(4404);
  for (let i = 0; i < 7200; i += 1) {
    const x = rand() * W;
    const y = 610 + rand() * 195;
    blend(img, x, y, [70 + rand() * 35, 112 + rand() * 35, 64 + rand() * 25, 32]);
  }
  drawBuilding(img, 80, 610, 175, 310, [112, 126, 136], 411, 105);
  drawBuilding(img, 1320, 610, 190, 380, [117, 130, 142], 412, 105);

  fillRect(img, 95, 690, 505, 720, [116, 71, 42, 255]);
  fillRect(img, 112, 746, 480, 776, [129, 79, 47, 255]);
  fillRect(img, 135, 720, 155, 850, [58, 51, 46, 255]);
  fillRect(img, 445, 760, 465, 850, [58, 51, 46, 255]);
  line(img, 265, 692, 300, 756, 5, [75, 53, 42, 160]);
  line(img, 300, 756, 334, 695, 5, [75, 53, 42, 160]);

  drawPigeon(img, {
    stage: 4,
    bodyX: 805,
    bodyY: 585,
    bodyRx: 255,
    bodyRy: 325,
    headX: 845,
    headY: 275,
    headRx: 116,
    headRy: 112,
    neckRx: 106,
    neckRy: 142,
    legVisible: true,
  });

  drawHuman(img, 1190, 830, 1.05, [47, 65, 83]);
  drawHuman(img, 1280, 828, 0.95, [88, 68, 60]);
  line(img, 1432, 550, 1432, 835, 9, [55, 62, 68, 255]);
  ellipse(img, 1432, 533, 33, 27, [243, 231, 195, 220]);
  vignette(img, 34);
  savePng(img, resolve(OUT, 'growth_stage_04_human.png'));
}

function stage5Car() {
  const img = image();
  paintSky(img, [154, 194, 216], [213, 222, 219], 600, 5105);
  drawCloud(img, 330, 145, 0.8, 55);
  drawCloud(img, 1290, 180, 0.72, 52);
  const skyline = [
    [40, 600, 165, 330, [106, 124, 138]],
    [185, 600, 135, 405, [116, 127, 136]],
    [1270, 600, 125, 380, [104, 119, 132]],
    [1410, 600, 150, 445, [115, 126, 139]],
  ];
  skyline.forEach(([x, ground, width, height, color], index) => drawBuilding(img, x, ground, width, height, color, 520 + index, 150));
  fillRect(img, 0, 600, W, H, [77, 81, 86, 255]);
  fillRect(img, 0, 690, W, 720, [213, 207, 185, 155]);
  fillRect(img, 0, 820, W, 838, [213, 207, 185, 155]);
  for (let x = 0; x < W; x += 150) fillRect(img, x + 24, 755, x + 104, 766, [234, 216, 121, 220]);

  drawPigeon(img, {
    stage: 5,
    bodyX: 805,
    bodyY: 565,
    bodyRx: 300,
    bodyRy: 350,
    headX: 850,
    headY: 240,
    headRx: 132,
    headRy: 125,
    neckRx: 122,
    neckRy: 156,
    legVisible: true,
  });

  drawCar(img, 270, 855, 0.82, [179, 70, 63]);
  drawCar(img, 1320, 870, 0.9, [68, 115, 168]);
  line(img, 112, 470, 112, 785, 9, [48, 55, 61, 255]);
  polygon(img, [[105, 465], [172, 486], [165, 555], [105, 537]], [54, 60, 64, 255]);
  ellipse(img, 135, 505, 19, 19, [239, 84, 72, 210]);
  line(img, 118, 770, 162, 835, 6, [54, 58, 64, 230]);
  vignette(img, 36);
  savePng(img, resolve(OUT, 'growth_stage_05_car.png'));
}

function stage6Building() {
  const img = image();
  paintSky(img, [133, 179, 207], [218, 222, 210], 735, 6106);
  drawCloud(img, 245, 190, 1.0, 72);
  drawCloud(img, 1290, 260, 0.8, 64);
  drawCloud(img, 1040, 120, 0.55, 50);

  const rand = rng(6606);
  for (let i = 0; i < 17; i += 1) {
    const width = 65 + rand() * 80;
    const height = 180 + rand() * 270;
    const x = i * 105 - 15 + rand() * 22;
    drawBuilding(img, x, 770, width, height, [84 + rand() * 30, 102 + rand() * 28, 118 + rand() * 28], 6400 + i, 170);
  }

  drawPigeon(img, {
    stage: 6,
    bodyX: 805,
    bodyY: 560,
    bodyRx: 350,
    bodyRy: 410,
    headX: 855,
    headY: 195,
    headRx: 148,
    headRy: 142,
    neckRx: 136,
    neckRy: 176,
    legVisible: false,
  });

  for (let i = 0; i < 9; i += 1) {
    const width = 95 + rand() * 90;
    const height = 175 + rand() * 250;
    const x = i * 205 - 40 + rand() * 55;
    drawBuilding(img, x, H, width, height, [48 + rand() * 28, 61 + rand() * 27, 76 + rand() * 24], 6800 + i, 255);
  }
  line(img, 1340, 310, 1390, 300, 5, [43, 48, 55, 220]);
  line(img, 1390, 300, 1440, 315, 4, [43, 48, 55, 220]);
  ellipse(img, 1392, 303, 18, 8, [53, 61, 67, 240]);
  line(img, 1392, 300, 1392, 278, 3, [48, 55, 60, 220]);
  vignette(img, 40);
  savePng(img, resolve(OUT, 'growth_stage_06_building.png'));
}

function stage7Mega() {
  const img = image();
  paintSky(img, [111, 158, 191], [199, 215, 217], 810, 7107);
  drawCloud(img, 255, 255, 1.2, 88);
  drawCloud(img, 1265, 220, 1.05, 85);
  drawCloud(img, 920, 430, 0.72, 54);
  drawCloud(img, 640, 150, 0.58, 44);

  const rand = rng(7707);
  for (let i = 0; i < 23; i += 1) {
    const width = 45 + rand() * 65;
    const height = 120 + rand() * 340;
    drawBuilding(img, i * 76 - 20, 835, width, height, [78 + rand() * 27, 95 + rand() * 27, 112 + rand() * 24], 7300 + i, 120);
  }

  drawPigeon(img, {
    stage: 7,
    bodyX: 800,
    bodyY: 575,
    bodyRx: 395,
    bodyRy: 455,
    headX: 855,
    headY: 160,
    headRx: 168,
    headRy: 160,
    neckRx: 153,
    neckRy: 195,
    legVisible: false,
  });

  for (let i = 0; i < 13; i += 1) {
    const width = 75 + rand() * 100;
    const height = 110 + rand() * 300;
    const x = i * 135 - 30 + rand() * 40;
    drawBuilding(img, x, H, width, height, [38 + rand() * 25, 51 + rand() * 22, 67 + rand() * 23], 7600 + i, 245);
  }

  for (const [x, y, direction] of [[210, 330, 1], [1375, 390, -1], [1190, 170, -1]]) {
    ellipse(img, x, y, 22, 8, [49, 57, 64, 225]);
    line(img, x - 38, y - 3, x + 38, y - 3, 2.5, [45, 52, 59, 210]);
    line(img, x + direction * 9, y + 1, x + direction * 26, y + 13, 3, [45, 52, 59, 210]);
  }
  vignette(img, 42);
  savePng(img, resolve(OUT, 'growth_stage_07_mega.png'));
}

function stage8City() {
  const img = image();
  paintSky(img, [79, 119, 158], [177, 199, 208], 830, 8108);
  ellipse(img, 1320, 145, 74, 74, [248, 224, 165, 118]);
  drawCloud(img, 280, 250, 1.15, 72);
  drawCloud(img, 1240, 335, 0.9, 66);
  drawCloud(img, 910, 110, 0.62, 42);

  const rand = rng(8808);
  for (let i = 0; i < 26; i += 1) {
    const width = 45 + rand() * 62;
    const height = 90 + rand() * 330;
    drawBuilding(img, i * 68 - 25, 850, width, height, [63 + rand() * 26, 81 + rand() * 28, 100 + rand() * 28], 8200 + i, 105);
  }

  drawPigeon(img, {
    stage: 8,
    bodyX: 800,
    bodyY: 585,
    bodyRx: 438,
    bodyRy: 505,
    headX: 860,
    headY: 125,
    headRx: 190,
    headRy: 180,
    neckRx: 176,
    neckRy: 215,
    legVisible: false,
  });

  fillRect(img, 0, 870, W, H, [31, 43, 55, 238]);
  for (let i = 0; i < 17; i += 1) {
    const width = 50 + rand() * 80;
    const height = 80 + rand() * 190;
    const x = i * 102 - 30 + rand() * 35;
    drawBuilding(img, x, H, width, height, [30 + rand() * 18, 42 + rand() * 18, 58 + rand() * 20], 8600 + i, 255);
  }
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * W;
    const y = 870 + rand() * 125;
    ellipse(img, x, y, 2 + rand() * 2, 2 + rand() * 2, rand() < 0.55 ? [242, 205, 116, 150] : [104, 178, 210, 130]);
  }
  line(img, 1455, 195, 1505, 184, 4, [45, 53, 61, 210]);
  line(img, 1505, 184, 1542, 202, 3, [45, 53, 61, 210]);
  vignette(img, 46);
  savePng(img, resolve(OUT, 'growth_stage_08_city.png'));
}

stage4Human();
stage5Car();
stage6Building();
stage7Mega();
stage8City();
console.log(`Generated major Growth raster scenes at ${OUT}`);
