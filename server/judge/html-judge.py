# Judge for HTML & CSS problems. The runner starts it as:  python html-judge.py index.html
# stdin is one check, as JSON. It prints PASS when the page satisfies the check, or FAIL: <what is wrong>.
#   {"type": "exists", "selector": "ul > li", "count": 3}                       elements matching a selector
#   {"type": "exists", "selector": "a", "attrs": {"href": true}, "text": "Home"}  with attributes / text inside
#   {"type": "title", "text": "My page"}                                       the <title> text
#   {"type": "css", "selector": ".card", "property": "display", "values": ["flex"]}  a rule in a <style> block
# Only the structure of the page is checked; nothing the student wrote is ever run.
import json
import re
import sys
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.children, self.text = tag, dict(attrs), parent, [], ""

    def all_text(self):
        return (self.text + " " + " ".join(child.all_text() for child in self.children)).strip()

    def walk(self):
        for child in self.children:
            yield child
            yield from child.walk()


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.cur = self.root
        self.styles = []
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        node = Node(tag, [(k, v if v is not None else "") for k, v in attrs], self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node
        self.in_style = tag == "style"

    def handle_endtag(self, tag):
        node = self.cur
        while node is not None and node.tag != tag:
            node = node.parent
        if node is not None and node.parent is not None:
            self.cur = node.parent
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            self.styles.append(data)
        else:
            self.cur.text += " " + data


def compound(selector):
    """tag#id.class[attr=value] -> a test function for one element."""
    tag = re.match(r"^[a-zA-Z][a-zA-Z0-9-]*|^\*", selector)
    ids = re.findall(r"#([\w-]+)", selector)
    classes = re.findall(r"\.([\w-]+)", selector)
    attrs = re.findall(r"\[([\w-]+)(?:=[\"']?([^\]\"']*)[\"']?)?\]", selector)

    def test(node):
        if tag and tag.group(0) not in ("*", node.tag):
            return False
        if any(node.attrs.get("id") != i for i in ids):
            return False
        have = node.attrs.get("class", "").split()
        if any(c not in have for c in classes):
            return False
        return all(k in node.attrs and (v == "" or node.attrs[k] == v) for k, v in attrs)
    return test


def select(root, selector):
    """Supports compound selectors with the descendant (space) and child (>) combinators."""
    parts = re.findall(r">|[^\s>]+", selector.strip())
    steps, combinator = [], " "
    for part in parts:
        if part == ">":
            combinator = ">"
        else:
            steps.append((combinator, compound(part)))
            combinator = " "

    def matches(node, index):
        comb, test = steps[index]
        if not test(node):
            return False
        if index == 0:
            return True
        ancestor = node.parent
        if comb == ">":
            return ancestor is not None and ancestor.tag != "#root" and matches(ancestor, index - 1)
        while ancestor is not None and ancestor.tag != "#root":
            if matches(ancestor, index - 1):
                return True
            ancestor = ancestor.parent
        return False
    return [node for node in root.walk() if matches(node, len(steps) - 1)] if steps else []


def css_rules(styles):
    css = re.sub(r"/\*.*?\*/", "", "\n".join(styles), flags=re.S)
    rules = []
    for selectors, body in re.findall(r"([^{}@]+)\{([^{}]*)\}", css):
        props = {}
        for declaration in body.split(";"):
            if ":" in declaration:
                name, value = declaration.split(":", 1)
                props[name.strip().lower()] = re.sub(r"\s+", " ", value.replace("!important", "")).strip().lower()
        for selector in selectors.split(","):
            rules.append((re.sub(r"\s+", " ", selector.strip()), props))
    return rules


def check(page, spec):
    kind = spec.get("type")
    if kind == "title":
        titles = select(page.root, "title")
        text = titles[0].all_text() if titles else ""
        want = spec.get("text", "")
        return (True, "") if text and want.lower() in text.lower() else (False, f"the <title> should contain \"{want}\"")
    if kind == "exists":
        found = select(page.root, spec["selector"])
        if "text" in spec:
            found = [n for n in found if spec["text"].lower() in n.all_text().lower()]
        for name, want in spec.get("attrs", {}).items():
            found = [n for n in found if name in n.attrs and (want is True or n.attrs[name] == want)]
        label = spec.get("label", spec["selector"])
        if "count" in spec:
            return (True, "") if len(found) == spec["count"] else (False, f"expected {spec['count']} x {label}, found {len(found)}")
        return (True, "") if len(found) >= spec.get("min", 1) else (False, f"no {label} found" + (" with the expected content" if "text" in spec or "attrs" in spec else ""))
    if kind == "css":
        wanted = re.sub(r"\s+", " ", spec["selector"].strip())
        prop = spec["property"].lower()
        values = [v.lower() for v in spec["values"]]
        for selector, props in css_rules(page.styles):
            if selector == wanted and props.get(prop) in values:
                return True, ""
        return False, f"{spec['selector']} {{ {prop}: {spec['values'][0]}; }} was not found in your <style>"
    return False, "unknown check"


page = Page()
page.feed(open(sys.argv[1], encoding="utf-8").read())
ok, why = check(page, json.loads(sys.stdin.read()))
print("PASS" if ok else f"FAIL: {why}")
