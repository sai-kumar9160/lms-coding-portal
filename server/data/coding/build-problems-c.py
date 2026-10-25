# More C practice: Variables, Data Types and Operators (50 problems). build-problems.py runs this file after build-problems-extra.py.
# Questions that cannot be judged by output (compile errors, garbage values, undefined behaviour) are rewritten into tasks with a fixed, printable answer;
# the statement says what the original exercise teaches.
CC = dict(track="C", lang="c", languages=["c"])


def cp(slug, title, difficulty, topic, statement, input_format, output_format, constraints, solution, tests, reads="", extra_include="", samples=2):
    problem(slug, title, difficulty, topic, statement, input_format, output_format, constraints, solution, tests, samples=samples, **CC)
    body = "".join(f"    {row}\n" for row in reads.split("\n") if row)
    P[-1]["starters"] = {"c": f"#include <stdio.h>\n{extra_include}\nint main(void) {{\n{body}    \n    return 0;\n}}\n"}


INT = 'int v;\nscanf("%d", &v);'

# ---------------- Variables ----------------
cp("c-local-scope", "Local Variable Scope", "EASY", "Variables",
   "A variable declared inside a function exists only inside that function. Write `void testFunction(int value)` that declares a **local** `int x = value;` and prints `Inside function: x = <x>`. Call it from `main` with the number you read, then print `In main: x is not visible here`.\n\nTry using `x` inside `main` once: the compiler reports an error because `x` is out of scope. Remove that line before you submit.",
   "One integer.", "Two lines as shown.", "-1000 <= value <= 1000",
   r'''#include <stdio.h>

void testFunction(int value) {
    int x = value;
    printf("Inside function: x = %d\n", x);
}

int main(void) {
    int v;
    scanf("%d", &v);
    testFunction(v);
    printf("In main: x is not visible here\n");
    return 0;
}''', ["10", "-4", "0", "999", "55"], reads=INT)

cp("c-global-shadowing", "Global Variable and Shadowing", "EASY", "Variables",
   "Declare a global `int count = 100;`. Inside `main`, read a number and store it in a **local** variable that is also named `count`: the local one *shadows* the global one. Print `Local count: <value>`. Then call a function `showGlobal()` (outside `main`, so it sees the global) that prints `Global count: 100`.",
   "One integer.", "Local value on the first line, then `Global count: 100`.", "-1000 <= value <= 1000",
   r'''#include <stdio.h>

int count = 100;

void showGlobal(void) {
    printf("Global count: %d\n", count);
}

int main(void) {
    int count;
    scanf("%d", &count);
    printf("Local count: %d\n", count);
    showGlobal();
    return 0;
}''', ["5", "100", "-1", "0", "42"], reads=INT)

cp("c-extern-keyword", "Using extern", "EASY", "Variables",
   "A global variable can be defined in one place and *declared* in another with `extern`. Define `int shared = 50;` **below** `main`, declare it inside `main` with `extern int shared;`, then read `k`, add it to `shared` and print the new value.",
   "One integer `k`.", "Print `shared` after adding `k`.", "-1000 <= k <= 1000",
   r'''#include <stdio.h>

int main(void) {
    extern int shared;
    int k;
    scanf("%d", &k);
    shared += k;
    printf("%d\n", shared);
    return 0;
}

int shared = 50;''', ["5", "-50", "0", "1000", "-1000"], reads="extern int shared;\nint k;\nscanf(\"%d\", &k);")

cp("c-static-counter", "Static Local Counter", "EASY", "Variables",
   "A `static` local variable keeps its value between calls. Write `void tick()` with `static int counter = 0;` that adds 1 and prints `Call <counter>`. Read `n` and call `tick()` that many times.",
   "One integer `n`.", "`n` lines: `Call 1`, `Call 2`, ...", "1 <= n <= 50",
   r'''#include <stdio.h>

void tick(void) {
    static int counter = 0;
    counter++;
    printf("Call %d\n", counter);
}

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) tick();
    return 0;
}''', ["3", "1", "5", "10", "7"], reads='int n;\nscanf("%d", &n);')

cp("c-const-pi", "A const Variable", "EASY", "Variables",
   "Declare `const float PI = 3.14159;`. Read a radius and print the circle's area `PI * r * r` with two decimals.\n\nTry `PI = 3;` once: the compiler refuses because a `const` cannot be changed. Remove that line before you submit.",
   "One number: the radius.", "The area with two decimals.", "0 <= r <= 1000",
   r'''#include <stdio.h>

int main(void) {
    const float PI = 3.14159;
    float r;
    scanf("%f", &r);
    printf("%.2f\n", PI * r * r);
    return 0;
}''', ["1", "2.5", "0", "10", "7.25"], reads='float r;\nscanf("%f", &r);')

