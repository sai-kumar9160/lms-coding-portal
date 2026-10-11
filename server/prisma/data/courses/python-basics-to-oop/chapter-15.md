> **In simple words:**  A set is an **unordered collection of unique items** — duplicates are removed automatically.

Because a set has no order there is no indexing, but in exchange you get near-instant membership checks and the mathematical operations union, intersection and difference. Whenever a problem sounds like "remove duplicates", "what do these two groups have in common" or "who is in list A but not list B", a set is the right tool.

## What Is a Set?

A set is an **unordered collection of unique items**. Duplicates are automatically removed and there is no indexing. Sets are built for two jobs: **removing duplicates** and **comparing two groups**.

```python
s = {10, 20, 30, 20, 10}
print(s)                 # {10, 20, 30}  -- duplicates gone

empty_set = set()        # NOT {} -- that creates an empty dictionary
from_list = set([1, 2, 2, 3])     # {1, 2, 3}
```

## Set Methods

```python
s = {1, 2, 3}
s.add(4)               # {1,2,3,4}
s.update([5, 6])       # {1,2,3,4,5,6}
s.remove(6)            # KeyError if 6 is absent
s.discard(99)          # safe -- no error if absent
s.pop()                # removes an arbitrary element
s.clear()              # empty set
```

## Set Operations — The Real Power

| Operation | Operator | Method | Meaning |
| --- | --- | --- | --- |
| Union | `a \| b` `a & b` | `a.union(b)` `a.intersection(b)` | everything in either set |
| Intersection |  |  | only what is in both |
| Difference | `a - b` `a ^ b` | `a.difference(b)` `a.symmetric_difference(b)` | in a but not in b |
| Symmetric diff |  |  | in exactly one of them |
| Subset | `a <= b` | `a.issubset(b)` | is every item of a in b? |

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)     # {1, 2, 3, 4, 5, 6}
print(a & b)     # {3, 4}
print(a - b)     # {1, 2}
print(a ^ b)     # {1, 2, 5, 6}
```

#### Real-Time Example — Comparing Yesterday's and Today's Active Users

**Program: user_churn.py**

```python
yesterday = {"ravi", "anu", "kiran", "meera", "sunil"}
```

```python
today     = {"anu", "kiran", "meera", "deepa", "arjun"}

retained  = yesterday & today        # came back
churned   = yesterday - today        # did not return
new_users = today - yesterday        # first time today
all_users = yesterday | today

print("Retained :", sorted(retained))
print("Churned  :", sorted(churned))
print("New      :", sorted(new_users))
print(f"Retention rate: {len(retained) / len(yesterday):.1%}")
```

**Output:**

```text
Retained : ['anu', 'kiran', 'meera']
Churned  : ['ravi', 'sunil']
New      : ['arjun', 'deepa']
Retention rate: 60.0%
```

Writing this with nested loops over lists would take 15 lines and run far slower. Sets turn the whole analysis into four readable lines — this is the daily-active-user report every product team looks at.

## Bonus: Removing Duplicates While Keeping Order

```python
emails = ["a@x.com", "b@x.com", "a@x.com", "c@x.com", "b@x.com"]

unique_unordered = list(set(emails))          # fast, but order is lost
unique_ordered   = list(dict.fromkeys(emails))  # order preserved
print(unique_ordered)
```

**Output:**

```text
['a@x.com', 'b@x.com', 'c@x.com']
```

## More Practice — Simple Set Programs

### 1. Remove duplicates from a list

```python
numbers = [1, 2, 2, 3, 4, 4, 4, 5]
print(list(set(numbers)))            # [1, 2, 3, 4, 5]

names = ["Ravi", "Anu", "Ravi", "Kiran"]
print(len(set(names)), "unique names")
```

### 2. Common friends between two people

```python
ravi_friends  = {"Anu", "Kiran", "Meera", "Sunil"}
anu_friends   = {"Ravi", "Kiran", "Meera", "Arjun"}

print("Mutual friends  :", ravi_friends & anu_friends)
print("Only Ravi knows :", ravi_friends - anu_friends)
print("Everyone        :", ravi_friends | anu_friends)
```

**Output:**

```text
Mutual friends  : {'Kiran', 'Meera'}
Only Ravi knows : {'Anu', 'Sunil'}
Everyone        : {'Ravi', 'Anu', 'Kiran', 'Meera', 'Sunil', 'Arjun'}
```

### 3. Skills gap for a job

```python
required = {"Python", "SQL", "Git", "Docker"}
candidate = {"Python", "SQL", "Java"}

print("Has        :", required & candidate)
print("Missing    :", required - candidate)
```

```python
print("Extra      :", candidate - required)
print(f"Match      : {len(required & candidate) / len(required):.0%}")
```

**Output:**

```text
Has        : {'Python', 'SQL'}
Missing    : {'Git', 'Docker'}
Extra      : {'Java'}
Match      : 50%
```

### 4. Unique characters in a word

```python
word = "programming"
print(sorted(set(word)))              # unique letters, sorted
print("Repeated letters:", {c for c in word if word.count(c) > 1})
```

**Output:**

```text
['a', 'g', 'i', 'm', 'n', 'o', 'p', 'r']
Repeated letters: {'r', 'g', 'm'}
```

### 5. Students who took both subjects

```python
python_class = {"Ravi", "Anu", "Kiran", "Meera"}
sql_class    = {"Anu", "Meera", "Arjun"}

print("Both subjects :", python_class & sql_class)
print("Only one      :", python_class ^ sql_class)
print("Total students:", len(python_class | sql_class))
```

**Output:**

```text
Both subjects : {'Anu', 'Meera'}
Only one      : {'Ravi', 'Kiran', 'Arjun'}
Total students: 5
```
