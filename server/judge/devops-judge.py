# Judge for DevOps problems written as files. The runner starts it as:  python devops-judge.py <dockerfile|yaml> <file>
# stdin is one check, as JSON. It prints PASS, or FAIL: <what is wrong>. Nothing the student wrote is ever run.
#
# Dockerfile checks (instructions are read after joining "\" line continuations):
#   {"type": "instruction", "name": "FROM", "startswith": "node:20"}     some FROM whose argument starts with ...
#   {"type": "instruction", "name": "CMD", "exec": true, "contains": "server.js"}   exec form: CMD ["node", "server.js"]
#   {"type": "absent", "name": "FROM", "endswith": ":latest"}            no FROM like that
#   {"type": "order", "before": {"name": "COPY", "contains": "package"}, "after": {"name": "RUN", "contains": "npm"}}
# YAML checks (a practical subset of YAML: maps, lists, scalars, flow lists/maps, comments and | / > text blocks):
#   {"type": "yaml", "path": "jobs.test.runs-on", "equals": "ubuntu-latest"}
#   {"type": "yaml", "path": "jobs.test.steps[*].run", "contains": "npm test"}      [*] = every list item, [0] = one item
#   {"type": "yaml", "path": "on.push.branches", "contains": "main"}                 a list containing main
#   {"type": "yaml", "path": "services.db"}                                          the key exists
import json
import re
import shlex
import sys

kind, path = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
spec = json.loads(sys.stdin.read())


# ------------------------------------------------------------------------------ Dockerfile
def dockerfile(source):
    instructions, buffer = [], ""
    for raw in source.splitlines():
        line = raw.rstrip()
        if not buffer and (not line.strip() or line.lstrip().startswith("#")):
            continue
        if line.lstrip().startswith("#"):
            continue
        if line.endswith("\\"):
            buffer += line[:-1] + " "
            continue
        full = (buffer + line).strip()
        buffer = ""
        name, _, args = full.partition(" ")
        instructions.append((name.upper(), args.strip()))
    return instructions


def matches(instruction, condition):
    name, args = instruction
    if "name" in condition and name != condition["name"].upper():
        return False
    if "startswith" in condition and not args.lower().startswith(condition["startswith"].lower()):
        return False
    if "endswith" in condition and not args.lower().endswith(condition["endswith"].lower()):
        return False
    if "contains" in condition and condition["contains"].lower() not in args.lower():
        return False
    if "regex" in condition and not re.search(condition["regex"], args, re.I):
        return False
    if "exec" in condition and args.startswith("[") != condition["exec"]:
        return False
    return True


def describe(condition):
    parts = [condition.get("name", "an instruction")]
    for key in ("startswith", "endswith", "contains", "regex"):
        if key in condition:
            parts.append(f'{key} "{condition[key]}"')
    return " ".join(parts)


def check_dockerfile(instructions):
    if not instructions:
        return False, "the Dockerfile is empty"
    if spec["type"] == "instruction":
        found = [i for i in instructions if matches(i, spec)]
        return (True, "") if len(found) >= spec.get("min", 1) else (False, f"no {spec.get('label') or describe(spec)} found")
    if spec["type"] == "absent":
        bad = [i for i in instructions if matches(i, spec)]
        return (True, "") if not bad else (False, f"{spec.get('label') or describe(spec)} is not allowed: {bad[0][0]} {bad[0][1]}")
    if spec["type"] == "order":
        first = lambda condition: next((n for n, i in enumerate(instructions) if matches(i, condition)), None)
        before, after = first(spec["before"]), first(spec["after"])
        if before is None or after is None:
            return False, f"both {describe(spec['before'])} and {describe(spec['after'])} are needed"
        return (True, "") if before < after else (False, f"{describe(spec['before'])} should come before {describe(spec['after'])}")
    return False, "unknown check"


# ------------------------------------------------------------------------------ YAML (subset)
class YamlError(Exception):
    pass


def strip_comment(line):
    quote = None
    for position, char in enumerate(line):
        if quote:
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == "#" and (position == 0 or line[position - 1] in " \t"):
            return line[:position]
    return line


def scalar(token):
    token = token.strip()
    if token == "":
        return None
    if token[0] in "\"'" and token[-1] == token[0] and len(token) > 1:
        return token[1:-1]
    if token.startswith("[") and token.endswith("]"):
        inner = token[1:-1].strip()
        return [scalar(part) for part in split_flow(inner)] if inner else []
    if token.startswith("{") and token.endswith("}"):
        inner = token[1:-1].strip()
        result = {}
        for part in split_flow(inner) if inner else []:
            key, _, value = part.partition(":")
            result[key.strip().strip("\"'")] = scalar(value)
        return result
    lowered = token.lower()
    if lowered in ("true", "false"):
        return lowered == "true"
    if lowered in ("null", "~"):
        return None
    if re.fullmatch(r"-?\d+", token):
        return int(token)
    return token


