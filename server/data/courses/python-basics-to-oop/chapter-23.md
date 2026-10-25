> **In simple words:**  OOP is a way of programming where you **bundle data and the actions that work on that**  **data into a single unit called an object**.

A class is the blueprint and an object is a real thing built from it, so one `Employee` class can produce a thousand employee objects, each with its own name and salary. OOP rests on four pillars — encapsulation, inheritance, polymorphism and abstraction — and every serious Python framework, from Django to PyTorch, is designed around them.

## Why OOP?

Everything so far has been **procedural**: data in variables, behaviour in functions, kept separate. As a program grows, keeping them separate becomes painful — you end up passing the same five variables into every function. **OOP bundles the data and the behaviour that acts on that data into a single unit called an object.**

```python
# Procedural -- data and behaviour are separate
emp_name, emp_salary = "Ravi", 45000
def give_hike(salary, percent):
    return salary + salary * percent / 100
emp_salary = give_hike(emp_salary, 10)

# Object-oriented -- they live together
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
    def give_hike(self, percent):
        self.salary += self.salary * percent / 100

e = Employee("Ravi", 45000)
e.give_hike(10)
```

![Flow Chart 11 — the four pillars of OOP](asset:chapter-23-figure-1.png)

*Flow Chart 11 — the four pillars of OOP*

## 23.1  Class and Object

> **In simple words:**  A **class** is a blueprint that describes what data an object will hold and what it can do. An  **object** is one real, working thing built from that blueprint.

Think of the class as an architect's plan for a house and each object as an actual house built from that plan. The plan is drawn once; you can build a hundred houses from it, and each house has its own address, its own owner and its own colour — but they all share the same layout.

### Class — the Definition

A class is written with the `class` keyword. It contains **attributes** (the data — the variables an object will hold) and **methods** (the actions — the functions an object can perform). By itself a class occupies no memory for data; it is only a description. Nothing actually exists until you create an object from it.

### Object — the Definition

An object, also called an **instance**, is created by calling the class like a function: `e1 = Employee("Ravi",` `101, 45000)`. At that moment Python allocates memory, runs `__init__` to fill in the data, and hands you back a real thing you can work with. Each object carries **its own copy** of the instance attributes, so changing `e1` never affects `e2`.

|  | Class | Object |
| --- | --- | --- |
| What it is | a blueprint / template | a real instance built from it |
| How many | written once | as many as you need |
| Memory | no memory for instance data | its own memory for its own data |
| Created by | `class Employee:` | `e1 = Employee(...)` |
| Example | the design of a car model | the specific car standing in your garage |

A **class** is a blueprint — it describes what data an object will hold and what it can do. An **object** (or instance) is a real thing built from that blueprint. One class, many objects. Think of the class as an architect's plan and each object as an actual house built from it: same design, different address and owner.

![Flow Chart 12 — from class definition to a working object](asset:chapter-23-figure-2.png)

*Flow Chart 12 — from class definition to a working object*

```python
class Employee:
    company = "TechCorp"                  # CLASS attribute -- shared by all objects

    def __init__(self, name, emp_id, salary):     # constructor
        self.name = name                  # INSTANCE attributes -- unique per object
        self.emp_id = emp_id
        self.salary = salary

    def show(self):                       # instance method
        return f"{self.emp_id} | {self.name} | Rs.{self.salary:,}"

e1 = Employee("Ravi Kumar", 101, 45000)   # object 1
e2 = Employee("Anu Reddy",  102, 62000)   # object 2

print(e1.show())
print(e2.show())
print(e1.company, e2.company)             # both share the class attribute
```

**Output:**

```text
101 | Ravi Kumar | Rs.45,000
102 | Anu Reddy | Rs.62,000
TechCorp TechCorp
```

### What is `self`?

`self` is the **object itself**, passed automatically as the first argument to every instance method. When you write `e1.show()`, Python actually calls `Employee.show(e1)`. That is how `self.name` knows to give \*Ravi\* and not \*Anu\*. The name `self` is a convention, not a keyword — but never rename it.

### Class attribute vs Instance attribute

|  | Class attribute | Instance attribute |
| --- | --- | --- |
| Defined | directly inside the class body | inside `__init__` using `self. |
| Shared | one copy shared by all objects | separate copy per object |
| Access | `Employee.company' or 'e1.company` | e1.name` only |
| Use for | constants, counters, defaults | data unique to each object |

