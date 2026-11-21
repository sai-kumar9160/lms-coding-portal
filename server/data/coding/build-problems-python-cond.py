# PY-051..PY-100: Conditional Statements (elif ladders, nested decisions, truthy/falsy, boolean logic, number and text checks).
C = "Conditional Statements"
RI = lambda a, b: (lambda r: f"{r.randint(a, b)}\n")


def ladder(title, scene, unit, cuts, labels, lo, hi, edges):
    """An elif ladder: `cuts` are upper bounds (inclusive) for the first len(cuts) labels, the last label is for anything above."""
    body = f"x = int(input())\n" + "".join(f'{"if" if i == 0 else "elif"} x <= {c}:\n    print({l!r})\n' for i, (c, l) in enumerate(zip(cuts, labels))) + f"else:\n    print({labels[-1]!r})"
    py(C, title, scene, f"One integer `{unit}`.", "The label.", f"{lo} <= {unit} <= {hi}", body, RI(lo, hi), edges=edges)


# ---- 10 elif ladders ----
ladder("Exam Grade Card", "A school prints a grade from the marks out of 100: up to 39 is `F`, up to 49 is `D`, up to 59 is `C`, up to 74 is `B`, anything higher is `A`.", "marks", [39, 49, 59, 74], ["F", "D", "C", "B", "A"], 0, 100, ["39\n", "40\n", "75\n", "100\n"])
ladder("Courier Weight Charge", "A courier charges by parcel weight in grams: up to 500 costs 40, up to 1000 costs 70, up to 5000 costs 150, above that costs 300. Print the charge.", "grams", [500, 1000, 5000], ["40", "70", "150", "300"], 1, 12000, ["500\n", "501\n", "5001\n"])
ladder("Cinema Ticket by Age", "A cinema sells tickets by age: up to 5 is `Free`, up to 12 is `Child`, up to 59 is `Adult`, older is `Senior`.", "age", [5, 12, 59], ["Free", "Child", "Adult", "Senior"], 0, 100, ["5\n", "6\n", "60\n"])
ladder("BMI Category Chart", "A clinic reports a BMI value (rounded to a whole number) as `Underweight` up to 18, `Normal` up to 24, `Overweight` up to 29, otherwise `Obese`.", "bmi", [18, 24, 29], ["Underweight", "Normal", "Overweight", "Obese"], 10, 50, ["18\n", "19\n", "30\n"])
ladder("Internet Plan Picker", "An ISP suggests a plan by monthly data in GB: up to 10 is `Basic`, up to 50 is `Standard`, up to 150 is `Premium`, more is `Unlimited`.", "gb", [10, 50, 150], ["Basic", "Standard", "Premium", "Unlimited"], 1, 400, ["10\n", "11\n", "151\n"])
ladder("Taxi Fare Slab", "A taxi charges a flat fare by distance in km: up to 2 km is 50, up to 10 km is 180, up to 25 km is 420, beyond that 800. Print the fare.", "km", [2, 10, 25], ["50", "180", "420", "800"], 1, 80, ["2\n", "3\n", "26\n"])
ladder("Electricity Slab Rate", "An electricity board puts a home into a billing class by monthly units: up to 100 units is `Low`, up to 300 is `Medium`, above that is `High`. Print the class.", "units", [100, 300], ["Low", "Medium", "High"], 0, 900, ["100\n", "101\n", "301\n"])
ladder("Cricket Strike Rate Label", "A scorer labels a batter's strike rate: up to 60 is `Slow`, up to 100 is `Steady`, up to 140 is `Fast`, above is `Explosive`.", "rate", [60, 100, 140], ["Slow", "Steady", "Fast", "Explosive"], 20, 260, ["60\n", "61\n", "141\n"])
ladder("Library Fine Band", "A library fines late books by days late: up to 3 days costs `0`, up to 7 days `20`, up to 14 days `50`, after that `100`. Print the fine.", "days", [3, 7, 14], ["0", "20", "50", "100"], 0, 60, ["3\n", "4\n", "15\n"])
ladder("Hotel Star Rating", "A travel site converts a review score out of 100 into stars: up to 20 is `1 star`, up to 40 `2 stars`, up to 60 `3 stars`, up to 80 `4 stars`, above `5 stars`.", "score", [20, 40, 60, 80], ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"], 0, 100, ["20\n", "21\n", "81\n"])

# ---- 10 nested and multi-condition decisions ----
py(C, "Loan Eligibility Check", "A bank approves a loan only if the applicant is 21 to 60 years old, earns at least 25000 a month and has a credit score of at least 650. Print `Approved` or `Rejected`.",
   "One line `age income score`.", "`Approved` or `Rejected`.", "18 <= age <= 70",
   'age, income, score = map(int, input().split())\nprint("Approved" if 21 <= age <= 60 and income >= 25000 and score >= 650 else "Rejected")',
   lambda r: one_line(r.randint(18, 70), r.randint(10000, 90000), r.randint(500, 850)), edges=["21 25000 650\n", "60 24999 700\n", "61 90000 800\n"])
py(C, "Scholarship Decision", "A college gives a full scholarship for marks of 90 or more, a half scholarship for 75 to 89 if the family income is below 300000, and none otherwise. Print `Full`, `Half` or `None`.",
   "One line `marks income`.", "`Full`, `Half` or `None`.", "0 <= marks <= 100",
   'm, inc = map(int, input().split())\nif m >= 90:\n    print("Full")\nelif m >= 75 and inc < 300000:\n    print("Half")\nelse:\n    print("None")',
   lambda r: one_line(r.randint(50, 100), r.randint(100000, 600000)), edges=["90 900000\n", "80 299999\n", "80 300000\n"])
py(C, "Rollercoaster Entry", "A ride allows a visitor who is at least 120 cm tall and between 8 and 65 years old. A child under 12 must also have an adult with them. Print `Allowed`, `Needs adult` or `Not allowed`.",
   "One line `height age adult` where `adult` is `Y` or `N`.", "`Allowed`, `Needs adult` or `Not allowed`.", "50 <= height <= 220",
   'h, a, adult = input().split()\nh, a = int(h), int(a)\nif h < 120 or a < 8 or a > 65:\n    print("Not allowed")\nelif a < 12 and adult != "Y":\n    print("Needs adult")\nelse:\n    print("Allowed")',
   lambda r: one_line(r.randint(90, 190), r.randint(5, 70), r.choice("YN")), edges=["120 8 Y\n", "120 8 N\n", "119 30 N\n"])
py(C, "Admission Cutoff", "A college admits a student with at least 60% in the board exam AND an entrance rank within 5000, or with a sports quota. Print `Admitted` or `Waitlisted`.",
   "One line `percent rank quota` where `quota` is `Y` or `N`.", "`Admitted` or `Waitlisted`.", "0 <= percent <= 100",
   'p, rank, q = input().split()\nprint("Admitted" if (int(p) >= 60 and int(rank) <= 5000) or q == "Y" else "Waitlisted")',
   lambda r: one_line(r.randint(40, 99), r.randint(100, 9000), r.choice("YN")), edges=["60 5000 N\n", "59 100 N\n", "10 9999 Y\n"])
py(C, "Triangle Type Finder", "A geometry app classifies a triangle from its three sides: `Equilateral`, `Isosceles`, `Scalene`, or `Invalid` if the sides cannot form a triangle.",
   "One line `a b c`.", "The triangle type.", "1 <= a, b, c <= 1000",
   'a, b, c = map(int, input().split())\nif a + b <= c or a + c <= b or b + c <= a:\n    print("Invalid")\nelif a == b == c:\n    print("Equilateral")\nelif a == b or b == c or a == c:\n    print("Isosceles")\nelse:\n    print("Scalene")',
   lambda r: one_line(*[r.randint(1, 12) for _ in range(3)]), edges=["5 5 5\n", "3 3 5\n", "1 2 3\n", "3 4 5\n"])
py(C, "Login Gate", "A portal accepts the username `admin` with password `9090` as `Admin`, any other username with a password of at least 6 characters as `User`, and everything else as `Denied`.",
   "One line `username password`.", "`Admin`, `User` or `Denied`.", "No spaces inside tokens.",
   'u, p = input().split()\nif u == "admin" and p == "9090":\n    print("Admin")\nelif u != "admin" and len(p) >= 6:\n    print("User")\nelse:\n    print("Denied")',
   lambda r: one_line(r.choice(["admin", "ravi", "sita"]), r.choice(["9090", "abc", "secret1", "hello123", "12"])), edges=["admin 9090\n", "admin abcdefg\n", "ravi 123456\n"])
py(C, "Coupon Stack Rule", "A shop lets a customer use at most one coupon: `FLAT50` takes 50 off when the bill is above 500, `PERCENT10` takes 10 percent off when the bill is above 200. Print the final bill (two decimals) or the bill unchanged if the coupon does not apply.",
   "One line `bill coupon`.", "The final bill, two decimals.", "1 <= bill <= 100000",
   'bill, code = input().split()\nbill = float(bill)\nif code == "FLAT50" and bill > 500:\n    bill -= 50\nelif code == "PERCENT10" and bill > 200:\n    bill *= 0.9\nprint(f"{bill:.2f}")',
   lambda r: one_line(r.randint(100, 1500), r.choice(["FLAT50", "PERCENT10", "NONE"])), edges=["500 FLAT50\n", "501 FLAT50\n", "201 PERCENT10\n"])
py(C, "Date Sanity Check", "A form checks a day, month and year. Month must be 1 to 12; day must fit the month (February has 29 days in a leap year, otherwise 28). Print `Valid` or `Invalid`.",
   "One line `day month year`.", "`Valid` or `Invalid`.", "1 <= year <= 9999",
   'd, m, y = map(int, input().split())\nleap = y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)\ndays = [31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]\nprint("Valid" if 1 <= m <= 12 and 1 <= d <= days[m - 1] else "Invalid")',
   lambda r: one_line(r.randint(1, 32), r.randint(1, 13), r.randint(1990, 2030)), edges=["29 2 2024\n", "29 2 2023\n", "31 4 2022\n", "15 13 2020\n"])
py(C, "Voting Eligibility", "A voter desk lets a citizen vote if they are at least 18 and are registered. Print `Can vote`, `Not registered` or `Too young`.",
   "One line `age registered` where `registered` is `Y` or `N`.", "One of the three messages.", "0 <= age <= 120",
   'age, reg = input().split()\nif int(age) < 18:\n    print("Too young")\nelif reg != "Y":\n    print("Not registered")\nelse:\n    print("Can vote")',
   lambda r: one_line(r.randint(10, 80), r.choice("YN")), edges=["18 Y\n", "17 Y\n", "30 N\n"])
py(C, "Shipping Cost Rules", "An online store ships free for orders of 999 or more. Otherwise shipping is 40 inside the city and 90 outside it, with an extra 30 for express delivery. Print the shipping cost.",
   "One line `order city express` where `city` and `express` are `Y` or `N`.", "The shipping cost.", "1 <= order <= 100000",
   'order, city, express = input().split()\nif int(order) >= 999:\n    print(0)\nelse:\n    cost = 40 if city == "Y" else 90\n    print(cost + (30 if express == "Y" else 0))',
   lambda r: one_line(r.randint(100, 1500), r.choice("YN"), r.choice("YN")), edges=["999 N Y\n", "998 Y Y\n", "500 N N\n"])

# ---- 10 truthy / falsy checks ----
py(C, "Empty Coupon Box", "A checkout page has a coupon field that may be left empty. Print `No coupon` if the field is empty, otherwise `Applied: ` followed by the code.",
   "One line that may be empty.", "The message.", "At most 20 characters.",
   's = input().strip()\nprint("Applied: " + s if s else "No coupon")',
   lambda r: r.choice(["", "SAVE20", "NEW50", "", "FREESHIP"]) + "\n", edges=["\n", "WELCOME\n"])
py(C, "Zero Stock Alert", "A shelf counter reports the stock as a number. Print `Reorder` when the number is zero and `OK` for anything else (negative numbers mean returns).",
   "One integer.", "`Reorder` or `OK`.", "-100 <= stock <= 1000",
   'n = int(input())\nprint("OK" if n else "Reorder")',
   RI(-5, 40), edges=["0\n", "-1\n"])
py(C, "Cart Has Items", "A cart sends its items as a line of words that may be empty. Print `Empty cart` if there are no words, else `Items: ` and the number of words.",
   "One line that may be empty.", "The message.", "At most 50 words.",
   'items = input().split()\nprint(f"Items: {len(items)}" if items else "Empty cart")',
   lambda r: " ".join(r.choice(["milk", "rice", "soap", "tea", "eggs"]) for _ in range(r.choice([0, 1, 3, 5]))) + "\n", edges=["\n", "milk\n"])
py(C, "Nonzero Count of Votes", "A poll sends three vote counts. Print how many of the three candidates received at least one vote.",
   "One line with three integers.", "A number from 0 to 3.", "0 <= votes <= 10^6",
   "a, b, c = map(int, input().split())\nprint(sum(1 for v in (a, b, c) if v))",
   lambda r: one_line(*[r.choice([0, r.randint(1, 900)]) for _ in range(3)]), edges=["0 0 0\n", "1 1 1\n"])
py(C, "Default Display Name", "A profile page shows the user's nickname, or the full name if the nickname is empty. The first line is the full name and the second line is the nickname (possibly empty). Print the name to display.",
   "Two lines: full name, then nickname (may be empty).", "The display name.", "Each at most 30 characters.",
   'full = input().strip()\nnick = input().strip()\nprint(nick or full)',
   lambda r: rows(r.choice(["Anita Rao", "Ravi Kumar", "Sita Devi"]), r.choice(["", "Ani", "", "RK"])), edges=["Asha Verma\n\n"])
py(C, "Score or Absent Mark", "A mark sheet stores `0` for an absent student. Print `Absent` if the mark is `0`, `Pass` if it is at least 40, otherwise `Fail`.",
   "One integer `marks`.", "`Absent`, `Pass` or `Fail`.", "0 <= marks <= 100",
   'm = int(input())\nif not m:\n    print("Absent")\nelif m >= 40:\n    print("Pass")\nelse:\n    print("Fail")',
   lambda r: f"{r.choice([0, r.randint(1, 100)])}\n", edges=["0\n", "39\n", "40\n"])
py(C, "First Non-Empty Contact", "A CRM stores a mobile number, a landline and an email for each customer, any of which may be `-` (missing). Print the first one that is present, in that order, or `No contact`.",
   "One line `mobile landline email`.", "The first present contact or `No contact`.", "Missing values are written as `-`.",
   'vals = input().split()\nfor v in vals:\n    if v != "-":\n        print(v)\n        break\nelse:\n    print("No contact")',
   lambda r: one_line(*[r.choice(["-", v]) for v in ("98765", "040-1234", "a@b.in")]), edges=["- - -\n", "- 0402 -\n"])
py(C, "Any Alarm Active", "A building has three alarm sensors reporting `1` for triggered and `0` for quiet. Print `ALERT` if any sensor is triggered, otherwise `Calm`.",
   "One line with three values of 0 or 1.", "`ALERT` or `Calm`.", "Each value is 0 or 1.",
   'print("ALERT" if any(int(v) for v in input().split()) else "Calm")',
   lambda r: one_line(*[r.choice([0, 0, 1]) for _ in range(3)]), edges=["0 0 0\n", "0 0 1\n"])
py(C, "All Docs Submitted", "A visa form needs three documents, each marked `1` if submitted. Print `Complete` only if all three are submitted, otherwise `Missing`.",
   "One line with three values of 0 or 1.", "`Complete` or `Missing`.", "Each value is 0 or 1.",
   'print("Complete" if all(int(v) for v in input().split()) else "Missing")',
   lambda r: one_line(*[r.choice([0, 1, 1]) for _ in range(3)]), edges=["1 1 1\n", "1 0 1\n"])
py(C, "Blank Review Filter", "A review site hides reviews that are blank or only spaces. Print `Hidden` for such a review, otherwise `Shown`.",
   "One line that may be blank.", "`Hidden` or `Shown`.", "At most 100 characters.",
   'print("Shown" if input().strip() else "Hidden")',
   lambda r: r.choice(["", "   ", "Great product", " ok ", "\t"]) + "\n", edges=["\n", "   \n", "good\n"])

# ---- 10 boolean logic, chained comparisons and ternary ----
py(C, "Safe Temperature Window", "A vaccine fridge must stay between 2 and 8 degrees, inclusive. Use one chained comparison and print `Safe` or `Danger`.",
   "One integer `t`.", "`Safe` or `Danger`.", "-20 <= t <= 40",
   't = int(input())\nprint("Safe" if 2 <= t <= 8 else "Danger")', RI(-5, 15), edges=["2\n", "8\n", "1\n", "9\n"])
py(C, "Exactly One Key Pressed", "A lock opens only when exactly one of two buttons (given as 0 or 1) is pressed, not both and not none. Print `Open` or `Locked`.",
   "One line `a b`.", "`Open` or `Locked`.", "Each value is 0 or 1.",
   'a, b = map(int, input().split())\nprint("Open" if (a == 1) != (b == 1) else "Locked")',
   lambda r: one_line(r.randint(0, 1), r.randint(0, 1)), edges=["0 0\n", "0 1\n", "1 0\n", "1 1\n"])
py(C, "Weekend Delivery Day", "A courier does not deliver on weekends or on a public holiday. Given the day number (1 = Monday to 7 = Sunday) and a holiday flag `Y` or `N`, print `Delivery` or `No delivery`.",
   "One line `day holiday`.", "`Delivery` or `No delivery`.", "1 <= day <= 7",
   'd, h = input().split()\nprint("No delivery" if int(d) >= 6 or h == "Y" else "Delivery")',
   lambda r: one_line(r.randint(1, 7), r.choice("YN")), edges=["5 N\n", "5 Y\n", "6 N\n"])
py(C, "Free Delivery Qualifier", "An app gives free delivery when the order is above 500, or when the customer is a member and the order is above 200. Print `Free` or `Paid`.",
   "One line `order member` where `member` is `Y` or `N`.", "`Free` or `Paid`.", "1 <= order <= 100000",
   'o, m = input().split()\no = int(o)\nprint("Free" if o > 500 or (m == "Y" and o > 200) else "Paid")',
   lambda r: one_line(r.randint(50, 800), r.choice("YN")), edges=["500 N\n", "501 N\n", "201 Y\n", "200 Y\n"])
py(C, "Ternary Pass Label", "A report card prints one word per subject. Using a conditional expression, print `Pass` if the mark is at least 35 and `Fail` otherwise.",
   "One integer `mark`.", "`Pass` or `Fail`.", "0 <= mark <= 100",
   'm = int(input())\nprint("Pass" if m >= 35 else "Fail")', RI(0, 100), edges=["34\n", "35\n"])
py(C, "Leap Year Calendar", "A calendar app must know if February has 29 days. A year is a leap year when divisible by 4, except century years that are not divisible by 400. Print `Leap` or `Common`.",
   "One integer `year`.", "`Leap` or `Common`.", "1 <= year <= 9999",
   'y = int(input())\nprint("Leap" if y % 4 == 0 and (y % 100 != 0 or y % 400 == 0) else "Common")',
   RI(1900, 2100), edges=["1900\n", "2000\n", "2024\n", "2023\n"])
py(C, "Not In Stock and Not Preordered", "A product page shows `Notify me` only when the item is neither in stock nor pre-orderable. Given two flags `1` or `0` for in-stock and pre-order, print `Notify me` or `Buy`.",
   "One line `instock preorder`.", "`Notify me` or `Buy`.", "Each value is 0 or 1.",
   'a, b = map(int, input().split())\nprint("Notify me" if not a and not b else "Buy")',
   lambda r: one_line(r.randint(0, 1), r.randint(0, 1)), edges=["0 0\n", "1 0\n", "0 1\n", "1 1\n"])
py(C, "Student Rank Comparison", "Two students have marks `a` and `b`. Print `A leads`, `B leads` or `Tie`.",
   "One line `a b`.", "One of the three messages.", "0 <= a, b <= 100",
   'a, b = map(int, input().split())\nprint("A leads" if a > b else "B leads" if b > a else "Tie")',
   lambda r: one_line(r.randint(0, 100), r.randint(0, 100)), edges=["50 50\n", "0 100\n"])
py(C, "Office Open Hours", "An office is open from 9 to 17 (9 inclusive, 17 exclusive) on weekdays and from 10 to 14 (10 inclusive, 14 exclusive) on Saturday, and closed on Sunday. Given the day (1 = Monday to 7 = Sunday) and the hour, print `Open` or `Closed`.",
   "One line `day hour`.", "`Open` or `Closed`.", "1 <= day <= 7, 0 <= hour <= 23",
   'd, h = map(int, input().split())\nif d <= 5:\n    print("Open" if 9 <= h < 17 else "Closed")\nelif d == 6:\n    print("Open" if 10 <= h < 14 else "Closed")\nelse:\n    print("Closed")',
   lambda r: one_line(r.randint(1, 7), r.randint(0, 23)), edges=["1 9\n", "1 17\n", "6 10\n", "6 14\n", "7 12\n"])
py(C, "Premium Customer Test", "A customer is premium when they have spent at least 10000 or have made at least 20 orders, but never if they have a pending dispute. Print `Premium` or `Regular`.",
   "One line `spent orders dispute` where `dispute` is `Y` or `N`.", "`Premium` or `Regular`.", "0 <= spent <= 10^7",
   's, o, d = input().split()\nprint("Premium" if (int(s) >= 10000 or int(o) >= 20) and d != "Y" else "Regular")',
   lambda r: one_line(r.randint(0, 20000), r.randint(0, 40), r.choice("YN")), edges=["10000 0 N\n", "0 20 N\n", "99999 99 Y\n"])

# ---- 10 number and text checks ----
py(C, "Even or Odd Token", "A raffle desk checks if a ticket number is even or odd. Print `Even` or `Odd`.",
   "One integer `n`.", "`Even` or `Odd`.", "-10^9 <= n <= 10^9",
   'n = int(input())\nprint("Even" if n % 2 == 0 else "Odd")', RI(-500, 500), edges=["0\n", "-3\n"])
py(C, "Fizz Buzz Ticket", "A game show prints `Fizz` for a ticket number divisible by 3, `Buzz` if divisible by 5, `FizzBuzz` if divisible by both, otherwise the number itself.",
   "One integer `n`.", "The word or the number.", "1 <= n <= 10^6",
   'n = int(input())\nif n % 15 == 0:\n    print("FizzBuzz")\nelif n % 3 == 0:\n    print("Fizz")\nelif n % 5 == 0:\n    print("Buzz")\nelse:\n    print(n)',
   RI(1, 200), edges=["15\n", "9\n", "10\n", "7\n"])
py(C, "Vowel or Consonant Key", "A typing tutor checks a single letter. Print `Vowel` or `Consonant` (letters may be upper or lower case), or `Not a letter`.",
   "One character.", "`Vowel`, `Consonant` or `Not a letter`.", "One printable ASCII character.",
   'c = input().strip()\nif not c.isalpha():\n    print("Not a letter")\nelif c.lower() in "aeiou":\n    print("Vowel")\nelse:\n    print("Consonant")',
   lambda r: r.choice("aeiouAEIOUbcdfgXYZ5!") + "\n", edges=["a\n", "z\n", "7\n"])
py(C, "Point Quadrant Locator", "A game map places a point at `(x, y)`. Print `Origin`, `X axis`, `Y axis`, or the quadrant number 1 to 4.",
   "One line `x y`.", "The location.", "-1000 <= x, y <= 1000",
   'x, y = map(int, input().split())\nif x == 0 and y == 0:\n    print("Origin")\nelif y == 0:\n    print("X axis")\nelif x == 0:\n    print("Y axis")\nelif x > 0:\n    print(1 if y > 0 else 4)\nelse:\n    print(2 if y > 0 else 3)',
   lambda r: one_line(r.randint(-6, 6), r.randint(-6, 6)), edges=["0 0\n", "4 0\n", "0 -2\n", "-3 -3\n"])
py(C, "Season From Month", "A weather app maps a month number to a season: 12, 1, 2 `Winter`; 3 to 5 `Spring`; 6 to 8 `Summer`; 9 to 11 `Autumn`.",
   "One integer `month`.", "The season.", "1 <= month <= 12",
   'm = int(input())\nif m in (12, 1, 2):\n    print("Winter")\nelif m <= 5:\n    print("Spring")\nelif m <= 8:\n    print("Summer")\nelse:\n    print("Autumn")',
   RI(1, 12), edges=["12\n", "1\n", "5\n", "6\n"])
py(C, "Sign and Size of Balance", "A wallet app reads a balance change. Print `Credit` for a positive change, `Debit` for a negative one and `No change` for zero, and add `(big)` if the absolute change is at least 1000.",
   "One integer.", "The label.", "-10^6 <= change <= 10^6",
   'n = int(input())\nlabel = "Credit" if n > 0 else "Debit" if n < 0 else "No change"\nprint(label + (" (big)" if abs(n) >= 1000 else ""))',
   lambda r: f"{r.choice([0, r.randint(-3000, 3000)])}\n", edges=["0\n", "1000\n", "-999\n", "-1000\n"])
py(C, "Divisible By Both Gears", "Two gears turn every `a` and `b` ticks. For a tick number `n`, print `Both` if both gears turn, `A` or `B` if only one does, otherwise `None`.",
   "One line `n a b`.", "`Both`, `A`, `B` or `None`.", "1 <= n, a, b <= 10^6",
   'n, a, b = map(int, input().split())\nx, y = n % a == 0, n % b == 0\nprint("Both" if x and y else "A" if x else "B" if y else "None")',
   lambda r: one_line(r.randint(1, 60), r.randint(2, 6), r.randint(2, 9)), edges=["12 3 4\n", "5 2 3\n"])
py(C, "Upper or Lower Letter", "A form field is a single character. Print `Upper` for a capital letter, `Lower` for a small letter, `Digit` for a digit and `Other` for anything else.",
   "One character.", "`Upper`, `Lower`, `Digit` or `Other`.", "One printable ASCII character.",
   'c = input().strip()\nif c.isupper():\n    print("Upper")\nelif c.islower():\n    print("Lower")\nelif c.isdigit():\n    print("Digit")\nelse:\n    print("Other")',
   lambda r: r.choice("ABCxyzq0592!#@MN") + "\n", edges=["A\n", "z\n", "5\n", "#\n"])
py(C, "Palindrome Plate", "A parking system reads a number plate made of digits. Print `Mirror` if it reads the same forwards and backwards, otherwise `Normal`.",
   "One string of digits.", "`Mirror` or `Normal`.", "1 to 10 digits.",
   's = input().strip()\nprint("Mirror" if s == s[::-1] else "Normal")',
   lambda r: r.choice(["1221", "4567", "9009", "12321", "808", str(r.randint(1000, 99999))]) + "\n", edges=["7\n", "10\n"])
py(C, "Largest of Three Bids", "Three bidders offer amounts. Print the highest bid; if the highest is shared by two or more bidders print `Tie` followed by the amount.",
   "One line with three integers.", "The highest bid or `Tie <amount>`.", "1 <= bid <= 10^6",
   'bids = list(map(int, input().split()))\ntop = max(bids)\nprint(f"Tie {top}" if bids.count(top) > 1 else top)',
   lambda r: one_line(*[r.randint(1, 9) * 100 for _ in range(3)]), edges=["500 500 100\n", "100 200 300\n", "700 700 700\n"])
