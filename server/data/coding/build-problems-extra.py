# The C, Java, DSA, SQL and HTML & CSS tracks. build-problems.py runs this file (it uses problem(), lines() and arr() from there).
# Each track has its own reference solutions, written in that track's language, so expected outputs match what students must write.
import json
import random


def names_list(*words):
    return [w for w in words]


# ======================================================================================================
# C track: students write C (languages = ["c"]).
# ======================================================================================================
C = dict(track="C", lang="c", languages=["c"])

problem("c-hello-printf", "Hello from C", "EASY", "Basics",
        "Print `Hello, C!` using `printf`. Every C program starts in `main`.",
        "There is no input.", "Print `Hello, C!`.", "None.",
        '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, C!\\n");\n    return 0;\n}',
        [""], samples=1, **C)

problem("c-pointer-swap", "Swap with Pointers", "EASY", "Pointers",
        "Read two integers `a` and `b`. Write a function `void swap(int *x, int *y)` that swaps them through pointers, call it, and print the values as `a b` after the swap.",
        "One line with two integers.", "Print the two values after swapping, separated by a space.", "-10^9 <= a, b <= 10^9",
        '#include <stdio.h>\n\nvoid swap(int *x, int *y) {\n    int t = *x;\n    *x = *y;\n    *y = t;\n}\n\nint main(void) {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    swap(&a, &b);\n    printf("%d %d\\n", a, b);\n    return 0;\n}',
        ["3 5", "-7 2", "0 0", "100 -100", "15 30", "1000000000 -1000000000"], **C)

problem("c-array-reverse", "Reverse an Array", "EASY", "Arrays",
        "Read `n` integers into an array and print them in reverse order, separated by spaces.",
        "First line `n`. Second line `n` integers.", "Print the reversed array on one line.", "1 <= n <= 1000",
        '#include <stdio.h>\n\nint main(void) {\n    int n, a[1000];\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) scanf("%d", &a[i]);\n    for (int i = n - 1; i >= 0; i--) printf("%d%c", a[i], i ? \' \' : \'\\n\');\n    return 0;\n}',
        [arr([1, 2, 3, 4, 5]), arr([7]), arr([10, -3, 8, 8]), arr([5, 4, 3, 2, 1, 0]), arr(list(range(1, 21))), arr([-1, -2, -3])], **C)

problem("c-string-length", "Length of a String", "EASY", "Strings",
        "Read one word and print how many characters it has. Count them with a loop over the characters until the end of the string (`'\\0'`) instead of calling `strlen`.",
        "One word without spaces (at most 100 characters).", "Print the length.", "1 <= length <= 100",
        '#include <stdio.h>\n\nint main(void) {\n    char s[128];\n    scanf("%100s", s);\n    int n = 0;\n    while (s[n] != \'\\0\') n++;\n    printf("%d\\n", n);\n    return 0;\n}',
        ["hello", "a", "programming", "NextByte", "abcdefghijklmnopqrstuvwxyz", "12345"], **C)

problem("c-factorial-recursion", "Factorial by Recursion", "EASY", "Recursion",
        "Read `n` and print `n!`. Write a recursive function `long long fact(int n)`. `0! = 1`.",
        "One integer `n`.", "Print `n!`.", "0 <= n <= 20",
        '#include <stdio.h>\n\nlong long fact(int n) {\n    return n <= 1 ? 1 : n * fact(n - 1);\n}\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    printf("%lld\\n", fact(n));\n    return 0;\n}',
        ["5", "0", "1", "10", "20", "7"], **C)

problem("c-sum-and-average", "Sum and Average", "EASY", "Arrays",
        "Read `n` integers. Print their sum on the first line and their average, with two digits after the decimal point, on the second line.",
        "First line `n`. Second line `n` integers.", "Line 1: the sum. Line 2: the average with two decimals.", "1 <= n <= 1000, |value| <= 10^6",
        '#include <stdio.h>\n\nint main(void) {\n    int n;\n    long long sum = 0;\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) {\n        int x;\n        scanf("%d", &x);\n        sum += x;\n    }\n    printf("%lld\\n%.2f\\n", sum, (double)sum / n);\n    return 0;\n}',
        [arr([1, 2, 3, 4]), arr([10]), arr([-5, 5, 10]), arr([100, 200, 300, 401]), arr([7, 7, 7]), arr([1000000, -1000000, 3])], **C)