def split_flow(inner):
    parts, depth, quote, current = [], 0, None, ""
    for char in inner:
        if quote:
            current += char
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
            current += char
        elif char in "[{":
            depth += 1
            current += char
        elif char in "]}":
            depth -= 1
            current += char
        elif char == "," and depth == 0:
            parts.append(current)
            current = ""
        else:
            current += char
    if current.strip():
        parts.append(current)
    return parts


def key_value(content):
    """'key: value' -> (key, value-text), or None when the line is not a mapping entry."""
    match = re.match(r"""^("[^"]*"|'[^']*'|[^\s:#][^:]*?)\s*:(?:\s+(.*))?$""", content)
    if not match:
        return None
    return match.group(1).strip().strip("\"'"), (match.group(2) or "").strip()


def parse_yaml(source):
    lines = []
    for raw in source.splitlines():
        if "\t" in raw[: len(raw) - len(raw.lstrip())]:
            raise YamlError("use spaces, not tabs, to indent")
        stripped = strip_comment(raw).rstrip()
        if stripped.strip() and stripped.strip() not in ("---", "..."):
            lines.append([len(stripped) - len(stripped.lstrip()), stripped.strip(), raw])
    position = 0

    def block_text(indent, folded):
        nonlocal position
        collected = []
        while position < len(lines) and lines[position][0] > indent:
            collected.append(lines[position][2].strip())
            position += 1
        return (" " if folded else "\n").join(collected) + ("" if folded else "\n")

    def parse(indent):
        nonlocal position
        if position >= len(lines):
            return None
        current_indent, content, _ = lines[position]
        if content.startswith("- ") or content == "-":
            return parse_list(current_indent)
        if key_value(content):
            return parse_map(current_indent)
        position += 1
        return scalar(content)

    def parse_list(indent):
        nonlocal position
        items = []
        while position < len(lines) and lines[position][0] == indent and (lines[position][1].startswith("- ") or lines[position][1] == "-"):
            rest = lines[position][1][1:].strip()
            if not rest:
                position += 1
                items.append(parse(indent) if position < len(lines) and lines[position][0] > indent else None)
            elif key_value(rest) and not rest.startswith(("[", "{", '"', "'")):
                # "- key: value": the mapping continues on the following, deeper lines
                lines[position] = [indent + 2, rest, lines[position][2]]
                items.append(parse_map(indent + 2))
            else:
                position += 1
                items.append(scalar(rest))
        return items

    def parse_map(indent):
        nonlocal position
        result = {}
        while position < len(lines) and lines[position][0] == indent and not lines[position][1].startswith("- "):
            pair = key_value(lines[position][1])
            if not pair:
                raise YamlError(f"cannot read this line: {lines[position][1]}")
            key, value = pair
            position += 1
            if value in ("|", "|-", "|+", ">", ">-", ">+"):
                result[key] = block_text(indent, value.startswith(">"))
            elif value == "":
                nested = position < len(lines) and (lines[position][0] > indent or (lines[position][0] == indent and lines[position][1].startswith("-")))
                result[key] = parse(indent) if nested else None
            else:
                result[key] = scalar(value)
        return result

    document = parse(0)
    if position < len(lines):
        raise YamlError(f"cannot read line: {lines[position][1]}")
    return document


def walk(value, path):
    """All values reached by a path like jobs.test.steps[*].run."""
    current = [value]
    for part in re.findall(r"[^.\[\]]+|\[[^\]]*\]", path):
        nxt = []
        for item in current:
            if part.startswith("["):
                index = part[1:-1]
                if isinstance(item, list):
                    nxt.extend(item if index == "*" else ([item[int(index)]] if index.isdigit() and int(index) < len(item) else []))
            elif isinstance(item, dict) and part in item:
                nxt.append(item[part])
        current = nxt
    return current


def check_yaml(document):
    found = walk(document, spec["path"])
    label = spec["path"]
    if not found:
        return False, f"{label} was not found"
    flat = []
    for item in found:
        flat.extend(item if isinstance(item, list) else [item])
    texts = [str(item).strip() if not isinstance(item, bool) else str(item).lower() for item in flat if item is not None]
    if "equals" in spec:
        want = str(spec["equals"]).lower() if isinstance(spec["equals"], bool) else str(spec["equals"])
        return (True, "") if want in texts else (False, f"{label} should be {spec['equals']}" + (f", found {texts[0]}" if texts else ""))
    if "startswith" in spec:
        return (True, "") if any(t.startswith(spec["startswith"]) for t in texts) else (False, f"{label} should start with {spec['startswith']}")
    if "contains" in spec:
        want = str(spec["contains"])
        return (True, "") if any(want in t for t in texts) else (False, f"{label} should contain {spec['contains']}")
    return True, ""


try:
    if kind == "dockerfile":
        ok, why = check_dockerfile(dockerfile(text))
    else:
        ok, why = check_yaml(parse_yaml(text))
except YamlError as error:
    ok, why = False, f"YAML problem: {error}"
print("PASS" if ok else f"FAIL: {why}")
