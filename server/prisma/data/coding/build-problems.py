# Builds problems.json for the Coding Practice library.
# Every problem has a reference solution (stdin -> stdout); expected outputs are produced by running it,
# so test cases never disagree with the statement. The first `samples` inputs are shown to students.
# Run: python -I prisma/data/coding/build-problems.py
import json
import pathlib
import subprocess
import sys

P = []


def problem(slug, title, difficulty, topic, statement, input_format, output_format, constraints, solution, tests, samples=2):
    P.append(dict(slug=slug, title=title, difficulty=difficulty, topic=topic, statement=statement,
                  inputFormat=input_format, outputFormat=output_format, constraints=constraints,
                  solution=solution.strip() + "\n", tests=tests, samples=samples))


def lines(*rows):
    return "\n".join(str(r) for r in rows) + "\n"


def arr(values):
    return lines(len(values), " ".join(map(str, values)))


# ---------------- Basics: input, output, arithmetic ----------------
problem("hello-world", "Hello, World!", "EASY", "Basics",
        "Print the text `Hello, World!` exactly as shown.",
        "There is no input.", "Print `Hello, World!`.", "None.",
        'print("Hello, World!")',
        [""], samples=1)

problem("sum-of-two-numbers", "Sum of Two Numbers", "EASY", "Basics",
        "Read two integers and print their sum.",
        "One line with two integers `a` and `b`.", "Print `a + b`.", "-10^9 <= a, b <= 10^9",
        "a, b = map(int, input().split())\nprint(a + b)",
        ["3 5", "-7 2", "0 0", "1000000000 1000000000", "-15 -30", "123456 654321"])

problem("even-or-odd", "Even or Odd", "EASY", "Conditions",
        "Read an integer `n`. Print `Even` if it is even, otherwise print `Odd`.",
        "One integer `n`.", "Print `Even` or `Odd`.", "-10^9 <= n <= 10^9",
        'n = int(input())\nprint("Even" if n % 2 == 0 else "Odd")',
        ["4", "7", "0", "-3", "1000000000", "-12"])

problem("largest-of-three", "Largest of Three", "EASY", "Conditions",
        "Read three integers and print the largest one.",
        "One line with three integers.", "Print the largest value.", "-10^9 <= values <= 10^9",
        "print(max(map(int, input().split())))",
        ["3 9 5", "-1 -5 -3", "7 7 2", "0 0 0", "100 200 150", "-100 50 50"])

problem("simple-interest", "Simple Interest", "EASY", "Basics",
        "Read principal `P`, yearly rate `R` (percent) and time `T` in years. Print the simple interest `P * R * T / 100` with exactly two digits after the decimal point.",
        "One line with three numbers `P R T`.", "Print the interest with two decimal places.", "0 <= P <= 10^7, 0 <= R <= 100, 0 <= T <= 50",
        'p, r, t = map(float, input().split())\nprint(f"{p * r * t / 100:.2f}")',
        ["1000 5 2", "2500 7.5 3", "0 10 10", "15000 8 1.5", "999 1 1", "100000 12.25 4"])

problem("celsius-to-fahrenheit", "Celsius to Fahrenheit", "EASY", "Basics",
        "Read a temperature in Celsius and print it in Fahrenheit using `F = C * 9 / 5 + 32`, with two decimal places.",
        "One number `C`.", "Print `F` with two decimal places.", "-273.15 <= C <= 10^4",
        'c = float(input())\nprint(f"{c * 9 / 5 + 32:.2f}")',
        ["0", "100", "-40", "36.6", "-273.15", "25"])

problem("leap-year", "Leap Year", "EASY", "Conditions",
        "A year is a leap year if it is divisible by 4 but not by 100, or if it is divisible by 400. Print `Yes` for a leap year and `No` otherwise.",
        "One integer `year`.", "Print `Yes` or `No`.", "1 <= year <= 10^5",
        'y = int(input())\nprint("Yes" if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else "No")',
        ["2024", "1900", "2000", "2023", "2100", "4"])