problem("c-struct-topper", "Class Topper (struct)", "MEDIUM", "Structures",
        "Read `n` students, each with a name and marks. Store them in an array of `struct`s and print the name of the student with the highest marks. If two students tie, print the one who appears first.",
        "First line `n`. Then `n` lines: `name marks` (name has no spaces).", "Print the topper's name.", "1 <= n <= 100, 0 <= marks <= 100",
        '#include <stdio.h>\n\nstruct Student {\n    char name[32];\n    int marks;\n};\n\nint main(void) {\n    int n, best = 0;\n    struct Student s[100];\n    scanf("%d", &n);\n    for (int i = 0; i < n; i++) {\n        scanf("%31s %d", s[i].name, &s[i].marks);\n        if (s[i].marks > s[best].marks) best = i;\n    }\n    printf("%s\\n", s[best].name);\n    return 0;\n}',
        ["3\nasha 82\nravi 91\nmeena 77", "1\nkiran 50", "4\na 60\nb 90\nc 90\nd 10", "2\nsana 100\nomar 99", "5\ne1 10\ne2 20\ne3 30\ne4 40\ne5 50", "3\nx 0\ny 0\nz 0"], **C)

# ======================================================================================================
# Java track: students write Java (class Main, languages = ["java"]).
# ======================================================================================================
J = dict(track="Java", lang="java", languages=["java"])

problem("java-hello", "Hello from Java", "EASY", "Basics",
        "Print `Hello, Java!`. Remember that the class must be called `Main`.",
        "There is no input.", "Print `Hello, Java!`.", "None.",
        'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}',
        [""], samples=1, **J)

problem("java-rectangle-class", "Rectangle Class", "EASY", "Classes and objects",
        "Create a class `Rectangle` with fields `width` and `height`, a constructor, and methods `area()` and `perimeter()`. Read the two sides, build an object and print `Area: ...` and `Perimeter: ...` on two lines.",
        "One line with two integers `width height`.", "`Area: <value>` then `Perimeter: <value>`.", "1 <= width, height <= 10^4",
        'import java.util.*;\n\nclass Rectangle {\n    private final int width, height;\n    Rectangle(int width, int height) { this.width = width; this.height = height; }\n    int area() { return width * height; }\n    int perimeter() { return 2 * (width + height); }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        Rectangle r = new Rectangle(in.nextInt(), in.nextInt());\n        System.out.println("Area: " + r.area());\n        System.out.println("Perimeter: " + r.perimeter());\n    }\n}',
        ["3 4", "10 10", "1 1", "7 2", "100 250", "9999 1"], **J)

problem("java-palindrome-string", "Palindrome String", "EASY", "Strings",
        "Read a word. Print `Yes` if it reads the same forwards and backwards, ignoring upper and lower case, otherwise print `No`.",
        "One word without spaces.", "Print `Yes` or `No`.", "1 <= length <= 200",
        'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        String s = in.next().toLowerCase();\n        String r = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(r) ? "Yes" : "No");\n    }\n}',
        ["madam", "Level", "hello", "a", "Racecar", "abca"], **J)

problem("java-sort-descending", "Sort in Descending Order", "EASY", "Collections",
        "Read `n` integers into an `ArrayList` and print them sorted from largest to smallest, separated by spaces.",
        "First line `n`. Second line `n` integers.", "Print the sorted numbers on one line.", "1 <= n <= 1000",
        'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        List<Integer> a = new ArrayList<>();\n        for (int i = 0; i < n; i++) a.add(in.nextInt());\n        a.sort(Collections.reverseOrder());\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < n; i++) sb.append(i > 0 ? " " : "").append(a.get(i));\n        System.out.println(sb);\n    }\n}',
        [arr([3, 1, 4, 1, 5]), arr([9]), arr([-1, -5, 0, 8]), arr([2, 2, 2]), arr([10, 9, 8, 7, 6]), arr([100, -100, 50, -50, 0, 25])], **J)

problem("java-fibonacci-recursion", "Fibonacci by Recursion", "EASY", "Recursion",
        "Write a recursive method `fib(n)` and print the `n`-th Fibonacci number, where `fib(0) = 0` and `fib(1) = 1`.",
        "One integer `n`.", "Print `fib(n)`.", "0 <= n <= 30",
        'import java.util.*;\n\npublic class Main {\n    static int fib(int n) {\n        return n < 2 ? n : fib(n - 1) + fib(n - 2);\n    }\n\n    public static void main(String[] args) {\n        System.out.println(fib(new Scanner(System.in).nextInt()));\n    }\n}',
        ["0", "1", "6", "10", "20", "30"], **J)

