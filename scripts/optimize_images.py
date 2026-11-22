"""Turn source photos into the WebP files the website uses.

Usage:
    python3 scripts/optimize_images.py <folder-with-jpg-or-png>

For every photo it writes frontend/static/img/<name>-<width>.webp at 480, 960
and 1440 pixels wide (never larger than the original), strips metadata, and
records the sizes in frontend/src/data/images.json so the HTML can declare
width/height and srcset. Requires Pillow (pip install Pillow).

To replace a demo photo with a real one, give the new file the same name as
the old one (for example tagine-prunes.jpg) and run the script again.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

WIDTHS = (480, 960, 1440)
QUALITY = 76

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "frontend" / "static" / "img"
MANIFEST = ROOT / "frontend" / "src" / "data" / "images.json"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    photos = sorted(p for p in src.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if not photos:
        sys.exit(f"No .jpg or .png files in {src}")

    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for photo in photos:
        name = photo.stem
        image = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
        widths = [w for w in WIDTHS if w <= image.width] or [image.width]
        for width in widths:
            height = round(image.height * width / image.width)
            image.resize((width, height), Image.LANCZOS).save(
                OUT_DIR / f"{name}-{width}.webp", "WEBP", quality=QUALITY, method=6
            )
        manifest[name] = {"widths": widths, "ratio": round(image.width / image.height, 4)}
        print(f"{name}: {widths}")

    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")
    print(f"Updated {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
