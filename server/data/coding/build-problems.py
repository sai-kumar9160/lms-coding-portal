# Builds problems.json for the Coding Practice library.
# Every problem has a reference solution (stdin -> stdout); expected outputs are produced by running it,
# so test cases never disagree with the statement. The first `samples` inputs are shown to students.
# Run: python -I data/coding/build-problems.py
import json
import pathlib
import subprocess
import sys

P = []


# track: the practice track the problem appears under (Python, C, Java, DSA, SQL, HTML & CSS).
# lang: language the reference solution is written in (it produces the expected outputs).
# languages: languages students may use (None = all). checker: how output is compared (None = TRIMMED).
def problem(slug, title, difficulty, topic, statement, input_format, output_format, constraints, solution, tests, samples=2,
            track="Python", lang="python", languages=None, checker=None):
    P.append(dict(slug=slug, title=title, difficulty=difficulty, topic=topic, track=track, statement=statement,
                  inputFormat=input_format, outputFormat=output_format, constraints=constraints,
                  solution=solution.strip() + "\n", tests=tests, samples=samples, language=lang,
                  languages=languages if languages is not None else (["python"] if track == "Python" else None), checker=checker))


def lines(*rows):
    return "\n".join(str(r) for r in rows) + "\n"


def arr(values):
    return lines(len(values), " ".join(map(str, values)))


# The Python practice track is the 500-question bank in build-problems-python500.py (loaded below).

# The C, Java, DSA, SQL and HTML & CSS tracks live in build-problems-extra.py; React, Git & GitHub and DevOps in build-problems-devtools.py.
exec(compile(pathlib.Path(__file__).with_name("build-problems-extra.py").read_text(encoding="utf-8"), "build-problems-extra.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c.py").read_text(encoding="utf-8"), "build-problems-c.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-control.py").read_text(encoding="utf-8"), "build-problems-c-control.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-functions.py").read_text(encoding="utf-8"), "build-problems-c-functions.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-arrays.py").read_text(encoding="utf-8"), "build-problems-c-arrays.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-pointers.py").read_text(encoding="utf-8"), "build-problems-c-pointers.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-strings.py").read_text(encoding="utf-8"), "build-problems-c-strings.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-structs.py").read_text(encoding="utf-8"), "build-problems-c-structs.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-c-memory.py").read_text(encoding="utf-8"), "build-problems-c-memory.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-core.py").read_text(encoding="utf-8"), "build-problems-java-core.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-decide.py").read_text(encoding="utf-8"), "build-problems-java-decide.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-loops.py").read_text(encoding="utf-8"), "build-problems-java-loops.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-oop.py").read_text(encoding="utf-8"), "build-problems-java-oop.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-collections.py").read_text(encoding="utf-8"), "build-problems-java-collections.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-arrays.py").read_text(encoding="utf-8"), "build-problems-java-arrays.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-methods.py").read_text(encoding="utf-8"), "build-problems-java-methods.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-threads.py").read_text(encoding="utf-8"), "build-problems-java-threads.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-io.py").read_text(encoding="utf-8"), "build-problems-java-io.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-java-generics.py").read_text(encoding="utf-8"), "build-problems-java-generics.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-devtools.py").read_text(encoding="utf-8"), "build-problems-devtools.py", "exec"))
exec(compile(pathlib.Path(__file__).with_name("build-problems-python500.py").read_text(encoding="utf-8"), "build-problems-python500.py", "exec"))

assert len({p["slug"] for p in P}) == len(P), "duplicate slug"


JUDGE = pathlib.Path(__file__).resolve().parents[2] / "judge"
_py = [sys.executable, "-I"]
# Languages judged by scripts in server/judge: (file the code is written to, command that runs it).
TOOLS = {
    "react": ("App.jsx", ["node", str(JUDGE / "react-judge.mjs"), "App.jsx", sys.executable]),
    "git": ("commands.txt", _py + [str(JUDGE / "git-judge.py"), "commands.txt"]),
    "bash": ("main.sh", ["bash", "main.sh"]),
    "dockerfile": ("Dockerfile", _py + [str(JUDGE / "devops-judge.py"), "dockerfile", "Dockerfile"]),
    "yaml": ("config.yml", _py + [str(JUDGE / "devops-judge.py"), "yaml", "config.yml"]),
}


_CACHE_FILE = pathlib.Path(__file__).with_name(".reference-cache.json")
_CACHE = json.loads(_CACHE_FILE.read_text()) if _CACHE_FILE.exists() else {}


def run(code, stdin, lang="python"):
    """Runs a reference solution (results are cached by program + input, so a rebuild only runs what changed)."""
    import hashlib
    key = hashlib.sha256(f"{lang}\0{code}\0{stdin}".encode()).hexdigest()
    if key not in _CACHE:
        _CACHE[key] = _run(code, stdin, lang)
        _CACHE_FILE.write_text(json.dumps(_CACHE))
    return _CACHE[key]


