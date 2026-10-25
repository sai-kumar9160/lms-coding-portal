> **In simple words:**  Recursion is a **function that calls itself** to solve a smaller version of the same problem.

Every recursive function needs a base case that stops the chain and a recursive case that moves towards it; without a base case Python eventually raises `RecursionError`. Recursion shines on data whose depth you do not know in advance — folder trees, org charts, nested JSON, comment threads — where a plain loop would need one level of nesting per level of data.

## The Idea

Recursion is a function that **calls itself** with a smaller version of the problem. Every recursive function needs two parts: a **base case** that stops the recursion, and a **recursive case** that moves toward the base case. Without a base case you get `RecursionError: maximum recursion depth exceeded`.

```python
def factorial(n):
    if n <= 1:              # BASE CASE -- stops the chain
        return 1
    return n * factorial(n - 1)     # RECURSIVE CASE

print(factorial(5))         # 120
```

Trace of `factorial(5)`: `5 * factorial(4)` → `5 * 4 * factorial(3)` → `5*4*3*factorial(2)` → `5*4*3*2*factorial(1)` → `5*4*3*2*1` = **120**.

## More Examples

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def sum_digits(n):
    if n == 0:
        return 0
    return n % 10 + sum_digits(n // 10)

def reverse_string(s):
    if len(s) <= 1:
        return s
    return reverse_string(s[1:]) + s[0]

print([fibonacci(i) for i in range(8)])   # [0,1,1,2,3,5,8,13]
print(sum_digits(12345))                  # 15
print(reverse_string("python"))           # nohtyp
```

## Recursion vs Loop

| Aspect | Recursion | Loop |
| --- | --- | --- |
| Memory | Uses call stack — more memory | Constant memory |
| Speed | Slower (function call overhead) | Faster |
| Readability | Elegant for tree/nested data | Clearer for simple repetition |
| Risk | Stack overflow if too deep | Infinite loop if condition never fails |

#### Real-Time Example — Walking a Nested Folder Structure / Org Chart

**Program: org_chart.py**

```python
company = {
    "name": "CEO - Meera",
    "reports": [
        {"name": "VP Engineering - Ravi",
         "reports": [
             {"name": "Team Lead - Kiran",
              "reports": [{"name": "Dev - Sunil", "reports": []},
                          {"name": "Dev - Priya", "reports": []}]},
             {"name": "Team Lead - Anu", "reports": []},
         ]},
        {"name": "VP Sales - Arjun",
         "reports": [{"name": "Manager - Deepa", "reports": []}]},
    ]
}

def print_org(node, level=0):
    print("   " * level + ("|- " if level else "") + node["name"])
    for report in node["reports"]:          # recursive case
        print_org(report, level + 1)

def count_employees(node):
    return 1 + sum(count_employees(r) for r in node["reports"])

print_org(company)
print("\nTotal headcount:", count_employees(company))
```

**Output:**

```text
CEO - Meera
   |- VP Engineering - Ravi
      |- Team Lead - Kiran
         |- Dev - Sunil
         |- Dev - Priya
      |- Team Lead - Anu
   |- VP Sales - Arjun
      |- Manager - Deepa
Total headcount: 8
```

This is the natural home of recursion: the structure has **unknown depth**. A `for` loop would need one nested loop per level, and you do not know how many levels exist. The same pattern walks folders on disk, comment threads, category trees and JSON responses.