problem("java-reverse-words", "Reverse the Words", "EASY", "Strings",
        "Read one line of words separated by single spaces and print the words in reverse order, still separated by single spaces. Use `String.split` and `StringBuilder`.",
        "One line of text.", "Print the words in reverse order.", "1 <= length <= 1000",
        'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        String[] w = in.nextLine().trim().split(" +");\n        StringBuilder sb = new StringBuilder();\n        for (int i = w.length - 1; i >= 0; i--) sb.append(w[i]).append(i > 0 ? " " : "");\n        System.out.println(sb);\n    }\n}',
        ["hello world", "one", "java is fun to learn", "a b c d e", "the quick brown fox", "NextByte code daily grow endlessly"], **J)

problem("java-shapes-polymorphism", "Shapes and Polymorphism", "MEDIUM", "Inheritance",
        "Define an abstract class `Shape` with an abstract method `area()` and subclasses `Circle` (radius), `Square` (side) and `Rectangle` (width, height). Read `q` shapes and print each one's area with two decimals, one per line. Use `Math.PI`.",
        "First line `q`. Then `q` lines: `circle r`, `square s` or `rectangle w h`.", "One area per line, two decimals.", "1 <= q <= 100, values are positive integers up to 1000",
        'import java.util.*;\n\nabstract class Shape {\n    abstract double area();\n}\n\nclass Circle extends Shape {\n    private final double r;\n    Circle(double r) { this.r = r; }\n    double area() { return Math.PI * r * r; }\n}\n\nclass Square extends Shape {\n    private final double s;\n    Square(double s) { this.s = s; }\n    double area() { return s * s; }\n}\n\nclass Rectangle extends Shape {\n    private final double w, h;\n    Rectangle(double w, double h) { this.w = w; this.h = h; }\n    double area() { return w * h; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int q = in.nextInt();\n        for (int i = 0; i < q; i++) {\n            String kind = in.next();\n            Shape s = kind.equals("circle") ? new Circle(in.nextInt()) : kind.equals("square") ? new Square(in.nextInt()) : new Rectangle(in.nextInt(), in.nextInt());\n            System.out.printf("%.2f%n", s.area());\n        }\n    }\n}',
        ["3\ncircle 1\nsquare 4\nrectangle 3 5", "1\ncircle 10", "2\nsquare 7\nsquare 1", "2\nrectangle 100 200\ncircle 3", "4\nsquare 2\ncircle 2\nrectangle 2 2\nsquare 3", "1\nrectangle 1 1"], **J)

# ======================================================================================================
# DSA track: data structures and algorithms, any language (the reference solution is Python).
# ======================================================================================================
D = dict(track="DSA")

problem("reverse-linked-list", "Reverse a Linked List", "EASY", "Linked lists",
        "A singly linked list is given by its values from head to tail. Reverse the list and print the values from the new head to the new tail.\n\nTry doing it by changing the `next` pointers instead of building a new list.",
        "First line `n`. Second line `n` integers.", "Print the reversed list, separated by spaces.", "1 <= n <= 10^5",
        "n = int(input())\nvalues = input().split()\nclass Node:\n    def __init__(self, v):\n        self.v, self.next = v, None\nhead = None\nfor v in reversed(values):\n    node = Node(v)\n    node.next = head\n    head = node\nprev = None\nwhile head:\n    nxt = head.next\n    head.next = prev\n    prev, head = head, nxt\nout = []\nwhile prev:\n    out.append(prev.v)\n    prev = prev.next\nprint(*out)",
        [arr([1, 2, 3, 4, 5]), arr([42]), arr([1, 2]), arr([9, 8, 7, 6]), arr(list(range(1, 16))), arr([5, 5, 1, 5])], **D)

