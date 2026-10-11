> **In simple words:**  Input is how a program **receives data from the user**; output is how it **shows results back**.

`input()` reads a line typed at the keyboard and always returns a string. `print()` displays values on the screen and can be tuned with `sep` and `end`. Formatting — deciding how many decimal places, how to align columns, where to put commas — is what turns raw numbers into a readable report, and f-strings are the modern way to do it.

## Taking Input

```python
name = input("Enter your name: ")             # always a string
age  = int(input("Enter your age: "))         # cast to int
cgpa = float(input("Enter your CGPA: "))      # cast to float

# Multiple values on one line, separated by space
a, b = input("Enter two numbers: ").split()
a, b = int(a), int(b)

# Shorter version using map()
x, y = map(int, input("Enter two numbers: ").split())
```

## Displaying Output

```python
print("Hello", "World")                  # sep default is one space
print("A", "B", "C", sep="-")            # A-B-C
print("Loading", end="...")              # no newline at the end
print("done")                            # -> Loading...done
```

## String Formatting — Three Ways

```python
name, salary = "Ravi", 45000.5

# 1. f-string  (Python 3.6+, RECOMMENDED)
print(f"{name} earns Rs.{salary:,.2f}")

# 2. .format()
print("{} earns Rs.{:.2f}".format(name, salary))

# 3. % formatting (old style)
print("%s earns Rs.%.2f" % (name, salary))
```

**Output:**

```text
Ravi earns Rs.45,000.50
```

## Handy f-string Format Specifiers

| Specifier | Meaning | Example | Result |
| --- | --- | --- | --- |
| `:.2f` | 2 decimal places | `f"{3.14159:.2f}"` | 3.14 |
| `:,` | thousand separator | `f"{1234567:,}"` | 1,234,567 |
| `:>10` | right align in 10 chars | `f"{'AB':>10}"` | '        AB' |
| `:<10` | left align | `f"{'AB':<10}"` | 'AB        ' |
| `:^10` | centre align | `f"{'AB':^10}"` | '    AB    ' |

```python
:.1%
f"{0.256:.1%}"
```

percentage 25.6%

```python
:05d
f"{42:05d}"
```

pad with zeros 00042

#### Real-Time Example — Printing a Formatted Invoice

**Program: invoice.py**

```python
items = [("Wireless Mouse", 2, 799.00),
         ("Keyboard",       1, 1499.50),
         ("USB Cable",      3, 149.00)]

print(f"{'ITEM':<20}{'QTY':>5}{'RATE':>10}{'AMOUNT':>12}")
print("-" * 47)

grand_total = 0
for name, qty, rate in items:
    amount = qty * rate
    grand_total += amount
    print(f"{name:<20}{qty:>5}{rate:>10.2f}{amount:>12.2f}")

print("-" * 47)
print(f"{'GRAND TOTAL':<35}{grand_total:>12,.2f}")
```

**Output:**

```text
ITEM                  QTY      RATE      AMOUNT
-----------------------------------------------
Wireless Mouse          2    799.00     1598.00
Keyboard                1   1499.50     1499.50
USB Cable               3    149.00      447.00
-----------------------------------------------
GRAND TOTAL                             3,544.50
```
