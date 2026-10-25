"""Pseudocode and a plain-language explanation for each coding problem, made from its reference solution.

build-problems.py calls make(problem) for every problem. C, Java and Python solutions are turned into pseudocode line by line
(READ / PRINT / SET / IF / FOR / WHILE / FUNCTION ...); the explanation walks through those lines in English and adds the idea behind
the topic and a worked example from the first sample. Tracks whose answer is not a program (SQL, HTML & CSS, React, Git, DevOps) get nothing.
"""
import re

KEYWORDS = {"if", "for", "while", "switch", "else", "do", "return", "sizeof", "case"}
TYPE_RE = r"(?:(?:const|static|unsigned|signed|volatile|register|auto|extern|final|private|public)\s+)*(?:(?:int|long long|long|short|double|float|char|size_t|bool|boolean|void|String)(?:\[\])*|struct\s+\w+|union\s+\w+|\w+_t)"
CAST_RE = re.compile(r"(?<!sizeof)\(\s*(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:int|long long|long|short|double|float|char|size_t|unsigned char|unsigned int)\s*\*?\s*\)\s*")
FMT_RE = re.compile(r"%[-+ 0#]*\d*(?:\.\d+)?(?:hh|h|ll|l|z|j|t|L)?[diouxXfFeEgGcsp%]")


# ---------------------------------------------------------------- helpers
def split_top(text, sep=","):
    """Splits on `sep` outside brackets and quotes."""
    parts, depth, cur, quote = [], 0, "", None
    for ch in text:
        if quote:
            cur += ch
            if ch == quote and not cur.endswith("\\" + quote):
                quote = None
            continue
        if ch in "\"'":
            quote = ch
            cur += ch
        elif ch in "([{":
            depth += 1
            cur += ch
        elif ch in ")]}":
            depth -= 1
            cur += ch
        elif ch == sep and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    parts.append(cur)
    return [p.strip() for p in parts]


def balanced_end(text, start):
    """Index just after the parenthesis that opens at text[start]."""
    depth, quote = 0, None
    for i in range(start, len(text)):
        ch = text[i]
        if quote:
            if ch == quote and text[i - 1] != "\\":
                quote = None
            continue
        if ch in "\"'":
            quote = ch
        elif ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return i + 1
    return len(text)


JAVA = [False]


def expr(e):
    """C / Java expression in pseudocode words."""
    e = e.strip()
    if JAVA[0]:
        e = e.replace("->", "=>")
        e = re.sub(r"\bin\.next(?:Int|Long|Double|Boolean)\(\)", "the next number read", e)
        e = re.sub(r"\bin\.nextLine\(\)", "the next line read", e)
        e = re.sub(r"\bin\.next\(\)", "the next word read", e)
        e = re.sub(r"\bnew\s+(?=[A-Z])", "", e)
        e = e.replace("System.out::println", "print")
    e = CAST_RE.sub("", e)
    e = re.sub(r"\bNULL\b", "NULL", e)
    e = e.replace("&&", " AND ").replace("||", " OR ")
    e = re.sub(r"!(?!=)", "NOT ", e)
    e = e.replace("==", " = ").replace("!=", " ≠ ")
    e = re.sub(r"(?<![<>=!])(?<=\w|\)|\])\s*%\s*(?=\w|\()", " MOD ", e)
    e = e.replace("->", ".")
    e = re.sub(r"(?<![\w\]\)])&(?=\w)", "", e)  # address-of
    e = re.sub(r"\s+", " ", e)
    return e.strip()


def call_args(text):
    inner = text[text.index("(") + 1: text.rindex(")")]
    return split_top(inner)


def string_text(literal):
    """Unquoted, unescaped text of a C string literal (\\n becomes a space marker)."""
    body = literal.strip()[1:-1]
    return body.replace("\\n", "⏎").replace("\\t", " ").replace('\\"', '"').replace("\\\\", "\\")


SEPARATOR = re.compile(r'''\?\s*(?:"(?: |\\n)*"|\'(?: |\\n)\')\s*:\s*(?:"(?: |\\n)*"|\'(?: |\\n)\')\s*$''')


def print_stmt(args, newline_default=False):
    if not args:
        return "PRINT new line"
    first = args[0].strip()
    if first.startswith('"'):
        text = string_text(first)
        rest = args[1:]
        pieces, idx, last = [], 0, 0
        out = ""
        for m in FMT_RE.finditer(text):
            out += text[last:m.start()]
            last = m.end()
            if m.group() == "%%":
                out += "%"
            elif idx < len(rest):
                if not SEPARATOR.search(rest[idx]) and not re.fullmatch(r"""["'](?: |\\n)*["']""", rest[idx].strip()):
                    out += "{" + expr(rest[idx]) + "}"
                idx += 1
        out += text[last:]
        out = out.rstrip("⏎").replace("⏎", " / ").strip()
        if not out:
            return "PRINT new line"
        if re.fullmatch(r"\{[^{}]*\}", out):
            return "PRINT " + out[1:-1]
        return 'PRINT "' + out + '"'
    return "PRINT " + ", ".join(expr(a) for a in args)


def declarators(rest):
    """`a = 1, b, c[5] = {0}` -> SET lines for those that have a value."""
    lines = []
    for d in split_top(rest):
        d = d.strip().lstrip("*").strip()
        if "=" in d and "==" not in d and "(" not in d.split("=")[0]:
            name, val = d.split("=", 1)
            name = re.sub(r"\[.*?\]", "", name).strip().lstrip("*")
            val = val.strip()
            if re.fullmatch(r"in\.next\w*\(\)", val):
                lines.append(f"READ {name}")
            elif val in ("{0}", "{ 0 }"):
                lines.append(f"SET {name} = all zeros")
            elif val.startswith("{"):
                lines.append(f"SET {name} = {val}")
            else:
                lines.append(f"SET {name} = {expr(val)}")
    return lines


