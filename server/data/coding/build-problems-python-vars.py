# PY-001..PY-050: Variables & Data Types (unit conversions, bills, type casting, dynamic typing, integer arithmetic).
V = "Variables & Data Types"

# ---- 10 unit conversions: one number in, one number out ----
CONV = [
    ("Fuel Tank in Gallons", "A car-rental app stores fuel in litres but a US customer wants gallons. Convert the litres to US gallons (1 L = 0.264172 gal).", "litres", "x * 0.264172", 1, 200),
    ("Luggage Weight in Pounds", "An airline counter weighs bags in kilograms but the partner airline prints pounds. Convert kg to pounds (1 kg = 2.20462 lb).", "kg", "x * 2.20462", 1, 60),
    ("Trail Distance in Miles", "A hiking app records trails in kilometres. Show the distance in miles (1 km = 0.621371 mi).", "km", "x * 0.621371", 1, 120),
    ("Room Temperature in Kelvin", "A lab logger needs Celsius readings in Kelvin (K = C + 273.15).", "celsius", "x + 273.15", -50, 150),
    ("Screen Size in Centimetres", "A shop lists TVs in inches. Print the diagonal in centimetres (1 inch = 2.54 cm).", "inches", "x * 2.54", 10, 100),
    ("Marathon Pace in Minutes", "A runner covers a distance in kilometres at 5.5 minutes per km. Print the total minutes.", "km", "x * 5.5", 1, 45),
    ("Rainfall in Inches", "A weather station records rainfall in millimetres. Print it in inches (1 inch = 25.4 mm).", "mm", "x / 25.4", 1, 400),
    ("Data Download in Megabytes", "A download tracker counts gigabytes. Print the size in megabytes (1 GB = 1024 MB).", "gb", "x * 1024", 1, 100),
    ("Speed in Metres per Second", "A cricket speed gun shows km/h. Print the speed in m/s (divide by 3.6).", "kmh", "x / 3.6", 20, 160),
    ("Fahrenheit Oven Setting", "A recipe gives oven temperature in Celsius. Print it in Fahrenheit (F = C * 9 / 5 + 32).", "celsius", "x * 9 / 5 + 32", 50, 300),
]
for title, scene, name, expr, lo, hi in CONV:
    py(V, title, scene + f" Read `{name}` and print the result with two decimal places.", f"One number `{name}`.", "The converted value with two decimal places.",
       f"{lo} <= {name} <= {hi}", f'x = float(input())\nprint(f"{{{expr}:.2f}}")',
       lambda r, lo=lo, hi=hi: f"{r.randint(lo * 10, hi * 10) / 10}\n", edges=[f"{lo}\n", f"{hi}\n"])

# ---- 10 bills and formulas: several numbers on one line ----
BILLS = [
    ("GST Shopping Bill", "A shop adds GST to every bill. Given the unit price, the quantity and the GST percent, print the final amount.", "price qty gst", "price * qty * (1 + gst / 100)", [(10, 2000), (1, 20), (5, 28)]),
    ("Festival Sale Price", "A store runs a festival sale. Given the marked price and the discount percent, print the price after the discount.", "price discount", "price * (1 - discount / 100)", [(100, 50000), (5, 70)]),
    ("Restaurant Tip Split", "Friends split a restaurant bill including a tip. Given the bill, the tip percent and the number of people, print what each person pays.", "bill tip people", "bill * (1 + tip / 100) / people", [(200, 9000), (0, 25), (1, 12)]),
    ("In-Hand Salary", "A company deducts a provident fund percent from the basic salary. Given both, print the in-hand salary.", "basic pf", "basic - basic * pf / 100", [(10000, 200000), (1, 15)]),
    ("Body Mass Index", "A gym app computes BMI = weight / height^2. Given the weight in kg and the height in metres, print the BMI.", "weight height", "weight / (height * height)", [(35, 140), (1.2, 2.2)]),
    ("Wall Painting Cost", "A painter charges per square foot. Given the wall length, the wall height and the rate per square foot, print the cost.", "length height rate", "length * height * rate", [(5, 60), (5, 20), (8, 40)]),
    ("Road Trip Fuel Cost", "A family plans a road trip. Given the distance in km, the car mileage in km per litre and the fuel price per litre, print the fuel cost.", "distance mileage price", "distance / mileage * price", [(20, 1500), (8, 25), (80, 120)]),
    ("Savings After One Year", "A bank adds yearly interest to a deposit. Given the principal and the rate percent, print the balance after one year.", "principal rate", "principal * (1 + rate / 100)", [(1000, 500000), (2, 12)]),
    ("Average of Three Marks", "A teacher averages a student's three test marks. Print the average of the three marks.", "m1 m2 m3", "(m1 + m2 + m3) / 3", [(0, 100), (0, 100), (0, 100)]),
    ("Monthly Electricity Bill", "An electricity board charges per unit plus a fixed fee. Given the units used, the rate per unit and the fixed fee, print the bill.", "units rate fixed", "units * rate + fixed", [(20, 900), (3, 12), (50, 300)]),
]
for title, scene, names, expr, ranges in BILLS:
    parts = names.split()
    py(V, title, scene, f"One line with `{names}`.", "The result with two decimal places.", "All values are non-negative.",
       f'{", ".join(parts)} = map(float, input().split())\nprint(f"{{{expr}:.2f}}")',
       lambda r, ranges=ranges: one_line(*[(r.randint(a, b) if isinstance(a, int) and isinstance(b, int) else round(r.uniform(a, b), 2)) for a, b in ranges]))

