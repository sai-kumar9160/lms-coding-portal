> **In simple words:**  Python is a simple, English-like programming language used to give instructions to a  computer.

You write the instructions in a plain text file ending with `.py`, and the Python interpreter reads that file and carries the instructions out, one line at a time. The same file runs unchanged on Windows, Linux and macOS, which is why Python is used for everything from small automation scripts to Instagram's back-end.

## What is Python?

Python is a **high-level, interpreted, general-purpose** programming language created by **Guido van Rossum** and released in 1991. "High-level" means it is written in words close to English, so you worry about the logic, not about memory addresses. "Interpreted" means Python executes your file line by line instead of converting the whole program into a machine file first, which makes testing and debugging fast.

## Key Features

- **Simple & readable** — `print("Hello")` is a complete program. No semicolons, no braces.
- **Interpreted** — run directly with `python file.py`; no separate compile step for you.
- **Dynamically typed** — you never declare a type; `x = 10` then `x = "ten"` is legal.
- **Platform independent** — the same .py file runs on Windows, Linux and macOS.
- **Huge standard library** — file handling, JSON, dates, math, e-mail all built in.
- **Free and open source** — no licence cost, community-driven.
- **Multi-paradigm** — supports procedural, object-oriented and functional styles.

## Where Python Is Actually Used

| Domain | Real-world use | Popular tools |
| --- | --- | --- |
| Web development | Instagram and Spotify back-ends | Django, Flask, FastAPI |
| Data science | Sales forecasting, dashboards | Pandas, NumPy, Matplotlib |
| Machine learning | Face unlock, recommendations | TensorFlow, PyTorch, scikit-learn |
| Automation | Auto-generating daily MIS reports | openpyxl, selenium, requests |
| Scripting / DevOps | Server health-check scripts | os, subprocess, paramiko |
| Desktop apps | Billing and inventory software | Tkinter, PyQt |

## How a Python Program Actually Runs

Many people think Python is "only interpreted". In reality there are two steps: your source code is first **compiled into byte code** (the `.pyc` files you see inside a `__pycache__` folder), and that byte code is then executed by the **PVM (Python Virtual Machine)**. The flow chart below shows the complete journey.

![Flow Chart 1 — Life cycle of a Python program](asset:chapter-1-figure-1.png)

*Flow Chart 1 — Life cycle of a Python program*

#### Real-Time Example — Why a Bank Chose Python

A bank needs a script that reads a 2-lakh-row CSV of daily transactions, flags any transaction above ₹10 lakh, and e-mails a report at 6 PM. In Java this is roughly 200 lines with heavy setup. In Python it is about 20 lines using the built-in `csv` and `smtplib` modules, and any analyst on the team can read and maintain it. That readability-per-line is the single biggest reason Python dominates automation and data work.
