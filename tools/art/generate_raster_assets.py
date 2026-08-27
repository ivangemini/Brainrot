#!/usr/bin/env python3
"""Generate the raster-only MVP art pack for Pigeon Maxxing.

This intentionally emits WebP textures only. No SVG/vector production art is generated.
The art pack is deterministic and can be regenerated in CI.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public" / "assets"
W = H = 768


def ensure_dirs() -> None:
    for path in (
        ASSETS / "pigeon",
        ASSETS / "ui",
        ASSETS / "world",
    ):
        path.mkdir(parents=True, exist_ok=True)


def save_webp(image: Image.Image, path: Path, *, hero: bool = False) -> None:
    image = image.convert("RGBA")
    if hero:
        image.save(path, "WEBP", quality=82, method=6)
    else:
        image.save(path, "WEBP", lossless=True, method=6)


def noise_texture(size: tuple[int, int], base: tuple[int, int, int], strength: float, seed: int) -> Image.Image:
    rng = np.random.default_rng(seed)
    base_arr = np.array(base, dtype=np.int16)
    noise = rng.normal(0, strength, (size[1], size[0], 1))
    rgb = np.clip(base_arr + noise, 0, 255).astype(np.uint8)
    arr = np.zeros((size[1], size[0], 4), dtype=np.uint8)
    arr[:, :, :3] = rgb
    arr[:, :, 3] = 255
    return Image.fromarray(arr, "RGBA")


def ellipse_mask(box: tuple[int, int, int, int], blur: float) -> Image.Image:
    mask = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur))


def apply_mask(texture: Image.Image, mask: Image.Image) -> Image.Image:
    result = texture.copy()
    result.putalpha(mask)
    return result


def radial_highlight(image: Image.Image, center: tuple[int, int], radius: float, alpha: int) -> None:
    yy, xx = np.ogrid[:H, :W]
    distance = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2)
    a = np.clip((1 - distance / radius) * alpha, 0, alpha).astype(np.uint8)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[:, :, :3] = 255
    arr[:, :, 3] = a
    overlay = Image.fromarray(arr, "RGBA").filter(ImageFilter.GaussianBlur(12))
    image.alpha_composite(overlay)


def generate_pigeon() -> None:
    pigeon = ASSETS / "pigeon"

    body_specs = [
        ((225, 300, 575, 690), (78, 91, 106), 15, 1),
        ((190, 270, 610, 700), (82, 94, 108), 18, 2),
        ((155, 245, 640, 710), (86, 97, 112), 20, 3),
    ]
    for index, (box, color, strength, seed) in enumerate(body_specs, 1):
        body = apply_mask(noise_texture((W, H), color, strength, seed), ellipse_mask(box, 8))
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.ellipse((box[0] + 25, box[1] + 80, box[2] - 20, box[3] + 45), fill=(20, 24, 30, 50))
        body.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
        radial_highlight(body, (330, 360), 180, 55)
        save_webp(body, pigeon / f"body_t{index}.webp", hero=True)

    head = apply_mask(noise_texture((W, H), (92, 105, 118), 16, 7), ellipse_mask((275, 180, 500, 405), 6))
    patch = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(patch)
    pd.ellipse((255, 325, 475, 500), fill=(38, 130, 122, 80))
    pd.ellipse((330, 330, 515, 500), fill=(100, 78, 160, 65))
    head.alpha_composite(patch.filter(ImageFilter.GaussianBlur(22)))
    radial_highlight(head, (340, 220), 110, 65)
    save_webp(head, pigeon / "head.webp", hero=True)

    eyes = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(eyes)
    draw.ellipse((404, 240, 434, 270), fill=(245, 235, 205, 255))
    draw.ellipse((413, 246, 429, 266), fill=(22, 21, 20, 255))
    draw.ellipse((418, 249, 423, 254), fill=(255, 255, 255, 220))
    draw.line((397, 238, 434, 232), fill=(34, 37, 43, 230), width=8)
    save_webp(eyes, pigeon / "eyes.webp")

    beaks = [
        ([(450, 272), (555, 300), (453, 326)], (210, 150, 85, 255)),
        ([(448, 268), (585, 298), (450, 333)], (225, 168, 92, 255)),
        ([(444, 264), (610, 298), (447, 338)], (238, 193, 55, 255)),
    ]
    for index, (points, color) in enumerate(beaks, 1):
        image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.polygon(points, fill=color)
        draw.line(points + [points[0]], fill=(95, 65, 35, 180), width=5)
        draw.ellipse((468, 285, 482, 295), fill=(80, 52, 30, 180))
        save_webp(image.filter(ImageFilter.GaussianBlur(0.4)), pigeon / f"beak_t{index}.webp")

    wings = [
        ([(225, 350), (115, 405), (170, 585), (300, 520)], (69, 81, 96, 245)),
        ([(210, 335), (78, 400), (148, 610), (315, 525)], (66, 78, 94, 245)),
        ([(200, 320), (50, 385), (125, 635), (320, 530)], (60, 74, 92, 245)),
    ]
    for index, (points, color) in enumerate(wings, 1):
        image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.polygon(points, fill=color)
        for band in range(4):
            y = 410 + band * 38
            draw.arc((100, y - 40, 300, y + 100), start=200, end=340, fill=(145, 155, 165, 110), width=6)
        save_webp(image.filter(ImageFilter.GaussianBlur(1.2)), pigeon / f"wing_t{index}.webp")

    legs = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(legs)
    for x in (315, 420):
        draw.line((x, 620, x, 700), fill=(190, 96, 85, 255), width=18)
        draw.line((x, 700, x - 28, 730), fill=(190, 96, 85, 255), width=12)
        draw.line((x, 700, x + 30, 728), fill=(190, 96, 85, 255), width=12)
    save_webp(legs.filter(ImageFilter.GaussianBlur(0.6)), pigeon / "legs.webp")

    glasses = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glasses)
    draw.rounded_rectangle((365, 228, 430, 265), radius=12, fill=(18, 20, 24, 235), outline=(215, 195, 90, 230), width=4)
    draw.rounded_rectangle((431, 228, 496, 265), radius=12, fill=(18, 20, 24, 235), outline=(215, 195, 90, 230), width=4)
    draw.line((430, 244, 434, 244), fill=(215, 195, 90, 230), width=5)
    draw.line((365, 236, 330, 226), fill=(215, 195, 90, 220), width=5)
    save_webp(glasses, pigeon / "glasses.webp")

    chain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(chain)
    for angle in range(0, 181, 18):
        x = 372 + 95 * math.cos(math.radians(angle))
        y = 420 + 48 * math.sin(math.radians(angle))
        draw.ellipse((x - 9, y - 6, x + 9, y + 6), outline=(238, 196, 55, 255), width=5)
    draw.ellipse((354, 452, 392, 490), fill=(230, 181, 48, 255), outline=(255, 225, 120, 255), width=3)
    save_webp(chain, pigeon / "chain.webp")

    nest = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(nest)
    for index in range(34):
        random.seed(index)
        x1, y1 = random.randint(180, 560), random.randint(620, 700)
        x2, y2 = x1 + random.randint(-80, 80), y1 + random.randint(-18, 18)
        draw.line((x1, y1, x2, y2), fill=(135 + random.randint(0, 30), 92 + random.randint(0, 25), 48, 220), width=random.randint(4, 8))
    save_webp(nest.filter(ImageFilter.GaussianBlur(0.4)), pigeon / "nest.webp")

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((175, 660, 585, 745), fill=(0, 0, 0, 100))
    save_webp(shadow.filter(ImageFilter.GaussianBlur(18)), pigeon / "shadow.webp")


def generate_world() -> None:
    width, height = 1600, 1000
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    for y in range(height):
        t = min(y / height, 0.55)
        sky = np.array([185, 211, 222]) * (1 - t) + np.array([231, 215, 184]) * t
        arr[y, :, :3] = sky.astype(np.uint8)
        arr[y, :, 3] = 255
    image = Image.fromarray(arr, "RGBA")
    draw = ImageDraw.Draw(image)

    random.seed(12)
    for index in range(18):
        x = index * 100 + random.randint(-20, 30)
        building_height = random.randint(160, 360)
        draw.rectangle((x, 460 - building_height, x + 90, 460), fill=(125, 138, 145, 150))

    for x in (80, 260, 1320, 1510):
        draw.rectangle((x - 18, 390, x + 20, 720), fill=(91, 69, 47, 255))
        for dx, dy, radius in ((-50, -30, 100), (30, -50, 115), (5, 20, 120)):
            draw.ellipse((x + dx - radius, 390 + dy - radius, x + dx + radius, 390 + dy + radius), fill=(76, 128, 82, 230))

    draw.rectangle((0, 620, width, height), fill=(113, 143, 92, 255))
    draw.polygon([(0, 820), (width, 700), (width, height), (0, height)], fill=(181, 169, 146, 255))

    draw.rectangle((480, 640, 1000, 690), fill=(100, 61, 40, 255))
    draw.rectangle((500, 705, 980, 750), fill=(118, 72, 45, 255))
    draw.rectangle((540, 685, 565, 850), fill=(65, 53, 45, 255))
    draw.rectangle((920, 685, 945, 820), fill=(65, 53, 45, 255))

    draw.rectangle((1180, 370, 1200, 720), fill=(49, 55, 60, 255))
    draw.ellipse((1145, 320, 1235, 400), fill=(245, 232, 190, 210), outline=(55, 60, 64, 255), width=8)

    grain = np.random.default_rng(22).normal(0, 5, (height, width, 1))
    data = np.array(image).astype(np.int16)
    data[:, :, :3] = np.clip(data[:, :, :3] + grain, 0, 255)
    save_webp(Image.fromarray(data.astype(np.uint8), "RGBA"), ASSETS / "world" / "park_bg.webp", hero=True)


def icon_base(name: str, glyph) -> None:
    image = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((18, 18, 238, 238), fill=(27, 31, 38, 245), outline=(240, 210, 108, 230), width=8)
    glyph(draw)
    save_webp(image.filter(ImageFilter.GaussianBlur(0.2)), ASSETS / "ui" / f"{name}.webp")


def generate_ui() -> None:
    icon_base("feather", lambda d: (
        d.polygon([(125, 36), (170, 70), (146, 182), (105, 220), (112, 156), (74, 172), (108, 126)], fill=(242, 200, 75, 255)),
        d.line((100, 205, 153, 70), fill=(255, 240, 165, 255), width=8),
    ))
    icon_base("beak", lambda d: d.polygon([(52, 110), (205, 78), (98, 168)], fill=(225, 168, 92, 255)))
    icon_base("body", lambda d: d.ellipse((70, 45, 190, 215), fill=(98, 110, 124, 255)))
    icon_base("nest", lambda d: [d.arc((50, 100 + i * 10, 205, 200 + i * 8), 0, 180, fill=(184, 126, 62, 255), width=8) for i in range(5)])
    icon_base("wings", lambda d: (
        d.polygon([(125, 110), (35, 70), (60, 190), (125, 150)], fill=(105, 120, 138, 255)),
        d.polygon([(125, 110), (220, 70), (195, 190), (125, 150)], fill=(105, 120, 138, 255)),
    ))
    icon_base("swag", lambda d: (
        d.rounded_rectangle((45, 80, 118, 130), 10, fill=(14, 16, 20, 255), outline=(237, 198, 63, 255), width=6),
        d.rounded_rectangle((138, 80, 211, 130), 10, fill=(14, 16, 20, 255), outline=(237, 198, 63, 255), width=6),
        d.line((118, 102, 138, 102), fill=(237, 198, 63, 255), width=6),
    ))
    icon_base("brain", lambda d: (
        d.ellipse((60, 62, 145, 160), fill=(102, 196, 216, 255)),
        d.ellipse((112, 70, 198, 168), fill=(102, 196, 216, 255)),
        d.line((128, 80, 128, 185), fill=(230, 245, 250, 220), width=7),
    ))

    burst = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(burst)
    for index in range(14):
        angle = 2 * math.pi * index / 14
        draw.line(
            (64 + math.cos(angle) * 20, 64 + math.sin(angle) * 20, 64 + math.cos(angle) * 54, 64 + math.sin(angle) * 54),
            fill=(242, 200, 75, 160),
            width=4,
        )
    draw.ellipse((42, 42, 86, 86), fill=(255, 230, 115, 210))
    save_webp(burst.filter(ImageFilter.GaussianBlur(1.2)), ASSETS / "ui" / "tap_burst.webp")


def main() -> None:
    ensure_dirs()
    generate_pigeon()
    generate_world()
    generate_ui()
    print("Generated raster art pack:", ASSETS)


if __name__ == "__main__":
    main()