## 23.2  The `__init__` Constructor

```python
class BankAccount:
    total_accounts = 0                    # class-level counter

    def __init__(self, holder, balance=0):        # default parameter
        self.holder = holder
        self.balance = balance
        self.transactions = []                    # each object gets its OWN list
        BankAccount.total_accounts += 1           # update the shared counter

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        self.balance += amount
        self.transactions.append(("CREDIT", amount))
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount
        self.transactions.append(("DEBIT", amount))
        return self.balance

    def statement(self):
        lines = [f"Statement for {self.holder}"]
        for kind, amt in self.transactions:
            lines.append(f"  {kind:<7} Rs.{amt:>10,.2f}")
        lines.append(f"  {'BALANCE':<7} Rs.{self.balance:>10,.2f}")
        return "\n".join(lines)

acc = BankAccount("Ravi Kumar", 10000)
acc.deposit(5000)
acc.withdraw(2500)
print(acc.statement())
print("Accounts created:", BankAccount.total_accounts)
```

**Output:**

```text
Statement for Ravi Kumar
  CREDIT  Rs.  5,000.00
  DEBIT   Rs.  2,500.00
  BALANCE Rs. 12,500.00
Accounts created: 1
```

## 23.3  Types of Methods

| Type | Decorator | First parameter | Can access |
| --- | --- | --- | --- |
| Instance method | none `@classmethod` | `self` `cls` | instance + class data |
| Class method |  |  | class data only |

```python
@staticmethod
```

Static method none nothing automatically

```python
class Employee:
    company = "TechCorp"
    count = 0

    def __init__(self, name, salary):
        self.name, self.salary = name, salary
        Employee.count += 1

    def annual_salary(self):                   # INSTANCE method
        return self.salary * 12

    @classmethod
    def from_string(cls, record):              # CLASS method -- alternate constructor
        name, salary = record.split("-")
        return cls(name, int(salary))

    @classmethod
    def employee_count(cls):
        return cls.count

    @staticmethod
    def is_valid_salary(amount):               # STATIC method -- pure utility
        return isinstance(amount, (int, float)) and amount > 0

e1 = Employee("Ravi", 45000)
e2 = Employee.from_string("Anu-62000")         # created from a string!

print(e1.annual_salary())            # 540000
print(e2.name, e2.salary)            # Anu 62000
print(Employee.employee_count())     # 2
print(Employee.is_valid_salary(-5))  # False
```

## 23.4  Encapsulation

> **In simple words:Encapsulation** means keeping an object's data **private** and letting the outside world touch  it only through the object's own methods.

The word literally means "putting something in a capsule". The data and the methods that work on it are wrapped together in one unit, and a protective wall is placed around the data. Nobody outside the class can reach in and change a value directly — they must go through a method, and that method can validate, log or reject the change.

Real-world picture: a bank account. You can never open the bank's database and type a new balance for yourself. You must use a **deposit** or **withdraw** counter, and the bank checks every request before it changes anything. The balance is the private data; deposit and withdraw are the public methods.

![Flow Chart 13 — encapsulation in a bank account: the only way in is a method](asset:chapter-23-figure-3.png)

*Flow Chart 13 — encapsulation in a bank account: the only way in is a method*

### How Python Marks Data as Private

Python signals the level of protection through the **name** of the attribute. There is no `private` keyword; the convention is built into the naming itself.

| Notation | Name | Meaning |
| --- | --- | --- |
| `self.balance` | public | anyone can read and change it |
| `self._balance` | protected (convention) | "internal — please do not touch" |
| `self.__balance` | private (name mangling) | renamed to `_ClassName__balance |

```python
class BankAccount:
    def __init__(self, holder, balance):
        self.holder = holder            # public
        self.__balance = balance        # PRIVATE -- cannot be touched directly

    # ---- controlled read access ----
    def get_balance(self):
        return self.__balance

    # ---- controlled write access, with validation ----
    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        self.__balance += amount

acc = BankAccount("Ravi", 10000)

