> **In simple words:**  File handling means **reading data from files on disk and writing results back to them**.

The pattern is always the same: open the file in the right mode, work with it, then close it. The `with` `open(...)` block is the safe way to do this because it closes the file automatically even if an error occurs halfway through. Files are how a program's data survives after it stops running.

## Opening a File

```python
f = open("data.txt", "r")
content = f.read()
f.close()                  # you MUST remember this -- easy to forget

# BETTER: with-block closes the file automatically, even if an error occurs
with open("data.txt", "r") as f:
    content = f.read()
# file is already closed here
```

## File Modes

| Mode | Name | If file exists | If file missing |
| --- | --- | --- | --- |
| `r` | read (default) | reads from start | \*\*FileNotFoundError\*\* |
| `w` | write | \*\*erases everything\*\* | creates it |
| `a` | append | adds at the end | creates it |
| `x` | exclusive create | \*\*FileExistsError\*\* | creates it |
| `r+` | read + write | reads and writes | error |
| `rb' / 'wb` | binary | images, PDFs, zips | — |

> **Danger:**  Opening an existing file in `"w"` mode wipes it instantly, before you write anything. Use `"a"` when you  want to add to a file.

## Reading Methods

```python
with open("sales.txt") as f:
    all_text = f.read()          # entire file as ONE string

with open("sales.txt") as f:
    first = f.readline()         # one line

with open("sales.txt") as f:
    lines = f.readlines()        # list of lines (keeps \n)

with open("sales.txt") as f:     # BEST for large files -- one line at a time
    for line in f:
        print(line.strip())
```

## Writing to a File

```python
with open("report.txt", "w") as f:
```

```python
    f.write("Daily Sales Report\n")
    f.write("=" * 30 + "\n")
    f.writelines(["Line A\n", "Line B\n"])

with open("report.txt", "a") as f:       # append, does not erase
    f.write("Generated at 6 PM\n")
```

## Working With CSV and JSON

```python
import csv, json

# --- CSV ---
with open("employees.csv", "r") as f:
    for row in csv.DictReader(f):
        print(row["name"], row["salary"])

with open("out.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "salary"])
    writer.writeheader()
    writer.writerow({"name": "Ravi", "salary": 45000})

# --- JSON ---
data = {"id": 101, "name": "Ravi", "skills": ["Python", "SQL"]}

with open("user.json", "w") as f:
    json.dump(data, f, indent=4)          # write

with open("user.json", "r") as f:
    loaded = json.load(f)                 # read
print(loaded["skills"])
```

#### Real-Time Example — Daily Sales Report Generator

![Flow Chart 23 — reading a file safely, record by record](asset:chapter-24-figure-1.png)

*Flow Chart 23 — reading a file safely, record by record*

**Program: daily_report.py**

```python
import os

INPUT_FILE  = "sales.txt"      # format:  date,product,qty,price
OUTPUT_FILE = "daily_report.txt"

def generate_report():
    if not os.path.exists(INPUT_FILE):
        print(f"{INPUT_FILE} not found -- nothing to process.")
        return

    totals, grand_total, bad_rows = {}, 0, 0

    with open(INPUT_FILE, "r") as f:
        next(f)                              # skip the header line
        for line_no, line in enumerate(f, start=2):
            parts = line.strip().split(",")
            if len(parts) != 4:
                bad_rows += 1
                continue
            try:
                _, product, qty, price = parts
                amount = int(qty) * float(price)
            except ValueError:
```

```python
                bad_rows += 1
                print(f"  Skipping malformed row at line {line_no}")
                continue

            totals[product] = totals.get(product, 0) + amount
            grand_total += amount

    with open(OUTPUT_FILE, "w") as out:
        out.write("DAILY SALES REPORT\n")
        out.write("=" * 40 + "\n")
        for product, amount in sorted(totals.items(), key=lambda kv: -kv[1]):
            out.write(f"{product:<25}{amount:>13,.2f}\n")
        out.write("-" * 40 + "\n")
        out.write(f"{'GRAND TOTAL':<25}{grand_total:>13,.2f}\n")
        out.write(f"\nSkipped rows: {bad_rows}\n")

    print(f"Report written to {OUTPUT_FILE} ({len(totals)} products, "
          f"Rs.{grand_total:,.2f})")

generate_report()
```

Every element of production file handling is here: check the file exists, use a `with` block so the handle always closes, skip the header, validate each row, count what you rejected, and write a clean output file.
