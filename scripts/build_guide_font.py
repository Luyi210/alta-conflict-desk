"""Create the PDF guide's small, redistributable font subset.

Obtain the Apache-2.0-licensed DroidSansFallback.ttf from the Android font
sources, then run:
    python3 scripts/build_guide_font.py /path/to/DroidSansFallback.ttf

Requires fonttools. The source and derived subset remain under Apache 2.0.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "fonts" / "AltaGuideSans-Regular.ttf"


def build(source: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    font = TTFont(str(source))
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 400}, inplace=False)

    # Include the guide, the cover text in its generator, and common ASCII.
    content = (ROOT / "docs" / "USER-GUIDE.md").read_text(encoding="utf-8")
    content += (ROOT / "scripts" / "build_user_guide_pdf.py").read_text(encoding="utf-8")
    content += "•·—–™©"
    content += "".join(chr(code) for code in range(32, 127))
    options = subset.Options()
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes={ord(character) for character in content})
    subsetter.subset(font)

    # This is a modified subset; use a new family and PostScript name.
    names = {1: "Alta Guide Sans", 2: "Regular", 4: "Alta Guide Sans Regular",
             6: "AltaGuideSans-Regular", 16: "Alta Guide Sans", 17: "Regular"}
    table = font["name"]
    for record in list(table.names):
        if record.nameID in names:
            table.setName(names[record.nameID], record.nameID,
                          record.platformID, record.platEncID, record.langID)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(OUTPUT))
    print(OUTPUT)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python3 scripts/build_guide_font.py SOURCE_TTF")
    build(Path(sys.argv[1]).expanduser())
