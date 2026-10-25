> **In simple words:**  A comprehension builds a **new list, set or dictionary in a single line** from an existing  collection.

It replaces the familiar three-step pattern of creating an empty list, looping, and appending. Besides being shorter, comprehensions run faster because the looping happens inside Python's C engine. They can filter with `if` and transform at the same time — but if a comprehension no longer fits comfortably on one line, a normal loop is the better choice.

## The Idea

A comprehension builds a new list, set or dictionary **in a single readable line**. It replaces the create-empty-list → loop → append pattern and runs faster because the loop happens in C rather than in Python byte code.

```python
[ expression  for item in iterable  if condition ]
```

## List Comprehensions

```python
# Traditional way
squares = []
for n in range(1, 6):
    squares.append(n ** 2)

# Comprehension -- same result, one line
squares = [n ** 2 for n in range(1, 6)]        # [1, 4, 9, 16, 25]

# With a filter
evens = [n for n in range(20) if n % 2 == 0]

# With a transformation and a filter
names = ["ravi", "anu", "kiran", "jo"]
long_names = [n.title() for n in names if len(n) > 2]   # ['Ravi', 'Anu', 'Kiran']

# if-else INSIDE the expression (note the different position)
labels = ["Pass" if m >= 35 else "Fail" for m in [85, 20, 60]]
```

## Dictionary and Set Comprehensions

```python
# Dict comprehension
squares = {n: n ** 2 for n in range(1, 6)}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dictionary
prices = {"mouse": 799, "keyboard": 1499}
by_price = {v: k for k, v in prices.items()}

# Set comprehension -- unique first letters
initials = {name[0].upper() for name in ["ravi", "anu", "rahul"]}   # {'R', 'A'}
```

## Generator Expression — Memory Friendly

```python
# List comprehension builds the WHOLE list in memory
total = sum([n ** 2 for n in range(1_000_000)])     # ~40 MB used
```

```python
# Generator expression produces one value at a time
total = sum(n ** 2 for n in range(1_000_000))       # almost no memory
```

> **When NOT to use a comprehension:**  If it needs more than one condition plus a transformation, or if it becomes  longer than one line, write a normal loop. Clever is not the same as readable.

#### Real-Time Example — Cleaning a Data Export in One Pass

**Program: clean_export.py**

```python
raw_rows = [
    "  1001 , Ravi Kumar , 45000 , Active  ",
    "  1002 , Anu Reddy   , 62000 , Active  ",
    "  1003 , Kiran S     , 38000 , Inactive",
    "  1004 , Meera Nair  , 71000 , Active  ",
]

# Split, strip and keep only active employees
employees = [
    {"id": int(p[0]), "name": p[1], "salary": int(p[2])}
    for row in raw_rows
    if (p := [x.strip() for x in row.split(",")])[3] == "Active"
]

total_payroll = sum(e["salary"] for e in employees)
names = ", ".join(e["name"] for e in employees)

print(f"Active employees ({len(employees)}): {names}")
print(f"Monthly payroll : Rs.{total_payroll:,}")
```

**Output:**

```text
Active employees (3): Ravi Kumar, Anu Reddy, Meera Nair
Monthly payroll : Rs.178,000
```

## More Practice — Comprehension One-Liners

```python
# Squares of 1 to 10
print([n ** 2 for n in range(1, 11)])

# Multiples of 3 below 30
print([n for n in range(30) if n % 3 == 0])

# Convert a list of strings to integers
print([int(x) for x in ["10", "20", "30"]])

# Uppercase all names
print([n.upper() for n in ["ravi", "anu"]])

# Length of each word
print([len(w) for w in "learning python is fun".split()])

# Flatten a nested list
matrix = [[1, 2], [3, 4], [5, 6]]
print([n for row in matrix for n in row])          # [1,2,3,4,5,6]

# Pairs from two lists
print([(a, b) for a in [1, 2] for b in ["x", "y"]])

# Grade for each mark
print(["Pass" if m >= 35 else "Fail" for m in [85, 20, 60]])
```

```python
# Dictionary: number -> its cube
print({n: n ** 3 for n in range(1, 6)})

# Dictionary from two lists
names, marks = ["Ravi", "Anu"], [85, 92]
print({n: m for n, m in zip(names, marks)})

# Set of unique first letters
print({w[0] for w in ["apple", "avocado", "banana"]})

# Filter a list of dictionaries
staff = [{"name": "Ravi", "salary": 45000}, {"name": "Anu", "salary": 62000}]
print([s["name"] for s in staff if s["salary"] > 50000])
```

**Output:**

```text
[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
[0, 3, 6, 9, 12, 15, 18, 21, 24, 27]
[10, 20, 30]
['RAVI', 'ANU']
[8, 6, 2, 3]
[1, 2, 3, 4, 5, 6]
[(1, 'x'), (1, 'y'), (2, 'x'), (2, 'y')]
['Pass', 'Fail', 'Pass']
{1: 1, 2: 8, 3: 27, 4: 64, 5: 125}
{'Ravi': 85, 'Anu': 92}
{'a', 'b'}
['Anu']
```