problem("bst-inorder-traversal", "BST In-order Traversal", "MEDIUM", "Trees",
        "Insert the given values, in order, into an empty binary search tree (a value that is already present is ignored). Print the in-order traversal of the tree.",
        "First line `n`. Second line `n` integers.", "Print the in-order traversal separated by spaces.", "1 <= n <= 10^4",
        "import sys\nsys.setrecursionlimit(100000)\nn = int(input())\nvalues = list(map(int, input().split()))\nroot = None\nfor v in values:\n    if root is None:\n        root = [v, None, None]\n        continue\n    cur = root\n    while True:\n        if v == cur[0]:\n            break\n        side = 1 if v < cur[0] else 2\n        if cur[side] is None:\n            cur[side] = [v, None, None]\n            break\n        cur = cur[side]\nout = []\ndef walk(node):\n    if node:\n        walk(node[1]); out.append(node[0]); walk(node[2])\nwalk(root)\nprint(*out)",
        [arr([5, 3, 8, 1, 4]), arr([10]), arr([3, 3, 3]), arr([50, 30, 70, 20, 40, 60, 80]), arr([9, 7, 5, 3, 1]), arr([-4, 0, -9, 12, 7, 7])], **D)

problem("bfs-shortest-path", "Shortest Path in a Graph (BFS)", "MEDIUM", "Graphs",
        "An undirected, unweighted graph has `n` nodes numbered `1..n`. Print the minimum number of edges on a path from node `s` to node `t`, or `-1` if `t` cannot be reached.",
        "First line `n m`. Then `m` lines `u v` (an edge). Last line `s t`.", "Print the shortest distance, or `-1`.", "1 <= n <= 10^4, 0 <= m <= 5*10^4",
        "from collections import deque\nn, m = map(int, input().split())\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u, v = map(int, input().split())\n    g[u].append(v); g[v].append(u)\ns, t = map(int, input().split())\ndist = [-1] * (n + 1)\ndist[s] = 0\nq = deque([s])\nwhile q:\n    u = q.popleft()\n    for v in g[u]:\n        if dist[v] < 0:\n            dist[v] = dist[u] + 1\n            q.append(v)\nprint(dist[t])",
        ["5 5\n1 2\n2 3\n3 4\n4 5\n1 5\n1 4", "4 2\n1 2\n3 4\n1 4", "1 0\n1 1", "6 7\n1 2\n1 3\n2 4\n3 4\n4 5\n5 6\n2 6\n1 6", "3 3\n1 2\n2 3\n1 3\n3 1", "7 6\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n1 7"], **D)

problem("queue-using-two-stacks", "Queue Using Two Stacks", "MEDIUM", "Stacks and queues",
        "Simulate a first-in-first-out queue using only two stacks. Process the operations in order:\n- `push x` adds `x` to the back.\n- `pop` removes the front and prints it.\n- `front` prints the front without removing it.\n\nIf the queue is empty, `pop` and `front` print `EMPTY`.",
        "First line `q`. Then `q` operations.", "One line for every `pop` and `front`.", "1 <= q <= 10^5",
        "q = int(input())\nin_stack, out_stack = [], []\ndef shift():\n    if not out_stack:\n        while in_stack:\n            out_stack.append(in_stack.pop())\nfor _ in range(q):\n    parts = input().split()\n    if parts[0] == 'push':\n        in_stack.append(parts[1])\n    else:\n        shift()\n        if not out_stack:\n            print('EMPTY')\n        elif parts[0] == 'pop':\n            print(out_stack.pop())\n        else:\n            print(out_stack[-1])",
        ["7\npush 1\npush 2\nfront\npop\npush 3\npop\npop", "3\npop\nfront\npush 5", "5\npush 9\nfront\nfront\npop\npop", "8\npush 1\npush 2\npush 3\npop\npush 4\npop\npop\npop", "2\npush 7\npop", "6\npush 10\npush 20\npop\npop\npop\nfront"], **D)

problem("merge-intervals", "Merge Overlapping Intervals", "MEDIUM", "Sorting",
        "Given `n` intervals `[a, b]`, merge every group of overlapping intervals (intervals that only touch, like `[1,3]` and `[3,5]`, also merge). Print the merged intervals in increasing order, one per line as `a b`.",
        "First line `n`. Then `n` lines `a b` with `a <= b`.", "Print the merged intervals, one per line.", "1 <= n <= 10^5",
        "n = int(input())\nitems = sorted(tuple(map(int, input().split())) for _ in range(n))\nout = []\nfor a, b in items:\n    if out and a <= out[-1][1]:\n        out[-1][1] = max(out[-1][1], b)\n    else:\n        out.append([a, b])\nfor a, b in out:\n    print(a, b)",
        ["4\n1 3\n2 6\n8 10\n15 18", "1\n5 7", "2\n1 4\n4 5", "5\n6 8\n1 9\n2 4\n4 7\n10 12", "3\n1 2\n3 4\n5 6", "4\n-5 -1\n-3 2\n3 4\n4 9"], **D)