problem("sum-of-first-n", "Sum of First N Numbers", "EASY", "Loops",
        "Print the sum `1 + 2 + ... + n`.",
        "One integer `n`.", "Print the sum.", "1 <= n <= 10^6",
        "n = int(input())\nprint(sum(range(1, n + 1)))",
        ["5", "10", "1", "100", "1000000", "37"])

problem("factorial", "Factorial", "EASY", "Loops",
        "Print `n!` (the product `1 * 2 * ... * n`). By definition `0! = 1`.",
        "One integer `n`.", "Print `n!`.", "0 <= n <= 20",
        "n = int(input())\nf = 1\nfor i in range(2, n + 1):\n    f *= i\nprint(f)",
        ["5", "0", "1", "10", "20", "13"])

problem("multiplication-table", "Multiplication Table", "EASY", "Loops",
        "Print the multiplication table of `n` from 1 to 10, one line each, in the form `n x i = product`.",
        "One integer `n`.", "Ten lines such as `3 x 1 = 3`.", "-1000 <= n <= 1000",
        'n = int(input())\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
        ["3", "12", "0", "-4", "1000"])

problem("reverse-a-number", "Reverse a Number", "EASY", "Loops",
        "Print the digits of a non-negative integer in reverse order. Leading zeros of the result are dropped (so `1200` becomes `21`).",
        "One integer `n`.", "Print the reversed number.", "0 <= n <= 10^18",
        "print(int(input().strip()[::-1]))",
        ["12345", "1200", "7", "0", "1000000000000000000", "908070"])

problem("count-digits", "Count Digits", "EASY", "Loops",
        "Print how many digits the integer `n` has. The sign is not a digit.",
        "One integer `n`.", "Print the digit count.", "-10^18 <= n <= 10^18",
        "print(len(str(abs(int(input())))))",
        ["12345", "0", "-987", "1000000000000000000", "9", "-10"])

problem("sum-of-digits", "Sum of Digits", "EASY", "Loops",
        "Print the sum of the digits of the integer `n`. Ignore the sign.",
        "One integer `n`.", "Print the digit sum.", "-10^18 <= n <= 10^18",
        "print(sum(int(d) for d in str(abs(int(input())))))",
        ["1234", "0", "-905", "999999999999999999", "10", "5"])

problem("palindrome-number", "Palindrome Number", "EASY", "Loops",
        "A number is a palindrome if it reads the same forwards and backwards. Print `Yes` if the non-negative integer `n` is a palindrome, otherwise `No`.",
        "One integer `n`.", "Print `Yes` or `No`.", "0 <= n <= 10^18",
        's = input().strip()\nprint("Yes" if s == s[::-1] else "No")',
        ["121", "123", "0", "1221", "10", "12321"])

problem("count-vowels", "Count Vowels", "EASY", "Strings",
        "Count the vowels (`a e i o u`, upper or lower case) in a line of text.",
        "One line of text.", "Print the number of vowels.", "1 <= length <= 10^4",
        'print(sum(ch in "aeiouAEIOU" for ch in input()))',
        ["Hello World", "rhythm", "AEIOU aeiou", "Programming is fun", "xyz", "The Quick Brown Fox"])

problem("reverse-a-string", "Reverse a String", "EASY", "Strings",
        "Print the given line of text reversed.",
        "One line of text.", "Print the reversed text.", "1 <= length <= 10^4",
        "print(input()[::-1])",
        ["hello", "Campus LMS", "a", "racecar", "12345 abc", "Python 3"])

problem("grade-calculator", "Grade Calculator", "EASY", "Conditions",
        "Read marks out of 100 and print the grade: `A` for 90 and above, `B` for 75-89, `C` for 60-74, `D` for 40-59 and `F` below 40.",
        "One integer `marks`.", "Print the grade letter.", "0 <= marks <= 100",
        'm = int(input())\nprint("A" if m >= 90 else "B" if m >= 75 else "C" if m >= 60 else "D" if m >= 40 else "F")',
        ["95", "75", "60", "39", "40", "89", "100", "0"])

problem("swap-two-numbers", "Swap Two Numbers", "EASY", "Basics",
        "Read two integers `a` and `b` and print them in swapped order.",
        "One line with `a b`.", "Print `b a`.", "-10^9 <= a, b <= 10^9",
        "a, b = input().split()\nprint(b, a)",
        ["1 2", "-5 10", "7 7", "0 -1", "1000000000 -1000000000"])

