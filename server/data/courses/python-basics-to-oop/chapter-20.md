> **In simple words:**  These are tools for writing **short, throwaway functions and applying them to a whole**  **collection at once**.

A `lambda` is a nameless one-expression function. `map()` applies a function to every item, `filter()` keeps only the items that pass a test, and `reduce()` collapses a whole collection into a single value. In modern Python a comprehension is usually clearer than `map`/`filter`, but `lambda` remains essential as the `key=` argument to `sorted()`, `max()` and `min()`.

## Lambda — An Anonymous One-Line Function

```python
# Normal function
def square(x):
    return x ** 2

# Same thing as a lambda
square = lambda x: x ** 2

add = lambda a, b: a + b
is_adult = lambda age: age >= 18

print(square(5), add(3, 4), is_adult(20))
```

**Output:**

```text
25 7 True
```

A lambda can have any number of arguments but **only one expression**, and it returns that expression automatically. Its real purpose is to be passed \*into\* another function.

## map() — Transform Every Item

```python
prices = [100, 250, 400]

with_gst = list(map(lambda p: round(p * 1.18, 2), prices))
print(with_gst)                       # [118.0, 295.0, 472.0]

# Converting input
nums = list(map(int, ["1", "2", "3"]))    # [1, 2, 3]

# Same thing as a comprehension (often preferred)
with_gst = [round(p * 1.18, 2) for p in prices]
```

## filter() — Keep Only What Matches

```python
salaries = [45000, 62000, 38000, 71000, 29000]

high_earners = list(filter(lambda s: s > 50000, salaries))
print(high_earners)                   # [62000, 71000]

# Comprehension version
high_earners = [s for s in salaries if s > 50000]
```

## reduce() — Collapse a List Into One Value

```python
from functools import reduce

nums = [1, 2, 3, 4, 5]

product = reduce(lambda a, b: a * b, nums)      # 120
maximum = reduce(lambda a, b: a if a > b else b, nums)   # 5

print(product, maximum)
```

## sorted() With a key — The Most Practical Use of lambda

```python
employees = [
    {"name": "Ravi",  "salary": 45000, "dept": "IT"},
    {"name": "Anu",   "salary": 62000, "dept": "HR"},
    {"name": "Kiran", "salary": 38000, "dept": "IT"},
]

by_salary = sorted(employees, key=lambda e: e["salary"], reverse=True)
by_dept_then_name = sorted(employees, key=lambda e: (e["dept"], e["name"]))

for e in by_salary:
    print(f"{e['name']:<7} Rs.{e['salary']:,}")
```

**Output:**

```text
Anu     Rs.62,000
Ravi    Rs.45,000
Kiran   Rs.38,000
```

#### Real-Time Example — Sales Dashboard Pipeline

**Program: sales_dashboard.py**

```python
from functools import reduce

sales = [
    {"region": "South", "rep": "Ravi",  "amount": 145000, "closed": True},
    {"region": "North", "rep": "Anu",   "amount":  98000, "closed": True},
    {"region": "South", "rep": "Kiran", "amount":  67000, "closed": False},
    {"region": "West",  "rep": "Meera", "amount": 210000, "closed": True},
    {"region": "North", "rep": "Arjun", "amount":  54000, "closed": True},
]

closed      = list(filter(lambda s: s["closed"], sales))
amounts     = list(map(lambda s: s["amount"], closed))
revenue     = reduce(lambda a, b: a + b, amounts)
top_deal    = max(closed, key=lambda s: s["amount"])
leaderboard = sorted(closed, key=lambda s: s["amount"], reverse=True)

print(f"Closed deals   : {len(closed)} of {len(sales)}")
print(f"Total revenue  : Rs.{revenue:,}")
print(f"Biggest deal   : {top_deal['rep']} ({top_deal['region']}) Rs.{top_deal['amount']:,}")
print("Leaderboard    :", " > ".join(s["rep"] for s in leaderboard))
```

**Output:**

```text
Closed deals   : 4 of 5
Total revenue  : Rs.507,000
Biggest deal   : Meera (West) Rs.210,000
Leaderboard    : Meera > Ravi > Anu > Arjun
```