print(acc.get_balance())        # 10000  -- allowed
# print(acc.__balance)          # AttributeError -- blocked
# acc.__balance = 99999999      # creates a NEW unrelated attribute, balance is safe
```

```python
acc.deposit(5000)
print(acc.get_balance())        # 15000
```

### Properties — the Pythonic Getter/Setter

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self._price = price

    @property
    def price(self):                     # read: product.price
        return self._price

    @price.setter
    def price(self, value):              # write: product.price = 900
        if value < 0:
            raise ValueError("Price cannot be negative")
        self._price = value

    @property
    def price_with_gst(self):            # computed, read-only
        return round(self._price * 1.18, 2)

p = Product("Mouse", 799)
print(p.price)              # 799        -- looks like an attribute
p.price = 899               # goes through the validator
print(p.price_with_gst)     # 1060.82
# p.price = -100            # ValueError: Price cannot be negative
```

> **Why encapsulation matters:**  In a banking system, if `balance` were public, any line of code anywhere could set it  to a negative number and no audit trail would exist. Forcing every change through `deposit()` and `withdraw()` means validation and logging can never be bypassed.

## 23.5  Inheritance

> **In simple words:Inheritance** lets a new class **reuse everything from an existing class** and then add or  change whatever it needs.

The existing class is called the **parent** (or base, or super) class and the new one is the **child** (or derived, or sub) class. The child automatically gets every attribute and method the parent has, so the shared code is written exactly once. It models an **"is-a"** relationship: a Manager \*is an\* Employee, a Car \*is a\* Vehicle.

Real-world picture: every vehicle has a brand, a price, and can start and stop. A car adds doors and a music system; a bike adds gears; a truck adds a load capacity. Nobody re-writes "has a brand" three times — it is written once in Vehicle and inherited by all three.

![Flow Chart 14 — inheritance: common code written once in the parent](asset:chapter-23-figure-4.png)

*Flow Chart 14 — inheritance: common code written once in the parent*

Inheritance lets a **child class reuse everything from a parent class** and then add or change behaviour. It models an **is-a** relationship: a Manager \*is an\* Employee. The benefit is zero duplication — common code lives in one place.

![Flow Chart 15 — inheritance hierarchy in a payroll system](asset:chapter-23-figure-5.png)

*Flow Chart 15 — inheritance hierarchy in a payroll system*

### Types of Inheritance

| Type | Structure | Example |
| --- | --- | --- |
| Single | one parent → one child | `Manager(Employee)` `Employee → Manager → Director` |
| Multilevel | grandparent → parent → child | `Manager', 'Developer', 'Intern` |
| Hierarchical | one parent → many children | `TeamLead(Manager, Developer)` |
| Multiple | many parents → one child |  |
| Hybrid | combination of the above | large frameworks |

Python supports five arrangements of parents and children. Each one has its own diagram and example below.

### Type 1 — Single Inheritance

> **In simple words:One parent, one child.** The simplest form: a single class extends a single base class.

![Flow Chart 16 — single inheritance](asset:chapter-23-figure-6.png)

*Flow Chart 16 — single inheritance*

```python
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def pay(self):
        return self.salary

class Manager(Employee):                 # ONE parent
    def __init__(self, name, salary, team_size):
        super().__init__(name, salary)   # reuse the parent's setup
        self.team_size = team_size

    def pay(self):                       # override
        return self.salary + self.team_size * 2500

m = Manager("Meera", 90000, 6)
print(m.name, "earns Rs.", m.pay())      # 'name' came free from Employee
```

**Output:**

```text
Meera earns Rs. 105000
```

### Type 2 — Multilevel Inheritance

> **In simple words:A chain of generations.** A child becomes the parent of another child, so features flow  down through several levels.

![Flow Chart 17 — multilevel inheritance](asset:chapter-23-figure-7.png)

*Flow Chart 17 — multilevel inheritance*

```python
class Employee:
    def __init__(self, name):
        self.name = name
    def role(self):
        return "Employee"

class Manager(Employee):                 # level 2
    def role(self):
        return "Manager"
    def approve_leave(self):
        return f"{self.name} approved the leave request"

class Director(Manager):                 # level 3 -- inherits from BOTH
    def role(self):
        return "Director"
    def approve_budget(self):
        return f"{self.name} approved the budget"

d = Director("Meera")
print(d.name)                # from Employee   (grandparent)
print(d.approve_leave())     # from Manager    (parent)
print(d.approve_budget())    # its own
print(d.role())              # its own version wins
print(Director.__mro__[:4])  # the search order Python follows
```