problem("area-of-circle", "Area of a Circle", "EASY", "Basics",
        "Read the radius `r` and print the area `pi * r * r` with two decimal places. Use the full precision value of pi (for example `math.pi` or `Math.PI`).",
        "One number `r`.", "Print the area with two decimal places.", "0 <= r <= 10^4",
        'import math\nr = float(input())\nprint(f"{math.pi * r * r:.2f}")',
        ["1", "2.5", "0", "10", "7", "123.4"])

problem("maximum-in-list", "Maximum in a List", "EASY", "Arrays",
        "Read `n` integers and print the largest.",
        "First line `n`. Second line `n` integers.", "Print the maximum.", "1 <= n <= 10^5, -10^9 <= values <= 10^9",
        "input()\nprint(max(map(int, input().split())))",
        [arr([3, 8, 1, 9, 2]), arr([-5, -2, -9]), arr([42]), arr([7, 7, 7]), arr(list(range(-50000, 50000, 7))), arr([0, -1, 1000000000])])

# ---------------- Loops, numbers and patterns ----------------
problem("fibonacci-series", "Fibonacci Series", "EASY", "Loops",
        "Print the first `n` Fibonacci numbers separated by spaces. The series starts `0 1 1 2 3 ...`.",
        "One integer `n`.", "Print `n` numbers on one line.", "1 <= n <= 90",
        "n = int(input())\na, b = 0, 1\nout = []\nfor _ in range(n):\n    out.append(a)\n    a, b = b, a + b\nprint(*out)",
        ["7", "1", "2", "10", "90", "25"])

problem("prime-check", "Prime Check", "EASY", "Number theory",
        "Print `Prime` if `n` is a prime number, otherwise `Not Prime`. 0 and 1 are not prime.",
        "One integer `n`.", "Print `Prime` or `Not Prime`.", "0 <= n <= 10^12",
        'n = int(input())\nok = n > 1\ni = 2\nwhile ok and i * i <= n:\n    if n % i == 0:\n        ok = False\n    i += 1\nprint("Prime" if ok else "Not Prime")',
        ["7", "10", "1", "2", "0", "999999999989", "1000000000000", "97"])

problem("primes-up-to-n", "Primes up to N", "MEDIUM", "Number theory",
        "Print all prime numbers from 2 to `n`, separated by spaces. If there are none, print an empty line.",
        "One integer `n`.", "Print the primes on one line.", "1 <= n <= 10^5",
        "n = int(input())\nsieve = [True] * (n + 1)\nps = []\nfor i in range(2, n + 1):\n    if sieve[i]:\n        ps.append(i)\n        for j in range(i * i, n + 1, i):\n            sieve[j] = False\nprint(*ps)",
        ["10", "2", "1", "30", "100", "20000"])

problem("gcd-and-lcm", "GCD and LCM", "EASY", "Number theory",
        "Read two positive integers and print their greatest common divisor and least common multiple.",
        "One line `a b`.", "Print `gcd lcm`.", "1 <= a, b <= 10^9",
        "a, b = map(int, input().split())\nx, y = a, b\nwhile y:\n    x, y = y, x % y\nprint(x, a // x * b)",
        ["12 18", "7 13", "100 10", "1 1", "1000000000 999999999", "36 48"])

problem("armstrong-number", "Armstrong Number", "EASY", "Loops",
        "An Armstrong number equals the sum of its digits each raised to the number of digits (for example `153 = 1^3 + 5^3 + 3^3`). Print `Yes` or `No`.",
        "One integer `n`.", "Print `Yes` or `No`.", "0 <= n <= 10^9",
        's = input().strip()\nprint("Yes" if sum(int(d) ** len(s) for d in s) == int(s) else "No")',
        ["153", "123", "9474", "0", "9475", "370", "10"])

