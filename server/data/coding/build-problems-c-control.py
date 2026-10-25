# C: decisions (if, else-if, switch, ternary) and loops (series, digits, primes). build-problems.py runs this file after build-problems-c.py.
# cq() writes the input lines for the reference solution and for the starter, so the two always agree.
import re

FMT = {"int": "%d", "long long": "%lld", "double": "%lf", "char": " %c", "float": "%f", "unsigned int": "%u"}


def _stubs(defs):
    """Empty versions of the functions in `defs`, for the starter: the signature with a blank body."""
    out, block = [], None
    for line in defs.split("\n"):
        if block is None and re.match(r"^[A-Za-z_][\w\s\*]*\(.*\)\s*\{\s*$", line):
            block = line.rstrip()[:-1].rstrip()
            void = block.lstrip().startswith("void")
            out.append(block + " {\n    \n" + ("" if void else "    return 0;\n") + "}\n")
        elif block is not None and line == "}":
            block = None
    return "\n".join(out)


def cq(slug, title, difficulty, topic, statement, input_format, output_format, *rest, inc="", samples=2, defs=""):
    # rest is (body, tests, vars) or, with a constraints line first, (constraints, body, tests, vars)
    cons, (body, tests, vars) = ("Values fit in an int.", rest) if len(rest) == 3 else (rest[0], rest[1:])
    decl, scan = [], []
    for kind, names in vars:
        if kind == "str":
            decl.append(f"char {names}[101];")
            scan.append(f'scanf("%100s", {names});')
        elif kind == "line":  # a whole line of text, newline removed
            decl.append(f"char {names}[256];")
            scan.append(f'fgets({names}, 256, stdin);')
            scan.append(f'for (int k = 0; {names}[k]; k++) if ({names}[k] == \'\\n\') {names}[k] = 0;')
        elif kind == "arr":  # names = "n a": a count and an array of that many ints
            count, arr_name = names.split()
            decl.append(f"int {count}, {arr_name}[1000];")
            scan.append(f'scanf("%d", &{count});')
            scan.append(f'for (int i = 0; i < {count}; i++) scanf("%d", &{arr_name}[i]);')
        elif kind == "mat":  # names = "r c m": rows, columns and an r x c matrix
            r, c, m = names.split()
            decl.append(f"int {r}, {c}, {m}[50][50];")
            scan.append(f'scanf("%d %d", &{r}, &{c});')
            scan.append(f'for (int i = 0; i < {r}; i++) for (int j = 0; j < {c}; j++) scanf("%d", &{m}[i][j]);')
        else:
            listed = names.split()
            decl.append(f"{kind} {', '.join(listed)};")
            scan.append(f'scanf("{" ".join(FMT[kind] for _ in listed)}", {", ".join("&" + n for n in listed)});')
    reads = "\n".join(decl + scan)
    pre = (defs.rstrip() + "\n\n") if defs else ""
    code = "#include <stdio.h>\n" + inc + "\n" + pre + "int main(void) {\n" + "".join(f"    {r}\n" for r in reads.split("\n") if r) + body.rstrip() + "\n    return 0;\n}"
    problem(slug, title, difficulty, topic, statement, input_format, output_format, cons, code, tests, samples=samples, **CC)
    rows = "".join(f"    {r}\n" for r in reads.split("\n") if r)
    stubs = (_stubs(defs) + "\n") if defs else ""
    P[-1]["starters"] = {"c": f"#include <stdio.h>\n{inc}\n{stubs}int main(void) {{\n{rows}    \n    return 0;\n}}\n"}


I1 = [("int", "n")]
YN = "Print `Yes` or `No`."

# ======================= if and if-else =======================
T = "Decisions: if / else"
cq("c-even-odd", "Even or Odd", "EASY", T, "Read an integer and print `Even` or `Odd` using if-else.", "One integer.", "`Even` or `Odd`.",
   '    if (n % 2 == 0) printf("Even\\n");\n    else printf("Odd\\n");', ["4", "7", "0", "-3", "100"], I1)
cq("c-sign-check", "Positive, Negative or Zero", "EASY", T, "Read an integer and print `Positive`, `Negative` or `Zero`.", "One integer.", "One word.",
   '    if (n > 0) printf("Positive\\n");\n    else if (n < 0) printf("Negative\\n");\n    else printf("Zero\\n");', ["5", "-8", "0", "1", "-1"], I1)
cq("c-vote-eligible", "Voting Eligibility", "EASY", T, "Read an age. Print `Eligible` if it is 18 or more, otherwise `Not eligible`.", "One integer: age.", "`Eligible` or `Not eligible`.",
   '    if (n >= 18) printf("Eligible\\n");\n    else printf("Not eligible\\n");', ["18", "17", "45", "0", "100"], [("int", "n")])
cq("c-div-5-and-11", "Divisible by 5 and 11", "EASY", T, "Read an integer. Print `Yes` if it is divisible by both 5 and 11, otherwise `No`.", "One integer.", YN,
   '    if (n % 5 == 0 && n % 11 == 0) printf("Yes\\n");\n    else printf("No\\n");', ["55", "10", "110", "33", "0"], I1)
cq("c-leap-year", "Leap Year", "EASY", T, "Read a year. A year is a leap year if it is divisible by 400, or divisible by 4 but not by 100. Print `Leap year` or `Not a leap year`.", "One integer: the year.", "`Leap year` or `Not a leap year`.",
   '    if ((n % 4 == 0 && n % 100 != 0) || n % 400 == 0) printf("Leap year\\n");\n    else printf("Not a leap year\\n");', ["2024", "1900", "2000", "2023", "2100"], [("int", "n")])
cq("c-is-uppercase", "Uppercase Letter?", "EASY", T, "Read one character. Print `Yes` if it is an uppercase letter (A-Z), otherwise `No`.", "One character.", YN,
   '    if (c >= \'A\' && c <= \'Z\') printf("Yes\\n");\n    else printf("No\\n");', ["A", "z", "5", "Z", "m"], [("char", "c")])
cq("c-is-lowercase", "Lowercase Letter?", "EASY", T, "Read one character. Print `Yes` if it is a lowercase letter (a-z), otherwise `No`.", "One character.", YN,
   '    if (c >= \'a\' && c <= \'z\') printf("Yes\\n");\n    else printf("No\\n");', ["a", "Z", "7", "z", "M"], [("char", "c")])
cq("c-vowel-or-consonant", "Vowel or Consonant", "EASY", T, "Read one letter (either case). Print `Vowel` or `Consonant`.", "One letter.", "`Vowel` or `Consonant`.",
   '    if (c == \'a\' || c == \'e\' || c == \'i\' || c == \'o\' || c == \'u\' || c == \'A\' || c == \'E\' || c == \'I\' || c == \'O\' || c == \'U\') printf("Vowel\\n");\n    else printf("Consonant\\n");', ["a", "B", "E", "z", "u"], [("char", "c")])
cq("c-pass-fail", "Pass or Fail", "EASY", T, "Read the percentage marks. 40 or more is `Pass`, otherwise `Fail`.", "One integer 0 to 100.", "`Pass` or `Fail`.",
   '    if (n >= 40) printf("Pass\\n");\n    else printf("Fail\\n");', ["75", "40", "39", "0", "100"], I1)
cq("c-max-of-two", "Larger of Two", "EASY", T, "Read two different integers and print the larger one.", "One line with two integers.", "The larger number.",
   '    if (a > b) printf("%d\\n", a);\n    else printf("%d\\n", b);', ["3 9", "9 3", "-4 -9", "0 5", "100 99"], [("int", "a b")])
cq("c-min-of-two", "Smaller of Two", "EASY", T, "Read two different integers and print the smaller one.", "One line with two integers.", "The smaller number.",
   '    if (a < b) printf("%d\\n", a);\n    else printf("%d\\n", b);', ["3 9", "9 3", "-4 -9", "0 5", "100 99"], [("int", "a b")])
cq("c-multiple-3-or-7", "Multiple of 3 or 7", "EASY", T, "Read an integer. Print `Yes` if it is a multiple of 3 or of 7, otherwise `No`.", "One integer.", YN,
   '    if (n % 3 == 0 || n % 7 == 0) printf("Yes\\n");\n    else printf("No\\n");', ["9", "14", "10", "21", "1"], I1)
cq("c-absolute-value", "Absolute Value", "EASY", T, "Read an integer and print its absolute value without using any library function.", "One integer.", "The absolute value.",
   '    if (n < 0) n = -n;\n    printf("%d\\n", n);', ["-5", "5", "0", "-1000000", "42"], I1)
cq("c-is-digit-char", "Digit Character?", "EASY", T, "Read one character. Print `Digit` if it is 0-9, otherwise `Not a digit`.", "One character.", "`Digit` or `Not a digit`.",
   '    if (c >= \'0\' && c <= \'9\') printf("Digit\\n");\n    else printf("Not a digit\\n");', ["7", "a", "0", "9", "#"], [("char", "c")])
cq("c-valid-triangle", "Valid Triangle", "EASY", T, "Three sides can form a triangle only if the sum of any two is greater than the third. Print `Valid` or `Invalid`.", "One line with three positive integers.", "`Valid` or `Invalid`.",
   '    if (a + b > c && a + c > b && b + c > a) printf("Valid\\n");\n    else printf("Invalid\\n");', ["3 4 5", "1 2 3", "5 5 5", "10 2 3", "7 10 5"], [("int", "a b c")])
cq("c-license-eligible", "Driving Licence Eligibility", "EASY", T, "A person can apply when the age is from 18 to 70 (both included). Print `Eligible` or `Not eligible`.", "One integer: age.", "`Eligible` or `Not eligible`.",
   '    if (n >= 18 && n <= 70) printf("Eligible\\n");\n    else printf("Not eligible\\n");', ["18", "70", "71", "17", "35"], I1)
cq("c-century-year", "Century Year", "EASY", T, "A century year ends in two zeros (1900, 2000). Print `Century year` or `Not a century year`.", "One positive integer.", "`Century year` or `Not a century year`.",
   '    if (n % 100 == 0) printf("Century year\\n");\n    else printf("Not a century year\\n");', ["1900", "2024", "2000", "100", "1999"], I1)
cq("c-equal-or-not", "Equal or Unequal", "EASY", T, "Read two integers. Print `Equal` or `Unequal`.", "One line with two integers.", "`Equal` or `Unequal`.",
   '    if (a == b) printf("Equal\\n");\n    else printf("Unequal\\n");', ["5 5", "5 6", "-1 -1", "0 1", "100 100"], [("int", "a b")])
