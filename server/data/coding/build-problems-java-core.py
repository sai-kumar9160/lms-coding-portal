# Java practice (240 problems): jq() builds a complete `Main.java` from a body, optional top-level classes and optional members of Main,
# and writes the same input-reading lines into the starter, so the two always agree. build-problems.py runs the java-*.py files in order.
import textwrap

JC = dict(track="Java", lang="java", languages=["java"])


def _dd(code):
    return textwrap.dedent(code).strip("\n")


def _indent(code, n):
    return "\n".join((" " * n + line) if line.strip() else "" for line in code.split("\n"))


def jreads(vars):
    out = []
    for kind, names in vars:
        if kind == "arr":  # "n a": a count and an int array
            c, a = names.split()
            out += [f"int {c} = in.nextInt();", f"int[] {a} = new int[{c}];", f"for (int i = 0; i < {c}; i++) {a}[i] = in.nextInt();"]
        elif kind == "words":  # "n w": a count and n words
            c, a = names.split()
            out += [f"int {c} = in.nextInt();", f"String[] {a} = new String[{c}];", f"for (int i = 0; i < {c}; i++) {a}[i] = in.next();"]
        elif kind == "mat":  # "r c m"
            r, c, m = names.split()
            out += [f"int {r} = in.nextInt(), {c} = in.nextInt();", f"int[][] {m} = new int[{r}][{c}];", f"for (int i = 0; i < {r}; i++) for (int j = 0; j < {c}; j++) {m}[i][j] = in.nextInt();"]
        elif kind == "line":
            out.append(f"String {names} = in.nextLine();")
        elif kind == "char":
            out.append("char " + ", ".join(f"{n} = in.next().charAt(0)" for n in names.split()) + ";")
        else:
            call = {"int": "nextInt", "long": "nextLong", "double": "nextDouble", "boolean": "nextBoolean", "String": "next"}[kind]
            out.append(f"{kind} " + ", ".join(f"{n} = in.{call}()" for n in names.split()) + ";")
    return out


def jq(slug, title, difficulty, topic, statement, input_format, output_format, *rest, imports="", classes="", members="", scanner=False, samples=2, stub=""):
    # rest is (body, tests, vars) or, with a constraints line first, (constraints, body, tests, vars)
    cons, (body, tests, vars) = ("Values fit in an int.", rest) if len(rest) == 3 else (rest[0], rest[1:])
    reads = jreads(vars)
    uses_in = bool(reads) or scanner
    head = "import java.util.*;\n" + "".join(f"import {i};\n" for i in imports.split() if i)
    cls = (_dd(classes) + "\n\n") if classes else ""
    mem = (_indent(_dd(members), 4) + "\n\n") if members else ""
    scan = ["Scanner in = new Scanner(System.in);"] if uses_in else []
    inner = _indent("\n".join(["Locale.setDefault(Locale.US);"] + scan + reads) + "\n" + _dd(body), 8)
    code = f"{head}\n{cls}public class Main {{\n{mem}    public static void main(String[] args) throws Exception {{\n{inner}\n    }}\n}}"
    problem(slug, title, difficulty, topic, statement, input_format, output_format, cons, code, tests, samples=samples, **JC)
    st_in = _indent("\n".join(scan + reads), 8)
    st_cls = (_dd(stub) + "\n\n") if stub else ""
    P[-1]["starters"] = {"java": f"{head}\n{st_cls}public class Main {{\n    public static void main(String[] args) {{\n{st_in}{chr(10) if st_in else ''}        \n    }}\n}}\n"}


T = "Variables and operators"
NOIN = "There is no input."
ONE = "One integer."
TWO = "One line with two integers."
jq("j-hello-world", "Hello, World!", "EASY", T, "Print `Hello, World!` on the first line and `Welcome to Java` on the second, using `System.out.println()`.", NOIN, "Two lines.", "None.",
   'System.out.println("Hello, World!");\nSystem.out.println("Welcome to Java");', [""], (), samples=1)
jq("j-arithmetic-operators", "Arithmetic Operators", "EASY", T, "Read two integers `a` and `b` (`b` is not 0). Print `Sum`, `Difference`, `Product`, `Quotient` (integer division) and `Remainder`, one per line, like `Sum: 7`.", TWO, "Five lines.", "|a|, |b| <= 10^6, b != 0",
   'System.out.println("Sum: " + (a + b));\nSystem.out.println("Difference: " + (a - b));\nSystem.out.println("Product: " + ((long) a * b));\nSystem.out.println("Quotient: " + (a / b));\nSystem.out.println("Remainder: " + (a % b));', ["7 3", "-7 3", "10 5", "1 1", "100 7"], [("int", "a b")])