def statement(s, ctx):
    """One C / Java statement (no trailing ;) as zero or more pseudocode lines."""
    s = s.strip()
    if not s:
        return []
    m = re.match(r"^(?:(?:else)\s+)?return\b\s*(.*)$", s)
    if m:
        if ctx.get("in_main") and m.group(1).strip() in ("0", "1", ""):
            return [] if m.group(1).strip() == "0" else ["STOP"]
        return ["RETURN " + expr(m.group(1))] if m.group(1).strip() else ["RETURN"]
    if s.startswith("Locale.setDefault"):
        return []
    m = re.match(r"^throw\s+(?:new\s+)?(.*)$", s)
    if m:
        return ["THROW " + expr(m.group(1))]
    if s == "break":
        return [] if ctx.get("in_switch") else ["BREAK"]
    if s == "continue":
        return ["CONTINUE"]
    if re.match(r"^(printf|fprintf)\s*\(", s):
        args = call_args(s)
        if s.startswith("fprintf"):
            args = args[1:]
        return [print_stmt(args)]
    if re.match(r"^(puts)\s*\(", s):
        return ["PRINT " + expr(call_args(s)[0]).strip('"')]
    if re.match(r"^putchar\s*\(", s):
        return ["PRINT " + expr(call_args(s)[0])]
    m = re.match(r"^System\.out\.(println|print|printf)\s*\((.*)\)$", s)
    if m:
        if m.group(1) == "printf":
            return [print_stmt(split_top(m.group(2)))]
        inner = m.group(2).strip()
        if inner.startswith('"') and inner.endswith('"') and inner.count('"') == 2:
            return [f'PRINT "{inner[1:-1]}"']
        return ["PRINT " + (re.sub(r'\s*\+\s*', " + ", inner) if inner else "new line")]
    if re.match(r"^scanf\s*\(", s):
        args = call_args(s)[1:]
        return ["READ " + ", ".join(expr(a) for a in args)]
    if re.match(r"^fgets\s*\(", s):
        return ["READ a line into " + expr(call_args(s)[0])]
    if re.match(r"^(free)\s*\(", s):
        return ["FREE " + expr(call_args(s)[0])]
    if re.match(r"^Scanner\b|^\w+\s+\w+\s*=\s*new Scanner", s) or s.startswith("import "):
        return []
    if re.match(r"^(case\b.*?:|default:)", s):
        m = re.match(r"^(case\s+(.*?)\s*:|default\s*:)\s*(.*)$", s)
        label = "DEFAULT:" if m.group(1).startswith("default") else f"CASE {expr(m.group(2))}:"
        rest = m.group(3).strip()
        out = [label]
        if rest:
            out += ["  " + x for x in statement(rest.rstrip(";"), ctx)]
        return out
    m = re.match(r"^\w[\w\s]*\(\s*\*+\s*(\w+)[^)]*\)\s*(?:\(.*?\)|\[.*?\])\s*=\s*(.+)$", s)
    if m:
        return [f"SET {m.group(1)} = {expr(m.group(2))}"]
    m = re.match(r"^(" + TYPE_RE + r")(?:\s+|\s*\*+\s*)(?!\()(\*?\s*\w.*)$", s)
    if m and not re.match(r"^(return|else|goto|case)\b", s):
        return declarators(m.group(2))
    m = re.match(r"^[A-Z]\w*(?:<.*?>)?(?:\[\])?\s+(\w+)\s*=\s*(.+)$", s)  # Java: Rectangle r = new Rectangle(...)
    if m:
        return [f"SET {m.group(1)} = {expr(re.sub(r'^new\s+', '', m.group(2)))}"]
    m = re.match(r"^(.+?)\s*(\+|-|\*|/|%|<<|>>|&|\||\^)=\s*(.+)$", s)
    if m:
        return [f"SET {expr(m.group(1))} = {expr(m.group(1))} {expr(m.group(2)) if m.group(2) != '%' else 'MOD'} {expr(m.group(3))}"]
    m = re.match(r"^(\+\+|--)\s*([^=?]+)$|^([^=?]+?)\s*(\+\+|--)$", s)
    if m:
        name = expr((m.group(2) or m.group(3)).strip().strip("()").lstrip("*") if (m.group(2) or m.group(3)).strip().startswith("(*") else (m.group(2) or m.group(3)))
        op = m.group(1) or m.group(4)
        return [f"{'INCREASE' if op == '++' else 'DECREASE'} {name} BY 1"]
    m = re.match(r"^([^?=]+?)\s*\?\s*([^:]+?)\s*:\s*(.+)$", s)
    if m and "=" not in m.group(1) and "(" not in m.group(1).split("?")[0][:0]:
        return [f"IF {expr(m.group(1))} THEN"] + ["  " + x for x in statement(m.group(2), ctx)] + ["ELSE"] + ["  " + x for x in statement(m.group(3), ctx)] + ["END IF"]
    m = re.match(r"^([^=!<>]+?)\s=\s*(.+)$|^([^=!<>\s]+)=(?!=)(.+)$", s)
    if m and "(" not in (m.group(1) or "").split("[")[0]:
        left = m.group(1) or m.group(3)
        right = m.group(2) or m.group(4)
        if re.fullmatch(r"in\.next\w*\(\)", right.strip()):
            return [f"READ {expr(left)}"]
        return [f"SET {expr(left)} = {expr(right)}"]
    m = re.match(r"^(\w[\w\.]*)\s*\((.*)\)$", s)
    if m:
        return [f"CALL {m.group(1)}({', '.join(expr(a) for a in split_top(m.group(2)) if a)})"]
    return [expr(s)]


def for_header(inner):
    parts = split_top(inner, ";")
    if len(parts) != 3:
        return f"FOR {expr(inner)}"
    init, cond, step = (p.strip() for p in parts)
    m_init = re.match(r"^(?:" + TYPE_RE + r"\s*)?\*{0,2}\s*(\w+)\s*=\s*(.+)$", init)
    m_cond = re.match(r"^(\w+)\s*(<=|<|>=|>|!=)\s*(.+)$", cond)
    one_var = m_init and "," not in init
    if one_var and m_cond and m_init.group(1) == m_cond.group(1):
        v, start = m_init.group(1), expr(m_init.group(2))
        op, bound = m_cond.group(2), expr(m_cond.group(3))
        step = step.strip()
        if re.fullmatch(rf"{v}\+\+|\+\+{v}", step) or re.fullmatch(rf"{v}\s*\+=\s*1", step):
            if op == "<=":
                return f"FOR {v} FROM {start} TO {bound}"
            if op == "<":
                return f"FOR {v} FROM {start} TO {bound} - 1"
        m_step = re.fullmatch(rf"{v}\s*\+=\s*(\w+)", step)
        if m_step and op in ("<=", "<"):
            return f"FOR {v} FROM {start} TO {bound}{' - 1' if op == '<' else ''} STEP {m_step.group(1)}"
        if re.fullmatch(rf"{v}--|--{v}|{v}\s*-=\s*1", step):
            if op == ">=":
                return f"FOR {v} FROM {start} DOWN TO {bound}"
            if op == ">":
                return f"FOR {v} FROM {start} DOWN TO {bound} + 1"
    if one_var and m_cond is None and cond:
        pass
    if one_var and cond:
        v = m_init.group(1)
        m_inc = re.fullmatch(rf"{v}\+\+|\+\+{v}", step.strip())
        m_dec = re.fullmatch(rf"{v}--|--{v}", step.strip())
        tail = "" if m_inc else (" STEP -1" if m_dec else (f" ({expr(' '.join(statement(step, {})))})" if step else ""))
        return f"FOR {v} FROM {expr(m_init.group(2))} WHILE {expr(cond)}{tail}"
    if not init and cond:
        return f"WHILE {expr(cond)}" + (f" (after each pass: {', '.join(step_text(p) for p in split_top(step))})" if step else "")
    pieces = []
    if init:
        pieces.append("start with " + ", ".join(x for x in (re.sub(r"^" + TYPE_RE + r"\s+", "", p) for p in split_top(init)) if x))
    if cond:
        pieces.append("while " + expr(cond))
    if step:
        pieces.append("after each pass " + ", ".join(step_text(p) for p in split_top(step)))
    return "FOR (" + "; ".join(pieces) + ")"


