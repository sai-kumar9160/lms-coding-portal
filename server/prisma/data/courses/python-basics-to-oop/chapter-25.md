> **In simple words:**  Exception handling is how a program **deals with runtime errors gracefully instead of**  **crashing**.

You put the risky code inside `try`, and Python jumps to a matching `except` block if something goes wrong. `else` runs when nothing went wrong, and `finally` runs no matter what — which is where you release files, database connections and locks. Handling exceptions is the difference between a script and a piece of software people can rely on.

## Types of Errors in Python

> **In simple words:**  An **error** is anything that stops your program from producing the correct result. Python  errors fall into three families: **syntax errors**, **runtime errors (exceptions)** and **logical errors**.

The three differ in one important way — **when** they are discovered. A syntax error is found before a single line runs. A runtime error is found in the middle of running. A logical error is never found by Python at all; the program runs happily to the end and simply gives you the wrong answer. That last kind is the most dangerous, because nothing warns you.

![Flow Chart 24 — the three error types and the moment each one is caught](asset:chapter-25-figure-1.png)

*Flow Chart 24 — the three error types and the moment each one is caught*

|  | Syntax Error | Runtime Error (Exception) | Logical Error |
| --- | --- | --- | --- |
| When found | before execution | while running | never by Python |
| Who finds it | the parser | the interpreter (PVM) | you, your users or your tests |
| Program runs? | not at all | starts, then stops | runs fully |
| Error message | yes | yes (traceback) | none |
| Can `try/except` help? | No | \*\*Yes\*\* | No |
| Example | missing `: | `10 / 0` | using `+` where you meant `\* |

### 1. Syntax Errors — the Code Is Not Valid Python

> **In simple words:**  A **syntax error** means Python cannot even understand what you wrote, so nothing runs.

These are grammar mistakes: a missing colon, an unclosed bracket, a misspelled keyword, wrong indentation. Python reports the **file name and line number**, and often points at the exact character with a caret `^`. They are the easiest errors to fix because the message tells you precisely where to look, and they can never reach a user — the program refuses to start.

```python
# 1. Missing colon
if 10 > 5
    print("Hello")
# SyntaxError: expected ':'

# 2. Unclosed bracket
print("Hello"
# SyntaxError: '(' was never closed

# 3. Using = instead of ==
if x = 5:
    print("five")
# SyntaxError: invalid syntax

# 4. Misspelled keyword
whille count < 10:
    count += 1
# SyntaxError: invalid syntax

# 5. Wrong indentation -> IndentationError, a subclass of SyntaxError
def greet():
print("Hi")
# IndentationError: expected an indented block
```

| Syntax error | Usual cause | Fix |
| --- | --- | --- |
| `SyntaxError: expected ':'` | no colon after if/for/def | add `: |
| `SyntaxError: invalid syntax` | typo, or `=` instead of `== | re-read the flagged line |
| `'(' was never closed` | unbalanced bracket or quote | count your brackets |
| `IndentationError` | wrong number of spaces | use exactly 4 spaces per level |
| `TabError` | tabs and spaces mixed | pick spaces and stay with them |

### 2. Runtime Errors (Exceptions) — Valid Code That Fails While Running

> **In simple words:**  A **runtime error**, also called an **exception**, happens while the program is running: the  syntax was fine, but Python was asked to do something impossible.

Dividing by zero, opening a file that does not exist, converting the word "abc" into a number, using an index past the end of a list — the code is perfectly legal Python, so it starts running, and then hits a wall. Python prints a **traceback** showing the chain of calls that led to the failure and stops the program.

This is the **only** family of errors that `try / except` can deal with, which is why the rest of this chapter is about them.

```python
# Reading a traceback -- read it BOTTOM-UP
#
# Traceback (most recent call last):
#   File "billing.py", line 22, in <module>       <- 3. where it started
#     total = calculate(items)
#   File "billing.py", line 15, in calculate      <- 2. the inner call
#     return amount / count
#            ~~~~~~~^~~~~~~
# ZeroDivisionError: division by zero             <- 1. READ THIS FIRST
```

The last line names the exception type and explains it; the lines above show the path that reached it. Always read the bottom line first.

