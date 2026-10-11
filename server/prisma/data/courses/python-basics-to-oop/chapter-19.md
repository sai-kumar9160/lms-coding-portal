> **In simple words:**  A function is a **named block of code that performs one job and can be called as many**  **times as you like**.

You define it once with `def`, give it inputs called parameters, and get a result back with `return`. Functions remove duplication, give a meaningful name to a chunk of logic, and let you fix a bug in one place instead of ten. Once you are comfortable with them, Python also lets you pass functions around as values — which is where higher-order functions, closures, decorators and generators come in.

## Why Functions?

A function is a **named, reusable block of code** that performs one job. Functions give you three things: **reusability** (write once, call many times), **readability** (a name explains 20 lines), and **maintainability** (fix a bug in one place instead of ten).

## Defining and Calling

```python
def greet(name):                 # def keyword, name, parameters, colon
    """Return a greeting message."""   # docstring
    return f"Hello, {name}!"           # send a value back

message = greet("Ravi")          # call the function
print(message)
```

**Output:**

```text
Hello, Ravi!
```

## Parameters vs Arguments

**Parameter** = the placeholder in the definition (`name`). **Argument** = the actual value you pass when calling (`"Ravi"`).

## Types of Arguments

```python
# 1. Positional -- matched by order
def power(base, exponent):
    return base ** exponent
power(2, 3)                 # 8

# 2. Keyword -- matched by name, order does not matter
power(exponent=3, base=2)   # 8

# 3. Default -- used when the caller omits it
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
greet("Ravi")               # Hello, Ravi!
greet("Ravi", "Welcome")    # Welcome, Ravi!

# 4. *args -- any number of positional arguments (arrives as a TUPLE)
def total(*numbers):
    return sum(numbers)
total(10, 20, 30)           # 60

# 5. **kwargs -- any number of keyword arguments (arrives as a DICT)
def create_user(**details):
    for k, v in details.items():
        print(f"{k}: {v}")
create_user(name="Ravi", age=25, city="Hyderabad")
```

## Return Values

```python
def divide(a, b):
    if b == 0:
        return None, "Cannot divide by zero"      # returns a TUPLE
    return a / b, None

result, error = divide(10, 0)
print(result, "|", error)
```

**Output:**

```text
None | Cannot divide by zero
```

> **Remember:**  A function with no `return` statement returns `None`. `print()` displays a value; `return` gives it back  to the caller. They are not the same thing.

## Scope — Local vs Global

```python
counter = 0          # GLOBAL

def increment():
    counter = 10     # creates a NEW LOCAL variable, global is untouched
    print("inside :", counter)

increment()
print("outside:", counter)       # still 0

def increment_properly():
    global counter               # explicitly use the global one
    counter += 1

increment_properly()
print("after global:", counter)  # 1
```

**Output:**

```text
inside : 10
outside: 0
after global: 1
```

## The Mutable Default Argument Trap

```python
# WRONG -- the list is created ONCE and shared by every call
def add_item(item, cart=[]):
    cart.append(item)
    return cart

print(add_item("mouse"))       # ['mouse']
print(add_item("keyboard"))    # ['mouse', 'keyboard']   <-- surprise!

# CORRECT
def add_item(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart
```

## Docstrings and Type Hints

```python
def calculate_gst(amount: float, rate: float = 18.0) -> float:
    """
    Calculate the total payable amount after GST.

    Args:
        amount: Base amount before tax.
        rate:   GST percentage. Defaults to 18.0.

    Returns:
        Total amount including GST, rounded to 2 decimals.
    """
    tax = amount * rate / 100
    return round(amount + tax, 2)

print(calculate_gst(1000))          # 1180.0
print(calculate_gst.__doc__)        # prints the docstring
```

#### Real-Time Example — Function Call Flow — GST Calculator

![Flow Chart 10 — how control transfers into a function and back](asset:chapter-19-figure-1.png)

*Flow Chart 10 — how control transfers into a function and back*

**Program: invoice_functions.py**

```python
def calculate_gst(amount, rate=18.0):
    tax = amount * rate / 100
    return round(amount + tax, 2), round(tax, 2)

def apply_discount(amount, percent):
    return round(amount - amount * percent / 100, 2)

def generate_invoice(items, discount_percent=0):
    subtotal = sum(price * qty for _, price, qty in items)
    after_discount = apply_discount(subtotal, discount_percent)
    total, tax = calculate_gst(after_discount)

    return {"subtotal": subtotal, "discount%": discount_percent,
            "taxable": after_discount, "gst": tax, "total": total}

items = [("Wireless Mouse", 799.00, 2), ("Keyboard", 1499.50, 1)]
inv = generate_invoice(items, discount_percent=10)

for k, v in inv.items():
    print(f"{k:<12}: {v}")
```