jq("j-widening", "Implicit Widening", "EASY", T, "A smaller type fits into a bigger one without a cast. Read an integer `v` (-128 to 127), store it in a `byte`, then in an `int`, then in a `double`. Print `byte: <b>`, `int: <i>` and `double: <d>` (the double prints like `25.0`).", ONE, "Three lines.", "-128 <= v <= 127",
   'byte b = (byte) v;\nint i = b;\ndouble d = i;\nSystem.out.println("byte: " + b);\nSystem.out.println("int: " + i);\nSystem.out.println("double: " + d);', ["25", "-128", "127", "0", "-1"], [("int", "v")])
jq("j-narrowing", "Explicit Narrowing", "EASY", T, "Read a `double` and cast it to `int` with `(int)`; the fraction is cut off, not rounded. Print `Double: <x>` and `Int: <n>`.", "One decimal number.", "Two lines.", "|x| <= 10^6",
   'int n = (int) x;\nSystem.out.println("Double: " + x);\nSystem.out.println("Int: " + n);', ["9.87", "-9.87", "5.0", "0.99", "123.456"], [("double", "x")])
jq("j-relational-operators", "Relational Operators", "EASY", T, "Read two integers and print the result of each comparison (`true` or `false`) in the form `a > b: true`, in the order `>`, `<`, `>=`, `<=`, `==`, `!=`.", TWO, "Six lines.", "|a|, |b| <= 10^6",
   'System.out.println("a > b: " + (a > b));\nSystem.out.println("a < b: " + (a < b));\nSystem.out.println("a >= b: " + (a >= b));\nSystem.out.println("a <= b: " + (a <= b));\nSystem.out.println("a == b: " + (a == b));\nSystem.out.println("a != b: " + (a != b));', ["3 5", "5 3", "4 4", "-1 -2", "0 0"], [("int", "a b")])
jq("j-logical-and", "Logical AND: a Range", "EASY", T, "Print `true` if the number lies in the range 10 to 50 (both included), otherwise `false`. Use `&&`.", ONE, "`true` or `false`.", "|n| <= 1000",
   'System.out.println(n >= 10 && n <= 50);', ["25", "10", "50", "9", "51", "-3"], [("int", "n")])
jq("j-logical-or", "Logical OR: Vowel Check", "EASY", T, "Read one character. Print `true` if it is a vowel (a, e, i, o, u in either case), otherwise `false`. Use `||`.", "One character.", "`true` or `false`.", "One letter.",
   "boolean vowel = c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' || c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U';\nSystem.out.println(vowel);", ["a", "B", "E", "z", "U"], [("char", "c")])
jq("j-logical-not", "Logical NOT", "EASY", T, "Read a boolean flag (`true` or `false`). Print `Flag: <flag>` and `Inverted: <!flag>`.", "`true` or `false`.", "Two lines.", "The flag is true or false.",
   'System.out.println("Flag: " + flag);\nSystem.out.println("Inverted: " + !flag);', ["true", "false"], [("boolean", "flag")], samples=2)
jq("j-bitwise-and", "Bitwise AND", "EASY", T, "Read two integers and print `a & b`.", TWO, "The result.", "0 <= a, b <= 10^9",
   'System.out.println(a & b);', ["12 10", "255 15", "0 7", "1023 512", "5 5"], [("int", "a b")])
jq("j-bitwise-or", "Bitwise OR", "EASY", T, "Read two integers and print `a | b`.", TWO, "The result.", "0 <= a, b <= 10^9",
   'System.out.println(a | b);', ["12 10", "255 15", "0 7", "1023 512", "5 5"], [("int", "a b")])
jq("j-bitwise-xor-swap", "Bitwise XOR and Swapping", "MEDIUM", T, "Print `a ^ b` on the first line. Then swap `a` and `b` using only XOR (no third variable) and print `After swap: <a> <b>`.", TWO, "Two lines.", "0 <= a, b <= 10^9",
   'System.out.println(a ^ b);\na = a ^ b;\nb = a ^ b;\na = a ^ b;\nSystem.out.println("After swap: " + a + " " + b);', ["12 10", "5 9", "0 7", "100 100", "1023 512"], [("int", "a b")])