# ---- 10 type casting problems ----
py(V, "Price Tag with Symbol", "A scraper reads prices like `Rs.1,299.50`. Remove `Rs.` and the commas, convert to a number and print the price with 18% GST added, with two decimals.",
   "One price string such as `Rs.1,299.50`.", "The price with GST, two decimals.", "The amount is below 10 million.",
   's = input().strip()\namount = float(s.replace("Rs.", "").replace(",", ""))\nprint(f"{amount * 1.18:.2f}")',
   lambda r: f"Rs.{r.randint(1, 99999):,}.{r.randint(0, 99):02d}\n", edges=["Rs.5.00\n", "Rs.1,234,567.89\n"])
py(V, "Video Length Clock", "A video player gets the length in seconds and shows it as `H:MM:SS` with minutes and seconds padded to two digits.",
   "One integer `seconds`.", "The time as `H:MM:SS`.", "0 <= seconds <= 10^6",
   "n = int(input())\nh, rem = divmod(n, 3600)\nm, s = divmod(rem, 60)\nprint(f\"{h}:{m:02d}:{s:02d}\")",
   lambda r: f"{r.randint(0, 200000)}\n", edges=["0\n", "3599\n", "3600\n"])
py(V, "Lucky Digit Sum", "A ticket number is read as text. Cast each digit character to an integer and print the sum of the digits.",
   "One string of digits.", "The sum of the digits.", "1 to 18 digits.",
   "s = input().strip()\nprint(sum(int(ch) for ch in s))",
   lambda r: "".join(str(r.randint(0, 9)) for _ in range(r.randint(3, 16))) + "\n", edges=["0\n", "999999999999999999\n"])
py(V, "Mixed Receipt Total", "A receipt lists amounts as text, some whole numbers and some with decimals, separated by spaces. Convert them and print the total with two decimals.",
   "One line of amounts separated by spaces.", "The total, two decimals.", "1 to 20 amounts.",
   'print(f"{sum(float(t) for t in input().split()):.2f}")',
   lambda r: " ".join(str(r.randint(1, 500)) if r.random() < .5 else f"{r.uniform(1, 500):.2f}" for _ in range(r.randint(2, 8))) + "\n", edges=["5\n"])
py(V, "Division Types Lab", "A student compares division operators. For two integers `a` and `b` print `a // b`, `a % b` and `a / b` (two decimals) on one line.",
   "Two integers `a b` with `b` not zero.", "Three values separated by spaces.", "-10^6 <= a, b <= 10^6, b != 0",
   'a, b = map(int, input().split())\nprint(a // b, a % b, f"{a / b:.2f}")',
   lambda r: one_line(r.randint(-500, 500), r.choice([x for x in range(-20, 21) if x])), edges=["7 2\n", "-7 2\n", "7 -2\n"])