**Output:**

```text
subtotal    : 3097.5
discount%   : 10
taxable     : 2787.75
gst         : 501.8
total       : 3289.55
```

Notice how `generate_invoice()` calls two other functions. Each function does exactly one job, so if the GST rate changes tomorrow you edit **one line in one function** and the entire application is correct.

## Higher-Order Functions

A **higher-order function** is a function that does at least one of two things: **takes another function as an** **argument**, or **returns a function**. This is possible because in Python functions are **first-class objects** — you can store them in variables, put them in lists and dictionaries, and pass them around exactly like a number or a string.

### Functions Are Objects

```python
def greet(name):
    return f"Hello, {name}!"

say = greet                 # NO parentheses -- assigning the function itself
print(say("Ravi"))          # Hello, Ravi!

print(greet.__name__)       # greet
print(type(greet))          # <class 'function'>

# Store functions in a list
operations = [str.upper, str.lower, str.title]
for op in operations:
    print(op("hello world"))
```

**Output:**

```text
Hello, Ravi!
greet
<class 'function'>
HELLO WORLD
```

```python
         hello world
         Hello World
```

### Passing a Function as an Argument

```python
def apply_to_all(func, items):
    """Apply any function to every item -- this is a higher-order function."""
    return [func(item) for item in items]

def double(x):
    return x * 2

def square(x):
    return x ** 2

numbers = [1, 2, 3, 4]
print(apply_to_all(double, numbers))      # [2, 4, 6, 8]
print(apply_to_all(square, numbers))      # [1, 4, 9, 16]
print(apply_to_all(str, numbers))         # ['1', '2', '3', '4']
```

### Returning a Function

```python
def get_discount_function(customer_type):
    """Returns a DIFFERENT function depending on the customer type."""
    def gold(amount):
        return amount * 0.80          # 20% off
    def silver(amount):
        return amount * 0.90          # 10% off
    def regular(amount):
        return amount                 # no discount

    return {"gold": gold, "silver": silver}.get(customer_type, regular)

calculate = get_discount_function("gold")     # calculate is now the gold function
print(calculate(5000))                        # 4000.0

for kind in ["gold", "silver", "new"]:
    fn = get_discount_function(kind)
    print(f"{kind:<7} pays Rs.{fn(5000):,.2f}")
```

**Output:**

```text
4000.0
gold    pays Rs.4,000.00
silver  pays Rs.4,500.00
new     pays Rs.5,000.00
```

### The Dispatch Table — A Very Practical Pattern

**Program: calculator_dispatch.py**

```python
def add(a, b): return a + b
def sub(a, b): return a - b
def mul(a, b): return a * b
def div(a, b): return a / b if b else "Cannot divide by zero"

# A dictionary of functions replaces a long if/elif chain
OPERATIONS = {"+": add, "-": sub, "*": mul, "/": div}

def calculate(a, op, b):
    action = OPERATIONS.get(op)
    if action is None:
        return f"Unknown operator '{op}'"
    return action(a, b)
```

```python
for op in ["+", "-", "*", "/", "%"]:
    print(f"10 {op} 3 = {calculate(10, op, 3)}")
```

**Output:**

```text
10 + 3 = 13
10 - 3 = 7
10 * 3 = 30
10 / 3 = 3.3333333333333335
10 % 3 = Unknown operator '%'
```

### Built-in Higher-Order Functions

```python
nums = [5, 2, 9, 1, 7]

print(sorted(nums, key=abs))              # key= takes a FUNCTION
print(max(nums, key=lambda n: -n))        # smallest, via a custom key
print(list(map(str, nums)))               # map takes a function
print(list(filter(lambda n: n > 4, nums)))  # filter takes a function
```

## Closures

A **closure** is an inner function that **remembers the variables of the outer function even after the outer** **function has finished running**. Three conditions must be true: there is a nested function, the inner function uses a variable from the outer function, and the outer function returns the inner function.

### The Simplest Closure

```python
def outer(message):
    def inner():                 # nested function
        print(message)           # uses the OUTER variable -> this makes it a closure
    return inner                 # returns the function, does NOT call it

my_func = outer("Hello from the closure!")
my_func()          # outer() has already finished, but 'message' is still remembered
```

**Output:**

```text
Hello from the closure!
```

### A Function Factory

