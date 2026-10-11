> **In simple words:**  This is a **fast recap of the whole book plus the questions interviewers actually ask**.

Use the syntax page as a cheat sheet while you practise, and answer each interview question out loud before reading the answer. If an answer surprises you, go back to that chapter — the gap you find now is far cheaper than the one you find in an interview.

## One-Page Syntax Recap

```python
# --- basics ---
x = 10                              # variable
print(f"{x:.2f}")                   # f-string
x = int(input("Enter: "))           # input + cast

# --- collections ---
lst  = [1, 2, 3]                    # list   -- ordered, mutable
tup  = (1, 2, 3)                    # tuple  -- ordered, immutable
st   = {1, 2, 3}                    # set    -- unique, unordered
dct  = {"a": 1}                     # dict   -- key/value

# --- control flow ---
if x > 5: pass
elif x == 5: pass
else: pass

for i in range(5): pass
while x > 0: x -= 1

# --- comprehension ---
squares = [n*n for n in range(5) if n % 2 == 0]

# --- function ---
def f(a, b=1, *args, **kwargs):
    return a + b

# --- exception ---
try: risky()
except ValueError as e: print(e)
else: print("ok")
finally: cleanup()

# --- file ---
with open("f.txt") as fh:
    for line in fh: print(line.strip())

# --- class ---
class Child(Parent):
    def __init__(self, x):
        super().__init__()
        self.__x = x                # private
    @property
    def x(self): return self.__x
    def method(self): pass
    @classmethod
    def cm(cls): pass
    @staticmethod
    def sm(): pass
```

## Frequently Asked Interview Questions

**Q1.  What is the difference between a list and a tuple?** A list is mutable and written with `[]`; a tuple is immutable and written with `()`. Tuples are faster, use less memory, and can be dictionary keys because they are hashable.

**Q2.  Difference between `is` and `==`?** `==` compares values; `is` compares memory identity. Two lists with the same contents are `==` but not `is`. Use `is` only with `None`, `True`, `False`.

**Q3.  What does `self` do?** It is a reference to the current object, passed automatically as the first argument to every instance method, so the method knows which object's data to use.

**Q4.  Difference between `__str__` and `__repr__`?** `__str__` is the friendly text shown by `print()`; `__repr__` is the unambiguous developer text shown in the REPL and debugger. If only one is defined, define `__repr__`.

**Q5.  What is the difference between `@classmethod` and `@staticmethod`?** A class method receives `cls` and can access/modify class state — often used as an alternate constructor. A static method receives nothing automatically; it is just a utility function grouped inside the class.

**Q6.  Explain encapsulation vs abstraction.** Encapsulation hides **data** and controls access to it (private attributes + properties). Abstraction hides **implementation** and exposes only what an object does (abstract base classes).

**Q7.  What is method overriding?** A child class defines a method with the same name as the parent's, replacing the parent's behaviour for objects of that child class. This is how runtime polymorphism works in Python.

**Q8.  Does Python support method overloading?** Not in the Java sense — a second definition simply replaces the first. The same effect is achieved with default arguments, `*args`/`**kwargs`, or `functools.singledispatch`.

**Q9.  What is the MRO?** Method Resolution Order — the sequence Python searches classes when resolving an attribute in multiple inheritance. Inspect it with `ClassName.__mro__`. It uses the C3 linearisation algorithm.

**Q10.  What does `super()` do?** It returns a proxy to the parent class in the MRO, letting the child call the parent's implementation — most commonly `super().__init__(...)`.

**Q11.  Why use `with open(...)` instead of `open()`?** The `with` block is a context manager: it guarantees the file is closed even if an exception is raised inside the block.

**Q12.  What is the difference between `break` and `continue`?** `break` exits the loop entirely; `continue` skips the rest of the current iteration and moves to the next one.

**Q13.  What is a lambda and when should you avoid it?** A one-expression anonymous function, mainly used as an argument to `sorted`, `map` or `filter`. Avoid it when the logic needs more than one expression or a docstring — use `def` instead.

**Q14.  What are `\*args` and `\*\*kwargs`?** `*args` collects extra positional arguments into a tuple; `**kwargs` collects extra keyword arguments into a dictionary. They let a function accept any number of arguments.

**Q15.  What is the mutable default argument problem?** A default like `def f(x, lst=[])` creates the list once at definition time, so it is shared across all calls. Use `lst=None` and create the list inside the function.

**Q16.  What is duck typing?** Python cares about whether an object has the required method, not about its class. "If it has `.generate()`, it can be used as a report."

## What to Learn Next

- **Iterators & Generators** — `yield`, lazy evaluation for large data.
- **Decorators** — wrap a function to add logging, timing, authentication.
- **Context managers** — write your own `with` blocks using `__enter__`/`__exit__`.
- **Regular expressions** — the `re` module for pattern matching.
- **Databases** — `sqlite3`, then SQLAlchemy ORM (uses everything from OOP).
- **Web frameworks** — Flask or Django to build real APIs.
- **Testing** — `unittest` and `pytest`; write tests for the payroll project above.
- **Data libraries** — NumPy and Pandas for analysis work.

> **Final advice:**  Concepts become skill only through typing. Take the capstone payroll project, delete the  `Developer` class, and rewrite it from scratch without looking. Then add a new `Contractor` class that is paid per hour. If you can do that, you have genuinely learned OOP.
