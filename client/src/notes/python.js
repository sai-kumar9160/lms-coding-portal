// Python notes, built from "A Complete Python Guide" (python full notes.pdf): the same 13 chapters, in the same order.
// Blocks are rendered by NotesPage (p / h / list / points / note / warn / table / code / diagram).
// Write "\\n" for a newline inside Python strings, because these are ordinary JavaScript template strings.
const code = (source, out, title) => ({ t: 'code', code: source.trim(), out: out && out.trim(), title });

export const python = {
    language: 'Python',
    tagline: 'Simple, readable and powerful: from your first script to data, automation and web APIs.',
    topics: [
        {
            id: 'introduction', title: 'Introduction to Python', time: 10,
            summary: 'What Python is, where it came from, what it is used for and how to run your first program.',
            blocks: [
                { t: 'h', text: 'What is Python?' },
                { t: 'p', text: 'Python is a **high-level, interpreted, general-purpose** programming language known for its simplicity, readability and versatility. It was created by Guido van Rossum and first released in 1991. Python supports several programming styles: procedural, object-oriented and functional.' },
                { t: 'list', items: ['**Interpreted:** no separate compile step; the interpreter runs the code line by line.', '**Dynamically typed:** you do not declare variable types.', '**Cross-platform:** runs on Windows, macOS and Linux without changes.', '**Extensible:** can work with C, C++, Java and more.'] },
                { t: 'h', text: 'History and evolution' },
                { t: 'table', plain: true, head: ['Version', 'Year', 'Key features'], rows: [
                    ['Python 1.0', '1991', 'Initial release by Guido van Rossum'],
                    ['Python 2.0', '2000', 'List comprehensions, garbage collection with reference counting'],
                    ['Python 3.0', '2008', 'Unicode support, print function, new integer division'],
                    ['Python 3.6+', '2016+', 'f-strings, type hints, async/await'],
                    ['Python 3.10+', '2021+', 'Structural pattern matching'],
                ] },
                { t: 'note', text: 'Python 2 is outdated and no longer maintained (official support ended in 2020). Always use Python 3.' },
                { t: 'h', text: 'Features and advantages' },
                { t: 'list', items: ['**Easy to read and write:** indentation replaces braces.', '**Extensive standard library:** built-in modules for the OS, networking, maths and more.', '**Automatic memory management:** garbage collection.', '**Beginner-friendly** with a large, active community and many open-source libraries.', '**Versatile:** web development, AI, data science, automation and more.'] },
                { t: 'h', text: 'Real-world applications' },
                { t: 'table', plain: true, head: ['Area', 'Tools', 'Used for'], rows: [
                    ['Web development', 'Flask, Django', 'Instagram, YouTube'],
                    ['Data science and ML', 'NumPy, Pandas, Scikit-learn', 'Analytics and prediction'],
                    ['Artificial intelligence', 'TensorFlow, PyTorch', 'Deep learning'],
                    ['Automation and scripting', 'Selenium, BeautifulSoup', 'Bots, web scraping'],
                    ['Cybersecurity', 'Python scripts', 'Penetration testing tools'],
                    ['Game development', 'Pygame', '2D game prototypes'],
                    ['Internet of Things', 'MicroPython', 'Raspberry Pi projects'],
                ] },
                { t: 'h', text: 'Installing Python and setting up' },
                { t: 'list', items: ['**Install Python:** download from python.org (Windows), or use your package manager on macOS and Linux.', '**Verify:** run `python --version` or `python3 --version`.', '**Choose an editor:** IDLE or Thonny for beginners; VS Code, PyCharm or Jupyter Notebook for more.', '**Install libraries with pip**, the package manager: `pip install numpy`.'] },
                { t: 'h', text: 'Interactive mode and script mode' },
                { t: 'p', text: '**Interactive mode (REPL)** runs one statement at a time in the terminal, which is perfect for quick tests. **Script mode** runs a whole file.' },
                code(`>>> print("Hello, Python!")
Hello, Python!`, null, 'Interactive mode: type python'),
                code(`print("Welcome to Python!")`, 'Welcome to Python!', 'hello.py  (run with: python hello.py)'),
                { t: 'h', text: 'The REPL: Read, Eval, Print, Loop' },
                { t: 'diagram', name: 'py-repl', caption: 'The REPL repeats these four steps until you exit.' },
                code(`>>> a = 10
>>> b = 20
>>> a + b
30`, null, 'REPL session'),
                { t: 'table', head: ['Command', 'What it does'], rows: [['help()', 'Opens interactive help'], ['exit()', 'Leaves the REPL'], ['_', 'Holds the last evaluated result']] },
                { t: 'h', text: 'Your first program' },
                code(`# This is a simple Python program
print("Hello, World!")`, 'Hello, World!', 'first_program.py'),
                { t: 'points', items: ['Python is interpreted, dynamically typed and very readable.', 'Use Python 3, and `pip` to install libraries.', 'Run code line by line in the REPL or as a script with `python file.py`.'] },
            ],
        },
        {
            id: 'basics', title: 'Python Basics', time: 14,
            summary: 'Syntax and indentation, variables, data types, type casting, input, output and comments.',
            blocks: [
                { t: 'h', text: 'Syntax and indentation' },
                { t: 'p', text: 'Python uses **indentation** instead of curly braces to mark blocks of code.' },
                { t: 'list', items: ['Statements end at a new line (no semicolons).', 'Indentation defines blocks.', 'Python is case-sensitive: `Name` and `name` are different.', 'A colon `:` starts a block (functions, loops, conditions).'] },
                code(`def greet():
    print("Hello, Python!")   # indented: inside the function

greet()`, 'Hello, Python!', 'Correct'),
                code(`def greet():
print("Hello, Python!")       # not indented`, 'IndentationError: expected an indented block', 'Incorrect'),
                { t: 'note', text: 'Use 4 spaces for each level (the PEP 8 standard) and never mix spaces with tabs.' },
                { t: 'h', text: 'Variables and constants' },
                { t: 'p', text: 'A variable stores data in memory. You never declare its type; it is decided by the value (dynamic typing).' },
                code(`name = "Python"
age = 30
pi = 3.14
print(name, age, pi)`, 'Python 30 3.14'),
                { t: 'list', items: ['A name must start with a letter or underscore.', 'It can contain letters, numbers and underscores.', 'It cannot be a Python keyword such as `if`, `for` or `class`.'] },
                { t: 'p', text: 'Python has no built-in constants. By convention, a name written in UPPERCASE is treated as one.' },
                code(`PI = 3.14159        # a constant by convention
MAX_USERS = 100`),
                { t: 'h', text: 'Data types' },
                code(`num1 = 10            # int
num2 = 3.14          # float
num3 = 3 + 4j        # complex
print(type(num1), type(num2), type(num3))`, "<class 'int'> <class 'float'> <class 'complex'>", 'Numeric types'),
                code(`text = "Hello, Python!"
print(type(text))`, "<class 'str'>", 'Text type'),
                code(`my_list = [1, 2, 3, "Python"]     # list: mutable, ordered
my_list.append(4)
print(my_list)

my_tuple = (1, 2, 3, "Python")     # tuple: immutable, ordered
print(my_tuple[0])

r = range(1, 10, 2)                # range: start, stop, step
print(list(r))`, `[1, 2, 3, 'Python', 4]
1
[1, 3, 5, 7, 9]`, 'Sequence types'),
                code(`my_set = {1, 2, 3, 3, 4}           # set: unordered, unique
print(my_set)

f_set = frozenset([1, 2, 3, 4])    # frozenset: immutable set
print(f_set)`, `{1, 2, 3, 4}
frozenset({1, 2, 3, 4})`, 'Set types'),
                code(`my_dict = {"name": "Python", "year": 1991}   # dict: key-value pairs
print(my_dict["name"])`, 'Python', 'Mapping type'),
                { t: 'h', text: 'Type checking and type casting' },
                code(`num = 10
print(type(num))        # <class 'int'>

a = "100"
b = int(a)              # string to integer
c = float(b)            # integer to float
print(b, c)`, `<class 'int'>
100 100.0`),
                { t: 'table', head: ['Function', 'Converts to'], rows: [['int()', 'Integer'], ['float()', 'Decimal number'], ['str()', 'String'], ['list()', 'List']] },
                { t: 'h', text: 'Taking user input' },
                code(`name = input("Enter your name: ")
print("Hello,", name)

age = int(input("Enter your age: "))
print("Next year, you will be", age + 1)`, `Enter your name: Asha
Hello, Asha
Enter your age: 20
Next year, you will be 21`),
                { t: 'warn', text: '`input()` always returns a **string**. Convert it with `int()` or `float()` before doing maths.' },
                { t: 'h', text: 'Printing output' },
                code(`print("Hello, Python!")
print(10, 20, 30)                      # several values
print("Python", "is", "fun", sep="-")  # custom separator

name = "Alice"
age = 25
print("My name is {} and I am {} years old.".format(name, age))   # format()
print(f"My name is {name} and I am {age} years old.")             # f-string (recommended)

print("Hello\\nWorld")     # \\n = new line
print("Name:\\tAlice")     # \\t = tab`, `Hello, Python!
10 20 30
Python-is-fun
My name is Alice and I am 25 years old.
My name is Alice and I am 25 years old.
Hello
World
Name:	Alice`),
                { t: 'h', text: 'Comments' },
                code(`# This is a single-line comment
print("Hello, World!")   # inline comment

"""
This is a multi-line comment
(really a string that is never used).
It can span many lines.
"""
print("Python Basics")`, `Hello, World!
Python Basics`),
                { t: 'points', items: ['Indentation is part of Python syntax. Use 4 spaces.', 'Types are decided by values; check with `type()`, convert with `int()`, `float()`, `str()`, `list()`.', '`input()` returns text. Prefer f-strings for output.'] },
            ],
        },
        {
            id: 'operators', title: 'Operators and Expressions', time: 12,
            summary: 'Arithmetic, comparison, logical, bitwise, assignment, identity and membership operators, and precedence.',
            blocks: [
                { t: 'p', text: '**Operators** are symbols that perform operations. An **expression** combines variables, operators and values to produce a result.' },
                { t: 'h', text: 'Arithmetic operators' },
                { t: 'table', head: ['Operator', 'Description', 'Example', 'Output'], rows: [
                    ['+', 'Addition', '5 + 3', '8'], ['-', 'Subtraction', '10 - 4', '6'], ['*', 'Multiplication', '6 * 2', '12'],
                    ['/', 'Division (float)', '7 / 2', '3.5'], ['%', 'Modulus (remainder)', '7 % 2', '1'],
                    ['//', 'Floor division', '7 // 2', '3'], ['**', 'Exponentiation', '2 ** 3', '8'],
                ] },
                code(`a, b = 10, 3
print(a + b)    # 13
print(a - b)    # 7
print(a * b)    # 30
print(a / b)    # 3.3333333333333335
print(a % b)    # 1
print(a // b)   # 3
print(a ** b)   # 1000`, `13
7
30
3.3333333333333335
1
3
1000`),
                { t: 'h', text: 'Comparison operators' },
                { t: 'p', text: 'Comparison operators compare two values and return a Boolean (`True` or `False`).' },
                { t: 'table', head: ['Operator', 'Description', 'Example', 'Output'], rows: [
                    ['==', 'Equal to', '5 == 5', 'True'], ['!=', 'Not equal to', '5 != 3', 'True'], ['>', 'Greater than', '5 > 3', 'True'],
                    ['<', 'Less than', '5 < 3', 'False'], ['>=', 'Greater or equal', '5 >= 5', 'True'], ['<=', 'Less or equal', '5 <= 3', 'False'],
                ] },
                code(`x, y = 10, 20
print(x == y)   # False
print(x != y)   # True
print(x > y)    # False
print(x < y)    # True`, `False
True
False
True`),
                { t: 'h', text: 'Logical operators' },
                { t: 'table', head: ['Operator', 'Description', 'Example', 'Output'], rows: [
                    ['and', 'True if both conditions are True', '(5 > 3) and (10 > 5)', 'True'],
                    ['or', 'True if at least one is True', '(5 > 10) or (10 > 5)', 'True'],
                    ['not', 'Reverses the result', 'not (5 > 3)', 'False'],
                ] },
                code(`a, b = True, False
print(a and b)   # False
print(a or b)    # True
print(not a)     # False`, `False
True
False`),
                { t: 'h', text: 'Bitwise operators' },
                { t: 'p', text: 'Bitwise operators work on the binary form of integers.' },
                { t: 'table', head: ['Operator', 'Description', 'Example', 'Output'], rows: [
                    ['&', 'AND', '5 & 3  (0101 & 0011)', '1'], ['|', 'OR', '5 | 3', '7'], ['^', 'XOR', '5 ^ 3  (0101 ^ 0011)', '6'],
                    ['~', 'NOT (inverts bits)', '~5', '-6'], ['<<', 'Left shift', '5 << 1  (0101 to 1010)', '10'], ['>>', 'Right shift', '5 >> 1  (0101 to 0010)', '2'],
                ] },
                code(`x, y = 5, 3
print(x & y)    # 1  (AND)
print(x | y)    # 7  (OR)
print(x ^ y)    # 6  (XOR)
print(~x)       # -6 (NOT)
print(x << 1)   # 10 (left shift)
print(x >> 1)   # 2  (right shift)`, `1
7
6
-6
10
2`),
                { t: 'h', text: 'Assignment operators' },
                { t: 'table', head: ['Operator', 'Example', 'Equivalent to'], rows: [
                    ['=', 'x = 5', 'x = 5'], ['+=', 'x += 3', 'x = x + 3'], ['-=', 'x -= 3', 'x = x - 3'], ['*=', 'x *= 3', 'x = x * 3'],
                    ['/=', 'x /= 3', 'x = x / 3'], ['%=', 'x %= 3', 'x = x % 3'], ['//=', 'x //= 3', 'x = x // 3'], ['**=', 'x **= 3', 'x = x ** 3'],
                ] },
                code(`x = 10
x += 5     # x = x + 5  -> 15
x *= 2     # x = x * 2  -> 30
print(x)`, '30'),
                { t: 'h', text: 'Identity operators' },
                { t: 'p', text: '`is` and `is not` check whether two names refer to the **same object** in memory. `==` only checks whether the values are equal.' },
                code(`a = [1, 2, 3]
b = a
c = [1, 2, 3]
print(a is b)    # True   (same object)
print(a is c)    # False  (different objects)
print(a == c)    # True   (same values)`, `True
False
True`),
                { t: 'h', text: 'Membership operators' },
                { t: 'p', text: '`in` and `not in` check whether a value is present in a sequence such as a list, tuple or string.' },
                code(`numbers = [1, 2, 3, 4]
print(2 in numbers)       # True
print(5 not in numbers)   # True`, `True
True`),
                { t: 'h', text: 'Operator precedence' },
                { t: 'p', text: 'Precedence decides which operation runs first. From highest to lowest:' },
                { t: 'table', plain: true, head: ['Order', 'Operators'], rows: [
                    ['1', 'Parentheses ( )'], ['2', 'Exponentiation **'], ['3', 'Unary operators (+x, -x, ~x)'], ['4', 'Multiplication, division, modulus (* / // %)'],
                    ['5', 'Addition and subtraction (+ -)'], ['6', 'Bitwise shifts (<< >>)'], ['7', 'Bitwise AND (&)'], ['8', 'Bitwise XOR (^)'], ['9', 'Bitwise OR (|)'],
                    ['10', 'Comparisons (< > == and so on)'], ['11', 'Logical NOT'], ['12', 'Logical AND'], ['13', 'Logical OR'], ['14', 'Assignment'],
                ] },
                code(`print(2 + 3 * 4)     # 14  (* binds tighter than +)
print((2 + 3) * 4)   # 20  (parentheses change the order)`, `14
20`),
                { t: 'points', items: ['`/` always gives a float; `//` gives the whole-number quotient.', '`is` compares identity, `==` compares values.', 'When unsure about order, add parentheses.'] },
            ],
        },
        {
            id: 'control-flow', title: 'Control Flow Statements', time: 13,
            summary: 'Make decisions with if, elif and else, repeat with for and while, and steer loops with break, continue and pass.',
            blocks: [
                { t: 'p', text: 'Control flow statements decide the **order** in which code runs. They let a program make decisions and repeat work.' },
                { t: 'h', text: 'Conditional statements' },
                { t: 'p', text: 'The `if` block runs only when its condition is `True`; otherwise it is skipped.' },
                code(`age = 20
if age >= 18:
    print("You are eligible to vote.")`, 'You are eligible to vote.', 'if'),
                { t: 'p', text: 'The `else` block runs when the condition is `False`.' },
                code(`num = 5
if num % 2 == 0:
    print("Even number")
else:
    print("Odd number")`, 'Odd number', 'if ... else'),
                { t: 'p', text: '`elif` checks several conditions in order and runs the first one that is `True`. If none is, `else` runs.' },
                code(`marks = 85
if marks >= 90:
    print("Grade: A")
elif marks >= 75:
    print("Grade: B")
elif marks >= 50:
    print("Grade: C")
else:
    print("Fail")`, 'Grade: B', 'if ... elif ... else'),
                { t: 'h', text: 'Looping' },
                { t: 'p', text: 'A **for loop** goes through a sequence (list, tuple, string, range) and stops automatically at the end.' },
                code(`for num in range(1, 6):
    print(num)

fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)`, `1
2
3
4
5
apple
banana
cherry`, 'for loop'),
                { t: 'p', text: 'A **while loop** repeats as long as a condition stays `True`. Use it when you do not know in advance how many rounds are needed.' },
                code(`count = 1
while count <= 5:
    print(count)
    count += 1`, `1
2
3
4
5`, 'while loop'),
                { t: 'warn', text: 'Beware of infinite loops. `while True:` runs forever unless something inside the loop uses `break`.' },
                { t: 'h', text: 'Nested loops' },
                { t: 'p', text: 'A loop inside another loop. The inner loop runs completely for every round of the outer loop.' },
                code(`for i in range(1, 3):        # outer loop
    for j in range(1, 4):    # inner loop
        print(f"i={i}, j={j}")`, `i=1, j=1
i=1, j=2
i=1, j=3
i=2, j=1
i=2, j=2
i=2, j=3`),
                { t: 'h', text: 'Loop control statements' },
                { t: 'table', head: ['Statement', 'What it does'], rows: [['break', 'Exits the loop immediately'], ['continue', 'Skips the rest of this round and starts the next'], ['pass', 'A placeholder that does nothing']] },
                code(`for num in range(1, 6):
    if num == 4:
        break          # leave the loop when num is 4
    print(num)`, `1
2
3`, 'break'),
                code(`for num in range(1, 6):
    if num == 3:
        continue       # skip printing 3
    print(num)`, `1
2
4
5`, 'continue'),
                code(`for num in range(5):
    if num == 3:
        pass           # placeholder for future code
    print(num)`, `0
1
2
3
4`, 'pass'),
                { t: 'points', items: ['`if`, `elif` and `else` choose which block runs.', '`for` repeats over a sequence; `while` repeats while a condition holds.', '`break` ends a loop, `continue` skips to the next round, `pass` does nothing.'] },
            ],
        },
        {
            id: 'data-structures', title: 'Data Structures', time: 18,
            summary: 'Lists, tuples, sets, dictionaries and strings, with their methods.',
            blocks: [
                { t: 'p', text: 'Python has built-in data structures for storing and organising data efficiently.' },
                { t: 'table', plain: true, head: ['Structure', 'Ordered?', 'Changeable?', 'Duplicates?', 'Example'], rows: [
                    ['List', 'Yes', 'Yes (mutable)', 'Allowed', '[1, 2, 3]'],
                    ['Tuple', 'Yes', 'No (immutable)', 'Allowed', '(1, 2, 3)'],
                    ['Set', 'No', 'Yes', 'No (unique)', '{1, 2, 3}'],
                    ['Dictionary', 'Yes (insertion order)', 'Yes', 'Keys are unique', '{"a": 1}'],
                    ['String', 'Yes', 'No (immutable)', 'Allowed', '"hello"'],
                ] },
                { t: 'h', text: 'Lists' },
                { t: 'p', text: 'A list is an **ordered, mutable** collection. It allows duplicates and can mix data types.' },
                code(`empty_list = []
numbers = [1, 2, 3, 4, 5]
mixed_list = ["Python", 3.14, True, 42]
nested_list = [[1, 2], [3, 4]]

numbers = [10, 20, 30, 40, 50]
print(numbers[0])      # first element: 10
print(numbers[-1])     # last element: 50
print(numbers[1:4])    # slicing: [20, 30, 40]`, `10
50
[20, 30, 40]`, 'Creating and accessing'),
                { t: 'table', head: ['Method', 'Description', 'Example'], rows: [
                    ['append(x)', 'Adds x to the end', 'lst.append(6)'], ['extend(iterable)', 'Adds multiple elements', 'lst.extend([7, 8, 9])'],
                    ['insert(i, x)', 'Inserts x at index i', 'lst.insert(2, 15)'], ['remove(x)', 'Removes the first occurrence of x', 'lst.remove(3)'],
                    ['pop(i)', 'Removes and returns the item at index i (last if omitted)', 'lst.pop(1)'], ['clear()', 'Removes all elements', 'lst.clear()'],
                    ['index(x)', 'Returns the index of x', 'lst.index(10)'], ['count(x)', 'Counts occurrences of x', 'lst.count(5)'],
                    ['sort()', 'Sorts the list', 'lst.sort()'], ['reverse()', 'Reverses the list in place', 'lst.reverse()'], ['copy()', 'Returns a copy', 'new_list = lst.copy()'],
                ] },
                code(`lst = [3, 1, 2]
lst.append(5)
lst.insert(0, 9)
lst.sort()
print(lst)`, '[1, 2, 3, 5, 9]'),
                { t: 'h', text: 'Tuples' },
                { t: 'p', text: 'A tuple is **ordered and immutable**: once created, its elements cannot be changed.' },
                code(`empty_tuple = ()
single_element_tuple = (42,)     # the comma is required
numbers = (10, 20, 30, 40, 50)

print(numbers[0])      # 10
print(numbers[-1])     # 50
print(numbers[1:3])    # (20, 30)`, `10
50
(20, 30)`),
                { t: 'table', head: ['Method / function', 'Description', 'Example'], rows: [
                    ['count(x)', 'How many times x appears', 'tpl.count(2)'], ['index(x)', 'Index of the first x', 'tpl.index(10)'], ['len()', 'Number of elements', 'len(tpl)'],
                    ['max() / min()', 'Largest / smallest value', 'max(tpl)'], ['sum()', 'Sum of elements', 'sum(tpl)'], ['sorted()', 'Returns a sorted list', 'sorted(tpl)'], ['tuple()', 'Converts an iterable to a tuple', 'tuple(lst)'],
                ] },
                { t: 'h', text: 'Sets' },
                { t: 'p', text: 'A set is an **unordered collection of unique** elements.' },
                code(`empty_set = set()           # {} would create an empty dict
my_set = {1, 2, 3, 4, 5}`),
                { t: 'table', head: ['Method', 'Description', 'Example'], rows: [
                    ['add(x)', 'Adds x', 's.add(6)'], ['remove(x)', 'Removes x (error if missing)', 's.remove(2)'], ['discard(x)', 'Removes x (no error if missing)', 's.discard(3)'],
                    ['pop()', 'Removes a random element', 's.pop()'], ['clear()', 'Removes all elements', 's.clear()'],
                    ['union(B)', 'All elements of A and B', 'A.union(B)'], ['intersection(B)', 'Common elements', 'A.intersection(B)'],
                    ['difference(B)', 'In A but not in B', 'A.difference(B)'], ['symmetric_difference(B)', 'In either, but not both', 'A.symmetric_difference(B)'],
                    ['isdisjoint(B)', 'True if A and B share nothing', 'A.isdisjoint(B)'],
                ] },
                code(`A = {1, 2, 3, 4}
B = {3, 4, 5}
print(A.union(B))          # {1, 2, 3, 4, 5}
print(A.intersection(B))   # {3, 4}
print(A.difference(B))     # {1, 2}`, `{1, 2, 3, 4, 5}
{3, 4}
{1, 2}`),
                { t: 'h', text: 'Dictionaries' },
                { t: 'p', text: 'A dictionary stores **key-value pairs** and gives fast lookups by key.' },
                code(`student = {"name": "Alice", "age": 21}
print(student["name"])
print(student.get("city"))            # None (no error)
student["city"] = "Delhi"             # add a new pair
print(student)`, `Alice
None
{'name': 'Alice', 'age': 21, 'city': 'Delhi'}`),
                { t: 'table', head: ['Method', 'Description', 'Example'], rows: [
                    ['keys()', 'All keys', 'd.keys()'], ['values()', 'All values', 'd.values()'], ['items()', 'Key-value pairs', 'd.items()'],
                    ['get(x)', 'Value of x (None if missing)', 'd.get("name")'], ['pop(x)', 'Removes key x and returns its value', 'd.pop("age")'],
                    ['update(B)', 'Merges dictionary B into d', 'd.update(new_data)'], ['setdefault(x, y)', 'Value of x, or sets it to y if missing', 'd.setdefault("city", "NY")'],
                    ['copy()', 'Returns a copy', 'new_d = d.copy()'], ['fromkeys(iterable, value)', 'New dict from keys with a default value', 'dict.fromkeys(["name", "age"], None)'],
                ] },
                { t: 'h', text: 'Strings' },
                { t: 'p', text: 'A string is an **immutable** sequence of characters. Methods return a new string.' },
                { t: 'table', head: ['Method', 'Description', 'Example'], rows: [
                    ['upper()', 'To uppercase', '"hello".upper()'], ['lower()', 'To lowercase', '"HELLO".lower()'], ['strip()', 'Removes surrounding spaces', '"  hello ".strip()'],
                    ['split()', 'Splits into a list', '"a,b,c".split(",")'], ['join()', 'Joins a list into a string', '",".join(["a", "b", "c"])'],
                    ['replace(old, new)', 'Replaces substrings', '"hello".replace("h", "H")'], ['find(x)', 'Index of the first x (-1 if none)', '"hello".find("l")'],
                    ['count(x)', 'Counts occurrences of x', '"hello".count("l")'], ['startswith(x)', 'Checks the beginning', '"hello".startswith("he")'], ['endswith(x)', 'Checks the end', '"hello".endswith("lo")'],
                ] },
                code(`s = "  Python is fun  "
print(s.strip().upper())
print("a,b,c".split(","))
print("-".join(["2025", "02", "19"]))
print("hello".replace("h", "H"))`, `PYTHON IS FUN
['a', 'b', 'c']
2025-02-19
Hello`),
                { t: 'points', items: ['List = ordered and changeable; tuple = ordered and fixed; set = unique values; dict = key to value.', '`{}` makes an empty dictionary; use `set()` for an empty set.', 'Strings and tuples are immutable, so their methods return new values.'] },
            ],
        },
        {
            id: 'functions', title: 'Functions', time: 14,
            summary: 'Define and call functions, the four kinds of arguments, return values, scope, recursion and lambdas.',
            blocks: [
                { t: 'p', text: 'A function is a block of **reusable code** that performs one task. Functions improve reusability, modularity and readability.' },
                { t: 'h', text: 'Defining and calling' },
                code(`def greet():
    print("Hello, welcome to Python!")

greet()                 # calling the function

def add(a, b):          # with parameters
    return a + b

result = add(5, 3)
print(result)`, `Hello, welcome to Python!
8`),
                { t: 'h', text: 'Function arguments' },
                { t: 'p', text: '**1. Positional arguments:** assigned by position.' },
                code(`def full_name(first, last):
    print(f"Full Name: {first} {last}")

full_name("Nihar", "Dodagatta")`, 'Full Name: Nihar Dodagatta'),
                { t: 'p', text: '**2. Default arguments:** used when no value is passed.' },
                code(`def greet(name="Guest"):
    print(f"Hello, {name}!")

greet()
greet("Nihar")`, `Hello, Guest!
Hello, Nihar!`),
                { t: 'p', text: '**3. Keyword arguments:** passed by name, so the order does not matter.' },
                code(`def student_details(name, age, course):
    print(f"Name: {name}, Age: {age}, Course: {course}")

student_details(age=22, name="Harsha", course="CS")`, 'Name: Harsha, Age: 22, Course: CS'),
                { t: 'p', text: '**4. Arbitrary arguments:** `*args` collects extra positional arguments into a tuple; `**kwargs` collects extra keyword arguments into a dictionary.' },
                code(`def sum_numbers(*numbers):
    total = sum(numbers)
    print(f"Sum: {total}")

sum_numbers(1, 2, 3, 4, 5)

def display_info(**info):
    for key, value in info.items():
        print(f"{key}: {value}")

display_info(name="Vasanta", age=24, city="Chennai")`, `Sum: 15
name: Vasanta
age: 24
city: Chennai`),
                { t: 'h', text: 'Returning values' },
                code(`def square(num):
    return num * num

print(square(6))

def calculate(a, b):             # several values come back as a tuple
    return a + b, a - b, a * b, a / b

add, sub, mul, div = calculate(10, 5)
print(add, sub, mul, div)`, `36
15 5 50 2.0`),
                { t: 'h', text: 'Scope and lifetime of variables' },
                { t: 'list', items: ['**Local scope:** a variable created inside a function exists only there.', '**Global scope:** a variable created outside all functions can be read anywhere.'] },
                { t: 'diagram', name: 'py-scope', caption: 'The x inside my_function() is a different variable from the global x.' },
                code(`x = 10                  # global

def my_function():
    x = 5               # local
    print("Inside function:", x)

my_function()
print("Outside function:", x)`, `Inside function: 5
Outside function: 10`),
                { t: 'p', text: 'Use the `global` keyword to change a global variable from inside a function.' },
                code(`x = 10

def modify():
    global x
    x = 20

modify()
print(x)`, '20'),
                { t: 'h', text: 'Recursive functions' },
                { t: 'p', text: 'A recursive function **calls itself** to solve a smaller version of the same problem. It needs a base case to stop.' },
                code(`def factorial(n):
    if n == 0:                 # base case
        return 1
    return n * factorial(n - 1)

print(factorial(5))

def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(6))`, `120
8`),
                { t: 'h', text: 'Lambda (anonymous) functions' },
                { t: 'p', text: 'A lambda is a small unnamed function with any number of arguments but **one expression**.' },
                code(`square = lambda x: x * x
print(square(5))

add = lambda a, b: a + b
print(add(3, 4))`, `25
7`),
                { t: 'p', text: 'Lambdas are most useful with `map()`, `filter()` and `reduce()`.' },
                code(`from functools import reduce

numbers = [1, 2, 3, 4, 5]
print(list(map(lambda x: x ** 2, numbers)))            # apply to every item
print(list(filter(lambda x: x % 2 != 0, numbers)))     # keep items that match
print(reduce(lambda a, b: a + b, numbers))             # combine into one value`, `[1, 4, 9, 16, 25]
[1, 3, 5]
15`),
                { t: 'points', items: ['Define with `def`, return a result with `return`.', 'Arguments can be positional, default, keyword, `*args` or `**kwargs`.', 'Variables made inside a function are local; use `global` only when you must.', 'Every recursive function needs a base case.'] },
            ],
        },
        {
            id: 'modules', title: 'Modules', time: 12,
            summary: 'Import code from other files, create your own modules, use the standard library and install packages with pip.',
            blocks: [
                { t: 'p', text: 'A **module** is a `.py` file containing functions, classes and variables that other programs can import. Modules keep code organised, reusable and free of name clashes.' },
                { t: 'table', plain: true, head: ['Type', 'Meaning', 'Example'], rows: [['Built-in', 'Ships with Python', 'math, random, os'], ['User-defined', 'Written by you', 'mymodule.py']] },
                { t: 'h', text: 'Importing modules' },
                code(`import math
print(math.sqrt(25))      # 5.0
print(math.pi)

from math import sqrt, pi     # import only what you need
print(sqrt(36))

import math as m              # give it an alias
print(m.factorial(5))

from math import *            # import everything
print(sin(0))`, `5.0
3.141592653589793
6.0
120
0.0`),
                { t: 'warn', text: 'Avoid `from module import *`. It can overwrite your own names and causes conflicts.' },
                { t: 'h', text: 'Creating your own module' },
                code(`# mymodule.py
def greet(name):
    return f"Hello, {name}!"

def add(a, b):
    return a + b`, null, 'mymodule.py'),
                code(`# main.py  (same folder as mymodule.py)
import mymodule

print(mymodule.greet("Nihar"))
print(mymodule.add(5, 3))`, `Hello, Nihar!
8`, 'main.py'),
                { t: 'h', text: 'Standard library modules' },
                code(`import math
print(math.sqrt(16))             # 4.0
print(math.factorial(5))         # 120
print(math.log10(100))           # 2.0
print(math.sin(math.pi / 2))     # 1.0`, `4.0
120
2.0
1.0`, 'math: mathematical functions'),
                code(`import random
print(random.randint(1, 10))                    # random integer from 1 to 10
print(random.choice(["Python", "Java", "C++"])) # random item
print(random.uniform(1.5, 3.5))                 # random float`, null, 'random: random numbers'),
                code(`import datetime
now = datetime.datetime.now()
print(now)                                   # 2025-02-19 12:34:56.789123
print(now.strftime("%Y-%m-%d %H:%M:%S"))     # 2025-02-19 12:34:56`, null, 'datetime: dates and times'),
                code(`import os
print(os.getcwd())      # current working directory
print(os.listdir())     # files in the current directory`, null, 'os: operating system'),
                code(`import time
print("Wait for 3 seconds...")
time.sleep(3)           # pause for 3 seconds
print("Done!")`, `Wait for 3 seconds...
Done!`, 'time'),
                code(`import sys
print(sys.version)      # Python version
print(sys.platform)     # operating system`, null, 'sys'),
                code(`import json
data = {"name": "Nihar", "age": 25}
json_data = json.dumps(data)
print(json_data)
parsed_data = json.loads(json_data)
print(parsed_data["name"])`, `{"name": "Nihar", "age": 25}
Nihar`, 'json'),
                code(`import csv
with open("data.csv", mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Age"])
    writer.writerow(["Nihar", 25])`, null, 'csv'),
                code(`import re
pattern = r"\\d+"
text = "There are 15 cats and 3 dogs."
matches = re.findall(pattern, text)
print(matches)`, "['15', '3']", 're: regular expressions'),
                code(`import urllib.request
response = urllib.request.urlopen("http://www.google.com")
print(response.status)`, '200', 'urllib: web requests'),
                { t: 'h', text: 'Command-line arguments with sys' },
                code(`# script.py
import sys
print("Arguments:", sys.argv)`, null, 'script.py'),
                code(`python script.py hello world`, "Arguments: ['script.py', 'hello', 'world']", 'Terminal'),
                { t: 'note', text: '`sys.argv[0]` is the script name and `sys.argv[1:]` are the arguments you passed.' },
                { t: 'h', text: 'Installing external modules with pip' },
                code(`pip list                       # show installed packages
pip install requests           # install
pip uninstall requests         # remove`, null, 'Terminal'),
                code(`import requests
response = requests.get("https://api.github.com")
print(response.json())`, null, 'Using an installed module'),
                { t: 'points', items: ['A module is just a `.py` file you can `import`.', 'The standard library is large: `math`, `random`, `datetime`, `os`, `json`, `csv`, `re` and more.', 'Install third-party packages with `pip install`.'] },
            ],
        },
        {
            id: 'file-handling', title: 'File Handling', time: 13,
            summary: 'Open, read, write and append files, plus working with CSV and JSON data.',
            blocks: [
                { t: 'p', text: 'File handling lets a program read, write and modify files stored on disk.' },
                { t: 'h', text: 'Opening and closing files' },
                code(`file = open("filename", "mode")`, null, 'Syntax'),
                { t: 'list', items: ['`"filename"` is the name of the file (with extension).', '`"mode"` says how the file will be opened.'] },
                code(`file = open("example.txt", "r")   # open in read mode
file.close()                      # always close it afterwards`),
                { t: 'note', text: '**Best practice:** use a `with` statement. It closes the file automatically, even if an error happens.' },
                code(`with open("example.txt", "r") as file:
    data = file.read()`),
                { t: 'h', text: 'Reading files' },
                code(`# sample.txt contains:
# Hello, Python!
# Welcome to file handling.

with open("sample.txt", "r") as file:
    content = file.read()       # the whole file
    print(content)`, `Hello, Python!
Welcome to file handling.`),
                { t: 'table', head: ['Method', 'What it does'], rows: [['read(size)', 'Reads a number of characters (all if omitted)'], ['readline()', 'Reads one line at a time'], ['readlines()', 'Reads all lines into a list']] },
                code(`with open("sample.txt", "r") as file:
    print(file.readline())     # first line
    print(file.readlines())    # remaining lines as a list`),
                { t: 'h', text: 'Writing and appending' },
                code(`with open("sample.txt", "w") as file:    # write: overwrites existing content
    file.write("New content added!\\n")

with open("sample.txt", "a") as file:    # append: keeps existing content
    file.write("Appending a new line.\\n")

lines = ["Line 1\\n", "Line 2\\n", "Line 3\\n"]
with open("sample.txt", "w") as file:
    file.writelines(lines)               # write many lines at once`),
                { t: 'warn', text: 'Mode `"w"` erases everything already in the file. Use `"a"` to add to the end.' },
                { t: 'h', text: 'File modes' },
                { t: 'table', head: ['Mode', 'Meaning'], rows: [
                    ['r', 'Read (default). Error if the file does not exist'], ['w', 'Write. Creates the file, overwrites existing content'], ['a', 'Append. Adds data, keeps existing content'],
                    ['r+', 'Read and write. Error if the file does not exist'], ['w+', 'Read and write. Creates the file, overwrites existing content'], ['a+', 'Read and append. Creates the file if missing'],
                    ['rb', 'Read in binary mode'], ['wb', 'Write in binary mode'], ['ab', 'Append in binary mode'],
                ] },
                code(`with open("image.jpg", "rb") as file:
    binary_data = file.read()

with open("copy.jpg", "wb") as file:
    file.write(binary_data)`, null, 'Copying a file in binary mode'),
                { t: 'h', text: 'Working with CSV files' },
                { t: 'p', text: 'CSV (Comma-Separated Values) files store tabular data as plain text.' },
                code(`import csv

# Writing
with open("data.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Age", "City"])
    writer.writerow(["Nihar", 25, "Hyderabad"])
    writer.writerow(["Harsha", 24, "Bangalore"])

# Reading
with open("data.csv", "r") as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)`, `['Name', 'Age', 'City']
['Nihar', '25', 'Hyderabad']
['Harsha', '24', 'Bangalore']`),
                { t: 'p', text: '`DictWriter` and `DictReader` use the column names as dictionary keys.' },
                code(`import csv

with open("data.csv", "w", newline="") as file:
    fieldnames = ["Name", "Age", "City"]
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow({"Name": "Nihar", "Age": 25, "City": "Hyderabad"})
    writer.writerow({"Name": "Harsha", "Age": 24, "City": "Bangalore"})

with open("data.csv", "r") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row["Name"], row["Age"], row["City"])`, `Nihar 25 Hyderabad
Harsha 24 Bangalore`),
                { t: 'h', text: 'Handling JSON data' },
                { t: 'p', text: 'JSON (JavaScript Object Notation) stores and exchanges structured data.' },
                code(`import json

data = {"name": "Nihar", "age": 25, "city": "Hyderabad"}

with open("data.json", "w") as file:
    json.dump(data, file, indent=4)       # write JSON to a file

with open("data.json", "r") as file:
    data = json.load(file)                # read JSON from a file
    print(data["name"])`, 'Nihar'),
                code(`import json

data = {"name": "Nihar", "age": 25}
json_string = json.dumps(data, indent=4)       # dict to JSON string
print(json_string)

json_string = '{"name": "Nihar", "age": 25}'
data = json.loads(json_string)                 # JSON string to dict
print(data["name"])`, `{
    "name": "Nihar",
    "age": 25
}
Nihar`),
                { t: 'note', text: '`dump` / `load` work with **files**; `dumps` / `loads` work with **strings** (the "s" stands for string).' },
                { t: 'points', items: ['Always open files with `with` so they close automatically.', '`"r"` reads, `"w"` overwrites, `"a"` appends.', 'Use the `csv` module for tables and the `json` module for structured data.'] },
            ],
        },
        {
            id: 'exceptions', title: 'Exception Handling', time: 10,
            summary: 'Handle errors gracefully with try, except, finally and raise, and define your own exceptions.',
            blocks: [
                { t: 'p', text: 'Exception handling lets a program deal with errors gracefully instead of crashing. Errors come in two kinds:' },
                { t: 'list', items: ['**Syntax errors:** Python cannot understand the code, so it will not run at all.', '**Exceptions (runtime errors):** the code is valid but something goes wrong while it runs.'] },
                code(`# SyntaxError: missing colon
if True
    print("Hello")`, 'SyntaxError: expected ":"', 'Syntax error'),
                code(`result = 10 / 0`, 'ZeroDivisionError: division by zero', 'Runtime error (exception)'),
                { t: 'h', text: 'Common built-in exceptions' },
                { t: 'table', head: ['Exception', 'Raised when'], rows: [
                    ['ZeroDivisionError', 'Dividing by zero'], ['ValueError', 'A function gets an argument of the right type but a bad value'],
                    ['TypeError', 'An operation is used on an invalid type'], ['IndexError', 'A list index is out of range'],
                    ['KeyError', 'A dictionary key is not found'], ['FileNotFoundError', 'Opening a file that does not exist'],
                ] },
                { t: 'h', text: 'try and except' },
                { t: 'p', text: 'Put risky code in `try`. If it raises an error, the matching `except` block runs.' },
                code(`try:
    result = 10 / 0
except ZeroDivisionError:
    print("Error: Cannot divide by zero!")`, 'Error: Cannot divide by zero!'),
                { t: 'h', text: 'Handling multiple exceptions' },
                code(`try:
    num = int(input("Enter a number: "))   # may raise ValueError
    result = 10 / num                      # may raise ZeroDivisionError
except ZeroDivisionError:
    print("Error: Cannot divide by zero!")
except ValueError:
    print("Error: Invalid input! Please enter a valid integer.")`, null, 'Separate except blocks'),
                code(`try:
    num = int(input("Enter a number: "))
    result = 10 / num
except (ZeroDivisionError, ValueError) as e:
    print("An error occurred:", e)`, null, 'One except for several types'),
                { t: 'h', text: 'The finally block' },
                { t: 'p', text: '`finally` **always** runs, whether or not an error happened. Use it to release resources such as files and database connections.' },
                code(`try:
    file = open("data.txt", "r")
    content = file.read()
except FileNotFoundError:
    print("Error: File not found!")
finally:
    print("Cleanup done.")`, `Error: File not found!
Cleanup done.`),
                { t: 'warn', text: 'If `open()` itself fails, `file` does not exist, so calling `file.close()` in `finally` would raise a new error. A `with open(...)` block avoids the problem.' },
                { t: 'h', text: 'Raising exceptions' },
                code(`age = int(input("Enter your age: "))
if age < 18:
    raise ValueError("You must be at least 18 years old.")`, `Traceback (most recent call last):
  File "script.py", line 3, in <module>
ValueError: You must be at least 18 years old.`, 'Output if age < 18'),
                { t: 'h', text: 'Defining custom exceptions' },
                code(`class NegativeNumberError(Exception):
    """Custom exception for negative numbers"""
    pass

num = int(input("Enter a number: "))
if num < 0:
    raise NegativeNumberError("Negative numbers are not allowed!")`),
                { t: 'points', items: ['`try` holds risky code, `except` handles the error, `finally` always runs.', 'Catch specific exceptions, not everything.', '`raise` creates an error on purpose; subclass `Exception` for your own types.'] },
            ],
        },
        {
            id: 'oop', title: 'Object-Oriented Programming', time: 18,
            summary: 'Classes and objects, constructors, inheritance, polymorphism, encapsulation, abstraction and magic methods.',
            blocks: [
                { t: 'p', text: '**Object-Oriented Programming (OOP)** organises code around **objects** that bundle data (attributes) and behaviour (methods). In Python everything is an object: numbers, strings, functions and classes.' },
                { t: 'h', text: 'Classes and objects' },
                { t: 'list', items: ['**Class:** a blueprint for creating objects.', '**Object:** an instance of a class.'] },
                code(`class Car:
    brand = "Toyota"

car1 = Car()            # creating an object (instance)
print(car1.brand)`, 'Toyota'),
                { t: 'h', text: 'The __init__ constructor' },
                { t: 'p', text: '`__init__` is a special method (the constructor) that runs when an object is created and sets up its attributes. `self` refers to the object itself.' },
                code(`class Car:
    def __init__(self, brand, model):
        self.brand = brand      # instance variable
        self.model = model      # instance variable

car1 = Car("Toyota", "Corolla")
car2 = Car("Honda", "Civic")

print(car1.brand, car1.model)
print(car2.brand, car2.model)`, `Toyota Corolla
Honda Civic`),
                { t: 'h', text: 'Instance and class variables' },
                { t: 'list', items: ['**Instance variables** are defined inside `__init__` and belong to one object.', '**Class variables** are defined outside `__init__` and are shared by all objects.'] },
                code(`class Employee:
    company = "TechCorp"                 # class variable

    def __init__(self, name, salary):
        self.name = name                 # instance variable
        self.salary = salary             # instance variable

emp1 = Employee("Alice", 50000)
emp2 = Employee("Bob", 60000)
print(emp1.company, emp2.company)

Employee.company = "NewTech"             # change it for everyone
print(emp1.company, emp2.company)`, `TechCorp TechCorp
NewTech NewTech`),
                { t: 'h', text: 'Inheritance' },
                { t: 'p', text: 'Inheritance lets a class reuse the attributes and methods of another class.' },
                { t: 'diagram', name: 'py-inherit', caption: 'Common shapes of inheritance. Hybrid inheritance combines more than one of these.' },
                { t: 'table', plain: true, head: ['Type', 'Meaning'], rows: [
                    ['Single', 'One class inherits from another'], ['Multiple', 'A class inherits from several classes'], ['Multilevel', 'A class inherits from a derived class'],
                    ['Hierarchical', 'Several classes inherit from one parent'], ['Hybrid', 'A combination of the above'],
                ] },
                code(`class Animal:
    def speak(self):
        print("Animal makes a sound")

class Dog(Animal):          # Dog inherits from Animal
    def speak(self):
        print("Dog barks")

dog = Dog()
dog.speak()`, 'Dog barks', 'Single inheritance'),
                { t: 'h', text: 'Method overriding and polymorphism' },
                { t: 'p', text: '**Overriding:** a subclass redefines a method of its parent. **Polymorphism:** different objects can be used through the same interface, each behaving in its own way.' },
                code(`class Parent:
    def show(self):
        print("This is the parent class")

class Child(Parent):
    def show(self):
        print("This is the child class")

obj = Child()
obj.show()`, 'This is the child class', 'Method overriding'),
                code(`class Bird:
    def fly(self):
        print("Birds can fly")

class Penguin(Bird):
    def fly(self):
        print("Penguins cannot fly")

def flying_test(bird):
    bird.fly()

flying_test(Bird())
flying_test(Penguin())`, `Birds can fly
Penguins cannot fly`, 'Polymorphism'),
                { t: 'h', text: 'Encapsulation' },
                { t: 'p', text: 'Encapsulation hides internal data. Attributes whose names start with a double underscore (`__`) are private.' },
                code(`class BankAccount:
    def __init__(self, balance):
        self.__balance = balance        # private variable

    def deposit(self, amount):
        self.__balance += amount

    def get_balance(self):
        return self.__balance

account = BankAccount(1000)
account.deposit(500)
print(account.get_balance())

# print(account.__balance)             # AttributeError`, '1500'),
                { t: 'h', text: 'Abstraction' },
                { t: 'p', text: 'Abstraction hides complex details and shows only what matters. An **abstract class** cannot be instantiated and forces its subclasses to implement certain methods.' },
                code(`from abc import ABC, abstractmethod

class Animal(ABC):                # abstract class
    @abstractmethod
    def sound(self):
        pass

class Dog(Animal):
    def sound(self):
        return "Bark"

class Cat(Animal):
    def sound(self):
        return "Meow"

print(Dog().sound())
print(Cat().sound())`, `Bark
Meow`),
                { t: 'h', text: 'Magic (dunder) methods' },
                { t: 'p', text: 'Magic methods start and end with double underscores. Python calls them automatically in response to operations on your objects.' },
                { t: 'table', head: ['Method', 'Description'], rows: [
                    ['__init__(self, ...)', 'Constructor, initialises the object'], ['__str__(self)', 'String shown by print()'], ['__len__(self)', 'Behaviour of len(obj)'],
                    ['__add__(self, other)', 'Behaviour of obj1 + obj2'], ['__eq__(self, other)', 'Behaviour of obj1 == obj2'],
                ] },
                code(`class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

    def __str__(self):
        return f"Book: {self.title}, Pages: {self.pages}"

    def __len__(self):
        return self.pages

book = Book("Python Programming", 450)
print(book)
print(len(book))`, `Book: Python Programming, Pages: 450
450`),
                { t: 'points', items: ['A class is the blueprint; an object is one instance of it.', '`__init__` sets up each new object; `self` is the object.', 'Inheritance reuses code, overriding customises it, polymorphism lets different objects share one interface.', 'Use `__name` for private data and `ABC` for abstract classes.'] },
            ],
        },
        {
            id: 'libraries', title: 'Python Libraries Overview', time: 14,
            summary: 'NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, Requests, BeautifulSoup, Selenium and databases.',
            blocks: [
                { t: 'p', text: 'Python has a huge ecosystem of libraries for data analysis, machine learning, web scraping, automation and databases. Install each with `pip install <name>`.' },
                { t: 'table', plain: true, head: ['Area', 'Libraries'], rows: [
                    ['Data analysis', 'NumPy, Pandas'], ['Data visualization', 'Matplotlib, Seaborn'], ['Machine learning', 'Scikit-learn'],
                    ['Web scraping', 'Requests, BeautifulSoup'], ['Automation', 'Selenium'], ['Databases', 'SQLite (sqlite3), MySQL'],
                ] },
                { t: 'h', text: 'Data analysis' },
                { t: 'p', text: '**NumPy** (Numerical Python) provides fast multi-dimensional arrays, mathematical functions, linear algebra and random numbers.' },
                code(`import numpy as np

arr = np.array([1, 2, 3, 4, 5])
print(arr)

arr2D = arr.reshape(1, 5)          # change the shape
print(arr2D)

print(arr ** 2)                    # maths on the whole array`, `[1 2 3 4 5]
[[1 2 3 4 5]]
[ 1  4  9 16 25]`, 'NumPy'),
                { t: 'p', text: '**Pandas** gives you `DataFrame` and `Series` structures for structured data, and reads and writes CSV, Excel, SQL and JSON.' },
                code(`import pandas as pd

data = {'Name': ['Alice', 'Bob', 'Charlie'], 'Age': [25, 30, 35]}
df = pd.DataFrame(data)

print(df.head())             # first rows
print(df['Name'])            # one column
# df = pd.read_csv("data.csv")   # load a CSV file`, `      Name  Age
0    Alice   25
1      Bob   30
2  Charlie   35
0      Alice
1        Bob
2    Charlie
Name: Name, dtype: object`, 'Pandas'),
                { t: 'h', text: 'Data visualization' },
                { t: 'p', text: '**Matplotlib** draws 2D and 3D charts: line, bar, histogram and scatter plots.' },
                code(`import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [10, 20, 25, 30, 40]

plt.plot(x, y, marker='o')
plt.xlabel("X-axis")
plt.ylabel("Y-axis")
plt.title("Line Plot Example")
plt.show()`, null, 'Matplotlib: line plot'),
                { t: 'p', text: '**Seaborn** builds on Matplotlib and makes statistical charts look better: heatmaps, pair plots and violin plots.' },
                code(`import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt

data = np.random.rand(5, 5)
sns.heatmap(data, annot=True, cmap="coolwarm")
plt.show()`, null, 'Seaborn: heatmap'),
                { t: 'h', text: 'Machine learning' },
                { t: 'p', text: '**Scikit-learn** covers classification, regression, clustering and model evaluation.' },
                code(`from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

model = LinearRegression()
model.fit(X, y)                       # train

print(model.predict([[6]]))           # predict a new value`, '[12.]', 'Linear regression'),
                { t: 'h', text: 'Web scraping' },
                code(`import requests

response = requests.get("https://www.example.com")
print(response.text)               # the page's HTML`, null, 'Requests: fetch a page'),
                code(`from bs4 import BeautifulSoup

html = "<html><head><title>Sample Page</title></head><body></body></html>"
soup = BeautifulSoup(html, "html.parser")
print(soup.title.text)`, 'Sample Page', 'BeautifulSoup: parse HTML'),
                { t: 'h', text: 'Automation' },
                { t: 'p', text: '**Selenium** controls a real browser: clicking buttons, filling forms and moving between pages.' },
                code(`from selenium import webdriver
from selenium.webdriver.common.keys import Keys

driver = webdriver.Chrome()              # open Chrome
driver.get("https://www.google.com")

search_box = driver.find_element("name", "q")
search_box.send_keys("Python")
search_box.send_keys(Keys.RETURN)

driver.quit()                            # close the browser`, null, 'Selenium: a Google search'),
                { t: 'h', text: 'Working with databases' },
                { t: 'p', text: '**SQLite** is a lightweight embedded database that ships with Python (the `sqlite3` module).' },
                code(`import sqlite3

conn = sqlite3.connect("example.db")        # create or open a database
cursor = conn.cursor()

cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)")
cursor.execute("INSERT INTO users (name) VALUES ('Alice')")
conn.commit()                               # save the change

cursor.execute("SELECT * FROM users")
print(cursor.fetchall())

conn.close()`, "[(1, 'Alice')]", 'SQLite'),
                { t: 'p', text: '**MySQL** is a scalable relational database. Install the connector with `pip install mysql-connector-python`.' },
                code(`import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="testdb"
)
cursor = conn.cursor()

cursor.execute("CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100))")
cursor.execute("INSERT INTO users (name) VALUES ('Alice')")
conn.commit()

cursor.execute("SELECT * FROM users")
print(cursor.fetchall())
conn.close()`, null, 'MySQL'),
                { t: 'note', text: 'For real applications, pass values with placeholders, for example `cursor.execute("INSERT INTO users (name) VALUES (?)", (name,))` in SQLite, instead of building SQL text yourself. This prevents SQL injection.' },
                { t: 'points', items: ['NumPy and Pandas for data, Matplotlib and Seaborn for charts, Scikit-learn for ML.', 'Requests fetches pages, BeautifulSoup reads them, Selenium drives the browser.', '`sqlite3` is built in; MySQL needs a connector package.'] },
            ],
        },
        {
            id: 'apis', title: 'Working with APIs', time: 12,
            summary: 'REST APIs, making HTTP requests, parsing JSON, using public APIs and building a small API with Flask.',
            blocks: [
                { t: 'p', text: 'An **API** (Application Programming Interface) lets applications talk to each other using agreed rules. **RESTful** APIs use standard HTTP methods.' },
                { t: 'table', head: ['HTTP method', 'Purpose'], rows: [['GET', 'Retrieve data'], ['POST', 'Send (create) data'], ['PUT', 'Update data'], ['DELETE', 'Remove data']] },
                { t: 'diagram', name: 'py-rest', caption: 'The client sends a request; the API answers with JSON, usually after asking a database.' },
                code(`https://api.example.com/users/1`, `{
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
}`, 'An endpoint and the JSON it may return'),
                { t: 'h', text: 'Making HTTP requests' },
                code(`pip install requests`, null, 'Install'),
                code(`import requests

response = requests.get("https://jsonplaceholder.typicode.com/posts/1")

if response.status_code == 200:          # 200 means success
    print(response.json())
else:
    print("Failed to retrieve data")`, null, 'GET request'),
                code(`import requests

url = "https://jsonplaceholder.typicode.com/posts"
data = {
    "title": "New Post",
    "body": "This is a sample post",
    "userId": 1
}

response = requests.post(url, json=data)
print(response.json())`, null, 'POST request'),
                { t: 'h', text: 'Parsing JSON data' },
                code(`import json

json_data = '{"name": "Alice", "age": 25, "city": "New York"}'
data = json.loads(json_data)          # JSON string to dict
print(data["name"])

python_dict = {"name": "Bob", "age": 30, "city": "Los Angeles"}
print(json.dumps(python_dict, indent=4))   # dict to JSON string`, `Alice
{
    "name": "Bob",
    "age": 30,
    "city": "Los Angeles"
}`),
                { t: 'h', text: 'Working with public APIs' },
                code(`import requests

api_key = "your_api_key_here"
city = "London"
url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}"

response = requests.get(url)
weather_data = response.json()
print(f"Weather in {city}: {weather_data['weather'][0]['description']}")`, null, 'OpenWeather'),
                { t: 'note', text: 'OpenWeather needs a free account to get an API key. Keep keys out of your code in real projects (use environment variables).' },
                code(`import requests

username = "octocat"
url = f"https://api.github.com/users/{username}"

response = requests.get(url)
data = response.json()
print(f"GitHub User: {data['login']}")
print(f"Public Repos: {data['public_repos']}")`, null, 'GitHub API'),
                { t: 'h', text: 'Creating a simple API with Flask' },
                code(`pip install flask`, null, 'Install'),
                code(`from flask import Flask, jsonify

app = Flask(__name__)

users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
]

@app.route("/users", methods=["GET"])
def get_users():
    return jsonify(users)

@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = next((u for u in users if u["id"] == user_id), None)
    if user:
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)`, null, 'api.py'),
                { t: 'p', text: 'Run the script and open `http://127.0.0.1:5000/users` in your browser to see the response.' },
                { t: 'points', items: ['Use `requests.get()` and `requests.post()` to talk to APIs; `.json()` converts the reply to Python data.', 'Check `response.status_code` (200 = OK).', 'Flask turns Python functions into API endpoints with `@app.route`.'] },
            ],
        },
        {
            id: 'flask', title: 'Web Development with Flask', time: 10,
            summary: 'Build web pages with Flask: setup, routes and views, dynamic URLs and handling forms.',
            blocks: [
                { t: 'p', text: 'Python is widely used for web development with frameworks like Flask and Django. **Flask** is a lightweight "micro" framework that gives you the essentials without extra complexity, ideal for small to medium applications and APIs.' },
                { t: 'h', text: 'Setting up Flask' },
                code(`pip install flask`, null, 'Install'),
                code(`from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, Flask!"

if __name__ == "__main__":
    app.run(debug=True)`, null, 'app.py'),
                { t: 'p', text: 'Save it as `app.py`, run `python app.py` and open `http://127.0.0.1:5000/` to see **Hello, Flask!**' },
                { t: 'h', text: 'Creating routes and views' },
                { t: 'p', text: 'A **route** maps a URL to a Python function (the **view**) that builds the response.' },
                code(`from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Welcome to the Home Page"

@app.route("/about")
def about():
    return "This is the About Page"

if __name__ == "__main__":
    app.run(debug=True)`, null, 'Multiple routes'),
                { t: 'p', text: 'Visiting `http://127.0.0.1:5000/about` shows **This is the About Page**.' },
                { t: 'h', text: 'Dynamic routes' },
                { t: 'p', text: 'Put a variable inside `< >` to pass part of the URL into your function.' },
                code(`@app.route("/user/<name>")
def user(name):
    return f"Hello, {name}!"`, 'http://127.0.0.1:5000/user/Nihar  ->  Hello, Nihar!'),
                { t: 'h', text: 'Handling forms' },
                { t: 'p', text: 'A route can accept both `GET` (show the form) and `POST` (receive the submitted data). The form values arrive in `request.form`.' },
                code(`from flask import Flask, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        name = request.form["name"]
        return f"Hello, {name}!"
    return '''
        <form method="post">
            Name: <input type="text" name="name">
            <input type="submit">
        </form>
    '''

if __name__ == "__main__":
    app.run(debug=True)`, null, 'A simple form'),
                { t: 'p', text: 'The page shows the form; after you submit it, Flask returns a personalised greeting.' },
                { t: 'note', text: 'For larger forms with validation and CSRF protection, install `Flask-WTF` (`pip install flask-wtf`). Never run with `debug=True` on a public server.' },
                { t: 'points', items: ['`@app.route()` connects a URL to a function.', '`<name>` in a route passes URL parts as arguments.', '`request.form` holds submitted form data; allow `POST` in `methods`.'] },
            ],
        },
    ],
};

