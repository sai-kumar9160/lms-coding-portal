"""Turns a PDF into course content: chapters (lessons) with Markdown text, code, lists, tables and figures.

Usage: python -I pdf-course.py <input.pdf> <output dir>
Writes <output dir>/manifest.json:
  {"units": [{"title": ..., "lessons": [{"title", "pages": [first, last], "markdown": "lesson-N.md", "images": [...]}]}]}

How the PDF is read (works for Word, Google Docs and similar exports):
- Text pieces at the same height are joined into visual rows first (bullets, tab-indented code and table cells are
  often separate pieces on one line). Invisible characters (zero-width spaces) are removed.
- Chapters come from the PDF bookmarks (blank and "****End of ...****" entries are ignored); without bookmarks,
  the largest heading size that repeats marks chapters.
- Code: monospace fonts, or syntax-highlight colours (Eclipse/IntelliJ style). Indentation comes from the x position.
- Headings: text clearly larger than the body; in documents whose body text is bold, a short line introducing a list.
- Lists: bullet characters or "1." / "1)" numbering. Tables: PyMuPDF table detection. Figures: embedded images.
- Running page headers and footers (the same text on many pages) are dropped.
The PDF is treated as data only. Requires PyMuPDF (pip install pymupdf).
"""
import json
import os
import re
import sys
from collections import Counter

import pymupdf

ZERO_WIDTH = re.compile("[​‌‍⁠﻿­]")
BULLET_CHARS = "•▪●◦‣⁃∙➢✓✔►▶"
MONO = ("mono", "courier", "consolas", "menlo", "monaco", "code", "inconsolata", "fira")
# Colours IDEs use for keywords, strings, comments, fields and annotations.
SYNTAX_COLOURS = {"7f0055", "3f7f5f", "2a00ff", "0000c0", "6a3e3e", "646464", "3f5fbf", "7f9fbf", "cc7832", "6a8759", "9876aa", "808080", "008000", "0000ff", "a31515", "af00db", "795e26", "267f99", "001080", "098658"}
CODE_LINE = re.compile(r"(^[\s{}()\[\];]*$)|(;\s*(//.*)?$)|([{}]\s*$)|(^\s*(public|private|protected|static|final|class|interface|enum|import|package|return|if|else|for|while|do|try|catch|finally|throw|throws|new|void|int|long|double|float|boolean|char|byte|short|String|System\.|def|print\(|#include|using|namespace)\b)|(^\s*@\w+)")
END_MARKER = re.compile(r"^\W*\*{3,}.*\*{3,}\W*$|^\W*-?\*{3,}")


def colour(span):
    return f"{span['color']:06x}"


def is_mono(span):
    return any(word in span["font"].lower() for word in MONO)


def is_bold(span):
    return "bold" in span["font"].lower() or bool(span["flags"] & 16)


def clean(text):
    return ZERO_WIDTH.sub("", text).replace(" ", " ")


def normal_key(text):
    return re.sub(r"\d+", "#", text.strip().lower())


class Row:
    """One visual line: all text pieces at the same height on a page, left to right."""

    def __init__(self, page, pieces):
        self.page = page
        self.pieces = sorted(pieces, key=lambda p: p["x0"])
        self.y0 = min(p["y0"] for p in pieces)
        self.y1 = max(p["y1"] for p in pieces)
        self.x0 = self.pieces[0]["x0"]
        self.spans = []
        for i, piece in enumerate(self.pieces):
            if i and self.spans and not self.spans[-1]["text"].endswith(" "):
                self.spans.append({**self.spans[-1], "text": " "})
            self.spans.extend(piece["spans"])
        self.text = "".join(s["text"] for s in self.spans)
        sized = [s for s in self.spans if s["text"].strip()]
        self.size = max(round(s["size"], 1) for s in sized)
        self.kind = "row"


