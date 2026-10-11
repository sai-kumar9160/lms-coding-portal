> **In simple words:**  These are the basic writing rules of Python — how to add notes, how to mark blocks of  code, and how to name things.

Comments are notes that Python ignores. Indentation (spaces at the start of a line) is how Python groups statements together. Keywords are reserved words that already have a meaning, and identifiers are the names you invent for your own variables and functions. Getting these four right removes most beginner error messages.

## Comments

A comment is a note for humans; Python ignores it completely. Use `#` for a single line. For a multi-line explanation you can use consecutive `#` lines or a triple-quoted string.

```python
# This is a single-line comment

total = 500      # you can also comment at the end of a line

"""
This is a docstring. When it is the FIRST statement inside a
function, class or module, Python stores it in __doc__ and
tools like help() display it.
"""
```

## Indentation — Python's Most Important Rule

Other languages use `{ }` to mark a block. Python uses **indentation (spaces)**. Every line inside an `if`, loop, function or class must be indented by the same amount — **4 spaces is the standard**. Mixing tabs and spaces causes `IndentationError`.

```python
if 10 > 5:
    print("Ten is bigger")      # 4 spaces -> inside the if
    print("Still inside")       # same level -> also inside
print("Outside the if")         # no indent -> always runs
```

> **Common mistake:**  Forgetting the colon `:` at the end of `if`, `for`, `while`, `def`, `class`. The colon opens the block;  the indentation fills it.

## Keywords

Keywords are 35 reserved words that already have a meaning; you cannot use them as your own names. Check any time with `import keyword; print(keyword.kwlist)`.

**The 35 Python keywords**

```python
False   None    True    and     as      assert   async   await
break   class   continue def    del     elif     else    except
finally for     from    global  if      import   in      is
lambda  nonlocal not     or      pass    raise    return  try
while   with    yield
```

## Identifiers — Naming Rules

- Can contain letters, digits and underscore; **cannot start with a digit** (`2name` is invalid).
- **Case sensitive** — `total`, `Total` and `TOTAL` are three different variables.
- No spaces and no special characters like `-`, `@`, `$`.
- Cannot be a keyword (`class = 5` is an error).

### Naming conventions the industry follows (PEP 8)

| Element | Convention | Example |
| --- | --- | --- |
| Variable / function | lower_case_with_underscores | `employee_salary', 'calculate_tax()` |
| Constant | ALL_CAPS | `MAX_LOGIN_ATTEMPTS = 3` `class SavingsAccount:` |
| Class | PascalCase | `_balance` |
| Private (internal) | leading underscore | `payroll.py` |
| Module / file | short lowercase |  |

#### Real-Time Example — Readable Code in a Team

In a real project 10 people read your code for every 1 time you write it. `d = 30` tells a reviewer nothing; `credit_period_days = 30` tells them everything. Naming is not decoration — it is the cheapest documentation you will ever write.
