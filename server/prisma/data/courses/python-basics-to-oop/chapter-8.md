> **In simple words:**  A conditional statement lets a program **choose** what to do next by checking whether  something is True or False.

Up to now every program ran straight from the first line to the last. Real programs are not like that. An ATM must check your balance before giving cash; a website must check your password before letting you in; a shop's billing screen must check the bill amount before applying a discount. All of these are **decisions**, and a decision in Python is written with `if`.

The rule is simple: Python evaluates the condition, gets back either `True` or `False`, and runs the indented block **only when the answer is True**. The condition itself is usually built with the comparison operators (`==`, `!=`, `>`, `<`, `>=`, `<=`) and the logical operators (`and`, `or`, `not`) that you learned in the previous chapter.

## Two Rules You Must Never Forget

- Every `if`, `elif` and `else` line **ends with a colon** `:`
- The block that belongs to it is **indented by 4 spaces**. The indentation is what tells Python where the block starts and ends.

```python
if 10 > 5:
    print("This line is INSIDE the if")     # 4 spaces -> inside
    print("So is this one")                 # same indent -> also inside
print("This line is OUTSIDE -- it always runs")
```

**Output:**

```text
This line is INSIDE the if
So is this one
This line is OUTSIDE -- it always runs
```

## The Four Forms of a Conditional

| Form | Number of paths | Use it when |
| --- | --- | --- |
| `if` | 1 (do it or skip it) | something extra happens only in one case |
| `if ... else` | 2 (either / or) | there are exactly two possibilities |
| `if ... elif ... else` | many | there are three or more possibilities |
| nested `if | a decision inside a decision | the second question depends on the first |

## 8.1  Form 1 — The Simple `if`

> **In simple words:**  A simple `if` runs a block of code **only when the condition is True**, and quietly skips it when  the condition is False. It is a **one-way decision** — there is no alternative path.

Think of it as an optional extra step. If the condition does not hold, nothing happens and the program simply carries on with the next line after the block. Use this form when there is no "otherwise" case to handle.

**Syntax**

```python
if condition:
    statement(s)          # runs ONLY when the condition is True

next_statement            # always runs, condition or not
```

![Flow Chart 2 — the simple if: the body is skipped when the condition is False](asset:chapter-8-figure-1.png)

*Flow Chart 2 — the simple if: the body is skipped when the condition is False*

### Example 1 — Congratulate a student who passed

```python
marks = 78

if marks >= 35:
    print("Congratulations, you passed!")

print("Result processing complete.")
```

**Output:**

```text
Congratulations, you passed!
Result processing complete.
```

If `marks` were 20 the first message would simply not appear, and only the last line would print. Nothing breaks — the block is skipped.

### Example 2 — Free delivery above a certain amount

```python
bill = 750
delivery_charge = 50

if bill >= 500:
    delivery_charge = 0
    print("You have earned FREE delivery!")

print(f"Bill Rs.{bill} + delivery Rs.{delivery_charge} = Rs.{bill + delivery_charge}")
```

**Output:**

```text
You have earned FREE delivery!
Bill Rs.750 + delivery Rs.0 = Rs.750
```

### Example 3 — Warn about low battery

```python
battery = 12

if battery < 20:
    print(f"Warning: battery at {battery}%. Please plug in the charger.")
```

**Output:**

```text
Warning: battery at 12%. Please plug in the charger.
```

### Example 4 — Two separate `if` statements both run

```python
age = 25
has_id = True

if age >= 18:
    print("Age check passed")

if has_id:
    print("ID check passed")        # this is a SEPARATE decision, not an alternative
```

**Output:**

```text
Age check passed
ID check passed
```

> **Note:**  Two separate `if` statements are checked independently, so \*\*both\*\* can run. That is different from `if`  `... elif`, where only one branch is ever chosen.

## 8.2  Form 2 — `if ... else`

> **In simple words:**  `if ... else` gives the program **two paths**: one block runs when the condition is True, the  other runs when it is False. Exactly one of them always executes — never both, never neither.

Use this form whenever the answer to your question is a straight yes or no: passed or failed, even or odd, adult or minor, in stock or out of stock. Because one of the two blocks is guaranteed to run, `if ... else` is the safest way to make sure every case is handled.

**Syntax**

```python
if condition:
    statement(s)          # runs when the condition is True
