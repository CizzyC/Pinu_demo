from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
INPUT_MD = REPO_ROOT / "pinu_competitive_analysis_retention.md"
OUTPUT_PDF = REPO_ROOT / "output" / "pdf" / "pinu_competitive_analysis_retention.pdf"
CN_FONT = "STHeiti"
CN_FONT_PATH = "/System/Library/Fonts/STHeiti Medium.ttc"


def clean_inline(text: str) -> str:
    text = html.escape(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\[(.+?)\]\((.+?)\)", r"<link href='\2' color='blue'>\1</link>", text)
    return text


def make_styles():
    registerFont(TTFont(CN_FONT, CN_FONT_PATH, subfontIndex=0))
    styles = getSampleStyleSheet()
    base = {
        "fontName": CN_FONT,
        "wordWrap": "CJK",
        "leading": 15,
        "spaceAfter": 6,
        "alignment": TA_LEFT,
    }
    return {
        "title": ParagraphStyle(
            "TitleCN",
            parent=styles["Title"],
            fontName=CN_FONT,
            fontSize=22,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17365D"),
            spaceAfter=14,
            wordWrap="CJK",
        ),
        "h2": ParagraphStyle(
            "H2CN",
            fontSize=15,
            leading=20,
            fontName=CN_FONT,
            wordWrap="CJK",
            alignment=TA_LEFT,
            textColor=colors.HexColor("#17365D"),
            spaceBefore=12,
            spaceAfter=8,
        ),
        "h3": ParagraphStyle(
            "H3CN",
            fontSize=12.5,
            leading=17,
            fontName=CN_FONT,
            wordWrap="CJK",
            alignment=TA_LEFT,
            textColor=colors.HexColor("#4F6B88"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle("BodyCN", **base, fontSize=10),
        "small": ParagraphStyle(
            "SmallCN",
            fontName=CN_FONT,
            wordWrap="CJK",
            leading=11,
            spaceAfter=3,
            alignment=TA_LEFT,
            fontSize=8.2,
        ),
        "quote": ParagraphStyle(
            "QuoteCN",
            fontSize=10,
            leading=15,
            fontName=CN_FONT,
            wordWrap="CJK",
            alignment=TA_LEFT,
            spaceAfter=6,
            leftIndent=8 * mm,
            rightIndent=5 * mm,
            textColor=colors.HexColor("#3D4F60"),
            borderColor=colors.HexColor("#D9E2F3"),
            borderWidth=0.8,
            borderPadding=6,
            backColor=colors.HexColor("#F7FAFC"),
        ),
        "bullet": ParagraphStyle(
            "BulletCN",
            fontSize=9.8,
            leading=15,
            fontName=CN_FONT,
            wordWrap="CJK",
            alignment=TA_LEFT,
            spaceAfter=4,
            leftIndent=5 * mm,
            firstLineIndent=0,
        ),
    }


def parse_table(lines: list[str], start: int):
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|"):
        row = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
        if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in row):
            rows.append(row)
        i += 1
    return rows, i


def paragraph(text: str, style):
    return Paragraph(clean_inline(text), style)


def table_flowable(rows: list[list[str]], styles, available_width: float):
    max_cols = max(len(row) for row in rows)
    normalized = [row + [""] * (max_cols - len(row)) for row in rows]
    col_width = available_width / max_cols
    data = [
        [Paragraph(clean_inline(cell), styles["small"]) for cell in row]
        for row in normalized
    ]
    table = Table(data, colWidths=[col_width] * max_cols, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), CN_FONT),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E2F3")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    return table


def build_story(md: str, styles, available_width: float):
    story = []
    lines = md.splitlines()
    i = 0
    pending_bullets: list[str] = []

    def flush_bullets():
        if not pending_bullets:
            return
        items = [
            ListItem(paragraph(item, styles["bullet"]), bulletColor=colors.HexColor("#17365D"))
            for item in pending_bullets
        ]
        story.append(ListFlowable(items, bulletType="bullet", leftIndent=8 * mm))
        story.append(Spacer(1, 4))
        pending_bullets.clear()

    while i < len(lines):
        raw = lines[i]
        line = raw.strip()
        if not line:
            flush_bullets()
            i += 1
            continue

        if line.startswith("|"):
            flush_bullets()
            rows, i = parse_table(lines, i)
            story.append(table_flowable(rows, styles, available_width))
            story.append(Spacer(1, 8))
            continue

        if line.startswith("# "):
            flush_bullets()
            story.append(paragraph(line[2:], styles["title"]))
            i += 1
            continue

        if line.startswith("## "):
            flush_bullets()
            if story:
                story.append(Spacer(1, 4))
            story.append(paragraph(line[3:], styles["h2"]))
            i += 1
            continue

        if line.startswith("### "):
            flush_bullets()
            story.append(paragraph(line[4:], styles["h3"]))
            i += 1
            continue

        if line.startswith("> "):
            flush_bullets()
            story.append(paragraph(line[2:], styles["quote"]))
            story.append(Spacer(1, 6))
            i += 1
            continue

        if line.startswith("- "):
            pending_bullets.append(line[2:])
            i += 1
            continue

        flush_bullets()
        story.append(paragraph(line, styles["body"]))
        i += 1

    flush_bullets()
    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN_FONT, 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawCentredString(A4[0] / 2, 12 * mm, f"{doc.page}")
    canvas.restoreState()


def main():
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="Pinu 竞品分析：以激励留存为主线",
        author="Codex",
    )
    available_width = A4[0] - doc.leftMargin - doc.rightMargin
    story = build_story(INPUT_MD.read_text(encoding="utf-8"), styles, available_width)
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(OUTPUT_PDF)


if __name__ == "__main__":
    main()
