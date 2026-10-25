> **In simple words:**  A capstone project is a **single program that puts every concept you have learned to work**  **together**.

Reading finished code is a different skill from writing it, and it is the skill you will use most in a job. Go through this program slowly and name the concept behind each block: where is encapsulation, where is polymorphism, where would it break if you removed the `try`. The checklist at the end of the chapter tells you exactly what to look for.

This single program uses **almost every concept in these notes**: variables, strings, lists, dictionaries, conditionals, loops, comprehensions, functions, exception handling, file handling, classes, inheritance, polymorphism, encapsulation and abstraction. Read it top-to-bottom and identify each concept as it appears.

**Program: payroll_system.py**

```python
"""
payroll_system.py
A complete mini payroll application.
"""
import json
from abc import ABC, abstractmethod
from datetime import date

# ---------------------------------------------------- custom exception
class PayrollError(Exception):
    """Base exception for all payroll problems."""

class InvalidSalaryError(PayrollError):
    pass

# ---------------------------------------------------- abstraction
class Payable(ABC):
    """Anything the company pays money to must implement calculate_pay()."""

    @abstractmethod
    def calculate_pay(self) -> float:
        ...

# ---------------------------------------------------- base class
class Employee(Payable):
    company = "TechCorp Solutions"          # class attribute
    _count = 0                              # protected class counter

    def __init__(self, name, emp_id, base_salary):
        if not isinstance(base_salary, (int, float)) or base_salary <= 0:
            raise InvalidSalaryError(f"Bad salary for {name}: {base_salary}")

        self.name = name
        self.emp_id = emp_id
        self.__base_salary = base_salary     # ENCAPSULATED
        self.joined = date.today()
        Employee._count += 1

    # ---- encapsulated access via property ----
    @property
    def base_salary(self):
```

```python
        return self.__base_salary

    @base_salary.setter
    def base_salary(self, value):
        if value <= 0:
            raise InvalidSalaryError("Salary must be positive")
        self.__base_salary = value

    def give_hike(self, percent):
        self.base_salary = round(self.__base_salary * (1 + percent / 100), 2)
        return self.__base_salary

    # ---- polymorphic: every subclass overrides this ----
    def calculate_pay(self):
        return self.__base_salary

    def role(self):
        return self.__class__.__name__

    def deductions(self):
        gross = self.calculate_pay()
        pf = gross * 0.12
        tax = gross * 0.10 if gross > 50000 else 0
        return round(pf, 2), round(tax, 2)

    def net_pay(self):
        pf, tax = self.deductions()
        return round(self.calculate_pay() - pf - tax, 2)

    def payslip(self):
        pf, tax = self.deductions()
        return (f"{self.emp_id:<5}{self.name:<14}{self.role():<11}"
                f"{self.calculate_pay():>11,.2f}{pf:>10,.2f}"
                f"{tax:>10,.2f}{self.net_pay():>12,.2f}")

    def to_dict(self):
        return {"id": self.emp_id, "name": self.name, "role": self.role(),
                "gross": self.calculate_pay(), "net": self.net_pay()}

    def __str__(self):
        return f"{self.role()}({self.name}, Rs.{self.calculate_pay():,.2f})"

    def __lt__(self, other):                 # enables sorting by pay
        return self.calculate_pay() < other.calculate_pay()

    @classmethod
    def headcount(cls):
        return cls._count

    @staticmethod
    def is_valid_id(emp_id):
        return isinstance(emp_id, int) and 100 <= emp_id <= 999

# ---------------------------------------------------- inheritance
class Manager(Employee):
    def __init__(self, name, emp_id, base_salary, team_size):
        super().__init__(name, emp_id, base_salary)
        self.team_size = team_size

    def calculate_pay(self):                 # OVERRIDE
        return round(self.base_salary + self.team_size * 2500, 2)

class Developer(Employee):
```

```python
    BONUS = {"Python": 9000, "Java": 6000, "SQL": 4000}

    def __init__(self, name, emp_id, base_salary, skills):
        super().__init__(name, emp_id, base_salary)
        self.skills = skills

    def calculate_pay(self):                 # OVERRIDE
        bonus = sum(self.BONUS.get(s, 0) for s in self.skills)   # comprehension
        return round(self.base_salary + bonus, 2)

class Intern(Employee):
    def calculate_pay(self):                 # OVERRIDE
        return round(self.base_salary * 0.4, 2)

    def deductions(self):                    # interns have no PF or tax
        return 0.0, 0.0

# ---------------------------------------------------- the payroll engine
class Payroll:
    def __init__(self, month):
        self.month = month
        self.staff = []                      # list of Employee objects

    def add(self, employee):
        self.staff.append(employee)

    def total_payout(self):
        return round(sum(e.net_pay() for e in self.staff), 2)

    def highest_paid(self):
        return max(self.staff)               # works because of __lt__

    def by_role(self):
        grouped = {}
        for e in self.staff:
            grouped.setdefault(e.role(), []).append(e.name)
        return grouped

    def run(self):
        header = (f"{'ID':<5}{'NAME':<14}{'ROLE':<11}"
                  f"{'GROSS':>11}{'PF':>10}{'TAX':>10}{'NET':>12}")
        print(f"\n{self.company_banner()}")
        print(header)
        print("-" * len(header))

        for e in sorted(self.staff, reverse=True):      # polymorphic sort
            print(e.payslip())                          # polymorphic payslip

        print("-" * len(header))
        print(f"{'TOTAL NET PAYOUT':<51}{self.total_payout():>12,.2f}")

    def company_banner(self):
        return f"{Employee.company} -- Payroll for {self.month}"

    def export_json(self, filename):
        try:
            with open(filename, "w") as f:
                json.dump([e.to_dict() for e in self.staff], f, indent=2)
            return f"Exported {len(self.staff)} records to {filename}"
        except (IOError, OSError) as err:
            return f"Export failed: {err}"
```