cp("c-volatile-sensor", "A volatile Sensor", "MEDIUM", "Variables",
   "`volatile` tells the compiler a value can change behind its back (a hardware sensor, for example), so it must re-read it every time instead of caching it in a register. Declare `volatile int sensor = 0;`. Read `n` readings; for each, store it in `sensor` and print `Reading <i>: <sensor>` (i from 1). Finally print `Total: <sum>`.",
   "First line `n`. Second line `n` integers.", "One line per reading, then the total.", "1 <= n <= 100",
   r'''#include <stdio.h>

int main(void) {
    volatile int sensor = 0;
    int n, total = 0;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        int x;
        scanf("%d", &x);
        sensor = x;
        total += sensor;
        printf("Reading %d: %d\n", i, sensor);
    }
    printf("Total: %d\n", total);
    return 0;
}''', [arr([50, 52, 49]), arr([7]), arr([1, 2, 3, 4, 5]), arr([-3, 3]), arr([100, 200, 300, 400])], reads='volatile int sensor = 0;\nint n;\nscanf("%d", &n);')

cp("c-auto-storage", "The auto Storage Class", "EASY", "Variables",
   "Local variables are `auto` by default; the keyword can be written out: `auto int a`. Read two integers into `auto` variables and print `Sum: <a+b>` and `Product: <a*b>`.",
   "One line with two integers.", "Two lines: the sum and the product.", "|a|, |b| <= 10000",
   r'''#include <stdio.h>

int main(void) {
    auto int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d\nProduct: %d\n", a + b, a * b);
    return 0;
}''', ["20 3", "-4 5", "0 9", "100 100", "7 -7"], reads='auto int a, b;\nscanf("%d %d", &a, &b);')

cp("c-register-loop", "A register Loop Counter", "EASY", "Variables",
   "`register` suggests the compiler keep a hot variable in a CPU register. Use `register int i` as the loop counter to add up `1 + 2 + ... + n` and print the sum.",
   "One integer `n`.", "The sum.", "1 <= n <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int n, sum = 0;
    scanf("%d", &n);
    for (register int i = 1; i <= n; i++) sum += i;
    printf("%d\n", sum);
    return 0;
}''', ["10", "1", "1000", "100", "37"], reads='int n, sum = 0;\nscanf("%d", &n);')

cp("c-multi-declaration", "Declare Several Variables at Once", "EASY", "Variables",
   "Declare `a`, `b` and `c` on one line, separated by commas, and read them. Print `a * b + c`.",
   "One line with three integers.", "The value of `a * b + c`.", "|a|, |b|, |c| <= 10000",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%d\n", a * b + c);
    return 0;
}''', ["2 3 4", "0 5 5", "-2 3 1", "100 100 100", "7 -7 49"], reads='int a, b, c;\nscanf("%d %d %d", &a, &b, &c);')

cp("c-always-initialise", "Always Initialise", "EASY", "Variables",
   "A local variable that is never given a value holds a *garbage value*, so printing it gives unpredictable output. The fix is to start every accumulator at a known value. Read `n` integers and add them to `total`, which you **initialise to 0**. Print `Total: <total>`.",
   "First line `n`. Second line `n` integers.", "One line with the total.", "1 <= n <= 100",
   r'''#include <stdio.h>

int main(void) {
    int n, total = 0;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        total += x;
    }
    printf("Total: %d\n", total);
    return 0;
}''', [arr([1, 2, 3]), arr([10]), arr([-5, 5]), arr([100, 200, 300]), arr([7, 7, 7, 7])], reads='int n, total = 0;\nscanf("%d", &n);')

# ---------------- Data types ----------------
cp("c-sizeof-types", "Size of the Basic Types", "EASY", "Data types",
   "Use `sizeof` to print the size in bytes of `int`, `float`, `double`, `char`, `short`, `long` and `long long`, one per line as `<type>: <bytes>`, in that order. (A typical 64-bit system gives 4, 4, 8, 1, 2, 8, 8.)",
   "There is no input.", "Seven lines like `int: 4`.", "None.",
   r'''#include <stdio.h>

int main(void) {
    printf("int: %zu\n", sizeof(int));
    printf("float: %zu\n", sizeof(float));
    printf("double: %zu\n", sizeof(double));
    printf("char: %zu\n", sizeof(char));
    printf("short: %zu\n", sizeof(short));
    printf("long: %zu\n", sizeof(long));
    printf("long long: %zu\n", sizeof(long long));
    return 0;
}''', [""], samples=1)

