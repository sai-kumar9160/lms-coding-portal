# The React, Git & GitHub and DevOps tracks. build-problems.py runs this file after build-problems-extra.py
# (it uses problem() and lines() from there). Each track is judged by a script in server/judge:
#   React       react-judge.mjs   renders the component with the test's props and checks the HTML it produces
#   Git         git-judge.py      runs the student's git commands in a throw-away repository and prints its state
#   DevOps      bash (real shell) and devops-judge.py (Dockerfile / YAML structure checks)
import json


def spec(**fields):
    return json.dumps(fields)


# ======================================================================================================
# React track: students write one component and `export default` it. Each test renders it with some props.
# ======================================================================================================
R = dict(track="React", lang="react", languages=["react"])
RNOTE = "\n\nWrite one component and `export default` it. It is rendered once with the props shown in each test and the HTML it produces is checked (effects and clicks do not run)."


def rt(props, **check):
    return spec(props=props, check=check)


problem("react-greeting", "Greeting Component", "EASY", "Components and JSX",
        "Write a component `Greeting` that takes a `name` prop and renders an `<h1>` saying `Hello, <name>!`." + RNOTE,
        "Props: `name`.", "An `<h1>` with the greeting.", "Use a function component.",
        "export default function Greeting({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}",
        [rt({"name": "Asha"}, type="exists", selector="h1", text="Hello, Asha!", label="an <h1> saying Hello, Asha!"),
         rt({"name": "Ravi"}, type="exists", selector="h1", text="Hello, Ravi!", label="an <h1> saying Hello, Ravi!"),
         rt({"name": "World"}, type="exists", selector="h1", count=1, label="exactly one <h1>"),
         rt({"name": "NextByte"}, type="exists", selector="h1", text="Hello, NextByte!", label="an <h1> saying Hello, NextByte!")], samples=2, **R)

problem("react-fruit-list", "Render a List", "EASY", "Lists and keys",
        "Write `FruitList` with an `items` prop (an array of strings). Render a `<ul>` with one `<li>` per item. When the array is empty, render a `<p>` that says `No items` instead of the list. Give each `<li>` a `key`." + RNOTE,
        "Props: `items`.", "A list, or the empty message.", "Use `items.map`.",
        "export default function FruitList({ items }) {\n  if (items.length === 0) return <p>No items</p>;\n  return (\n    <ul>\n      {items.map(item => <li key={item}>{item}</li>)}\n    </ul>\n  );\n}",
        [rt({"items": ["apple", "mango", "kiwi"]}, type="exists", selector="ul > li", count=3, label="three list items"),
         rt({"items": ["apple", "mango", "kiwi"]}, type="exists", selector="li", text="mango", label="an item saying mango"),
         rt({"items": []}, type="exists", selector="p", text="No items", label="a <p> saying No items"),
         rt({"items": []}, type="exists", selector="ul", count=0, label="no <ul> when empty"),
         rt({"items": ["fig"]}, type="exists", selector="ul > li", count=1, label="one list item")], samples=2, **R)

problem("react-online-badge", "Conditional Rendering", "EASY", "Conditional rendering",
        "Write `Badge` with a boolean `online` prop. Render a `<span>` with the classes `badge online` and the text `Online` when `online` is true, or the classes `badge offline` and the text `Offline` when it is false." + RNOTE,
        "Props: `online`.", "One `<span>`.", "Use a conditional expression.",
        "export default function Badge({ online }) {\n  return (\n    <span className={online ? 'badge online' : 'badge offline'}>\n      {online ? 'Online' : 'Offline'}\n    </span>\n  );\n}",
        [rt({"online": True}, type="exists", selector="span.badge.online", text="Online", label="an Online badge"),
         rt({"online": False}, type="exists", selector="span.badge.offline", text="Offline", label="an Offline badge"),
         rt({"online": True}, type="exists", selector="span.offline", count=0, label="no offline class when online"),
         rt({"online": False}, type="exists", selector="span.online", count=0, label="no online class when offline")], samples=2, **R)

problem("react-profile-card", "Profile Card", "MEDIUM", "Props",
        "Write `ProfileCard` with props `name`, `role` and `skills` (an array of strings). Render:\n- an `<h2>` with the name\n- a `<p>` with class `role` showing the role\n- a `<ul>` with class `skills` that has one `<li>` per skill" + RNOTE,
        "Props: `name`, `role`, `skills`.", "A card.", "Use a function component.",
        "export default function ProfileCard({ name, role, skills }) {\n  return (\n    <div className=\"card\">\n      <h2>{name}</h2>\n      <p className=\"role\">{role}</p>\n      <ul className=\"skills\">\n        {skills.map(skill => <li key={skill}>{skill}</li>)}\n      </ul>\n    </div>\n  );\n}",
        [rt({"name": "Asha Rao", "role": "Frontend Developer", "skills": ["React", "CSS"]}, type="exists", selector="h2", text="Asha Rao", label="an <h2> with the name"),
         rt({"name": "Asha Rao", "role": "Frontend Developer", "skills": ["React", "CSS"]}, type="exists", selector="p.role", text="Frontend Developer", label="a p.role with the role"),
         rt({"name": "Asha Rao", "role": "Frontend Developer", "skills": ["React", "CSS"]}, type="exists", selector="ul.skills > li", count=2, label="two skills"),
         rt({"name": "Ravi", "role": "Backend Developer", "skills": ["Node", "SQL", "Docker", "Git"]}, type="exists", selector="ul.skills > li", count=4, label="four skills"),
         rt({"name": "Meena", "role": "Designer", "skills": []}, type="exists", selector="ul.skills", label="an empty ul.skills")], samples=2, **R)

