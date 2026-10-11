> **In simple words:**  This chapter answers one question: **given some data, which container should you store it**  **in?**

The decision comes down to four properties — does the order matter, will the data change, must the items be unique, and will you look things up by position or by name. Choosing correctly at the start makes the rest of the program shorter, faster and far easier to read.

| Feature | list | tuple | set | dict |
| --- | --- | --- | --- | --- |
| Syntax | `[ ]` | `( )` | `{ }` | `{k: v}` |
| Ordered | Yes | Yes | No | Yes (3.7+) |
| Mutable | Yes | No | Yes | Yes |
| Duplicates allowed | Yes | Yes | No | Keys: No |
| Indexing / slicing | Yes | Yes | No | By key |
| Can be a dict key | No | Yes | No | No |
| Lookup speed | Slow O(n) | Slow O(n) | Fast O(1) | Fast O(1) |

## A Simple Decision Rule

- Need an **ordered collection you will change**? → **list** (cart items, marks, log lines).
- Need data that must **never change**? → **tuple** (coordinates, RGB colour, DB config).
- Need **uniqueness** or **set maths**? → **set** (unique visitors, common skills).
- Need to look something up **by a name/ID**? → **dict** (user profile, API response, config).

#### Real-Time Example — One Feature, Four Structures

```python
# Student report card system

STUDENT_ID = (2024, "CSE", 42)          # tuple  -> fixed identity, never changes

marks = [85, 92, 78, 95, 88]            # list   -> ordered, editable

subjects_passed = {"Python", "DBMS", "OS"}      # set -> unique subject names
subjects_backlog = {"DBMS", "Networks"}
print("Cleared this sem :", subjects_passed - subjects_backlog)

report = {                               # dict  -> lookup by name
    "name": "Ravi Kumar",
    "marks": marks,
    "total": sum(marks),
    "percentage": round(sum(marks) / len(marks), 2),
}
print(f"{report['name']} scored {report['percentage']}%")
```

**Output:**

```text
Cleared this sem : {'OS', 'Python'}
Ravi Kumar scored 87.6%
```
