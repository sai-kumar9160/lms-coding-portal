> **In simple words:**  A module is a **`.py` file whose code you can reuse in another file**; a package is a folder of  modules.

Importing lets you split a large program into small, focused files, and gives you access to Python's huge standard library plus anything installed with `pip`. Good module boundaries are what keep a growing project maintainable: when a tax rule changes you edit `tax.py` and nothing else has to move.

## What Is a Module?

A **module** is simply a `.py` file containing functions, classes and variables that you can reuse in another file. A **package** is a folder of modules (containing an `__init__.py`).

## Four Ways to Import

```python
import math                      # whole module
print(math.sqrt(16))             # must prefix with math.

import math as m                 # with an alias
print(m.pi)

from math import sqrt, pi        # import specific names
print(sqrt(16))                  # no prefix needed

from math import *               # import everything -- AVOID, pollutes namespace
```

## Useful Standard Library Modules

| Module | Used for | Typical call |
| --- | --- | --- |
| `math` | maths functions | `math.sqrt()', 'math.ceil()` |
| `random` | random numbers / picks | `random.randint(1, 6)` |
| `datetime` | dates and times | `datetime.now()` |
| `os` | files, folders, environment | `os.listdir()', 'os.getenv()` |
| `json` | read/write JSON | `json.dumps()', 'json.loads()` |
| `csv` | read/write CSV files | `csv.DictReader()` |
| `re` | regular expressions | `re.match()', 're.findall()` |
| `collections` | advanced containers | `Counter', 'defaultdict` |
| `sys` | interpreter and arguments | `sys.argv', 'sys.exit()` |
| `time` | delays, timing | `time.sleep(2)` |

## Creating Your Own Module

```python
# ---------- file: tax_utils.py ----------
GST_RATE = 18.0

def add_gst(amount, rate=GST_RATE):
    return round(amount * (1 + rate / 100), 2)

def remove_gst(amount_with_tax, rate=GST_RATE):
```

```python
    return round(amount_with_tax / (1 + rate / 100), 2)

# ---------- file: main.py ----------
import tax_utils

print(tax_utils.add_gst(1000))          # 1180.0
print(tax_utils.GST_RATE)               # 18.0

from tax_utils import add_gst
print(add_gst(2000))                    # 2360.0
```

## The __name__ == "__main__" Idiom

```python
# ---------- tax_utils.py ----------
def add_gst(amount, rate=18.0):
    return round(amount * (1 + rate / 100), 2)

if __name__ == "__main__":
    # This block runs ONLY when you execute:  python tax_utils.py
    # It does NOT run when another file imports this module.
    print("Self-test:", add_gst(100))
```

> **Why this matters:**  Without this guard, any test/demo code at the bottom of your module would execute every  time someone imports it. This one line separates "library" from "script".

## Package Structure

```python
myproject/
    main.py
    payroll/                 <- a PACKAGE
        __init__.py          <- makes it a package
        salary.py
        tax.py
        reports.py

# In main.py:
from payroll.salary import calculate_net
from payroll import tax
```

#### Real-Time Example — Modularising a Payroll Application

**Program: payroll package**

```python
# ---------- payroll/tax.py ----------
SLABS = [(250000, 0.00), (500000, 0.05), (1000000, 0.20), (float("inf"), 0.30)]

def income_tax(annual):
    tax, previous = 0, 0
    for limit, rate in SLABS:
        if annual > previous:
            taxable = min(annual, limit) - previous
            tax += taxable * rate
            previous = limit
    return round(tax, 2)

# ---------- payroll/salary.py ----------
from .tax import income_tax
```

```python
def net_salary(monthly_gross, pf_percent=12):
    annual = monthly_gross * 12
    pf     = monthly_gross * pf_percent / 100
    tax_pm = income_tax(annual) / 12
    return round(monthly_gross - pf - tax_pm, 2)

# ---------- main.py ----------
from payroll.salary import net_salary

for gross in [40000, 75000, 120000]:
    print(f"Gross Rs.{gross:>7,} -> Net Rs.{net_salary(gross):>10,.2f}")
```

**Output:**

```text
Gross Rs. 40,000 -> Net Rs.  33,437.50
Gross Rs. 75,000 -> Net Rs.  60,750.00
Gross Rs.120,000 -> Net Rs.  90,850.00
```

Tax logic lives in one file, salary logic in another. When the government changes a slab, you edit `tax.py` only — `salary.py` and `main.py` do not change at all. That separation is what makes a codebase survive for years.