```python
def multiplier(factor):
    def multiply(number):
        return number * factor       # 'factor' is remembered
    return multiply

double = multiplier(2)
triple = multiplier(3)
gst    = multiplier(1.18)

print(double(10))      # 20
print(triple(10))      # 30
print(gst(1000))       # 1180.0

# Each closure keeps its OWN copy of factor
print(double.__closure__[0].cell_contents)     # 2
```

### Counter With Remembered State (using `nonlocal`)

```python
def make_counter(start=0):
    count = start

    def increment(step=1):
        nonlocal count          # modify the OUTER variable, not create a new one
        count += step
        return count

    return increment

page_views = make_counter()
print(page_views())       # 1
print(page_views())       # 2
print(page_views(10))     # 12

downloads = make_counter(100)     # a completely separate counter
print(downloads())        # 101
print(page_views())       # 13    -- unaffected by 'downloads'
```

#### Real-Time Example — A Reusable Validator Factory

**Program: validator_factory.py**

```python
def length_validator(field_name, minimum, maximum):
    """Builds a validator function for one specific field."""
    def validate(value):
        if len(value) < minimum:
            return f"{field_name} must be at least {minimum} characters"
        if len(value) > maximum:
            return f"{field_name} must be at most {maximum} characters"
        return None                          # None means valid
    return validate

# Build three specialised validators from one factory
check_username = length_validator("Username", 4, 15)
check_password = length_validator("Password", 8, 30)
check_pincode  = length_validator("Pincode", 6, 6)

form = {"Username": "ab", "Password": "python@123", "Pincode": "50008"}
checkers = {"Username": check_username,
            "Password": check_password,
            "Pincode": check_pincode}

for field, value in form.items():
    error = checkers[field](value)
    print(f"{field:<10}: {error if error else 'OK'}")
```

**Output:**

```text
Username  : Username must be at least 4 characters
Password  : OK
Pincode   : Pincode must be at least 6 characters
```

> **Why closures matter:**  Each validator carries its own rules with it. You wrote the logic once and produced three  ready-to-use, independently configured functions — without writing a class.

## Decorators

A **decorator** is a function that takes another function, adds some behaviour around it, and returns the new version — **without changing the original function's code**. It is built directly on closures and higher-order functions. The `@decorator` line above a `def` is just shorthand for `function = decorator(function)`.

### Building One Step by Step

```python
# Step 1: a plain function
def greet():
    print("Hello!")

# Step 2: a decorator -- takes a function, returns a new function
def add_stars(func):
    def wrapper():
        print("*" * 30)
        func()                       # the original function runs here
        print("*" * 30)
    return wrapper

# Step 3: apply it manually
greet = add_stars(greet)
greet()
```

**Output:**

```text
******************************
Hello!
******************************
```

### The @ Syntax — Same Thing, Cleaner

```python
def add_stars(func):
    def wrapper():
        print("*" * 30)
        func()
        print("*" * 30)
    return wrapper

@add_stars                # exactly the same as: greet = add_stars(greet)
def greet():
    print("Hello!")

greet()
```

### Decorating Functions That Take Arguments

```python
import functools

def logger(func):
    @functools.wraps(func)               # keeps the original name and docstring
    def wrapper(*args, **kwargs):        # accepts ANY arguments
        print(f"-> Calling {func.__name__}{args}")
        result = func(*args, **kwargs)
        print(f"<- {func.__name__} returned {result}")
        return result                    # do not forget to return!
    return wrapper

@logger
def add(a, b):
    """Add two numbers."""
    return a + b
```

```python
add(5, 3)
print(add.__name__)          # 'add'  -- thanks to functools.wraps
```

**Output:**

```text
-> Calling add(5, 3)
<- add returned 8
add
```

### A Timing Decorator

```python
import time, functools

def measure_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f} seconds")
        return result
    return wrapper

@measure_time
def sum_of_squares(n):
    return sum(i * i for i in range(n))

sum_of_squares(1_000_000)
```

**Output:**

```text
sum_of_squares took 0.0712 seconds
```

### A Decorator That Takes Its Own Arguments

```python
import functools

def repeat(times):                      # outer -- receives the decorator argument
    def decorator(func):                # middle -- receives the function
        @functools.wraps(func)
        def wrapper(*args, **kwargs):   # inner -- receives the call arguments
            for i in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def send_reminder(name):
    print(f"Reminder sent to {name}")

send_reminder("Ravi")
```

**Output:**

```text
Reminder sent to Ravi
Reminder sent to Ravi
Reminder sent to Ravi
```