py(V, "Rounding Rules Demo", "A cashier compares ways to turn a decimal into a whole number. For a decimal `x` print `int(x)`, `round(x)`, floor and ceil on one line, separated by spaces.",
   "One decimal number `x`.", "Four integers separated by spaces.", "-1000 <= x <= 1000",
   "import math\nx = float(input())\nprint(int(x), round(x), math.floor(x), math.ceil(x))",
   lambda r: f"{r.randint(-9000, 9000) / 10}\n", edges=["2.5\n", "3.5\n", "-2.5\n", "7.0\n"])
py(V, "Printer Binary Code", "A printer shows a job number in binary and hexadecimal. Print the binary form (no `0b`) and the hexadecimal form in lower case (no `0x`), separated by a space.",
   "One integer `n`.", "Binary and hexadecimal.", "0 <= n <= 10^9",
   'n = int(input())\nprint(bin(n)[2:], hex(n)[2:])',
   lambda r: f"{r.randint(0, 100000)}\n", edges=["0\n", "255\n", "1000000000\n"])
py(V, "Secret Letter Shift", "A kids' game replaces a letter by the next letter of the alphabet. Print the ASCII code of the letter and then the next character, separated by a space (`z` becomes `{`).",
   "One character.", "The code and the next character.", "A single ASCII letter.",
   "c = input().strip()\nprint(ord(c), chr(ord(c) + 1))",
   lambda r: r.choice("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") + "\n")
py(V, "Stock Flag Check", "A warehouse scanner sends the stock count as text. Convert it to an integer and print `In stock` if the number is not zero, otherwise `Out of stock`.",
   "One integer written as text.", "`In stock` or `Out of stock`.", "-1000 <= count <= 1000",
   's = input().strip()\nprint("In stock" if bool(int(s)) else "Out of stock")',
   lambda r: f"{r.choice([0, 0, r.randint(1, 500), r.randint(-9, -1)])}\n", edges=["0\n", "-3\n"])
py(V, "Roll Number and Year", "A form has a roll number and a joining year, both read as text. Print them joined as text, then their numeric sum, on one line.",
   "One line `roll year` of digits.", "The joined text and the sum.", "Both are positive integers below 10^6.",
   "a, b = input().split()\nprint(a + b, int(a) + int(b))",
   lambda r: one_line(r.randint(1, 9999), r.randint(2015, 2030)))

# ---- 10 dynamic typing / type checking ----
def _tok(r):
    return r.choice([str(r.randint(-99, 99)), f"{r.uniform(-50, 50):.2f}", r.choice(["apple", "True", "42abc", "N/A", "kiwi"])])


py(V, "Form Field Type Detector", "A web form receives one value as text. Print `int` if it is a whole number, `float` if it is a decimal number, otherwise `str`.",
   "One token.", "`int`, `float` or `str`.", "The token has no spaces.",
   'v = input().strip()\ntry:\n    int(v)\n    print("int")\nexcept ValueError:\n    try:\n        float(v)\n        print("float")\n    except ValueError:\n        print("str")',
   _tok, edges=["-7\n", "3.14\n", "hello\n", "10.0\n"])
py(V, "Count Numeric Entries", "A survey sheet has `n` entries; some are numbers (whole or decimal) and some are text. Print how many entries are numeric.",
   "First line `n`, then one line with `n` space-separated entries.", "The count of numeric entries.", "1 <= n <= 50",
   "n = int(input())\ncount = 0\nfor t in input().split():\n    try:\n        float(t)\n        count += 1\n    except ValueError:\n        pass\nprint(count)",
   lambda r: (lambda k: rows(k, " ".join(_tok(r) for _ in range(k))))(r.randint(3, 10)), edges=["1\nabc\n"])
py(V, "Sensor Readings Total", "A sensor log mixes readings with error words such as `ERR`. Add up only the numeric readings and print the sum with two decimals.",
   "One line of tokens.", "The sum of the numeric tokens, two decimals.", "At least one numeric token.",
   'total = 0.0\nfor t in input().split():\n    try:\n        total += float(t)\n    except ValueError:\n        pass\nprint(f"{total:.2f}")',
   lambda r: " ".join(r.choice([str(r.randint(1, 90)), f"{r.uniform(1, 90):.1f}", "ERR"]) for _ in range(r.randint(3, 9))) + " 5\n")