# ---------------------------------------------------------------- C / Java
def match_brace(text, i):
    """Index of the } that closes the { at text[i], or -1."""
    depth, quote = 0, None
    for k in range(i, len(text)):
        ch = text[k]
        if quote:
            if ch == quote and text[k - 1] != "\\":
                quote = None
            continue
        if ch in "\"'":
            quote = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return k
    return -1


def split_statements(body):
    """`a; b; if (c) d; else e;` -> ['a;', 'b;', 'if (c) d; else e;']"""
    pieces = [p for p in split_top(body, ";") if p.strip()]
    out = []
    for p in pieces:
        if re.match(r"^else\b", p) and out:
            out[-1] = out[-1].rstrip(";") + "; " + p + ";"
        else:
            out.append(p + ";")
    return out


def normalize(line):
    """Breaks one-line blocks (`if (c) { a; b; }`, `int f() { return 1; }`, `a = 1; b = 2;`) into separate lines."""
    s = line.strip()
    if not s:
        return []
    lead = ""
    body_start = s
    if s.startswith("}") and s not in ("}", "};"):
        lead, body_start = "} ", s[1:].strip()
    for m in re.finditer(r"\{", body_start):
        before = body_start[:m.start()].rstrip()
        if not (before.endswith(")") or before in ("else", "do") or before.endswith(" else")):
            continue
        j = match_brace(body_start, m.start())
        if j < 0:
            continue
        inner, tail = body_start[m.start() + 1:j].strip(), body_start[j + 1:].strip()
        if not inner and not tail:
            return [line]
        out = [lead + before + " {"]
        for st in split_statements(inner):
            out += normalize(st)
        if tail.startswith("else") or tail.startswith("while"):
            out += normalize("} " + tail)
        else:
            out.append("}" + (" " + tail if tail else ""))
        return out
    if not re.match(r"^(for|while|if|else|do|switch|case|default)\b", s) and not s.startswith("}") and len(split_top(s.rstrip(";"), ";")) > 1:
        return [p + ";" for p in split_top(s.rstrip(";"), ";") if p]
    return [line]


def step_text(step):
    """`i++` -> `i = i + 1`, `t /= 10` -> `t = t / 10`"""
    lines = statement(step.strip(), {})
    if not lines:
        return ""
    t = lines[0]
    m = re.match(r"^(INCREASE|DECREASE) (.*) BY 1$", t)
    if m:
        return f"{m.group(2)} = {m.group(2)} {'+' if m.group(1) == 'INCREASE' else '-'} 1"
    return t[4:] if t.startswith("SET ") else t