def collect(doc):
    """Visual rows and images in reading order, plus document-wide font facts."""
    items, sizes, bold_chars, plain_chars = [], Counter(), 0, 0
    edge = Counter()
    for pno in range(doc.page_count):
        page = doc[pno]
        height = page.rect.height
        pieces, images = [], []
        for block in page.get_text("dict")["blocks"]:
            if block["type"] == 1:
                images.append({"kind": "image", "page": pno, "y0": block["bbox"][1], "bbox": block["bbox"]})
                continue
            for line in block["lines"]:
                spans = []
                for span in line["spans"]:
                    text = clean(span["text"])
                    if text:
                        spans.append({**span, "text": text})
                if not any(s["text"].strip() for s in spans):
                    continue
                # A piece starts at its first visible character (leading spacer fragments are dropped).
                first = next(s for s in spans if s["text"].strip())
                pieces.append({"x0": first["bbox"][0], "y0": line["bbox"][1], "y1": line["bbox"][3], "spans": spans})
        pieces.sort(key=lambda p: (round(p["y0"]), p["x0"]))
        rows, current = [], []
        for piece in pieces:
            if current and abs(piece["y0"] - current[0]["y0"]) > 3:
                rows.append(Row(pno, current))
                current = []
            current.append(piece)
        if current:
            rows.append(Row(pno, current))
        for row in rows:
            for s in row.spans:
                if s["text"].strip() and not is_mono(s):
                    sizes[round(s["size"], 1)] += len(s["text"].strip())
            if row.y1 < height * 0.08 or row.y0 > height * 0.92:
                edge[normal_key(row.text)] += 1
            row.edge = row.y1 < height * 0.08 or row.y0 > height * 0.92
        merged = sorted(rows + images, key=lambda it: it.y0 if isinstance(it, Row) else it["y0"])
        items.extend(merged)
    body = sizes.most_common(1)[0][0] if sizes else 11.0
    for it in items:
        if isinstance(it, Row):
            for s in it.spans:
                if s["text"].strip() and round(s["size"], 1) == body and not is_mono(s):
                    if is_bold(s):
                        bold_chars += len(s["text"].strip())
                    else:
                        plain_chars += len(s["text"].strip())
    repeated = {key for key, count in edge.items() if count >= max(3, doc.page_count * 0.3)}
    items = [it for it in items if not (isinstance(it, Row) and it.edge and normal_key(it.text) in repeated)]
    items = [it for it in items if not (isinstance(it, Row) and END_MARKER.match(it.text.strip()))]
    bold_body = bold_chars > 1.5 * plain_chars
    return items, body, bold_body


def code_like(row):
    spans = [s for s in row.spans if s["text"].strip()]
    return all(is_mono(s) for s in spans) or any(colour(s) in SYNTAX_COLOURS for s in spans)


def mark_code(items):
    """Rows in monospace or syntax colours are code; plain rows between/next to code that look like code join them."""
    rows = [it for it in items if isinstance(it, Row)]
    flags = [code_like(r) for r in rows]
    for _ in range(3):
        for i, row in enumerate(rows):
            if flags[i]:
                continue
            near = [j for j in (i - 1, i + 1) if 0 <= j < len(rows) and flags[j] and rows[j].page == row.page and abs(rows[j].y0 - row.y0) < row.size * 3.2]
            if near and CODE_LINE.search(row.text):
                flags[i] = True
    for row, flag in zip(rows, flags):
        row.code = flag


def heading_size(row, body):
    if getattr(row, "code", False):
        return None
    text = row.text.strip()
    if not text or len(text) > 90 or text[-1] in ".,;:" and len(text) > 40:
        return None
    if row.size >= body + 1.4:
        return row.size
    return None


def inline(spans, bold_body):
    parts = []
    for span in spans:
        text = span["text"]
        if not text.strip():
            parts.append(text)
            continue
        lead, core, trail = text[: len(text) - len(text.lstrip())], text.strip(), text[len(text.rstrip()):]
        if is_mono(span):
            core = "`" + core.replace("`", "'") + "`"
        elif is_bold(span) and not bold_body:
            core = "**" + core.replace("*", "\\*") + "**"
        else:
            core = core.replace("*", "\\*")
        parts.append(lead + core + trail)
    return re.sub(r"\s+", " ", re.sub(r"\*\*\s*\*\*", "", "".join(parts))).strip()


def list_item(text):
    """Returns the item text when the row is a bullet or numbered list item, else None."""
    stripped = text.strip()
    if not stripped:
        return None
    if stripped[0] in BULLET_CHARS:
        return stripped[1:].strip()
    if re.match(r"^[-–*]\s*(\S|$)", stripped) and not re.match(r"^[-–*]{2,}", stripped) and not re.match(r"^-\d", stripped):
        return stripped[1:].strip()
    match = re.match(r"^\(?(\d{1,2}|[a-z])[.)]\s*(.*)$", stripped)
    if match and (match.group(2) or len(stripped) <= 4):
        return stripped
    return None


