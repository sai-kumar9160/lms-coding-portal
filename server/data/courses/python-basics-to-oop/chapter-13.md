> **In simple words:**  A list is an **ordered collection of items** stored in a single variable, written inside square  brackets.

Lists are mutable, so you can add, change and remove items after creation, and they can hold any mix of types including other lists. They keep their order, allow duplicates, and support indexing and slicing exactly like strings. If you are ever unsure which collection to use, a list is the sensible default.

## What Is a List?

A list is an **ordered, mutable, indexable** collection that can hold mixed data types and allows duplicates. It is the workhorse data structure of Python — written with square brackets.

```python
empty   = []
numbers = [10, 20, 30, 40, 50]
mixed   = [1, "two", 3.0, True, [5, 6]]      # nesting allowed
repeats = [1, 1, 2, 2]                        # duplicates allowed
```

## Accessing and Slicing

```python
marks = [85, 92, 78, 95, 88]

print(marks[0])       # 85
print(marks[-1])      # 88
print(marks[1:4])     # [92, 78, 95]
print(marks[::-1])    # [88, 95, 78, 92, 85]
marks[2] = 80         # lists are MUTABLE
```

## List Methods

| Method | Purpose | Example on `n = [3, 1, 2]` |
| --- | --- | --- |
| `append(x)` | add one item at the end | n.append(9)` → [3,1,2,9] |
| `insert(i,x)` | insert at position i | n.insert(0,9)` → [9,3,1,2] |
| `extend(lst)` | add all items of another list | n.extend([7,8])` → [3,1,2,7,8] |
| `remove(x)` | remove first matching value | n.remove(1)` → [3,2] |
| `pop(i)` | remove & return (last by default) | n.pop()` → 2 |
| `clear()` | empty the list | n.clear()` → [] |
| `index(x)` | position of x | n.index(2)` → 2 |
| `count(x)` | occurrences of x | n.count(3)` → 1 |
| `sort()` | sort in place | n.sort()` → [1,2,3] |
| `reverse()` | reverse in place | n.reverse()` → [2,1,3] |
| `copy()` | shallow copy | `m = n.copy()` |

## sort() vs sorted()

```python
nums = [5, 2, 9, 1]
```

```python
nums.sort()                 # changes nums itself, returns None
print(nums)                 # [1, 2, 5, 9]

nums = [5, 2, 9, 1]
new = sorted(nums)          # returns a NEW list, nums unchanged
print(nums, new)            # [5, 2, 9, 1] [1, 2, 5, 9]

# Sorting complex data with a key
employees = [("Ravi", 45000), ("Anu", 62000), ("Kiran", 38000)]
by_salary = sorted(employees, key=lambda e: e[1], reverse=True)
print(by_salary)            # highest paid first
```

## The Copy Trap

```python
a = [1, 2, 3]
b = a              # NOT a copy -- b points to the SAME list
b.append(4)
print(a)           # [1, 2, 3, 4]   <-- a changed too!

a = [1, 2, 3]
b = a.copy()       # real copy  (or list(a) or a[:])
b.append(4)
print(a, b)        # [1, 2, 3] [1, 2, 3, 4]
```

#### Real-Time Example — Shopping Cart

**Program: cart.py**

```python
cart = []

def add_item(name, price, qty):
    cart.append({"name": name, "price": price, "qty": qty})

def remove_item(name):
    for item in cart:
        if item["name"] == name:
            cart.remove(item)
            return True
    return False

def cart_total():
    return sum(item["price"] * item["qty"] for item in cart)

add_item("Wireless Mouse", 799.00, 2)
add_item("Keyboard",      1499.50, 1)
add_item("USB Cable",      149.00, 3)
remove_item("USB Cable")

print("Items in cart:", len(cart))
for i in cart:
    print(f"  {i['name']:<18} x{i['qty']}  = Rs.{i['price'] * i['qty']:.2f}")
print(f"Cart total: Rs.{cart_total():,.2f}")
```