problem("top-k-frequent", "Top K Frequent Elements", "MEDIUM", "Hashing",
        "Given `n` integers and a number `k`, print the `k` values that occur most often. Order them by frequency (highest first); values with equal frequency are ordered by the smaller value first.",
        "First line `n`. Second line `n` integers. Third line `k`.", "Print `k` values separated by spaces.", "1 <= k <= number of distinct values <= n <= 10^5",
        "from collections import Counter\nn = int(input())\na = list(map(int, input().split()))\nk = int(input())\ncount = Counter(a)\nprint(*[v for v, _ in sorted(count.items(), key=lambda kv: (-kv[1], kv[0]))[:k]])",
        ["6\n1 1 1 2 2 3\n2", "1\n7\n1", "5\n4 4 5 5 6\n3", "8\n9 8 9 8 7 7 7 1\n2", "4\n3 1 2 3\n1", "10\n5 5 5 5 2 2 2 9 9 1\n3"], **D)

problem("detect-cycle-directed-graph", "Detect a Cycle in a Directed Graph", "HARD", "Graphs",
        "A directed graph has `n` nodes (`1..n`) and `m` edges `u -> v`. Print `Cycle` if the graph contains a directed cycle, otherwise print `No cycle`. (Hint: try Kahn's topological sort.)",
        "First line `n m`. Then `m` lines `u v`.", "Print `Cycle` or `No cycle`.", "1 <= n <= 10^5, 0 <= m <= 2*10^5",
        "from collections import deque\nn, m = map(int, input().split())\ng = [[] for _ in range(n + 1)]\nindeg = [0] * (n + 1)\nfor _ in range(m):\n    u, v = map(int, input().split())\n    g[u].append(v); indeg[v] += 1\nq = deque(i for i in range(1, n + 1) if indeg[i] == 0)\nseen = 0\nwhile q:\n    u = q.popleft(); seen += 1\n    for v in g[u]:\n        indeg[v] -= 1\n        if indeg[v] == 0:\n            q.append(v)\nprint('No cycle' if seen == n else 'Cycle')",
        ["3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n2 3\n3 4", "1 1\n1 1", "5 5\n1 2\n2 3\n3 4\n4 5\n2 5", "6 6\n1 2\n2 3\n3 1\n4 5\n5 6\n6 4", "2 0"], **D)

problem("next-greater-element", "Next Greater Element", "MEDIUM", "Stacks and queues",
        "For every element of an array, print the first element to its right that is strictly greater, or `-1` if there is none. A stack solves it in one pass.",
        "First line `n`. Second line `n` integers.", "Print `n` values separated by spaces.", "1 <= n <= 10^5",
        "n = int(input())\na = list(map(int, input().split()))\nres = [-1] * n\nstack = []\nfor i, x in enumerate(a):\n    while stack and a[stack[-1]] < x:\n        res[stack.pop()] = x\n    stack.append(i)\nprint(*res)",
        [arr([4, 5, 2, 25]), arr([1]), arr([5, 4, 3, 2, 1]), arr([1, 2, 3, 4, 5]), arr([2, 7, 3, 5, 4, 6, 8]), arr([3, 3, 3])], **D)

# ======================================================================================================
# SQL track: students write one SELECT query. stdin is a script that builds the tables; each result row is printed as
# values joined by "|" (decimals with two places). Datasets differ between test cases, so a query must be general.
# ======================================================================================================
S = dict(track="SQL", lang="sql", languages=["sql"])
EMP = "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER, hire_year INTEGER);\n"
SHOP = "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER, order_date TEXT);\n"
FIRST = ["Asha", "Ravi", "Meena", "Kiran", "Sana", "Omar", "Priya", "Dev", "Isha", "Neel", "Tara", "Zoya", "Arjun", "Lata", "Mohan"]
DEPTS = ["Engineering", "Sales", "HR", "Finance"]
CITIES = ["Hyderabad", "Chennai", "Pune", "Delhi"]


