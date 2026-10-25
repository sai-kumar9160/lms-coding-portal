# Judge for Git & GitHub problems. The runner starts it as:  python git-judge.py commands.txt
# The student's file is a list of git commands, one per line (blank lines and # comments are ignored).
# stdin is the test case, as JSON:
#   { "steps":  [ ["write", "a.txt", "text\n"], ["git", "init"], ["git", "add ."], ["git", "commit -m 'First'"], ["remote"] ... ],
#     "report": ["head", "branches", "log", "log:feature", "tags", "status", "files", "file:a.txt", "remotes", "remote-branches", "remote-log:main"] }
# The steps build the starting repository in a temporary folder (["remote"] adds a local bare repository as "origin": the
# stand-in for GitHub). Then the student's commands run, and the report prints the resulting state, so what is compared
# is the repository the commands produced, never their text. Commit hashes are never printed.
# Student commands are plain `git <subcommand> ...` (no shell, no global options) from an allow-list, in that folder only.
import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile

ALLOWED = {"init", "add", "commit", "status", "log", "branch", "switch", "checkout", "merge", "rebase", "tag", "revert", "reset", "restore",
           "stash", "rm", "mv", "diff", "show", "remote", "push", "pull", "fetch", "cherry-pick"}
FORBIDDEN_FLAGS = ("--exec", "--upload-pack", "--receive-pack", "--interactive", "-i", "--edit", "--no-verify-signatures", "-S", "--gpg-sign")

work = tempfile.mkdtemp(prefix="lms-git-")
repo = os.path.join(work, "repo")
bare = os.path.join(work, "remote.git")
os.makedirs(repo)
clock = [0]


def env():
    clock[0] += 1
    stamp = f"2026-01-01T00:{clock[0] // 60:02d}:{clock[0] % 60:02d} +0000"
    return {
        "PATH": os.environ.get("PATH", ""), "HOME": work, "LC_ALL": "C", "LANG": "C", "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull,
        "GIT_TERMINAL_PROMPT": "0", "GIT_EDITOR": "true", "GIT_PAGER": "cat", "PAGER": "cat", "GIT_MERGE_AUTOEDIT": "no",
        "GIT_AUTHOR_NAME": "Student", "GIT_AUTHOR_EMAIL": "student@example.com", "GIT_COMMITTER_NAME": "Student", "GIT_COMMITTER_EMAIL": "student@example.com",
        "GIT_AUTHOR_DATE": stamp, "GIT_COMMITTER_DATE": stamp,
        "GIT_CONFIG_COUNT": "2", "GIT_CONFIG_KEY_0": "init.defaultBranch", "GIT_CONFIG_VALUE_0": "main",
        "GIT_CONFIG_KEY_1": "advice.detachedHead", "GIT_CONFIG_VALUE_1": "false",
    }


def git(args, cwd=None, check=True):
    done = subprocess.run(["git"] + args, cwd=cwd or repo, env=env(), capture_output=True, text=True, timeout=30)
    if check and done.returncode:
        raise RuntimeError((done.stderr or done.stdout).strip() or f"git {' '.join(args)} failed")
    return done.stdout


def safe_path(rel):
    target = os.path.normpath(os.path.join(repo, rel))
    if not target.startswith(repo + os.sep):
        raise RuntimeError("bad path in test case")
    return target


def run_steps(steps):
    for step in steps:
        if step[0] == "write":
            target = safe_path(step[1])
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "w", encoding="utf-8") as handle:
                handle.write(step[2])
        elif step[0] == "git":
            git(shlex.split(step[1]))
        elif step[0] == "remote":
            subprocess.run(["git", "init", "--bare", "-q", bare], env=env(), check=True, capture_output=True)
            git(["remote", "add", "origin", bare])
        else:
            raise RuntimeError(f"unknown step {step[0]}")


def student_commands(path):
    for number, raw in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        try:
            tokens = shlex.split(line)
        except ValueError as error:
            sys.exit(f"Line {number}: {error}")
        if tokens[0] != "git" or len(tokens) < 2:
            sys.exit(f"Line {number}: write git commands only, for example: git add notes.txt")
        if tokens[1].startswith("-"):
            sys.exit(f"Line {number}: put the git subcommand first (git status, not git -C ...)")
        if tokens[1] not in ALLOWED:
            sys.exit(f"Line {number}: 'git {tokens[1]}' is not available in these exercises")
        for token in tokens[2:]:
            if token in FORBIDDEN_FLAGS or token.startswith(("--exec", "--upload-pack", "--receive-pack")):
                sys.exit(f"Line {number}: the option {token} is not available in these exercises")
        yield number, line, tokens[1:]


def lines_of(text):
    return [line for line in text.splitlines() if line.strip() != ""]


def section(name, body):
    print(f"== {name} ==")
    for line in body:
        print(line)


def report(name):
    kind, _, arg = name.partition(":")
    if kind == "head":
        branch = git(["branch", "--show-current"], check=False).strip()
        section("head", [branch or "(detached)"])
    elif kind == "branches":
        section("branches", sorted(lines_of(git(["for-each-ref", "--format=%(refname:short)", "refs/heads"], check=False))))
    elif kind == "log":
        ref = arg or "HEAD"
        section(f"log {ref}", lines_of(git(["log", "--format=%s", "--reverse", "--topo-order", ref, "--"], check=False)) or ["(no commits)"])
    elif kind == "tags":
        section("tags", [f"{t} ({'annotated' if git(['cat-file', '-t', t]).strip() == 'tag' else 'lightweight'})" for t in sorted(lines_of(git(["tag", "-l"], check=False)))])
    elif kind == "status":
        section("status", sorted(lines_of(git(["status", "--short"], check=False))))
    elif kind == "files":
        section("tracked files", sorted(lines_of(git(["ls-files"], check=False))))
    elif kind == "file":
        target = safe_path(arg)
        section(f"file {arg}", open(target, encoding="utf-8").read().splitlines() if os.path.exists(target) else ["(missing)"])
    elif kind == "remotes":
        # The stand-in for GitHub lives in a temporary folder; show it under a fixed name.
        section("remotes", sorted(line.replace(bare, "<github>") for line in lines_of(git(["remote", "-v"], check=False))))
    elif kind == "remote-branches":
        section("remote branches", sorted(lines_of(git(["for-each-ref", "--format=%(refname:short)", "refs/heads"], cwd=bare, check=False))) if os.path.isdir(bare) else ["(no remote)"])
    elif kind == "remote-log":
        section(f"remote log {arg}", lines_of(git(["log", "--format=%s", "--reverse", "--topo-order", arg, "--"], cwd=bare, check=False)) or ["(no commits)"])
    else:
        raise RuntimeError(f"unknown report {name}")


try:
    spec = json.loads(sys.stdin.read())
    run_steps(spec.get("steps", []))
    for number, line, args in student_commands(sys.argv[1]):
        done = subprocess.run(["git"] + args, cwd=repo, env=env(), capture_output=True, text=True, timeout=30)
        if done.returncode:
            sys.exit(f"Line {number}: {line}\n{(done.stderr or done.stdout).strip()}")
    for name in spec.get("report", []):
        report(name)
except subprocess.TimeoutExpired:
    sys.exit("A git command took too long.")
except RuntimeError as error:
    sys.exit(str(error))
finally:
    shutil.rmtree(work, ignore_errors=True)