jq("j-bitwise-complement", "Bitwise Complement", "EASY", T, "Read an integer and print `~n`. (`~n` equals `-n - 1`.)", ONE, "The result.", "|n| <= 10^9",
   'System.out.println(~n);', ["5", "0", "-1", "255", "-100"], [("int", "n")])
jq("j-left-shift", "Left Shift Multiplies", "EASY", T, "Shifting left by 3 multiplies by 8. Read `n` and print `n << 3`.", ONE, "The result.", "|n| <= 10^6",
   'System.out.println(n << 3);', ["5", "0", "-4", "1000", "12345"], [("int", "n")])
jq("j-right-shift", "Right Shift Divides", "EASY", T, "Shifting right by 2 divides a positive number by 4 (dropping the fraction). Read `n` and print `n >> 2`.", ONE, "The result.", "0 <= n <= 10^9",
   'System.out.println(n >> 2);', ["20", "3", "0", "1000", "999999999"], [("int", "n")])
jq("j-compound-add-sub", "Compound Assignment: += and -=", "EASY", T, "Read `x`. Apply `x += 5;` and print `x`, then `x -= 3;` and print `x` again.", ONE, "Two lines.", "|x| <= 10^6",
   'x += 5;\nSystem.out.println(x);\nx -= 3;\nSystem.out.println(x);', ["10", "0", "-5", "100", "7"], [("int", "x")])
jq("j-compound-mul-div", "Compound Assignment: *= and /=", "EASY", T, "Read `x`. Apply `x *= 4;` and print `x`, then `x /= 3;` (integer division) and print `x` again.", ONE, "Two lines.", "|x| <= 10^6",
   'x *= 4;\nSystem.out.println(x);\nx /= 3;\nSystem.out.println(x);', ["10", "0", "-5", "100", "7"], [("int", "x")])
jq("j-unary-signs", "Unary Plus and Minus", "EASY", T, "Read `v`. Print `-v`, `+v` and `-(-v)` on one line separated by spaces.", ONE, "Three numbers.", "|v| <= 10^6",
   'System.out.println((-v) + " " + (+v) + " " + (-(-v)));', ["25", "-25", "0", "1000000", "-7"], [("int", "v")])
jq("j-pre-increment", "Pre-Increment", "EASY", T, "`++x` adds 1 first and then gives the new value. Read `x`, print `++x` on the first line and `x` on the second.", ONE, "Two lines.", "|x| <= 10^6",
   'System.out.println(++x);\nSystem.out.println(x);', ["5", "0", "-3", "99", "10"], [("int", "x")])
jq("j-post-increment", "Post-Increment", "EASY", T, "`x++` gives the old value and then adds 1. Read `x`. Print `x++`, then `x`. Then take a second variable `y` equal to the original `x` and print `++y`, then `y`, to compare the two forms. That is four lines in total.", ONE, "Four lines.", "|x| <= 10^6",
   'int y = x;\nSystem.out.println(x++);\nSystem.out.println(x);\nSystem.out.println(++y);\nSystem.out.println(y);', ["5", "0", "-3", "99", "10"], [("int", "x")])
jq("j-decrement-operators", "Pre- and Post-Decrement", "EASY", T, "Read `x`. Print `x--`, then `x`, then `--x`, then `x`, one value per line.", ONE, "Four lines.", "|x| <= 10^6",
   'System.out.println(x--);\nSystem.out.println(x);\nSystem.out.println(--x);\nSystem.out.println(x);', ["5", "0", "-3", "99", "10"], [("int", "x")])
jq("j-ternary-max", "Maximum with the Ternary Operator", "EASY", T, "Print the larger of two integers using a single `? :` expression.", TWO, "The larger number.", "|a|, |b| <= 10^6",
   'System.out.println(a > b ? a : b);', ["3 9", "9 3", "-4 -9", "5 5", "0 -1"], [("int", "a b")])
jq("j-nested-ternary-min", "Minimum of Three with Nested Ternary", "EASY", T, "Print the smallest of three integers using nested ternary operators.", "One line with three integers.", "The smallest.", "|values| <= 10^6",
   'System.out.println(a < b ? (a < c ? a : c) : (b < c ? b : c));', ["1 2 3", "9 4 2", "5 1 7", "-1 -5 -3", "8 8 8"], [("int", "a b c")])