def find_tables(page):
    tables = []
    try:
        for table in page.find_tables().tables:
            raw = [[clean(c or "").replace("\n", " ").strip() for c in row] for row in table.extract()]
            rows = [[c for c in row if c] for row in raw if any(row)]
            if len(rows) < 2:
                continue
            width = Counter(len(r) for r in rows).most_common(1)[0][0]
            if width < 2 or sum(1 for r in rows if len(r) == width) < 0.7 * len(rows):
                continue
            tables.append((pymupdf.Rect(table.bbox), [(r + [""] * width)[:width] for r in rows]))
    except Exception:
        pass
    return tables


def render(doc, items, body, bold_body, heading_levels, outdir, lesson_no):
    out, images = [], []
    mode, buf, code_base = None, [], None
    last = None
    tables, emitted = {}, set()

    def flush():
        nonlocal mode, buf, code_base
        if buf:
            if mode == "code":
                out.append("```\n" + "\n".join(buf).strip("\n") + "\n```")
            elif mode == "list":
                out.append("\n".join(f"- {b}" for b in buf if b))
            else:
                out.append(" ".join(buf))
        mode, buf, code_base = None, [], None

    for index, it in enumerate(items):
        if not isinstance(it, Row):
            rect = pymupdf.Rect(it["bbox"])
            if rect.width < 60 or rect.height < 40:
                continue
            flush()
            name = f"lesson-{lesson_no}-figure-{len(images) + 1}.png"
            doc[it["page"]].get_pixmap(clip=rect, dpi=150).save(os.path.join(outdir, name))
            images.append(name)
            out.append(f"![Figure](asset:{name})")
            last = None
            continue
        row = it
        if row.page not in tables:
            tables[row.page] = find_tables(doc[row.page])
        hit = next((k for k, (rect, _) in enumerate(tables[row.page]) if rect.contains(pymupdf.Point(row.x0 + 1, row.y0 + 1)) and not row.code), None)
        if hit is not None:
            if (row.page, hit) not in emitted:
                flush()
                cells = tables[row.page][hit][1]
                esc = lambda c: c.replace("|", "\\|")
                out.append("\n".join(["| " + " | ".join(esc(c) for c in cells[0]) + " |", "| " + " | ".join("---" for _ in cells[0]) + " |"] + ["| " + " | ".join(esc(c) for c in r) + " |" for r in cells[1:]]))
                emitted.add((row.page, hit))
            continue
        gap = (row.y0 - last.y1) if (last is not None and last.page == row.page) else body * 2
        previous, last = last, row
        text = row.text.strip()
        if row.code:
            if mode != "code":
                flush()
                mode = "code"
            elif gap > body * 0.9:
                buf.append("")
            if code_base is None or row.x0 < code_base:
                code_base = row.x0 if code_base is None else code_base
            raw = "".join(s["text"] for s in row.spans).rstrip()
            # Indentation from the row's x position (about 4 spaces per 36pt tab stop), plus any leading spaces in the text.
            indent = max(0, round((row.x0 - code_base) / 9))
            buf.append(" " * indent + raw.lstrip() if indent else raw)
            continue
        size = heading_size(row, body)
        if size and size in heading_levels:
            flush()
            out.append("#" * heading_levels[size] + " " + text)
            continue
        item = list_item(text)
        if item is not None:
            if mode != "list":
                flush()
                mode = "list"
            buf.append(inline(row.spans, bold_body) if not text.startswith(("-", "–", "*")) and text[0] not in BULLET_CHARS else re.sub(r"^\s*[-–*" + re.escape(BULLET_CHARS) + r"]\s*", "", inline(row.spans, bold_body)))
            continue
        # In bold-body documents a short line followed by a list item is a sub-heading.
        nxt = next((n for n in items[index + 1: index + 3] if isinstance(n, Row)), None)
        if bold_body and len(text) < 70 and text[-1] not in ".,;" and nxt is not None and list_item(nxt.text) is not None and not getattr(nxt, "code", False):
            flush()
            out.append("### " + text.rstrip(":"))
            continue
        # Wrapped list item text: indented continuation directly under an item.
        if mode == "list" and buf and gap < body * 0.7 and previous is not None and row.x0 >= previous.x0 - 2:
            buf[-1] = (buf[-1] + " " + inline(row.spans, bold_body)).strip()
            continue
        if mode == "para" and gap < body * 0.75:
            buf.append(inline(row.spans, bold_body))
        else:
            flush()
            mode = "para"
            buf.append(inline(row.spans, bold_body))
    flush()
    return re.sub(r"\n{3,}", "\n\n", "\n\n".join(b for b in out if b.strip())), images