cp("c-char-overflow", "Signed char Wrap-Around", "MEDIUM", "Data types",
   "A `signed char` holds -128 to 127. Read an integer `v`, store it in a `signed char` (cast it with `(signed char)v`), and print the stored value with `%d`. Values past 127 wrap around to negative numbers.",
   "One integer.", "The value after it is stored in a `signed char`.", "-1000 <= v <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int v;
    scanf("%d", &v);
    signed char c = (signed char)v;
    printf("%d\n", c);
    return 0;
}''', ["130", "127", "128", "255", "256", "-129", "65"], reads=INT)

cp("c-signed-unsigned", "Signed and Unsigned", "EASY", "Data types",
   "Read an integer `x`. Store it in a signed `int` and in an `unsigned int` (`unsigned int u = x;`). Print the signed one with `%d` and the unsigned one with `%u` on one line, separated by a space. A negative number becomes a huge unsigned number.",
   "One integer.", "`<signed> <unsigned>`.", "-1000 <= x <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int x;
    scanf("%d", &x);
    unsigned int u = x;
    printf("%d %u\n", x, u);
    return 0;
}''', ["-5", "5", "0", "-1", "1000"], reads=INT)

cp("c-float-vs-double", "float versus double", "MEDIUM", "Data types",
   "Store `123.456789012345` in a `float` and in a `double`. Print both with `%.10f`, `float` first. The `float` loses digits because it only keeps about 7 significant digits.",
   "There is no input.", "Two lines: the float, then the double.", "None.",
   r'''#include <stdio.h>

int main(void) {
    float f = 123.456789012345f;
    double d = 123.456789012345;
    printf("%.10f\n%.10f\n", f, d);
    return 0;
}''', [""], samples=1)

cp("c-char-arithmetic", "Character Arithmetic", "EASY", "Data types",
   "A `char` is a small number, so you can add to it. Read a letter `c` and a number `k`, then print the letter `k` places later, and its ASCII code, as `<letter> <code>`.",
   "One line: a character and an integer.", "`<letter> <code>`.", "The result stays a letter.",
   r'''#include <stdio.h>

int main(void) {
    char c;
    int k;
    scanf(" %c %d", &c, &k);
    c = c + k;
    printf("%c %d\n", c, c);
    return 0;
}''', ["A 3", "a 1", "x 2", "B 0", "M 5"], reads='char c;\nint k;\nscanf(" %c %d", &c, &k);')

cp("c-bool-pass", "Booleans with stdbool.h", "EASY", "Data types",
   "Include `<stdbool.h>`. Read the marks, set `bool isPassed = marks >= 40;` and print `Passed` or `Failed`.",
   "One integer: marks.", "`Passed` or `Failed`.", "0 <= marks <= 100",
   r'''#include <stdio.h>
#include <stdbool.h>

int main(void) {
    int marks;
    scanf("%d", &marks);
    bool isPassed = marks >= 40;
    if (isPassed) printf("Passed\n");
    else printf("Failed\n");
    return 0;
}''', ["75", "40", "39", "0", "100"], reads='int marks;\nscanf("%d", &marks);', extra_include="#include <stdbool.h>\n")

cp("c-type-promotion", "Implicit Type Promotion", "EASY", "Data types",
   "In `'a' + 5` the `char` is quietly promoted to an `int`. Read a character `c` and an integer `k`, store `c + k` in an `int` and print it (the number, not a letter).",
   "One line: a character and an integer.", "The integer result.", "|k| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    char c;
    int k;
    scanf(" %c %d", &c, &k);
    int r = c + k;
    printf("%d\n", r);
    return 0;
}''', ["a 5", "A 0", "z -1", "0 10", "a 100"], reads='char c;\nint k;\nscanf(" %c %d", &c, &k);')

cp("c-cast-truncation", "Casting double to int", "EASY", "Data types",
   "Read a `double` `x`. Print it with two decimals and then the value of `(int)x` (the fractional part is cut off, not rounded), as `<x> <int>`.",
   "One decimal number.", "`<x with 2 decimals> <integer part>`.", "-1000 <= x <= 1000",
   r'''#include <stdio.h>