else:
    statement(s)          # runs when the condition is False

next_statement            # both paths meet here and continue
```

![Flow Chart 3 — if / else: the two paths split and then join again](asset:chapter-8-figure-2.png)

*Flow Chart 3 — if / else: the two paths split and then join again*

### Example 1 — Pass or fail

```python
marks = 28

if marks >= 35:
    print("Result: PASS")
else:
    print("Result: FAIL -- better luck next time")
```

**Output:**

```text
Result: FAIL -- better luck next time
```

### Example 2 — Even or odd

```python
num = int(input("Enter a number: "))

if num % 2 == 0:
    print(f"{num} is an EVEN number")
else:
    print(f"{num} is an ODD number")
```

**Output:**

```text
Enter a number: 17
17 is an ODD number
```

### Example 3 — Adult or minor

```python
age = 15

if age >= 18:
    print("You are an adult. You can vote and apply for a licence.")
else:
```

```python
    print(f"You are a minor. Wait {18 - age} more year(s).")
```

**Output:**

```text
You are a minor. Wait 3 more year(s).
```

### Example 4 — Login check

```python
STORED_PASSWORD = "python@123"
entered = input("Enter password: ")

if entered == STORED_PASSWORD:
    print("Login successful. Loading your dashboard...")
else:
    print("Incorrect password. Access denied.")
```

### Example 5 — Bigger of two numbers

```python
a, b = 45, 89

if a > b:
    print(f"{a} is bigger")
else:
    print(f"{b} is bigger")
```

**Output:**

```text
89 is bigger
```

## 8.3  Form 3 — `if ... elif ... else` (the Ladder)

> **In simple words:**  `elif` means "else if". This form checks conditions **one after another from top to bottom,**  **stops at the very first one that is True**, runs that block, and ignores everything below it. The final `else` catches every case that matched nothing.

You can chain as many `elif` branches as you need, and the closing `else` is optional. The important idea is that **only one block ever runs**. Once a condition matches, Python does not even look at the remaining conditions — which makes the ladder both fast and easy to reason about.

Because the checking stops at the first match, **the order of your conditions matters**. Always write the most specific or most restrictive condition first, otherwise a broader condition higher up will swallow the cases meant for the branches below it.

**Syntax**

```python
if condition1:
    block 1
elif condition2:
    block 2
elif condition3:
    block 3
else:
    block 4               # optional -- runs when nothing above matched
```

![Flow Chart 4 — the elif ladder: checking stops at the first True](asset:chapter-8-figure-3.png)

*Flow Chart 4 — the elif ladder: checking stops at the first True*

### Example 1 — Grade from marks

```python
marks = 76

if marks >= 90:
    grade = "A+"
elif marks >= 75:
    grade = "A"
elif marks >= 60:
    grade = "B"
elif marks >= 35:
    grade = "C"
else:
    grade = "Fail"

print(f"Marks {marks} -> Grade {grade}")
```

**Output:**

```text
Marks 76 -> Grade A
```

Notice that we never had to write `elif marks >= 75 and marks < 90`. Because the first condition already failed, Python has effectively proved that `marks` is below 90 by the time it reaches the second line.

### Example 2 — Positive, negative or zero

```python
n = 0

if n > 0:
    print("Positive number")
elif n < 0:
```

```python
    print("Negative number")
else:
    print("The number is zero")
```

**Output:**

```text
The number is zero
```

### Example 3 — Discount slabs on a shopping bill

```python
bill = 7500

if bill >= 10000:
    discount = 20
elif bill >= 5000:
    discount = 10
elif bill >= 2000:
    discount = 5
else:
    discount = 0

payable = bill - bill * discount / 100
print(f"Bill Rs.{bill:,} | Discount {discount}% | Pay Rs.{payable:,.2f}")
```

**Output:**

```text
Bill Rs.7,500 | Discount 10% | Pay Rs.6,750.00
```

> **Order matters:**  If the `bill >= 2000` line were written first, a bill of Rs.15,000 would also satisfy it and would  wrongly get only a 5% discount. Highest slab first, lowest slab last.

### Example 4 — Traffic signal

```python
signal = "yellow"

