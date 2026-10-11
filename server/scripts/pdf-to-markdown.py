"""Converts chapters of the Python course notes PDF into Markdown plus figure images.

Usage: python -I pdf_to_markdown.py <notes.pdf> <course.json> <output dir>
Writes <output dir>/chapter-<n>.md, figure PNGs, and manifest.json ({title, markdown file, images}).
The PDF is treated as data only.
"""
import json
import os
import re
import sys
import pymupdf

BULLET_CHARS = "•▪●"


def hexcolor(span):
    return f"{span['color']:06x}"


def is_code(span):
    return "Consolas" in span["font"] or "Courier" in span["font"]


def is_bold(span):
    return "Bold" in span["font"]


def inline(spans):
    """Joins spans into Markdown with **bold** and `code` (for inline code inside prose)."""
    out = []
    for span in spans:
        text = span["text"]
        if not text.strip():
            out.append(text)
            continue
        lead = text[: len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()):]
        core = text.strip().replace("*", "\\*")
        if is_code(span):
            core = "`" + text.strip().replace("`", "'") + "`"
        elif is_bold(span):
            core = f"**{core}**"
        out.append(lead + core + trail)
    joined = "".join(out)
    return re.sub(r"\*\*\s*\*\*", "", joined).replace("****", "")


def classify(line):
    spans = [s for s in line["spans"] if s["text"].strip()]
    if not spans:
        return None
    first = spans[0]
    text = "".join(s["text"] for s in line["spans"])
    size = round(first["size"], 1)
    color = hexcolor(first)
    if size <= 8.0 and "Page" in text:
        return "footer"
    if size >= 16.5 and is_bold(first):
        return "title"
    if size >= 12.5 and is_bold(first):
        return "h2"
    if 11.3 <= size <= 11.7 and is_bold(first):
        return "h3"
    if 10.9 <= size <= 11.1 and is_bold(first) and color == "c62828":
        return "h4"
    if "BoldItalic" in first["font"] and color == "555f6d":
        return "caption"
    if first["text"].strip() and first["text"].strip()[0] in BULLET_CHARS:
        return "bullet"
    if is_bold(first) and color == "555f6d" and text.strip().startswith("Output"):
        return "output"
    if is_code(first) and all(is_code(s) for s in spans):
        return "code"
    if is_bold(first) and color in ("1b5e20", "7f5000"):
        return "callout"
    return "text"


def find_tables(page):
    """Real tables in these notes start with a header row of white bold text on a coloured band.
    Code boxes and callouts are also drawn with borders, so only white-header regions count.
    Rows are rebuilt from text positions: the header's x positions define the columns."""
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = [s for s in line["spans"] if s["text"].strip()]
            if spans:
                lines.append((line, spans))
    headers = [(l, s) for l, s in lines if all(hexcolor(x) == "ffffff" for x in s)]
    if not headers:
        return []
    tables = []
    # Group header spans that share a y into one header row.
    by_y = {}
    for line, spans in headers:
        by_y.setdefault(round(line["bbox"][1]), []).extend(spans)
    try:
        candidates = [pymupdf.Rect(t.bbox) for t in page.find_tables().tables]
    except Exception:
        candidates = []
    for y, spans in sorted(by_y.items()):
        columns = sorted(round(s["bbox"][0]) for s in spans)
        header = [s["text"].strip() for s in sorted(spans, key=lambda s: s["bbox"][0])]
        region = next((r for r in candidates if r.y0 - 4 <= y <= r.y0 + 25), None)
        bottom = region.y1 if region else y + 400
        # Comparison tables have row labels left of the first header column (under an empty header cell).
        in_region = [s for l, ss in lines if y + 2 < l["bbox"][1] <= bottom for s in ss]
        if any(s["bbox"][0] < columns[0] - 8 for s in in_region):
            columns = [round(min(s["bbox"][0] for s in in_region))] + columns
            header = [""] + header
        rows = []
        if header[0] == "":
            # Row-label tables: each label starts a row; other cells join the row whose label is vertically nearest.
            labels = sorted([(l["bbox"][1], s) for l, ss in lines if y + 2 < l["bbox"][1] <= bottom for s in ss if s["bbox"][0] < columns[1] - 8], key=lambda t: t[0])
            for ly, span in labels:
                if rows and ly - rows[-1]["y"] < 8:
                    rows[-1]["cells"][0] += " " + span["text"].strip()
                else:
                    rows.append({"y": ly, "cells": [span["text"].strip()] + [""] * (len(columns) - 1)})
            for line, line_spans in lines:
                ly = line["bbox"][1]
                if not rows or not (y + 2 < ly <= bottom + 6):
                    continue
                for span in line_spans:
                    if span["bbox"][0] < columns[1] - 8:
                        continue
                    col = max(i for i, x in enumerate(columns) if x <= span["bbox"][0] + 4)
                    row = min(rows, key=lambda r: abs(r["y"] - ly))
                    text = inline([span]).strip()
                    row["cells"][col] = (row["cells"][col] + " " + text).strip()
            line_iter = []
        else:
            line_iter = sorted(lines, key=lambda ls: (round(ls[0]["bbox"][1]), ls[0]["bbox"][0]))
        for line, line_spans in line_iter:
            ly = line["bbox"][1]
            if ly <= y + 2 or ly > bottom:
                continue
            if region is None and rows and ly - rows[-1]["y"] > 30:
                break
            for span in line_spans:
                col = max([i for i, x in enumerate(columns) if x <= span["bbox"][0] + 4] or [0])
                starts_row = col == 0 and (not rows or ly - rows[-1]["y"] > 8)
                if starts_row or not rows:
                    rows.append({"y": ly, "cells": [""] * len(columns)})
                cell = rows[-1]["cells"][col]
                text = inline([span]).strip()
                rows[-1]["cells"][col] = (cell + " " + text).strip() if cell else text
        if rows:
            top = min(s["bbox"][1] for s in spans) - 6
            bbox = pymupdf.Rect(40, top, page.rect.width - 40, max(r["y"] for r in rows) + 14)
            tables.append((bbox, [header] + [r["cells"] for r in rows]))
    return tables