int main(void) {
    double x;
    scanf("%lf", &x);
    printf("%.2f %d\n", x, (int)x);
    return 0;
}''', ["9.87", "-9.87", "5", "0.99", "123.456"], reads='double x;\nscanf("%lf", &x);')

cp("c-scientific-notation", "Scientific Notation", "EASY", "Data types",
   "Read a `double` (it can be written like `3.14e8`). Print it first with `%lf` and then with `%e`, one per line.",
   "One number.", "Two lines: `%lf` then `%e`.", "|x| <= 10^12",
   r'''#include <stdio.h>

int main(void) {
    double x;
    scanf("%lf", &x);
    printf("%lf\n%e\n", x, x);
    return 0;
}''', ["3.14e8", "1.5", "2e-3", "123456789", "0.5e2"], reads='double x;\nscanf("%lf", &x);')

cp("c-format-specifier", "Pick the Right Format Specifier", "EASY", "Data types",
   "Printing a `float` with `%d` is a mistake: the output is garbage because the bytes are read as the wrong type. Do it correctly. Read a `float` `f`, print it with `%.2f`, and then print `(int)f` with `%d`, separated by a space.",
   "One decimal number.", "`<f with 2 decimals> <integer part>`.", "-1000 <= f <= 1000",
   r'''#include <stdio.h>

int main(void) {
    float f;
    scanf("%f", &f);
    printf("%.2f %d\n", f, (int)f);
    return 0;
}''', ["3.75", "-2.5", "10", "0.1", "99.99"], reads='float f;\nscanf("%f", &f);')

# ---------------- Operators ----------------
cp("c-operator-precedence", "Operator Precedence", "EASY", "Operators",
   "Multiplication and division bind tighter than addition and subtraction. Read integers `a b c d e` (`e` is not 0). Print `a + b * c - d / e` on the first line, then `(a + b) * (c - d) / e` on the second.",
   "One line with five integers.", "Two lines.", "|values| <= 1000, e != 0",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c, d, e;
    scanf("%d %d %d %d %d", &a, &b, &c, &d, &e);
    printf("%d\n%d\n", a + b * c - d / e, (a + b) * (c - d) / e);
    return 0;
}''', ["10 2 5 4 2", "1 1 1 1 1", "3 4 5 6 7", "100 10 3 50 5", "-4 6 2 9 3"], reads='int a, b, c, d, e;\nscanf("%d %d %d %d %d", &a, &b, &c, &d, &e);')

cp("c-modulus-negative", "Modulus with Negative Numbers", "MEDIUM", "Operators",
   "In C the result of `%` takes the sign of the **left** operand. Read `a` and `b` (`b > 0`) and print four values on one line: `a % b`, `-a % b`, `a % -b` and `-a % -b`.",
   "One line with two integers.", "Four numbers separated by spaces.", "1 <= a, b <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d %d %d %d\n", a % b, -a % b, a % -b, -a % -b);
    return 0;
}''', ["5 2", "7 3", "10 5", "1 4", "100 7"], reads='int a, b;\nscanf("%d %d", &a, &b);')

cp("c-compound-chain", "Compound Assignment Chain", "EASY", "Operators",
   "Read `x`, then apply `x += 5;` `x *= 2;` `x -= 4;` `x /= 3;` in that order. Print `x` after each step, one per line (four lines).",
   "One integer.", "Four lines.", "0 <= x <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int x;
    scanf("%d", &x);
    x += 5;
    printf("%d\n", x);
    x *= 2;
    printf("%d\n", x);
    x -= 4;
    printf("%d\n", x);
    x /= 3;
    printf("%d\n", x);
    return 0;
}''', ["10", "0", "1", "100", "37"], reads=INT)

cp("c-post-pre-increment", "Post- and Pre-Increment", "EASY", "Operators",
   "`a++` gives the old value and then adds 1; `++a` adds 1 and gives the new value. Read `a` and print these four values on one line, one `printf` each, in order: `a++`, `a`, `++a`, `a`.\n\n(An expression like `a++ + ++a` changes `a` twice with no defined order, which is *undefined behaviour*: never write it. This exercise shows the safe, one-change-per-statement version.)",
   "One integer.", "Four numbers separated by spaces.", "|a| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a;
    scanf("%d", &a);
    printf("%d ", a++);
    printf("%d ", a);
    printf("%d ", ++a);
    printf("%d\n", a);
    return 0;
}''', ["5", "0", "-3", "99", "10"], reads=INT)

cp("c-logical-evaluator", "Relational and Logical Expressions", "EASY", "Operators",
   "Read integers `a b c`. A relational or logical expression gives `1` for true and `0` for false. Print `a < b || b < c` on the first line and `a < b && b < c` on the second.",
   "One line with three integers.", "Two lines, each `0` or `1`.", "|values| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%d\n%d\n", a < b || b < c, a < b && b < c);
    return 0;
}''', ["1 2 3", "3 2 1", "1 2 1", "2 2 2", "5 1 9"], reads='int a, b, c;\nscanf("%d %d %d", &a, &b, &c);')