def c_like(code, java=False):
    JAVA[0] = java
    out, stack = [], []
    chain = [False]  # an `if (...) stmt;` whose END IF has not been written yet

    def depth():
        return sum(1 for _, show in stack if show)

    def put(text, shift=0):
        out.append("  " * (depth() + shift) + text)

    def ctx():
        nearest = next((k for k, _ in reversed(stack) if k in ("switch", "case", "for", "while", "do")), None)
        return {"in_main": any(k == "main" for k, _ in stack), "in_switch": nearest in ("switch", "case")}

    pending_cases = []

    def flush_cases():
        while stack and stack[-1][0] == "case":
            stack.pop()
        put("DEFAULT:" if pending_cases == ["default"] else "CASE " + ", ".join(pending_cases) + ":")
        stack.append(("case", True))
        pending_cases.clear()

    def flush():
        if chain[0]:
            chain[0] = False
            put("END IF")

    def close(kind, show):
        label = {"try": "END TRY", "lambda": None, "if": "END IF", "for": "END FOR", "while": "END WHILE", "do": "END REPEAT", "switch": "END CHECK", "func": "END FUNCTION", "struct": "END STRUCTURE", "union": "END UNION", "class": "END CLASS", "else": "END IF"}.get(kind)
        if show and label:
            put(label)

    def handle(line):
        if not line or line.startswith(("#", "//", "using ", "import ")):
            return
        if "//" in line and '"' not in line:
            line = line.split("//")[0].strip()
        if chain[0] and not re.match(r"^else\b", line):
            flush()
        m = re.match(r"^}\s*catch\s*\((?:final\s+)?([\w\s|]+?)\s+\w+\)\s*\{$", line)
        if m:
            put("ON ERROR " + m.group(1).strip().replace("|", " or "), -1)
            return
        if re.match(r"^}\s*finally\s*\{$", line):
            put("ALWAYS", -1)
            return
        if line == "try {" or re.match(r"^try\s*\(.*\)\s*\{$", line):
            inner = re.match(r"^try\s*\((.*)\)\s*\{$", line)
            put("TRY" + (" WITH " + ", ".join(re.sub(r"^\w[\w<>]*\s+(\w+)\s*=.*$", r"\1", p.strip()) for p in split_top(inner.group(1), ";") if p.strip()) if inner else ""))
            stack.append(("try", True))
            return
        if re.match(r"^}\s*\)+\s*;?$", line) or re.match(r"^}\s*\)+\s*\.\w+.*$", line):
            while stack and stack[-1][0] == "case":
                stack.pop()
            if stack:
                kind, show = stack.pop()
                close(kind, show)
            return
        if line.endswith("{") and ("->" in line or re.search(r"\bnew\s+\w[\w<>]*\s*\([^)]*\)\s*\{$", line)) and not re.match(r"^(if|for|while|switch|else)\b", line):
            head = line[:-1].rstrip()
            head = re.sub(r"\(([^()]*)\)\s*->$", r"(\1) ->", head)
            shown = statement(head.rstrip("->").rstrip() + " ...", ctx()) if "->" in head else statement(head + " ...", ctx())
            put((shown[0] if shown else "CALL anonymous task") + " WHERE THE STEPS ARE:")
            stack.append(("lambda", True))
            return
        if line in ("}", "};") or re.match(r"^}\s*\w+(?:\s*,\s*\*?\w+)*\s*;$", line):
            while stack and stack[-1][0] == "case":
                stack.pop()
            if stack:
                kind, show = stack.pop()
                close(kind, show)
            while stack and stack[-1][0].endswith("+"):
                kind, _ = stack.pop()
                close(kind[:-1], True)
            return
        if pending_cases and not re.match(r"^(case\b|default\s*:)", line):
            flush_cases()
        m = re.match(r"^}\s*(else\b.*)$", line)
        if m and not line.endswith("{"):
            stack.pop()
            handle(m.group(1))
            return
        m = re.match(r"^}\s*else\s+if\s*\((.*)\)\s*\{$", line)
        if m:
            stack.pop()
            stack.append(("if", True))
            put(f"ELSE IF {expr(m.group(1))} THEN", -1)
            return
        if re.match(r"^}\s*else\s*\{$", line):
            stack.pop()
            stack.append(("else", True))
            put("ELSE", -1)
            return
        m = re.match(r"^}\s*while\s*\((.*)\)\s*;$", line)
        if m:
            stack.pop()
            put(f"REPEAT WHILE {expr(m.group(1))}")
            return
        mm = re.match(r"^(for|while)\s*\(", line)
        if mm and line.endswith("{"):
            start = line.index("(")
            end = balanced_end(line, start)
            rest = line[end:].strip()
            if rest and rest != "{":
                header = for_header(line[start + 1:end - 1]) if mm.group(1) == "for" else f"WHILE {expr(line[start + 1:end - 1])}"
                put(header)
                stack.append(("while+" if header.startswith("WHILE") else "for+", True))
                handle(rest)
                return
        if line.endswith("{") and not line.startswith(("}", "=")):
            head = line[:-1].strip()
            m = re.match(r"^(?:else\s+)?if\s*\((.*)\)$", head)
            if m:
                if head.startswith("else"):
                    chain[0] = False
                put(("ELSE IF " if head.startswith("else") else "IF ") + expr(m.group(1)) + " THEN")
                stack.append(("if", True))
                return
            m = re.match(r"^for\s*\((.*)\)$", head)
            if m:
                header = for_header(m.group(1))
                put(header)
                stack.append(("while" if header.startswith("WHILE") else "for", True))
                return
            m = re.match(r"^while\s*\((.*)\)$", head)
            if m:
                put(f"WHILE {expr(m.group(1))}")
                stack.append(("while", True))
                return
            if head == "do":
                put("REPEAT")
                stack.append(("do", True))
                return
            if head == "else":
                chain[0] = False
                put("ELSE")
                stack.append(("else", True))
                return
            m = re.match(r"^switch\s*\((.*)\)$", head)
            if m:
                put(f"CHECK {expr(m.group(1))}")
                stack.append(("switch", True))
                return
            m = re.match(r"^(?:typedef\s+)?(struct|union)\s*(\w*)$", head)
            if m:
                put((f"STRUCTURE {m.group(2)}" if m.group(1) == "struct" else f"UNION {m.group(2)}").strip())
                stack.append(("struct" if m.group(1) == "struct" else "union", True))
                return
            m = re.match(r"^(?:(?:public|private|abstract|final|static)\s+)*(?:class|interface)\s+(\w+)(?:\s+extends\s+(\w+))?", head)
            if m and m.group(1) == "Main":
                stack.append(("block", False))
                return
            if m:
                put(f"CLASS {m.group(1)}" + (f" EXTENDS {m.group(2)}" if m.group(2) else ""))
                stack.append(("class", True))
                return
            m = re.match(r"^(?:[\w<>\[\]\*\s,]+?\s+)?(\*?\s*\w+)\s*\(([^)]*)\)\s*(?:throws \w+)?$", head)
            if m and m.group(1).strip("* ") not in KEYWORDS:
                name = m.group(1).strip("* ")
                params = [re.sub(r"\[.*?\]", "", re.sub(r".*?(\w+)\s*(\[.*\])?$", r"\1", p.strip())) for p in split_top(m.group(2)) if p.strip() and p.strip() != "void"]
                if name == "main":
                    stack.append(("main", False))
                else:
                    put(f"FUNCTION {name}({', '.join(params)})")
                    stack.append(("func", True))
                return
            stack.append(("block", False))
            return
        m = re.match(r"^(?:case\s+(.*?)|default)\s*:\s*(.*)$", line)
        if m and (line.startswith("case") or line.startswith("default")):
            rest = line
            while True:
                mm = re.match(r"^(?:case\s+(.*?)|default)\s*:\s*(.*)$", rest)
                if not mm or not (rest.startswith("case") or rest.startswith("default")):
                    break
                pending_cases.append("default" if rest.startswith("default") else expr(mm.group(1)))
                rest = mm.group(2).strip()
            if rest:
                flush_cases()
                for part in split_statements(rest):
                    for sub in normalize(part):
                        handle(sub.strip())
                flush()
            return
        if stack and stack[-1][0] in ("struct", "union"):
            if re.match(r"^" + TYPE_RE + r"\s*[\*\s]*\w+", line):
                put("FIELD " + re.sub(r"^.*?(\w+)\s*(\[.*)?$", r"\1", line.rstrip(";").split(",")[0].strip()))
                return
        m = re.match(r"^(else\s+)?if\s*\(", line)
        if m:
            start = line.index("(")
            end = balanced_end(line, start)
            cond, rest = line[start + 1:end - 1], line[end:].strip()
            put(("ELSE IF " if m.group(1) else "IF ") + expr(cond) + " THEN")
            if rest and rest.rstrip(";").strip():
                mm = re.match(r"^(.*?;)\s*else\s+(.*)$", rest)
                chain[0] = False
                stack.append(("inline", True))
                handle((mm.group(1) if mm else rest).strip())
                flush()
                stack.pop()
                if mm:
                    put("ELSE")
                    stack.append(("inline", True))
                    handle(mm.group(2).strip())
                    flush()
                    stack.pop()
                    put("END IF")
                else:
                    chain[0] = True
            return
        m = re.match(r"^else\b\s*(.*)$", line)
        if m:
            rest = m.group(1).strip()
            chain[0] = False
            put("ELSE")
            if rest:
                stack.append(("inline", True))
                handle(rest)
                flush()
                stack.pop()
            put("END IF")
            return
        m = re.match(r"^(for|while)\s*\(", line)
        if m:
            start = line.index("(")
            end = balanced_end(line, start)
            rest = line[end:].strip()
            header = for_header(line[start + 1:end - 1]) if m.group(1) == "for" else f"WHILE {expr(line[start + 1:end - 1])}"
            kind = "while" if header.startswith("WHILE") else "for"
            put(header + ("" if rest.rstrip(";") else " DO nothing"))
            if rest.rstrip(";"):
                stack.append((kind, True))
                handle(rest)
                flush()
                stack.pop()
                put("END " + kind.upper())
            return
        for text in statement(line.rstrip(";"), ctx()):
            if text:
                put(text)

    lines = [x.strip() for raw in code.split("\n") for x in normalize(raw)]
    merged_lines = []
    for x in lines:
        if merged_lines and merged_lines[-1] == "}" and re.match(r"^else\b", x):
            merged_lines[-1] = "} " + x  # `}` and `else ...` on separate lines are one if/else
        else:
            merged_lines.append(x)
    for line in merged_lines:
        handle(line)
    flush()
    merged = []
    for line in out:
        if merged and line.strip().startswith("READ ") and merged[-1].strip().startswith("READ ") and not any(k in line + merged[-1] for k in ("line", "word")) \
                and len(line) - len(line.lstrip()) == len(merged[-1]) - len(merged[-1].lstrip()):
            merged[-1] = merged[-1] + ", " + line.strip()[5:]
        else:
            merged.append(line)
    return "\n".join(merged)


