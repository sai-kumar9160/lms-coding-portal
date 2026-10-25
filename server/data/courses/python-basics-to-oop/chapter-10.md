> **In simple words:**  A `while` loop **keeps repeating a block of code for as long as a condition stays True**.

The condition is checked before every pass, so if it is False at the very start the body never runs at all. Something inside the loop must eventually make the condition False, otherwise the program loops forever. Reach for `while` when you do not know in advance how many repetitions are needed — retrying a password, showing a menu, waiting for a server.

## The Idea

A `while` loop repeats **as long as a condition stays True**. Use it when you do not know in advance how many repetitions are needed — waiting for correct input, polling a server, running a menu until the user chooses Exit.

```python
while condition:
    # runs again and again while condition is True
    # MUST contain something that eventually makes condition False
```

## for vs while

| Use for when... | Use while when... |
| --- | --- |
| You know the collection or count | The number of repetitions is unknown |
| Iterating a list, string, dict, file | Waiting for a condition to change |
| `for i in range(10):` | `while not logged_in:` |
| Counter handled automatically | You manage the counter yourself |

## Basic Examples

```python
# Countdown
n = 5
while n > 0:
    print(n, end=" ")
    n -= 1              # WITHOUT this line -> infinite loop
print("Liftoff!")

# Sum of digits
num, total = 12345, 0
while num > 0:
    total += num % 10   # take the last digit
    num //= 10          # drop the last digit
print("Digit sum:", total)      # 15
```

> **Infinite loop warning:**  If nothing inside the loop changes the condition, the program never stops. Press Ctrl + C to  break out. Always ask: "what line makes this condition False?"

## Infinite Loops — `while True`

> **In simple words:**  An infinite loop is a loop whose condition **never becomes False**, so it keeps running until  something inside it deliberately stops it with `break`.

`while True:` is the standard way to write one. Since `True` is always true, Python never even bothers re- testing the condition — the block simply repeats. This sounds like a bug, and sometimes it is, but it is also one of the most useful patterns in real software.

The reason is simple: often you cannot know the stopping condition **before** the loop starts, only **after** you have done some work inside it. You cannot check whether the user chose "Exit" until you have shown the menu and read their answer. So you loop forever, do the work, and `break` out at exactly the right moment.

![Flow Chart 8 — an intentional infinite loop with a break as the exit door](asset:chapter-10-figure-1.png)

*Flow Chart 8 — an intentional infinite loop with a break as the exit door*

### Deliberate vs Accidental

```python
# DELIBERATE -- correct and very common
while True:
    choice = input("Continue? (y/n): ")
    if choice.lower() == "n":
        break                  # the exit door
    print("Working...")

# ACCIDENTAL -- a genuine bug
n = 5
while n > 0:
    print(n)
    # n -= 1   <-- forgotten! n stays 5 forever, so the program hangs
```

> **If your program hangs:**  Press \*\*Ctrl + C\*\* to stop it. Then ask yourself the one diagnostic question: \*which line  inside this loop makes the condition become False?\* If you cannot point to it, you have found the bug.

### Other Ways to Write an Infinite Loop

```python
while True:      # the standard, most readable form
    ...

while 1:         # works (1 is truthy) but old-fashioned -- avoid

while "yes":     # any truthy value works -- confusing, avoid

for i in itertools.count():    # an infinite for loop, needs: import itertools
    ...
```

### Example 1 — Menu that runs until the user exits

```python
balance = 10000

while True:
    print("\n1. Check balance   2. Deposit   3. Withdraw   4. Exit")
    choice = input("Choose an option: ")

    if choice == "1":
        print(f"Your balance is Rs.{balance:,}")
    elif choice == "2":
        balance += float(input("Amount to deposit: "))
        print("Deposited.")
    elif choice == "3":
        amt = float(input("Amount to withdraw: "))
        if amt <= balance:
            balance -= amt
            print("Please collect your cash.")
        else:
            print("Insufficient funds.")
    elif choice == "4":
        print("Thank you for banking with us!")
        break                                  # the only way out
    else:
        print("Invalid option, please try again.")
```

### Example 2 — Keep asking until the input is valid

```python
while True:
    raw = input("Enter your age: ")
    if raw.isdigit() and 1 <= int(raw) <= 120:
        age = int(raw)
        break                          # valid -- leave the loop
    print("  Please enter a whole number between 1 and 120.")

print("Thank you. Your age is", age)
```

**Output:**

```text
Enter your age: abc
  Please enter a whole number between 1 and 120.
Enter your age: 250
  Please enter a whole number between 1 and 120.
Enter your age: 25
Thank you. Your age is 25
```

This is the single most common use of `while True` in real code. You cannot validate the input before you have read it, so you loop until it is good.

### Example 3 — A simple number guessing game

```python
import random

secret = random.randint(1, 100)
attempts = 0

while True:
    guess = int(input("Guess a number between 1 and 100: "))
    attempts += 1

    if guess < secret:
        print("Too low!")
    elif guess > secret:
        print("Too high!")
    else:
        print(f"Correct! You got it in {attempts} attempts.")
        break
```