problem("perfect-number", "Perfect Number", "EASY", "Number theory",
        "A perfect number equals the sum of its proper divisors (for example `28 = 1 + 2 + 4 + 7 + 14`). Print `Yes` or `No`.",
        "One integer `n`.", "Print `Yes` or `No`.", "1 <= n <= 10^9",
        'n = int(input())\ns = 1 if n > 1 else 0\ni = 2\nwhile i * i <= n:\n    if n % i == 0:\n        s += i\n        if i != n // i:\n            s += n // i\n    i += 1\nprint("Yes" if s == n else "No")',
        ["28", "12", "6", "1", "8128", "33550336", "496", "100"])

problem("string-palindrome", "Palindrome Sentence", "EASY", "Strings",
        "Check whether a line is a palindrome when you ignore case and every character that is not a letter or digit. Print `Yes` or `No`.",
        "One line of text.", "Print `Yes` or `No`.", "1 <= length <= 10^5",
        'c = [ch.lower() for ch in input() if ch.isalnum()]\nprint("Yes" if c == c[::-1] else "No")',
        ["Madam", "A man, a plan, a canal: Panama", "hello", "No 'x' in Nixon", "ab", "12 21"])

problem("word-count", "Word Count", "EASY", "Strings",
        "Count the words in a line. Words are separated by one or more spaces.",
        "One line of text.", "Print the number of words.", "0 <= length <= 10^5",
        "print(len(input().split()))",
        ["I love programming", "  many   spaces   here ", "single", "a b c d e f g", "Campus LMS coding practice"])

problem("character-frequency", "Character Frequency", "MEDIUM", "Strings",
        "Count each letter in a line, ignoring case and anything that is not a letter. Print one line per letter that appears, in alphabetical order, as `letter count`.",
        "One line of text.", "Lines such as `a 2`.", "1 <= length <= 10^5; at least one letter",
        "from collections import Counter\nc = Counter(ch.lower() for ch in input() if ch.isalpha())\nfor k in sorted(c):\n    print(k, c[k])",
        ["hello", "Banana", "Hello, World!", "aaaa", "The quick brown fox jumps over the lazy dog"])

problem("second-largest", "Second Largest", "EASY", "Arrays",
        "Print the second largest distinct value in a list. If it does not exist, print `-1`.",
        "First line `n`. Second line `n` integers.", "Print the second largest distinct value or `-1`.", "1 <= n <= 10^5, 0 <= values <= 10^9",
        "input()\nv = sorted(set(map(int, input().split())))\nprint(v[-2] if len(v) > 1 else -1)",
        [arr([3, 8, 1, 9, 2]), arr([5, 5, 5]), arr([10, 20]), arr([7]), arr([4, 9, 9, 4, 1]), arr(list(range(100000)))])

problem("sort-numbers", "Sort Numbers", "EASY", "Arrays",
        "Print the given numbers in ascending order, separated by spaces.",
        "First line `n`. Second line `n` integers.", "Print the sorted numbers.", "1 <= n <= 10^5, -10^9 <= values <= 10^9",
        "input()\nprint(*sorted(map(int, input().split())))",
        [arr([5, 2, 9, 1]), arr([3, -1, 3, 0]), arr([1]), arr([9, 8, 7, 6, 5, 4, 3, 2, 1]), arr([(i * 7919) % 10007 - 5000 for i in range(20000)])])

problem("remove-duplicates", "Remove Duplicates", "EASY", "Arrays",
        "Remove repeated values from a list, keeping the first occurrence of each, and print the result separated by spaces.",
        "First line `n`. Second line `n` integers.", "Print the list without duplicates.", "1 <= n <= 10^5",
        "input()\nseen = set()\nout = []\nfor x in input().split():\n    if x not in seen:\n        seen.add(x)\n        out.append(x)\nprint(*out)",
        [arr([1, 2, 2, 3, 1]), arr([4, 4, 4]), arr([5, 6, 7]), arr([9]), arr([i % 100 for i in range(50000)])])

problem("decimal-to-binary", "Decimal to Binary", "EASY", "Number theory",
        "Print the binary representation of a non-negative integer, without leading zeros (`0` prints `0`).",
        "One integer `n`.", "Print the binary form.", "0 <= n <= 10^18",
        'print(format(int(input()), "b"))',
        ["10", "0", "1", "255", "1000000000000000000", "1024"])