problem("react-usestate-counter", "Counter with useState", "MEDIUM", "State",
        "Write `Counter` with an optional `start` prop (default `0`). Keep the count in `useState`, show it in a `<p>` as `Count: <number>`, and render a `<button>` that says `Add` and increases the count when clicked." + RNOTE,
        "Props: `start` (optional).", "A paragraph and a button.", "Use the `useState` hook.",
        "import { useState } from 'react';\n\nexport default function Counter({ start = 0 }) {\n  const [count, setCount] = useState(start);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Add</button>\n    </div>\n  );\n}",
        [rt({"start": 5}, type="exists", selector="p", text="Count: 5", label="Count: 5"),
         rt({}, type="exists", selector="p", text="Count: 0", label="Count: 0 by default"),
         rt({"start": 12}, type="exists", selector="button", text="Add", label="an Add button"),
         rt({"start": 3}, type="exists", selector="button", count=1, label="exactly one button")], samples=2, **R)

problem("react-controlled-input", "A Controlled Input", "MEDIUM", "Forms",
        "Write `NameForm` with an `initial` prop. Keep the name in `useState(initial)` and render a `<label>` with the text `Name` that wraps an `<input>` whose `value` is the state and whose `onChange` updates it. Under the form show a `<p>` that says `Hello, <name>`." + RNOTE,
        "Props: `initial`.", "A labelled input and a greeting.", "Use `useState` and `onChange`.",
        "import { useState } from 'react';\n\nexport default function NameForm({ initial }) {\n  const [name, setName] = useState(initial);\n  return (\n    <form>\n      <label>Name <input value={name} onChange={event => setName(event.target.value)} /></label>\n      <p>Hello, {name}</p>\n    </form>\n  );\n}",
        [rt({"initial": "Asha"}, type="exists", selector="label", text="Name", label="a label saying Name"),
         rt({"initial": "Asha"}, type="exists", selector="label input", attrs={"value": "Asha"}, label="an input with value Asha"),
         rt({"initial": "Ravi"}, type="exists", selector="p", text="Hello, Ravi", label="Hello, Ravi"),
         rt({"initial": ""}, type="exists", selector="input", count=1, label="one input")], samples=2, **R)

problem("react-card-children", "Card with Children", "MEDIUM", "Composition",
        "Write `Card` with a `title` prop and `children`. Render a `<div>` with class `card` that contains an `<h3>` with the title and a `<div>` with class `body` that shows the children." + RNOTE,
        "Props: `title`, `children`.", "A card.", "Use the `children` prop.",
        "export default function Card({ title, children }) {\n  return (\n    <div className=\"card\">\n      <h3>{title}</h3>\n      <div className=\"body\">{children}</div>\n    </div>\n  );\n}",
        [rt({"title": "Notice", "children": "Exams start on Monday."}, type="exists", selector="div.card > h3", text="Notice", label="the title in an <h3>"),
         rt({"title": "Notice", "children": "Exams start on Monday."}, type="exists", selector=".card .body", text="Exams start on Monday.", label="the children inside .body"),
         rt({"title": "Tip", "children": "Practice daily."}, type="exists", selector="div.card", count=1, label="one card"),
         rt({"title": "Tip", "children": "Practice daily."}, type="exists", selector="h3", text="Tip", label="the title Tip")], samples=2, **R)

problem("react-todo-list", "Todo List", "MEDIUM", "Lists and keys",
        "Write `TodoList` with a `todos` prop: an array of `{ id, text, done }`. Render a `<ul>` with one `<li>` per todo showing its text. A todo that is `done` gets the class `done` on its `<li>`." + RNOTE,
        "Props: `todos`.", "A list of todos.", "Give each item a `key`.",
        "export default function TodoList({ todos }) {\n  return (\n    <ul>\n      {todos.map(todo => (\n        <li key={todo.id} className={todo.done ? 'done' : ''}>{todo.text}</li>\n      ))}\n    </ul>\n  );\n}",
        [rt({"todos": [{"id": 1, "text": "Read chapter 1", "done": True}, {"id": 2, "text": "Solve two problems", "done": False}, {"id": 3, "text": "Revise", "done": True}]}, type="exists", selector="ul > li", count=3, label="three todos"),
         rt({"todos": [{"id": 1, "text": "Read chapter 1", "done": True}, {"id": 2, "text": "Solve two problems", "done": False}, {"id": 3, "text": "Revise", "done": True}]}, type="exists", selector="li.done", count=2, label="two done todos"),
         rt({"todos": [{"id": 1, "text": "Read chapter 1", "done": True}, {"id": 2, "text": "Solve two problems", "done": False}]}, type="exists", selector="li", text="Solve two problems", label="the todo text"),
         rt({"todos": [{"id": 7, "text": "Only task", "done": False}]}, type="exists", selector="li.done", count=0, label="no done todos")], samples=2, **R)

