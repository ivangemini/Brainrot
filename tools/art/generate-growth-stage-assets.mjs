#!/usr/bin/env node
/**
 * Deterministic generated-raster Growth scenes for major Total Level milestones.
 *
 * The approved high-fidelity hero remains the material/detail source. We extract a
 * soft raster pigeon layer from that hero, recompose it against progressively
 * different scale-reference environments, and emit flattened PNG scenes.
 */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '../..');
const SOURCE = resolve(ROOT, 'public/assets/generated/main_scene_hero.webp');
const OUT = resolve(ROOT, 'public/assets/generated');
const W = 1600;
const H = 1000;
const RAW = { width: W, height: H, channels: 4 };

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
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

function bufferImage() {
  return Buffer.alloc(W * H * 4);
}

function blend(buffer, x, y, rgba) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H || rgba[3] <= 0) return;
  const i = (y * W + x) * 4;
  const sa = rgba[3] / 255;
  const da = buffer[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;
  for (let c = 0; c < 3; c += 1) {
    buffer[i + c] = Math.round((rgba[c] * sa + buffer[i + c] * da * (1 - sa)) / outA);
  }
  buffer[i + 3] = Math.round(outA * 255);
}

function fillRect(buffer, x0, y0, x1, y1, rgba) {
  const left = Math.max(0, Math.floor(x0));
  const right = Math.min(W, Math.ceil(x1));
  const top = Math.max(0, Math.floor(y0));
  const bottom = Math.min(H, Math.ceil(y1));
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) blend(buffer, x, y, rgba);
  }
}

function ellipse(buffer, cx, cy, rx, ry, rgba) {
  const left = Math.max(0, Math.floor(cx - rx));
  const right = Math.min(W - 1, Math.ceil(cx + rx));
  const top = Math.max(0, Math.floor(cy - ry));
  const bottom = Math.min(H - 1, Math.ceil(cy + ry));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) blend(buffer, x, y, rgba);
    }
  }
}

function line(buffer, x0, y0, x1, y1, width, rgba) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    ellipse(buffer, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width, width, rgba);
  }
}

function polygon(buffer, points, rgba) {
  const ys = points.map((point) => point[1]);
  const top = Math.max(0, Math.floor(Math.min(...ys)));
  const bottom = Math.min(H - 1, Math.ceil(Math.max(...ys)));
  for (let y = top; y <= bottom; y += 1) {
    const xs = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + (y - yi) * (xj - xi) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x += 1) blend(buffer, x, y, rgba);
    }
  }
}

function drawCloud(buffer, cx, cy, scale, alpha) {
  ellipse(buffer, cx - 56 * scale, cy + 5 * scale, 74 * scale, 31 * scale, [246, 249, 250, alpha]);
  ellipse(buffer, cx, cy - 10 * scale, 92 * scale, 44 * scale, [250, 252, 252, alpha]);
  ellipse(buffer, cx + 68 * scale, cy + 6 * scale, 66 * scale, 30 * scale, [246, 249, 250, alpha]);
}

function drawBuilding(buffer, x, groundY, width, height, color, seed, alpha = 255) {
  const rand = rng(seed);
  const top = groundY - height;
  fillRect(buffer, x, top, x + width, groundY, [...color, alpha]);
  fillRect(buffer, x + width * 0.07, top, x + width * 0.13, groundY, [255, 255, 255, Math.round(alpha * 0.07)]);
  const cols = Math.max(2, Math.floor(width / 34));
  const rows = Math.max(2, Math.floor(height / 44));
  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      if (rand() < 0.28) continue;
      const wx = x + (col * width) / (cols + 1) - 5;
      const wy = top + (row * height) / (rows + 1) - 7;
      const lit = rand() < 0.34;
      fillRect(
        buffer,
        wx,
        wy,
        wx + 10,
        wy + 14,
        lit ? [244, 216, 143, Math.round(alpha * 0.58)] : [94, 148, 174, Math.round(alpha * 0.32)],
      );
    }
  }
}

