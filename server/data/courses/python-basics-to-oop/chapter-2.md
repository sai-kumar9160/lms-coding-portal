> **In simple words:**  Installing Python means putting the interpreter — the program that runs your code — on  your computer.

Along with the interpreter you also get **pip**, the tool that downloads extra libraries, and **IDLE**, a very basic editor. Most people install a better editor such as VS Code separately. Once installed, typing `python` in a terminal starts Python, and `python myfile.py` runs a saved program.

## Installation Steps (Windows)

- Go to **python.org → Downloads** and download the latest stable installer.
- Run the installer and **tick "Add python.exe to PATH"** — this single checkbox prevents 90% of beginner problems.
- Choose \*Install Now\*, then close the installer.
- Open Command Prompt and verify with `python --version` and `pip --version`.

## Choosing an Editor

**IDLE** ships with Python and is fine for day one. For real work use **VS Code** (free, lightweight, install the Python extension) or **PyCharm**. For data work use **Jupyter Notebook**, where each cell runs independently.

## Your First Program

**Program: hello.py**

```python
# hello.py  -- the classic first program
print("Hello, World!")
print("Welcome to Python")
```

**Output:**

```text
Hello, World!
Welcome to Python
```

Run it from the terminal with `python hello.py`. `print()` is a built-in **function**; the text inside quotes is a **string**; the parentheses pass that string as an **argument**.

## Two Ways to Run Python

| Mode | How | When to use |
| --- | --- | --- |
| Interactive (REPL) | Type `python` in terminal, get `>>>` prompt | Testing a single line, checking output of an expression |
| Script mode | Save as `.py`, run `python file.py | Real programs you want to save and re-run |

## pip — Installing Extra Libraries

**Common pip commands (run in the terminal, not inside Python)**

```python
pip install pandas          # install a package
pip install pandas==2.1.0   # install an exact version
pip list                    # show everything installed
pip uninstall pandas        # remove it
pip freeze > requirements.txt   # save the exact list for your team
```

#### Real-Time Example — Setting Up a Project the Professional Way

Before starting a new project a developer creates a **virtual environment** so that this project's library versions cannot break another project on the same laptop:

```python
python -m venv venv                 # create an isolated environment
venv\Scripts\activate              # activate it (Windows)
pip install -r requirements.txt     # install the project's exact libraries
```