### Stacking Decorators

```python
@logger
@measure_time
def process(n):
    return n * 2
```

```python
# Applied bottom-up:  process = logger(measure_time(process))
```

#### Real-Time Example — Login Check + Retry + Caching in a Real Application

**Program: decorators_in_action.py**

```python
import functools, time

CURRENT_USER = {"name": "Ravi", "role": "admin"}

# ---------- 1. Access control ----------
def requires_role(role):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if CURRENT_USER.get("role") != role:
                return f"ACCESS DENIED: '{role}' role required"
            return func(*args, **kwargs)
        return wrapper
    return decorator

# ---------- 2. Automatic retry ----------
def retry(attempts=3, delay=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"   attempt {attempt} failed: {e}")
                    if attempt == attempts:
                        return f"FAILED after {attempts} attempts"
                    time.sleep(delay)
        return wrapper
    return decorator

# ---------- 3. Caching (memoisation) ----------
def cache(func):
    stored = {}
    @functools.wraps(func)
    def wrapper(*args):
        if args in stored:
            print(f"   (cache hit for {args})")
            return stored[args]
        stored[args] = func(*args)
        return stored[args]
    return wrapper

@requires_role("admin")
def delete_user(user_id):
    return f"User {user_id} deleted"

_calls = {"n": 0}

@retry(attempts=3)
def unstable_api():
    _calls["n"] += 1
    if _calls["n"] < 3:
        raise ConnectionError("gateway timeout")
    return "API responded successfully"

@cache
```

```python
def slow_square(n):
    time.sleep(0.2)                # pretend this is expensive
    return n * n

print(delete_user(101))
print(unstable_api())
print(slow_square(12))
print(slow_square(12))             # instant -- served from the cache
```

**Output:**

```text
User 101 deleted
   attempt 1 failed: gateway timeout
   attempt 2 failed: gateway timeout
API responded successfully
144
   (cache hit for (12,))
144
```

The functions `delete_user`, `unstable_api` and `slow_square` contain **only their own business logic**. Security, retrying and caching are added from the outside by one line each. This is exactly how Flask (`@app.route`), Django (`@login_required`) and pytest (`@pytest.fixture`) work.

### Useful Built-in Decorators

| Decorator | Where | What it does |
| --- | --- | --- |
| `@property` | class | turn a method into a read-only attribute |
| `@staticmethod` | class | method that needs no `self |
| `@classmethod` | class | method that receives `cls |
| `@functools.wraps` | decorator | preserve the wrapped function's name/doc |
| `@functools.lru_cache` | function | ready-made caching, no code needed |
| `@abstractmethod` | abstract class | force subclasses to implement it |

```python
from functools import lru_cache

@lru_cache(maxsize=None)          # Python's built-in caching decorator
def fib(n):
    return n if n <= 1 else fib(n - 1) + fib(n - 2)

print(fib(50))                    # instant -- without the cache this takes minutes
print(fib.cache_info())
```

**Output:**

```text
12586269025
CacheInfo(hits=48, misses=51, maxsize=None, currsize=51)
```

## Generators

A **generator** is a function that produces values **one at a time, only when asked**, instead of building the whole result in memory. You write `yield` instead of `return`. When a generator hits `yield` it hands back a value and **pauses**, keeping all its local variables alive; the next request resumes exactly from that point.

### return vs yield

```python
# Normal function -- builds the ENTIRE list first
def get_squares(n):
    result = []
    for i in range(n):
        result.append(i * i)
```

```python
    return result                    # 1 million numbers sit in memory

# Generator -- produces one number at a time
def gen_squares(n):
    for i in range(n):
        yield i * i                  # pause here and hand over the value

print(get_squares(5))                # [0, 1, 4, 9, 16]
print(gen_squares(5))                # <generator object gen_squares at 0x...>
print(list(gen_squares(5)))          # [0, 1, 4, 9, 16]
```

### How Pausing Works

```python
def countdown(n):
    print("   starting...")
    while n > 0:
        yield n                      # pause and give back n
        n -= 1
    print("   finished!")

c = countdown(3)
print(next(c))       # starting...  then 3
print(next(c))       # 2
print(next(c))       # 1
# print(next(c))     # prints 'finished!' then raises StopIteration

# A for loop calls next() for you and stops cleanly
for value in countdown(3):
    print(value, end=" ")
```

**Output:**

```text
starting...
3
2
1
   starting...
3 2 1    finished!
```

### Why Generators — Memory

