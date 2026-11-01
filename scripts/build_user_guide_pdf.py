"""Build the illustrated Chinese user guide from docs/USER-GUIDE.md.

Requires reportlab. Run from any directory with:
    python3 scripts/build_user_guide_pdf.py
"""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "USER-GUIDE.md"
OUTPUT = ROOT / "output" / "pdf" / "Alta-Conflict-Desk-使用说明.pdf"
NAVY = colors.HexColor("#17324B")
INK = colors.HexColor("#253445")
MUTED = colors.HexColor("#607284")
COPPER = colors.HexColor("#A7794D")
LINE = colors.HexColor("#DCE3E8")


def register_chinese_font() -> None:
    font_candidates = list(
        Path("/System/Library/AssetsV2").rglob("STHEITI.ttf")
    ) + [
        Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    ]
    for path in font_candidates:
        if path.exists():
            try:
                pdfmetrics.registerFont(TTFont("GuideChinese", str(path)))
                return
            except Exception:
                continue
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont

    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    pdfmetrics.registerFontFamily("STSong-Light", normal="STSong-Light")
    globals()["FONT"] = "STSong-Light"


FONT = "GuideChinese"
register_chinese_font()


STYLES = {
    "cover_kicker": ParagraphStyle(
        "CoverKicker", fontName=FONT, fontSize=9, leading=15,
        textColor=COPPER, spaceAfter=14, tracking=1.1,
    ),
    "cover_title": ParagraphStyle(
        "CoverTitle", fontName=FONT, fontSize=30, leading=43,
        textColor=NAVY, spaceAfter=10, wordWrap="CJK",
    ),
    "cover_intro": ParagraphStyle(
        "CoverIntro", fontName=FONT, fontSize=11, leading=19,
        textColor=MUTED, spaceAfter=22, wordWrap="CJK",
    ),
    "h2": ParagraphStyle(
        "Heading2", fontName=FONT, fontSize=18, leading=27,
        textColor=NAVY, spaceBefore=16, spaceAfter=13,
        keepWithNext=True, wordWrap="CJK",
    ),
    "h3": ParagraphStyle(
        "Heading3", fontName=FONT, fontSize=22, leading=32,
        textColor=NAVY, spaceBefore=1, spaceAfter=13,
        keepWithNext=True, wordWrap="CJK",
    ),
    "h4": ParagraphStyle(
        "Heading4", fontName=FONT, fontSize=11.3, leading=18,
        textColor=NAVY, spaceBefore=10, spaceAfter=4,
        keepWithNext=True, wordWrap="CJK",
    ),
    "body": ParagraphStyle(
        "Body", fontName=FONT, fontSize=10.2, leading=18,
        textColor=INK, spaceAfter=8, wordWrap="CJK", alignment=TA_LEFT,
    ),
    "bullet": ParagraphStyle(
        "Bullet", fontName=FONT, fontSize=10.1, leading=17.5,
        textColor=INK, leftIndent=14, firstLineIndent=-9,
        spaceAfter=5, wordWrap="CJK",
    ),
    "caption": ParagraphStyle(
        "Caption", fontName=FONT, fontSize=8.2, leading=13,
        textColor=MUTED, spaceBefore=6, spaceAfter=15, wordWrap="CJK",
    ),
    "note": ParagraphStyle(
        "Note", fontName=FONT, fontSize=9.6, leading=16.5,
        textColor=INK, wordWrap="CJK",
    ),
}


class FramedImage(Flowable):
    """Place a screenshot in a fixed frame without changing the source file."""

    def __init__(self, path: Path, width: float = 505, height: float = 276):
        super().__init__()
        self.path = path
        self.width = width
        self.height = height

    def draw(self) -> None:
        reader = ImageReader(str(self.path))
        source_width, source_height = reader.getSize()
        scale = max(self.width / source_width, self.height / source_height)
        displayed_width = source_width * scale
        displayed_height = source_height * scale
        x = (self.width - displayed_width) / 2
        # For tall screenshots, prefer the top portion where the page title and
        # primary controls usually sit. Landscape images are centered.
        y = self.height - displayed_height if displayed_height > self.height * 1.15 else (self.height - displayed_height) / 2
        self.canv.saveState()
        mask = self.canv.beginPath()
        mask.rect(0, 0, self.width, self.height)
        self.canv.clipPath(mask, stroke=0, fill=0)
        self.canv.drawImage(reader, x, y, width=displayed_width, height=displayed_height)
        self.canv.restoreState()
        self.canv.setStrokeColor(LINE)
        self.canv.setLineWidth(0.7)
        self.canv.roundRect(0, 0, self.width, self.height, 5, stroke=1, fill=0)


def inline_markup(value: str) -> str:
    value = re.sub(r"<(https?://[^>]+)>", r"\1", value)
    value = html.escape(value, quote=False)
    value = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r"<font color='#285473'>\1</font>", value)
    return value


def note_box(value: str) -> Table:
    box = Table([[Paragraph(inline_markup(value), STYLES["note"])]], colWidths=[505])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F2E9")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, COPPER),
        ("LEFTPADDING", (0, 0), (-1, -1), 13),
        ("RIGHTPADDING", (0, 0), (-1, -1), 13),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return box