# ======================================================================================================
# Git & GitHub track: students write git commands. The judge builds a repository, runs them and prints its state.
# "origin" in the GitHub problems is a local stand-in for a GitHub repository.
# ======================================================================================================
G = dict(track="Git & GitHub", lang="git", languages=["git"])
GNOTE = "\n\nWrite git commands, one per line (for example `git add notes.txt`). They run in a practice repository, and the resulting state is checked."


def commit_steps(path, content, message):
    return [["write", path, content], ["git", "add ."], ["git", f"commit -m '{message}'"]]


def base(*more):
    return [["write", "README.md", "# Demo\n"], ["git", "init"], ["git", "add ."], ["git", "commit -m 'Initial commit'"]] + [step for group in more for step in group]


def gt(steps, *report):
    return spec(steps=steps, report=list(report))


problem("git-first-commit", "Your First Commit", "EASY", "Basics",
        "A folder has two files, `README.md` and `notes.txt`, but no repository yet.\n\n1. Create a repository.\n2. Stage **only** `README.md`.\n3. Commit it with the message `Add README`." + GNOTE,
        "Write git commands.", "The repository must have one commit, and `notes.txt` must stay untracked.", "Use `git init`, `git add`, `git commit`.",
        "git init\ngit add README.md\ngit commit -m \"Add README\"",
        [gt([["write", "README.md", "# Demo\n"], ["write", "notes.txt", "ideas\n"]], "log", "status"),
         gt([["write", "README.md", "# Project\nHello\n"], ["write", "notes.txt", "todo\n"]], "files", "head"),
         gt([["write", "README.md", "# Notes\n"], ["write", "notes.txt", "later\n"]], "branches", "log")], samples=1, **G)

problem("git-branch-and-switch", "Create and Switch to a Branch", "EASY", "Branches",
        "The repository has one commit on `main`.\n\n1. Create a branch called `feature/login` and switch to it.\n2. Make an empty commit with the message `Start login` (`git commit --allow-empty -m ...`)." + GNOTE,
        "Write git commands.", "`feature/login` is checked out and has the new commit; `main` is unchanged.", "Use `git switch -c`.",
        "git switch -c feature/login\ngit commit --allow-empty -m \"Start login\"",
        [gt(base(), "head", "branches"), gt(base(), "log"), gt(base(), "log:main"), gt(base(commit_steps("a.txt", "a\n", "Add a")), "log", "head")], samples=1, **G)

problem("git-fast-forward-merge", "Merge a Feature Branch", "EASY", "Merging",
        "The `feature` branch has two commits that `main` does not have yet. You are on `feature`.\n\nSwitch to `main` and merge `feature` into it." + GNOTE,
        "Write git commands.", "`main` contains the commits of `feature`, and `main` is checked out.", "Use `git switch` and `git merge`.",
        "git switch main\ngit merge feature",
        [gt(base([["git", "switch -c feature"]], commit_steps("f1.txt", "1\n", "Add f1"), commit_steps("f2.txt", "2\n", "Add f2")), "head", "log"),
         gt(base([["git", "switch -c feature"]], commit_steps("f1.txt", "1\n", "Add f1"), commit_steps("f2.txt", "2\n", "Add f2")), "files"),
         gt(base([["git", "switch -c feature"]], commit_steps("login.py", "x\n", "Login page"), commit_steps("auth.py", "y\n", "Auth")), "log:main", "branches")], samples=1, **G)

problem("git-merge-commit", "Merge Diverged Branches", "MEDIUM", "Merging",
        "Both `main` and `feature` have new commits, so the histories have diverged. You are on `main`.\n\nMerge `feature` into `main`, giving the merge commit the message `Merge feature`." + GNOTE,
        "Write git commands.", "`main` has a merge commit with that message and both branches' files.", "Use `git merge -m`.",
        "git merge feature -m \"Merge feature\"",
        [gt(base([["git", "switch -c feature"]], commit_steps("feature.txt", "f\n", "Add feature"), [["git", "switch main"]], commit_steps("main.txt", "m\n", "Update main")), "log", "files"),
         gt(base([["git", "switch -c feature"]], commit_steps("a.txt", "a\n", "Add a"), [["git", "switch main"]], commit_steps("b.txt", "b\n", "Add b")), "head", "log"),
         gt(base([["git", "switch -c feature"]], commit_steps("x.txt", "x\n", "Add x"), [["git", "switch main"]], commit_steps("y.txt", "y\n", "Add y")), "status", "files")], samples=1, **G)

problem("git-revert-last-commit", "Undo with Revert", "MEDIUM", "Undoing changes",
        "The last commit added a bug. Undo it **without rewriting history**: create a new commit that reverses the last commit (`git revert --no-edit HEAD`)." + GNOTE,
        "Write git commands.", "A new revert commit exists on top; earlier commits are untouched.", "Use `git revert`.",
        "git revert --no-edit HEAD",
        [gt(base(commit_steps("feature.txt", "ok\n", "Add feature"), commit_steps("bug.txt", "oops\n", "Add bug")), "log"),
         gt(base(commit_steps("feature.txt", "ok\n", "Add feature"), commit_steps("bug.txt", "oops\n", "Add bug")), "files", "status"),
         gt(base(commit_steps("a.txt", "a\n", "Add a"), commit_steps("b.txt", "b\n", "Break b")), "log", "head")], samples=1, **G)

