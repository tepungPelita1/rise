# Generates the PWA icons in static/ (run: python scripts/make-icons.py)
import math
from PIL import Image, ImageDraw

LIME = (221, 245, 179)
INK = (18, 18, 18)
PINK = (248, 194, 228)


def star(cx, cy, r_out, r_in, points=5, rot=-90):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot + i * 180 / points)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def icon(size, maskable=False, pad=0.0):
    S = 4  # supersample for smooth edges
    W = size * S
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, W, W], fill=LIME)
    else:
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.24), fill=LIME,
                            outline=INK, width=int(W * 0.035))
    c = W / 2
    scale = (1 - pad)
    r_out = W * 0.34 * scale
    r_in = r_out * 0.45
    # sticker shadow
    off = W * 0.03 * scale
    d.polygon(star(c + off, c + off * 1.1, r_out, r_in), fill=INK)
    d.polygon(star(c, c, r_out, r_in), fill=PINK, outline=INK, width=int(W * 0.03 * scale))
    # little sparkle
    sx, sy, sr = c + r_out * 0.95, c - r_out * 0.85, W * 0.06 * scale
    d.polygon(star(sx, sy, sr, sr * 0.3, points=4, rot=0), fill=INK)
    return img.resize((size, size), Image.LANCZOS)


icon(192).save('static/icon-192.png')
icon(512).save('static/icon-512.png')
icon(512, maskable=True, pad=0.2).save('static/icon-maskable-512.png')
icon(180, maskable=True, pad=0.1).convert('RGB').save('static/apple-touch-icon.png')
print('icons written')