if signal == "green":
    print("Go")
elif signal == "yellow":
    print("Slow down and be ready to stop")
elif signal == "red":
    print("Stop")
else:
    print("Signal not working -- drive carefully")
```

**Output:**

```text
Slow down and be ready to stop
```

### Example 5 — Day of the week from a number

```python
day = 3

if day == 1:
    name = "Monday"
elif day == 2:
    name = "Tuesday"
elif day == 3:
    name = "Wednesday"
elif day in (4, 5):
    name = "Thursday or Friday"
elif day in (6, 7):
    name = "Weekend"
else:
    name = "Invalid day number"

print(name)
```

**Output:**

```text
Wednesday
```

### Example 6 — Electricity bill by units consumed

```python
units = 340

if units <= 100:
    rate = 1.50
elif units <= 200:
    rate = 2.50
elif units <= 500:
    rate = 4.50
else:
    rate = 6.50

bill = units * rate
print(f"{units} units at Rs.{rate}/unit = Rs.{bill:,.2f}")
```

**Output:**

```text
340 units at Rs.4.5/unit = Rs.1,530.00
```

## 8.4  Form 4 — Nested `if`

> **In simple words:**  A nested `if` is **an `if` statement written inside another `if` block**. The inner condition is  checked only when the outer condition has already turned out to be True.

Use nesting when the second question only makes sense after the first one is answered. There is no point asking "do you have a driving licence?" before you know the person is old enough to hold one — so the licence check belongs \*inside\* the age check.

Each level of nesting adds another 4 spaces of indentation. Keep nesting to two or three levels at most: beyond that the code becomes hard to read, and it can usually be rewritten as a flat `elif` ladder or by combining the conditions with `and`.

**Syntax**

```python
if outer_condition:
    statement(s)

    if inner_condition:
        inner if block        # 8 spaces -- inside BOTH ifs
    else:
        inner else block
else:
    outer else block
```

![Flow Chart 5 — nested if: the inner question is asked only on the True path](asset:chapter-8-figure-4.png)

*Flow Chart 5 — nested if: the inner question is asked only on the True path*

### Example 1 — Can this person drive?

```python
age = 22
has_license = False

if age >= 18:
    print("Age requirement satisfied.")
    if has_license:
        print("You may drive. Have a safe trip!")
    else:
        print("Please get a driving licence first.")
else:
    print(f"Too young to drive. Come back in {18 - age} year(s).")
```

**Output:**

```text
Age requirement satisfied.
Please get a driving licence first.
```

### Example 2 — Largest of three numbers

```python
a, b, c = 45, 89, 67

if a > b:
    if a > c:
        largest = a
    else:
        largest = c
else:
    if b > c:
        largest = b
```

```python
    else:
        largest = c

print("Largest number is", largest)
```

**Output:**

```text
Largest number is 89
```

### Example 3 — ATM withdrawal in two stages

```python
balance = 10000
pin_correct = True
amount = 15000

if pin_correct:
    if amount <= balance:
        balance -= amount
        print(f"Please collect Rs.{amount}. New balance Rs.{balance}")
    else:
        print(f"Insufficient funds. Your balance is only Rs.{balance}")
else:
    print("Incorrect PIN. Card retained.")
```

**Output:**

```text
Insufficient funds. Your balance is only Rs.10000
```

### Example 4 — Loan approval

```python
salary = 55000
credit_score = 710
existing_loans = 1

if salary >= 30000:
    if credit_score >= 700:
        if existing_loans < 2:
            print("Loan APPROVED")
        else:
            print("Rejected: too many existing loans")
    else:
        print("Rejected: credit score below 700")
else:
    print("Rejected: minimum salary is Rs.30,000")
```

**Output:**

```text
Loan APPROVED
```

### Nested `if` vs `and` — Choosing the Cleaner Version

```python
# Nested version -- gives a SPECIFIC reason for each failure
if salary >= 30000:
    if credit_score >= 700:
        print("Approved")
    else:
        print("Rejected: low credit score")
else:
    print("Rejected: low salary")