// Small diagrams drawn as inline SVG (rendered by NotesPage).
export const diagrams = {
    'py-repl': {
        w: 640, h: 150,
        boxes: [
            { x: 20, y: 40, w: 120, h: 50, text: 'Read', tone: 'a' }, { x: 180, y: 40, w: 120, h: 50, text: 'Eval', tone: 'b' },
            { x: 340, y: 40, w: 120, h: 50, text: 'Print', tone: 'c' }, { x: 500, y: 40, w: 120, h: 50, text: 'Loop', tone: 'plain' },
        ],
        arrows: [{ from: [140, 65], to: [180, 65] }, { from: [300, 65], to: [340, 65] }, { from: [460, 65], to: [500, 65] }],
        texts: [{ x: 20, y: 122, text: 'You type a line  →  Python runs it  →  shows the result  →  waits for the next line', accent: true }],
    },
    'py-scope': {
        w: 640, h: 220,
        boxes: [
            { x: 10, y: 10, w: 620, h: 200, text: 'Global scope        x = 10', top: true, tone: 'plain' },
            { x: 60, y: 70, w: 420, h: 110, text: 'def my_function()        x = 5  (local)', top: true, tone: 'b' },
        ],
        texts: [{ x: 80, y: 150, text: 'print(x) here shows 5', accent: true }, { x: 500, y: 130, text: 'print(x) here', accent: true }, { x: 500, y: 150, text: 'shows 10', accent: true }],
    },
    'py-inherit': {
        w: 760, h: 240,
        boxes: [
            { x: 20, y: 40, w: 100, h: 34, text: 'Animal', tone: 'b' }, { x: 20, y: 150, w: 100, h: 34, text: 'Dog', tone: 'a' },
            { x: 190, y: 40, w: 100, h: 34, text: 'Grandparent', tone: 'b' }, { x: 190, y: 105, w: 100, h: 34, text: 'Parent', tone: 'a' }, { x: 190, y: 170, w: 100, h: 34, text: 'Child', tone: 'c' },
            { x: 400, y: 40, w: 100, h: 34, text: 'Parent', tone: 'b' }, { x: 340, y: 150, w: 90, h: 34, text: 'Child 1', tone: 'a' }, { x: 470, y: 150, w: 90, h: 34, text: 'Child 2', tone: 'a' },
            { x: 620, y: 40, w: 80, h: 34, text: 'Mother', tone: 'b' }, { x: 710, y: 40, w: 60, h: 34, text: 'Father', tone: 'b' }, { x: 640, y: 150, w: 90, h: 34, text: 'Child', tone: 'c' },
        ],
        arrows: [
            { from: [70, 74], to: [70, 150] },
            { from: [240, 74], to: [240, 105] }, { from: [240, 139], to: [240, 170] },
            { from: [450, 74], to: [385, 150] }, { from: [450, 74], to: [515, 150] },
            { from: [660, 74], to: [675, 150] }, { from: [740, 74], to: [700, 150] },
        ],
        texts: [{ x: 20, y: 24, text: 'SINGLE', head: true }, { x: 190, y: 24, text: 'MULTILEVEL', head: true }, { x: 400, y: 24, text: 'HIERARCHICAL', head: true }, { x: 620, y: 24, text: 'MULTIPLE', head: true }],
    },
    'py-rest': {
        w: 700, h: 170,
        boxes: [
            { x: 10, y: 45, w: 150, h: 80, text: 'Client (Python)', tone: 'a' }, { x: 275, y: 45, w: 150, h: 80, text: 'API server', tone: 'b' }, { x: 540, y: 45, w: 150, h: 80, text: 'Database', tone: 'c' },
        ],
        arrows: [{ from: [160, 70], to: [275, 70], label: 'GET /users/1' }, { from: [275, 105], to: [160, 105], label: 'JSON + 200 OK' }, { from: [425, 85], to: [540, 85], label: 'query' }],
    },
};