```python
print(10 / 0)              # ZeroDivisionError
print(int("abc"))          # ValueError
print("5" + 5)             # TypeError
print([1, 2, 3][10])       # IndexError
print({"a": 1}["b"])       # KeyError
open("missing.txt")        # FileNotFoundError
print(undefined_name)      # NameError
print("abc".push("d"))     # AttributeError
import nonexistent_module  # ModuleNotFoundError
```

### 3. Logical Errors — the Program Runs but the Answer Is Wrong

> **In simple words:**  A **logical error** is a mistake in your reasoning. Python sees nothing wrong, runs the  program to the end, and gives you a confidently incorrect result.

There is no error message and no traceback, because as far as Python is concerned nothing failed. The only way to catch these is to check the output against what you expected — by hand, with test cases, or by printing intermediate values. Almost every serious bug that reaches production is a logical error.

```python
# 1. Wrong operator
def area_of_rectangle(length, width):
    return length + width          # should be *  -- runs fine, answer is wrong

# 2. Wrong average -- brackets missing
average = 10 + 20 + 30 / 3         # gives 40.0, not 20.0
average = (10 + 20 + 30) / 3       # correct

# 3. Off-by-one
for i in range(1, 10):             # prints 1..9, forgets 10
    print(i)
for i in range(1, 11):             # correct

# 4. Wrong comparison
if marks > 35:                     # a student with exactly 35 is failed!
    print("Pass")
if marks >= 35:                    # correct

# 5. Integer division loses the decimals
percentage = total // count        # 87 instead of 87.6
percentage = total / count         # correct

# 6. Condition order in a ladder
if bill >= 2000:  discount = 5     # a Rs.50,000 bill also matches this first
elif bill >= 10000: discount = 20  # so this line can never be reached
```

### How to Find a Logical Error

- **Print the intermediate values** — the moment a printed value surprises you, you have found the line.
- **Work one example out on paper** and compare it with what the program produced.
- **Test the edge cases** — 0, 1, an empty list, a negative number, the exact boundary value.
- **Use a debugger** — set a breakpoint and step through line by line watching the variables.
- **Write a test** — `assert area_of_rectangle(5, 3) == 15` fails loudly the moment the logic breaks.

### One Program, All Three Errors

```python
# --- VERSION 1: syntax error -- will not run at all ---
def calculate_average(marks)          # missing colon
    return sum(marks) / len(marks)

# --- VERSION 2: runtime error -- runs, then crashes on an empty list ---
def calculate_average(marks):
    return sum(marks) / len(marks)

print(calculate_average([]))          # ZeroDivisionError: division by zero

# --- VERSION 3: logical error -- runs fine, wrong answer ---
def calculate_average(marks):
    return sum(marks) / len(marks) * 100      # someone added *100 by mistake

print(calculate_average([80, 90]))    # prints 8500.0 -- no error, just wrong

# --- VERSION 4: correct and defensive ---
def calculate_average(marks):
    if not marks:                     # handle the edge case
        return 0
    return round(sum(marks) / len(marks), 2)

print(calculate_average([80, 90]))    # 85.0
print(calculate_average([]))          # 0
```

### Warnings — Not Errors, but Worth Reading

Python also emits **warnings**. A warning does not stop your program; it tells you that something you used is deprecated or suspicious and will probably break in a future version. Do not ignore them — today's warning is next year's error.

```python
import warnings

warnings.warn("This function will be removed in version 3.0", DeprecationWarning)
print("The program keeps running")
```

**Output:**

```text
DeprecationWarning: This function will be removed in version 3.0
The program keeps running
```

## Common Built-in Exceptions

| Exception | Raised when | Example |
| --- | --- | --- |
| `ZeroDivisionError` | dividing by zero | `10 / 0` |
| `ValueError` | right type, wrong value | `int("abc")` |
| `TypeError` | wrong type used | `"5" + 5` |
| `KeyError` | dict key does not exist | `d["missing"]` |
| `IndexError` | list index out of range | `[1,2][5]` |
| `FileNotFoundError` | file path is wrong | `open("no.txt")` |
| `AttributeError` | object has no such attribute | `"abc".push()` |
| `ImportError` | module cannot be imported | `import nomodule` |
| `NameError` | variable not defined | `print(xyz)` |

## try / except / else / finally

![Flow Chart 25 — the four blocks and when each one runs](asset:chapter-25-figure-2.png)

*Flow Chart 25 — the four blocks and when each one runs*