py(V, "Whole Numbers Only Average", "A class list holds marks as whole numbers and the word `absent`. Average only the whole numbers and print it with two decimals.",
   "One line of tokens.", "The average of the whole numbers, two decimals.", "At least one whole number.",
   'vals = [int(t) for t in input().split() if t.lstrip("-").isdigit()]\nprint(f"{sum(vals) / len(vals):.2f}")',
   lambda r: " ".join(r.choice([str(r.randint(30, 100)), "absent"]) for _ in range(r.randint(3, 9))) + " 77\n")
py(V, "Product Result Type", "Two numbers are multiplied in a calculator. Each is a whole number or a decimal. Print the product, then the word `int` if both were whole numbers, otherwise `float`.",
   "One line `a b`.", "The product and its type.", "|a|, |b| <= 1000",
   'def parse(t):\n    try:\n        return int(t)\n    except ValueError:\n        return float(t)\n\n\na, b = map(parse, input().split())\nprint(a * b, type(a * b).__name__)',
   lambda r: one_line(*[r.choice([str(r.randint(-20, 20)), f"{r.randint(-200, 200) / 10}"]) for _ in range(2)]), edges=["3 4\n", "2 0.5\n"])
py(V, "Missing Reading Marker", "A thermometer sends a reading or `N/A` when it is offline. Print `Missing` for `N/A`, otherwise print the reading doubled.",
   "One token.", "`Missing` or the doubled reading.", "The token is `N/A` or an integer.",
   'v = input().strip()\nprint("Missing" if v == "N/A" else int(v) * 2)',
   lambda r: r.choice(["N/A", str(r.randint(-40, 60))]) + "\n", edges=["N/A\n", "0\n"])
py(V, "Valid Age Field", "A signup form accepts an age if it is a whole number from 0 to 120. Print `Valid` or `Invalid` for the entry.",
   "One token.", "`Valid` or `Invalid`.", "The token has no spaces.",
   'v = input().strip()\nok = v.isdigit() and 0 <= int(v) <= 120\nprint("Valid" if ok else "Invalid")',
   lambda r: r.choice([str(r.randint(0, 150)), "abc", "-5", "12.5", str(r.randint(18, 90))]) + "\n", edges=["120\n", "121\n", "0\n"])
py(V, "Banner Maker", "A shop prints a banner by repeating a word. Given a word and a count, print the word repeated that many times in a row with no spaces.",
   "One line `word count`.", "The repeated word.", "1 <= count <= 20",
   "w, c = input().split()\nprint(w * int(c))",
   lambda r: one_line(r.choice(["go", "ab", "hi", "ok", "x", "wow"]), r.randint(1, 12)))
py(V, "Swap Seat Numbers", "Two passengers swap seats. Given two seat tokens (letters or numbers) print them in swapped order, separated by a space.",
   "One line `a b`.", "`b a`.", "Tokens have no spaces.",
   "a, b = input().split()\na, b = b, a\nprint(a, b)",
   lambda r: one_line(*[r.choice([str(r.randint(1, 60)), r.choice("ABCDEF") + str(r.randint(1, 30))]) for _ in range(2)]))
py(V, "Quantity Total as Text", "A form field `qty` is read as text. Print `qty` doubled as text (for example `ab` becomes `abab`) and then, if it is all digits, the value doubled as a number, otherwise `n/a`.",
   "One token.", "Two values separated by a space.", "The token has no spaces.",
   's = input().strip()\nprint(s * 2, int(s) * 2 if s.isdigit() else "n/a")',
   lambda r: r.choice([str(r.randint(1, 99)), "abc", "x7", str(r.randint(100, 900))]) + "\n", edges=["5\n", "pen\n"])

# ---- 10 integer arithmetic problems ----
py(V, "Cash Notes Counter", "An ATM pays an amount with notes of 100, 50, 20, 10, 5 and 1, always using the biggest notes first. Print how many notes of each kind are used, in that order, separated by spaces.",
   "One integer `amount`.", "Six counts separated by spaces.", "0 <= amount <= 10^6",
   "amount = int(input())\nout = []\nfor note in (100, 50, 20, 10, 5, 1):\n    out.append(amount // note)\n    amount %= note\nprint(*out)",
   lambda r: f"{r.randint(0, 99999)}\n", edges=["0\n", "99\n", "1000\n"])