**Output:**

```text
Meera
Meera approved the leave request
```

```python
         Meera approved the budget
         Director
         (<class 'Director'>, <class 'Manager'>, <class 'Employee'>, <class 'object'>)
```

### Type 3 — Hierarchical Inheritance

> **In simple words:One parent, many children.** Several classes extend the same base class, becoming siblings  that share the parent's code but not each other's.

![Flow Chart 18 — hierarchical inheritance](asset:chapter-23-figure-8.png)

*Flow Chart 18 — hierarchical inheritance*

```python
class Employee:
    def __init__(self, name, salary):
        self.name, self.salary = name, salary
    def pay(self):
        return self.salary

class Manager(Employee):
    def pay(self):
        return self.salary + 15000

class Developer(Employee):
    def pay(self):
        return self.salary + 8000

class Intern(Employee):
    def pay(self):
        return self.salary * 0.4

staff = [Manager("Meera", 90000), Developer("Ravi", 60000), Intern("Sunil", 20000)]

for person in staff:
    print(f"{person.name:<8} {type(person).__name__:<10} Rs.{person.pay():>10,.2f}")
```

**Output:**

```text
Meera    Manager    Rs.105,000.00
Ravi     Developer  Rs. 68,000.00
Sunil    Intern     Rs.  8,000.00
```

### Type 4 — Multiple Inheritance

> **In simple words:One child, many parents.** A single class inherits from two or more independent base  classes and gets the features of all of them.

![Flow Chart 19 — multiple inheritance](asset:chapter-23-figure-9.png)

*Flow Chart 19 — multiple inheritance*

```python
class Manager:
    def bonus(self):
        return "Manager bonus: Rs.15,000"
    def describe(self):
        return "I manage people"

class Developer:
    def code(self):
        return "Writing Python code"
    def describe(self):
        return "I write software"

class TeamLead(Manager, Developer):      # TWO parents
    pass

tl = TeamLead()
print(tl.bonus())          # from Manager
print(tl.code())           # from Developer
print(tl.describe())       # BOTH have it -- Manager wins (listed first)
print([c.__name__ for c in TeamLead.__mro__])
```

**Output:**

```text
Manager bonus: Rs.15,000
Writing Python code
I manage people
['TeamLead', 'Manager', 'Developer', 'object']
```

> **The MRO decides ties:**  When two parents define the same method, Python follows the \*\*Method Resolution  Order\*\* — left to right in the class definition. `TeamLead(Manager, Developer)` means Manager is checked

first. Swap the order and `describe()` gives a different answer.

### Type 5 — Hybrid Inheritance

> **In simple words:A mix of two or more of the above types** in one class diagram — for example hierarchical  at the top and multiple at the bottom.

![Flow Chart 20 — hybrid inheritance](asset:chapter-23-figure-10.png)

*Flow Chart 20 — hybrid inheritance*

```python
class Employee:                          # common base
    def __init__(self, name):
        self.name = name
    def details(self):
        return f"Employee: {self.name}"

class Manager(Employee):                 # hierarchical branch 1
    def bonus(self):
        return 15000

class Developer(Employee):               # hierarchical branch 2
    def code(self):
        return "def main(): ..."

class TeamLead(Manager, Developer):      # multiple inheritance joins them
    def details(self):
        return f"Team Lead: {self.name} (manages AND codes)"

tl = TeamLead("Ravi")
print(tl.details())
print("Bonus:", tl.bonus())
print("Codes:", tl.code())
```

```python
print([c.__name__ for c in TeamLead.__mro__])
```

**Output:**

```text
Team Lead: Ravi (manages AND codes)
Bonus: 15000
Codes: def main(): ...
['TeamLead', 'Manager', 'Developer', 'Employee', 'object']
```

Notice that `Employee` appears **only once** in the MRO even though both parents inherit from it. Python's C3 linearisation algorithm works this out automatically, which is why the classic "diamond problem" from C++ does not bite you here.

### All Five at a Glance