def draw_cover_page(canvas, doc) -> None:
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 75, width, 75, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F8F5EC"))
    canvas.setFont(FONT, 16)
    canvas.drawString(45, height - 47, "altalex  /  CONFLICT DESK")
    canvas.setFillColor(COPPER)
    canvas.rect(45, height - 80, 72, 5, stroke=0, fill=1)
    footer(canvas, doc, cover=True)


def footer(canvas, doc, cover: bool = False) -> None:
    width, _ = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(45, 44, width - 45, 44)
    canvas.setFillColor(MUTED)
    canvas.setFont(FONT, 7.8)
    canvas.drawString(45, 29, "Alta Conflict Desk  ·  收案前核查操作说明")
    canvas.drawRightString(width - 45, 29, f"{doc.page:02d}")
    if not cover:
        canvas.setFillColor(NAVY)
        canvas.rect(0, A4[1] - 5, width, 5, stroke=0, fill=1)


def render_markdown(source: str) -> list:
    story: list = []
    paragraph_lines: list[str] = []
    saw_step = False
    skip_cover_caption = False

    def flush_paragraph() -> None:
        nonlocal skip_cover_caption
        if paragraph_lines:
            text = " ".join(paragraph_lines).strip()
            if skip_cover_caption and text.startswith("*图 1"):
                skip_cover_caption = False
                paragraph_lines.clear()
                return
            if text:
                caption = text.startswith("图 ") or text.startswith("*图 ")
                style = STYLES["caption"] if caption else STYLES["body"]
                if caption and text.startswith("*") and text.endswith("*"):
                    text = text[1:-1]
                story.append(Paragraph(inline_markup(text), style))
            paragraph_lines.clear()

    for raw in source.splitlines():
        line = raw.strip()
        if not line:
            flush_paragraph()
            continue
        image_match = re.fullmatch(r"!\[([^]]*)\]\(([^)]+)\)", line)
        if image_match:
            flush_paragraph()
            image_path = (SOURCE.parent / image_match.group(2)).resolve()
            if not image_path.is_file():
                raise FileNotFoundError(image_path)
            if image_path.name == "v9-1-ocean-desktop.png":
                # The current overview is already shown prominently on the cover.
                skip_cover_caption = True
                continue
            story.append(Spacer(1, 8))
            story.append(FramedImage(image_path))
            continue
        if line.startswith("# "):
            flush_paragraph()
            continue
        if line.startswith("### "):
            flush_paragraph()
            if re.match(r"### [1-7][.、 ]", line):
                if saw_step:
                    story.append(PageBreak())
                saw_step = True
            story.append(Paragraph(inline_markup(line[4:]), STYLES["h3"]))
            continue
        if line.startswith("## "):
            flush_paragraph()
            if line.startswith("## 跟着做") or saw_step:
                story.append(PageBreak())
            story.append(Paragraph(inline_markup(line[3:]), STYLES["h2"]))
            continue
        if line.startswith("#### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[5:]), STYLES["h4"]))
            continue
        if line.startswith("> "):
            flush_paragraph()
            story.append(note_box(line[2:]))
            story.append(Spacer(1, 12))
            continue
        bullet = re.match(r"(?:[-*]|\d+[.)])\s+(.+)", line)
        if bullet:
            flush_paragraph()
            story.append(Paragraph("•  " + inline_markup(bullet.group(1)), STYLES["bullet"]))
            continue
        paragraph_lines.append(line)
    flush_paragraph()
    return story


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=45, rightMargin=45, topMargin=48, bottomMargin=58,
        title="Alta Conflict Desk 使用说明",
        author="Alta Conflict Desk prototype team",
        subject="收案前核查七步操作说明",
    )
    intro = [
        Spacer(1, 85),
        Paragraph("律师工作台  /  七步操作指南", STYLES["cover_kicker"]),
        Paragraph("收案前核查<br/>使用说明", STYLES["cover_title"]),
        Paragraph("从连接资料来源、确认主体，到核实材料、记录律师意见。按页面上的按钮逐步完成一宗演示案件。", STYLES["cover_intro"]),
        FramedImage(ROOT / "docs" / "screenshots" / "v9-1-ocean-desktop.png", height=283),
        Paragraph("审查总览为当前深蓝色界面截图；后文的操作截图来自较早版本，仅用于定位功能。请以当前网页中的按钮文字为准。", STYLES["caption"]),
        Spacer(1, 8),
        note_box("阅读方式：先完成连接器设置，再按 1-7 步走一遍。示例台账与内置材料是虚构数据；律师仍需核实证据并独立判断是否承接。"),
        PageBreak(),
    ]
    source = SOURCE.read_text(encoding="utf-8").replace(
        "可以先看下图认识「审查总览」，再按第 1-7 步操作。",
        "封面展示「审查总览」，正文按第 1-7 步操作。",
    )
    doc.build(intro + render_markdown(source), onFirstPage=draw_cover_page, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()