problem("git-stage-selectively", "Stage Only Some Changes", "EASY", "Staging",
        "`a.txt`, `b.txt` and `c.txt` were all edited. Commit **only** `a.txt`, with the message `Update a`. The other two files must stay modified but uncommitted." + GNOTE,
        "Write git commands.", "One new commit that contains only `a.txt`.", "Use `git add <file>` then `git commit`.",
        "git add a.txt\ngit commit -m \"Update a\"",
        [gt(base(commit_steps("a.txt", "1\n", "Add a"), commit_steps("b.txt", "1\n", "Add b"), commit_steps("c.txt", "1\n", "Add c"), [["write", "a.txt", "2\n"], ["write", "b.txt", "2\n"], ["write", "c.txt", "2\n"]]), "log", "status"),
         gt(base(commit_steps("a.txt", "x\n", "Add a"), commit_steps("b.txt", "x\n", "Add b"), commit_steps("c.txt", "x\n", "Add c"), [["write", "a.txt", "y\n"], ["write", "b.txt", "y\n"], ["write", "c.txt", "y\n"]]), "status"),
         gt(base(commit_steps("a.txt", "p\n", "Add a"), commit_steps("b.txt", "p\n", "Add b"), commit_steps("c.txt", "p\n", "Add c"), [["write", "a.txt", "q\n"], ["write", "b.txt", "q\n"], ["write", "c.txt", "q\n"]]), "file:a.txt", "log")], samples=1, **G)

problem("git-tag-release", "Tag a Release", "EASY", "Tags",
        "The repository has three commits.\n\n1. Mark the **second** commit with a lightweight tag `v0.9` (`git tag v0.9 HEAD~1`).\n2. Mark the latest commit with an annotated tag `v1.0` and the message `Release 1.0`." + GNOTE,
        "Write git commands.", "Both tags exist, with the right kinds.", "Use `git tag` and `git tag -a`.",
        "git tag v0.9 HEAD~1\ngit tag -a v1.0 -m \"Release 1.0\"",
        [gt(base(commit_steps("a.txt", "a\n", "Add a"), commit_steps("b.txt", "b\n", "Add b")), "tags"),
         gt(base(commit_steps("one.txt", "1\n", "One"), commit_steps("two.txt", "2\n", "Two")), "tags", "log"),
         gt(base(commit_steps("x.txt", "x\n", "X"), commit_steps("y.txt", "y\n", "Y")), "tags", "head")], samples=1, **G)

problem("git-stash-hotfix", "Stash, Hotfix, Come Back", "MEDIUM", "Stash",
        "You are in the middle of editing `notes.txt` when a hotfix is needed.\n\n1. Stash your work.\n2. Create and switch to a branch `hotfix`, and make an empty commit `Hotfix`.\n3. Switch back to `main` and restore your stashed work (`git stash pop`)." + GNOTE,
        "Write git commands.", "`main` is checked out with `notes.txt` modified again; `hotfix` has the commit.", "Use `git stash`, `git switch -c`, `git stash pop`.",
        "git stash\ngit switch -c hotfix\ngit commit --allow-empty -m \"Hotfix\"\ngit switch main\ngit stash pop",
        [gt(base(commit_steps("notes.txt", "v1\n", "Add notes"), [["write", "notes.txt", "v2 in progress\n"]]), "head", "status"),
         gt(base(commit_steps("notes.txt", "v1\n", "Add notes"), [["write", "notes.txt", "v2 in progress\n"]]), "branches", "log:hotfix"),
         gt(base(commit_steps("notes.txt", "a\n", "Add notes"), [["write", "notes.txt", "b\n"]]), "file:notes.txt", "log:main")], samples=1, **G)

problem("git-rebase-feature", "Rebase onto main", "HARD", "Rebasing",
        "`feature` was branched from the first commit, and `main` has moved on since. You are on `feature`.\n\nReplay the `feature` commits on top of `main` so the history is a straight line (`git rebase main`)." + GNOTE,
        "Write git commands.", "`feature` has `main`'s commits first, then its own, with no merge commit.", "Use `git rebase`.",
        "git rebase main",
        [gt(base([["git", "switch -c feature"]], commit_steps("f1.txt", "1\n", "Add f1"), commit_steps("f2.txt", "2\n", "Add f2"), [["git", "switch main"]], commit_steps("docs.txt", "d\n", "Update docs"), [["git", "switch feature"]]), "log", "head"),
         gt(base([["git", "switch -c feature"]], commit_steps("f1.txt", "1\n", "Add f1"), commit_steps("f2.txt", "2\n", "Add f2"), [["git", "switch main"]], commit_steps("docs.txt", "d\n", "Update docs"), [["git", "switch feature"]]), "files", "log:main"),
         gt(base([["git", "switch -c feature"]], commit_steps("ui.txt", "u\n", "Add UI"), [["git", "switch main"]], commit_steps("api.txt", "a\n", "Add API"), commit_steps("db.txt", "d\n", "Add DB"), [["git", "switch feature"]]), "log")], samples=1, **G)