```python
try:
    # code that MIGHT fail
    result = 10 / int(input("Enter a divisor: "))

except ZeroDivisionError:
    print("You cannot divide by zero.")

except ValueError:
    print("Please enter a whole number.")

except Exception as e:              # catch-all -- always LAST
    print(f"Unexpected error: {type(e).__name__} - {e}")

else:
    # runs ONLY if no exception occurred
    print("Result is", result)

finally:
    # ALWAYS runs -- success or failure
```

```python
    print("Calculation attempt finished.")
```

## Raising Your Own Exceptions

```python
def set_age(age):
    if not isinstance(age, int):
        raise TypeError("Age must be an integer")
    if age < 0:
        raise ValueError("Age cannot be negative")
    if age > 120:
        raise ValueError("Age looks unrealistic")
    return age

try:
    set_age(-5)
except ValueError as e:
    print("Rejected:", e)
```

**Output:**

```text
Rejected: Age cannot be negative
```

## Custom Exception Classes

```python
class InsufficientFundsError(Exception):
    """Raised when an account does not have enough balance."""
    def __init__(self, balance, requested):
        self.shortfall = requested - balance
        super().__init__(
            f"Short by Rs.{self.shortfall:,.2f} "
            f"(balance Rs.{balance:,.2f}, requested Rs.{requested:,.2f})"
        )

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFundsError(balance, amount)
    return balance - amount

try:
    withdraw(5000, 12000)
except InsufficientFundsError as e:
    print("Transaction failed:", e)
    print("Suggest depositing at least Rs.", e.shortfall)
```

**Output:**

```text
Transaction failed: Short by Rs.7,000.00 (balance Rs.5,000.00, requested Rs.12,000.00)
Suggest depositing at least Rs. 7000
```

> **Best practices:**  Catch the \*\*specific\*\* exception, not a bare `except:`. Never write an empty `except: pass` —  you will silently swallow real bugs. Use `finally` to release resources (files, database connections, locks).

#### Real-Time Example — A Payment API Call That Must Never Crash

**Program: payment_handler.py**

```python
import json

def process_payment(order_id, amount, gateway_response):
    """Parse a gateway response and update the order -- must never crash."""
    connection = f"DB-conn-{order_id}"          # pretend DB connection
    print(f"[{order_id}] opened {connection}")

    try:
```

```python
        data = json.loads(gateway_response)
        status = data["status"]
        paid   = float(data["amount_paid"])

        if status != "SUCCESS":
            raise ValueError(f"Gateway returned {status}")
        if abs(paid - amount) > 0.01:
            raise ValueError(f"Amount mismatch: expected {amount}, got {paid}")

    except json.JSONDecodeError:
        return "RETRY", "Malformed response from gateway"
    except KeyError as e:
        return "RETRY", f"Missing field in response: {e}"
    except ValueError as e:
        return "FAILED", str(e)
    except Exception as e:
        return "ERROR", f"Unhandled: {type(e).__name__}"
    else:
        return "PAID", f"Payment of Rs.{paid:,.2f} confirmed"
    finally:
        print(f"[{order_id}] closed {connection}")

tests = [
    ("ORD1", 1500.0, '{"status": "SUCCESS", "amount_paid": "1500.00"}'),
    ("ORD2", 1500.0, '{"status": "DECLINED", "amount_paid": "0"}'),
    ("ORD3", 1500.0, '{"status": "SUCCESS"}'),
    ("ORD4", 1500.0, 'not-json-at-all'),
]

for oid, amt, resp in tests:
    state, msg = process_payment(oid, amt, resp)
    print(f"    -> {state:<7} {msg}\n")
```

**Output:**

```text
[ORD1] opened DB-conn-ORD1
[ORD1] closed DB-conn-ORD1
    -> PAID    Payment of Rs.1,500.00 confirmed
[ORD2] opened DB-conn-ORD2
[ORD2] closed DB-conn-ORD2
    -> FAILED  Gateway returned DECLINED
[ORD3] opened DB-conn-ORD3
[ORD3] closed DB-conn-ORD3
    -> RETRY   Missing field in response: 'amount_paid'
[ORD4] opened DB-conn-ORD4
[ORD4] closed DB-conn-ORD4
    -> RETRY   Malformed response from gateway
```

Look at the `finally` line in every single case — the database connection is released whether the payment succeeded, failed, or the response was garbage. That is exactly why `finally` exists.