cq("c-div-3-not-9", "Divisible by 3 but Not 9", "EASY", T, "Read an integer. Print `Yes` if it is divisible by 3 but not by 9, otherwise `No`.", "One integer.", YN,
   '    if (n % 3 == 0 && n % 9 != 0) printf("Yes\\n");\n    else printf("No\\n");', ["6", "9", "7", "12", "27"], I1)
cq("c-heat-warning", "Heat Warning", "EASY", T, "Read a temperature in degrees Celsius. Above 40 print `Heat warning`, otherwise `Normal`.", "One integer.", "`Heat warning` or `Normal`.",
   '    if (n > 40) printf("Heat warning\\n");\n    else printf("Normal\\n");', ["45", "40", "25", "41", "-5"], I1)
cq("c-div-4-not-100", "Divisible by 4 but Not 100", "EASY", T, "Read a year. Print `Yes` if it is divisible by 4 but not by 100, otherwise `No`.", "One integer.", YN,
   '    if (n % 4 == 0 && n % 100 != 0) printf("Yes\\n");\n    else printf("No\\n");', ["2024", "1900", "2023", "2000", "2096"], I1)
cq("c-alphabet-or-symbol", "Letter or Not", "EASY", T, "Read one character. Print `Alphabet` if it is a letter (either case), otherwise `Not an alphabet`.", "One character.", "`Alphabet` or `Not an alphabet`.",
   '    if ((c >= \'a\' && c <= \'z\') || (c >= \'A\' && c <= \'Z\')) printf("Alphabet\\n");\n    else printf("Not an alphabet\\n");', ["a", "Z", "5", "#", "m"], [("char", "c")])
cq("c-teenager", "Teenager?", "EASY", T, "A teenager is aged 13 to 19 (both included). Print `Yes` or `No`.", "One integer: age.", YN,
   '    if (n >= 13 && n <= 19) printf("Yes\\n");\n    else printf("No\\n");', ["13", "19", "12", "20", "16"], I1)
cq("c-single-digit", "Single-Digit Number", "EASY", T, "Print `Yes` if the number has exactly one digit (ignore the minus sign), otherwise `No`.", "One integer.", YN,
   '    if (n < 0) n = -n;\n    if (n <= 9) printf("Yes\\n");\n    else printf("No\\n");', ["7", "-3", "10", "0", "-99"], I1)
cq("c-three-digit", "Three-Digit Number", "EASY", T, "Print `Yes` if the number has exactly three digits (ignore the minus sign), otherwise `No`.", "One integer.", YN,
   '    if (n < 0) n = -n;\n    if (n >= 100 && n <= 999) printf("Yes\\n");\n    else printf("No\\n");', ["100", "-999", "99", "1000", "456"], I1)
cq("c-on-x-axis", "Point on the X-axis", "EASY", T, "A point lies strictly on the X-axis when `y` is 0 and `x` is not 0 (the origin does not count). Print `Yes` or `No`.", "One line: `x y`.", YN,
   '    if (y == 0 && x != 0) printf("Yes\\n");\n    else printf("No\\n");', ["5 0", "0 0", "3 4", "-2 0", "0 7"], [("int", "x y")])
cq("c-on-y-axis", "Point on the Y-axis", "EASY", T, "A point lies strictly on the Y-axis when `x` is 0 and `y` is not 0. Print `Yes` or `No`.", "One line: `x y`.", YN,
   '    if (x == 0 && y != 0) printf("Yes\\n");\n    else printf("No\\n");', ["0 5", "0 0", "3 4", "0 -2", "7 0"], [("int", "x y")])
cq("c-multiple-of-10", "Multiple of 10", "EASY", T, "Print `Yes` if the integer is a multiple of 10, otherwise `No`.", "One integer.", YN,
   '    if (n % 10 == 0) printf("Yes\\n");\n    else printf("No\\n");', ["50", "35", "0", "-20", "101"], I1)
cq("c-password-length", "Password Length", "EASY", T, "Read a password (no spaces). Count its characters with a loop. Print `Valid` when it has at least 8, otherwise `Too short`.", "One word of up to 100 characters.", "`Valid` or `Too short`.",
   '    int len = 0;\n    while (s[len] != \'\\0\') len++;\n    if (len >= 8) printf("Valid\\n");\n    else printf("Too short\\n");', ["abcdefgh", "abc", "NextByte1", "1234567", "passw0rd!"], [("str", "s")])
cq("c-top-score", "Top-Tier Score", "EASY", T, "Print `Top tier` when the score out of 100 is 90 or more, otherwise `Not top tier`.", "One integer 0 to 100.", "`Top tier` or `Not top tier`.",
   '    if (n >= 90) printf("Top tier\\n");\n    else printf("Not top tier\\n");', ["95", "90", "89", "0", "100"], I1)

# ======================= else-if ladder =======================
T = "Decisions: else-if ladder"
cq("c-letter-grade", "Letter Grade", "EASY", T, "Grade from the percentage: 90 or more `A`, 80 or more `B`, 70 or more `C`, 60 or more `D`, otherwise `F`.", "One integer 0 to 100.", "One letter.",
   '    if (n >= 90) printf("A\\n");\n    else if (n >= 80) printf("B\\n");\n    else if (n >= 70) printf("C\\n");\n    else if (n >= 60) printf("D\\n");\n    else printf("F\\n");', ["95", "85", "72", "65", "30", "90", "60"], I1)
cq("c-largest-of-three", "Largest of Three", "EASY", T, "Read three distinct integers and print the largest with an else-if ladder.", "One line with three integers.", "The largest.",
   '    if (a > b && a > c) printf("%d\\n", a);\n    else if (b > c) printf("%d\\n", b);\n    else printf("%d\\n", c);', ["1 2 3", "9 4 2", "5 10 7", "-1 -5 -3", "100 99 101"], [("int", "a b c")])
cq("c-smallest-of-three", "Smallest of Three", "EASY", T, "Read three distinct integers and print the smallest with an else-if ladder.", "One line with three integers.", "The smallest.",
   '    if (a < b && a < c) printf("%d\\n", a);\n    else if (b < c) printf("%d\\n", b);\n    else printf("%d\\n", c);', ["1 2 3", "9 4 2", "5 1 7", "-1 -5 -3", "100 99 101"], [("int", "a b c")])
cq("c-basic-calculator", "Basic Calculator", "EASY", T, "Read `a op b`, where `op` is `+`, `-`, `*` or `/`. Print the answer with two decimals. For `/` with `b = 0` print `Cannot divide by zero`. For any other operator print `Invalid operator`.", "One line: `a op b` (a and b are decimals).", "The result, or a message.",
   '    if (op == \'+\') printf("%.2f\\n", a + b);\n    else if (op == \'-\') printf("%.2f\\n", a - b);\n    else if (op == \'*\') printf("%.2f\\n", a * b);\n    else if (op == \'/\') {\n        if (b == 0) printf("Cannot divide by zero\\n");\n        else printf("%.2f\\n", a / b);\n    } else printf("Invalid operator\\n");',
   ["6 + 4", "6 - 10", "2.5 * 4", "7 / 2", "5 / 0", "5 % 2"], [("double", "a"), ("char", "op"), ("double", "b")])
cq("c-bmi-category", "BMI Category", "MEDIUM", T, "Read weight (kg) and height (m). BMI is `weight / (height * height)`. Below 18.5 print `Underweight`, below 25 `Normal`, below 30 `Overweight`, otherwise `Obese`.", "One line: weight height (decimals).", "One category.",
   '    double bmi = w / (h * h);\n    if (bmi < 18.5) printf("Underweight\\n");\n    else if (bmi < 25) printf("Normal\\n");\n    else if (bmi < 30) printf("Overweight\\n");\n    else printf("Obese\\n");', ["50 1.8", "70 1.75", "85 1.75", "110 1.7", "60 1.65"], [("double", "w h")])
cq("c-quadrant", "Quadrant of a Point", "EASY", T, "Print `Origin` for (0, 0), `On an axis` if exactly one of x, y is 0, otherwise the quadrant: `I` (x>0, y>0), `II` (x<0, y>0), `III` (x<0, y<0) or `IV` (x>0, y<0).", "One line: `x y`.", "One answer.",
   '    if (x == 0 && y == 0) printf("Origin\\n");\n    else if (x == 0 || y == 0) printf("On an axis\\n");\n    else if (x > 0 && y > 0) printf("I\\n");\n    else if (x < 0 && y > 0) printf("II\\n");\n    else if (x < 0 && y < 0) printf("III\\n");\n    else printf("IV\\n");', ["3 4", "-3 4", "-3 -4", "3 -4", "0 0", "0 5"], [("int", "x y")])
cq("c-electricity-bill", "Electricity Bill", "MEDIUM", T, "Units are charged in slabs: the first 100 units cost 2 each, the next 100 (101 to 200) cost 3 each, every unit above 200 costs 5 each. Print the total bill.", "One integer: units used.", "The bill.", "0 <= units <= 10000",
   '    int bill;\n    if (n <= 100) bill = n * 2;\n    else if (n <= 200) bill = 200 + (n - 100) * 3;\n    else bill = 200 + 300 + (n - 200) * 5;\n    printf("%d\\n", bill);', ["50", "100", "150", "200", "250", "0"], I1)
cq("c-time-greeting", "Greeting by Hour", "EASY", T, "Read the hour (0 to 23). 5 to 11 print `Good morning`, 12 to 16 `Good afternoon`, 17 to 20 `Good evening`, otherwise `Good night`.", "One integer.", "One greeting.",
   '    if (n >= 5 && n <= 11) printf("Good morning\\n");\n    else if (n >= 12 && n <= 16) printf("Good afternoon\\n");\n    else if (n >= 17 && n <= 20) printf("Good evening\\n");\n    else printf("Good night\\n");', ["8", "13", "19", "23", "3", "5", "12"], I1)
cq("c-triangle-type", "Type of Triangle", "EASY", T, "Read three sides. If they cannot form a triangle print `Not a triangle`; otherwise print `Equilateral` (all equal), `Isosceles` (exactly two equal) or `Scalene`.", "One line with three integers.", "One word (or message).",
   '    if (!(a + b > c && a + c > b && b + c > a)) printf("Not a triangle\\n");\n    else if (a == b && b == c) printf("Equilateral\\n");\n    else if (a == b || b == c || a == c) printf("Isosceles\\n");\n    else printf("Scalene\\n");', ["5 5 5", "5 5 8", "3 4 5", "1 2 3", "7 7 2"], [("int", "a b c")])
cq("c-age-bracket", "Age Bracket", "EASY", T, "Under 13 `Child`, 13 to 19 `Teenager`, 20 to 59 `Adult`, 60 or more `Senior Citizen`.", "One integer: age.", "One word.",
   '    if (n < 13) printf("Child\\n");\n    else if (n <= 19) printf("Teenager\\n");\n    else if (n <= 59) printf("Adult\\n");\n    else printf("Senior Citizen\\n");', ["5", "13", "25", "60", "19", "59"], I1)
