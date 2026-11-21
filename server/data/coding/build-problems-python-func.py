# PY-291..PY-400: Functions (20 lambda, 20 closures, 20 decorators, 25 higher-order, 25 recursion).
F = "Functions"
NAMES_F = ["Asha", "Ravi", "Meena", "Kiran", "Sita", "Arun", "Divya", "Naveen", "Tara", "Om"]
RI = lambda a, b: (lambda r: f"{r.randint(a, b)}\n")
LST = lambda a, b, lo=3, hi=9: (lambda r: (lambda k: rows(k, " ".join(str(r.randint(a, b)) for _ in range(k))))(r.randint(lo, hi)))

# ---- 10 one-argument lambdas ----
LAM1 = [
    ("Add GST Lambda", "A billing script stores its tax rule as a lambda `add_gst`. Add 18% GST to the price `x` and print the total with two decimals.", "price", "x * 1.18", ".2f", 1, 5000),
    ("Square the Side", "A floor-plan tool stores `area = lambda s: ...` to compute the area of a square room from its side. Print the area.", "side", "x * x", "d", 1, 500),
    ("Round to Nearest Ten", "A cash register rounds an amount to the nearest 10 rupees (halves go up) with a lambda. Print the rounded amount.", "amount", "(x + 5) // 10 * 10", "d", 0, 100000),
    ("Clamp Brightness", "A phone clamps a brightness value to the range 0 to 100 with a lambda. Print the clamped value.", "value", "max(0, min(100, x))", "d", -50, 200),
    ("Is Leap Lambda", "A calendar keeps `leap = lambda y: ...`. Print `True` or `False` for the year.", "year", "x % 4 == 0 and (x % 100 != 0 or x % 400 == 0)", "s", 1900, 2100),
    ("Minutes to Hours Label", "A timer shows a duration as `H h M m` using a lambda on the total minutes. Print the label.", "minutes", 'f"{x // 60}h {x % 60}m"', "s", 0, 5000),
    ("Triple Plus One", "A game rule gives `3x + 1` points for a streak of length `x` through a lambda. Print the points.", "streak", "3 * x + 1", "d", 0, 1000),
    ("Digit Sum Lambda", "A lottery keeps `ds = lambda n: ...` for the digit sum of a ticket. Print the digit sum.", "ticket", "sum(int(c) for c in str(abs(x)))", "d", 0, 10 ** 9),
    ("Percent Marks Lambda", "A report uses a lambda to convert marks out of 80 to a percentage. Print it with one decimal.", "marks", "x * 100 / 80", ".1f", 0, 80),
    ("Parity Word Lambda", "A game labels numbers with a lambda returning `even` or `odd`. Print the label for the number.", "n", '"even" if x % 2 == 0 else "odd"', "s", -999, 999),
]
for title, scene, name, expr, fmt, lo, hi in LAM1:
    show = {"d": "print(f(int(input())))", ".2f": 'print(f"{f(float(input())):.2f}")', ".1f": 'print(f"{f(float(input())):.1f}")', "s": "print(f(int(input())))"}[fmt]
    py(F, title, scene, f"One number `{name}`.", "The result.", f"{lo} <= {name} <= {hi}", f"f = lambda x: {expr}\n{show}", RI(lo, hi), edges=[f"{lo}\n", f"{hi}\n"])