cp("c-ternary-largest", "Largest of Three with Nested Ternary", "EASY", "Operators",
   "Read three distinct integers and print the largest, using only a nested ternary: `a > b ? (a > c ? a : c) : (b > c ? b : c)`.",
   "One line with three integers.", "The largest.", "|values| <= 10^6",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%d\n", a > b ? (a > c ? a : c) : (b > c ? b : c));
    return 0;
}''', ["1 2 3", "9 4 2", "5 10 7", "-1 -5 -3", "100 99 101"], reads='int a, b, c;\nscanf("%d %d %d", &a, &b, &c);')

cp("c-bit-set-clear", "Set and Clear a Bit", "MEDIUM", "Operators",
   "Read `n` and a bit position `k` (bit 0 is the rightmost). Print `n | (1 << k)` (turns that bit on) and `n & ~(1 << k)` (turns it off), one per line.",
   "One line: `n k`.", "Two lines.", "0 <= n <= 10^6, 0 <= k <= 20",
   r'''#include <stdio.h>

int main(void) {
    int n, k;
    scanf("%d %d", &n, &k);
    printf("%d\n%d\n", n | (1 << k), n & ~(1 << k));
    return 0;
}''', ["8 2", "0 0", "255 7", "5 1", "1024 10"], reads='int n, k;\nscanf("%d %d", &n, &k);')

cp("c-bit-toggle", "Toggle a Bit with XOR", "MEDIUM", "Operators",
   "Read `n` and a bit position `k`. XOR with a shifted mask flips just that bit: print `n ^ (1 << k)`.",
   "One line: `n k`.", "The new number.", "0 <= n <= 10^6, 0 <= k <= 20",
   r'''#include <stdio.h>

int main(void) {
    int n, k;
    scanf("%d %d", &n, &k);
    printf("%d\n", n ^ (1 << k));
    return 0;
}''', ["8 3", "8 2", "0 4", "255 0", "1000 9"], reads='int n, k;\nscanf("%d %d", &n, &k);')

cp("c-comma-for-loop", "Comma Operator in a for Loop", "EASY", "Operators",
   "A `for` loop can run two counters at once with the comma operator. Read `n` and use `for (int i = 0, j = n; i <= j; i++, j--)`. Print `<i> <j>` for every step, one per line.",
   "One integer `n`.", "One line per step.", "0 <= n <= 50",
   r'''#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    for (int i = 0, j = n; i <= j; i++, j--) printf("%d %d\n", i, j);
    return 0;
}''', ["10", "0", "1", "5", "20"], reads='int n;\nscanf("%d", &n);')

cp("c-sizeof-expression", "sizeof Does Not Evaluate", "MEDIUM", "Operators",
   "`sizeof` is decided by the compiler from the *type* of its operand; the expression is never run. Read an `int x`. Print `sizeof(x + 3.5)` on the first line, then `sizeof(x++)` on the second, and finally `x`, which is still unchanged.",
   "One integer.", "Three lines: 8, 4 and the original `x`.", "|x| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int x;
    scanf("%d", &x);
    printf("%zu\n%zu\n%d\n", sizeof(x + 3.5), sizeof(x++), x);
    return 0;
}''', ["10", "0", "-5", "999", "1"], reads=INT)

