> **In simple words:**  These four keywords let you **control what a loop does in the middle of running**.

`break` walks out of the loop immediately, `continue` skips the rest of the current pass and jumps to the next item, and `pass` does nothing at all — it is a placeholder that keeps a block syntactically valid. The `else` attached to a loop is a Python speciality: it runs only when the loop finished without ever hitting a `break`.

## break — Exit the Loop Completely

```python
# Find the first failed student and stop searching
marks = [85, 92, 28, 95, 15]

for i, m in enumerate(marks):
    if m < 35:
        print(f"First failure found at position {i} with {m} marks")
        break                # stop -- no need to check the rest
```

**Output:**

```text
First failure found at position 2 with 28 marks
```

## continue — Skip This Iteration Only

```python
# Process only valid transactions, skip the corrupted ones
transactions = [1500, -1, 2300, None, 890, -1]

total = 0
for t in transactions:
    if t is None or t < 0:
        continue             # skip and move to the next item
    total += t
print("Valid total:", total)
```

**Output:**

```text
Valid total: 4690
```

## pass — Do Nothing (a Placeholder)

```python
def send_sms(number, message):
    pass          # to be implemented next sprint -- keeps the file runnable

class PaymentGateway:
    pass          # empty class, no error

for x in range(3):
    if x == 1:
        pass      # explicitly do nothing for this case
    else:
        print(x)
```

## else on a Loop — A Python Speciality

A loop's `else` block runs **only if the loop finished normally**, i.e. it was \*not\* stopped by `break`. It reads as "if we searched everything and found nothing".

```python
inventory = ["mouse", "keyboard", "monitor"]
wanted = "printer"

for item in inventory:
```

```python
    if item == wanted:
        print("In stock!")
        break
else:
    print(f"'{wanted}' is out of stock -- placing a purchase order")
```

**Output:**

```text
'printer' is out of stock -- placing a purchase order
```

## Comparison at a Glance

| Keyword | Effect | Loop continues? |
| --- | --- | --- |
| `break` | leaves the loop right now | No |
| `continue` | jumps to the next iteration | Yes |
| `pass` | does nothing at all | Yes |
| `return` | leaves the whole function | No |

#### Real-Time Example — Validating a Batch of Uploaded Records

**Program: bulk_upload_validator.py**

```python
records = [
    {"id": 1, "email": "ravi@x.com",  "age": 25},
    {"id": 2, "email": "bad-email",   "age": 30},
    {"id": 3, "email": "anu@x.com",   "age": -5},
    {"id": 4, "email": "kiran@x.com", "age": 28},
    {"id": 5, "email": None,          "age": 22},
]

valid, rejected = [], []

for rec in records:
    if not rec["email"]:
        rejected.append((rec["id"], "email missing"))
        continue
    if "@" not in rec["email"]:
        rejected.append((rec["id"], "invalid email format"))
        continue
    if rec["age"] <= 0 or rec["age"] > 120:
        rejected.append((rec["id"], "age out of range"))
        continue
    valid.append(rec)

print(f"Accepted: {len(valid)}, Rejected: {len(rejected)}")
for rid, reason in rejected:
    print(f"  Record {rid} -> {reason}")
```

**Output:**

```text
Accepted: 2, Rejected: 3
Record 2 -> invalid email format
Record 3 -> age out of range
Record 5 -> email missing
```

## More Practice — break, continue and pass

### 1. Check if a number is prime

```python
n = 29
is_prime = True

if n < 2:
    is_prime = False
```

```python
else:
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            is_prime = False
            break                   # no need to check further

print(n, "is", "prime" if is_prime else "not prime")
```

**Output:**

```text
29 is prime
```

### 2. Search for a name and stop when found

```python
students = ["Ravi", "Anu", "Kiran", "Meera"]
search = "Kiran"

for i, name in enumerate(students):
    if name == search:
        print(f"Found '{search}' at position {i}")
        break
else:
    print(f"'{search}' is not in the list")
```

**Output:**

```text
Found 'Kiran' at position 2
```

### 3. Skip negative numbers while adding

```python
readings = [12, -1, 18, -5, 21, 9]
total = 0

for r in readings:
    if r < 0:
        continue                    # ignore bad sensor readings
    total += r

print("Total of valid readings:", total)
```

**Output:**

```text
Total of valid readings: 60
```

### 4. Print only even numbers, skip the rest

```python
for n in range(1, 21):
    if n % 2 != 0:
        continue
    print(n, end=" ")
```

**Output:**

```text
2 4 6 8 10 12 14 16 18 20
```

### 5. Stop reading marks when -1 is entered

```python
marks = []

while True:
    m = int(input("Enter mark (-1 to finish): "))
    if m == -1:
        break
    if m < 0 or m > 100:
        print("  Invalid mark, ignored.")
        continue
    marks.append(m)

if marks:
    print(f"{len(marks)} marks entered, average = {sum(marks) / len(marks):.2f}")
else:
```

```python
    print("No marks entered")
```

### 6. pass as a placeholder while designing

```python
def send_email(to, subject, body):
    pass          # will be written in the next sprint

def send_whatsapp(to, message):
    pass          # not started yet

class ReportGenerator:
    pass          # class planned, not yet designed

print("Program still runs without errors")
```

**Output:**

```text
Program still runs without errors
```