jq("j-scanner-input", "Scanner: Name, Age and Salary", "EASY", T, "Read a name (one word), an age and a salary (a decimal). Print `Name: <name>`, `Age: <age>` and `Salary: <salary>` with two decimals.", "One line: `name age salary`.", "Three lines.", "age is an int, salary a decimal",
   'System.out.println("Name: " + name);\nSystem.out.println("Age: " + age);\nSystem.out.printf("Salary: %.2f%n", salary);', ["Asha 25 50000.5", "Ravi 40 72000", "K 18 0", "Meena 33 1234.567", "Sana 60 99999.99"], [("String", "name"), ("int", "age"), ("double", "salary")])
jq("j-buffered-reader", "BufferedReader: Read a Line", "EASY", T, "Read one line of text with `BufferedReader` and `InputStreamReader`, and print `You typed: <line>`.", "One line of text.", "One line.", "At most 200 characters",
   'BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\nString line = br.readLine();\nSystem.out.println("You typed: " + line);', ["hello world", "Java", "a b  c", "12345", "Next Byte"], (), imports="java.io.*")
jq("j-fahrenheit-to-celsius", "Fahrenheit to Celsius", "EASY", T, "Read a temperature in Fahrenheit and print Celsius `(f - 32) * 5 / 9` with two decimals.", "One decimal.", "The Celsius value.", "|f| <= 1000",
   'System.out.printf("%.2f%n", (f - 32) * 5 / 9);', ["32", "212", "-40", "98.6", "77"], [("double", "f")])
jq("j-simple-interest", "Simple Interest", "EASY", T, "Read principal `p`, rate `r` (percent per year) and time `t` (years). Print the simple interest `p * r * t / 100` with two decimals.", "One line: `p r t`.", "The interest.", "Values are non-negative decimals",
   'System.out.printf("%.2f%n", p * r * t / 100);', ["1000 5 2", "5000 7.5 3", "0 10 1", "250.5 4 1.5", "100000 8 10"], [("double", "p r t")])
jq("j-compound-interest", "Compound Interest", "EASY", T, "Read principal `p`, rate `r` (percent per year) and time `t` (years). The amount is `p * (1 + r / 100)^t`; print the compound interest (amount minus principal) with two decimals. Use `Math.pow`.", "One line: `p r t`.", "The interest.", "Values are non-negative decimals",
   'double amount = p * Math.pow(1 + r / 100, t);\nSystem.out.printf("%.2f%n", amount - p);', ["1000 5 2", "5000 7.5 3", "0 10 1", "250 4 1.5", "100000 8 10"], [("double", "p r t")])
jq("j-rectangle-metrics", "Rectangle Area and Perimeter", "EASY", T, "Read length and breadth. Print `Area: <a>` and `Perimeter: <p>` with two decimals.", "One line: `length breadth`.", "Two lines.", "Positive decimals",
   'System.out.printf("Area: %.2f%nPerimeter: %.2f%n", l * b, 2 * (l + b));', ["5 3", "2.5 4", "10 10", "1 1", "7.25 3.5"], [("double", "l b")])
jq("j-circle-metrics", "Circle Area and Circumference", "EASY", T, "Read the radius. Print `Area: <a>` and `Circumference: <c>` with two decimals, using `Math.PI`.", "One decimal.", "Two lines.", "0 <= r <= 1000",
   'System.out.printf("Area: %.2f%nCircumference: %.2f%n", Math.PI * r * r, 2 * Math.PI * r);', ["1", "2.5", "0", "10", "7.25"], [("double", "r")])
jq("j-seconds-converter", "Seconds to Hours, Minutes, Seconds", "EASY", T, "Read a number of seconds and print it as `HH:MM:SS` (two digits each; hours may be larger).", ONE, "One line.", "0 <= s <= 10^7",
   'System.out.printf("%02d:%02d:%02d%n", s / 3600, s % 3600 / 60, s % 60);', ["3661", "0", "59", "86399", "10000000"], [("int", "s")])
jq("j-ascii-value", "ASCII Value of a Character", "EASY", T, "Read one character and print its ASCII code, using a cast to `int`.", "One character.", "The code.", "A visible character.",
   'System.out.println((int) c);', ["A", "a", "0", "#", "z"], [("char", "c")])
jq("j-digit-extractor", "Digits of a 3-Digit Number", "EASY", T, "Read a 3-digit number. Print its hundreds, tens and ones digits on one line separated by spaces, using `/` and `%`.", "One 3-digit integer.", "Three digits.", "100 <= n <= 999",
   'System.out.println(n / 100 + " " + n / 10 % 10 + " " + n % 10);', ["123", "100", "999", "450", "708"], [("int", "n")])