# ---------------- 20 more on operators ----------------
cp("c-pre-increment-steps", "Pre-Increment, One Step at a Time", "EASY", "Operators",
   "`int y = ++x + ++x + ++x;` changes `x` three times in one expression, so its result is undefined. Do the same job safely. Read `x`, then use three separate statements: `p = ++x;` `q = ++x;` `r = ++x;`. Print `x` and `p + q + r` on one line.",
   "One integer.", "`<x> <p+q+r>`.", "|x| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int x;
    scanf("%d", &x);
    int p = ++x;
    int q = ++x;
    int r = ++x;
    printf("%d %d\n", x, p + q + r);
    return 0;
}''', ["3", "0", "-2", "10", "100"], reads=INT)

cp("c-post-pre-product", "Post then Pre Increment", "EASY", "Operators",
   "Read `a`. In two statements, `first = a++;` then `second = ++a;`. Print `a`, `first`, `second` and `first * second` on one line.",
   "One integer.", "Four numbers separated by spaces.", "|a| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a;
    scanf("%d", &a);
    int first = a++;
    int second = ++a;
    printf("%d %d %d %d\n", a, first, second, first * second);
    return 0;
}''', ["5", "0", "-1", "20", "99"], reads=INT)

cp("c-fmod-modulus", "Modulus for Decimals with fmod", "MEDIUM", "Operators",
   "`%` only works on integers. Include `<math.h>` and read two decimals `a b` (`b` is not 0). Print `fmod(a, b)` with two decimals, then `(int)a % (int)b` (integer remainder after cutting the decimals; `(int)b` is at least 1) on the next line.",
   "One line with two decimals.", "Two lines.", "0 <= a <= 1000, 1 <= b <= 100",
   r'''#include <stdio.h>
#include <math.h>

int main(void) {
    double a, b;
    scanf("%lf %lf", &a, &b);
    printf("%.2f\n%d\n", fmod(a, b), (int)a % (int)b);
    return 0;
}''', ["10.5 3", "7.25 2.5", "9 4", "100.75 7.5", "5.5 5.5"], reads='double a, b;\nscanf("%lf %lf", &a, &b);', extra_include="#include <math.h>\n")

cp("c-safe-division", "Safe Division", "EASY", "Operators",
   "Read `a` and `b`. If `b != 0` do `a /= b;` and print `a`; otherwise print `Cannot divide by zero`.",
   "One line with two integers.", "The quotient, or the message.", "|a|, |b| <= 10^6",
   r'''#include <stdio.h>

int main(void) {
    int a, b;
    scanf("%d %d", &a, &b);
    if (b != 0) {
        a /= b;
        printf("%d\n", a);
    } else {
        printf("Cannot divide by zero\n");
    }
    return 0;
}''', ["10 2", "7 0", "-9 3", "100 7", "0 5"], reads='int a, b;\nscanf("%d %d", &a, &b);')

cp("c-unary-signs", "Unary Plus and Minus", "EASY", "Operators",
   "Read `val`. Print `-val`, `+val` and `-(-val)` on one line separated by spaces.",
   "One integer.", "Three numbers.", "|val| <= 10^6",
   r'''#include <stdio.h>

int main(void) {
    int val;
    scanf("%d", &val);
    printf("%d %d %d\n", -val, +val, -(-val));
    return 0;
}''', ["25", "-25", "0", "1000000", "-7"], reads="int val;\nscanf(\"%d\", &val);")

cp("c-short-circuit-and", "Short-Circuit AND", "MEDIUM", "Operators",
   "In `A && B` the right side is skipped when `A` is false. Read `a b x` and evaluate `(a > b) && (++x == 2)`. Print the result of the expression and then the final `x`, separated by a space. If `a > b` is false, `x` stays unchanged.",
   "One line with three integers.", "`<result> <x>`.", "|values| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a, b, x;
    scanf("%d %d %d", &a, &b, &x);
    int result = (a > b) && (++x == 2);
    printf("%d %d\n", result, x);
    return 0;
}''', ["5 10 1", "10 5 1", "10 5 0", "3 3 7", "9 2 4"], reads='int a, b, x;\nscanf("%d %d %d", &a, &b, &x);')

cp("c-short-circuit-or", "Short-Circuit OR", "MEDIUM", "Operators",
   "In `A || B` the right side is skipped when `A` is true. Read `a b y` and evaluate `(a > b) || (++y == 5)`. Print the result and then the final `y`, separated by a space.",
   "One line with three integers.", "`<result> <y>`.", "|values| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int a, b, y;
    scanf("%d %d %d", &a, &b, &y);
    int result = (a > b) || (++y == 5);
    printf("%d %d\n", result, y);
    return 0;
}''', ["10 5 4", "5 10 4", "5 10 0", "2 2 4", "8 1 9"], reads='int a, b, y;\nscanf("%d %d %d", &a, &b, &y);')

