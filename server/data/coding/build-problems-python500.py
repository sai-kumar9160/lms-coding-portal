# Python track: the 500-question Python bank (Variables, Conditionals, Loops, Lists/Tuples/Sets, Dictionaries, Functions, OOP).
# Each problem is a short real-world scenario with a reference solution; expected outputs are produced by running it.
# Loaded by build-problems.py (uses its problem()). Questions are numbered PY-001..PY-500 in the order they are defined here.
import random
import re as _re

_N = [0]
_TOPICS = {}


def _slug(text):
    return _re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def py(topic, title, statement, input_format, output_format, constraints, solution, make, edges=(), diff="EASY", n=6):
    """One scenario problem. `make(rng)` returns one random input; `edges` are fixed extra inputs; first two inputs are the samples."""
    _N[0] += 1
    _TOPICS[topic] = _TOPICS.get(topic, 0) + 1
    rng = random.Random(_N[0] * 7919 + 13)
    tests, tries = [], 0
    while len(tests) < n and tries < 400:
        tries += 1
        t = make(rng)
        if t not in tests:
            tests.append(t)
    for e in edges:
        if e not in tests:
            tests.append(e)
    problem(f"py-{_slug(title)}", title, diff, topic, statement, input_format, output_format, constraints, solution, tests, track="Python")


def one_line(*vals):
    return " ".join(str(v) for v in vals) + "\n"


def rows(*vals):
    return "\n".join(str(v) for v in vals) + "\n"


for _part in ("vars", "cond", "loops", "ds", "dict", "func", "func2", "oop", "oop2"):
    _f = pathlib.Path(__file__).with_name(f"build-problems-python-{_part}.py")
    if _f.exists():
        exec(compile(_f.read_text(encoding="utf-8"), _f.name, "exec"))
