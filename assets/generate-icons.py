#!/usr/bin/env python3
"""Minimal PNG writer for app / notification icons."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def png(path: Path, width: int, height: int, pixel) -> None:
    rows = bytearray()
    for y in range(height):
        rows.append(0)
        for x in range(width):
            rows.extend(pixel(x, y, width, height))
    raw = zlib.compress(bytes(rows), 9)
    chunks = [
        b"\x89PNG\r\n\x1a\n",
        chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)),
        chunk(b"IDAT", raw),
        chunk(b"IEND", b""),
    ]
    path.write_bytes(b"".join(chunks))


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def in_teardrop(nx: float, ny: float, cx: float, cy: float, r: float) -> bool:
    tip_y = cy - r * 2.05
    if ny >= cy:
        return (nx - cx) ** 2 + (ny - cy) ** 2 <= r * r
    if ny < tip_y:
        return False
    t = (cy - ny) / (cy - tip_y)
    half = r * (1 - t) * 0.98
    return abs(nx - cx) <= half and (nx - cx) ** 2 + (ny - cy) ** 2 <= (r * 1.85) ** 2


def in_spine(nx: float, ny: float, cx: float, top: float, bottom: float, width: float) -> bool:
    return abs(nx - cx) <= width and top <= ny <= bottom


def icon_pixel(x: int, y: int, w: int, h: int) -> bytes:
    nx = x / (w - 1)
    ny = y / (h - 1)
    bg = (31, 107, 90, 255)
    cream = (244, 239, 230, 255)
    if in_teardrop(nx, ny, 0.5, 0.48, 0.13) or in_spine(nx, ny, 0.5, 0.68, 0.78, 0.018):
        return bytes(cream)
    return bytes(bg)


def adaptive_pixel(x: int, y: int, w: int, h: int) -> bytes:
    nx = (x / (w - 1) - 0.5) * 1.45 + 0.5
    ny = (y / (h - 1) - 0.5) * 1.45 + 0.5
    cream = (244, 239, 230, 255)
    if 0 <= nx <= 1 and 0 <= ny <= 1 and (
        in_teardrop(nx, ny, 0.5, 0.48, 0.13) or in_spine(nx, ny, 0.5, 0.68, 0.78, 0.018)
    ):
        return bytes(cream)
    return bytes((0, 0, 0, 0))


def notification_pixel(x: int, y: int, w: int, h: int) -> bytes:
    nx = x / (w - 1)
    ny = y / (h - 1)
    if in_teardrop(nx, ny, 0.5, 0.5, 0.22) or in_spine(nx, ny, 0.5, 0.78, 0.92, 0.035):
        return bytes((255, 255, 255, 255))
    return bytes((255, 255, 255, 0))


def splash_pixel(x: int, y: int, w: int, h: int) -> bytes:
    nx = x / (w - 1)
    ny = y / (h - 1)
    if in_teardrop(nx, ny, 0.5, 0.46, 0.12) or in_spine(nx, ny, 0.5, 0.66, 0.76, 0.016):
        return bytes((31, 107, 90, 255))
    return bytes((244, 239, 230, 255))


def main() -> None:
    png(ROOT / "icon.png", 1024, 1024, icon_pixel)
    png(ROOT / "adaptive-icon.png", 1024, 1024, adaptive_pixel)
    png(ROOT / "notification-icon.png", 96, 96, notification_pixel)
    png(ROOT / "splash-icon.png", 512, 512, splash_pixel)
    print("wrote icons")


if __name__ == "__main__":
    main()