# ---- 5 two-argument lambdas ----
LAM2 = [
    ("Hypotenuse Lambda", "A ladder app stores `h = lambda a, b: ...` for the diagonal of a right triangle. Print the hypotenuse of legs `a` and `b` with two decimals.", "(a * a + b * b) ** 0.5", ".2f", 1, 200),
    ("Average Lambda", "A scoreboard stores `avg = lambda a, b: ...`. Print the average of two scores with one decimal.", "(a + b) / 2", ".1f", 0, 100),
    ("Simple Interest Lambda", "A bank keeps `si = lambda p, r: ...` for one year's simple interest on principal `p` at `r` percent. Print the interest with two decimals.", "a * b / 100", ".2f", 100, 90000),
    ("Bigger Gap Lambda", "A chart tool stores `gap = lambda a, b: ...` returning the absolute difference of two readings. Print it.", "abs(a - b)", "d", -500, 500),
    ("Rectangle Perimeter Lambda", "A fence planner stores `per = lambda l, w: ...`. Print the perimeter of a rectangle with length `l` and width `w`.", "2 * (a + b)", "d", 1, 500),
]
for title, scene, expr, fmt, lo, hi in LAM2:
    show = 'print(f"{f(a, b):' + fmt + '}")' if fmt != "d" else "print(f(a, b))"
    cast = "float" if fmt != "d" else "int"
    py(F, title, scene, "One line with two numbers.", "The result.", f"{lo} <= values <= {hi}", f"f = lambda a, b: {expr}\na, b = map({cast}, input().split())\n{show}", lambda r, lo=lo, hi=hi: one_line(r.randint(lo, hi), r.randint(lo, hi)), edges=[f"{lo} {lo}\n"])

# ---- 5 lambdas as sort keys ----
py(F, "Sort Tickets by Priority", "A help desk sorts tickets given as `id priority` by priority (highest first) and then id. Print the ids in order.", "First line `n`, then `n` lines `id priority`.", "The sorted ids.", "1 <= n <= 30",
   "n = int(input())\nt = [tuple(map(int, input().split())) for _ in range(n)]\nt.sort(key=lambda x: (-x[1], x[0]))\nprint(*(i for i, _ in t))", lambda r: (lambda n: rows(n, *[f"{i} {r.randint(1, 5)}" for i in r.sample(range(100, 200), n)]))(r.randint(2, 8)), edges=["1\n5 5\n"])
py(F, "Sort Words by Length", "A poster designer sorts words by length, then alphabetically, using a lambda key. Print the sorted words.", "One line of words.", "The sorted words.", "At most 30 words.",
   "w = input().split()\nprint(*sorted(w, key=lambda s: (len(s), s)))", lambda r: " ".join(r.choice(["tea", "coffee", "milk", "ox", "jam", "bread", "egg", "cake"]) for _ in range(r.randint(3, 9))) + "\n", edges=["a\n"])
py(F, "Sort Points by Distance", "A drone sorts waypoints `x y` by distance from the origin (nearest first; ties by x then y). Print the points one per line.", "First line `n`, then `n` lines `x y`.", "The points in order.", "1 <= n <= 20",
   "n = int(input())\np = [tuple(map(int, input().split())) for _ in range(n)]\np.sort(key=lambda t: (t[0] ** 2 + t[1] ** 2, t[0], t[1]))\nfor x, y in p:\n    print(x, y)", lambda r: (lambda n: rows(n, *[f"{r.randint(-9, 9)} {r.randint(-9, 9)}" for _ in range(n)]))(r.randint(2, 7)), edges=["1\n0 0\n"])
py(F, "Max by Custom Key", "A store has `n` products `name price weight`. Print the name of the product with the highest price per unit weight (the first one if tied).", "First line `n`, then `n` lines.", "The product name.", "1 <= n <= 20, weight >= 1",
   "n = int(input())\nitems = [input().split() for _ in range(n)]\nbest = max(items, key=lambda t: int(t[1]) / int(t[2]))\nprint(best[0])", lambda r: (lambda n: rows(n, *[f"{nm} {r.randint(10, 200)} {r.randint(1, 9)}" for nm in r.sample(['pen', 'ink', 'book', 'bag', 'tape', 'glue'], n)]))(r.randint(2, 6)), edges=["1\na 5 1\n"])
py(F, "Sort Names Ignoring Case", "A contact list sorts names without caring about upper or lower case, keeping the original spelling. Print the sorted names.", "One line of names.", "The sorted names.", "At most 30 names.",
   "n = input().split()\nprint(*sorted(n, key=lambda s: s.lower()))", lambda r: " ".join(r.choice(["asha", "Ravi", "meena", "Kiran", "sita", "Arun", "divya", "Naveen"]) for _ in range(r.randint(3, 8))) + "\n", edges=["a\n"])