def chapter_starts(doc, items, body):
    """(item index, title, unit title) for each lesson."""
    toc = [(level, re.sub(r"\s+", " ", clean(title)).strip(), page) for level, title, page in doc.get_toc()]
    toc = [(level, title, page) for level, title, page in toc if len(title) >= 2 and not END_MARKER.match(title) and page >= 1]
    if len(toc) >= 2:
        levels = sorted({level for level, _, _ in toc})
        lesson_level = levels[1] if len(levels) > 1 and sum(1 for l, _, _ in toc if l == levels[1]) >= 2 else levels[0]
        unit_level = levels[0] if lesson_level != levels[0] else None
        starts, unit, seen = [], None, set()
        for level, title, page in toc:
            if unit_level is not None and level == unit_level:
                unit = title
                continue
            if level != lesson_level:
                continue
            prefix = title[:24].lower()
            idx = next((i for i, it in enumerate(items) if isinstance(it, Row) and it.page == page - 1 and prefix in clean(it.text).lower()), None)
            if idx is None:
                idx = next((i for i, it in enumerate(items) if (it.page if isinstance(it, Row) else it["page"]) >= page - 1), None)
            if idx is not None and idx not in seen:
                seen.add(idx)
                starts.append((idx, title, unit))
        starts.sort()
        if len(starts) >= 2:
            return starts
    sized = [(i, heading_size(it, body)) for i, it in enumerate(items) if isinstance(it, Row)]
    sized = [(i, s) for i, s in sized if s]
    counts = Counter(s for _, s in sized)
    for size in sorted(counts, reverse=True):
        if 2 <= counts[size] <= 300:
            return [(i, items[i].text.strip(), None) for i, s in sized if s == size]
    return [(0, "Full document", None)]


def main():
    pdf_path, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    items, body, bold_body = collect(doc)
    mark_code(items)
    starts = chapter_starts(doc, items, body)
    chapter_sizes = {heading_size(items[i], body) for i, _, _ in starts if isinstance(items[i], Row)} - {None}
    ceiling = min(chapter_sizes) if chapter_sizes else 1000
    used = Counter(s for s in (heading_size(it, body) for it in items if isinstance(it, Row)) if s and s < ceiling)
    inner = sorted([size for size, count in used.most_common() if count >= 2][:3], reverse=True)
    heading_levels = {size: 2 + n for n, size in enumerate(inner)}
    if starts[0][0] > 0:
        starts = [(0, "Introduction", starts[0][2])] + starts
    units, lesson_no = [], 0
    page_of = lambda it: it.page if isinstance(it, Row) else it["page"]
    for k, (index, title, unit) in enumerate(starts):
        end = starts[k + 1][0] if k + 1 < len(starts) else len(items)
        chunk = items[index:end]
        if chunk and isinstance(chunk[0], Row) and chunk[0].text.strip().lower().startswith(title[:24].lower()):
            chunk = chunk[1:]
        if not chunk:
            continue
        lesson_no += 1
        markdown, images = render(doc, chunk, body, bold_body, heading_levels, outdir, lesson_no)
        if not markdown.strip():
            lesson_no -= 1
            continue
        md_name = f"lesson-{lesson_no}.md"
        with open(os.path.join(outdir, md_name), "w", encoding="utf-8", newline="\n") as f:
            f.write(markdown + "\n")
        first = page_of(items[index]) + 1
        last = page_of(items[end - 1]) + 1 if end - 1 >= index else first
        unit_title = unit or "Course content"
        if not units or units[-1]["title"] != unit_title:
            units.append({"title": unit_title[:150], "lessons": []})
        units[-1]["lessons"].append({"title": title[:150] or f"Lesson {lesson_no}", "pages": [first, max(first, last)], "markdown": md_name, "images": images})
    with open(os.path.join(outdir, "manifest.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump({"units": units, "pages": doc.page_count, "boldBody": bold_body}, f, indent=1)
    print(json.dumps({"units": len(units), "lessons": lesson_no, "images": sum(len(l["images"]) for u in units for l in u["lessons"])}))


if __name__ == "__main__":
    main()