problem("github-add-remote", "Connect to GitHub", "EASY", "GitHub",
        "Your local repository has a commit, but it is not connected to GitHub yet.\n\nAdd a remote called `origin` that points to `https://github.com/nextbyte/demo.git`." + GNOTE,
        "Write git commands.", "`git remote -v` lists `origin` with that URL.", "Use `git remote add`.",
        "git remote add origin https://github.com/nextbyte/demo.git",
        [gt(base(), "remotes"), gt(base(commit_steps("a.txt", "a\n", "Add a")), "remotes", "log"), gt(base(), "remotes", "head")], samples=1, **G)

problem("github-push-main", "Push to GitHub", "EASY", "GitHub",
        "`origin` is your GitHub repository. It is empty, and `main` has commits locally.\n\nPush `main` to `origin` and set it as the upstream branch (`git push -u origin main`)." + GNOTE,
        "Write git commands.", "`origin` has a `main` branch with your commits.", "Use `git push -u`.",
        "git push -u origin main",
        [gt(base([["remote"]]), "remote-branches", "remote-log:main"),
         gt(base([["remote"]], commit_steps("a.txt", "a\n", "Add a")), "remote-log:main"),
         gt(base([["remote"]], commit_steps("a.txt", "a\n", "Add a"), commit_steps("b.txt", "b\n", "Add b")), "remote-branches", "remote-log:main")], samples=1, **G)

problem("github-push-feature-branch", "Push a Feature Branch", "MEDIUM", "GitHub",
        "`main` is already on GitHub (`origin`).\n\n1. Create and switch to a branch `feature/readme`.\n2. Make an empty commit `Improve README`.\n3. Push the branch to `origin` and set its upstream (`git push -u origin feature/readme`)." + GNOTE,
        "Write git commands.", "`origin` has both `main` and `feature/readme`.", "Use `git switch -c` and `git push -u`.",
        "git switch -c feature/readme\ngit commit --allow-empty -m \"Improve README\"\ngit push -u origin feature/readme",
        [gt(base([["remote"], ["git", "push -u origin main"]]), "remote-branches", "head"),
         gt(base([["remote"], ["git", "push -u origin main"]]), "remote-log:feature/readme"),
         gt(base([["remote"], ["git", "push -u origin main"]], commit_steps("a.txt", "a\n", "Add a"), [["git", "push origin main"]]), "remote-log:feature/readme", "remote-log:main")], samples=1, **G)

problem("github-pull-teammate", "Pull Your Teammate's Work", "MEDIUM", "GitHub",
        "A teammate pushed a new commit to `main` on GitHub (`origin`), so your local `main` is one commit behind.\n\nBring your local `main` up to date (`git pull origin main`)." + GNOTE,
        "Write git commands.", "Your `main` contains the teammate's commit.", "Use `git pull`.",
        "git pull origin main",
        [gt(base([["remote"], ["git", "push -u origin main"]], commit_steps("team.txt", "t\n", "Teammate update"), [["git", "push origin main"], ["git", "reset --hard HEAD~1"]]), "log", "head"),
         gt(base([["remote"], ["git", "push -u origin main"]], commit_steps("team.txt", "t\n", "Teammate update"), [["git", "push origin main"], ["git", "reset --hard HEAD~1"]]), "files"),
         gt(base([["remote"], ["git", "push -u origin main"]], commit_steps("a.txt", "a\n", "Add a"), commit_steps("b.txt", "b\n", "Add b"), [["git", "push origin main"], ["git", "reset --hard HEAD~2"]]), "log", "status")], samples=1, **G)

# ======================================================================================================
# DevOps track: shell scripting (a real bash), Dockerfiles and YAML (CI, Compose, Kubernetes).
# ======================================================================================================
SH = dict(track="DevOps", lang="bash", languages=["bash"])

problem("bash-greeting", "Shell Variables", "EASY", "Shell scripting",
        "Read a name from standard input into a variable and print `Hello, <name>! Welcome to DevOps.`",
        "One line with a name.", "Print the greeting.", "Use `read` and a variable.",
        'read name\necho "Hello, $name! Welcome to DevOps."',
        ["Asha", "Ravi", "NextByte", "DevOps Team", "Zoya", "Neel"], **SH)

problem("bash-sum-loop", "Sum with a Loop", "EASY", "Shell scripting",
        "Read `n` and print the sum of `1 + 2 + ... + n`, using a loop and shell arithmetic.",
        "One integer `n`.", "Print the sum.", "1 <= n <= 10^5",
        'read n\nsum=0\nfor ((i = 1; i <= n; i++)); do\n  sum=$((sum + i))\ndone\necho "$sum"',
        ["10", "1", "100", "5", "1000", "99999"], **SH)

problem("bash-count-errors", "Count the Errors in a Log", "EASY", "Log processing",
        "Standard input is a log file. Print how many lines contain the word `ERROR` (upper case).",
        "Any number of log lines.", "Print the number of lines containing `ERROR`.", "At most 10^5 lines.",
        "grep -c 'ERROR' || true",
        ["INFO start\nERROR disk full\nINFO ok\nERROR timeout\n", "INFO a\nINFO b\n", "ERROR x\n", "WARN low memory\nERROR failed\nerror lowercase\nERROR again\nINFO done\n", "ERROR ERROR twice on one line\nINFO fine\n", "INFO 1\nINFO 2\nINFO 3\nERROR 4\nINFO 5\n"], **SH)