# ---- 10 closure factories ----
CLOS = [
    ("Multiplier Factory", "A pricing tool builds `make_multiplier(k)` that returns a function multiplying by `k`. Read `k`, then `n` numbers, and print each number multiplied.", "k", "return lambda x: x * k", ""),
    ("Adder Factory", "A scoring tool builds `make_adder(b)` that returns a function adding a bonus `b`. Read `b`, then `n` scores, and print each score with the bonus.", "b", "return lambda x: x + b", ""),
    ("Power Maker", "A maths app builds `make_power(e)` returning a function raising its argument to the power `e`. Read `e`, then `n` numbers, and print each result.", "e", "return lambda x: x ** e", ""),
    ("Discount Rule Factory", "A shop builds `make_discount(p)` returning a function that gives the price after `p` percent off (rounded down to a whole rupee). Read `p`, then prices, and print each.", "p", "return lambda x: x * (100 - p) // 100", ""),
    ("Threshold Checker", "A quality tool builds `make_checker(t)` returning a function that says `PASS` when a reading is at least `t`, otherwise `FAIL`. Read `t`, then readings, and print each verdict.", "t", 'return lambda x: "PASS" if x >= t else "FAIL"', ""),
    ("Greeting Builder", "A mailer builds `make_greeter(word)`. Read a greeting word, then `n` names, and print `<word>, <name>!` for each.", "w", "return lambda x: f'{w}, {x}!'", "str"),
    ("Unit Converter Factory", "A converter builds `make_converter(rate)` returning a function that converts using a fixed rate and rounds to two decimals. Read the rate, then amounts, and print each.", "rate", "return lambda x: round(x * rate, 2)", "float"),
    ("Range Limiter Factory", "A form builds `make_limiter(lo, hi)` (two values on the first line) returning a function that clamps a number into `[lo, hi]`. Print every clamped input.", "lo hi", "return lambda x: max(lo, min(hi, x))", "two"),
    ("Tax Slab Factory", "A tax tool builds `make_tax(rate, free)` (two values on the first line) returning a function giving the tax on an income: `rate` percent of the part above `free`, rounded down. Print the tax for every income.", "rate free", "return lambda x: max(0, x - free) * rate // 100", "two"),
    ("Prefix Maker", "An id printer builds `make_prefix(p)` returning a function that sticks `p` before an id with a dash. Read `p`, then ids, and print each.", "p", "return lambda x: p + '-' + x", "str"),
]
for title, scene, params, ret, kind in CLOS:
    if kind == "two":
        sol = f"def make({', '.join(params.split())}):\n    {ret}\n\n\na, b = map(int, input().split())\nf = make(a, b)\nn = int(input())\nfor x in map(int, input().split()):\n    print(f(x))"
        gen = lambda r: (lambda k: rows(one_line(r.randint(1, 30), r.randint(31, 90)).strip(), k, " ".join(str(r.randint(-20, 150)) for _ in range(k))))(r.randint(2, 7))
    elif kind == "str":
        sol = f"def make({params}):\n    {ret}\n\n\nf = make(input().strip())\nn = int(input())\nfor x in input().split():\n    print(f(x))"
        gen = (lambda r: (lambda k: rows(r.choice(["Hello", "Dear", "Hi", "EMP", "ID"]), k, " ".join(r.sample(NAMES_F, k))))(r.randint(2, 6)))
    elif kind == "float":
        sol = f"def make({params}):\n    {ret}\n\n\nf = make(float(input()))\nn = int(input())\nfor x in map(float, input().split()):\n    print(f(x))"
        gen = lambda r: (lambda k: rows(r.choice([0.012, 1.5, 83.2, 0.62]), k, " ".join(str(r.randint(1, 500)) for _ in range(k))))(r.randint(2, 6))
    else:
        sol = f"def make({params}):\n    {ret}\n\n\nf = make(int(input()))\nn = int(input())\nfor x in map(int, input().split()):\n    print(f(x))"
        gen = lambda r: (lambda k: rows(r.randint(2, 50), k, " ".join(str(r.randint(0, 100)) for _ in range(k))))(r.randint(2, 7))
    py(F, title, scene, "First the setup line(s), then `n`, then `n` values.", "One result per line.", "1 <= n <= 20", sol, gen)