# ---------------------------------------------------------------- Python
def py_expr(e):
    e = e.strip()
    if e in ("{}", "dict()"):
        return "an empty dictionary"
    if e in ("[]", "list()"):
        return "an empty list"
    if e == "set()":
        return "an empty set"
    e = re.sub(r"(?:list\()?map\((?:int|float),\s*input\(\)\.split\(\)\)\)?", "the numbers on the input line", e)
    e = e.replace("input().split()", "the words on the input line").replace("int(input())", "the number read").replace("input()", "the line read")
    e = re.sub(r"\band\b", "AND", e)
    e = re.sub(r"\bor\b", "OR", e)
    e = re.sub(r"\bnot\b", "NOT", e)
    e = e.replace("==", " = ").replace("!=", " ≠ ").replace("//", " DIV ").replace("**", "^")
    e = re.sub(r"\s%\s", " MOD ", e)
    e = re.sub(r"\bTrue\b", "true", e)
    e = re.sub(r"\bFalse\b", "false", e)
    e = re.sub(r"\bNone\b", "nothing", e)
    return re.sub(r"\s+", " ", e).strip()


def py_print(args):
    parts = [a for a in args if not re.match(r"^(end|sep|file)\s*=", a)]
    out = []
    for a in parts:
        a = a.strip()
        m = re.match(r"^f(['\"])(.*)\1$", a)
        if m:
            out.append('"' + m.group(2) + '"')
        else:
            out.append(py_expr(a))
    if len(out) == 1 and out[0].startswith('"{') and out[0].endswith('}"') and out[0].count("{") == 1:
        return "PRINT " + out[0][2:-2]
    return "PRINT " + ", ".join(out) if out else "PRINT new line"


def py_statement(s):
    s = s.strip()
    if not s or s == "pass" or s.startswith(("import ", "from ")):
        return []
    if ";" in s and not s.startswith(("print(", "return")):
        return [x for part in split_top(s, ";") for x in py_statement(part)]
    m = re.match(r"^(\w[\w\.\[\]]*)\.append\((.*)\)$", s)
    if m:
        return [f"ADD {py_expr(m.group(2))} TO {m.group(1)}"]
    m = re.match(r"^(\w+(?:\s*,\s*\w+)*)\s*=\s*(.*input\(\).*)$", s)
    if m and not s.startswith("print"):
        what = m.group(2)
        kind = "READ list " if ("list(" in what or "for _ in" in what or "split()" in what and "int" in what and "," not in m.group(1)) else "READ "
        return [kind + m.group(1)]
    if s in ("break", "continue"):
        return [s.upper()]
    m = re.match(r"^return\b\s*(.*)$", s)
    if m:
        return ["RETURN " + py_expr(m.group(1))] if m.group(1) else ["RETURN"]
    m = re.match(r"^print\s*\((.*)\)$", s)
    if m:
        return [py_print(split_top(m.group(1)))]
    m = re.match(r"^(\w+(?:\s*,\s*\w+)*)\s*=\s*int\(input\(\)\)$|^(\w+)\s*=\s*int\(input\(\)\)$", s)
    if m:
        return ["READ " + (m.group(1) or m.group(2))]
    m = re.match(r"^(\w+(?:\s*,\s*\w+)*)\s*=\s*(?:list\()?map\((?:int|float),\s*input\(\)\.split\(\)\)\)?$", s)
    if m:
        many = "," in m.group(1) or "list(" in s
        return [("READ list " if "list(" in s else "READ ") + m.group(1)]
    m = re.match(r"^(\w+)\s*=\s*input\(\)(?:\.strip\(\))?$", s)
    if m:
        return [f"READ {m.group(1)}"]
    m = re.match(r"^(\w+)\s*=\s*input\(\)\.split\(\)$", s)
    if m:
        return [f"READ words into {m.group(1)}"]
    if s == "input()":
        return ["READ a line"]
    m = re.match(r"^(.+?)\s*(\+|-|\*|//|/|%|\*\*)=\s*(.+)$", s)
    if m:
        op = {"//": "DIV", "%": "MOD", "**": "^"}.get(m.group(2), m.group(2))
        return [f"SET {m.group(1)} = {m.group(1)} {op} {py_expr(m.group(3))}"]
    m = re.match(r"^([^=!<>]+?)\s=\s(.+)$", s)
    if m:
        return [f"SET {py_expr(m.group(1))} = {py_expr(m.group(2))}"]
    m = re.match(r"^([\w\.]+)\s*\((.*)\)$", s)
    if m:
        return [f"CALL {m.group(1)}({', '.join(py_expr(a) for a in split_top(m.group(2)) if a)})"]
    return [py_expr(s)]