function drawCar(buffer, cx, groundY, scale, color) {
  ellipse(buffer, cx - 60 * scale, groundY, 24 * scale, 24 * scale, [27, 30, 34, 235]);
  ellipse(buffer, cx + 60 * scale, groundY, 24 * scale, 24 * scale, [27, 30, 34, 235]);
  polygon(buffer, [
    [cx - 110 * scale, groundY - 18 * scale],
    [cx - 72 * scale, groundY - 70 * scale],
    [cx + 58 * scale, groundY - 78 * scale],
    [cx + 116 * scale, groundY - 25 * scale],
    [cx + 106 * scale, groundY - 8 * scale],
    [cx - 108 * scale, groundY - 8 * scale],
  ], [...color, 230]);
  polygon(buffer, [
    [cx - 52 * scale, groundY - 66 * scale],
    [cx - 24 * scale, groundY - 100 * scale],
    [cx + 43 * scale, groundY - 100 * scale],
    [cx + 70 * scale, groundY - 72 * scale],
  ], [104, 152, 177, 185]);
}

function drawHuman(buffer, x, groundY, scale, coat) {
  ellipse(buffer, x, groundY - 82 * scale, 13 * scale, 14 * scale, [190, 149, 119, 235]);
  line(buffer, x, groundY - 68 * scale, x, groundY - 25 * scale, 9 * scale, [...coat, 235]);
  line(buffer, x - 2 * scale, groundY - 53 * scale, x - 22 * scale, groundY - 33 * scale, 4.5 * scale, [...coat, 235]);
  line(buffer, x + 2 * scale, groundY - 53 * scale, x + 24 * scale, groundY - 70 * scale, 4.5 * scale, [...coat, 235]);
  line(buffer, x, groundY - 25 * scale, x - 14 * scale, groundY, 4.5 * scale, [36, 41, 48, 235]);
  line(buffer, x, groundY - 25 * scale, x + 15 * scale, groundY, 4.5 * scale, [36, 41, 48, 235]);
}

function drawHelicopter(buffer, x, y, scale, direction = 1) {
  ellipse(buffer, x, y, 24 * scale, 9 * scale, [38, 46, 54, 218]);
  line(buffer, x - 43 * scale, y - 5 * scale, x + 43 * scale, y - 5 * scale, 2.5 * scale, [35, 42, 49, 205]);
  line(buffer, x + direction * 8 * scale, y + 1 * scale, x + direction * 29 * scale, y + 15 * scale, 3 * scale, [35, 42, 49, 205]);
}

function softEllipse(nx, ny, cx, cy, rx, ry, feather = 0.15) {
  const d = Math.sqrt(((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2);
  if (d >= 1) return 0;
  const inner = 1 - feather;
  if (d <= inner) return 1;
  return 1 - (d - inner) / feather;
}

function pigeonMaskWeight(x, y) {
  const nx = x / W;
  const ny = y / H;
  return Math.max(
    softEllipse(nx, ny, 0.49, 0.61, 0.34, 0.39, 0.12),
    softEllipse(nx, ny, 0.49, 0.29, 0.20, 0.28, 0.14),
    softEllipse(nx, ny, 0.31, 0.55, 0.17, 0.28, 0.14),
    softEllipse(nx, ny, 0.67, 0.55, 0.18, 0.29, 0.14),
    softEllipse(nx, ny, 0.62, 0.25, 0.16, 0.11, 0.18),
    softEllipse(nx, ny, 0.32, 0.88, 0.10, 0.13, 0.2),
    softEllipse(nx, ny, 0.50, 0.88, 0.10, 0.13, 0.2),
  );
}

function extractPigeon(sourceRaw) {
  const result = Buffer.alloc(sourceRaw.length);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      const weight = pigeonMaskWeight(x, y);
      if (weight <= 0) continue;
      result[i] = sourceRaw[i];
      result[i + 1] = sourceRaw[i + 1];
      result[i + 2] = sourceRaw[i + 2];
      result[i + 3] = Math.round(sourceRaw[i + 3] * weight);
    }
  }
  return result;
}

