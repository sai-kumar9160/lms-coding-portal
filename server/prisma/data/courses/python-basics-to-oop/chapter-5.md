> **In simple words:**  Type conversion means **changing a value from one data type into another**, such as turning  the text `"25"` into the number `25`.

Python converts small types into bigger ones automatically (an `int` becomes a `float` in a division), but anything else you must ask for explicitly with `int()`, `float()`, `str()`, `list()` and friends. This chapter matters because `input()` always hands you text, so almost every program you write will need a cast on its very first lines.

## Implicit Conversion

Python automatically widens a smaller type into a bigger one to avoid losing data.

```python
a = 10        # int
b = 3.5       # float
c = a + b     # int is promoted to float automatically
print(c, type(c))
```

**Output:**

```text
13.5 <class 'float'>
```

## Explicit Conversion

```python
int("100")        # 100      string -> int
int(9.99)         # 9        float -> int  (truncates, does NOT round)
float("45.5")     # 45.5
str(250)          # "250"
bool(0)           # False    0, "", [], {}, None are all falsy
list("abc")       # ['a','b','c']
tuple([1, 2])     # (1, 2)
set([1, 1, 2])    # {1, 2}
```

> **Careful:**  `int("45.5")` raises `ValueError` because the string contains a dot. Convert in two steps:  `int(float("45.5"))` gives 45.

#### Real-Time Example — Every input() Needs Casting

`input()` **always returns a string**, even when the user types digits. Forgetting to cast is the most common beginner bug.

```python
qty = input("Enter quantity: ")     # user types 5  -> qty is the STRING "5"
print(qty * 3)                      # "555"  -- string repeated, not multiplied!

qty = int(input("Enter quantity: "))
print(qty * 3)                      # 15    -- correct
```

## Safe Casting in Production Code

```python
raw = input("Enter your age: ")
try:
    age = int(raw)
    print("Next year you will be", age + 1)
except ValueError:
    print("Please enter digits only.")
```