| Type | Parents : Children | Written as |
| --- | --- | --- |
| Single | 1 : 1 | `class B(A):` |
| Multilevel | chain | `class B(A):' then 'class C(B):` `class B(A):', 'class C(A):', 'class D(A):` |
| Hierarchical | 1 : many | `class D(B, C):` |
| Multiple | many : 1 |  |
| Hybrid | a combination | class D(B, C):` where B, C both extend A |

> **Use inheritance carefully:**  Ask "is a Manager an Employee?" — yes, so inherit. Multiple and hybrid inheritance  are powerful but can become hard to follow; in day-to-day code, single and hierarchical inheritance cover almost everything, and composition (Section 23.8) covers the rest.

**Program: payroll_inheritance.py**

```python
class Employee:                                   # PARENT / BASE class
    def __init__(self, name, emp_id, base_salary):
        self.name = name
        self.emp_id = emp_id
        self.base_salary = base_salary

    def pay(self):
        return self.base_salary

    def show(self):
        return f"{self.emp_id} | {self.name:<12} | {self.role():<10} |
Rs.{self.pay():>10,.2f}"

    def role(self):
        return "Employee"

class Manager(Employee):                          # CHILD class
    def __init__(self, name, emp_id, base_salary, team_size):
        super().__init__(name, emp_id, base_salary)   # reuse parent's __init__
        self.team_size = team_size                     # add something new

    def pay(self):                                # OVERRIDE the parent method
        allowance = self.team_size * 2000
        return self.base_salary + allowance

    def role(self):
        return "Manager"

class Developer(Employee):
    def __init__(self, name, emp_id, base_salary, tech_stack):
```

```python
        super().__init__(name, emp_id, base_salary)
        self.tech_stack = tech_stack

    def pay(self):
        bonus = 8000 if "Python" in self.tech_stack else 3000
        return self.base_salary + bonus

    def role(self):
        return "Developer"

class Intern(Employee):
    def pay(self):
        return self.base_salary * 0.4             # stipend only

    def role(self):
        return "Intern"

staff = [
    Manager("Meera Nair", 201, 90000, team_size=6),
    Developer("Ravi Kumar", 202, 60000, tech_stack=["Python", "SQL"]),
    Developer("Kiran S", 203, 55000, tech_stack=["Java"]),
    Intern("Sunil P", 204, 20000),
]

for member in staff:
    print(member.show())
```

**Output:**

```text
201 | Meera Nair   | Manager    | Rs.102,000.00
202 | Ravi Kumar   | Developer  | Rs. 68,000.00
203 | Kiran S      | Developer  | Rs. 58,000.00
204 | Sunil P      | Intern     | Rs.  8,000.00
```

### `super()` — Calling the Parent

`super()` gives you access to the parent class. Its most common use is inside `__init__` so the parent can set up the attributes it owns, leaving the child to add only its own.

### Useful Built-ins

```python
m = Manager("Meera", 201, 90000, 6)

print(isinstance(m, Manager))     # True
print(isinstance(m, Employee))    # True  -- a Manager IS an Employee
print(issubclass(Manager, Employee))   # True
print(Manager.__mro__)            # method resolution order
```

## 23.6  Polymorphism

> **In simple words:Polymorphism** means the **same method name behaves differently** depending on which  object it is called on.

The word means "many forms". You call `shape.area()` or `channel.send()` and each object runs its own version of that method. The calling code does not need to know — and does not care — which class the object belongs to, so it needs no `if` statements to tell them apart.

Real-world picture: a notification service. Your order-shipped message goes out by e-mail, SMS and a phone push alert. Your code loops over the channels and calls `send()` once. Each channel does something

completely different internally, yet the loop stays one line long — and adding WhatsApp tomorrow does not change that loop at all.

![Flow Chart 21 — polymorphism: one call, three different behaviours](asset:chapter-23-figure-11.png)

*Flow Chart 21 — polymorphism: one call, three different behaviours*

Polymorphism means **"many forms"** — the same method name behaves differently depending on the object. In the payroll example above, `member.pay()` was called on every object in the list, and each class ran its own version. The loop did not need a single `if` statement to check the type.

### Method Overriding — Runtime Polymorphism

```python
class Notification:
    def send(self, message):
        raise NotImplementedError("Subclass must implement send()")