# ---- 10 closures that keep state (nonlocal) ----
py(F, "Ticket Counter Closure", "A queue machine builds `make_counter()` whose function returns 1, 2, 3 ... on each call. Process `n` commands: `next` prints the next token and `reset` starts a new counter from 1.", "First line `n`, then `n` commands.", "One token per `next`.", "1 <= n <= 30",
   "def make_counter():\n    count = 0\n\n    def nxt():\n        nonlocal count\n        count += 1\n        return count\n\n    return nxt\n\n\nc = make_counter()\nn = int(input())\nfor _ in range(n):\n    if input().strip() == \"reset\":\n        c = make_counter()\n    else:\n        print(c())", lambda r: (lambda n: rows(n, *[r.choice(["next", "next", "next", "reset"]) for _ in range(n)]))(r.randint(3, 12)), edges=["1\nnext\n"])
py(F, "Running Average Tracker", "A fitness app builds `make_avg()` returning a function that takes a new reading and returns the average of all readings so far. For `n` readings print the average after each, with two decimals.", "First line `n`, then `n` readings.", "One average per reading.", "1 <= n <= 30",
   "def make_avg():\n    total = 0\n    count = 0\n\n    def add(x):\n        nonlocal total, count\n        total += x\n        count += 1\n        return total / count\n\n    return add\n\n\navg = make_avg()\nn = int(input())\nfor x in map(int, input().split()):\n    print(f\"{avg(x):.2f}\")", LST(1, 200, 2, 9), edges=["1\n5\n"])
py(F, "Wallet Closure", "A wallet is built by `make_wallet(start)`; its function takes `deposit x` or `spend x` and returns the new balance, refusing a spend larger than the balance (balance unchanged and the line `Insufficient`). Print the result of each command.", "First line `start n`, then `n` commands.", "One line per command.", "1 <= n <= 30",
   "def make_wallet(balance):\n    def act(cmd, x):\n        nonlocal balance\n        if cmd == \"deposit\":\n            balance += x\n        elif x > balance:\n            return \"Insufficient\"\n        else:\n            balance -= x\n        return balance\n\n    return act\n\n\nstart, n = map(int, input().split())\nw = make_wallet(start)\nfor _ in range(n):\n    c, x = input().split()\n    print(w(c, int(x)))", lambda r: (lambda n: rows(f"{r.randint(0, 300)} {n}", *[f"{r.choice(['deposit', 'spend'])} {r.randint(1, 200)}" for _ in range(n)]))(r.randint(2, 8)), edges=["0 1\nspend 1\n"])
py(F, "Call Limiter", "A free API allows only `k` calls. `make_limited(k)` returns a function that prints `ok` for each of the first `k` calls and `limit reached` afterwards. Run `n` calls.", "One line `k n`.", "One line per call.", "0 <= k, n <= 30",
   "def make_limited(k):\n    used = 0\n\n    def call():\n        nonlocal used\n        if used < k:\n            used += 1\n            return \"ok\"\n        return \"limit reached\"\n\n    return call\n\n\nk, n = map(int, input().split())\nf = make_limited(k)\nfor _ in range(n):\n    print(f())", lambda r: one_line(r.randint(0, 5), r.randint(1, 9)), edges=["0 1\n", "2 2\n"])