problem("right-triangle-pattern", "Right Triangle Pattern", "EASY", "Patterns",
        "Print a right-angled triangle of `*` with `n` rows; row `i` has `i` stars.",
        "One integer `n`.", "Print `n` lines.", "1 <= n <= 50",
        'n = int(input())\nfor i in range(1, n + 1):\n    print("*" * i)',
        ["4", "1", "2", "7", "10"])

problem("pyramid-pattern", "Pyramid Pattern", "EASY", "Patterns",
        "Print a centred pyramid of `n` rows. Row `i` (from 1) has `n - i` spaces followed by `2*i - 1` stars. Do not print spaces after the stars.",
        "One integer `n`.", "Print `n` lines.", "1 <= n <= 50",
        'n = int(input())\nfor i in range(1, n + 1):\n    print(" " * (n - i) + "*" * (2 * i - 1))',
        ["3", "1", "5", "2", "8"])

problem("pascals-triangle", "Pascal's Triangle", "MEDIUM", "Patterns",
        "Print the first `n` rows of Pascal's triangle, with the numbers in each row separated by single spaces (no centring).",
        "One integer `n`.", "Print `n` lines.", "1 <= n <= 30",
        "n = int(input())\nrow = [1]\nfor _ in range(n):\n    print(*row)\n    row = [1] + [row[i] + row[i + 1] for i in range(len(row) - 1)] + [1]",
        ["5", "1", "2", "10", "30"])

# ---------------- Strings, arrays and matrices ----------------
problem("anagram-check", "Anagram Check", "EASY", "Strings",
        "Two words are anagrams if they contain the same letters the same number of times, ignoring case. Print `Yes` or `No`.",
        "One line with two words.", "Print `Yes` or `No`.", "1 <= word length <= 10^5",
        'a, b = input().lower().split()\nprint("Yes" if sorted(a) == sorted(b) else "No")',
        ["listen silent", "hello world", "Dusty Study", "abc abcd", "aabb abab", "rat car"])

problem("matrix-addition", "Matrix Addition", "MEDIUM", "Matrices",
        "Add two matrices of the same size and print the result.",
        "First line `r c`. Next `r` lines: matrix A. Next `r` lines: matrix B.", "Print `r` lines of `c` numbers.", "1 <= r, c <= 50",
        "r, c = map(int, input().split())\na = [list(map(int, input().split())) for _ in range(r)]\nb = [list(map(int, input().split())) for _ in range(r)]\nfor i in range(r):\n    print(*[a[i][j] + b[i][j] for j in range(c)])",
        [lines("2 2", "1 2", "3 4", "5 6", "7 8"), lines("1 3", "1 2 3", "-1 -2 -3"), lines("1 1", "5", "6"),
         lines("3 2", "1 0", "0 1", "2 2", "9 9", "8 8", "7 7")])

problem("matrix-transpose", "Matrix Transpose", "MEDIUM", "Matrices",
        "Print the transpose of an `r x c` matrix (rows become columns).",
        "First line `r c`. Next `r` lines of `c` integers.", "Print `c` lines of `r` numbers.", "1 <= r, c <= 50",
        "r, c = map(int, input().split())\nm = [input().split() for _ in range(r)]\nfor j in range(c):\n    print(*[m[i][j] for i in range(r)])",
        [lines("2 3", "1 2 3", "4 5 6"), lines("1 1", "9"), lines("3 1", "1", "2", "3"), lines("2 2", "1 2", "3 4")])

problem("matrix-multiplication", "Matrix Multiplication", "MEDIUM", "Matrices",
        "Multiply an `n x m` matrix A by an `m x p` matrix B and print the `n x p` product.",
        "First line `n m p`. Next `n` lines: A. Next `m` lines: B.", "Print `n` lines of `p` numbers.", "1 <= n, m, p <= 30, |values| <= 1000",
        "n, m, p = map(int, input().split())\na = [list(map(int, input().split())) for _ in range(n)]\nb = [list(map(int, input().split())) for _ in range(m)]\nfor i in range(n):\n    print(*[sum(a[i][k] * b[k][j] for k in range(m)) for j in range(p)])",
        [lines("2 2 2", "1 2", "3 4", "5 6", "7 8"), lines("1 3 1", "1 2 3", "4", "5", "6"), lines("1 1 1", "-3", "4"),
         lines("2 3 2", "1 0 2", "0 1 0", "1 2", "3 4", "5 6")])