cq("c-water-state", "State of Water", "EASY", T, "At 0 degrees or below water is `Ice`; above 0 and below 100 it is `Liquid`; at 100 or more it is `Steam`.", "One integer: temperature in Celsius.", "One word.",
   '    if (n <= 0) printf("Ice\\n");\n    else if (n < 100) printf("Liquid\\n");\n    else printf("Steam\\n");', ["-5", "0", "25", "99", "100", "150"], I1)
cq("c-income-tax", "Income Tax Slabs", "MEDIUM", T, "Tax is progressive: nothing on the first 250000; 5% of the part from 250001 to 500000; 20% of the part from 500001 to 1000000; 30% of everything above 1000000. Print the tax (integer, drop any fraction).", "One integer: annual income.", "The tax.", "0 <= income <= 10^8",
   '    long long tax;\n    if (n <= 250000) tax = 0;\n    else if (n <= 500000) tax = (n - 250000) * 5 / 100;\n    else if (n <= 1000000) tax = 12500 + (n - 500000) * 20 / 100;\n    else tax = 112500 + (n - 1000000) * 30 / 100;\n    printf("%lld\\n", tax);', ["200000", "400000", "500000", "800000", "1000000", "1500000"], [("long long", "n")])
cq("c-performance-bonus", "Performance Bonus", "EASY", T, "Read a rating (1, 2 or 3) and a salary. Rating 1 gives 5% of the salary as a bonus, 2 gives 10%, 3 gives 20%. Print the bonus (integer). Any other rating: print `Invalid rating`.", "One line: `rating salary`.", "The bonus, or a message.",
   '    if (r == 1) printf("%d\\n", s * 5 / 100);\n    else if (r == 2) printf("%d\\n", s * 10 / 100);\n    else if (r == 3) printf("%d\\n", s * 20 / 100);\n    else printf("Invalid rating\\n");', ["1 50000", "2 50000", "3 40000", "4 1000", "0 500"], [("int", "r s")])
cq("c-parking-fee", "Parking Fee", "EASY", T, "Parking is charged by hours: up to 2 hours 20; up to 5 hours 50; up to 10 hours 100; more than 10 hours 150. Print the fee.", "One integer: hours (at least 1).", "The fee.",
   '    if (n <= 2) printf("20\\n");\n    else if (n <= 5) printf("50\\n");\n    else if (n <= 10) printf("100\\n");\n    else printf("150\\n");', ["1", "3", "7", "12", "2", "5", "10"], I1)
cq("c-library-fine", "Library Late Fee", "MEDIUM", T, "0 or fewer days late: no fee. Days 1 to 7: 2 per day. Days 8 to 30: the 14 for the first week plus 5 per day after day 7. More than 30 days: the fee for day 30 plus 10 per day after day 30.", "One integer: days late.", "The fee.",
   '    int fee;\n    if (n <= 0) fee = 0;\n    else if (n <= 7) fee = n * 2;\n    else if (n <= 30) fee = 14 + (n - 7) * 5;\n    else fee = 14 + 23 * 5 + (n - 30) * 10;\n    printf("%d\\n", fee);', ["0", "5", "7", "10", "30", "40"], I1)
cq("c-month-season", "Season of a Month", "EASY", T, "December, January, February are `Winter`; March to May `Spring`; June to August `Summer`; September to November `Autumn`. Any number outside 1 to 12 prints `Invalid month`.", "One integer: month number.", "One word.",
   '    if (n == 12 || n == 1 || n == 2) printf("Winter\\n");\n    else if (n >= 3 && n <= 5) printf("Spring\\n");\n    else if (n >= 6 && n <= 8) printf("Summer\\n");\n    else if (n >= 9 && n <= 11) printf("Autumn\\n");\n    else printf("Invalid month\\n");', ["1", "4", "7", "10", "12", "13"], I1)
cq("c-password-strength", "Password Strength", "MEDIUM", T, "Count how many of these hold: length of at least 8, has an uppercase letter, has a lowercase letter, has a digit. 4 is `Strong`, 2 or 3 is `Moderate`, otherwise `Weak`.", "One word (no spaces).", "`Weak`, `Moderate` or `Strong`.",
   '    int len = 0, up = 0, low = 0, dig = 0;\n    for (; s[len] != \'\\0\'; len++) {\n        if (s[len] >= \'A\' && s[len] <= \'Z\') up = 1;\n        else if (s[len] >= \'a\' && s[len] <= \'z\') low = 1;\n        else if (s[len] >= \'0\' && s[len] <= \'9\') dig = 1;\n    }\n    int score = (len >= 8) + up + low + dig;\n    if (score == 4) printf("Strong\\n");\n    else if (score >= 2) printf("Moderate\\n");\n    else printf("Weak\\n");', ["Abcdef12", "abc", "abcdefgh", "ABC123", "12345", "Ab1"], [("str", "s")])
cq("c-speed-penalty", "Speed Penalty", "EASY", T, "Read the speed limit and your speed. Not over the limit: `No fine`. Over by up to 10: `Warning`. Over by up to 30: `Fine 500`. Over by more than 30: `License suspended`.", "One line: `limit speed`.", "One result.",
   '    int over = speed - limit;\n    if (over <= 0) printf("No fine\\n");\n    else if (over <= 10) printf("Warning\\n");\n    else if (over <= 30) printf("Fine 500\\n");\n    else printf("License suspended\\n");', ["60 50", "60 65", "60 80", "60 100", "80 90", "80 110"], [("int", "limit speed")])
cq("c-nature-of-roots", "Nature of Quadratic Roots", "MEDIUM", T, "For `a x^2 + b x + c = 0` find the discriminant `b*b - 4*a*c`. Greater than 0: `Real and distinct`; equal to 0: `Real and equal`; less than 0: `Imaginary`.", "One line: `a b c` (a is not 0).", "One answer.",
   '    int d = b * b - 4 * a * c;\n    if (d > 0) printf("Real and distinct\\n");\n    else if (d == 0) printf("Real and equal\\n");\n    else printf("Imaginary\\n");', ["1 -3 2", "1 2 1", "1 1 1", "2 4 -6", "3 0 3"], [("int", "a b c")])
cq("c-weekday-ladder", "Weekday Name", "EASY", T, "Print the weekday for 1 (Monday) to 7 (Sunday). Anything else: `Invalid day`.", "One integer.", "The day name.",
   '    if (n == 1) printf("Monday\\n");\n    else if (n == 2) printf("Tuesday\\n");\n    else if (n == 3) printf("Wednesday\\n");\n    else if (n == 4) printf("Thursday\\n");\n    else if (n == 5) printf("Friday\\n");\n    else if (n == 6) printf("Saturday\\n");\n    else if (n == 7) printf("Sunday\\n");\n    else printf("Invalid day\\n");', ["1", "4", "7", "0", "8"], I1)
cq("c-bank-fee", "Bank Transaction Fee", "EASY", T, "Fee by amount: under 1000 is free (0); 1000 to 9999 costs 5; 10000 to 99999 costs 20; 100000 or more costs 50.", "One integer: amount.", "The fee.",
   '    if (n < 1000) printf("0\\n");\n    else if (n < 10000) printf("5\\n");\n    else if (n < 100000) printf("20\\n");\n    else printf("50\\n");', ["500", "1000", "9999", "10000", "99999", "100000"], I1)
cq("c-movie-ticket", "Movie Ticket Price", "MEDIUM", T, "Read the age and the show hour (0 to 23). Under 5: free (0). Age 5 to 12: 100. Age 60 or more: 120. Everyone else: 200. Shows at 18:00 or later cost 50 more (except free tickets). Print the price.", "One line: `age hour`.", "The price.",
   '    int price;\n    if (age < 5) price = 0;\n    else if (age <= 12) price = 100;\n    else if (age >= 60) price = 120;\n    else price = 200;\n    if (price > 0 && hour >= 18) price += 50;\n    printf("%d\\n", price);', ["3 20", "8 10", "8 19", "70 12", "30 18", "30 17"], [("int", "age hour")])
cq("c-cart-discount", "Cart Discount", "EASY", T, "Totals of 5000 or more get 20% off, 2000 or more get 10% off, 1000 or more get 5% off, otherwise no discount. Print the amount to pay (integer, drop any fraction).", "One integer: cart total.", "The payable amount.",
   '    int pay;\n    if (n >= 5000) pay = n - n * 20 / 100;\n    else if (n >= 2000) pay = n - n * 10 / 100;\n    else if (n >= 1000) pay = n - n * 5 / 100;\n    else pay = n;\n    printf("%d\\n", pay);', ["500", "1000", "2500", "5000", "7777"], I1)
cq("c-loan-approval", "Loan Approval", "MEDIUM", T, "A loan is `Approved` when age is 21 to 60, salary is at least 25000 and credit score is at least 700. If only the credit score is lower but at least 650 (age and salary fine), print `Manual review`. Otherwise `Rejected`.", "One line: `age salary credit`.", "One result.",
   '    int base = age >= 21 && age <= 60 && salary >= 25000;\n    if (base && credit >= 700) printf("Approved\\n");\n    else if (base && credit >= 650) printf("Manual review\\n");\n    else printf("Rejected\\n");', ["30 50000 750", "30 50000 680", "30 50000 600", "19 50000 800", "40 20000 800"], [("int", "age salary credit")])
cq("c-courier-cost", "Courier Cost", "EASY", T, "Weight in whole kg: up to 1 costs 50; up to 5 costs 120; up to 10 costs 200; above 10 costs 200 plus 30 for each extra kg over 10.", "One integer: weight.", "The cost.",
   '    if (n <= 1) printf("50\\n");\n    else if (n <= 5) printf("120\\n");\n    else if (n <= 10) printf("200\\n");\n    else printf("%d\\n", 200 + (n - 10) * 30);', ["1", "4", "8", "10", "15"], I1)
cq("c-hostel-room", "Hostel Room by Year", "EASY", T, "Year 1: `Triple sharing`. Year 2: `Double sharing`. Year 3: `Single room (waiting list)`. Year 4: `Single room`. Any other number: `Invalid year`.", "One integer: academic year.", "One line.",
   '    if (n == 1) printf("Triple sharing\\n");\n    else if (n == 2) printf("Double sharing\\n");\n    else if (n == 3) printf("Single room (waiting list)\\n");\n    else if (n == 4) printf("Single room\\n");\n    else printf("Invalid year\\n");', ["1", "2", "3", "4", "5"], I1)