py(F, "Undo History", "A text box builds `make_history()` returning `do(text)` and `undo()`. Process `n` commands: `type <word>` appends the word, `undo` removes the last one (ignored when empty), and after each command print the words joined by spaces (or `(empty)`).", "First line `n`, then `n` commands.", "One line per command.", "1 <= n <= 30",
   "def make_history():\n    words = []\n\n    def do(w):\n        words.append(w)\n        return words\n\n    def undo():\n        if words:\n            words.pop()\n        return words\n\n    return do, undo\n\n\ndo, undo = make_history()\nn = int(input())\nfor _ in range(n):\n    p = input().split()\n    cur = do(p[1]) if p[0] == \"type\" else undo()\n    print(\" \".join(cur) if cur else \"(empty)\")", lambda r: (lambda n: rows(n, *[r.choice([f"type {r.choice(['hi', 'there', 'all'])}", "undo"]) for _ in range(n)]))(r.randint(3, 10)), edges=["1\nundo\n"])
py(F, "Highest Score Tracker", "A scoreboard builds `make_tracker()` returning a function that records a score and returns the best score so far. Print the best after every new score.", "First line `n`, then `n` scores.", "One value per score.", "1 <= n <= 30",
   "def make_tracker():\n    best = None\n\n    def record(x):\n        nonlocal best\n        if best is None or x > best:\n            best = x\n        return best\n\n    return record\n\n\nt = make_tracker()\nn = int(input())\nprint(*(t(x) for x in map(int, input().split())))", LST(0, 100, 2, 10), edges=["1\n3\n"])
py(F, "Once Only Coupon", "A coupon function built by `make_once(value)` returns `value` the first time it is called and `0` every time after. Print the results of `n` calls.", "One line `value n`.", "The `n` results separated by spaces.", "0 <= value <= 10^6, 1 <= n <= 20",
   "def make_once(v):\n    used = False\n\n    def use():\n        nonlocal used\n        if used:\n            return 0\n        used = True\n        return v\n\n    return use\n\n\nv, n = map(int, input().split())\nc = make_once(v)\nprint(*(c() for _ in range(n)))", lambda r: one_line(r.randint(0, 500), r.randint(1, 8)), edges=["5 1\n"])
py(F, "Fibonacci Generator Closure", "A closure `make_fib()` returns a function giving the next Fibonacci number on each call (1, 1, 2, 3, 5 ...). Print the first `n` numbers separated by spaces.", "One integer `n`.", "The numbers.", "1 <= n <= 50",
   "def make_fib():\n    a, b = 0, 1\n\n    def nxt():\n        nonlocal a, b\n        a, b = b, a + b\n        return a\n\n    return nxt\n\n\nf = make_fib()\nprint(*(f() for _ in range(int(input()))))", RI(1, 40), edges=["1\n", "50\n"])
py(F, "Moving Window Sum", "A sensor closure `make_window(k)` keeps the last `k` readings and returns their sum after each new reading. Print the sum after each of `n` readings.", "First line `n k`, then `n` readings.", "One sum per reading.", "1 <= k <= 10, 1 <= n <= 30",
   "def make_window(k):\n    buf = []\n\n    def add(x):\n        buf.append(x)\n        if len(buf) > k:\n            buf.pop(0)\n        return sum(buf)\n\n    return add\n\n\nn, k = map(int, input().split())\nw = make_window(k)\nprint(*(w(x) for x in map(int, input().split())))", lambda r: (lambda n: rows(f"{n} {r.randint(1, 5)}", " ".join(str(r.randint(1, 50)) for _ in range(n))))(r.randint(2, 10)), edges=["1 1\n5\n"])
py(F, "Memoising Square Closure", "A closure `make_square()` remembers squares it already computed and reports them. For each query number print `<value> new` the first time it is asked and `<value> cached` afterwards.", "First line `n`, then `n` numbers.", "One line per query.", "1 <= n <= 30",
   "def make_square():\n    cache = {}\n\n    def sq(x):\n        if x in cache:\n            return f\"{cache[x]} cached\"\n        cache[x] = x * x\n        return f\"{cache[x]} new\"\n\n    return sq\n\n\nsq = make_square()\nn = int(input())\nfor x in map(int, input().split()):\n    print(sq(x))", LST(1, 6, 3, 10), edges=["1\n2\n"])