# Flat version with 'and' -- shorter, but only one generic message
if salary >= 30000 and credit_score >= 700:
    print("Approved")
else:
    print("Rejected")
```

> **Which to use?**  If you need to tell the user \*\*why\*\* something failed, nest. If you only need a yes/no answer,  combine the conditions with `and` and keep the code flat.

## 8.5  The One-Line `if` (Ternary Operator)

> **In simple words:**  A ternary is a **compact one-line version of `if ... else`** that produces a value instead of  running a block.

**Syntax**

```python
value_if_true if condition else value_if_false

marks = 78
status = "Pass" if marks >= 35 else "Fail"
print(status)

# The same thing written normally
if marks >= 35:
    status = "Pass"
else:
    status = "Fail"

# More one-liners
n = 7
print("Even" if n % 2 == 0 else "Odd")

bill = 6000
discount = 0.10 if bill > 5000 else 0.05

age = 15
print(f"Ticket price: Rs.{100 if age >= 12 else 50}")
```

**Output:**

```text
Pass
Odd
Ticket price: Rs.50
```

> **Use it sparingly:**  A ternary is perfect for a short either/or value. If you find yourself nesting one inside another,  switch back to a normal `if ... else` — readability wins.

## 8.6  Truthy and Falsy Values

> **In simple words:**  Python treats some values as **False** even though they are not the word `False`. Anything  "empty" or "zero" is falsy; everything else is truthy.

| Falsy (treated as False) | Truthy (treated as True) |
| --- | --- |
| `0', '0.0` | any other number, e.g. `1`, `-5`, `0.1 |
| ""` (empty string) | any non-empty string, even `" " |
| `[]', '()', '{}', 'set()` | any non-empty list, tuple, dict or set |
| `None` | any object |
| `False` | `True` |

```python
cart = []

if cart:                          # shorter than: if len(cart) > 0
```

```python
    print("Proceed to checkout")
else:
    print("Your cart is empty")

name = input("Enter your name: ").strip()
if not name:                      # empty string is falsy
    name = "Guest"
print("Welcome,", name)
```

**Output:**

```text
Your cart is empty
Enter your name:
Welcome, Guest
```

## 8.7  `match ... case` (Python 3.10+)

> **In simple words:**  `match` compares one value against several patterns — a tidier alternative to a long `if ...`  `elif` ladder when you are checking the **same variable** every time.

```python
status_code = 404

match status_code:
    case 200:
        print("OK -- request succeeded")
    case 301 | 302:                     # | means "or"
        print("Redirected to another URL")
    case 404:
        print("Not Found")
    case 500:
        print("Internal Server Error")
    case _:                             # _ is the default, like else
        print("Unknown status code")
```

**Output:**

```text
Not Found
```

## 8.8  Common Mistakes to Avoid

| Mistake | What happens | Fix |
| --- | --- | --- |
| Missing colon: `if x > 5 | `SyntaxError` | add `:` at the end |
| Using `=` instead of `== | `SyntaxError` | =` assigns, `==` compares |
| Wrong indentation | IndentationError` or wrong logic `SyntaxError` | use exactly 4 spaces a ladder must start with `if |
| `elif' without a preceding` |  |  |
| `'if` |  |  |
| Broad condition placed first | later branches never run | most specific condition first |
| `if x == None:` | works but is not idiomatic | write `if x is None: |

```python
# WRONG
# if marks = 90:            <- assignment, not comparison
# if marks > 90             <- missing colon
# if marks > 90:
# print("A+")               <- not indented, so it is outside the if

# RIGHT
if marks > 90:
    print("A+")
```

## 8.9  Quick Comparison of All Four Forms

|  | Simple if | if / else | if / elif / else | Nested if |
| --- | --- | --- | --- | --- |
| Paths | 1 | 2 | 3 or more | branches within a branch |
| else` needed? | No | Yes | Optional | Optional at each level |
| Blocks that run | 0 or 1 | exactly 1 | exactly 1 | one path down the tree |
| Best for | optional extra step | yes / no answers | grades, slabs, menus | dependent conditions |

#### Real-Time Example — ATM Withdrawal Validation

Every ATM in the world runs a chain of checks before releasing cash, and any failed check stops the transaction immediately. This is an `if / elif / else` ladder in its purest form — the flow chart below is the exact logic.