cq("c-clock-validity", "Is the Time Valid?", "EASY", T, "Read hours, minutes, seconds. Check in this order: hours must be 0 to 23 (else `Invalid hour`), minutes 0 to 59 (else `Invalid minute`), seconds 0 to 59 (else `Invalid second`). If all fine print `Valid time`.", "One line: `h m s`.", "One result.",
   '    if (h < 0 || h > 23) printf("Invalid hour\\n");\n    else if (m < 0 || m > 59) printf("Invalid minute\\n");\n    else if (s < 0 || s > 59) printf("Invalid second\\n");\n    else printf("Valid time\\n");', ["10 30 45", "24 0 0", "12 60 0", "12 30 60", "0 0 0", "-1 5 5"], [("int", "h m s")])
cq("c-wind-speed", "Wind Description", "EASY", T, "Speed in km/h: under 12 `Calm`; 12 to 49 `Breeze`; 50 to 89 `Gale`; 90 or more `Storm`.", "One integer.", "One word.",
   '    if (n < 12) printf("Calm\\n");\n    else if (n < 50) printf("Breeze\\n");\n    else if (n < 90) printf("Gale\\n");\n    else printf("Storm\\n");', ["5", "12", "30", "50", "89", "120"], I1)
cq("c-blood-donation", "Blood Donation Eligibility", "MEDIUM", T, "A donor needs age 18 to 65, weight at least 50 kg and haemoglobin at least 12.5. Check in that order and print `Eligible`, or `Not eligible: age`, `Not eligible: weight` or `Not eligible: haemoglobin` for the first failure.", "One line: `age weight haemoglobin` (haemoglobin is a decimal).", "One result.",
   '    if (age < 18 || age > 65) printf("Not eligible: age\\n");\n    else if (weight < 50) printf("Not eligible: weight\\n");\n    else if (hb < 12.5) printf("Not eligible: haemoglobin\\n");\n    else printf("Eligible\\n");', ["30 60 13.5", "17 60 13.5", "30 45 13.5", "30 60 11", "65 50 12.5", "66 60 14"], [("int", "age weight"), ("double", "hb")])
cq("c-tax-regime", "Old or New Tax Regime", "HARD", T, "Old regime tax = 20% of (income - deductions - 250000), or 0 if that is negative. New regime tax = 15% of (income - 300000), or 0 if negative (integer arithmetic, drop fractions). Print `Old regime` if the old tax is lower, `New regime` if the new tax is lower, `Same` if equal.", "One line: `income deductions`.", "`Old regime`, `New regime` or `Same`.", "0 <= values <= 10^8",
   '    long long oldBase = income - ded - 250000, newBase = income - 300000;\n    long long oldTax = oldBase > 0 ? oldBase * 20 / 100 : 0;\n    long long newTax = newBase > 0 ? newBase * 15 / 100 : 0;\n    if (oldTax < newTax) printf("Old regime\\n");\n    else if (newTax < oldTax) printf("New regime\\n");\n    else printf("Same\\n");', ["1000000 500000", "1000000 0", "200000 0", "600000 100000", "1500000 100000"], [("long long", "income ded")])

# ======================= switch =======================
T = "Decisions: switch"
cq("c-days-in-month", "Days in a Month", "EASY", T, "Use `switch` to print the number of days in a month (February has 28). Months outside 1 to 12 print `Invalid month`.", "One integer: month.", "The days.",
   '    switch (n) {\n        case 2: printf("28\\n"); break;\n        case 4: case 6: case 9: case 11: printf("30\\n"); break;\n        case 1: case 3: case 5: case 7: case 8: case 10: case 12: printf("31\\n"); break;\n        default: printf("Invalid month\\n");\n    }', ["1", "2", "4", "12", "13", "9"], I1)
cq("c-vowel-switch", "Vowel with switch", "EASY", T, "Read a character. Using `switch` with grouped cases, print `Vowel` for a, e, i, o, u (either case), `Consonant` for other letters and `Not a letter` for anything else.", "One character.", "One result.",
   '    switch (c) {\n        case \'a\': case \'e\': case \'i\': case \'o\': case \'u\':\n        case \'A\': case \'E\': case \'I\': case \'O\': case \'U\':\n            printf("Vowel\\n"); break;\n        default:\n            if ((c >= \'a\' && c <= \'z\') || (c >= \'A\' && c <= \'Z\')) printf("Consonant\\n");\n            else printf("Not a letter\\n");\n    }', ["a", "E", "b", "Z", "5", "#"], [("char", "c")])
cq("c-calculator-switch", "Calculator with switch", "EASY", T, "Read `a op b` (integers). Use `switch` on `op` for `+`, `-`, `*`, `/` (integer division) and `%`. Division or remainder by 0 prints `Cannot divide by zero`. Another operator prints `Invalid operator`.", "One line: `a op b`.", "The result or a message.",
   '    switch (op) {\n        case \'+\': printf("%d\\n", a + b); break;\n        case \'-\': printf("%d\\n", a - b); break;\n        case \'*\': printf("%d\\n", a * b); break;\n        case \'/\': if (b == 0) printf("Cannot divide by zero\\n"); else printf("%d\\n", a / b); break;\n        case \'%\': if (b == 0) printf("Cannot divide by zero\\n"); else printf("%d\\n", a % b); break;\n        default: printf("Invalid operator\\n");\n    }',
   ["8 + 3", "8 - 10", "6 * 7", "17 / 5", "17 % 5", "5 / 0", "5 ^ 2"], [("int", "a"), ("char", "op"), ("int", "b")])
cq("c-traffic-signal", "Traffic Signal", "EASY", T, "Read `R`, `Y` or `G`. Print `Stop`, `Get ready` or `Go`. Any other letter: `Invalid signal`.", "One uppercase letter.", "One message.",
   '    switch (c) {\n        case \'R\': printf("Stop\\n"); break;\n        case \'Y\': printf("Get ready\\n"); break;\n        case \'G\': printf("Go\\n"); break;\n        default: printf("Invalid signal\\n");\n    }', ["R", "Y", "G", "B", "X"], [("char", "c")])
cq("c-department-code", "Department Name", "EASY", T, "Map 1 to `Computer Science`, 2 `Electronics`, 3 `Mechanical`, 4 `Civil`. Any other code prints `Unknown department`.", "One integer.", "The department.",
   '    switch (n) {\n        case 1: printf("Computer Science\\n"); break;\n        case 2: printf("Electronics\\n"); break;\n        case 3: printf("Mechanical\\n"); break;\n        case 4: printf("Civil\\n"); break;\n        default: printf("Unknown department\\n");\n    }', ["1", "2", "3", "4", "9"], I1)
cq("c-vending-machine", "Vending Machine", "MEDIUM", T, "Choices: 1 Tea (10), 2 Coffee (15), 3 Juice (25), 4 Water (5). Read the choice and the money inserted. If the money is enough print `Dispensed <item>, change <money - price>`. If not enough print `Not enough money`. A wrong choice prints `Invalid choice`.", "One line: `choice money`.", "One line.",
   '    int price = 0;\n    const char *item = "";\n    switch (choice) {\n        case 1: price = 10; item = "Tea"; break;\n        case 2: price = 15; item = "Coffee"; break;\n        case 3: price = 25; item = "Juice"; break;\n        case 4: price = 5; item = "Water"; break;\n        default: printf("Invalid choice\\n"); return 0;\n    }\n    if (money >= price) printf("Dispensed %s, change %d\\n", item, money - price);\n    else printf("Not enough money\\n");', ["1 20", "2 15", "3 10", "4 5", "7 100"], [("int", "choice money")])
cq("c-card-suit", "Card Suit", "EASY", T, "Read `S`, `H`, `D` or `C` and print `Spades`, `Hearts`, `Diamonds` or `Clubs`. Anything else: `Invalid suit`.", "One uppercase letter.", "One word.",
   '    switch (c) {\n        case \'S\': printf("Spades\\n"); break;\n        case \'H\': printf("Hearts\\n"); break;\n        case \'D\': printf("Diamonds\\n"); break;\n        case \'C\': printf("Clubs\\n"); break;\n        default: printf("Invalid suit\\n");\n    }', ["S", "H", "D", "C", "X"], [("char", "c")])
cq("c-shape-area-menu", "Area Menu", "MEDIUM", T, "Choose a shape: 1 circle (then radius), 2 rectangle (then length and width), 3 triangle (then base and height). Print the area with two decimals. Use 3.14159 for pi. Any other choice prints `Invalid choice`.", "One line: the choice followed by its numbers.", "The area.", "Numbers are decimals.",
   '    double a, b;\n    switch (choice) {\n        case 1: scanf("%lf", &a); printf("%.2f\\n", 3.14159 * a * a); break;\n        case 2: scanf("%lf %lf", &a, &b); printf("%.2f\\n", a * b); break;\n        case 3: scanf("%lf %lf", &a, &b); printf("%.2f\\n", 0.5 * a * b); break;\n        default: printf("Invalid choice\\n");\n    }', ["1 2", "2 4 5", "3 6 3", "4", "1 10.5"], [("int", "choice")])
cq("c-compass-direction", "Compass Direction", "EASY", T, "Read `N`, `S`, `E` or `W` and print `North`, `South`, `East` or `West`. Anything else: `Invalid direction`.", "One uppercase letter.", "One word.",
   '    switch (c) {\n        case \'N\': printf("North\\n"); break;\n        case \'S\': printf("South\\n"); break;\n        case \'E\': printf("East\\n"); break;\n        case \'W\': printf("West\\n"); break;\n        default: printf("Invalid direction\\n");\n    }', ["N", "S", "E", "W", "Q"], [("char", "c")])
cq("c-rating-feedback", "Rating Feedback", "EASY", T, "Rating 1 `Poor`, 2 `Fair`, 3 `Good`, 4 `Very good`, 5 `Excellent`. Anything else: `Invalid rating`.", "One integer.", "The feedback.",
   '    switch (n) {\n        case 1: printf("Poor\\n"); break;\n        case 2: printf("Fair\\n"); break;\n        case 3: printf("Good\\n"); break;\n        case 4: printf("Very good\\n"); break;\n        case 5: printf("Excellent\\n"); break;\n        default: printf("Invalid rating\\n");\n    }', ["1", "3", "5", "0", "6"], I1)
cq("c-weekday-switch", "Weekday with switch", "EASY", T, "Print the weekday for 1 (Monday) to 7 (Sunday) with `switch`. Anything else: `Invalid day`.", "One integer.", "The day name.",
   '    switch (n) {\n        case 1: printf("Monday\\n"); break;\n        case 2: printf("Tuesday\\n"); break;\n        case 3: printf("Wednesday\\n"); break;\n        case 4: printf("Thursday\\n"); break;\n        case 5: printf("Friday\\n"); break;\n        case 6: printf("Saturday\\n"); break;\n        case 7: printf("Sunday\\n"); break;\n        default: printf("Invalid day\\n");\n    }', ["1", "5", "7", "0", "9"], I1)