async function transformToCanvas(raw, scaleX, scaleY, offsetX = 0, offsetY = 0) {
  const scaledWidth = Math.max(1, Math.round(W * scaleX));
  const scaledHeight = Math.max(1, Math.round(H * scaleY));
  const scaled = await sharp(raw, { raw: RAW })
    .resize(scaledWidth, scaledHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer();

  const target = Buffer.alloc(W * H * 4);
  const destLeft = Math.round((W - scaledWidth) / 2 + offsetX);
  const destTop = Math.round((H - scaledHeight) / 2 + offsetY);
  const srcX0 = Math.max(0, -destLeft);
  const srcY0 = Math.max(0, -destTop);
  const dstX0 = Math.max(0, destLeft);
  const dstY0 = Math.max(0, destTop);
  const copyWidth = Math.min(scaledWidth - srcX0, W - dstX0);
  const copyHeight = Math.min(scaledHeight - srcY0, H - dstY0);
  if (copyWidth <= 0 || copyHeight <= 0) return target;

  for (let row = 0; row < copyHeight; row += 1) {
    const srcStart = ((srcY0 + row) * scaledWidth + srcX0) * 4;
    const dstStart = ((dstY0 + row) * W + dstX0) * 4;
    scaled.copy(target, dstStart, srcStart, srcStart + copyWidth * 4);
  }
  return target;
}

function createBackLayer(stage) {
  const layer = bufferImage();
  if (stage === 4) {
    fillRect(layer, 0, 590, W, H, [72, 105, 70, 34]);
    fillRect(layer, 0, 790, W, H, [190, 180, 154, 92]);
    drawCloud(layer, 220, 150, 0.85, 26);
  } else if (stage === 5) {
    fillRect(layer, 0, 555, W, H, [53, 59, 66, 195]);
    fillRect(layer, 0, 660, W, 682, [217, 210, 190, 125]);
    fillRect(layer, 0, 820, W, 838, [217, 210, 190, 125]);
    for (let x = 20; x < W; x += 160) fillRect(layer, x, 745, x + 82, 756, [232, 213, 117, 190]);
  } else if (stage === 6) {
    fillRect(layer, 0, 0, W, H, [71, 111, 143, 34]);
    const rand = rng(6106);
    for (let i = 0; i < 15; i += 1) {
      const width = 58 + rand() * 76;
      const height = 170 + rand() * 290;
      drawBuilding(layer, i * 112 - 20, 790, width, height, [72 + rand() * 25, 91 + rand() * 25, 108 + rand() * 25], 6200 + i, 128);
    }
    drawCloud(layer, 245, 190, 0.9, 35);
    drawCloud(layer, 1300, 250, 0.75, 30);
  } else if (stage === 7) {
    fillRect(layer, 0, 0, W, H, [55, 95, 132, 58]);
    const rand = rng(7107);
    for (let i = 0; i < 22; i += 1) {
      const width = 42 + rand() * 65;
      const height = 120 + rand() * 320;
      drawBuilding(layer, i * 77 - 20, 840, width, height, [61 + rand() * 24, 78 + rand() * 24, 96 + rand() * 25], 7200 + i, 105);
    }
    drawCloud(layer, 250, 225, 1.05, 48);
    drawCloud(layer, 1270, 210, 0.95, 46);
    drawCloud(layer, 970, 420, 0.65, 30);
  } else if (stage === 8) {
    fillRect(layer, 0, 0, W, H, [37, 75, 117, 78]);
    fillRect(layer, 0, 650, W, H, [23, 37, 54, 86]);
    const rand = rng(8108);
    for (let i = 0; i < 25; i += 1) {
      const width = 40 + rand() * 62;
      const height = 90 + rand() * 320;
      drawBuilding(layer, i * 70 - 20, 855, width, height, [48 + rand() * 23, 65 + rand() * 23, 84 + rand() * 25], 8200 + i, 92);
    }
    ellipse(layer, 1325, 145, 76, 76, [248, 223, 164, 62]);
  }
  return layer;
}

function createFrontLayer(stage) {
  const layer = bufferImage();
  if (stage === 4) {
    fillRect(layer, 90, 690, 485, 716, [91, 56, 37, 205]);
    fillRect(layer, 115, 740, 458, 766, [104, 63, 40, 205]);
    line(layer, 138, 715, 138, 840, 8, [48, 44, 42, 210]);
    line(layer, 430, 748, 430, 835, 8, [48, 44, 42, 210]);
    line(layer, 250, 692, 286, 752, 4.5, [59, 47, 42, 185]);
    line(layer, 286, 752, 322, 694, 4.5, [59, 47, 42, 185]);
    drawHuman(layer, 1190, 846, 1.0, [41, 58, 77]);
    drawHuman(layer, 1280, 846, 0.9, [82, 64, 58]);
  } else if (stage === 5) {
    drawCar(layer, 250, 870, 0.8, [177, 66, 59]);
    drawCar(layer, 1340, 878, 0.86, [62, 111, 166]);
    line(layer, 105, 465, 105, 810, 7, [40, 47, 54, 220]);
    polygon(layer, [[98, 463], [165, 483], [159, 548], [98, 531]], [45, 51, 58, 220]);
    ellipse(layer, 132, 503, 18, 18, [238, 80, 68, 185]);
  } else if (stage === 6) {
    const rand = rng(6606);
    for (let i = 0; i < 10; i += 1) {
      const width = 82 + rand() * 90;
      const height = 145 + rand() * 280;
      const x = i * 180 - 30 + rand() * 42;
      drawBuilding(layer, x, H, width, height, [34 + rand() * 24, 48 + rand() * 22, 65 + rand() * 24], 6700 + i, 224);
    }
    drawHelicopter(layer, 1375, 285, 0.9, -1);
  } else if (stage === 7) {
    const rand = rng(7707);
    for (let i = 0; i < 13; i += 1) {
      const width = 72 + rand() * 98;
      const height = 110 + rand() * 300;
      const x = i * 137 - 30 + rand() * 38;
      drawBuilding(layer, x, H, width, height, [27 + rand() * 22, 40 + rand() * 22, 57 + rand() * 22], 7600 + i, 230);
    }
    drawHelicopter(layer, 190, 315, 0.86, 1);
    drawHelicopter(layer, 1390, 355, 0.82, -1);
    drawHelicopter(layer, 1180, 165, 0.62, -1);
  } else if (stage === 8) {
    const rand = rng(8808);
    fillRect(layer, 0, 875, W, H, [18, 29, 43, 210]);
    for (let i = 0; i < 17; i += 1) {
      const width = 52 + rand() * 78;
      const height = 85 + rand() * 190;
      const x = i * 102 - 28 + rand() * 34;
      drawBuilding(layer, x, H, width, height, [22 + rand() * 18, 34 + rand() * 18, 51 + rand() * 20], 8600 + i, 240);
    }
    for (let i = 0; i < 80; i += 1) {
      const x = rand() * W;
      const y = 875 + rand() * 120;
      ellipse(layer, x, y, 1.5 + rand() * 2.3, 1.5 + rand() * 2.3, rand() < 0.55 ? [244, 205, 114, 135] : [91, 177, 214, 118]);
    }
    drawHelicopter(layer, 1460, 195, 0.62, -1);
  }
  return layer;
}

const STAGES = [
  { id: 4, file: 'growth_stage_04_human.png', scaleX: 0.96, scaleY: 0.98, offsetY: 18, blur: 5, brightness: 0.88, saturation: 0.86 },
  { id: 5, file: 'growth_stage_05_car.png', scaleX: 1.0, scaleY: 1.0, offsetY: 16, blur: 7, brightness: 0.84, saturation: 0.82 },
  { id: 6, file: 'growth_stage_06_building.png', scaleX: 1.04, scaleY: 1.01, offsetY: 22, blur: 9, brightness: 0.81, saturation: 0.78 },
  { id: 7, file: 'growth_stage_07_mega.png', scaleX: 1.08, scaleY: 1.02, offsetY: 30, blur: 11, brightness: 0.78, saturation: 0.74 },
  { id: 8, file: 'growth_stage_08_city.png', scaleX: 1.13, scaleY: 1.03, offsetY: 42, blur: 13, brightness: 0.74, saturation: 0.7 },
];

mkdirSync(dirname(resolve(OUT, STAGES[0].file)), { recursive: true });
const normalizedSource = await sharp(SOURCE)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .ensureAlpha()
  .raw()
  .toBuffer();
const pigeon = extractPigeon(normalizedSource);

for (const stage of STAGES) {
  const backdrop = await sharp(normalizedSource, { raw: RAW })
    .blur(stage.blur)
    .modulate({ brightness: stage.brightness, saturation: stage.saturation })
    .raw()
    .toBuffer();
  const transformedPigeon = await transformToCanvas(pigeon, stage.scaleX, stage.scaleY, 0, stage.offsetY);
  const backLayer = createBackLayer(stage.id);
  const frontLayer = createFrontLayer(stage.id);

  await sharp(backdrop, { raw: RAW })
    .composite([
      { input: backLayer, raw: RAW },
      { input: transformedPigeon, raw: RAW },
      { input: frontLayer, raw: RAW },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(resolve(OUT, stage.file));
}

console.log(`Generated high-fidelity Growth raster composites at ${OUT}`);
