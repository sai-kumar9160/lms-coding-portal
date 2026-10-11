> **In simple words:**  A string is **text** — any sequence of characters written inside quotes.

Strings are ordered, so every character has a position you can reach with indexing and slicing, and they are immutable, so every "change" actually produces a new string. Python ships with dozens of ready-made string methods for cleaning, searching, splitting and formatting text, which is why so much real-world work — validating forms, parsing files, building reports — is really string work.

## Creating Strings

```python
a = 'single quotes'
b = "double quotes"
c = """A triple-quoted string
spans multiple lines."""
d = "He said \"hello\""       # escaping a quote
e = 'He said "hello"'          # easier: use the other quote type
path = r"C:\Users\new_folder"  # r = raw string, backslash stays literal
```

## Indexing and Slicing

Strings are **sequences**, so every character has a position. Forward indexing starts at 0; backward indexing starts at -1. Slicing syntax is `s[start : stop : step]` where **stop is excluded**.

```python
s = "PYTHON"
#    0 1 2 3 4 5
#   -6-5-4-3-2-1

print(s[0])       # P
print(s[-1])      # N
print(s[1:4])     # YTH      (index 1,2,3 -- 4 is excluded)
print(s[:3])      # PYT      (from start)
print(s[3:])      # HON      (to the end)
print(s[::2])     # PTO      (every 2nd character)
print(s[::-1])    # NOHTYP   (reverse -- famous trick)
```

## Common String Methods

| Method | What it does | Example → Result |
| --- | --- | --- |
| `upper()' / 'lower()` | change case | "ravi".upper()` → 'RAVI' |
| `title()` | Capitalise Each Word | "ravi kumar".title()` → 'Ravi Kumar' |
| `strip()` | remove leading/trailing spaces | "  hi  ".strip()` → 'hi' |
| `replace(a,b)` | replace all occurrences | "a-b".replace("-","_")` → 'a_b' |
| `split(sep)` | string → list | "a,b,c".split(",")` → ['a','b','c'] |
| `join(list)` | list → string | "-".join(['a','b'])` → 'a-b' |
| `find(x)` | index of x, -1 if absent | "python".find("th")` → 2 |
| `count(x)` | how many times | "banana".count("a")` → 3 |
| `startswith(x)` | True/False | "report.pdf".endswith(".pdf")` → True |
| `isdigit()` | all characters digits? | "123".isdigit()` → True |
| `isalpha()` | all characters letters? | "abc".isalpha()` → True |

```python
len(s)
```

length (built-in function) len("python")` → 6

## Strings Are Immutable

```python
s = "hello"
# s[0] = "H"          # TypeError: 'str' object does not support item assignment
s = "H" + s[1:]       # correct way -- build a new string
print(s)              # Hello
```

#### Real-Time Example — Validating and Cleaning User Registration Data

**Program: validate_user.py**

```python
def clean_and_validate(raw_name, raw_email, raw_phone):
    name  = raw_name.strip().title()
    email = raw_email.strip().lower()
    phone = raw_phone.strip().replace(" ", "").replace("-", "")

    errors = []
    if len(name) < 3:
        errors.append("Name too short")
    if "@" not in email or not email.endswith((".com", ".in", ".org")):
        errors.append("Invalid email")
    if not phone.isdigit() or len(phone) != 10:
        errors.append("Phone must be 10 digits")

    return name, email, phone, errors

n, e, p, errs = clean_and_validate("  ravi KUMAR ", " RAVI@Gmail.COM ", "98765-43210")
print(n, "|", e, "|", p)
print("Errors:", errs if errs else "None")
```

**Output:**

```text
Ravi Kumar | ravi@gmail.com | 9876543210
Errors: None
```

This is exactly what runs behind every sign-up form: strip the accidental spaces, normalise the case so `RAVI@Gmail.com` and `ravi@gmail.com` are treated as the same user, and strip formatting characters from the phone number before saving.

## More Practice — Handy String Programs

### 1. Check if a word is a palindrome

```python
word = "madam"
clean = word.lower().replace(" ", "")

print(word, "is", "a palindrome" if clean == clean[::-1] else "not a palindrome")
```

**Output:**

```text
madam is a palindrome
```

### 2. Count vowels, consonants and spaces

```python
text = "Python is very easy"

vowels = consonants = spaces = 0

for ch in text.lower():
    if ch == " ":
```

```python
        spaces += 1
    elif ch in "aeiou":
        vowels += 1
    elif ch.isalpha():
        consonants += 1

print(f"Vowels: {vowels}, Consonants: {consonants}, Spaces: {spaces}")
```

**Output:**

```text
Vowels: 6, Consonants: 11, Spaces: 3
```

### 3. Get initials from a full name

```python
full_name = "ravi kumar sharma"

initials = ".".join(part[0].upper() for part in full_name.split())
print(initials + ".")                     # R.K.S.
print(full_name.title())                  # Ravi Kumar Sharma
```

**Output:**

```text
R.K.S.
Ravi Kumar Sharma
```

### 4. Mask a credit card number

```python
card = "4532789612345678"

masked = "*" * (len(card) - 4) + card[-4:]
pretty = " ".join(masked[i:i + 4] for i in range(0, len(masked), 4))

print(pretty)
```

**Output:**

```text
**** **** **** 5678
```

### 5. Count words and characters

```python
sentence = "Learning Python is fun and useful"

print("Characters (with spaces)   :", len(sentence))
print("Characters (without spaces):", len(sentence.replace(" ", "")))
print("Words                      :", len(sentence.split()))
print("Longest word               :", max(sentence.split(), key=len))
```

**Output:**

```text
Characters (with spaces)   : 33
Characters (without spaces): 28
Words                      : 6
Longest word               : Learning
```

### 6. Remove duplicate characters, keep order

```python
s = "programming"
seen = ""

for ch in s:
    if ch not in seen:
        seen += ch

print(seen)               # progamin
```

### 7. Capitalise every word except small ones (title of a book)

```python
title = "the art of computer programming"
```

```python
small = {"of", "the", "a", "an", "in", "on", "and"}

words = title.split()
result = [words[0].capitalize()] + [
    w if w in small else w.capitalize() for w in words[1:]
]
print(" ".join(result))
```

**Output:**

```text
The Art of Computer Programming
```

### 8. Check password strength

```python
pwd = "Python@123"

has_upper  = any(c.isupper() for c in pwd)
has_lower  = any(c.islower() for c in pwd)
has_digit  = any(c.isdigit() for c in pwd)
has_symbol = any(not c.isalnum() for c in pwd)
long_enough = len(pwd) >= 8

score = sum([has_upper, has_lower, has_digit, has_symbol, long_enough])
levels = {5: "Very strong", 4: "Strong", 3: "Medium", 2: "Weak", 1: "Very weak", 0: "Very
weak"}

print(f"Password strength: {levels[score]} ({score}/5)")
```

**Output:**

```text
Password strength: Very strong (5/5)
```
