> **In simple words:**  An operator is a **symbol that performs an action on values**, such as `+` to add or `>` to  compare.

Python groups them into arithmetic, comparison, logical, assignment, membership, identity and bitwise operators. Comparison and logical operators are especially important because they produce the `True`/`False` answers that conditional statements and loops depend on. When several operators appear in one expression, precedence decides who goes first — and brackets always win.

## Arithmetic Operators

| Operator | Name | Example (a=17, b=5) | Result |
| --- | --- | --- | --- |
| `+` | Addition | `a + b` | 22 |
| `-` | Subtraction | `a - b` | 12 |
| `*` | Multiplication | `a * b` | 85 |
| `/` | Division (float) | `a / b` | 3.4 |
| `//` | Floor division | `a // b` | 3 |
| `%` | Modulus (remainder) | `a % b` | 2 |
| `**` | Exponent | `a ** 2` | 289 |

## Comparison Operators

These always return `True` or `False`: `==`, `!=`, `>`, `<`, `>=`, `<=`. Python also allows **chaining**: `if 0 < marks <=` `100:` is valid and reads naturally.

## Logical Operators

| Operator | Meaning | Example | Result |
| --- | --- | --- | --- |
| `and` | True only if BOTH are true | `True and False` | False |
| `or` | True if AT LEAST ONE is true | `True or False` | True |
| `not` | Reverses the result | `not True` | False |

> **Short-circuit evaluation:**  In `a and b`, if `a` is False, Python never evaluates `b`. This is why `if user is not None`  `and user.is_active:` is safe — the second check only runs when `user` exists.

## Assignment Operators

```python
x = 10
x += 5      # x = x + 5   -> 15
x -= 3      # 12
x *= 2      # 24
x /= 4      # 6.0
x //= 2     # 3.0
x **= 2     # 9.0
x %= 4      # 1.0
```

## Membership and Identity Operators

```python
# Membership: in / not in
fruits = ["apple", "mango", "banana"]
print("mango" in fruits)          # True
print("grape" not in fruits)      # True
print("gram" in "programming")    # True  -- works on strings too

# Identity: is / is not  -> compares MEMORY, not value
a = [1, 2, 3]
b = [1, 2, 3]
c = a
print(a == b)     # True   -- same contents
print(a is b)     # False  -- different objects in memory
print(a is c)     # True   -- same object
```

> **Rule of thumb:**  Use `==` to compare values. Use `is` only with `None`, `True`, `False` — always write `if x is None:`,  never `if x == None:`.

## Bitwise Operators (brief)

`&` AND, `|` OR, `^` XOR, `~` NOT, `<<` left shift, `>>` right shift. Used in permission flags, low-level protocols and performance-critical code.

## Operator Precedence (highest to lowest)

```python
()                      parentheses
**                      exponent
+x  -x  ~x              unary
*  /  //  %             multiplication group
+  -                    addition group
<<  >>                  shifts
&  ^  |                 bitwise
==  !=  >  <  >=  <=  in  not in  is  is not     comparisons
not
and
or
=  +=  -=  ...          assignment
```

#### Real-Time Example — Loan EMI Calculator

**Program: emi.py**

```python
principal = 500000        # loan amount
annual_rate = 9.5         # % per year
years = 5

r = annual_rate / 12 / 100        # monthly interest rate
n = years * 12                    # total months

emi = principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
total_payable = emi * n
total_interest = total_payable - principal

print(f"Monthly EMI      : Rs.{emi:,.2f}")
print(f"Total payable    : Rs.{total_payable:,.2f}")
print(f"Total interest   : Rs.{total_interest:,.2f}")
```

**Output:**

```text
Monthly EMI      : Rs.10,499.51
Total payable    : Rs.629,970.44
Total interest   : Rs.129,970.44
```

This single formula uses `/`, `*`, `**`, `+`, `-` and parentheses — real code is almost never one operator at a time, so precedence matters.

## More Practice — Small Programs Using Only Operators

### 1. Swap two numbers

```python
a, b = 10, 20
print("Before swap:", a, b)

a, b = b, a                 # Python way -- no temporary variable
print("After swap :", a, b)
```

**Output:**

```text
Before swap: 10 20
After swap : 20 10
```

### 2. Check even or odd

```python
num = 17
print(num, "is", "Even" if num % 2 == 0 else "Odd")
```

**Output:**

```text
17 is Odd
```

### 3. Find the last digit and remove it

```python
num = 4529
print("Last digit  :", num % 10)      # 9
print("Without last:", num // 10)     # 452
```

### 4. Celsius to Fahrenheit

```python
celsius = 37.0
fahrenheit = (celsius * 9 / 5) + 32
print(f"{celsius}C = {fahrenheit}F")
```

**Output:**

```text
37.0C = 98.6F
```

### 5. Simple interest

```python
principal = 50000
rate = 7.5
years = 3

interest = principal * rate * years / 100
amount = principal + interest

print(f"Interest : Rs.{interest:,.2f}")
print(f"Amount   : Rs.{amount:,.2f}")
```

**Output:**

```text
Interest : Rs.11,250.00
Amount   : Rs.61,250.00
```

### 6. Convert seconds into hours, minutes, seconds

```python
total_seconds = 7385
```

```python
hours   = total_seconds // 3600
minutes = (total_seconds % 3600) // 60
seconds = total_seconds % 60

print(f"{total_seconds} sec = {hours}h {minutes}m {seconds}s")
```

**Output:**

```text
7385 sec = 2h 3m 5s
```

### 7. Split a bill among friends

```python
bill = 2847.50
friends = 4

per_head = bill / friends
rounded_up = -(-bill // friends)        # ceiling division trick

print(f"Exact share  : Rs.{per_head:.2f}")
print(f"Rounded share: Rs.{rounded_up:.2f}")
```

**Output:**

```text
Exact share  : Rs.711.88
Rounded share: Rs.712.00
```
