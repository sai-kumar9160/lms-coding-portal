> **In simple words:**  A `for` loop **repeats a block of code once for every item in a collection**.

Unlike loops in C or Java, Python's `for` does not need a counter — you simply say "for each item in this thing", and Python handles the stepping and the stopping. It works on lists, strings, tuples, sets, dictionaries, files and `range()`. Use it whenever you already know what you are looping over.

## The Idea

A `for` loop repeats a block **once for every item in a sequence**. Unlike C or Java, Python's `for` is an \*iterator\* loop — you do not manage a counter, you simply say "for each item".

```python
for item in sequence:
    # this block runs once per item
```

## Looping Over Different Things

```python
# Over a list
for fruit in ["apple", "mango", "banana"]:
    print(fruit)

# Over a string
for ch in "PY":
    print(ch)               # P then Y

# Over a range of numbers
for i in range(5):          # 0 1 2 3 4
    print(i)

for i in range(1, 6):       # 1 2 3 4 5
    print(i)

for i in range(10, 0, -2):  # 10 8 6 4 2
    print(i)

# Over a dictionary
for k, v in {"a": 1, "b": 2}.items():
    print(k, v)
```

## range() Explained

| Call | Produces | Meaning |
| --- | --- | --- |
| `range(5)` | 0 1 2 3 4 | start=0, stop=5, step=1 |
| `range(2, 7)` | 2 3 4 5 6 | stop is always excluded |
| `range(0, 10, 3)` | 0 3 6 9 | step of 3 |
| `range(5, 0, -1)` | 5 4 3 2 1 | negative step counts down |

## enumerate() and zip() — Use These, Not Manual Counters

```python
students = ["Ravi", "Anu", "Kiran"]
marks    = [85, 92, 78]
```

```python
# enumerate -> index + value together
for i, name in enumerate(students, start=1):
    print(f"{i}. {name}")

# zip -> walk two lists side by side
for name, mark in zip(students, marks):
    print(f"{name:<8} {mark}")
```

**Output:**

```text
1. Ravi
2. Anu
3. Kiran
Ravi     85
Anu      92
Kiran    78
```

## Nested for Loops

```python
# Multiplication table 1 to 3
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i*j}", end="   ")
    print()          # newline after each row
```

**Output:**

```text
1 x 1 = 1   1 x 2 = 2   1 x 3 = 3
2 x 1 = 2   2 x 2 = 4   2 x 3 = 6
3 x 1 = 3   3 x 2 = 6   3 x 3 = 9
```

#### Real-Time Example — Generating a Bill From a Cart

![Flow Chart 7 — for loop iterating over cart items](asset:chapter-9-figure-1.png)

*Flow Chart 7 — for loop iterating over cart items*

**Program: billing.py**

```python
cart = [
    {"name": "Wireless Mouse", "price": 799.00,  "qty": 2},
    {"name": "Keyboard",       "price": 1499.50, "qty": 1},
    {"name": "USB Cable",      "price": 149.00,  "qty": 3},
]

subtotal = 0
print(f"{'#':<3}{'ITEM':<20}{'QTY':>4}{'AMOUNT':>12}")
print("-" * 39)

for i, item in enumerate(cart, start=1):
    amount = item["price"] * item["qty"]
    subtotal += amount
    print(f"{i:<3}{item['name']:<20}{item['qty']:>4}{amount:>12.2f}")

gst   = subtotal * 0.18
total = subtotal + gst

print("-" * 39)
print(f"{'Subtotal':<27}{subtotal:>12.2f}")
print(f"{'GST @ 18%':<27}{gst:>12.2f}")
print(f"{'TOTAL PAYABLE':<27}{total:>12.2f}")
```

**Output:**

```text
#  ITEM                 QTY      AMOUNT
---------------------------------------
1  Wireless Mouse         2     1598.00
2  Keyboard               1     1499.50
3  USB Cable              3      447.00
---------------------------------------
Subtotal                        3544.50
GST @ 18%                        638.01
TOTAL PAYABLE                   4182.51
```

## More Practice — Classic for-Loop Programs

### 1. Multiplication table of any number

```python
n = 7
for i in range(1, 11):
    print(f"{n} x {i:2} = {n * i:3}")
```

**Output:**

```text
7 x  1 =   7
7 x  2 =  14
...
7 x 10 =  70
```

### 2. Sum and average of a list

```python
marks = [85, 92, 78, 95, 88]

total = 0
for m in marks:
    total += m

print("Total  :", total)
print("Average:", total / len(marks))

# Built-in shortcut
print("Average:", sum(marks) / len(marks))
```

**Output:**

```text
Total  : 438
Average: 87.6
Average: 87.6
```

### 3. Count vowels in a word

```python
word = "programming"
count = 0

for ch in word:
    if ch.lower() in "aeiou":
        count += 1

print(f"'{word}' has {count} vowels")
```

**Output:**

```text
'programming' has 3 vowels
```

### 4. Star patterns

```python
# Right-angle triangle
for i in range(1, 6):
    print("*" * i)

print()
```

```python
# Pyramid
n = 5
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))
```

**Output:**

```text
*
**
***
****
*****
    *
   ***
  *****
 *******
*********
```

### 5. Factorial of a number

```python
n = 5
fact = 1

for i in range(1, n + 1):
    fact *= i

print(f"{n}! = {fact}")
```

**Output:**

```text
5! = 120
```

### 6. Find the largest number without max()

```python
numbers = [23, 78, 12, 95, 44]
largest = numbers[0]

for n in numbers:
    if n > largest:
        largest = n

print("Largest:", largest)
```

**Output:**

```text
Largest: 95
```

### 7. Print a list in reverse with its position

```python
students = ["Ravi", "Anu", "Kiran", "Meera"]

for i in range(len(students) - 1, -1, -1):
    print(i, students[i])

# Cleaner Python way
for i, name in reversed(list(enumerate(students))):
    print(i, name)
```

### 8. Grade every student in one loop

```python
results = {"Ravi": 85, "Anu": 92, "Kiran": 34, "Meera": 67}

for name, mark in results.items():
    if mark >= 90:
```

```python
        grade = "A+"
    elif mark >= 75:
        grade = "A"
    elif mark >= 35:
        grade = "Pass"
    else:
        grade = "Fail"
    print(f"{name:<8} {mark:>3}  {grade}")
```

**Output:**

```text
Ravi      85  A
Anu       92  A+
Kiran     34  Fail
Meera     67  Pass
```