### Example 4 — `while True` with `continue` as well as `break`

```python
total = 0

while True:
    entry = input("Enter an amount (or 'done' to finish): ")

    if entry.lower() == "done":
        break                          # finished

    if not entry.replace(".", "", 1).isdigit():
        print("  That is not a number, ignoring it.")
        continue                       # skip this one, ask again

    total += float(entry)
    print(f"  Running total: Rs.{total:,.2f}")

print(f"\nFinal total: Rs.{total:,.2f}")
```

### Safety Net — Always Give an Infinite Loop a Limit

```python
MAX_RETRIES = 5
attempts = 0

while True:
    attempts += 1
    if connect_to_server():
        print("Connected!")
        break
    if attempts >= MAX_RETRIES:        # safety exit -- never loop forever in production
        print("Giving up after 5 attempts.")
        break
    print(f"Retry {attempts}/{MAX_RETRIES}...")
```

> **Production rule:**  An infinite loop that talks to the outside world — a server, a file, a device — must always have a  maximum attempt count or a timeout. Otherwise one network problem freezes your whole program.

## Menu-Driven Program — The Classic while Use Case

```python
balance = 10000
```

```python
while True:                       # deliberate infinite loop
    print("\n1.Balance  2.Deposit  3.Withdraw  4.Exit")
    choice = input("Choose: ")

    if choice == "1":
        print(f"Balance: Rs.{balance}")
    elif choice == "2":
        balance += float(input("Amount: "))
    elif choice == "3":
        amt = float(input("Amount: "))
        balance = balance - amt if amt <= balance else balance
    elif choice == "4":
        print("Thank you!")
        break                     # the ONLY way out
    else:
        print("Invalid choice")
```

#### Real-Time Example — ATM PIN Retry With a 3-Attempt Lock

![Flow Chart 9 — while loop controlling limited retries](asset:chapter-10-figure-2.png)

*Flow Chart 9 — while loop controlling limited retries*

**Program: pin_lock.py**

```python
CORRECT_PIN = "1234"
MAX_ATTEMPTS = 3
attempts = 0
authenticated = False

while attempts < MAX_ATTEMPTS:
```

```python
    entered = input(f"Enter PIN (attempt {attempts + 1}/{MAX_ATTEMPTS}): ")

    if entered == CORRECT_PIN:
        authenticated = True
        break                     # success -> leave the loop immediately

    attempts += 1
    remaining = MAX_ATTEMPTS - attempts
    if remaining:
        print(f"Wrong PIN. {remaining} attempt(s) left.")

if authenticated:
    print("Welcome! Transaction menu loading...")
else:
    print("Card blocked. Please contact your branch.")
```

This exact pattern — a counter, a maximum, a `break` on success and a decision after the loop — secures every ATM, phone lock screen and banking app in the world.

## More Practice — Classic while-Loop Programs

### 1. Print 1 to 10

```python
i = 1
while i <= 10:
    print(i, end=" ")
    i += 1
```

**Output:**

```text
1 2 3 4 5 6 7 8 9 10
```

### 2. Reverse a number

```python
num = 12345
reverse = 0

while num > 0:
    digit = num % 10          # take the last digit
    reverse = reverse * 10 + digit
    num //= 10                # remove the last digit

print("Reversed:", reverse)
```

**Output:**

```text
Reversed: 54321
```

### 3. Check if a number is a palindrome

```python
original = 1221
num, reverse = original, 0

while num > 0:
    reverse = reverse * 10 + num % 10
    num //= 10

print(original, "is", "a palindrome" if reverse == original else "not a palindrome")
```

**Output:**

```text
1221 is a palindrome
```

### 4. Keep adding until the user enters 0

```python
total = 0
```

```python
while True:
    n = int(input("Enter a number (0 to stop): "))
    if n == 0:
        break
    total += n

print("Sum of all numbers:", total)
```

### 5. Number guessing game

```python
import random

secret = random.randint(1, 100)
tries = 0

while True:
    guess = int(input("Guess the number (1-100): "))
    tries += 1

    if guess < secret:
        print("Too low! Try higher.")
    elif guess > secret:
        print("Too high! Try lower.")
    else:
        print(f"Correct! You took {tries} guesses.")
        break
```

### 6. Count digits in a number

```python
num = 987654
count = 0

while num > 0:
    count += 1
    num //= 10

print("Number of digits:", count)
```

**Output:**

```text
Number of digits: 6
```

### 7. Multiplication quiz that repeats until correct

```python
a, b = 7, 8
answer = a * b

while True:
    guess = int(input(f"What is {a} x {b}? "))
    if guess == answer:
        print("Correct!")
        break
    print("Wrong, try again.")
```

### 8. Simple menu that runs until Exit

```python
todo = []

while True:
    print("\n1.Add  2.Show  3.Exit")
    choice = input("Choose: ")
```

```python
    if choice == "1":
        todo.append(input("Task: "))
        print("Added!")
    elif choice == "2":
        for i, task in enumerate(todo, 1):
            print(f"  {i}. {task}")
    elif choice == "3":
        print("Bye!")
        break
    else:
        print("Invalid choice")
```