problem("bash-disk-alert", "Disk Usage Alert", "MEDIUM", "Log processing",
        "Each input line is a mount point and the percentage of disk used, like `/var 85`. Print the mount points that are **80% or more** full, one per line, in input order.",
        "Lines of `mount percent`.", "Print the full mount points.", "At most 1000 lines.",
        "awk '$2 >= 80 { print $1 }'",
        ["/ 45\n/var 85\n/home 80\n/tmp 79\n", "/data 99\n", "/a 10\n/b 20\n/c 90\n", "/boot 80\n/opt 81\n/srv 50\n/mnt 100\n", "/x 79\n/y 80\n", "/logs 95\n/cache 12\n/backup 88\n/db 80\n"], **SH)

problem("bash-top-ips", "Busiest Clients", "MEDIUM", "Log processing",
        "Each input line is a client IP address and a status code, like `10.0.0.1 200`. Print every IP with how many requests it made as `<ip> <count>`, **busiest first**; when two IPs have the same count, put the one that sorts first alphabetically first.",
        "Lines of `ip status`.", "One `<ip> <count>` line per IP.", "At most 10^5 lines.",
        "awk '{ print $1 }' | sort | uniq -c | awk '{ print $2, $1 }' | sort -k2,2nr -k1,1",
        ["10.0.0.1 200\n10.0.0.2 404\n10.0.0.1 200\n10.0.0.3 200\n10.0.0.1 500\n10.0.0.2 200\n", "1.1.1.1 200\n", "9.9.9.9 200\n8.8.8.8 200\n9.9.9.9 200\n8.8.8.8 500\n", "192.168.0.5 200\n192.168.0.5 200\n192.168.0.6 404\n", "10.1.1.1 200\n10.1.1.2 200\n10.1.1.3 200\n10.1.1.1 200\n", "5.5.5.5 301\n5.5.5.5 200\n6.6.6.6 200\n5.5.5.5 200\n6.6.6.6 200\n7.7.7.7 200\n"], **SH)

DK = dict(track="DevOps", lang="dockerfile", languages=["dockerfile"])
DNOTE = "\n\nWrite the Dockerfile in the editor. It is checked instruction by instruction; nothing is built or run."


def dk(**check):
    return json.dumps(check)


problem("docker-node-app", "Dockerfile for a Node.js App", "EASY", "Docker",
        "Containerise a Node.js app:\n- start from a **Node 20** image (`node:20...`)\n- set the working directory to `/app`\n- copy `package*.json` and run `npm install` **before** copying the rest of the code, so Docker can cache the dependencies\n- copy the rest of the source\n- document port `3000`\n- start it with `node server.js` in exec form (`CMD [\"node\", \"server.js\"]`)" + DNOTE,
        "Write a Dockerfile.", "The checks pass when it has the parts above.", "Plain Dockerfile syntax.",
        'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]',
        [dk(type="instruction", name="FROM", startswith="node:20", label="a Node 20 base image"),
         dk(type="instruction", name="WORKDIR", contains="/app", label="WORKDIR /app"),
         dk(type="order", before={"name": "COPY", "contains": "package"}, after={"name": "RUN", "contains": "npm install"}),
         dk(type="order", before={"name": "RUN", "contains": "npm install"}, after={"name": "COPY", "contains": ". ."}),
         dk(type="instruction", name="EXPOSE", contains="3000", label="EXPOSE 3000"),
         dk(type="instruction", name="CMD", exec=True, contains="server.js", label="CMD in exec form running server.js")], samples=2, **DK)

problem("docker-python-app", "Dockerfile for a Python App", "EASY", "Docker",
        "Containerise a Python app:\n- start from `python:3.12...`\n- working directory `/app`\n- copy `requirements.txt` and install it with `pip install --no-cache-dir -r requirements.txt` **before** copying the code\n- copy the source\n- document port `5000`\n- run `python app.py` in exec form" + DNOTE,
        "Write a Dockerfile.", "The checks pass when it has the parts above.", "Plain Dockerfile syntax.",
        'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 5000\nCMD ["python", "app.py"]',
        [dk(type="instruction", name="FROM", startswith="python:3.12", label="a Python 3.12 base image"),
         dk(type="instruction", name="WORKDIR", contains="/app", label="WORKDIR /app"),
         dk(type="order", before={"name": "COPY", "contains": "requirements.txt"}, after={"name": "RUN", "contains": "pip install"}),
         dk(type="instruction", name="RUN", contains="--no-cache-dir", label="pip install with --no-cache-dir"),
         dk(type="instruction", name="EXPOSE", contains="5000", label="EXPOSE 5000"),
         dk(type="instruction", name="CMD", exec=True, contains="app.py", label="CMD in exec form running app.py")], samples=2, **DK)

problem("docker-secure-image", "A Safer Image", "MEDIUM", "Docker",
        "Write a small Dockerfile that follows good practice:\n- a **pinned** base image tag (no `latest`), for example `alpine:3.19`\n- a working directory\n- create a non-root user and switch to it with `USER` (not `root`)\n- a `HEALTHCHECK`\n- a `CMD`" + DNOTE,
        "Write a Dockerfile.", "The checks pass when it has the parts above.", "Plain Dockerfile syntax.",
        'FROM alpine:3.19\nWORKDIR /app\nRUN adduser -D appuser\nCOPY . .\nUSER appuser\nHEALTHCHECK CMD wget -qO- http://localhost:8080/health || exit 1\nCMD ["./start.sh"]',
        [dk(type="instruction", name="FROM", regex=r":[^\s:]+$", label="a FROM with a tag"),
         dk(type="absent", name="FROM", endswith=":latest", label="the latest tag"),
         dk(type="instruction", name="WORKDIR", label="a WORKDIR"),
         dk(type="instruction", name="USER", regex=r"^(?!root\b)(?!0\b)\S+", label="a non-root USER"),
         dk(type="instruction", name="HEALTHCHECK", label="a HEALTHCHECK"),
         dk(type="instruction", name="CMD", label="a CMD")], samples=2, **DK)