cq("c-printer-status", "Printer Status Code", "EASY", T, "Code 0 `Ready`, 1 `Out of paper`, 2 `Paper jam`, 3 `Low ink`. Any other code: `Unknown error`.", "One integer.", "The status.",
   '    switch (n) {\n        case 0: printf("Ready\\n"); break;\n        case 1: printf("Out of paper\\n"); break;\n        case 2: printf("Paper jam\\n"); break;\n        case 3: printf("Low ink\\n"); break;\n        default: printf("Unknown error\\n");\n    }', ["0", "1", "2", "3", "42"], I1)
cq("c-currency-converter", "Currency Converter", "MEDIUM", T, "Convert rupees: choice 1 divides by 80 (dollars), 2 divides by 90 (euros), 3 divides by 100 (pounds). Read the choice and the amount; print the result with two decimals. Another choice prints `Invalid choice`.", "One line: `choice amount` (amount is a decimal).", "The converted amount.",
   '    switch (choice) {\n        case 1: printf("%.2f\\n", amount / 80); break;\n        case 2: printf("%.2f\\n", amount / 90); break;\n        case 3: printf("%.2f\\n", amount / 100); break;\n        default: printf("Invalid choice\\n");\n    }', ["1 800", "2 450", "3 1250.5", "4 100", "1 0"], [("int", "choice"), ("double", "amount")])
cq("c-user-role", "User Role", "EASY", T, "Role 1 prints `Admin: full access`, 2 `Moderator: can edit posts`, 3 `Guest: read only`. Anything else: `Unknown role`.", "One integer.", "One line.",
   '    switch (n) {\n        case 1: printf("Admin: full access\\n"); break;\n        case 2: printf("Moderator: can edit posts\\n"); break;\n        case 3: printf("Guest: read only\\n"); break;\n        default: printf("Unknown role\\n");\n    }', ["1", "2", "3", "0", "7"], I1)
cq("c-sort-option", "Sort Option", "EASY", T, "Option 1 prints `Sorting by name`, 2 `Sorting by price`, 3 `Sorting by rating`. Anything else: `Invalid option`.", "One integer.", "One line.",
   '    switch (n) {\n        case 1: printf("Sorting by name\\n"); break;\n        case 2: printf("Sorting by price\\n"); break;\n        case 3: printf("Sorting by rating\\n"); break;\n        default: printf("Invalid option\\n");\n    }', ["1", "2", "3", "4", "0"], I1)

# ======================= ternary =======================
T = "Ternary operator"
cq("c-ternary-max", "Larger of Two (ternary)", "EASY", T, "Print the larger of two integers with one ternary expression.", "One line with two integers.", "The larger number.",
   '    printf("%d\\n", a > b ? a : b);', ["3 9", "9 3", "-4 -9", "5 5", "0 -1"], [("int", "a b")])
cq("c-ternary-even-odd", "Even or Odd (ternary)", "EASY", T, "Print `Even` or `Odd` with a ternary operator.", "One integer.", "`Even` or `Odd`.",
   '    printf("%s\\n", n % 2 == 0 ? "Even" : "Odd");', ["4", "7", "0", "-3", "11"], I1)
cq("c-signum", "Signum Function", "EASY", T, "Print `1` for a positive number, `-1` for a negative number and `0` for zero, using a nested ternary.", "One integer.", "`1`, `-1` or `0`.",
   '    printf("%d\\n", n > 0 ? 1 : (n < 0 ? -1 : 0));', ["9", "-9", "0", "1", "-1000"], I1)
cq("c-ternary-abs", "Absolute Value (ternary)", "EASY", T, "Print the absolute value with a ternary operator.", "One integer.", "The absolute value.",
   '    printf("%d\\n", n < 0 ? -n : n);', ["-5", "5", "0", "-1000000", "77"], I1)
cq("c-ternary-vote", "Vote Eligibility (ternary)", "EASY", T, "In a single line print `Eligible` if the age is 18 or more, otherwise `Not eligible`.", "One integer: age.", "`Eligible` or `Not eligible`.",
   '    printf("%s\\n", n >= 18 ? "Eligible" : "Not eligible");', ["18", "17", "40", "0", "99"], I1)
cq("c-ternary-min3", "Smallest of Three (ternary)", "EASY", T, "Print the smallest of three integers with a nested ternary.", "One line with three integers.", "The smallest.",
   '    printf("%d\\n", a < b ? (a < c ? a : c) : (b < c ? b : c));', ["1 2 3", "9 4 2", "5 1 7", "-1 -5 -3", "8 8 8"], [("int", "a b c")])
cq("c-ternary-pass-fail", "Pass or Fail (ternary)", "EASY", T, "Print `Pass` for marks of 40 or more, otherwise `Fail`, using a ternary.", "One integer.", "`Pass` or `Fail`.",
   '    printf("%s\\n", n >= 40 ? "Pass" : "Fail");', ["75", "40", "39", "0", "100"], I1)
cq("c-ternary-leap-year", "Leap Year (ternary)", "MEDIUM", T, "Print `Leap year` or `Not a leap year` using one ternary expression with `&&` and `||`.", "One integer: the year.", "`Leap year` or `Not a leap year`.",
   '    printf("%s\\n", (n % 4 == 0 && n % 100 != 0) || n % 400 == 0 ? "Leap year" : "Not a leap year");', ["2024", "1900", "2000", "2023", "2100"], I1)
cq("c-ternary-div-10", "Divisible by 10 (ternary)", "EASY", T, "Print `Divisible by 10` or `Not divisible by 10` using a ternary.", "One integer.", "One of the two messages.",
   '    printf("%s\\n", n % 10 == 0 ? "Divisible by 10" : "Not divisible by 10");', ["50", "35", "0", "-20", "101"], I1)
cq("c-discount-flag", "Discount Flag", "EASY", T, "Set `flag = amount >= 1000 ? 1 : 0;` and print it. `1` means the customer is eligible for a discount.", "One integer: purchase amount.", "`1` or `0`.",
   '    int flag = n >= 1000 ? 1 : 0;\n    printf("%d\\n", flag);', ["1500", "1000", "999", "0", "50000"], I1)
cq("c-ternary-max3", "Largest of Three (ternary)", "EASY", T, "Print the largest of three integers with a nested ternary.", "One line with three integers.", "The largest.",
   '    printf("%d\\n", a > b ? (a > c ? a : c) : (b > c ? b : c));', ["1 2 3", "9 4 2", "5 10 7", "-1 -5 -3", "6 6 6"], [("int", "a b c")])
cq("c-shipping-tier", "Shipping Tier", "EASY", T, "A parcel of up to 5 kg ships as `Standard`; heavier parcels ship as `Heavy`. Use a ternary.", "One integer: weight in kg.", "`Standard` or `Heavy`.",
   '    printf("%s\\n", n <= 5 ? "Standard" : "Heavy");', ["2", "5", "6", "30", "1"], I1)
cq("c-ternary-letter-case", "Lowercase or Uppercase", "EASY", T, "Read a letter. Print `Lowercase` if it is between `a` and `z`, otherwise `Uppercase` (inputs are always letters). Use a ternary.", "One letter.", "`Lowercase` or `Uppercase`.",
   '    printf("%s\\n", c >= \'a\' && c <= \'z\' ? "Lowercase" : "Uppercase");', ["a", "Z", "m", "Q", "z"], [("char", "c")])
cq("c-member-price", "Member Price", "EASY", T, "Read a member flag (1 member, 0 not), the member price and the regular price. Print the price this customer pays, using a ternary.", "One line: `flag memberPrice regularPrice`.", "The price.",
   '    printf("%d\\n", flag ? member : regular);', ["1 80 100", "0 80 100", "1 5 9", "0 5 9", "1 0 0"], [("int", "flag member regular")])
cq("c-a-grade", "A Grade Message", "EASY", T, "Print `A grade` when the marks are above 85, otherwise `Standard`, using a ternary.", "One integer.", "`A grade` or `Standard`.",
   '    printf("%s\\n", n > 85 ? "A grade" : "Standard");', ["90", "85", "86", "40", "100"], I1)

# ======================= loops: iteration and series =======================
T = "Loops: series"
LN = [("long long", "n")]
cq("c-print-1-to-10", "Print 1 to 10", "EASY", T, "Print the numbers from 1 to 10 on one line separated by spaces, using a `for` loop.", "There is no input.", "`1 2 3 ... 10`.",
   '    for (int i = 1; i <= 10; i++) printf("%d%c", i, i == 10 ? \'\\n\' : \' \');', [""], (), samples=1)
cq("c-print-10-to-1", "Count Down", "EASY", T, "Print the numbers from 10 down to 1 on one line separated by spaces, using a `while` loop.", "There is no input.", "`10 9 8 ... 1`.",
   '    int i = 10;\n    while (i >= 1) {\n        printf("%d%c", i, i == 1 ? \'\\n\' : \' \');\n        i--;\n    }', [""], (), samples=1)
cq("c-evens-to-50", "Even Numbers up to 50", "EASY", T, "Print every even number from 1 to 50 on one line.", "There is no input.", "`2 4 6 ... 50`.",
   '    for (int i = 2; i <= 50; i += 2) printf("%d%c", i, i == 50 ? \'\\n\' : \' \');', [""], (), samples=1)
cq("c-odds-to-50", "Odd Numbers up to 50", "EASY", T, "Print every odd number from 1 to 50 on one line, using a `while` loop.", "There is no input.", "`1 3 5 ... 49`.",
   '    int i = 1;\n    while (i <= 49) {\n        printf("%d%c", i, i == 49 ? \'\\n\' : \' \');\n        i += 2;\n    }', [""], (), samples=1)
cq("c-multiplication-table", "Multiplication Table", "EASY", T, "Read `n` and print its table from 1 to 10, one line each, like `5 x 3 = 15`.", "One integer.", "Ten lines.", "1 <= n <= 1000",
   '    for (int i = 1; i <= 10; i++) printf("%d x %d = %d\\n", n, i, n * i);', ["5", "12", "1", "100", "7"], I1)
cq("c-sum-natural", "Sum of the First N Numbers", "EASY", T, "Read `n` and print `1 + 2 + ... + n`, using a loop.", "One integer.", "The sum.", "1 <= n <= 100000",
   '    long long sum = 0;\n    for (int i = 1; i <= n; i++) sum += i;\n    printf("%lld\\n", sum);', ["10", "1", "100", "100000", "37"], I1)
cq("c-sum-evens", "Sum of Even Numbers", "EASY", T, "Read `n` and print the sum of all even numbers from 1 to `n`.", "One integer.", "The sum.", "1 <= n <= 100000",
   '    long long sum = 0;\n    for (int i = 2; i <= n; i += 2) sum += i;\n    printf("%lld\\n", sum);', ["10", "1", "7", "100000", "50"], I1)