def python(code):
    out, stack = [], []  # stack of (indent, kind)

    def close_to(indent, next_line=""):
        while stack and stack[-1][0] >= indent:
            ind, kind = stack[-1]
            if ind == indent and kind in ("if", "try") and re.match(r"^(elif|else|except|finally)\b", next_line):
                return
            stack.pop()
            label = {"if": "END IF", "for": "END FOR", "while": "END WHILE", "func": "END FUNCTION", "class": "END CLASS", "try": "END TRY", "main": None}.get(kind)
            if label:
                out.append("  " * depth() + label)

    def depth():
        return sum(1 for _, k in stack if k != "main")

    for raw in code.split("\n"):
        if not raw.strip() or raw.strip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip())
        line = raw.strip()
        close_to(indent, line)
        continues = bool(stack) and stack[-1][0] == indent and stack[-1][1] in ("if", "try") and re.match(r"^(elif|else|except|finally)\b", line)
        pad = "  " * (depth() - 1 if continues else depth())
        if re.match(r"^if __name__ == ['\"]__main__['\"]:$", line):
            stack.append((indent, "main"))
            continue
        m = re.match(r"^def\s+(\w+)\s*\((.*)\)\s*(?:->.*)?:$", line)
        if m:
            params = [p.split("=")[0].split(":")[0].strip() for p in split_top(m.group(2)) if p.strip()]
            out.append(f"{pad}FUNCTION {m.group(1)}({', '.join(params)})")
            stack.append((indent, "func"))
            continue
        m = re.match(r"^class\s+(\w+)(?:\((\w+)\))?:$", line)
        if m:
            out.append(f"{pad}CLASS {m.group(1)}" + (f" EXTENDS {m.group(2)}" if m.group(2) else ""))
            stack.append((indent, "class"))
            continue
        m = re.match(r"^for\s+(\w+)\s+in\s+range\((.*)\):$", line)
        if m:
            a = [py_expr(x) for x in split_top(m.group(2))]
            v = m.group(1)
            if len(a) == 1:
                head = f"FOR {v} FROM 0 TO {a[0]} - 1"
            elif len(a) == 2:
                head = f"FOR {v} FROM {a[0]} TO {a[1]} - 1"
            elif a[2].lstrip("-").isdigit() and int(a[2]) < 0:
                head = f"FOR {v} FROM {a[0]} DOWN TO {a[1]} + 1" + (f" STEP {-int(a[2])}" if a[2] != "-1" else "")
            else:
                head = f"FOR {v} FROM {a[0]} TO {a[1]} - 1 STEP {a[2]}"
            out.append(pad + head)
            stack.append((indent, "for"))
            continue
        m = re.match(r"^for\s+(.+?)\s+in\s+(.+):$", line)
        if m:
            out.append(f"{pad}FOR EACH {m.group(1)} IN {py_expr(m.group(2))}")
            stack.append((indent, "for"))
            continue
        m = re.match(r"^while\s+(.+):$", line)
        if m:
            out.append(f"{pad}WHILE {py_expr(m.group(1))}")
            stack.append((indent, "while"))
            continue
        m = re.match(r"^(if|elif)\s+(.+):$", line)
        if m:
            out.append(f"{pad}{'IF' if m.group(1) == 'if' else 'ELSE IF'} {py_expr(m.group(2))} THEN")
            if m.group(1) == "if":
                stack.append((indent, "if"))
            continue
        if line == "else:":
            out.append(f"{pad}ELSE")
            if not stack or stack[-1][0] != indent:
                stack.append((indent, "if"))
            continue
        if line in ("try:",):
            out.append(f"{pad}TRY")
            stack.append((indent, "try"))
            continue
        m = re.match(r"^(except|finally)\b.*:$", line)
        if m:
            out.append(f"{pad}{'ON ERROR' if m.group(1) == 'except' else 'ALWAYS'}")
            continue
        # one-line `if x: stmt`
        m = re.match(r"^(if|while|for|else)\b(.*?):\s*(\S.*)$", line)
        if m and not line.endswith(":") and m.group(1) in ("if", "else"):
            cond = m.group(2).strip()
            out.append(f"{pad}{'IF ' + py_expr(cond) + ' THEN ' if m.group(1) == 'if' else 'ELSE '}" + " ; ".join(py_statement(m.group(3))))
            continue
        for text in py_statement(line):
            if text:
                out.append(pad + text)
    close_to(-1)
    return "\n".join(out)