problem("linear-search", "Linear Search", "EASY", "Searching",
        "Find the first position (0-based) of `x` in the list, or print `-1` if it is missing.",
        "First line `n`. Second line `n` integers. Third line `x`.", "Print the index or `-1`.", "1 <= n <= 10^5",
        "input()\nv = input().split()\nx = input().strip()\nprint(v.index(x) if x in v else -1)",
        [lines(5, "4 8 15 16 23", 15), lines(3, "1 2 3", 7), lines(4, "5 5 5 5", 5), lines(1, "9", 9), lines(6, "-1 0 1 -1 0 1", 1)])

problem("binary-search", "Binary Search", "MEDIUM", "Searching",
        "The list is sorted in ascending order with distinct values. Print the index (0-based) of `x`, or `-1` if it is missing. Try to use binary search.",
        "First line `n`. Second line `n` sorted integers. Third line `x`.", "Print the index or `-1`.", "1 <= n <= 10^5",
        "input()\nv = list(map(int, input().split()))\nx = int(input())\nlo, hi = 0, len(v) - 1\nans = -1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if v[mid] == x:\n        ans = mid\n        break\n    if v[mid] < x:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nprint(ans)",
        [lines(5, "1 3 5 7 9", 7), lines(5, "1 3 5 7 9", 4), lines(1, "10", 10), lines(4, "-8 -2 0 6", -8),
         lines(100000, " ".join(str(i * 3) for i in range(100000)), 299997), lines(3, "2 4 6", 100)])

problem("rotate-array", "Rotate an Array", "MEDIUM", "Arrays",
        "Rotate the list to the right by `k` positions and print it. For example, rotating `1 2 3 4 5` by 2 gives `4 5 1 2 3`.",
        "First line `n k`. Second line `n` integers.", "Print the rotated list.", "1 <= n <= 10^5, 0 <= k <= 10^9",
        "n, k = map(int, input().split())\nv = input().split()\nk %= n\nprint(*(v[-k:] + v[:-k] if k else v))",
        [lines("5 2", "1 2 3 4 5"), lines("3 0", "7 8 9"), lines("4 4", "1 2 3 4"), lines("1 100", "5"), lines("6 1000000000", "1 2 3 4 5 6")])

problem("two-sum", "Two Sum", "MEDIUM", "Arrays",
        "Find two different positions `i < j` with `a[i] + a[j] = target`. Among all such pairs print the one with the smallest `i`, and for that `i` the smallest `j`. Print `-1 -1` if there is none.",
        "First line `n`. Second line `n` integers. Third line `target`.", "Print `i j` (0-based) or `-1 -1`.", "2 <= n <= 10^4",
        "input()\nv = list(map(int, input().split()))\nt = int(input())\npos = {}\nfor j, x in enumerate(v):\n    pos.setdefault(x, []).append(j)\nfor i, x in enumerate(v):\n    js = [j for j in pos.get(t - x, []) if j > i]\n    if js:\n        print(i, js[0])\n        break\nelse:\n    print(-1, -1)",
        [lines(4, "2 7 11 15", 9), lines(3, "3 2 4", 6), lines(3, "1 2 3", 10), lines(4, "3 3 3 3", 6), lines(5, "-1 -2 -3 -4 -5", -8),
         lines(10000, " ".join(str(i) for i in range(10000)), 19997)])

problem("balanced-brackets", "Balanced Brackets", "MEDIUM", "Stacks",
        "A string of brackets `()[]{}` is balanced if every opening bracket is closed by the same type in the correct order. Print `Yes` or `No`.",
        "One line of brackets.", "Print `Yes` or `No`.", "1 <= length <= 10^5",
        'pairs = {")": "(", "]": "[", "}": "{"}\nst = []\nok = True\nfor ch in input().strip():\n    if ch in "([{":\n        st.append(ch)\n    elif not st or st.pop() != pairs[ch]:\n        ok = False\n        break\nprint("Yes" if ok and not st else "No")',
        ["()[]{}", "([)]", "{[()]}", "((", ")(", "(" * 50000 + ")" * 50000, "{[]}()"])