py(V, "Trip Duration Breakdown", "A travel app shows a trip length given in minutes as days, hours and minutes. Print the three numbers separated by spaces.",
   "One integer `minutes`.", "`days hours minutes`.", "0 <= minutes <= 10^7",
   "m = int(input())\nd, m = divmod(m, 1440)\nh, m = divmod(m, 60)\nprint(d, h, m)",
   lambda r: f"{r.randint(0, 900000)}\n", edges=["0\n", "59\n", "1440\n"])
py(V, "Strip the Last Digit", "A bank masks the final digit of an account number. Print the last digit and then the number without it, separated by a space.",
   "One non-negative integer `n`.", "`last rest`.", "0 <= n <= 10^12",
   "n = int(input())\nprint(n % 10, n // 10)",
   lambda r: f"{r.randint(0, 10**r.randint(1, 12))}\n", edges=["0\n", "7\n"])
py(V, "Mirror a Three-Digit Token", "A raffle token has exactly three digits. Print it reversed as a number, so `120` becomes `21`.",
   "One integer from 100 to 999.", "The reversed number.", "100 <= n <= 999",
   "n = int(input())\nprint((n % 10) * 100 + (n // 10 % 10) * 10 + n // 100)",
   lambda r: f"{r.randint(100, 999)}\n", edges=["100\n", "999\n", "120\n"])
py(V, "Digits in a Power of Two", "A storage planner needs `2^n` bytes. Print how many digits that number has.",
   "One integer `n`.", "The digit count of `2^n`.", "0 <= n <= 5000",
   "n = int(input())\nprint(len(str(2 ** n)))",
   lambda r: f"{r.randint(0, 5000)}\n", edges=["0\n", "10\n", "5000\n"])
py(V, "Hours on a 12-Hour Clock", "A wall clock shows hours 1 to 12. It now shows hour `h` and `k` hours pass. Print the hour it shows then (use 12, never 0).",
   "One line `h k`.", "The hour from 1 to 12.", "1 <= h <= 12, 0 <= k <= 10^6",
   "h, k = map(int, input().split())\nr = (h + k) % 12\nprint(r if r else 12)",
   lambda r: one_line(r.randint(1, 12), r.randint(0, 500)), edges=["12 0\n", "5 7\n", "11 1\n"])
py(V, "Account Change Splitter", "A ledger divides a change `a` among `b` shares. Print the floor division `a // b` and the value truncated towards zero (`int(a / b)`), separated by a space.",
   "One line `a b` with `b` not zero.", "Two integers.", "-10^6 <= a, b <= 10^6, b != 0",
   "a, b = map(int, input().split())\nprint(a // b, int(a / b))",
   lambda r: one_line(r.randint(-300, 300), r.choice([x for x in range(-15, 16) if x])), edges=["7 2\n", "-7 2\n", "7 -2\n", "-7 -2\n"])
py(V, "Price Change Percent", "A store tracks a product's old and new price. Print the percentage change `(new - old) / old * 100` with two decimals.",
   "One line `old new`.", "The percent change, two decimals.", "1 <= old <= 10^6, 0 <= new <= 10^6",
   'old, new = map(float, input().split())\nprint(f"{(new - old) / old * 100:.2f}")',
   lambda r: one_line(r.randint(10, 5000), r.randint(5, 6000)))
py(V, "File Permission Bits", "A file's permissions are stored as a number 0 to 7: bit 1 is read, bit 2 is write, bit 4 is execute. Print `read write execute` as `Y` or `N` letters separated by spaces.",
   "One integer `p` from 0 to 7.", "Three letters `Y` or `N`.", "0 <= p <= 7",
   'p = int(input())\nprint(*("Y" if p & b else "N" for b in (1, 2, 4)))',
   lambda r: f"{r.randint(0, 7)}\n", edges=["0\n", "7\n", "5\n"])
py(V, "Swap Tens and Ones", "A scoreboard prints a two-digit score reversed by mistake. Given a two-digit number, print it with the tens and ones digits swapped as a number (`50` becomes `5`).",
   "One integer from 10 to 99.", "The swapped number.", "10 <= n <= 99",
   "n = int(input())\nprint(n % 10 * 10 + n // 10)",
   lambda r: f"{r.randint(10, 99)}\n", edges=["10\n", "99\n", "50\n"])