![Flow Chart 6 — a real elif ladder validating an ATM withdrawal](asset:chapter-8-figure-5.png)

*Flow Chart 6 — a real elif ladder validating an ATM withdrawal*

**Program: atm.py**

```python
def withdraw(balance, amount, pin_ok):
    if not pin_ok:
        return balance, "Incorrect PIN"
    elif amount <= 0:
        return balance, "Invalid amount"
    elif amount > balance:
        return balance, "Insufficient funds"
    elif amount % 100 != 0:
```

```python
        return balance, "Enter multiples of 100 only"
    elif amount > 25000:
        return balance, "Daily limit is Rs.25,000"
    else:
        balance -= amount
        return balance, f"Please collect Rs.{amount}. Balance: Rs.{balance}"

for amt in [500, 90000, 750, -100]:
    bal, msg = withdraw(10000, amt, pin_ok=True)
    print(f"Request Rs.{amt:>6} -> {msg}")
```

**Output:**

```text
Request Rs.   500 -> Please collect Rs.500. Balance: Rs.9500
Request Rs. 90000 -> Insufficient funds
Request Rs.   750 -> Enter multiples of 100 only
Request Rs.  -100 -> Invalid amount
```

> **Note the order:**  The most critical check (PIN) comes first, then validity of the amount, then the business rules.  Ordering conditions from most-restrictive to least-restrictive is what makes sure every rule actually gets a chance to run.

## More Practice — Everyday Decision Programs

### 1. Largest of three numbers

```python
a, b, c = 45, 89, 67

if a >= b and a >= c:
    largest = a
elif b >= a and b >= c:
    largest = b
else:
    largest = c

print("Largest is", largest)

# Shorter way using a built-in
print("Largest is", max(a, b, c))
```

**Output:**

```text
Largest is 89
Largest is 89
```

### 2. Leap year check

```python
year = 2024

if year % 400 == 0:
    print(year, "is a leap year")
elif year % 100 == 0:
    print(year, "is NOT a leap year")
elif year % 4 == 0:
    print(year, "is a leap year")
else:
    print(year, "is NOT a leap year")
```

**Output:**

```text
2024 is a leap year
```

### 3. Voting eligibility

```python
age = int(input("Enter your age: "))
```

```python
if age < 0:
    print("Age cannot be negative")
elif age >= 18:
    print("You are eligible to vote")
else:
    print(f"You can vote after {18 - age} more year(s)")
```

### 4. Positive, negative or zero

```python
n = -7

if n > 0:
    print("Positive")
elif n < 0:
    print("Negative")
else:
    print("Zero")
```

### 5. Discount slab for a shopping bill

```python
bill = 7500

if bill >= 10000:
    discount = 20
elif bill >= 5000:
    discount = 10
elif bill >= 2000:
    discount = 5
else:
    discount = 0

payable = bill - bill * discount / 100
print(f"Bill Rs.{bill} | Discount {discount}% | Pay Rs.{payable:,.2f}")
```

**Output:**

```text
Bill Rs.7500 | Discount 10% | Pay Rs.6,750.00
```

### 6. Traffic signal

```python
signal = "yellow"

if signal == "green":
    print("Go")
elif signal == "yellow":
    print("Slow down and get ready to stop")
elif signal == "red":
    print("Stop")
else:
    print("Signal not working -- drive carefully")
```

### 7. Simple login check

```python
USERNAME, PASSWORD = "admin", "python@123"

user = input("Username: ")
pwd  = input("Password: ")

if user == USERNAME and pwd == PASSWORD:
    print("Login successful. Welcome!")
elif user == USERNAME:
    print("Wrong password")
```

```python
else:
    print("User not found")
```

### 8. BMI category

```python
weight = 72          # kg
height = 1.75        # metres

bmi = weight / height ** 2

if bmi < 18.5:
    category = "Underweight"
elif bmi < 25:
    category = "Normal"
elif bmi < 30:
    category = "Overweight"
else:
    category = "Obese"

print(f"BMI = {bmi:.1f} -> {category}")
```

**Output:**

```text
BMI = 23.5 -> Normal
```