def employees(seed, count):
    rnd = random.Random(seed)
    names = rnd.sample(FIRST, count)
    rows = [f"({i}, '{names[i - 1]}', '{rnd.choice(DEPTS)}', {rnd.randrange(30, 120) * 1000}, {rnd.randrange(2016, 2025)})" for i in range(1, count + 1)]
    return EMP + "INSERT INTO employees VALUES\n" + ",\n".join(rows) + ";\n"


def shop(seed, customers, orders):
    rnd = random.Random(seed)
    names = rnd.sample(FIRST, customers)
    c_rows = [f"({i}, '{names[i - 1]}', '{rnd.choice(CITIES)}')" for i in range(1, customers + 1)]
    # the last customer never orders, so "customers without orders" always has an answer
    o_rows = [f"({i}, {rnd.randrange(1, customers)}, {rnd.randrange(1, 40) * 50}, '2026-0{rnd.randrange(1, 10)}-{rnd.randrange(10, 28)}')" for i in range(1, orders + 1)]
    return SHOP + "INSERT INTO customers VALUES\n" + ",\n".join(c_rows) + ";\nINSERT INTO orders VALUES\n" + ",\n".join(o_rows) + ";\n"


EMP_TABLE = "Table `employees(id, name, department, salary, hire_year)`."
SHOP_TABLE = "Tables `customers(id, name, city)` and `orders(id, customer_id, amount, order_date)`."
ESETS = [employees(1, 6), employees(2, 8), employees(3, 7), employees(4, 10), employees(8, 5), employees(6, 9)]
SSETS = [shop(1, 5, 8), shop(2, 6, 10), shop(3, 4, 6), shop(4, 7, 12), shop(5, 5, 9), shop(6, 6, 7)]

problem("sql-all-employees", "List the Employees", "EASY", "SELECT",
        f"{EMP_TABLE}\n\nWrite a query that returns the `name` and `salary` of every employee, ordered by `id`.",
        "The tables are created for you; write one SELECT query.", "Two columns: `name`, `salary`.", "Use a single SELECT statement.",
        "SELECT name, salary FROM employees ORDER BY id;", ESETS, **S)

problem("sql-high-salary", "High Earners", "EASY", "WHERE",
        f"{EMP_TABLE}\n\nReturn the `name` and `salary` of employees who earn **more than 50000**, highest salary first. Break ties by `name`.",
        "The tables are created for you; write one SELECT query.", "Two columns: `name`, `salary`.", "Use a single SELECT statement.",
        "SELECT name, salary FROM employees WHERE salary > 50000 ORDER BY salary DESC, name;", ESETS, **S)

problem("sql-top-three-paid", "Top Three Salaries", "EASY", "ORDER BY / LIMIT",
        f"{EMP_TABLE}\n\nReturn the `name` and `salary` of the three best-paid employees, highest salary first (ties by `name`).",
        "The tables are created for you; write one SELECT query.", "Two columns: `name`, `salary`.", "Use a single SELECT statement.",
        "SELECT name, salary FROM employees ORDER BY salary DESC, name LIMIT 3;", ESETS, **S)

problem("sql-hired-since-2020", "Recent Hires", "EASY", "WHERE",
        f"{EMP_TABLE}\n\nReturn the `name` and `hire_year` of everyone hired in **2020 or later**, ordered by `hire_year` and then `name`.",
        "The tables are created for you; write one SELECT query.", "Two columns: `name`, `hire_year`.", "Use a single SELECT statement.",
        "SELECT name, hire_year FROM employees WHERE hire_year >= 2020 ORDER BY hire_year, name;", ESETS, **S)

problem("sql-employees-per-department", "Headcount per Department", "MEDIUM", "GROUP BY",
        f"{EMP_TABLE}\n\nFor each department return its name and the number of employees in it, ordered by department name. Only departments that have employees appear.",
        "The tables are created for you; write one SELECT query.", "Two columns: `department`, the count.", "Use a single SELECT statement.",
        "SELECT department, COUNT(*) FROM employees GROUP BY department ORDER BY department;", ESETS, **S)