YM = dict(track="DevOps", lang="yaml", languages=["yaml"])
YNOTE = "\n\nWrite the YAML in the editor. Its structure is checked; nothing is deployed."


def ym(path, **check):
    return json.dumps({"type": "yaml", "path": path, **check})


problem("ci-github-actions", "A GitHub Actions Workflow", "MEDIUM", "CI/CD",
        "Write a GitHub Actions workflow:\n- named `CI`\n- runs on **push** to `main` and on **pull requests** to `main`\n- one job called `test` on `ubuntu-latest`\n- its steps: check out the code with `actions/checkout@v4`, run `npm ci`, then run `npm test`" + YNOTE,
        "Write a workflow file.", "The checks pass when it has the parts above.", "Plain YAML.",
        "name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test",
        [ym("name", equals="CI"), ym("on.push.branches", contains="main"), ym("on.pull_request.branches", contains="main"),
         ym("jobs.test.runs-on", equals="ubuntu-latest"), ym("jobs.test.steps[*].uses", startswith="actions/checkout@v4"),
         ym("jobs.test.steps[*].run", contains="npm ci"), ym("jobs.test.steps[*].run", contains="npm test")], samples=2, **YM)

problem("ci-deploy-on-tag", "Deploy When a Tag Is Pushed", "MEDIUM", "CI/CD",
        "Write a GitHub Actions workflow that releases on version tags:\n- triggers on **push** of tags that match `v*`\n- a job `build` on `ubuntu-latest` that runs `docker build -t app .`\n- a job `deploy` that **needs** `build`, on `ubuntu-latest`, and runs `./deploy.sh`" + YNOTE,
        "Write a workflow file.", "The checks pass when it has the parts above.", "Plain YAML.",
        "name: Release\non:\n  push:\n    tags:\n      - 'v*'\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: docker build -t app .\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    steps:\n      - run: ./deploy.sh",
        [ym("on.push.tags", contains="v*"), ym("jobs.build.runs-on", equals="ubuntu-latest"), ym("jobs.build.steps[*].run", contains="docker build -t app ."),
         ym("jobs.deploy.needs", equals="build"), ym("jobs.deploy.runs-on", equals="ubuntu-latest"), ym("jobs.deploy.steps[*].run", contains="./deploy.sh")], samples=2, **YM)

problem("compose-web-db", "Docker Compose: Web and Database", "MEDIUM", "Containers",
        "Write a `docker-compose.yml` with two services:\n- `web`: built from the current folder (`build: .`), publishes **8080:80**, and `depends_on` `db`\n- `db`: image `postgres:16`, environment `POSTGRES_PASSWORD` set to `secret`, and a named volume `dbdata` mounted at `/var/lib/postgresql/data`\n\nDeclare the `dbdata` volume at the top level." + YNOTE,
        "Write a compose file.", "The checks pass when it has the parts above.", "Plain YAML.",
        'services:\n  web:\n    build: .\n    ports:\n      - "8080:80"\n    depends_on:\n      - db\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: secret\n    volumes:\n      - dbdata:/var/lib/postgresql/data\nvolumes:\n  dbdata:',
        [ym("services.web.build", equals="."), ym("services.web.ports", contains="8080:80"), ym("services.web.depends_on", contains="db"),
         ym("services.db.image", equals="postgres:16"), ym("services.db.environment.POSTGRES_PASSWORD", equals="secret"),
         ym("services.db.volumes", contains="dbdata:/var/lib/postgresql/data"), ym("volumes.dbdata")], samples=2, **YM)

problem("k8s-deployment", "A Kubernetes Deployment", "HARD", "Kubernetes",
        "Write a Kubernetes **Deployment**:\n- `apiVersion: apps/v1`, `kind: Deployment`, named `web`\n- **3** replicas\n- selects pods labelled `app: web` (`spec.selector.matchLabels`), and the pod template carries the same label\n- one container `web` using the image `nginx:1.27` that exposes `containerPort` **80**" + YNOTE,
        "Write a manifest.", "The checks pass when it has the parts above.", "Plain YAML.",
        "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: web\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      containers:\n        - name: web\n          image: nginx:1.27\n          ports:\n            - containerPort: 80",
        [ym("apiVersion", equals="apps/v1"), ym("kind", equals="Deployment"), ym("metadata.name", equals="web"), ym("spec.replicas", equals=3),
         ym("spec.selector.matchLabels.app", equals="web"), ym("spec.template.metadata.labels.app", equals="web"),
         ym("spec.template.spec.containers[*].image", equals="nginx:1.27"), ym("spec.template.spec.containers[*].ports[*].containerPort", equals=80)], samples=2, **YM)