def dedent_output(lines):
    """Output lines after the first are indented to sit under the 'Output:' label; remove that alignment."""
    rest = [l for l in lines[1:] if l.strip()]
    if not rest:
        return lines
    pad = min(len(l) - len(l.lstrip(" ")) for l in rest)
    return [lines[0]] + [l[pad:] if l.strip() else l for l in lines[1:]]


def convert_chapter(doc, first, last, chapter_no, outdir):
    blocks_md = []
    images = []
    state = {"mode": None, "buffer": [], "last_y": None, "lang": "python"}

    def flush():
        mode, buf = state["mode"], state["buffer"]
        if not buf:
            state["mode"] = None
            return
        if mode == "code" or mode == "output":
            body = "\n".join(dedent_output(buf) if mode == "output" else buf).strip("\n").rstrip()
            if mode == "output":
                blocks_md.append("**Output:**\n\n```text\n" + body + "\n```")
            else:
                blocks_md.append("```python\n" + body + "\n```")
        elif mode == "para":
            blocks_md.append(" ".join(buf).strip())
        elif mode == "callout":
            blocks_md.append("> " + " ".join(buf).strip())
        elif mode == "list":
            blocks_md.append("\n".join(f"- {item.strip()}" for item in buf))
        state["buffer"], state["mode"] = [], None

    for page_no in range(first, last + 1):
        page = doc[page_no - 1]
        tables = find_tables(page)
        emitted_tables = set()
        items = []
        for block in page.get_text("dict", sort=True)["blocks"]:
            if block["type"] == 1:
                items.append(("image", block["bbox"][1], block))
                continue
            for line in block["lines"]:
                items.append(("line", line["bbox"][1], line))
        items.sort(key=lambda it: (round(it[1]), it[2]["bbox"][0] if it[0] == "line" else 0))
        pending_bullet = False
        for kind, y, item in items:
            if kind == "image":
                flush()
                rect = pymupdf.Rect(item["bbox"])
                if rect.width < 40 or rect.height < 40:
                    continue
                name = f"chapter-{chapter_no}-figure-{len(images) + 1}.png"
                page.get_pixmap(clip=rect, dpi=150).save(os.path.join(outdir, name))
                images.append(name)
                blocks_md.append(f"![Figure](asset:{name})")
                state["last_y"] = rect.y1
                continue
            line = item
            bbox = pymupdf.Rect(line["bbox"])
            inside = next((i for i, (rect, _) in enumerate(tables) if rect.contains(pymupdf.Point(bbox.x0 + 1, bbox.y0 + 1))), None)
            if inside is not None:
                if inside not in emitted_tables:
                    flush()
                    rows = tables[inside][1]
                    header = "| " + " | ".join(c.replace("|", "\\|") for c in rows[0]) + " |"
                    sep = "| " + " | ".join("---" for _ in rows[0]) + " |"
                    body = ["| " + " | ".join(c.replace("|", "\\|") for c in r) + " |" for r in rows[1:]]
                    blocks_md.append("\n".join([header, sep] + body))
                    emitted_tables.add(inside)
                continue
            kind_of = classify(line)
            if kind_of in (None, "footer", "title"):
                continue
            raw = "".join(s["text"] for s in line["spans"])
            gap = (y - state["last_y"]) if state["last_y"] is not None else 0
            state["last_y"] = line["bbox"][3]
            if kind_of in ("h2", "h3", "h4"):
                flush()
                level = {"h2": "##", "h3": "###", "h4": "####"}[kind_of]
                blocks_md.append(f"{level} {raw.strip()}")
                continue
            if kind_of == "caption":
                flush()
                if blocks_md and blocks_md[-1].startswith("![Figure]"):
                    blocks_md[-1] = blocks_md[-1].replace("![Figure]", f"![{raw.strip().replace(']', ')')}]") + f"\n\n*{raw.strip()}*"
                else:
                    blocks_md.append(f"*{raw.strip()}*")
                continue
            if kind_of == "bullet":
                if state["mode"] != "list":
                    flush()
                    state["mode"] = "list"
                rest = [s for s in line["spans"] if s["text"].strip() and s["text"].strip()[0] not in BULLET_CHARS]
                state["buffer"].append(inline(rest) if rest else "")
                pending_bullet = not rest
                continue
            if pending_bullet and state["mode"] == "list" and kind_of == "text":
                state["buffer"][-1] = (state["buffer"][-1] + " " + inline(line["spans"])).strip()
                pending_bullet = False
                continue
            if state["mode"] == "list" and kind_of == "text" and gap < 6 and state["buffer"]:
                state["buffer"][-1] += " " + inline(line["spans"]).strip()
                continue
            if kind_of == "output":
                flush()
                state["mode"] = "output"
                remainder = re.sub(r"^\s*Output:?\s*", "", raw)
                if remainder.strip():
                    state["buffer"].append(remainder.rstrip())
                continue
            if kind_of == "code":
                code_line = raw.rstrip("\n")
                if state["mode"] == "output" and any(hexcolor(s) == "6a1b9a" for s in line["spans"] if s["text"].strip()):
                    state["buffer"].append(code_line.rstrip())
                    continue
                if state["mode"] != "code":
                    flush()
                    state["mode"] = "code"
                elif gap > 9:
                    state["buffer"].append("")
                state["buffer"].append(code_line.rstrip())
                continue
            if kind_of == "callout":
                flush()
                state["mode"] = "callout"
                state["buffer"].append(inline(line["spans"]))
                continue
            # Plain prose: continue the current paragraph / callout when lines are close together.
            if state["mode"] in ("para", "callout") and gap < 7:
                state["buffer"].append(inline(line["spans"]).strip())
            else:
                flush()
                state["mode"] = "para"
                state["buffer"].append(inline(line["spans"]).strip())
        flush()
    markdown = "\n\n".join(b for b in blocks_md if b.strip())
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    return markdown, images


def main():
    pdf_path, course_path, outdir = sys.argv[1:4]
    os.makedirs(outdir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    course = json.load(open(course_path, encoding="utf-8"))
    manifest = []
    for module in course["modules"]:
        for lesson in module["lessons"]:
            if "pages" not in lesson:
                continue
            chapter_no = int(lesson["title"].split(".")[0])
            first, last = lesson["pages"]
            markdown, images = convert_chapter(doc, first, last, chapter_no, outdir)
            md_name = f"chapter-{chapter_no}.md"
            with open(os.path.join(outdir, md_name), "w", encoding="utf-8", newline="\n") as f:
                f.write(markdown + "\n")
            manifest.append({"title": lesson["title"], "markdown": md_name, "images": images, "characters": len(markdown)})
    with open(os.path.join(outdir, "manifest.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, indent=2)
    print(f"chapters {len(manifest)}, images {sum(len(m['images']) for m in manifest)}, largest {max(m['characters'] for m in manifest)} chars")


if __name__ == "__main__":
    main()