problem("sql-average-salary-by-department", "Departments Paying Above 50000", "MEDIUM", "GROUP BY / HAVING",
        f"{EMP_TABLE}\n\nReturn each department whose **average salary is above 50000**, with that average, ordered by department name. The average is shown with two decimals.",
        "The tables are created for you; write one SELECT query.", "Two columns: `department`, `AVG(salary)`.", "Use a single SELECT statement.",
        "SELECT department, AVG(salary) FROM employees GROUP BY department HAVING AVG(salary) > 50000 ORDER BY department;", ESETS, **S)

problem("sql-customer-order-totals", "Customer Order Totals", "MEDIUM", "JOIN",
        f"{SHOP_TABLE}\n\nReturn the name of every customer who has at least one order, with the **total amount** of their orders, ordered by name.",
        "The tables are created for you; write one SELECT query.", "Two columns: customer `name`, the total.", "Use a single SELECT statement.",
        "SELECT c.name, SUM(o.amount) FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name;", SSETS, **S)

problem("sql-customers-without-orders", "Customers Who Never Ordered", "MEDIUM", "LEFT JOIN",
        f"{SHOP_TABLE}\n\nReturn the `name` and `city` of every customer who has **no orders**, ordered by name.",
        "The tables are created for you; write one SELECT query.", "Two columns: `name`, `city`.", "Use a single SELECT statement.",
        "SELECT c.name, c.city FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.name;", SSETS, **S)

# ======================================================================================================
# HTML & CSS track: students write a page. Each test case is one check on the page (see judge/html-judge.py), so
# a partly finished page earns partly. Expected output is PASS for every check.
# ======================================================================================================
H = dict(track="HTML & CSS", lang="html", languages=["html"])


def checks(*items):
    return [json.dumps(item) for item in items]


def page(body, head="", style=""):
    css = f"<style>\n{style}\n</style>\n" if style else ""
    return f'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n{head}{css}</head>\n<body>\n{body}\n</body>\n</html>'


problem("html-first-page", "Your First Web Page", "EASY", "HTML basics",
        "Write a complete HTML page with:\n- `lang=\"en\"` on the `<html>` tag\n- a `<title>` containing **My First Page**\n- an `<h1>` that says **Welcome**\n- at least one `<p>` paragraph",
        "Write your page in the editor. It is checked, not run on input.", "The checks pass when the page has the parts above.", "Plain HTML only.",
        page("<h1>Welcome</h1>\n<p>This is my first page.</p>", "<title>My First Page</title>\n"),
        checks({"type": "exists", "selector": "html", "attrs": {"lang": True}, "label": "<html lang>"},
               {"type": "title", "text": "My First Page"},
               {"type": "exists", "selector": "h1", "text": "Welcome", "label": "an <h1> saying Welcome"},
               {"type": "exists", "selector": "p", "label": "a <p> paragraph"}), samples=2, **H)

problem("html-list-and-links", "Lists and Links", "EASY", "HTML basics",
        "Build a page with:\n- an unordered list (`<ul>`) with exactly **3** items (`<li>`)\n- a link `<a>` whose `href` is `https://example.com` and whose text contains **Visit**\n- an `<img>` with an `alt` attribute",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Plain HTML only.",
        page('<ul>\n  <li>Learn</li>\n  <li>Code</li>\n  <li>Prove</li>\n</ul>\n<a href="https://example.com">Visit our site</a>\n<img src="logo.png" alt="Logo">'),
        checks({"type": "exists", "selector": "ul > li", "count": 3, "label": "list items"},
               {"type": "exists", "selector": "a", "attrs": {"href": "https://example.com"}, "text": "Visit", "label": "a Visit link to https://example.com"},
               {"type": "exists", "selector": "img", "attrs": {"alt": True}, "label": "an <img> with alt text"}), samples=2, **H)

problem("html-table-basics", "A Marks Table", "EASY", "HTML tables",
        "Build a table with a header row and at least two data rows:\n- a `<table>` with a `<thead>` and a `<tbody>`\n- **3** header cells (`<th>`)\n- at least **2** rows (`<tr>`) inside `<tbody>`",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Plain HTML only.",
        page("<table>\n  <thead><tr><th>Name</th><th>Subject</th><th>Marks</th></tr></thead>\n  <tbody>\n    <tr><td>Asha</td><td>Java</td><td>88</td></tr>\n    <tr><td>Ravi</td><td>Python</td><td>92</td></tr>\n  </tbody>\n</table>"),
        checks({"type": "exists", "selector": "table", "label": "a <table>"},
               {"type": "exists", "selector": "thead", "label": "a <thead>"},
               {"type": "exists", "selector": "th", "count": 3, "label": "header cells"},
               {"type": "exists", "selector": "tbody > tr", "min": 2, "label": "rows in <tbody>"}), samples=2, **H)