# ---------------------------------------------------------------- explanation
TOPIC_NOTES = {
    # C
    "Variables": "A variable is a named place in memory. Where it is declared decides who can see it (its scope) and how long it lives (its storage class).",
    "Data types": "Every value has a type that decides how many bytes it takes and how its bits are read. Mixing types, or printing with the wrong format, changes the result.",
    "Operators": "Operators combine values. Precedence says which one runs first, and some operators (like ++ or &&) also have side effects or skip work.",
    "Decisions: if / else": "if / else lets the program choose between two paths by testing a condition that is true or false. Only one of the two branches runs.",
    "Decisions: else-if ladder": "An else-if ladder tests conditions from top to bottom and runs the first branch whose condition is true; the rest are skipped. Order the checks from the most specific to the most general.",
    "Decisions: switch": "switch compares one value against several constant cases and jumps to the match. Each case ends with break, or the program falls through into the next case.",
    "Ternary operator": "The ternary operator `condition ? a : b` is a short if/else that gives back a value: `a` when the condition is true, otherwise `b`.",
    "Loops: series": "A loop repeats steps. Keep a running total or product in a variable that starts at a known value, and change the counter each pass so the loop ends.",
    "Loops: digits": "The last digit of a number is `n % 10` and the number without its last digit is `n / 10`. Looping on those two peels a number apart digit by digit.",
    "Loops: primes and sequences": "A number is prime when nothing from 2 up to its square root divides it. Sequences such as Fibonacci are built by keeping the last one or two terms and moving them forward.",
    "Functions": "A function packs a task under a name so it can be reused. It receives parameters, does its work and gives back one value with return.",
    "Recursion": "A recursive function solves a problem by calling itself on a smaller one. It needs a base case that stops the calls and a step that moves towards it.",
    "Arrays": "An array stores many values of one type in order, numbered from 0. Most array tasks are one loop over the indexes with a variable that remembers what has been seen so far.",
    "Matrices": "A matrix is an array of rows. Element (i, j) is in row i and column j, so most tasks use one loop for the rows inside which a second loop walks the columns.",
    "Pointers": "A pointer holds the address of another variable. `*p` reads or writes the value at that address, and `p + 1` moves to the next element of the same type.",
    "Pointers and memory": "Pointers let you reach memory directly. malloc gives you memory from the heap that you must release with free, and every pointer must point at something valid before it is used.",
    "Strings": "A C string is an array of characters that ends with the marker '\\0'. Loops walk it until that marker, so its length never has to be stored.",
    "Structures": "A struct groups values of different types under one name. Use `.` to reach a field of a struct and `->` when you have a pointer to it.",
    "Unions and bit fields": "A union keeps all its members in the same bytes, so only the last one written is valid. Bit fields pack small values into a few bits of a struct.",
    "Structure applications": "Real programs combine structs with arrays, pointers and functions: records live in arrays, are searched or sorted by a field, and are passed around by pointer.",
    "Dynamic memory": "malloc, calloc and realloc ask the system for memory while the program runs. Always check the result, use the memory, and free it exactly once.",
    "Dynamic data structures": "Linked lists, stacks, queues and trees are built from nodes allocated on the heap and connected by pointers. Each node you create must be freed when you are done.",
    "Basics": "Read the input exactly as described, do the small calculation, and print the answer in the exact format shown.",
    # Python / DSA / Java
    "Conditions": "Conditions choose what to do. Test with if / elif / else and combine tests with and, or and not.",
    "Loops": "A loop repeats steps. Decide what changes each pass and when it must stop, and keep running results in variables that start with a known value.",
    "Number theory": "Number problems use remainders and divisors: `%` gives a remainder, `//` gives a whole-number quotient, and checking up to the square root is enough for factors.",
    "Patterns": "Pattern problems print rows of characters. The outer loop handles the rows; the inner part works out how many spaces and symbols each row needs.",
    "Searching": "Searching looks for a value in a collection. Binary search needs sorted data and halves the range each step.",
    "Stacks": "A stack is last in, first out. Push new items on the end and pop from the end, so the most recent item comes off first.",
    "Hashing": "A dictionary (hash map) finds a value by its key in about one step, which makes counting and look-ups fast.",
    "Dynamic programming": "Dynamic programming solves a big problem from the answers to smaller ones, storing each answer once so it is never computed again.",
    "Backtracking": "Backtracking builds an answer one choice at a time and undoes (backs out of) a choice as soon as it cannot lead to a solution.",
    "Classes and objects": "A class describes data and the methods that work on it; an object is one instance of it created with new.",
    "Collections": "Collections such as ArrayList hold many items and give ready-made methods to add, sort and search them.",
    "Inheritance": "A subclass extends a parent class and can replace (override) its methods, so one type of reference can behave in many ways (polymorphism).",
    "Linked lists": "A linked list is a chain of nodes where each node points to the next one; many tasks just walk or re-link those pointers.",
    "Trees": "A tree is nodes with children. Most tree tasks are recursive: handle the node, then do the same for the left and right child.",
    "Graphs": "A graph is points (nodes) joined by edges. Breadth-first search visits nodes level by level using a queue; depth-first search goes as deep as it can using a stack or recursion.",
    "Stacks and queues": "A stack is last in, first out; a queue is first in, first out. Picking the right one often solves the problem.",
    "Sorting": "Sorting puts items in order so later steps (search, compare, merge) become easy.",
}
JAVA_NOTES = {
    "Variables and operators": "Variables hold values of a fixed type; operators combine them. Know the order in which operators run (precedence) and the difference between pre- and post-increment, integer and decimal division, and bitwise and logical operators.",
    "Conditionals": "if / else if / else, switch and the ternary operator choose what to run from a condition. Check the most specific case first and remember that a switch case falls through unless it ends with break.",
    "Loops and numbers": "Loops repeat steps while a condition holds. Number problems peel digits with `% 10` and `/ 10`, test divisors up to the square root, and keep running totals in variables that start at a known value.",
    "OOP: classes and objects": "A class bundles data (fields) with the code that works on it (methods). Constructors set an object up, `this` refers to the current object, and `static` members belong to the class rather than to one object.",
    "OOP: inheritance and polymorphism": "A subclass extends a parent class and can override its methods. Calling a method through a parent reference runs the child's version at run time (polymorphism); interfaces and abstract classes describe what a type must do.",
    "OOP: nested classes and patterns": "Classes can live inside other classes, and a few well-known designs (singleton, factory, builder, composition) solve common problems in a standard way.",
    "Exceptions": "An exception is an error object thrown at run time. `try` runs risky code, `catch` handles a particular exception, `finally` always runs, and `throw` / `throws` raise and declare errors.",
    "Collections": "The collections framework gives ready-made lists, sets, maps, queues and stacks. Choose by behaviour: List keeps order and allows repeats, Set removes repeats, Map links keys to values.",
    "Collections in practice": "Real tasks combine collections: counting with a Map, removing duplicates with a Set, ordering with a Comparator, and building small data structures such as a cache, stack or queue.",
    "Streams and generics": "Generics let one class or method work for many types safely. Streams describe a pipeline (filter, map, collect) over a collection without writing the loop yourself.",
    "Generics": "A generic class or method uses a type parameter such as `T`, so the compiler checks types and no casts are needed. Wildcards (`? extends`, `? super`) say how flexible a parameter may be.",
    "Functional programming": "A lambda is a short anonymous function and a method reference is an even shorter one. Streams, Optional and the functional interfaces (Predicate, Function, Consumer, Supplier) let you describe what to do rather than how to loop.",
    "Arrays": "An array stores many values of one type, numbered from 0. Most array tasks are one loop over the indexes, with a variable remembering what has been seen so far.",
    "Matrices": "A matrix is an array of arrays. Element (i, j) is in row i and column j, so most tasks use one loop for the rows and a second loop inside it for the columns.",
    "Strings": "A Java String is immutable text. Turn it into a char array to change characters, use StringBuilder to build new text, and the String methods (charAt, substring, split) to take it apart.",
    "Methods": "A method packs a task under a name so it can be reused. It takes parameters, may return a value, and can be overloaded (same name, different parameters).",
    "Recursion": "A recursive method solves a problem by calling itself on a smaller one. It needs a base case that stops the calls and a step that moves towards it.",
    "Threads": "A thread runs code at the same time as other threads. Start one with `start()`, wait for it with `join()`, and pass work to a thread pool with an ExecutorService.",
    "Synchronization": "When threads share data they can overwrite each other's changes. Locks (`synchronized`, ReentrantLock) let one thread at a time in; wait/notify and BlockingQueue let threads hand work to each other.",
    "Concurrency utilities": "java.util.concurrent offers ready-made tools: CompletableFuture for asynchronous steps, ForkJoin for divide-and-conquer work, and building blocks for thread pools and worker queues.",
    "File I/O": "Files are read and written with streams: readers and writers for text, input and output streams for bytes. Always close them (try-with-resources does it for you).",
    "Serialization and NIO": "Serialization turns an object into bytes you can store and later rebuild. NIO (`Files`, `Path`, channels) is the modern, more efficient way to work with files.",
    "Networking": "Programs talk over sockets: TCP (ServerSocket and Socket) gives a reliable connection, UDP (DatagramSocket) sends single packets, and URL / HttpURLConnection speak HTTP.",
}
TRACK_NOTES = {
    "C": "Work out what the input is, what the output must look like, and which small steps turn one into the other.",
    "Python": "Work out what the input is, what the output must look like, and which small steps turn one into the other.",
    "Java": "Work out what the input is, what the output must look like, and which small steps turn one into the other.",
    "DSA": "Pick the data structure that makes the repeated step cheap, then write the loop or recursion around it.",
}


