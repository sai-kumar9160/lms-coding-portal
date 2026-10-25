> **In simple words:**  A variable is a **name that holds a value**, and its data type tells Python what kind of value it  is holding.

You create a variable simply by assigning to it — `age = 25` — and Python works out the type on its own. The type matters because it decides what you are allowed to do with the value: you can subtract two numbers, but not two names. Knowing the built-in types is the foundation for everything that follows.

## What Is a Variable?

A variable is a **name that points to a value stored in memory**. Python does not need a type declaration — the type is decided by the value you assign. Technically the variable is a label attached to an object, which is why the same name can later point to a completely different type.

```python
name = "Ravi"          # str
age = 25               # int
salary = 45000.50      # float
is_active = True       # bool

print(type(name), type(age), type(salary), type(is_active))
```

**Output:**

```text
<class 'str'> <class 'int'> <class 'float'> <class 'bool'>
```

## Multiple Assignment

```python
x, y, z = 10, 20, 30        # different values in one line
a = b = c = 0               # same value to three names
x, y = y, x                 # swap without a temp variable  -> Python speciality
```

## Built-in Data Types

| Category | Type | Example | Mutable? |
| --- | --- | --- | --- |
| Numeric | `int` `float` | `age = 25` `price = 99.50` | No |
| Numeric | `complex` | `z = 3 + 4j` | No |
| Numeric | `str` | `city = "Hyderabad"` | No |
| Text | `bool` | `paid = True` | No |
| Boolean | `list` | `[10, 20, 30]` | No |
| Sequence | `tuple` | `(10, 20, 30)` | Yes |
| Sequence | `set` | `{10, 20, 30}` | No |
| Set |  |  | Yes |
| Mapping | `dict` `NoneType` | `{"id": 1, "name": "Ravi"}` `result = None` | Yes |
| None |  |  | — |

## Mutable vs Immutable — The Concept Interviewers Love

**Immutable** objects cannot be changed after creation; any "change" actually creates a new object. **Mutable** objects can be modified in place, keeping the same memory address.

```python
# Immutable: string
s = "hello"
print(id(s))
s = s + " world"        # a NEW string object is created
print(id(s))            # different id

# Mutable: list
nums = [1, 2, 3]
print(id(nums))
nums.append(4)          # modified in place
print(id(nums))         # SAME id
```

> **Why it matters:**  If you pass a list into a function and the function does `lst.append(x)`, the caller's list changes  too. Pass a copy with `lst.copy()` when you do not want that.

## Numbers in Practice

```python
a, b = 17, 5
print(a + b)      # 22
print(a / b)      # 3.4      -> true division, always float
print(a // b)     # 3        -> floor division, drops the decimal
print(a % b)      # 2        -> remainder
print(a ** b)     # 1419857  -> power
print(round(3.14159, 2))   # 3.14
```

#### Real-Time Example — Product Record in an E-Commerce Cart

```python
product_id    = 1024                 # int
product_name  = "Wireless Mouse"     # str
price         = 799.00               # float
in_stock      = True                 # bool
tags          = ["electronics", "accessories"]   # list
dimensions    = (12.5, 6.0, 3.8)     # tuple  - fixed, never changes
rating        = None                 # NoneType - not rated yet

print(f"{product_name} costs Rs.{price}, available: {in_stock}")
```

**Output:**

```text
Wireless Mouse costs Rs.799.0, available: True
```

Notice the deliberate choices: `price` is a float because it has paise; `dimensions` is a tuple because the physical size of a product never changes; `tags` is a list because the marketing team adds tags later; `rating` is `None` because "no rating yet" is different from a rating of `0`.