class EmailNotification(Notification):
    def send(self, message):
        return f"[EMAIL] Subject: Alert | Body: {message}"

class SMSNotification(Notification):
    def send(self, message):
        return f"[SMS] {message[:40]}..."

class PushNotification(Notification):
    def send(self, message):
        return f"[PUSH] {message}  (tap to open app)"

# The SAME loop handles every channel -- add WhatsApp tomorrow, this code never changes
channels = [EmailNotification(), SMSNotification(), PushNotification()]

for channel in channels:
    print(channel.send("Your order ORD1001 has been shipped and will arrive tomorrow"))
```

**Output:**

```text
[EMAIL] Subject: Alert | Body: Your order ORD1001 has been shipped and will arrive
tomorrow
```

```python
         [SMS] Your order ORD1001 has been shipped an...
         [PUSH] Your order ORD1001 has been shipped and will arrive tomorrow  (tap to open
app)
```

### Duck Typing — "If it walks like a duck..."

Python does not require a common parent class. If an object has the method you need, it works. This is why polymorphism in Python is more flexible than in Java or C#.

```python
class PDFReport:
    def generate(self): return "Generating PDF..."

class ExcelReport:
    def generate(self): return "Generating Excel..."

class CSVExport:                      # NOT related to the other two at all
    def generate(self): return "Generating CSV..."

for report in [PDFReport(), ExcelReport(), CSVExport()]:
    print(report.generate())          # works -- all three have generate()
```

### Operator Overloading — Dunder Methods

```python
class Money:
    def __init__(self, amount, currency="INR"):
        self.amount = amount
        self.currency = currency

    def __str__(self):                     # what print() shows
        return f"{self.currency} {self.amount:,.2f}"

    def __repr__(self):                    # what the debugger/REPL shows
        return f"Money({self.amount}, '{self.currency}')"

    def __add__(self, other):              # enables  a + b
        if self.currency != other.currency:
            raise ValueError("Currency mismatch")
        return Money(self.amount + other.amount, self.currency)

    def __sub__(self, other):              # enables  a - b
        return Money(self.amount - other.amount, self.currency)

    def __eq__(self, other):               # enables  a == b
        return self.amount == other.amount and self.currency == other.currency

    def __lt__(self, other):               # enables  a < b  and sorting
        return self.amount < other.amount

    def __len__(self):                     # enables  len(a)
        return len(str(int(self.amount)))

salary = Money(45000)
bonus  = Money(8000)

print(salary + bonus)                      # INR 53,000.00
print(salary > bonus)                      # True
print(sorted([Money(300), Money(100), Money(200)]))
```

**Output:**

```text
INR 53,000.00
True
[Money(100, 'INR'), Money(200, 'INR'), Money(300, 'INR')]
```

### Common Dunder Methods

| Method | Triggered by | Purpose |
| --- | --- | --- |
| `__init__` | `Obj()` | constructor |
| `__str__` | `print(obj)', 'str(obj)` | friendly text for users |
| `__repr__` | REPL, `repr(obj) | unambiguous text for developers |
| `__len__` | `len(obj)` | size |
| `__add__' / '__sub__` | `a + b' / 'a - b` | arithmetic |
| `__eq__' / '__lt__` | `a == b' / 'a < b` | comparison and sorting |
| `__getitem__` | `obj[key]` | indexing |
| `__call__` | `obj()` | make the object callable |
| `__enter__' / '__exit__` | `with obj:` | context manager |

## 23.7  Abstraction

> **In simple words:Abstraction** means showing **what** an object can do while hiding **how** it actually does it.

You expose a small, simple set of operations and keep all the complicated machinery out of sight. The user of your class gets a clean interface; the messy details stay inside where they can be changed later without breaking anyone's code.

Real-world picture: withdrawing cash at an ATM. You press one button. Behind that button the machine verifies your PIN with the bank, checks your balance and daily limit, updates the core ledger, counts the notes, dispenses them and prints a receipt. You see none of it — and you should not have to.

![Flow Chart 22 — abstraction: one visible button, six hidden steps](asset:chapter-23-figure-12.png)

*Flow Chart 22 — abstraction: one visible button, six hidden steps*

