#!/usr/bin/env python3
"""iPhone 6.7\" App Store screenshots (1290x2796)."""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1290, 2796
ROOT = Path(__file__).resolve().parent / "screenshots"
FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

BG = (244, 239, 230)
INK = (27, 42, 36)
MUTED = (92, 107, 100)
TEAL = (31, 107, 90)
PAPER = (255, 251, 244)
CLAY = (196, 106, 58)
CLAY_SOFT = (244, 224, 212)
WHITE = (255, 251, 244)
LINE = (228, 216, 198)


def font(size: int, bold=False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size)


def rounded(draw: ImageDraw.ImageDraw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)


def chrome(draw: ImageDraw.ImageDraw):
    draw.rounded_rectangle((520, 68, 770, 96), radius=14, fill=INK)
    draw.text((86, 70), "11:00", font=font(34), fill=INK)


def shot_home() -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    chrome(d)
    rounded(d, (72, 220, 196, 344), 28, TEAL)
    d.text((220, 248), "Dik dur ve su iç", font=font(54), fill=INK)
    d.text((72, 390), "Her gün 11:00 – 21:00", font=font(36), fill=MUTED)
    rounded(d, (72, 500, W - 72, 1020), 48, PAPER)
    d.text((120, 560), "SIRADAKİ", font=font(28), fill=TEAL)
    d.text((120, 640), "14:00", font=font(120), fill=INK)
    d.text((120, 860), "Onaylamadan yenisi gelmez.", font=font(34), fill=MUTED)
    chips = [("30 dk", False), ("1 sa", True), ("2 sa", False), ("3 sa", False)]
    for i, (label, active) in enumerate(chips):
        x0 = 72 + (i % 2) * 560
        y0 = 1120 + (i // 2) * 170
        rounded(d, (x0, y0, x0 + 520, y0 + 140), 40, TEAL if active else PAPER)
        d.text((x0 + 170, y0 + 42), label, font=font(42), fill=WHITE if active else INK)
    return im


def shot_pending() -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    chrome(d)
    d.text((72, 250), "Dik dur ve su iç", font=font(54), fill=INK)
    rounded(d, (72, 420, W - 72, 1380), 48, CLAY_SOFT)
    d.text((120, 500), "SIRA SENDE", font=font(28), fill=TEAL)
    d.text((120, 600), "Dik dur", font=font(96), fill=INK)
    d.text((120, 780), "Omuzlarını geri al,\nbir yudum su iç.", font=font(40), fill=MUTED)
    rounded(d, (120, 1120, W - 120, 1280), 36, CLAY)
    d.text((520, 1164), "Yaptım", font=font(44), fill=WHITE)
    return im


def shot_nudge() -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    chrome(d)
    rounded(d, (90, 360, W - 90, 1320), 56, PAPER)
    d.text((140, 430), "BİLDİRİM", font=font(28), fill=MUTED)
    d.text((140, 520), "Hâlâ buradayım", font=font(64), fill=INK)
    d.text(
        (140, 680),
        "Sağlıklı olman için uğraşıyorum,\nşu suyu içer misin?",
        font=font(40),
        fill=MUTED,
    )
    rounded(d, (140, 1040, 560, 1180), 28, TEAL)
    rounded(d, (600, 1040, 1160, 1180), 28, TEAL)
    d.text((250, 1082), "İçtim", font=font(36), fill=WHITE)
    d.text((690, 1082), "Dik durdum", font=font(36), fill=WHITE)
    return im


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    shot_home().save(ROOT / "iphone-67-1-aralik.png")
    shot_pending().save(ROOT / "iphone-67-2-onay.png")
    shot_nudge().save(ROOT / "iphone-67-3-bildirim.png")
    print("wrote", ROOT)


if __name__ == "__main__":
    main()
