from __future__ import annotations

import html
import re
import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path("/Users/admini/Documents/Pinu")
SOURCE = ROOT / "pinu_power_data_diagnosis_2026-06-18.md"
OUTPUT = ROOT / "output/pdf/pinu_power_data_diagnosis_2026-06-18.pdf"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf")


def register_fonts() -> str:
    font_name = "ArialUnicode"
    if FONT_PATH.exists():
        pdfmetrics.registerFont(TTFont(font_name, str(FONT_PATH)))
        return font_name
    return "Helvetica"


def xml_text(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<font color='#7A3E00'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def wrap_code(code: str, width: int = 92) -> str:
    out: list[str] = []
    for line in code.splitlines():
        if len(line) <= width:
            out.append(line)
        else:
            chunks = textwrap.wrap(
                line,
                width=width,
                break_long_words=False,
                break_on_hyphens=False,
                replace_whitespace=False,
                drop_whitespace=False,
            )
            out.extend(chunks or [""])
    return "\n".join(out)


def parse_table(lines: list[str], start: int):
    table_lines = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|"):
        table_lines.append(lines[i].strip())
        i += 1
    if len(table_lines) < 2:
        return None, start

    rows = []
    for idx, line in enumerate(table_lines):
        cells = [c.strip() for c in line.strip("|").split("|")]
        if idx == 1 and all(re.fullmatch(r":?-{3,}:?", c or "") for c in cells):
            continue
        rows.append(cells)
    return rows, i


def make_table(rows, styles, max_width):
    col_count = max(len(r) for r in rows)
    normalized = [r + [""] * (col_count - len(r)) for r in rows]

    if col_count <= 3:
        col_widths = [max_width / col_count] * col_count
    elif col_count <= 6:
        col_widths = [max_width * 0.18] * col_count
        remaining = max_width - sum(col_widths)
        col_widths[-1] += remaining
    else:
        col_widths = [max_width / col_count] * col_count

    data = []
    for r_idx, row in enumerate(normalized):
        styled = []
        for cell in row:
            style = styles["table_header"] if r_idx == 0 else styles["table_cell"]
            styled.append(Paragraph(xml_text(cell).replace("\n", "<br/>"), style))
        data.append(styled)

    table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D9EAF7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E2EC")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build_story(markdown: str, styles, max_width):
    lines = markdown.splitlines()
    story = []
    i = 0
    bullets: list[str] = []
    in_code = False
    code_lines: list[str] = []

    def flush_bullets():
        nonlocal bullets
        if bullets:
            items = [
                ListItem(Paragraph(xml_text(item), styles["body"]), leftIndent=8)
                for item in bullets
            ]
            story.append(ListFlowable(items, bulletType="bullet", leftIndent=12))
            story.append(Spacer(1, 2 * mm))
            bullets = []

    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if line.strip().startswith("```"):
            flush_bullets()
            if not in_code:
                in_code = True
                code_lines = []
            else:
                code = wrap_code("\n".join(code_lines))
                story.append(Preformatted(code, styles["code"]))
                story.append(Spacer(1, 3 * mm))
                in_code = False
            i += 1
            continue

        if in_code:
            code_lines.append(raw)
            i += 1
            continue

        if not line.strip():
            flush_bullets()
            story.append(Spacer(1, 2 * mm))
            i += 1
            continue

        table_rows, next_i = parse_table(lines, i)
        if table_rows:
            flush_bullets()
            story.append(make_table(table_rows, styles, max_width))
            story.append(Spacer(1, 4 * mm))
            i = next_i
            continue

        if line.startswith("- "):
            bullets.append(line[2:].strip())
            i += 1
            continue

        flush_bullets()
        if line.startswith("# "):
            story.append(Paragraph(xml_text(line[2:].strip()), styles["title"]))
            story.append(Spacer(1, 5 * mm))
        elif line.startswith("## "):
            story.append(Paragraph(xml_text(line[3:].strip()), styles["h2"]))
            story.append(Spacer(1, 3 * mm))
        elif line.startswith("### "):
            story.append(Paragraph(xml_text(line[4:].strip()), styles["h3"]))
            story.append(Spacer(1, 2 * mm))
        elif line.startswith("> "):
            story.append(Paragraph(xml_text(line[2:].strip()), styles["quote"]))
        else:
            story.append(Paragraph(xml_text(line), styles["body"]))
            story.append(Spacer(1, 1.2 * mm))
        i += 1

    flush_bullets()
    return story


def add_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(doc.font_name, 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(18 * mm, 285 * mm, "Pinu 能量系统数据分析诊断报告")
    canvas.drawRightString(192 * mm, 12 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def main():
    font_name = register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    text = SOURCE.read_text(encoding="utf-8")

    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "TitleCN",
            parent=base["Title"],
            fontName=font_name,
            fontSize=22,
            leading=30,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "H2CN",
            fontName=font_name,
            fontSize=15,
            leading=21,
            textColor=colors.HexColor("#1F4E79"),
            spaceBefore=7,
            spaceAfter=4,
        ),
        "h3": ParagraphStyle(
            "H3CN",
            fontName=font_name,
            fontSize=12.5,
            leading=18,
            textColor=colors.HexColor("#111827"),
            spaceBefore=5,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "BodyCN",
            fontName=font_name,
            fontSize=10.2,
            leading=15.6,
            textColor=colors.HexColor("#111827"),
            alignment=TA_LEFT,
        ),
        "quote": ParagraphStyle(
            "QuoteCN",
            fontName=font_name,
            fontSize=10.2,
            leading=15.6,
            textColor=colors.HexColor("#374151"),
            backColor=colors.HexColor("#F3F4F6"),
            leftIndent=8,
            rightIndent=8,
            borderColor=colors.HexColor("#D1D5DB"),
            borderWidth=0.4,
            borderPadding=6,
        ),
        "code": ParagraphStyle(
            "CodeCN",
            fontName=font_name,
            fontSize=7.8,
            leading=10.2,
            textColor=colors.HexColor("#111827"),
            backColor=colors.HexColor("#F8FAFC"),
            borderColor=colors.HexColor("#CBD5E1"),
            borderWidth=0.35,
            borderPadding=5,
            leftIndent=0,
        ),
        "table_header": ParagraphStyle(
            "TableHeaderCN",
            fontName=font_name,
            fontSize=8.4,
            leading=11.2,
            textColor=colors.HexColor("#111827"),
            alignment=TA_CENTER,
        ),
        "table_cell": ParagraphStyle(
            "TableCellCN",
            fontName=font_name,
            fontSize=8.1,
            leading=10.8,
            textColor=colors.HexColor("#111827"),
        ),
    }

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="Pinu 能量系统数据分析诊断报告",
        author="Codex",
    )
    doc.font_name = font_name
    max_width = A4[0] - doc.leftMargin - doc.rightMargin
    story = build_story(text, styles, max_width)
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