problem("html-signup-form", "A Sign-up Form", "MEDIUM", "HTML forms",
        "Build a sign-up form with:\n- a `<form>`\n- an `<input type=\"email\">` and an `<input type=\"password\">`, both with a `name` attribute\n- at least **2** `<label>` elements\n- a `<button type=\"submit\">` that says **Sign up**",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Plain HTML only.",
        page('<form action="/signup" method="post">\n  <label>Email <input type="email" name="email" required></label>\n  <label>Password <input type="password" name="password" required></label>\n  <button type="submit">Sign up</button>\n</form>'),
        checks({"type": "exists", "selector": "form", "label": "a <form>"},
               {"type": "exists", "selector": "form input", "attrs": {"type": "email", "name": True}, "label": "an email input with a name"},
               {"type": "exists", "selector": "form input", "attrs": {"type": "password", "name": True}, "label": "a password input with a name"},
               {"type": "exists", "selector": "label", "min": 2, "label": "labels"},
               {"type": "exists", "selector": "button", "attrs": {"type": "submit"}, "text": "Sign up", "label": "a Sign up submit button"}), samples=2, **H)

problem("html-semantic-layout", "A Semantic Layout", "MEDIUM", "Semantic HTML",
        "Lay the page out with semantic tags: a `<header>`, a `<nav>` that contains at least **2** links, a `<main>` that contains an `<h1>`, and a `<footer>`.",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Plain HTML only.",
        page('<header><strong>NextByte</strong></header>\n<nav><a href="/">Home</a> <a href="/about">About</a></nav>\n<main><h1>Code daily</h1></main>\n<footer>Grow endlessly</footer>'),
        checks({"type": "exists", "selector": "header", "label": "a <header>"},
               {"type": "exists", "selector": "nav a", "min": 2, "label": "links inside <nav>"},
               {"type": "exists", "selector": "main h1", "label": "an <h1> inside <main>"},
               {"type": "exists", "selector": "footer", "label": "a <footer>"}), samples=2, **H)

problem("css-card-style", "Style a Card", "EASY", "CSS",
        "Add a `<style>` block that styles an element with the class `card`:\n- `display: flex;`\n- `padding: 16px;`\n- `border-radius: 8px;`\n- `background-color: white;` (any of `white`, `#fff` or `#ffffff`)\n\nAlso put a `<div class=\"card\">` in the page.",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Use a <style> block in the page.",
        page('<div class="card">Hello</div>', style=".card {\n  display: flex;\n  padding: 16px;\n  border-radius: 8px;\n  background-color: white;\n}"),
        checks({"type": "exists", "selector": "div.card", "label": "a <div class=\"card\">"},
               {"type": "css", "selector": ".card", "property": "display", "values": ["flex"]},
               {"type": "css", "selector": ".card", "property": "padding", "values": ["16px"]},
               {"type": "css", "selector": ".card", "property": "border-radius", "values": ["8px"]},
               {"type": "css", "selector": ".card", "property": "background-color", "values": ["white", "#fff", "#ffffff"]}), samples=2, **H)

problem("css-text-style", "Style the Text", "EASY", "CSS",
        "In a `<style>` block write these rules (and use those elements in the page):\n- `h1 { color: navy; }`\n- `p { font-size: 16px; }`\n- `a { text-decoration: none; }`\n- `body { margin: 0; }`",
        "Write your page in the editor.", "The checks pass when the page has the parts above.", "Use a <style> block in the page.",
        page('<h1>Title</h1>\n<p>Some text and a <a href="#">link</a>.</p>', style="h1 { color: navy; }\np { font-size: 16px; }\na { text-decoration: none; }\nbody { margin: 0; }"),
        checks({"type": "exists", "selector": "h1", "label": "an <h1>"},
               {"type": "css", "selector": "h1", "property": "color", "values": ["navy", "#000080"]},
               {"type": "css", "selector": "p", "property": "font-size", "values": ["16px"]},
               {"type": "css", "selector": "a", "property": "text-decoration", "values": ["none"]},
               {"type": "css", "selector": "body", "property": "margin", "values": ["0", "0px"]}), samples=2, **H)