problem("caesar-cipher", "Caesar Cipher", "EASY", "Strings",
        "Shift every letter of the text forward by `k` places in the alphabet, wrapping from `z` to `a`. Keep upper/lower case, and leave other characters unchanged.",
        "First line `k`. Second line: the text.", "Print the encrypted text.", "0 <= k <= 1000",
        'k = int(input()) % 26\nout = []\nfor ch in input():\n    if ch.islower():\n        out.append(chr((ord(ch) - 97 + k) % 26 + 97))\n    elif ch.isupper():\n        out.append(chr((ord(ch) - 65 + k) % 26 + 65))\n    else:\n        out.append(ch)\nprint("".join(out))',
        [lines(3, "Hello, World!"), lines(1, "xyz"), lines(0, "Same Text"), lines(26, "Wrap Around"), lines(1000, "Campus LMS 2026")])

problem("longest-word", "Longest Word", "EASY", "Strings",
        "Print the longest word in the sentence. If several words share the maximum length, print the first of them.",
        "One line of words separated by spaces.", "Print the longest word.", "1 <= length <= 10^5",
        "words = input().split()\nbest = words[0]\nfor w in words:\n    if len(w) > len(best):\n        best = w\nprint(best)",
        ["I love programming", "cat dog bat", "a", "the quick brown fox jumped", "hello world"])

problem("count-words-frequency", "Most Frequent Word", "MEDIUM", "Hashing",
        "Find the word that occurs most often (case-insensitive, words separated by spaces). If several words tie, print the one that is alphabetically smallest. Print the word in lower case followed by its count.",
        "One line of words.", "Print `word count`.", "1 <= length <= 10^5",
        "from collections import Counter\nc = Counter(input().lower().split())\nbest = min(c, key=lambda w: (-c[w], w))\nprint(best, c[best])",
        ["the cat and the hat", "a b c", "Go go GO stop", "one", "x y y x z"])

# ---------------- Algorithms ----------------
problem("maximum-subarray-sum", "Maximum Subarray Sum", "HARD", "Dynamic programming",
        "Find the largest possible sum of a contiguous, non-empty part of the list (Kadane's algorithm).",
        "First line `n`. Second line `n` integers.", "Print the maximum sum.", "1 <= n <= 10^5, -10^4 <= values <= 10^4",
        "input()\nbest = cur = None\nfor x in map(int, input().split()):\n    cur = x if cur is None or cur < 0 else cur + x\n    best = cur if best is None else max(best, cur)\nprint(best)",
        [arr([-2, 1, -3, 4, -1, 2, 1, -5, 4]), arr([1]), arr([-3, -1, -2]), arr([5, 4, -1, 7, 8]),
         arr([((i * 37) % 201) - 100 for i in range(100000)])])

problem("longest-common-prefix", "Longest Common Prefix", "MEDIUM", "Strings",
        "Print the longest prefix shared by all the words. If there is none, print `-`.",
        "First line `n`. Next `n` lines: one word each.", "Print the prefix or `-`.", "1 <= n <= 1000, 1 <= word length <= 1000",
        "n = int(input())\nws = [input().strip() for _ in range(n)]\np = ws[0]\nfor w in ws[1:]:\n    while not w.startswith(p):\n        p = p[:-1]\nprint(p or '-')",
        [lines(3, "flower", "flow", "flight"), lines(3, "dog", "racecar", "car"), lines(1, "alone"), lines(2, "same", "same"), lines(4, "interview", "internet", "interval", "internal")])

problem("n-queens", "N-Queens Count", "HARD", "Backtracking",
        "Count the ways to place `n` queens on an `n x n` chessboard so that no two queens attack each other.",
        "One integer `n`.", "Print the number of arrangements.", "1 <= n <= 10",
        "n = int(input())\ndef go(r, cols, d1, d2):\n    if r == n:\n        return 1\n    t = 0\n    for c in range(n):\n        if c not in cols and r - c not in d1 and r + c not in d2:\n            t += go(r + 1, cols | {c}, d1 | {r - c}, d2 | {r + c})\n    return t\nprint(go(0, frozenset(), frozenset(), frozenset()))",
        ["4", "1", "2", "8", "6", "10"])

