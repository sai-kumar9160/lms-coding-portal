> **In simple words:**  A dictionary stores data as **key : value pairs**, letting you look a value up by its name instead  of its position.

Keys must be unique and immutable; values can be anything, including lists and other dictionaries. Lookup by key is effectively instant no matter how large the dictionary grows. Every JSON response, API result and database row you will ever handle in Python arrives as a dictionary, which makes this the most practically important collection of them all.

## What Is a Dictionary?

A dictionary stores data as **key : value** pairs. Keys must be unique and immutable (string, number, tuple); values can be anything. Lookup by key is near-instant regardless of size, which is why dictionaries are everywhere — JSON, API responses and database rows all arrive as dictionaries.

```python
employee = {
    "id": 101,
    "name": "Ravi Kumar",
    "salary": 45000,
    "skills": ["Python", "SQL"],
    "active": True
}
print(employee["name"])        # Ravi Kumar
```

## Safe Access

```python
print(employee["email"])              # KeyError -- crashes the program
print(employee.get("email"))          # None -- safe
print(employee.get("email", "N/A"))   # 'N/A' -- safe with a default
```

## Adding, Updating, Deleting

```python
employee["email"] = "ravi@company.com"        # add a new key
employee["salary"] = 50000                    # update existing
employee.update({"city": "Hyderabad", "salary": 52000})   # bulk update

del employee["active"]                        # delete a key
removed = employee.pop("city")                # delete and get the value
employee.clear()                              # empty it
```

## Looping Through a Dictionary

```python
emp = {"id": 101, "name": "Ravi", "salary": 45000}

for key in emp:                       # keys by default
    print(key)

for value in emp.values():
    print(value)

for key, value in emp.items():        # BOTH -- most common
    print(f"{key:<10}: {value}")
```

## Nested Dictionaries — Real API Data

```python
orders = {
    "ORD1001": {"customer": "Ravi",  "amount": 3499, "status": "Delivered"},
    "ORD1002": {"customer": "Anu",   "amount": 1299, "status": "Shipped"},
    "ORD1003": {"customer": "Kiran", "amount": 8999, "status": "Pending"},
}

print(orders["ORD1002"]["customer"])          # Anu

for oid, data in orders.items():
    print(f"{oid} | {data['customer']:<8} | Rs.{data['amount']:>6} | {data['status']}")
```

**Output:**

```text
ORD1001 | Ravi     | Rs.  3499 | Delivered
ORD1002 | Anu      | Rs.  1299 | Shipped
ORD1003 | Kiran    | Rs.  8999 | Pending
```

#### Real-Time Example — Counting Word Frequency in Customer Feedback

**Program: word_frequency.py**

```python
feedback = """delivery was fast and packaging was good
delivery was late but product was good
packaging was damaged delivery was fast"""

counts = {}
for word in feedback.split():
    counts[word] = counts.get(word, 0) + 1

top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:5]
for word, n in top:
    print(f"{word:<12} {'*' * n}  ({n})")
```

**Output:**

```text
was          *****  (5)
delivery     ***  (3)
fast         **  (2)
good         **  (2)
packaging    **  (2)
```

`counts.get(word, 0) + 1` is the single most useful dictionary idiom: "give me the current count, or 0 if this word is new, then add one." The same three lines power tag clouds, log analysers and sentiment dashboards.

## More Practice — Simple Dictionary Programs

### 1. A phone book

```python
phonebook = {"Ravi": "9876543210", "Anu": "9123456780"}

phonebook["Kiran"] = "9988776655"          # add
phonebook["Ravi"] = "9000000000"           # update
del phonebook["Anu"]                       # delete

for name, number in phonebook.items():
    print(f"{name:<8} {number}")

print("Is Meera saved?", "Meera" in phonebook)
print("Meera's number :", phonebook.get("Meera", "Not saved"))
```

**Output:**

```text
Ravi     9000000000
Kiran    9988776655
```

```python
         Is Meera saved? False
         Meera's number : Not saved
```

### 2. Student marks with total and average

```python
student = {"name": "Ravi", "Python": 85, "SQL": 92, "OS": 78}

subjects = {k: v for k, v in student.items() if k != "name"}
total = sum(subjects.values())

print(f"Name    : {student['name']}")
print(f"Total   : {total}")
print(f"Average : {total / len(subjects):.2f}")
print(f"Best in : {max(subjects, key=subjects.get)}")
```

**Output:**

```text
Name    : Ravi
Total   : 255
Average : 85.00
Best in : SQL
```

### 3. Count how many times each letter appears

```python
word = "banana"
freq = {}

for ch in word:
    freq[ch] = freq.get(ch, 0) + 1

print(freq)                              # {'b': 1, 'a': 3, 'n': 2}

# One-line version with a ready-made tool
from collections import Counter
print(Counter(word))
```

### 4. Merge two dictionaries

```python
defaults = {"theme": "light", "font": 12, "autosave": True}
user     = {"theme": "dark", "font": 14}

settings = {**defaults, **user}          # user values win
print(settings)

# Python 3.9+ shortcut
settings = defaults | user
```

**Output:**

```text
{'theme': 'dark', 'font': 14, 'autosave': True}
```

### 5. Sort a dictionary by value

```python
sales = {"Mouse": 25568, "Monitor": 116991, "Keyboard": 19493}

by_value = dict(sorted(sales.items(), key=lambda kv: kv[1], reverse=True))

for product, amount in by_value.items():
    print(f"{product:<10} Rs.{amount:>10,}")
```

**Output:**

```text
Monitor    Rs.   116,991
Mouse      Rs.    25,568
Keyboard   Rs.    19,493
```

### 6. Simple inventory system

```python
stock = {"Mouse": 12, "Keyboard": 5, "Monitor": 0}

def sell(item, qty):
    if item not in stock:
        return f"{item} is not in our catalogue"
    if stock[item] < qty:
        return f"Only {stock[item]} {item}(s) left"
    stock[item] -= qty
    return f"Sold {qty} {item}(s). Remaining: {stock[item]}"

print(sell("Mouse", 3))
print(sell("Monitor", 1))
print(sell("Speaker", 1))

out_of_stock = [item for item, qty in stock.items() if qty == 0]
print("Reorder needed for:", out_of_stock)
```

**Output:**

```text
Sold 3 Mouse(s). Remaining: 9
Only 0 Monitor(s) left
Speaker is not in our catalogue
Reorder needed for: ['Monitor']
```