problem("k8s-service", "A Kubernetes Service", "MEDIUM", "Kubernetes",
        "Write a Kubernetes **Service** that exposes the `web` pods inside the cluster:\n- `apiVersion: v1`, `kind: Service`, named `web`\n- type `ClusterIP`\n- selects pods labelled `app: web`\n- forwards port **80** to the container's `targetPort` **80**" + YNOTE,
        "Write a manifest.", "The checks pass when it has the parts above.", "Plain YAML.",
        "apiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  type: ClusterIP\n  selector:\n    app: web\n  ports:\n    - port: 80\n      targetPort: 80",
        [ym("apiVersion", equals="v1"), ym("kind", equals="Service"), ym("metadata.name", equals="web"), ym("spec.type", equals="ClusterIP"),
         ym("spec.selector.app", equals="web"), ym("spec.ports[*].port", equals=80), ym("spec.ports[*].targetPort", equals=80)], samples=2, **YM)


# ---------------- Starting code for the C, Java and React tracks ----------------
# What the editor shows before the student types: the input is already read (or the component signature is in place).
# Python, DSA and the other tracks get theirs from the reference solution (see src/modules/coding/models/starters.js).
C_HEAD = "#include <stdio.h>\n\n"
J_HEAD = "import java.util.*;\n\n"
STARTERS = {
    "c-hello-printf": {"c": C_HEAD + "int main(void) {\n    \n    return 0;\n}\n"},
    "c-pointer-swap": {"c": C_HEAD + "void swap(int *x, int *y) {\n    \n}\n\nint main(void) {\n    int a, b;\n    scanf(\"%d %d\", &a, &b);\n    \n    return 0;\n}\n"},
    "c-array-reverse": {"c": C_HEAD + "int main(void) {\n    int n, a[1000];\n    scanf(\"%d\", &n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &a[i]);\n    \n    return 0;\n}\n"},
    "c-string-length": {"c": C_HEAD + "int main(void) {\n    char word[101];\n    scanf(\"%100s\", word);\n    \n    return 0;\n}\n"},
    "c-factorial-recursion": {"c": C_HEAD + "long long fact(int n) {\n    \n    return 0;\n}\n\nint main(void) {\n    int n;\n    scanf(\"%d\", &n);\n    \n    return 0;\n}\n"},
    "c-sum-and-average": {"c": C_HEAD + "int main(void) {\n    int n, a[1000];\n    scanf(\"%d\", &n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &a[i]);\n    \n    return 0;\n}\n"},
    "c-struct-topper": {"c": C_HEAD + "struct Student {\n    char name[32];\n    int marks;\n};\n\nint main(void) {\n    int n;\n    struct Student s[100];\n    scanf(\"%d\", &n);\n    for (int i = 0; i < n; i++) scanf(\"%31s %d\", s[i].name, &s[i].marks);\n    \n    return 0;\n}\n"},
    "java-hello": {"java": "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n"},
    "java-rectangle-class": {"java": J_HEAD + "class Rectangle {\n    // fields, constructor, area() and perimeter()\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int width = in.nextInt(), height = in.nextInt();\n        \n    }\n}\n"},
    "java-palindrome-string": {"java": J_HEAD + "public class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        String word = in.next();\n        \n    }\n}\n"},
    "java-sort-descending": {"java": J_HEAD + "public class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        List<Integer> a = new ArrayList<>();\n        for (int i = 0; i < n; i++) a.add(in.nextInt());\n        \n    }\n}\n"},
    "java-fibonacci-recursion": {"java": J_HEAD + "public class Main {\n    static long fib(int n) {\n        \n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        \n    }\n}\n"},
    "java-reverse-words": {"java": J_HEAD + "public class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        String line = in.nextLine();\n        \n    }\n}\n"},
    "java-shapes-polymorphism": {"java": J_HEAD + "abstract class Shape {\n    abstract double area();\n}\n\n// class Circle, Square and Rectangle extend Shape\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int q = in.nextInt();\n        for (int i = 0; i < q; i++) {\n            String kind = in.next();\n            \n        }\n    }\n}\n"},
    "react-greeting": {"react": "export default function Greeting({ name }) {\n  return (\n    \n  );\n}\n"},
    "react-fruit-list": {"react": "export default function FruitList({ items }) {\n  return (\n    \n  );\n}\n"},
    "react-online-badge": {"react": "export default function Badge({ online }) {\n  return (\n    \n  );\n}\n"},
    "react-profile-card": {"react": "export default function ProfileCard({ name, role, skills }) {\n  return (\n    \n  );\n}\n"},
    "react-usestate-counter": {"react": "import { useState } from 'react';\n\nexport default function Counter({ start = 0 }) {\n  \n  return (\n    \n  );\n}\n"},
    "react-controlled-input": {"react": "import { useState } from 'react';\n\nexport default function NameForm({ initial }) {\n  \n  return (\n    \n  );\n}\n"},
    "react-card-children": {"react": "export default function Card({ title, children }) {\n  return (\n    \n  );\n}\n"},
    "react-todo-list": {"react": "export default function TodoList({ todos }) {\n  return (\n    \n  );\n}\n"},
}
for _p in P:
    if _p["slug"] in STARTERS:
        _p["starters"] = STARTERS.pop(_p["slug"])
assert not STARTERS, f"starters for unknown problems: {list(STARTERS)}"