def _run(code, stdin, lang="python"):
    """Runs a reference solution the way the judge runs a student's program."""
    import os
    import shutil
    import tempfile
    if lang == "python":
        done = subprocess.run([sys.executable, "-I", "-c", code], input=stdin, capture_output=True, text=True, timeout=30)
    else:
        work = tempfile.mkdtemp(prefix="lms-ref-")
        try:
            if lang == "c":
                pathlib.Path(work, "main.c").write_text(code)
                subprocess.run(["gcc", "-O2", "-std=c17", "-o", "main", "main.c", "-lm"], cwd=work, check=True)
                cmd = [os.path.join(work, "main")]
            elif lang == "java":
                pathlib.Path(work, "Main.java").write_text(code)
                subprocess.run(["javac", "-encoding", "UTF-8", "Main.java"], cwd=work, check=True)
                cmd = ["java", "-cp", work, "Main"]
            elif lang == "sql":
                pathlib.Path(work, "main.sql").write_text(code)
                cmd = [sys.executable, "-I", str(JUDGE / "sql-judge.py"), "main.sql"]
            elif lang == "html":
                pathlib.Path(work, "index.html").write_text(code)
                cmd = [sys.executable, "-I", str(JUDGE / "html-judge.py"), "index.html"]
            elif lang in TOOLS:
                filename, command = TOOLS[lang]
                pathlib.Path(work, filename).write_text(code)
                cmd = command
            else:
                raise SystemExit(f"Unknown reference language {lang}")
            done = subprocess.run(cmd, cwd=work, input=stdin, capture_output=True, text=True, timeout=60)
        finally:
            shutil.rmtree(work, ignore_errors=True)
    if done.returncode:
        raise SystemExit(f"Reference solution ({lang}) failed:\n{done.stderr}")
    return done.stdout


import importlib.util

_spec = importlib.util.spec_from_file_location("pseudo", pathlib.Path(__file__).with_name("pseudo.py"))
_pseudo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_pseudo)

# C and Java topics are grouped under the same seven topics as the Python bank (topics with no equivalent keep their own name).
_V, _C, _L, _D, _F, _O = "Variables & Data Types", "Conditional Statements", "Loops", "Lists, Tuples & Sets", "Functions", "Object-Oriented Programming"
TOPIC_MAP = {
    "C": {"Basics": _V, "Variables": _V, "Data types": _V, "Operators": _V,
          "Decisions: if / else": _C, "Decisions: else-if ladder": _C, "Decisions: switch": _C, "Ternary operator": _C,
          "Loops: series": _L, "Loops: digits": _L, "Loops: primes and sequences": _L,
          "Arrays": _D, "Matrices": _D, "Strings": _D, "Pointers": _D, "Pointers and memory": _D, "Dynamic memory": _D, "Dynamic data structures": _D,
          "Functions": _F, "Recursion": _F,
          "Structures": _O, "Structure applications": _O, "Unions and bit fields": _O},
    "Java": {"Basics": _V, "Variables and operators": _V, "Conditionals": _C, "Loops and numbers": _L,
             "Arrays": _D, "Matrices": _D, "Strings": _D, "Collections": _D, "Collections in practice": _D, "Streams and generics": _D, "Generics": _D,
             "Methods": _F, "Recursion": _F, "Functional programming": _F,
             "Classes and objects": _O, "Inheritance": _O, "OOP: classes and objects": _O, "OOP: inheritance and polymorphism": _O,
             "OOP: nested classes and patterns": _O, "Exceptions": _O},
}


def remap_topic(p):
    p["topic"] = TOPIC_MAP.get(p.get("track"), {}).get(p["topic"], p["topic"])
    return p


import os
_only = os.environ.get("PY500_ONLY")
_keep = []
if _only:
    _old = json.loads(pathlib.Path(__file__).with_name("problems.json").read_text(encoding="utf-8"))
    _keep = [q for q in _old if not q["slug"].startswith("py-")]
    P = [p for p in P if p["slug"].startswith("py-")]
out = []
for i, p in enumerate(P, len(_keep) + 1):
    tests = [{"input": t if t.endswith("\n") or t == "" else t + "\n", "sample": n < p["samples"]} for n, t in enumerate(p.pop("tests"))]
    for t in tests:
        t["output"] = run(p["solution"], t["input"], p["language"])
    pseudocode, explanation = _pseudo.make({**p, "tests": tests})
    out.append({"sequence": i, **{k: v for k, v in p.items() if k not in ("samples", "tests")}, "pseudocode": pseudocode, "explanation": explanation, "tests": tests})

out = [remap_topic(q) for q in _keep + out]
target = pathlib.Path(__file__).with_name("problems.json")
with open(target, "w", encoding="utf-8", newline="\n") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
    f.write("\n")
print(f"Wrote {len(out)} problems, {sum(len(p['tests']) for p in out)} test cases to {target}")