cq("c-sum-odds", "Sum of Odd Numbers", "EASY", T, "Read `n` and print the sum of all odd numbers from 1 to `n`.", "One integer.", "The sum.", "1 <= n <= 100000",
   '    long long sum = 0;\n    for (int i = 1; i <= n; i += 2) sum += i;\n    printf("%lld\\n", sum);', ["10", "1", "7", "100000", "51"], I1)
cq("c-ascii-uppercase", "ASCII of A to Z", "EASY", T, "Print each capital letter with its ASCII code, one per line, like `A 65`.", "There is no input.", "26 lines.",
   '    for (char c = \'A\'; c <= \'Z\'; c++) printf("%c %d\\n", c, c);', [""], (), samples=1)
cq("c-ascii-lowercase", "ASCII of a to z", "EASY", T, "Print each small letter with its ASCII code, one per line, like `a 97`.", "There is no input.", "26 lines.",
   '    for (char c = \'a\'; c <= \'z\'; c++) printf("%c %d\\n", c, c);', [""], (), samples=1)
cq("c-factorial-loop", "Factorial with a Loop", "EASY", T, "Read `n` and print `n!` using a loop (`0! = 1`).", "One integer.", "The factorial.", "0 <= n <= 20",
   '    long long f = 1;\n    for (int i = 2; i <= n; i++) f *= i;\n    printf("%lld\\n", f);', ["5", "0", "1", "10", "20"], I1)
cq("c-power-loop", "Power with a Loop", "EASY", T, "Read `x` and `y` and print `x` raised to `y` by multiplying in a loop. Do not use `pow`.", "One line: `x y`.", "The result.", "1 <= x <= 10, 0 <= y <= 15",
   '    long long r = 1;\n    for (int i = 0; i < y; i++) r *= x;\n    printf("%lld\\n", r);', ["2 10", "5 0", "10 15", "3 4", "1 9"], [("int", "x y")])
cq("c-factors-of-number", "Factors of a Number", "EASY", T, "Print all factors of `n` in increasing order on one line, separated by spaces.", "One positive integer.", "The factors.", "1 <= n <= 100000",
   '    int first = 1;\n    for (int i = 1; i <= n; i++) {\n        if (n % i == 0) {\n            printf("%s%d", first ? "" : " ", i);\n            first = 0;\n        }\n    }\n    printf("\\n");', ["12", "1", "17", "36", "100"], I1)
cq("c-sum-of-factors", "Sum of Factors", "EASY", T, "Print the sum of all factors of `n` (including 1 and `n`).", "One positive integer.", "The sum.", "1 <= n <= 100000",
   '    long long sum = 0;\n    for (int i = 1; i <= n; i++) if (n % i == 0) sum += i;\n    printf("%lld\\n", sum);', ["12", "1", "17", "28", "100"], I1)
cq("c-perfect-number", "Perfect Number", "EASY", T, "A perfect number equals the sum of its proper divisors (all factors except itself), like 6 = 1 + 2 + 3. Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 100000",
   '    int sum = 0;\n    for (int i = 1; i < n; i++) if (n % i == 0) sum += i;\n    printf("%s\\n", sum == n ? "Yes" : "No");', ["6", "28", "12", "1", "496"], I1)
cq("c-square-series", "Series of Squares", "EASY", T, "Print the first `n` squares `1 4 9 16 ...` on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 1000",
   '    for (int i = 1; i <= n; i++) printf("%d%c", i * i, i == n ? \'\\n\' : \' \');', ["5", "1", "10", "20", "3"], I1)
cq("c-powers-of-two", "Powers of Two", "EASY", T, "Print the first `n` powers of two `2 4 8 16 ...` on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 30",
   '    long long p = 1;\n    for (int i = 1; i <= n; i++) {\n        p *= 2;\n        printf("%lld%c", p, i == n ? \'\\n\' : \' \');\n    }', ["5", "1", "10", "30", "3"], I1)
cq("c-arithmetic-progression", "Arithmetic Progression", "EASY", T, "Print the first `n` terms of `3 7 11 15 ...` (start 3, step 4) on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 1000",
   '    for (int i = 0; i < n; i++) printf("%d%c", 3 + 4 * i, i == n - 1 ? \'\\n\' : \' \');', ["5", "1", "10", "50", "3"], I1)
cq("c-geometric-progression", "Geometric Progression", "EASY", T, "Print the first `n` terms of `3 6 12 24 ...` (start 3, ratio 2) on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 30",
   '    long long t = 3;\n    for (int i = 0; i < n; i++) {\n        printf("%lld%c", t, i == n - 1 ? \'\\n\' : \' \');\n        t *= 2;\n    }', ["5", "1", "10", "30", "3"], I1)
cq("c-harmonic-series", "Harmonic Series", "EASY", T, "Print `1 + 1/2 + 1/3 + ... + 1/n` with four decimals.", "One integer `n`.", "The sum.", "1 <= n <= 100000",
   '    double sum = 0;\n    for (int i = 1; i <= n; i++) sum += 1.0 / i;\n    printf("%.4f\\n", sum);', ["1", "2", "10", "100", "5"], I1)
cq("c-alternating-sum", "Alternating Sum", "EASY", T, "Print `1 - 2 + 3 - 4 + ...` up to `n` terms.", "One integer `n`.", "The sum.", "1 <= n <= 100000",
   '    long long sum = 0;\n    for (int i = 1; i <= n; i++) sum += i % 2 ? i : -i;\n    printf("%lld\\n", sum);', ["5", "1", "10", "100000", "7"], I1)
cq("c-power-series-sum", "Sum of x^k / k", "MEDIUM", T, "Read `x` and `n`. Print `x + x^2/2 + x^3/3 + ...` for `n` terms, with four decimals.", "One line: `x n` (x is a decimal).", "The sum.", "|x| <= 2, 1 <= n <= 50",
   '    double sum = 0, term = 1;\n    for (int k = 1; k <= n; k++) {\n        term *= x;\n        sum += term / k;\n    }\n    printf("%.4f\\n", sum);', ["0.5 5", "1 10", "2 3", "0.1 20", "-1 6"], [("double", "x"), ("int", "n")])
