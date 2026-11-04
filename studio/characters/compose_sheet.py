"""Lay out Norbert's renders as one labeled model sheet.

python3 studio/characters/compose_sheet.py <render_dir> <out.jpg>
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
BG = (226, 230, 235)
INK = (28, 34, 42)
MUTED = (96, 106, 118)


def font(size, bold=False):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


views = [Image.open(os.path.join(src, f"view_{v}.png")).convert("RGB") for v in ("front", "side", "back")]
exprs = ["neutral", "happy", "panic", "awkward", "shocked", "sad"]
faces = [Image.open(os.path.join(src, f"expr_{e}.png")).convert("RGB") for e in exprs]

vw, vh = 760, int(760 * views[0].height / views[0].width)
fs = 380
pad = 40
W = pad * 2 + vw * 3 + pad * 2
H = 150 + vh + 70 + fs + 90
sheet = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(sheet)
d.text((pad, 40), "NORBERT", font=font(64, True), fill=INK)
d.text((pad + 360, 62), "MODEL SHEET v1  ·  3D stickman hero  ·  Blender", font=font(30), fill=MUTED)

y = 150
for i, (im, label) in enumerate(zip(views, ("FRONT", "SIDE", "BACK"))):
    x = pad + i * (vw + pad)
    sheet.paste(im.resize((vw, vh)), (x, y))
    d.text((x + 16, y + 14), label, font=font(30, True), fill=INK)

y += vh + 40
d.text((pad, y), "EXPRESSIONS", font=font(30, True), fill=INK)
y += 46
fw = (W - pad * 2 - 5 * 16) // 6
for i, (im, e) in enumerate(zip(faces, exprs)):
    x = pad + i * (fw + 16)
    sheet.paste(im.resize((fw, fw)), (x, y))
    d.text((x + 10, y + fw - 38), e.upper(), font=font(24, True), fill=(255, 255, 255))

sheet = sheet.crop((0, 0, W, y + fw + pad))
sheet.save(out, quality=92)
print("wrote", out, sheet.size)