cp("c-de-morgan", "De Morgan's First Law", "EASY", "Operators",
   "Read `A` and `B` (each 0 or 1). Print `!(A && B)` on the first line, `!A || !B` on the second, and `Verified` on the third if they are equal (they always are).",
   "One line: `A B`.", "Three lines.", "A, B in {0, 1}",
   r'''#include <stdio.h>

int main(void) {
    int A, B;
    scanf("%d %d", &A, &B);
    int left = !(A && B), right = !A || !B;
    printf("%d\n%d\n", left, right);
    if (left == right) printf("Verified\n");
    return 0;
}''', ["0 0", "0 1", "1 0", "1 1"], reads='int A, B;\nscanf("%d %d", &A, &B);')

cp("c-range-check", "Is It in the Range?", "EASY", "Operators",
   "Read an integer. With one condition, `num >= 10 && num <= 50`, print `Inside` if it is in that range and `Outside` if not.",
   "One integer.", "`Inside` or `Outside`.", "|num| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int num;
    scanf("%d", &num);
    if (num >= 10 && num <= 50) printf("Inside\n");
    else printf("Outside\n");
    return 0;
}''', ["25", "10", "50", "9", "51", "-3"], reads="int num;\nscanf(\"%d\", &num);")

cp("c-logical-precedence", "Logical Operator Precedence", "MEDIUM", "Operators",
   "`!` binds tighter than `&&`, and `&&` tighter than `||`. So `!a || b && c` means `(!a) || (b && c)`. Read `a b c` (each 0 or 1) and print the value of `!a || b && c`.",
   "One line with three 0/1 values.", "`0` or `1`.", "Each value is 0 or 1.",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int res = !a || b && c;
    printf("%d\n", res);
    return 0;
}''', ["0 0 0", "1 0 0", "1 1 0", "1 1 1", "0 1 1", "1 0 1"], reads='int a, b, c;\nscanf("%d %d %d", &a, &b, &c);')

cp("c-check-nth-bit", "Check the k-th Bit", "EASY", "Operators",
   "Read `n` and `k`. Use `(n & (1 << k))` to check bit `k` (bit 0 is the rightmost). Print `1` if it is set and `0` if not.",
   "One line: `n k`.", "`0` or `1`.", "0 <= n <= 10^6, 0 <= k <= 20",
   r'''#include <stdio.h>

int main(void) {
    int n, k;
    scanf("%d %d", &n, &k);
    printf("%d\n", (n & (1 << k)) ? 1 : 0);
    return 0;
}''', ["5 0", "5 1", "5 2", "8 3", "1023 9", "1024 9"], reads='int n, k;\nscanf("%d %d", &n, &k);')

cp("c-clear-rightmost-bit", "Clear the Rightmost Set Bit", "MEDIUM", "Operators",
   "`n & (n - 1)` switches off the lowest bit that is on (Brian Kernighan's trick). Read `n` (greater than 0) and print `n` and the result, separated by a space.",
   "One positive integer.", "`<n> <n & (n-1)>`.", "1 <= n <= 10^9",
   r'''#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%d %d\n", n, n & (n - 1));
    return 0;
}''', ["12", "1", "8", "7", "1000", "1000000000"], reads=INT)

cp("c-extract-bits", "Extract a Range of Bits", "MEDIUM", "Operators",
   "Read `n`, a starting bit `pos` (bit 0 is the rightmost) and a count `len`. Shift right by `pos`, then mask the lowest `len` bits: `(n >> pos) & ((1 << len) - 1)`. Print the result.",
   "One line: `n pos len`.", "The extracted value.", "0 <= n <= 10^6, 0 <= pos <= 20, 1 <= len <= 10",
   r'''#include <stdio.h>

int main(void) {
    int n, pos, len;
    scanf("%d %d %d", &n, &pos, &len);
    printf("%d\n", (n >> pos) & ((1 << len) - 1));
    return 0;
}''', ["181 2 3", "255 0 4", "255 4 4", "1024 10 1", "100 3 2", "0 0 5"], reads='int n, pos, len;\nscanf("%d %d %d", &n, &pos, &len);')

cp("c-power-of-two-bits", "Power of Two with Bits", "EASY", "Operators",
   "A positive number is a power of two exactly when `n & (n - 1)` is 0. Read `n` (at least 1) and print `Yes` or `No`.",
   "One positive integer.", "`Yes` or `No`.", "1 <= n <= 10^9",
   r'''#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    printf("%s\n", (n & (n - 1)) == 0 ? "Yes" : "No");
    return 0;
}''', ["16", "1", "6", "1024", "1000", "536870912"], reads=INT)