Abstraction means **showing what an object does while hiding how it does it**. When you call `payment.process()`, you do not care whether it talks to Razorpay or Stripe. Python implements enforced abstraction through the `abc` module: an **abstract class cannot be instantiated**, and any child that does not implement every abstract method also cannot be instantiated.

**Program: payment_gateways.py**

```python
from abc import ABC, abstractmethod

class PaymentGateway(ABC):                # ABC = Abstract Base Class

    def __init__(self, merchant_id):
        self.merchant_id = merchant_id

    @abstractmethod
    def process(self, amount):
        """Every gateway MUST implement this."""

    @abstractmethod
    def refund(self, txn_id, amount):
        """Every gateway MUST implement this."""

    def log(self, message):               # CONCRETE method -- shared by all children
        return f"[{self.__class__.__name__}] {message}"

class RazorpayGateway(PaymentGateway):
    def process(self, amount):
        return self.log(f"Charged Rs.{amount:,.2f} via UPI/Card")

    def refund(self, txn_id, amount):
        return self.log(f"Refunded Rs.{amount:,.2f} for {txn_id} in 5-7 days")

class StripeGateway(PaymentGateway):
    def process(self, amount):
        return self.log(f"Charged ${amount / 83:,.2f} in USD")

    def refund(self, txn_id, amount):
        return self.log(f"Refunded ${amount / 83:,.2f} for {txn_id} instantly")

class BrokenGateway(PaymentGateway):
    def process(self, amount):
        return "only half implemented"
    # refund() is MISSING

# gw = PaymentGateway("M1")     # TypeError: Can't instantiate abstract class
# bg = BrokenGateway("M2")      # TypeError: abstract method 'refund' not implemented

for gw in [RazorpayGateway("M1001"), StripeGateway("M1002")]:
    print(gw.process(2500))
    print(gw.refund("TXN9911", 2500))
```

**Output:**

```text
[RazorpayGateway] Charged Rs.2,500.00 via UPI/Card
[RazorpayGateway] Refunded Rs.2,500.00 for TXN9911 in 5-7 days
[StripeGateway] Charged $30.12 in USD
[StripeGateway] Refunded $30.12 for TXN9911 instantly
```

> **Abstraction vs Encapsulation:**  Encapsulation hides the \*\*data\*\* (private balance). Abstraction hides the  \*\*implementation\*\* (how the payment actually reaches the bank). Encapsulation is about protection;

abstraction is about simplification.

## 23.8  Composition — "has-a" vs "is-a"

Inheritance is not always the answer. If the relationship is **has-a** rather than **is-a**, use composition: store one object inside another. A Car \*has an\* Engine; a Car is not an Engine.

```python
class Engine:
    def __init__(self, hp):
        self.hp = hp
    def start(self):
        return f"Engine ({self.hp} hp) started"

class GPS:
    def locate(self):
        return "17.3850, 78.4867"

class Car:
    def __init__(self, model, hp):
        self.model = model
        self.engine = Engine(hp)      # Car HAS AN Engine
        self.gps = GPS()              # Car HAS A GPS

    def drive(self):
        return f"{self.model}: {self.engine.start()} | at {self.gps.locate()}"

print(Car("Nexon EV", 143).drive())
```

> **Rule of thumb:**  Ask "is a Manager an Employee?" — yes, so inherit. Ask "is a Car an Engine?" — no, a car \*has\*  one, so compose. Over-using inheritance creates fragile, deeply nested hierarchies.

## 23.9  OOP Summary Table

| Pillar | One-line meaning | Python mechanism | Real example |
| --- | --- | --- | --- |
| Encapsulation | bundle + protect data | `__private', '@property` | account balance |
| Inheritance | reuse and extend | `class Child(Parent)',` `'super()` | Manager → Employee |
| Polymorphism | one name, many behaviours | method overriding, dunders | pay()` per role |
| Abstraction | hide the how | `ABC', '@abstractmethod` | payment gateway |

## More Practice — Beginner-Friendly OOP Programs

### 1. A Student class

```python
class Student:
    def __init__(self, name, roll, marks):
        self.name = name
        self.roll = roll
        self.marks = marks              # a list of marks

    def total(self):
        return sum(self.marks)

    def average(self):
        return round(self.total() / len(self.marks), 2)