def english(line):
    """One pseudocode line in plain words."""
    m = re.match(r"^READ (.*)$", line)
    if m:
        return f"Read {m.group(1)} from the input."
    m = re.match(r"^PRINT (.*)$", line)
    if m:
        return f"Print {m.group(1)}."
    m = re.match(r"^SET (\S+) = (\S+) \+ 1$", line)
    if m and m.group(1) == m.group(2):
        return f"Add 1 to {m.group(1)}."
    m = re.match(r"^SET (.+?) = (.*)$", line)
    if m:
        return f"Store {m.group(2)} in {m.group(1)}."
    m = re.match(r"^(INCREASE|DECREASE) (.*?) BY 1$", line)
    if m:
        return f"{'Add 1 to' if m.group(1) == 'INCREASE' else 'Subtract 1 from'} {m.group(2)}."
    m = re.match(r"^ELSE IF (.*) THEN(.*)$", line)
    if m:
        return f"Otherwise, if {m.group(1)}:{m.group(2)}"
    m = re.match(r"^IF (.*?) THEN ?(.*)$", line)
    if m:
        return f"If {m.group(1)}:" + (f" {m.group(2)}" if m.group(2) else "")
    if line.startswith("ELSE"):
        rest = line[4:].strip()
        return "Otherwise:" + (f" {rest}" if rest else "")
    m = re.match(r"^FOR (\w+) FROM (.*?) DOWN TO (.*)$", line)
    if m:
        return f"Count {m.group(1)} down from {m.group(2)} to {m.group(3)}, and for each value:"
    m = re.match(r"^FOR (\w+) FROM (.*?) TO (.*)$", line)
    if m:
        return f"Let {m.group(1)} go from {m.group(2)} up to {m.group(3)}, and for each value:"
    m = re.match(r"^FOR EACH (.*) IN (.*)$", line)
    if m:
        return f"Go through every {m.group(1)} in {m.group(2)}, and for each one:"
    m = re.match(r"^FOR \((.*)\)(?: DO (.*))?$", line)
    if m:
        return f"Loop ({m.group(1)}):" + (f" {m.group(2)}" if m.group(2) else "")
    m = re.match(r"^WHILE (.*?)(?: DO (.*))?$", line)
    if m:
        return f"Keep repeating while {m.group(1)}:" + (f" {m.group(2)}" if m.group(2) else "")
    if line == "REPEAT":
        return "Repeat these steps:"
    m = re.match(r"^REPEAT WHILE (.*)$", line)
    if m:
        return f"Go round again while {m.group(1)}."
    if line == "TRY":
        return "Try the following:"
    m = re.match(r"^TRY WITH (.*)$", line)
    if m:
        return f"Try the following, using {m.group(1)} (they are closed automatically):"
    m = re.match(r"^ON ERROR (.*)$", line)
    if m:
        return f"If {m.group(1)} happens:"
    if line == "ALWAYS":
        return "In every case, whatever happened:"
    m = re.match(r"^THROW (.*)$", line)
    if m:
        return f"Raise the error {m.group(1)}."
    m = re.match(r"^(.*) WHERE THE STEPS ARE:$", line)
    if m:
        return f"{english(m.group(1))[:-1] if english(m.group(1)).endswith('.') else english(m.group(1))}, where the steps are:"
    m = re.match(r"^RETURN (.*)$", line)
    if m:
        return f"Give back {m.group(1)}."
    if line == "RETURN":
        return "Return from the function."
    m = re.match(r"^FUNCTION (.*)$", line)
    if m:
        return f"Define the function {m.group(1)}:"
    m = re.match(r"^CHECK (.*)$", line)
    if m:
        return f"Look at {m.group(1)} and pick the matching case:"
    m = re.match(r"^CASE (.*):", line)
    if m:
        return f"If it is {m.group(1)}:"
    if line.startswith("DEFAULT"):
        return "For any other value:"
    if line in ("BREAK", "CONTINUE", "STOP"):
        return {"BREAK": "Leave the loop.", "CONTINUE": "Skip to the next pass.", "STOP": "Stop the program."}[line]
    m = re.match(r"^FREE (.*)$", line)
    if m:
        return f"Release the memory held by {m.group(1)}."
    m = re.match(r"^CALL (.*)$", line)
    if m:
        return f"Run {m.group(1)}."
    m = re.match(r"^(STRUCTURE|UNION|CLASS) (.*)$", line)
    if m:
        return f"Define the {m.group(1).lower()} {m.group(2)}:"
    m = re.match(r"^FIELD (.*)$", line)
    if m:
        return f"It has a field {m.group(1)}."
    return line[0].upper() + line[1:] + ("" if line.endswith((".", ":")) else ".")


def steps(pseudo, limit=36):
    lines = [l for l in pseudo.split("\n") if l.strip() and not l.strip().startswith("END")]
    out, n = [], 0
    for l in lines[:limit]:
        depth = (len(l) - len(l.lstrip())) // 2
        text = english(l.strip())
        if depth == 0:
            n += 1
            out.append(f"{n}. {text}")
        else:
            out.append("   " + "  " * (depth - 1) + "- " + text)
    if len(lines) > limit:
        out.append("   ...and the rest follows the same pattern.")
    return "\n".join(out)


def plain(text):
    return re.sub(r"\s+", " ", text.replace("`", "").replace("**", "")).strip()


def make(p):
    """Returns (pseudocode, explanation) for a problem dict, or (None, None) when it does not apply."""
    lang = p.get("language", "python")
    code = p["solution"]
    if p.get("track") in ("SQL", "HTML & CSS", "React", "Git & GitHub", "DevOps") or lang in ("sql", "html", "react", "git", "bash", "dockerfile", "yaml"):
        return None, None
    pseudo = python(code) if lang == "python" else c_like(code, java=lang == "java")
    pseudo = "\n".join(l.rstrip() for l in pseudo.split("\n") if l.strip())
    if not pseudo:
        return None, None
    first_para = plain(p["statement"].split("\n\n")[0])
    note = (JAVA_NOTES.get(p.get("topic")) if p.get("track") == "Java" else None) or TOPIC_NOTES.get(p.get("topic"), TRACK_NOTES.get(p.get("track"), ""))
    sample = next((t for t in p["tests"] if t.get("sample")), p["tests"][0])
    given = sample["input"].strip("\n")
    shown = sample["output"].strip("\n")
    example = (f"For this input:\n{given}\n\nthe program prints:\n{shown}" if given else f"The program prints:\n{shown}")
    explanation = "\n\n".join([
        "## What the program does\n" + first_para,
        "## The idea\n" + plain(note) if note else "",
        "## Step by step\n" + steps(pseudo),
        "## Example\n" + example,
    ]).replace("\n\n\n", "\n\n")
    explanation = "\n\n".join(part for part in explanation.split("\n\n") if part.strip() != "")
    return pseudo, explanation