**Output:**

```text
Items in cart: 2
  Wireless Mouse     x2  = Rs.1598.00
  Keyboard           x1  = Rs.1499.50
Cart total: Rs.3,097.50
```

## More Practice — Everyday List Programs

### 1. Find the second largest number

```python
numbers = [23, 78, 12, 95, 44, 95]

unique = list(set(numbers))          # remove duplicates
unique.sort(reverse=True)

print("Largest       :", unique[0])
print("Second largest:", unique[1])
```

**Output:**

```text
Largest       : 95
Second largest: 78
```

### 2. Separate even and odd numbers

```python
nums = [11, 22, 33, 44, 55, 66]

evens = [n for n in nums if n % 2 == 0]
odds  = [n for n in nums if n % 2 != 0]

print("Even:", evens)
print("Odd :", odds)
```

**Output:**

```text
Even: [22, 44, 66]
Odd : [11, 33, 55]
```

### 3. Merge two lists and sort

```python
a = [5, 2, 9]
b = [7, 1, 4]

merged = a + b
merged.sort()
print(merged)                # [1, 2, 4, 5, 7, 9]
```

### 4. Marks report — highest, lowest, average, pass count

```python
marks = [85, 92, 28, 95, 67, 34, 78]

print("Highest :", max(marks))
print("Lowest  :", min(marks))
print("Average :", round(sum(marks) / len(marks), 2))
print("Passed  :", len([m for m in marks if m >= 35]))
print("Failed  :", len([m for m in marks if m < 35]))
print("Top 3   :", sorted(marks, reverse=True)[:3])
```

**Output:**

```text
Highest : 95
Lowest  : 28
Average : 68.43
Passed  : 5
Failed  : 2
Top 3   : [95, 92, 85]
```

### 5. Split a list into chunks (pagination)

```python
items = ["A", "B", "C", "D", "E", "F", "G"]
size = 3
```

```python
pages = [items[i:i + size] for i in range(0, len(items), size)]

for n, page in enumerate(pages, 1):
    print(f"Page {n}: {page}")
```

**Output:**

```text
Page 1: ['A', 'B', 'C']
Page 2: ['D', 'E', 'F']
Page 3: ['G']
```

### 6. Rotate a list

```python
q = [1, 2, 3, 4, 5]

print(q[2:] + q[:2])         # rotate left by 2  -> [3, 4, 5, 1, 2]
print(q[-2:] + q[:-2])       # rotate right by 2 -> [4, 5, 1, 2, 3]
```

### 7. To-do list manager

```python
todo = []

todo.append("Buy groceries")
todo.append("Pay electricity bill")
todo.append("Call the plumber")
todo.insert(0, "Morning walk")          # highest priority first

done = todo.pop(0)                       # finished the first task
todo.remove("Call the plumber")          # cancelled

print("Completed:", done)
print("Pending  :")
for i, task in enumerate(todo, 1):
    print(f"  {i}. {task}")
```

**Output:**

```text
Completed: Morning walk
Pending  :
  1. Buy groceries
  2. Pay electricity bill
```

### 8. Nested list — a class marksheet

```python
sheet = [
    ["Ravi",  85, 92, 78],
    ["Anu",   75, 88, 95],
    ["Kiran", 60, 71, 68],
]

print(f"{'NAME':<8}{'S1':>5}{'S2':>5}{'S3':>5}{'TOTAL':>8}{'AVG':>8}")
for row in sheet:
    name, *marks = row                  # unpacking
    print(f"{name:<8}" + "".join(f"{m:>5}" for m in marks)
          + f"{sum(marks):>8}{sum(marks) / len(marks):>8.1f}")
```

**Output:**

```text
NAME       S1   S2   S3   TOTAL     AVG
Ravi       85   92   78     255    85.0
Anu        75   88   95     258    86.0
Kiran      60   71   68     199    66.3
```