cp("c-rotate-left-8bit", "Rotate an 8-bit Number Left", "MEDIUM", "Operators",
   "Rotate an unsigned 8-bit number left by one bit: the bit that falls off the left end comes back on the right. Read `x` (0 to 255) and print `((x << 1) | (x >> 7)) & 0xFF`.",
   "One integer 0 to 255.", "The rotated value.", "0 <= x <= 255",
   r'''#include <stdio.h>

int main(void) {
    unsigned int x;
    scanf("%u", &x);
    printf("%u\n", ((x << 1) | (x >> 7)) & 0xFF);
    return 0;
}''', ["129", "1", "128", "255", "0", "85"], reads='unsigned int x;\nscanf("%u", &x);')

cp("c-min-three-ternary", "Smallest of Three with Ternary", "EASY", "Operators",
   "Read three integers and print the smallest using a nested ternary operator.",
   "One line with three integers.", "The smallest.", "|values| <= 10^6",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    printf("%d\n", a < b ? (a < c ? a : c) : (b < c ? b : c));
    return 0;
}''', ["1 2 3", "9 4 2", "5 1 7", "-1 -5 -3", "8 8 8"], reads='int a, b, c;\nscanf("%d %d %d", &a, &b, &c);')

cp("c-ternary-side-effects", "Ternary with Side Effects", "MEDIUM", "Operators",
   "Read `flag x y`. Run `flag ? x++ : y++;` Only one branch runs. Print `x` and `y` afterwards. Hiding changes inside a ternary is hard to read, which is why such code is considered fragile.",
   "One line: `flag x y`.", "`<x> <y>`.", "|values| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int flag, x, y;
    scanf("%d %d %d", &flag, &x, &y);
    flag ? x++ : y++;
    printf("%d %d\n", x, y);
    return 0;
}''', ["1 5 5", "0 5 5", "7 0 0", "0 -1 10", "1 9 3"], reads='int flag, x, y;\nscanf("%d %d %d", &flag, &x, &y);')

cp("c-comma-dual-counter", "Dual Counter with the Comma Operator", "EASY", "Operators",
   "Read `n`. Use `for (int i = 0, j = n; i < j; i++, j--)` and add up `i * j` for each step. Print the total.",
   "One integer `n`.", "The total.", "0 <= n <= 100",
   r'''#include <stdio.h>

int main(void) {
    int n, total = 0;
    scanf("%d", &n);
    for (int i = 0, j = n; i < j; i++, j--) total += i * j;
    printf("%d\n", total);
    return 0;
}''', ["10", "0", "1", "7", "100"], reads='int n, total = 0;\nscanf("%d", &n);')

cp("c-comma-expression", "The Comma Expression", "EASY", "Operators",
   "A comma expression runs left to right and gives the value of the last part. Read `p` and `q`, then write `int val = (a = p, b = q, a + b);`. Print `val`, `a` and `b` on one line.",
   "One line with two integers.", "`<val> <a> <b>`.", "|p|, |q| <= 1000",
   r'''#include <stdio.h>

int main(void) {
    int p, q, a, b;
    scanf("%d %d", &p, &q);
    int val = (a = p, b = q, a + b);
    printf("%d %d %d\n", val, a, b);
    return 0;
}''', ["5 10", "0 0", "-3 3", "100 200", "7 -9"], reads='int p, q, a, b;\nscanf("%d %d", &p, &q);')

cp("c-precedence-solver", "A Long Expression", "HARD", "Operators",
   "Read integers `a b c d e f g` (`e` and `f` are not 0) and print `a + b * c - d / e % f << g`.\n\nOrder used by C, highest first: `* / %` (left to right), then `+ -`, then `<< >>`. So the expression is `((a + (b * c)) - ((d / e) % f)) << g`.",
   "One line with seven integers.", "The value.", "All values are small and the result is not negative.",
   r'''#include <stdio.h>

int main(void) {
    int a, b, c, d, e, f, g;
    scanf("%d %d %d %d %d %d %d", &a, &b, &c, &d, &e, &f, &g);
    int ans = a + b * c - d / e % f << g;
    printf("%d\n", ans);
    return 0;
}''', ["5 3 2 8 4 3 1", "1 1 1 1 1 1 0", "10 2 3 9 3 2 2", "0 5 5 20 4 3 3", "7 7 7 100 10 7 1"], reads='int a, b, c, d, e, f, g;\nscanf("%d %d %d %d %d %d %d", &a, &b, &c, &d, &e, &f, &g);')