jq("j-sum-digits-3", "Sum of the Digits of a 3-Digit Number", "EASY", T, "Read a 3-digit number and print the sum of its digits.", "One 3-digit integer.", "The sum.", "100 <= n <= 999",
   'System.out.println(n / 100 + n / 10 % 10 + n % 10);', ["123", "100", "999", "450", "708"], [("int", "n")])
jq("j-wrapper-limits", "Wrapper Class Limits", "EASY", T, "Print the largest and smallest `Integer`, `Long` and `Double` using the wrapper constants, one per line, as `Integer.MAX_VALUE = ...` and so on (six lines: Integer max, Integer min, Long max, Long min, Double max, Double min).", NOIN, "Six lines.", "None.",
   'System.out.println("Integer.MAX_VALUE = " + Integer.MAX_VALUE);\nSystem.out.println("Integer.MIN_VALUE = " + Integer.MIN_VALUE);\nSystem.out.println("Long.MAX_VALUE = " + Long.MAX_VALUE);\nSystem.out.println("Long.MIN_VALUE = " + Long.MIN_VALUE);\nSystem.out.println("Double.MAX_VALUE = " + Double.MAX_VALUE);\nSystem.out.println("Double.MIN_VALUE = " + Double.MIN_VALUE);', [""], (), samples=1)
jq("j-parse-strings", "Parse Numbers from Strings", "EASY", T, "Read two words: a whole number and a decimal number (as text). Convert them with `Integer.parseInt` and `Double.parseDouble` and print their sum with two decimals.", "One line: two words.", "The sum.", "Valid numbers",
   'int i = Integer.parseInt(a);\ndouble d = Double.parseDouble(b);\nSystem.out.printf("%.2f%n", i + d);', ["10 2.5", "-4 4.25", "0 0", "100 0.01", "7 -7.5"], [("String", "a b")])
jq("j-value-of", "Number to String", "EASY", T, "Read an integer. Convert it with `String.valueOf`, then print `Text: <text>`, `Length: <length>` and `Joined: <text>5` (the text followed by the character 5, which is string joining, not addition).", ONE, "Three lines.", "|n| <= 10^9",
   'String s = String.valueOf(n);\nSystem.out.println("Text: " + s);\nSystem.out.println("Length: " + s.length());\nSystem.out.println("Joined: " + s + 5);', ["123", "-45", "0", "1000000000", "7"], [("int", "n")])
jq("j-math-utilities", "Math Methods", "EASY", T, "Read `x` (a non-negative decimal) and `y` (a decimal). Print, one per line with two decimals: `sqrt(x)`, `pow(x, y)`, `abs(-x)` and `max(x, y)`.", "One line: `x y`.", "Four lines.", "0 <= x <= 1000, 0 <= y <= 5",
   'System.out.printf("%.2f%n%.2f%n%.2f%n%.2f%n", Math.sqrt(x), Math.pow(x, y), Math.abs(-x), Math.max(x, y));', ["16 2", "2 0.5", "0 3", "100 1", "7.5 4"], [("double", "x y")])
jq("j-operator-precedence", "Operator Precedence", "EASY", T, "Read `a b c`. Print `a + b * c` and then `(a + b) * c`, on two lines, to see how parentheses change the order.", "One line with three integers.", "Two lines.", "|values| <= 1000",
   'System.out.println(a + b * c);\nSystem.out.println((a + b) * c);', ["2 3 4", "1 1 1", "-2 5 3", "10 0 7", "100 2 3"], [("int", "a b c")])
jq("j-even-odd-bitwise", "Even or Odd with a Bit", "EASY", T, "The lowest bit of an even number is 0. Print `Even` if `(n & 1) == 0`, otherwise `Odd`.", ONE, "`Even` or `Odd`.", "|n| <= 10^9",
   'System.out.println((n & 1) == 0 ? "Even" : "Odd");', ["4", "7", "0", "-3", "100"], [("int", "n")])
jq("j-power-of-two-bits", "Power of Two with Bits", "EASY", T, "Print `Yes` if the positive number is a power of two (`(n & (n - 1)) == 0`), otherwise `No`.", "One positive integer.", "`Yes` or `No`.", "1 <= n <= 10^9",
   'System.out.println((n & (n - 1)) == 0 ? "Yes" : "No");', ["16", "1", "6", "1024", "1000"], [("int", "n")])