```python
# ---------------------------------------------------- run it
def main():
    payroll = Payroll("August 2026")

    raw_staff = [
        ("Manager",   "Meera Nair",  201, 95000,  {"team_size": 6}),
        ("Developer", "Ravi Kumar",  202, 60000,  {"skills": ["Python", "SQL"]}),
        ("Developer", "Kiran S",     203, 55000,  {"skills": ["Java"]}),
        ("Intern",    "Sunil P",     204, 20000,  {}),
        ("Developer", "Anu Reddy",   205, -1000,  {"skills": ["Python"]}),   # bad row
    ]

    builders = {"Manager": Manager, "Developer": Developer, "Intern": Intern}

    for kind, name, eid, salary, extra in raw_staff:
        try:
            if not Employee.is_valid_id(eid):
                raise PayrollError(f"Invalid employee id {eid}")
            employee = builders[kind](name, eid, salary, **extra)
            payroll.add(employee)
        except InvalidSalaryError as e:
            print(f"  SKIPPED -> {e}")
        except PayrollError as e:
            print(f"  SKIPPED -> {e}")

    payroll.run()

    print(f"\nHeadcount        : {Employee.headcount()}")
    print(f"Highest paid     : {payroll.highest_paid()}")
    print(f"Grouped by role  : {payroll.by_role()}")

    print("\nAfter a 10% hike for Ravi:")
    ravi = next(e for e in payroll.staff if e.name == "Ravi Kumar")
    ravi.give_hike(10)
    print(f"  {ravi}")

if __name__ == "__main__":
    main()
```

**Output:**

```text
SKIPPED -> Bad salary for Anu Reddy: -1000
         TechCorp Solutions -- Payroll for August 2026
         ID   NAME          ROLE             GROSS        PF       TAX         NET
         ----------------------------------------------------------------------------
         201  Meera Nair    Manager     110,000.00 13,200.00 11,000.00   85,800.00
         202  Ravi Kumar    Developer    73,000.00  8,760.00  7,300.00   56,940.00
         203  Kiran S       Developer    61,000.00  7,320.00  6,100.00   47,580.00
         204  Sunil P       Intern        8,000.00      0.00      0.00    8,000.00
         ----------------------------------------------------------------------------
         TOTAL NET PAYOUT                                              198,320.00
         Headcount        : 4
         Highest paid     : Manager(Meera Nair, Rs.110,000.00)
         Grouped by role  : {'Manager': ['Meera Nair'], 'Developer': ['Ravi Kumar', 'Kiran
S'], 'Intern': ['Sunil P']}
         After a 10% hike for Ravi:
           Developer(Ravi Kumar, Rs.75,000.00)
```

## Concept Checklist for This Project

| Concept | Where it appears in the code |
| --- | --- |
| Variables & data types | name`, `base_salary`, `skills` list, `BONUS` dict |
| String formatting | f-strings with `:<14`, `:>11,.2f` in `payslip() |
| Lists & dictionaries | self.staff` list, `builders` dict, `by_role()` grouping |
| Conditionals | salary validation, tax slab check in `deductions() |
| Loops | `for e in sorted(self.staff)' in 'run()` `sum(self.BONUS.get(s, 0) for s in self.skills)` |
| Comprehension |  |
| Functions | `main()', 'total_payout()', 'is_valid_id()` `InvalidSalaryError', 'try/except' in 'main()` |
| Exception handling |  |
| File handling | export_json()` with a `with` block |
| Class & object | Employee`, `Payroll`, and their instances |
| Encapsulation | __base_salary` + `@property` setter with validation `Manager', 'Developer', 'Intern' extend 'Employee` |
| Inheritance |  |
| Polymorphism | calculate_pay()` overridden; `__lt__`, `__str__` dunders `Payable(ABC)' with '@abstractmethod calculate_pay()` |
| Abstraction |  |
| Class/static methods | `headcount()' and 'is_valid_id()` |