```

```python
    def grade(self):
        avg = self.average()
        if avg >= 90: return "A+"
        if avg >= 75: return "A"
        if avg >= 35: return "Pass"
        return "Fail"

    def report(self):
        return (f"{self.roll} | {self.name:<8} | Total {self.total():>3} | "
                f"Avg {self.average():>6} | Grade {self.grade()}")

students = [
    Student("Ravi",  101, [85, 92, 78]),
    Student("Anu",   102, [95, 98, 91]),
    Student("Kiran", 103, [30, 41, 28]),
]

for s in students:
    print(s.report())

topper = max(students, key=lambda s: s.average())
print("Topper:", topper.name)
```

**Output:**

```text
101 | Ravi     | Total 255 | Avg  85.0 | Grade A
102 | Anu      | Total 284 | Avg 94.67 | Grade A+
103 | Kiran    | Total  99 | Avg  33.0 | Grade Fail
Topper: Anu
```

### 2. A Calculator class

```python
class Calculator:
    def __init__(self):
        self.history = []

    def _record(self, expression, result):
        self.history.append(f"{expression} = {result}")
        return result

    def add(self, a, b):      return self._record(f"{a} + {b}", a + b)
    def subtract(self, a, b): return self._record(f"{a} - {b}", a - b)
    def multiply(self, a, b): return self._record(f"{a} * {b}", a * b)
    def divide(self, a, b):
        if b == 0:
            return "Cannot divide by zero"
        return self._record(f"{a} / {b}", round(a / b, 2))

    def show_history(self):
        for line in self.history:
            print("  ", line)

c = Calculator()
c.add(10, 5)
c.multiply(4, 7)
c.divide(22, 7)
print("History:")
c.show_history()
```

**Output:**

```text
History:
10 + 5 = 15
```

```python
            4 * 7 = 28
            22 / 7 = 3.14
```

### 3. The classic Animal example (inheritance + polymorphism)

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "Some sound"

    def introduce(self):
        return f"I am {self.name} and I say {self.speak()}"

class Dog(Animal):
    def speak(self):
        return "Woof!"

class Cat(Animal):
    def speak(self):
        return "Meow!"

class Cow(Animal):
    def speak(self):
        return "Moo!"

for animal in [Dog("Tommy"), Cat("Kitty"), Cow("Lakshmi")]:
    print(animal.introduce())
```

**Output:**

```text
I am Tommy and I say Woof!
I am Kitty and I say Meow!
I am Lakshmi and I say Moo!
```

### 4. A Library book issue/return system

```python
class Book:
    def __init__(self, title, author, copies):
        self.title = title
        self.author = author
        self.copies = copies
        self.issued_to = []

    def issue(self, member):
        if self.copies == 0:
            return f"'{self.title}' is not available"
        self.copies -= 1
        self.issued_to.append(member)
        return f"'{self.title}' issued to {member}"

    def give_back(self, member):
        if member not in self.issued_to:
            return f"{member} does not have this book"
        self.copies += 1
        self.issued_to.remove(member)
        return f"'{self.title}' returned by {member}"

    def __str__(self):
        return f"{self.title} by {self.author} ({self.copies} available)"

b = Book("Let Us Python", "Y. Kanetkar", 2)
```

```python
print(b)
print(b.issue("Ravi"))
print(b.issue("Anu"))
print(b.issue("Kiran"))
print(b.give_back("Ravi"))
print(b)
```

**Output:**

```text
Let Us Python by Y. Kanetkar (2 available)
'Let Us Python' issued to Ravi
'Let Us Python' issued to Anu
'Let Us Python' is not available
'Let Us Python' returned by Ravi
Let Us Python by Y. Kanetkar (1 available)
```

### 5. A Rectangle class with properties

```python
class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    @property
    def area(self):
        return self.length * self.width

    @property
    def perimeter(self):
        return 2 * (self.length + self.width)

    @property
    def is_square(self):
        return self.length == self.width

    def __str__(self):
        shape = "Square" if self.is_square else "Rectangle"
        return f"{shape} {self.length}x{self.width}: area={self.area},
perimeter={self.perimeter}"

for r in [Rectangle(5, 3), Rectangle(4, 4)]:
    print(r)
```

**Output:**

```text
Rectangle 5x3: area=15, perimeter=16
Square 4x4: area=16, perimeter=16
```