```python
import sys

as_list = [i for i in range(1_000_000)]          # list comprehension
as_gen  = (i for i in range(1_000_000))          # GENERATOR expression -- round brackets

print(sys.getsizeof(as_list), "bytes")           # about 8,000,000 bytes
print(sys.getsizeof(as_gen),  "bytes")           # about 200 bytes

print(sum(i * i for i in range(1_000_000)))      # no list is ever built
```

> **Rule of thumb:**  If you only need to loop over the values once, use a generator. If you need to index, slice, or  reuse the values, build a list.

### Infinite Sequences — Impossible With a List

```python
def infinite_ids(prefix="ORD"):
    n = 1000
    while True:                      # never ends -- perfectly safe in a generator
        n += 1
```

```python
        yield f"{prefix}{n}"

ids = infinite_ids()
print(next(ids))     # ORD1001
print(next(ids))     # ORD1002
print(next(ids))     # ORD1003

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
print([next(fib) for _ in range(10)])
```

**Output:**

```text
ORD1001
ORD1002
ORD1003
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Generator Methods

| Item | Meaning |
| --- | --- |
| `yield value` | hand back a value and pause |
| `next(gen)` | resume until the next `yield |
| `StopIteration` | raised when the generator has no more values |
| `(x for x in ...)` | generator expression — like a list comprehension with `() |
| `yield from other_gen` | delegate to another generator |
| `gen.close()` | stop the generator early |

#### Real-Time Example — Processing a 2 GB Log File Without Running Out of Memory

**Program: log_pipeline.py**

```python
def read_lines(path):
    """Yield one line at a time -- the whole file is NEVER loaded."""
    with open(path) as f:
        for line in f:
            yield line.rstrip("\n")

def parse(lines):
    """Turn each raw line into a dictionary."""
    for line in lines:
        parts = line.split(" | ")
        if len(parts) == 3:
            yield {"time": parts[0], "level": parts[1], "message": parts[2]}

def only_errors(records):
    """Keep just the ERROR rows."""
    for rec in records:
        if rec["level"] == "ERROR":
            yield rec

# A pipeline -- nothing runs until we start looping
lines   = read_lines("app.log")
records = parse(lines)
```

```python
errors  = only_errors(records)

for i, err in enumerate(errors, 1):
    print(f"{i}. [{err['time']}] {err['message']}")
    if i == 5:                     # we only wanted the first 5
        break
```

Three generators are chained together. Because each one yields a single record at a time, Python reads only as many lines as it needs to find five errors — even if the file is 2 GB. The same code written with `f.readlines()` would try to load the entire file and crash.

### A Practical Batch Generator

```python
def batched(items, size):
    """Yield the items in fixed-size chunks -- useful for bulk API uploads."""
    batch = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:                      # do not lose the last partial batch
        yield batch

customer_ids = list(range(1, 12))

for n, group in enumerate(batched(customer_ids, 4), 1):
    print(f"Uploading batch {n}: {group}")
```

**Output:**

```text
Uploading batch 1: [1, 2, 3, 4]
Uploading batch 2: [5, 6, 7, 8]
Uploading batch 3: [9, 10, 11]
```

## Quick Comparison of the Four Concepts

| Concept | One-line definition | Written as | Typical use |
| --- | --- | --- | --- |
| Higher-order fn | takes or returns a function | `f(g)' / 'return g` | sorted(key=...)`, dispatch tables |
| Closure | inner function remembers outer variables | nested `def` + `return inner `@decorator` | function factories, counters |
| Decorator | wraps a function to add behaviour |  | logging, auth, caching, timing |
| Generator | produces values lazily, one at a time | `yield` | large files, streams, pipelines |

## More Practice — Simple Function Programs

```python
# 1. Check even or odd
def is_even(n):
    return n % 2 == 0

# 2. Factorial
def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
```

```python
# 3. Greet with a default value
def greet(name="Guest"):
    return f"Welcome, {name}!"

# 4. Any number of arguments
def average(*numbers):
    return sum(numbers) / len(numbers) if numbers else 0

# 5. Return several values
def stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

# 6. A function calling another function
def is_prime(n):
    if n < 2:
        return False
    return all(n % i for i in range(2, int(n ** 0.5) + 1))

def primes_upto(limit):
    return [n for n in range(limit + 1) if is_prime(n)]

print(is_even(10), factorial(5), greet(), greet("Ravi"))
print(average(10, 20, 30), stats([85, 92, 78]))
print(primes_upto(30))
```

**Output:**

```text
True 120 Welcome, Guest! Welcome, Ravi!
20.0 (78, 92, 85.0)
[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```