cq("c-divisible-by-3-and-5", "Divisible by 3 and 5", "EASY", T, "Print every number from 1 to 100 that is divisible by both 3 and 5, on one line.", "There is no input.", "`15 30 ... 90`.",
   '    int first = 1;\n    for (int i = 1; i <= 100; i++) {\n        if (i % 3 == 0 && i % 5 == 0) {\n            printf("%s%d", first ? "" : " ", i);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)
cq("c-count-multiples-of-7", "Count Multiples of 7", "EASY", T, "Count how many numbers from 1 to 500 are divisible by 7.", "There is no input.", "The count.",
   '    int count = 0;\n    for (int i = 1; i <= 500; i++) if (i % 7 == 0) count++;\n    printf("%d\\n", count);', [""], (), samples=1)
cq("c-product-of-odds", "Product of Odd Numbers", "EASY", T, "Print the product of all odd numbers from 1 to 15.", "There is no input.", "The product.",
   '    long long p = 1;\n    for (int i = 1; i <= 15; i += 2) p *= i;\n    printf("%lld\\n", p);', [""], (), samples=1)

# ======================= loops: digits =======================
T = "Loops: digits"
cq("c-count-digits", "Count the Digits", "EASY", T, "Print how many digits a non-negative integer has (`0` has one).", "One integer.", "The count.", "0 <= n <= 10^9",
   '    int count = 0;\n    do {\n        count++;\n        n /= 10;\n    } while (n > 0);\n    printf("%d\\n", count);', ["12345", "0", "7", "1000000000", "90"], I1)
cq("c-sum-of-digits", "Sum of Digits", "EASY", T, "Print the sum of the digits of `n`.", "One integer.", "The sum.", "0 <= n <= 10^9",
   '    int sum = 0;\n    while (n > 0) {\n        sum += n % 10;\n        n /= 10;\n    }\n    printf("%d\\n", sum);', ["1234", "0", "9", "999999999", "1001"], I1)
cq("c-product-of-digits", "Product of Digits", "EASY", T, "Print the product of the digits of `n` (a single digit is its own product).", "One integer.", "The product.", "1 <= n <= 10^9",
   '    long long p = 1;\n    while (n > 0) {\n        p *= n % 10;\n        n /= 10;\n    }\n    printf("%lld\\n", p);', ["1234", "7", "105", "999999999", "22"], I1)
cq("c-reverse-number", "Reverse a Number", "EASY", T, "Print the digits of `n` reversed as a number (`1200` becomes `21`).", "One integer.", "The reversed number.", "0 <= n <= 10^9",
   '    long long rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    printf("%lld\\n", rev);', ["1234", "1200", "0", "7", "987654321"], I1)
cq("c-palindrome-number", "Palindrome Number", "EASY", T, "A palindrome reads the same backwards. Print `Yes` or `No`.", "One integer.", YN, "0 <= n <= 10^9",
   '    int original = n;\n    long long rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    printf("%s\\n", rev == original ? "Yes" : "No");', ["121", "123", "7", "1221", "10"], I1)
cq("c-armstrong-3-digit", "Armstrong Number (3 digits)", "EASY", T, "A 3-digit number is an Armstrong number when the cubes of its digits add up to the number (153 = 1 + 125 + 27). Print `Yes` or `No`.", "One 3-digit integer.", YN, "100 <= n <= 999",
   '    int original = n, sum = 0;\n    while (n > 0) {\n        int d = n % 10;\n        sum += d * d * d;\n        n /= 10;\n    }\n    printf("%s\\n", sum == original ? "Yes" : "No");', ["153", "370", "123", "407", "999"], I1)
cq("c-armstrong-any", "Armstrong Number (any length)", "MEDIUM", T, "A number is an Armstrong number when each digit raised to the number of digits adds up to the number (1634 = 1 + 1296 + 81 + 256). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^7",
   '    int original = n, digits = 0, copy = n;\n    while (copy > 0) {\n        digits++;\n        copy /= 10;\n    }\n    long long sum = 0;\n    while (n > 0) {\n        long long p = 1;\n        for (int i = 0; i < digits; i++) p *= n % 10;\n        sum += p;\n        n /= 10;\n    }\n    printf("%s\\n", sum == original ? "Yes" : "No");', ["153", "1634", "9474", "123", "8208", "9"], I1)
cq("c-digit-frequency", "Frequency of Each Digit", "MEDIUM", T, "For each digit that appears in `n`, print `<digit>: <count>`, in increasing order of the digit.", "One integer.", "One line per digit that appears.", "0 <= n <= 10^9",
   '    int freq[10] = {0};\n    do {\n        freq[n % 10]++;\n        n /= 10;\n    } while (n > 0);\n    for (int d = 0; d < 10; d++) if (freq[d]) printf("%d: %d\\n", d, freq[d]);', ["112233", "0", "9876543210", "1000", "55555"], I1)
cq("c-largest-digit", "Largest Digit", "EASY", T, "Print the largest digit of `n`.", "One integer.", "The digit.", "0 <= n <= 10^9",
   '    int best = 0;\n    while (n > 0) {\n        if (n % 10 > best) best = n % 10;\n        n /= 10;\n    }\n    printf("%d\\n", best);', ["1234", "0", "9", "1111", "50472"], I1)
cq("c-smallest-digit", "Smallest Digit", "EASY", T, "Print the smallest digit of `n`.", "One integer.", "The digit.", "0 <= n <= 10^9",
   '    int best = 9;\n    do {\n        if (n % 10 < best) best = n % 10;\n        n /= 10;\n    } while (n > 0);\n    printf("%d\\n", best);', ["1234", "0", "9", "5555", "50472"], I1)
cq("c-digits-in-words", "Digits in Words", "MEDIUM", T, "Print each digit of `n` as a word, separated by spaces, e.g. `428` gives `Four Two Eight`. Words: Zero One Two Three Four Five Six Seven Eight Nine.", "One non-negative integer.", "The words.", "0 <= n <= 10^9",
   '    const char *w[] = {"Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"};\n    int d[12], count = 0;\n    do {\n        d[count++] = n % 10;\n        n /= 10;\n    } while (n > 0);\n    for (int i = count - 1; i >= 0; i--) printf("%s%c", w[d[i]], i ? \' \' : \'\\n\');', ["428", "0", "90", "1234", "7"], I1)
cq("c-swap-first-last-digit", "Swap First and Last Digit", "MEDIUM", T, "Swap the first and last digits of `n` and print the new number. A single-digit number stays as it is.", "One positive integer.", "The new number.", "1 <= n <= 10^9, the last digit is not 0",
   '    if (n < 10) {\n        printf("%d\\n", n);\n        return 0;\n    }\n    long long p = 1;\n    while (n / p >= 10) p *= 10;\n    long long first = n / p, last = n % 10;\n    printf("%lld\\n", last * p + (n % p) / 10 * 10 + first);', ["1234", "5", "12", "9871", "100005"], I1)
cq("c-strong-number", "Strong Number", "MEDIUM", T, "A strong number equals the sum of the factorials of its digits (145 = 1! + 4! + 5!). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^7",
   '    int fact[10] = {1};\n    for (int i = 1; i < 10; i++) fact[i] = fact[i - 1] * i;\n    int original = n, sum = 0;\n    while (n > 0) {\n        sum += fact[n % 10];\n        n /= 10;\n    }\n    printf("%s\\n", sum == original ? "Yes" : "No");', ["145", "1", "2", "123", "40585"], I1)
cq("c-harshad-number", "Harshad Number", "EASY", T, "A Harshad (Niven) number is divisible by the sum of its digits (18 is: 1 + 8 = 9). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^9",
   '    int original = n, sum = 0;\n    while (n > 0) {\n        sum += n % 10;\n        n /= 10;\n    }\n    printf("%s\\n", original % sum == 0 ? "Yes" : "No");', ["18", "19", "21", "12", "1729"], I1)
cq("c-automorphic-number", "Automorphic Number", "MEDIUM", T, "A number is automorphic when its square ends with the number itself (25 squared is 625). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 100000",
   '    long long sq = (long long)n * n;\n    long long p = 1;\n    for (int t = n; t > 0; t /= 10) p *= 10;\n    printf("%s\\n", sq % p == n ? "Yes" : "No");', ["25", "5", "76", "7", "376"], I1)
cq("c-binary-to-decimal", "Binary to Decimal", "MEDIUM", T, "Read a binary number written with 0s and 1s (up to 18 digits) and print its decimal value, using a loop.", "One binary number.", "The decimal value.", "Only digits 0 and 1",
   '    long long value = 0, power = 1;\n    while (n > 0) {\n        value += (n % 10) * power;\n        power *= 2;\n        n /= 10;\n    }\n    printf("%lld\\n", value);', ["1010", "1", "0", "11111111", "100000"], LN)
cq("c-decimal-to-binary", "Decimal to Binary", "MEDIUM", T, "Print the binary form of `n` (`0` prints `0`), using repeated division by 2.", "One integer.", "The binary digits.", "0 <= n <= 10^9",
   '    char bits[40];\n    int count = 0;\n    do {\n        bits[count++] = \'0\' + n % 2;\n        n /= 2;\n    } while (n > 0);\n    for (int i = count - 1; i >= 0; i--) putchar(bits[i]);\n    putchar(\'\\n\');', ["10", "0", "1", "255", "1000000000"], I1)
cq("c-gcd-loop", "GCD of Two Numbers", "EASY", T, "Print the greatest common divisor (HCF) of two positive integers, using the Euclidean method in a loop.", "One line: `a b`.", "The GCD.", "1 <= a, b <= 10^9",
   '    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    printf("%d\\n", a);', ["12 18", "17 5", "100 75", "1 1", "1000000000 250000000"], [("int", "a b")])
cq("c-lcm-loop", "LCM of Two Numbers", "EASY", T, "Print the least common multiple of two positive integers.", "One line: `a b`.", "The LCM.", "1 <= a, b <= 10^6",
   '    long long x = a, y = b;\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    printf("%lld\\n", (long long)a * b / x);', ["4 6", "7 5", "12 18", "1 1", "1000000 999999"], [("int", "a b")])
cq("c-gcd-three", "GCD of Three Numbers", "EASY", T, "Print the greatest common divisor of three positive integers.", "One line: `a b c`.", "The GCD.", "1 <= values <= 10^9",
   '    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    while (c != 0) {\n        int t = a % c;\n        a = c;\n        c = t;\n    }\n    printf("%d\\n", a);', ["12 18 24", "7 5 3", "100 50 25", "8 8 8", "30 45 60"], [("int", "a b c")])
cq("c-neon-number", "Neon Number", "EASY", T, "A number is neon when the sum of the digits of its square equals the number (9 squared is 81, and 8 + 1 = 9). Print `Yes` or `No`.", "One non-negative integer.", YN, "0 <= n <= 100000",
   '    long long sq = (long long)n * n;\n    int sum = 0;\n    while (sq > 0) {\n        sum += sq % 10;\n        sq /= 10;\n    }\n    printf("%s\\n", sum == n ? "Yes" : "No");', ["9", "0", "1", "10", "45"], I1)
cq("c-spy-number", "Spy Number", "EASY", T, "A spy number has equal sum and product of its digits (1124: sum 8, product 8). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^9",
   '    int sum = 0;\n    long long prod = 1;\n    while (n > 0) {\n        sum += n % 10;\n        prod *= n % 10;\n        n /= 10;\n    }\n    printf("%s\\n", sum == prod ? "Yes" : "No");', ["1124", "123", "22", "7", "1412"], I1)
cq("c-pronic-number", "Pronic Number", "EASY", T, "A pronic number is the product of two consecutive integers (12 = 3 x 4). Print `Yes` or `No`.", "One non-negative integer.", YN, "0 <= n <= 10^9",
   '    int found = 0;\n    for (long long i = 0; i * (i + 1) <= n; i++) if (i * (i + 1) == n) found = 1;\n    printf("%s\\n", found ? "Yes" : "No");', ["12", "0", "2", "10", "56", "99999"], I1)
cq("c-armstrong-up-to-1000", "Armstrong Numbers to 1000", "MEDIUM", T, "Print all Armstrong numbers from 1 to 1000 on one line (a number whose digits, each raised to the number of digits, sum to itself).", "There is no input.", "The numbers separated by spaces.",
   '    int first = 1;\n    for (int n = 1; n <= 1000; n++) {\n        int digits = 0;\n        for (int t = n; t > 0; t /= 10) digits++;\n        long long sum = 0;\n        for (int t = n; t > 0; t /= 10) {\n            long long p = 1;\n            for (int i = 0; i < digits; i++) p *= t % 10;\n            sum += p;\n        }\n        if (sum == n) {\n            printf("%s%d", first ? "" : " ", n);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)
cq("c-strong-up-to-500", "Strong Numbers to 500", "MEDIUM", T, "Print all strong numbers from 1 to 500 on one line (a number equal to the sum of the factorials of its digits).", "There is no input.", "The numbers separated by spaces.",
   '    int fact[10] = {1};\n    for (int i = 1; i < 10; i++) fact[i] = fact[i - 1] * i;\n    int first = 1;\n    for (int n = 1; n <= 500; n++) {\n        int sum = 0;\n        for (int t = n; t > 0; t /= 10) sum += fact[t % 10];\n        if (sum == n) {\n            printf("%s%d", first ? "" : " ", n);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)

# ======================= loops: primes and sequences =======================
T = "Loops: primes and sequences"
cq("c-is-prime", "Is It Prime?", "EASY", T, "Print `Prime` or `Not prime`. A prime has exactly two factors; 1 is not prime.", "One positive integer.", "`Prime` or `Not prime`.", "1 <= n <= 10^9",
   '    int prime = n >= 2;\n    for (long long i = 2; i * i <= n; i++) if (n % i == 0) { prime = 0; break; }\n    printf("%s\\n", prime ? "Prime" : "Not prime");', ["2", "1", "17", "100", "999999937"], I1)
cq("c-primes-to-100", "Primes up to 100", "EASY", T, "Print all prime numbers from 1 to 100 on one line.", "There is no input.", "The primes separated by spaces.",
   '    int first = 1;\n    for (int n = 2; n <= 100; n++) {\n        int prime = 1;\n        for (int i = 2; i * i <= n; i++) if (n % i == 0) { prime = 0; break; }\n        if (prime) {\n            printf("%s%d", first ? "" : " ", n);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)
cq("c-first-n-primes", "First N Primes", "EASY", T, "Print the first `n` prime numbers on one line.", "One integer `n`.", "`n` primes.", "1 <= n <= 500",
   '    int found = 0;\n    for (int x = 2; found < n; x++) {\n        int prime = 1;\n        for (int i = 2; i * i <= x; i++) if (x % i == 0) { prime = 0; break; }\n        if (prime) printf("%d%c", x, ++found == n ? \'\\n\' : \' \');\n    }', ["5", "1", "10", "25", "100"], I1)
cq("c-sum-primes-to-50", "Sum of Primes up to 50", "EASY", T, "Print the sum of all prime numbers from 1 to 50.", "There is no input.", "The sum.",
   '    int sum = 0;\n    for (int n = 2; n <= 50; n++) {\n        int prime = 1;\n        for (int i = 2; i * i <= n; i++) if (n % i == 0) { prime = 0; break; }\n        if (prime) sum += n;\n    }\n    printf("%d\\n", sum);', [""], (), samples=1)
cq("c-fibonacci-series", "Fibonacci Series", "EASY", T, "Print the first `n` Fibonacci numbers `0 1 1 2 3 5 ...` on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 60",
   '    long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) {\n        printf("%lld%c", a, i == n - 1 ? \'\\n\' : \' \');\n        long long t = a + b;\n        a = b;\n        b = t;\n    }', ["10", "1", "2", "20", "60"], I1)
cq("c-is-fibonacci", "Is It a Fibonacci Number?", "EASY", T, "Print `Yes` if `n` appears in the Fibonacci sequence `0 1 1 2 3 5 8 ...`, else `No`.", "One non-negative integer.", YN, "0 <= n <= 10^12",
   '    long long a = 0, b = 1;\n    while (a < n) {\n        long long t = a + b;\n        a = b;\n        b = t;\n    }\n    printf("%s\\n", a == n ? "Yes" : "No");', ["8", "0", "4", "13", "1000000000000"], LN)
cq("c-sum-fibonacci", "Sum of Fibonacci Terms", "EASY", T, "Print the sum of the first `n` Fibonacci numbers (`0 1 1 2 ...`).", "One integer `n`.", "The sum.", "1 <= n <= 60",
   '    long long a = 0, b = 1, sum = 0;\n    for (int i = 0; i < n; i++) {\n        sum += a;\n        long long t = a + b;\n        a = b;\n        b = t;\n    }\n    printf("%lld\\n", sum);', ["10", "1", "2", "5", "60"], I1)
cq("c-twin-primes", "Twin Primes up to 100", "MEDIUM", T, "Twin primes are primes that differ by 2. Print every pair up to 100, one per line, like `(3, 5)`.", "There is no input.", "One pair per line.",
   '    int prime[102] = {0};\n    for (int n = 2; n <= 101; n++) {\n        prime[n] = 1;\n        for (int i = 2; i * i <= n; i++) if (n % i == 0) { prime[n] = 0; break; }\n    }\n    for (int n = 2; n + 2 <= 100; n++) if (prime[n] && prime[n + 2]) printf("(%d, %d)\\n", n, n + 2);', [""], (), samples=1)
cq("c-goldbach", "Goldbach's Conjecture", "MEDIUM", T, "Write an even number `n` (4 or more) as the sum of two primes. Print the pair with the smallest first prime as `n = p + q`.", "One even integer.", "`n = p + q`.", "4 <= n <= 10000, n is even",
   '    for (int p = 2; p <= n / 2; p++) {\n        int pp = 1, qq = 1, q = n - p;\n        for (int i = 2; i * i <= p; i++) if (p % i == 0) { pp = 0; break; }\n        for (int i = 2; i * i <= q; i++) if (q % i == 0) { qq = 0; break; }\n        if (pp && qq) {\n            printf("%d = %d + %d\\n", n, p, q);\n            break;\n        }\n    }', ["4", "28", "100", "10", "9998"], I1)
cq("c-prime-palindrome", "Prime Palindrome", "MEDIUM", T, "Print `Yes` if the number is both prime and a palindrome, else `No`.", "One positive integer.", YN, "1 <= n <= 10^8",
   '    int prime = n >= 2;\n    for (long long i = 2; i * i <= n; i++) if (n % i == 0) { prime = 0; break; }\n    long long rev = 0, t = n;\n    while (t > 0) {\n        rev = rev * 10 + t % 10;\n        t /= 10;\n    }\n    printf("%s\\n", prime && rev == n ? "Yes" : "No");', ["131", "13", "121", "2", "10301"], I1)
cq("c-prime-factors", "Prime Factors", "MEDIUM", T, "Print the prime factors of `n` in increasing order on one line, repeating a factor as often as it divides (`12` gives `2 2 3`).", "One integer.", "The prime factors.", "2 <= n <= 10^9",
   '    int first = 1;\n    for (long long p = 2; p * p <= n; p++) {\n        while (n % p == 0) {\n            printf("%s%lld", first ? "" : " ", p);\n            first = 0;\n            n /= p;\n        }\n    }\n    if (n > 1) printf("%s%lld", first ? "" : " ", n);\n    printf("\\n");', ["12", "2", "97", "360", "999999937"], LN)
cq("c-factorial-prime-factors", "Prime Factors of a Factorial", "HARD", T, "Write `n!` as a product of primes. For each prime `p` up to `n` print `p^e` on one line, separated by spaces, where `e` is how many times `p` divides `n!` (`5!` gives `2^3 3^1 5^1`).", "One integer.", "`p^e` terms.", "2 <= n <= 20",
   '    int first = 1;\n    for (int p = 2; p <= n; p++) {\n        int prime = 1;\n        for (int i = 2; i * i <= p; i++) if (p % i == 0) { prime = 0; break; }\n        if (!prime) continue;\n        int e = 0;\n        for (int m = n; m > 0; m /= p) e += m / p;\n        printf("%s%d^%d", first ? "" : " ", p, e);\n        first = 0;\n    }\n    printf("\\n");', ["5", "2", "10", "20", "7"], I1)
cq("c-emirp-number", "Emirp Number", "MEDIUM", T, "An emirp is a prime whose reversal is a different prime (13 and 31). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^6",
   '    long long rev = 0, t = n;\n    while (t > 0) {\n        rev = rev * 10 + t % 10;\n        t /= 10;\n    }\n    int a = n >= 2, b = rev >= 2;\n    for (long long i = 2; i * i <= n; i++) if (n % i == 0) { a = 0; break; }\n    for (long long i = 2; i * i <= rev; i++) if (rev % i == 0) { b = 0; break; }\n    printf("%s\\n", a && b && rev != n ? "Yes" : "No");', ["13", "11", "37", "23", "17"], I1)
cq("c-happy-number", "Happy Number", "MEDIUM", T, "Replace the number by the sum of the squares of its digits again and again. If it reaches 1 it is happy (19 is: 82, 68, 100, 1). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^6",
   '    int steps = 0;\n    while (n != 1 && steps < 1000) {\n        int sum = 0;\n        while (n > 0) {\n            sum += (n % 10) * (n % 10);\n            n /= 10;\n        }\n        n = sum;\n        steps++;\n    }\n    printf("%s\\n", n == 1 ? "Yes" : "No");', ["19", "4", "1", "7", "20"], I1)
cq("c-happy-numbers-to-100", "Happy Numbers up to 100", "MEDIUM", T, "Print all happy numbers from 1 to 100 on one line.", "There is no input.", "The numbers separated by spaces.",
   '    int first = 1;\n    for (int x = 1; x <= 100; x++) {\n        int n = x, steps = 0;\n        while (n != 1 && steps < 1000) {\n            int sum = 0;\n            while (n > 0) {\n                sum += (n % 10) * (n % 10);\n                n /= 10;\n            }\n            n = sum;\n            steps++;\n        }\n        if (n == 1) {\n            printf("%s%d", first ? "" : " ", x);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)
cq("c-disarium-number", "Disarium Number", "MEDIUM", T, "A number is disarium when its digits raised to their positions add up to it (89 = 8^1 + 9^2). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^7",
   '    int original = n, digits = 0;\n    for (int t = n; t > 0; t /= 10) digits++;\n    long long sum = 0;\n    for (int t = n, pos = digits; t > 0; t /= 10, pos--) {\n        long long p = 1;\n        for (int i = 0; i < pos; i++) p *= t % 10;\n        sum += p;\n    }\n    printf("%s\\n", sum == original ? "Yes" : "No");', ["89", "135", "175", "100", "518"], I1)
cq("c-disarium-to-100", "Disarium Numbers up to 100", "MEDIUM", T, "Print all disarium numbers from 1 to 100 on one line.", "There is no input.", "The numbers separated by spaces.",
   '    int first = 1;\n    for (int n = 1; n <= 100; n++) {\n        int digits = 0;\n        for (int t = n; t > 0; t /= 10) digits++;\n        long long sum = 0;\n        for (int t = n, pos = digits; t > 0; t /= 10, pos--) {\n            long long p = 1;\n            for (int i = 0; i < pos; i++) p *= t % 10;\n            sum += p;\n        }\n        if (sum == n) {\n            printf("%s%d", first ? "" : " ", n);\n            first = 0;\n        }\n    }\n    printf("\\n");', [""], (), samples=1)
cq("c-tribonacci", "Tribonacci Series", "EASY", T, "Each term is the sum of the three before it, starting `0 0 1`. Print the first `n` terms on one line.", "One integer `n`.", "`n` numbers.", "1 <= n <= 60",
   '    long long t[64] = {0, 0, 1};\n    for (int i = 3; i < n; i++) t[i] = t[i - 1] + t[i - 2] + t[i - 3];\n    for (int i = 0; i < n; i++) printf("%lld%c", t[i], i == n - 1 ? \'\\n\' : \' \');', ["10", "1", "3", "4", "50"], I1)
cq("c-smith-number", "Smith Number", "HARD", T, "A Smith number is composite and the sum of its digits equals the sum of the digits of all its prime factors counted with repeats (22 = 2 x 11: 2 + 2 = 2 + 1 + 1). Print `Yes` or `No`.", "One positive integer.", YN, "1 <= n <= 10^6",
   '    int original = n, digitSum = 0, factorSum = 0, count = 0;\n    for (int t = n; t > 0; t /= 10) digitSum += t % 10;\n    for (int p = 2; (long long)p * p <= n; p++) {\n        while (n % p == 0) {\n            for (int t = p; t > 0; t /= 10) factorSum += t % 10;\n            n /= p;\n            count++;\n        }\n    }\n    if (n > 1) {\n        for (int t = n; t > 0; t /= 10) factorSum += t % 10;\n        count++;\n    }\n    printf("%s\\n", count > 1 && digitSum == factorSum ? "Yes" : "No");', ["22", "4", "27", "13", "85", "666"], I1)
cq("c-primes-between", "Primes Between A and B", "EASY", T, "Print all primes from `A` to `B` (both included) on one line, or `None` when there is no prime.", "One line: `A B`.", "The primes, or `None`.", "1 <= A <= B <= 10000",
   '    int first = 1;\n    for (int n = a < 2 ? 2 : a; n <= b; n++) {\n        int prime = 1;\n        for (int i = 2; i * i <= n; i++) if (n % i == 0) { prime = 0; break; }\n        if (prime) {\n            printf("%s%d", first ? "" : " ", n);\n            first = 0;\n        }\n    }\n    printf(first ? "None\\n" : "\\n");', ["10 30", "1 10", "24 28", "100 120", "2 2"], [("int", "a b")])