problem("longest-increasing-subsequence", "Longest Increasing Subsequence", "HARD", "Dynamic programming",
        "Print the length of the longest strictly increasing subsequence (the elements need not be next to each other).",
        "First line `n`. Second line `n` integers.", "Print the length.", "1 <= n <= 10^5",
        "import bisect\ninput()\ntails = []\nfor x in map(int, input().split()):\n    i = bisect.bisect_left(tails, x)\n    if i == len(tails):\n        tails.append(x)\n    else:\n        tails[i] = x\nprint(len(tails))",
        [arr([10, 9, 2, 5, 3, 7, 101, 18]), arr([0, 1, 0, 3, 2, 3]), arr([7, 7, 7, 7]), arr([5]), arr([(i * 7919) % 100003 for i in range(100000)])])

problem("coin-change", "Coin Change", "HARD", "Dynamic programming",
        "Given coin values (unlimited supply of each) and an amount, print the fewest coins that add up to the amount, or `-1` if it is impossible.",
        "First line `n amount`. Second line `n` coin values.", "Print the minimum number of coins or `-1`.", "1 <= n <= 100, 0 <= amount <= 10^4, 1 <= coin <= 10^4",
        "n, amount = map(int, input().split())\ncoins = list(map(int, input().split()))\nINF = float('inf')\ndp = [0] + [INF] * amount\nfor a in range(1, amount + 1):\n    for c in coins:\n        if c <= a and dp[a - c] + 1 < dp[a]:\n            dp[a] = dp[a - c] + 1\nprint(dp[amount] if dp[amount] != INF else -1)",
        [lines("3 11", "1 2 5"), lines("1 3", "2"), lines("1 0", "1"), lines("3 6", "1 3 4"), lines("4 9999", "7 13 29 101"), lines("2 7", "2 4")])

problem("stair-climbing", "Climbing Stairs", "MEDIUM", "Dynamic programming",
        "You can climb 1 or 2 steps at a time. Print the number of distinct ways to reach step `n`.",
        "One integer `n`.", "Print the number of ways.", "1 <= n <= 90",
        "n = int(input())\na, b = 1, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)",
        ["2", "3", "1", "10", "45", "90"])

problem("power-set", "All Subsets", "HARD", "Backtracking",
        "Print every subset of the numbers `1..n`, one per line, in lexicographic order of the numbers. Numbers inside a subset are separated by spaces and in increasing order; print the empty subset as `{}` first.",
        "One integer `n`.", "Print `2^n` lines.", "1 <= n <= 10",
        "n = int(input())\nprint('{}')\ndef go(start, cur):\n    for i in range(start, n + 1):\n        cur.append(i)\n        print(*cur)\n        go(i + 1, cur)\n        cur.pop()\ngo(1, [])",
        ["2", "1", "3", "4", "6"])

assert len({p["slug"] for p in P}) == len(P), "duplicate slug"


def run(code, stdin):
    done = subprocess.run([sys.executable, "-I", "-c", code], input=stdin, capture_output=True, text=True, timeout=30)
    if done.returncode:
        raise SystemExit(f"Reference solution failed:\n{done.stderr}")
    return done.stdout


out = []
for i, p in enumerate(P, 1):
    tests = [{"input": t if t.endswith("\n") or t == "" else t + "\n", "sample": n < p["samples"]} for n, t in enumerate(p.pop("tests"))]
    for t in tests:
        t["output"] = run(p["solution"], t["input"])
    out.append({"sequence": i, **{k: v for k, v in p.items() if k != "samples"}, "tests": tests})

target = pathlib.Path(__file__).with_name("problems.json")
with open(target, "w", encoding="utf-8", newline="\n") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
    f.write("\n")
print(f"Wrote {len(out)} problems, {sum(len(p['tests']) for p in out)} test cases to {target}")
