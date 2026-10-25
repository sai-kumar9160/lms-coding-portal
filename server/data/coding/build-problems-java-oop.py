# Java: object-oriented programming (50 problems). Every program reads a few values so the objects have something real to work on.
T = "OOP: classes and objects"
W3 = "One line: `name roll marks`."
jq("j-oop-student-class", "A Student Class", "EASY", T, "Define a class `Student` with fields `name`, `roll` and `marks` and a method `display()` that prints `<name> (roll <roll>) scored <marks>`. Read the values, make an object and call `display()`.", W3, "One line.", "name has no spaces",
   'Student s = new Student(name, roll, marks);\ns.display();', ["asha 1 82", "ravi 22 91", "k 3 0", "meena 100 77", "sana 5 100"], [("String", "name"), ("int", "roll marks")],
   classes='''class Student {
    String name;
    int roll, marks;
    Student(String name, int roll, int marks) {
        this.name = name;
        this.roll = roll;
        this.marks = marks;
    }
    void display() {
        System.out.println(name + " (roll " + roll + ") scored " + marks);
    }
}''')
jq("j-oop-default-constructor", "Default and Parameterised Constructors", "EASY", T, "Class `Car` has a default constructor (brand `Unknown`, year 0) and one taking `brand` and `year`. Read a brand and a year, make one car with each constructor and print `<brand> <year>` for the default car, then for the second.", "One line: `brand year`.", "Two lines.", "brand has no spaces",
   'Car a = new Car();\nCar b = new Car(brand, year);\nSystem.out.println(a.brand + " " + a.year);\nSystem.out.println(b.brand + " " + b.year);', ["Honda 2020", "Tata 1999", "X 0", "Maruti 2015", "Audi 2024"], [("String", "brand"), ("int", "year")],
   classes='''class Car {
    String brand;
    int year;
    Car() {
        brand = "Unknown";
        year = 0;
    }
    Car(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }
}''')
jq("j-oop-copy-constructor", "A Copy Constructor", "MEDIUM", T, "Class `Point` has a copy constructor. Read `x y`, make a point, copy it, add 10 to the copy's `x`, then print `Original: (x, y)` and `Copy: (x, y)`.", "One line: `x y`.", "Two lines.", "|values| <= 1000",
   'Point p = new Point(x, y);\nPoint q = new Point(p);\nq.x += 10;\nSystem.out.println("Original: " + p);\nSystem.out.println("Copy: " + q);', ["1 2", "0 0", "-5 7", "100 -100", "3 3"], [("int", "x y")],
   classes='''class Point {
    int x, y;
    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    Point(Point other) {
        this.x = other.x;
        this.y = other.y;
    }
    public String toString() {
        return "(" + x + ", " + y + ")";
    }
}''')
jq("j-oop-method-overloading", "Method Overloading", "EASY", T, "Write three `compute` methods: `compute(int, int)` returns the sum, `compute(double, double)` returns the quotient, `compute(int, int, int)` returns the product. Read `a b c` and print `int: <compute(a, b)>`, `double: <compute((double) a, (double) b)>` (two decimals) and `three: <compute(a, b, c)>`.", "One line with three integers (`b` is not 0).", "Three lines.", "|values| <= 1000, b != 0",
   'System.out.println("int: " + compute(a, b));\nSystem.out.printf("double: %.2f%n", compute((double) a, (double) b));\nSystem.out.println("three: " + compute(a, b, c));', ["6 3 2", "7 2 5", "-4 5 1", "10 10 10", "1 1 1"], [("int", "a b c")],
   members='''static int compute(int a, int b) {
    return a + b;
}
static double compute(double a, double b) {
    return a / b;
}
static int compute(int a, int b, int c) {
    return a * b * c;
}''')
jq("j-oop-constructor-overloading", "Constructor Overloading", "EASY", T, "Class `Book` has three constructors: `Book(title)`, `Book(title, author)` and `Book(title, author, price)`; missing values are `Unknown` and `0`. Read `title author price` and print a line `title / author / price` for each of the three books, in that order.", "One line: `title author price`.", "Three lines.", "No spaces inside words",
   'System.out.println(new Book(t));\nSystem.out.println(new Book(t, a));\nSystem.out.println(new Book(t, a, p));', ["Java Gosling 450", "C Ritchie 300", "Python Guido 0", "Go Pike 250", "Rust Graydon 999"], [("String", "t a"), ("int", "p")],
   classes='''class Book {
    String title, author;
    int price;
    Book(String title) {
        this(title, "Unknown", 0);
    }
    Book(String title, String author) {
        this(title, author, 0);
    }
    Book(String title, String author, int price) {
        this.title = title;
        this.author = author;
        this.price = price;
    }
    public String toString() {
        return title + " / " + author + " / " + price;
    }
}''')
jq("j-oop-this-keyword", "The this Keyword", "EASY", T, "In class `Box` the constructor parameter `side` has the same name as the field, so `this.side` is the field. Read `side`, make a box and print `Volume: <side^3>`.", "One integer.", "One line.", "1 <= side <= 1000",
   'Box b = new Box(side);\nSystem.out.println("Volume: " + b.volume());', ["3", "1", "10", "100", "7"], [("int", "side")],
   classes='''class Box {
    int side;
    Box(int side) {
        this.side = side;
    }
    long volume() {
        return (long) side * side * side;
    }
}''')
jq("j-oop-this-chaining", "Constructor Chaining with this()", "MEDIUM", T, "`Rect()` makes a 1 x 1 rectangle, `Rect(w)` a square `w x w`, and `Rect(w, h)` the general one; the first two call `this(...)`. Read `w h` and print the area of the three rectangles on three lines (default, square of `w`, `w x h`).", "One line: `w h`.", "Three lines.", "1 <= w, h <= 1000",
   'System.out.println(new Rect().area());\nSystem.out.println(new Rect(w).area());\nSystem.out.println(new Rect(w, h).area());', ["3 4", "1 1", "10 2", "7 7", "100 5"], [("int", "w h")],
   classes='''class Rect {
    int w, h;
    Rect() {
        this(1);
    }
    Rect(int w) {
        this(w, w);
    }
    Rect(int w, int h) {
        this.w = w;
        this.h = h;
    }
    int area() {
        return w * h;
    }
}''')
jq("j-oop-static-members", "Static Variables and Methods", "MEDIUM", T, "Class `Counter` has a `static int count` that grows each time an object is made and a static method `total()`. Read `n`, make `n` objects and print `Objects: <total()>`.", "One integer.", "One line.", "0 <= n <= 1000",
   'for (int i = 0; i < n; i++) new Counter();\nSystem.out.println("Objects: " + Counter.total());', ["3", "0", "1", "10", "500"], [("int", "n")],
   classes='''class Counter {
    private static int count = 0;
    Counter() {
        count++;
    }
    static int total() {
        return count;
    }
}''')
jq("j-oop-static-block", "A Static Initialisation Block", "MEDIUM", T, "A `static { }` block runs once when the class loads. In class `Table` the block fills `int[] squares` with the squares of 0 to 5 and sets `label`. Read `k` (0 to 5) and print `<label>: <squares[k]>`.", "One integer 0 to 5.", "One line.", "0 <= k <= 5",
   'System.out.println(Table.label + ": " + Table.squares[k]);', ["0", "3", "5", "2", "4"], [("int", "k")],
   classes='''class Table {
    static int[] squares = new int[6];
    static String label;
    static {
        for (int i = 0; i < squares.length; i++) squares[i] = i * i;
        label = "Square";
    }
}''')
jq("j-oop-final-keyword", "The final Keyword", "MEDIUM", T, "A `final` variable cannot change, a `final` method cannot be overridden and a `final` class cannot be extended. Read a radius `r`, compute the area with a `final double PI = 3.14159`, and print `Area: <area>` (two decimals), then `Final method: <text>` from a final method of final class `Info` that returns `locked`.", "One decimal: radius.", "Two lines.", "0 <= r <= 1000",
   'final double PI = 3.14159;\nSystem.out.printf("Area: %.2f%n", PI * r * r);\nSystem.out.println("Final method: " + new Info().status());', ["1", "2.5", "0", "10", "7.25"], [("double", "r")],
   classes='''final class Info {
    final String status() {
        return "locked";
    }
}''')
jq("j-oop-encapsulation", "Encapsulation: a Bank Account", "MEDIUM", T, "Class `BankAccount` keeps `balance` private and changes it only through `deposit` and `withdraw`. A deposit or withdrawal of 0 or less is rejected, and so is a withdrawal above the balance. Read `n` commands `D amount` or `W amount`; print `Rejected` for each bad one. At the end print `Balance: <balance>`.", "First line `n`, then `n` commands.", "`Rejected` lines then the balance.", "1 <= n <= 100",
   'BankAccount acc = new BankAccount();\nwhile (n-- > 0) {\n    char op = in.next().charAt(0);\n    int amount = in.nextInt();\n    boolean ok = op == \'D\' ? acc.deposit(amount) : acc.withdraw(amount);\n    if (!ok) System.out.println("Rejected");\n}\nSystem.out.println("Balance: " + acc.getBalance());', ["3\nD 500\nW 200\nW 1000", "1\nD 0", "2\nW 5\nD 5", "4\nD 100\nD 100\nW 50\nW 150", "1\nD 7"], [("int", "n")],
   classes='''class BankAccount {
    private int balance;
    boolean deposit(int amount) {
        if (amount <= 0) return false;
        balance += amount;
        return true;
    }
    boolean withdraw(int amount) {
        if (amount <= 0 || amount > balance) return false;
        balance -= amount;
        return true;
    }
    int getBalance() {
        return balance;
    }
}''')
jq("j-oop-static-utility", "A Static Utility Class", "EASY", T, "Write class `MathUtil` with static methods `max(a, b)`, `isPrime(n)` and `factorial(n)`. Read `a b` and print `max: <max>`, `isPrime(a): <true/false>` and `factorial(b): <b!>` (b is 0 to 15).", "One line: `a b`.", "Three lines.", "1 <= a <= 10^6, 0 <= b <= 15",
   'System.out.println("max: " + MathUtil.max(a, b));\nSystem.out.println("isPrime(a): " + MathUtil.isPrime(a));\nSystem.out.println("factorial(b): " + MathUtil.factorial(b));', ["7 5", "1 0", "100 10", "13 15", "2 1"], [("int", "a b")],
   classes='''class MathUtil {
    static int max(int a, int b) {
        return a > b ? a : b;
    }
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (long i = 2; i * i <= n; i++) if (n % i == 0) return false;
        return true;
    }
    static long factorial(int n) {
        long f = 1;
        for (int i = 2; i <= n; i++) f *= i;
        return f;
    }
}''')
jq("j-oop-object-argument", "Objects as Arguments", "MEDIUM", T, "Write `static Rect larger(Rect a, Rect b)` that returns the rectangle with the bigger area (the first if equal). Read `w1 h1 w2 h2` and print `Larger: <w> x <h>`.", "One line: `w1 h1 w2 h2`.", "One line.", "1 <= values <= 1000",
   'Rect r = larger(new Rect(w1, h1), new Rect(w2, h2));\nSystem.out.println("Larger: " + r.w + " x " + r.h);', ["2 3 4 5", "5 5 5 5", "10 1 3 3", "1 1 1 2", "7 8 8 7"], [("int", "w1 h1 w2 h2")],
   classes='''class Rect {
    int w, h;
    Rect(int w, int h) {
        this.w = w;
        this.h = h;
    }
    int area() {
        return w * h;
    }
}''', members='''static Rect larger(Rect a, Rect b) {
    return b.area() > a.area() ? b : a;
}''')
jq("j-oop-time-class", "Adding Two Times", "MEDIUM", T, "Class `Time` holds hours and minutes. Its method `add(Time other)` returns a new `Time` with minutes carried into hours. Read `h1 m1 h2 m2` (minutes below 60) and print the sum as `HH:MM` (two digits each; hours may exceed 23).", "One line: `h1 m1 h2 m2`.", "One line.", "0 <= m < 60",
   'Time t = new Time(h1, m1).add(new Time(h2, m2));\nSystem.out.printf("%02d:%02d%n", t.h, t.m);', ["1 30 2 45", "0 0 0 0", "10 59 0 1", "23 59 23 59", "5 5 5 5"], [("int", "h1 m1 h2 m2")],
   classes='''class Time {
    int h, m;
    Time(int h, int m) {
        this.h = h;
        this.m = m;
    }
    Time add(Time o) {
        int total = (h + o.h) * 60 + m + o.m;
        return new Time(total / 60, total % 60);
    }
}''')
jq("j-oop-complex-numbers", "Complex Number Arithmetic", "MEDIUM", T, "Class `Complex` has `add` and `multiply`. Read `a b c d` for `(a + bi)` and `(c + di)` and print `Sum: <re> + <im>i` and `Product: <re> + <im>i` (a negative imaginary part prints like `3 + -2i`).", "One line: `a b c d`.", "Two lines.", "|values| <= 1000",
   'Complex x = new Complex(a, b), y = new Complex(c, d);\nSystem.out.println("Sum: " + x.add(y));\nSystem.out.println("Product: " + x.multiply(y));', ["1 2 3 4", "0 0 1 1", "-1 -2 1 2", "5 0 0 5", "2 3 2 3"], [("int", "a b c d")],
   classes='''class Complex {
    int re, im;
    Complex(int re, int im) {
        this.re = re;
        this.im = im;
    }
    Complex add(Complex o) {
        return new Complex(re + o.re, im + o.im);
    }
    Complex multiply(Complex o) {
        return new Complex(re * o.re - im * o.im, re * o.im + im * o.re);
    }
    public String toString() {
        return re + " + " + im + "i";
    }
}''')

T = "OOP: inheritance and polymorphism"
jq("j-oop-single-inheritance", "Single Inheritance", "EASY", T, "`Dog` extends `Animal`. `Animal` has `eat()` printing `<name> eats` and `Dog` adds `bark()` printing `<name> barks`. Read a name, make a `Dog` and call both methods.", "One word: the name.", "Two lines.", "No spaces",
   'Dog d = new Dog(name);\nd.eat();\nd.bark();', ["Rex", "Tommy", "A", "Buddy", "Max"], [("String", "name")],
   classes='''class Animal {
    String name;
    Animal(String name) {
        this.name = name;
    }
    void eat() {
        System.out.println(name + " eats");
    }
}

class Dog extends Animal {
    Dog(String name) {
        super(name);
    }
    void bark() {
        System.out.println(name + " barks");
    }
}''')
jq("j-oop-multilevel-inheritance", "Multilevel Inheritance", "EASY", T, "`Grandparent` -> `Parent` -> `Child`, each adding one method (`g()`, `p()`, `c()`) that prints `Grandparent`, `Parent` or `Child` followed by the given word. Read a word `w` and call all three methods on a `Child`: lines `Grandparent <w>`, `Parent <w>`, `Child <w>`.", "One word.", "Three lines.", "No spaces",
   'Child c = new Child();\nc.g(w);\nc.p(w);\nc.c(w);', ["hello", "x", "Java", "OOP", "123"], [("String", "w")],
   classes='''class Grandparent {
    void g(String w) {
        System.out.println("Grandparent " + w);
    }
}

class Parent extends Grandparent {
    void p(String w) {
        System.out.println("Parent " + w);
    }
}

class Child extends Parent {
    void c(String w) {
        System.out.println("Child " + w);
    }
}''')
jq("j-oop-hierarchical-inheritance", "Hierarchical Inheritance", "EASY", T, "`Circle` and `Square` both extend `Shape`, which stores a `name` and a method `describe()` printing `<name> area <area>` (area has two decimals and comes from the abstract-looking method `area()`). Read `r s` and describe a circle (use `Math.PI`) then a square.", "One line: `r s` (decimals).", "Two lines.", "Positive decimals",
   'new Circle(r).describe();\nnew Square(s).describe();', ["1 2", "2.5 4", "10 10", "0.5 0.25", "7 3"], [("double", "r s")],
   classes='''class Shape {
    String name;
    Shape(String name) {
        this.name = name;
    }
    double area() {
        return 0;
    }
    void describe() {
        System.out.printf("%s area %.2f%n", name, area());
    }
}

class Circle extends Shape {
    double r;
    Circle(double r) {
        super("Circle");
        this.r = r;
    }
    double area() {
        return Math.PI * r * r;
    }
}

class Square extends Shape {
    double s;
    Square(double s) {
        super("Square");
        this.s = s;
    }
    double area() {
        return s * s;
    }
}''')
jq("j-oop-super-keyword", "The super Keyword", "MEDIUM", T, "`Employee` has a constructor taking `name` and a method `info()` returning `Employee <name>`. `Manager extends Employee`: its constructor calls `super(name)` and its `info()` returns `super.info()` followed by ` (manager of <team> people)`. Read `name team` and print the manager's `info()`.", "One line: `name team`.", "One line.", "name has no spaces",
   'System.out.println(new Manager(name, team).info());', ["Asha 5", "Ravi 12", "K 0", "Meena 3", "Sana 100"], [("String", "name"), ("int", "team")],
   classes='''class Employee {
    String name;
    Employee(String name) {
        this.name = name;
    }
    String info() {
        return "Employee " + name;
    }
}

class Manager extends Employee {
    int team;
    Manager(String name, int team) {
        super(name);
        this.team = team;
    }
    String info() {
        return super.info() + " (manager of " + team + " people)";
    }
}''')
jq("j-oop-runtime-polymorphism", "Method Overriding", "MEDIUM", T, "`Animal.sound()` prints `...`; `Dog` prints `Woof`, `Cat` prints `Meow`. Read `n` and then `n` words (`dog`, `cat` or anything else); put the matching object in an `Animal` array and call `sound()` on each, so the right version runs at run time.", "First line `n`, then `n` words.", "`n` lines.", "1 <= n <= 100",
   'Animal[] zoo = new Animal[n];\nfor (int i = 0; i < n; i++) {\n    String kind = in.next();\n    zoo[i] = kind.equals("dog") ? new Dog() : kind.equals("cat") ? new Cat() : new Animal();\n}\nfor (Animal a : zoo) a.sound();', ["3\ndog cat dog", "1\ncow", "2\ncat cat", "4\ndog dog cat bird", "1\ndog"], [("int", "n")],
   classes='''class Animal {
    void sound() {
        System.out.println("...");
    }
}

class Dog extends Animal {
    void sound() {
        System.out.println("Woof");
    }
}

class Cat extends Animal {
    void sound() {
        System.out.println("Meow");
    }
}''')
jq("j-oop-compile-time-polymorphism", "Overload Resolution", "EASY", T, "Three `show` methods take an `int`, a `double` and a `String`. Read an integer, a decimal and a word and call `show` on each. The compiler picks the version by the argument type. Print `int: <i>`, `double: <d>`, `String: <s>`.", "One line: `int decimal word`.", "Three lines.", "No spaces inside the word",
   'show(i);\nshow(d);\nshow(s);', ["5 2.5 hi", "-1 0.5 x", "0 0 zero", "100 3.14 pi", "7 7.0 seven"], [("int", "i"), ("double", "d"), ("String", "s")],
   members='''static void show(int x) {
    System.out.println("int: " + x);
}
static void show(double x) {
    System.out.println("double: " + x);
}
static void show(String x) {
    System.out.println("String: " + x);
}''')
jq("j-oop-abstract-class", "An Abstract Class", "MEDIUM", T, "Abstract class `Shape` declares `abstract void draw()`. `Circle`, `Square` and `Triangle` implement it by printing `Drawing a circle`, `Drawing a square`, `Drawing a triangle`. Read `n` and `n` words and draw each shape (an unknown word prints `Unknown shape`).", "First line `n`, then `n` words.", "`n` lines.", "1 <= n <= 100",
   'for (int i = 0; i < n; i++) {\n    String kind = in.next();\n    Shape s = kind.equals("circle") ? new Circle() : kind.equals("square") ? new Square() : kind.equals("triangle") ? new Triangle() : null;\n    if (s == null) System.out.println("Unknown shape");\n    else s.draw();\n}', ["3\ncircle square triangle", "1\nhexagon", "2\ncircle circle", "4\nsquare x triangle circle", "1\ntriangle"], [("int", "n")],
   classes='''abstract class Shape {
    abstract void draw();
}

class Circle extends Shape {
    void draw() {
        System.out.println("Drawing a circle");
    }
}

class Square extends Shape {
    void draw() {
        System.out.println("Drawing a square");
    }
}

class Triangle extends Shape {
    void draw() {
        System.out.println("Drawing a triangle");
    }
}''')
jq("j-oop-constructor-order", "Constructor Order", "MEDIUM", T, "When a subclass object is made, the parent constructor runs first. `A`'s constructor prints `A:<tag>`, `B extends A` prints `B:<tag>`, `C extends B` prints `C:<tag>`. Read a tag word and create `new C(tag)`.", "One word.", "Three lines in the order A, B, C.", "No spaces",
   'new C(tag);', ["x", "go", "123", "tag", "Z"], [("String", "tag")],
   classes='''class A {
    A(String tag) {
        System.out.println("A:" + tag);
    }
}

class B extends A {
    B(String tag) {
        super(tag);
        System.out.println("B:" + tag);
    }
}

class C extends B {
    C(String tag) {
        super(tag);
        System.out.println("C:" + tag);
    }
}''')
jq("j-oop-multiple-interfaces", "Multiple Interfaces", "MEDIUM", T, "`Duck` implements both `Flyable` (`fly()`) and `Swimmable` (`swim()`). Read a name and print `<name> flies` and `<name> swims` using the two interface methods.", "One word.", "Two lines.", "No spaces",
   'Duck d = new Duck(name);\nd.fly();\nd.swim();', ["Donald", "Daffy", "X", "Quack", "Duck1"], [("String", "name")],
   classes='''interface Flyable {
    void fly();
}

interface Swimmable {
    void swim();
}

class Duck implements Flyable, Swimmable {
    String name;
    Duck(String name) {
        this.name = name;
    }
    public void fly() {
        System.out.println(name + " flies");
    }
    public void swim() {
        System.out.println(name + " swims");
    }
}''')
jq("j-oop-interface-default-static", "Default and Static Interface Methods", "MEDIUM", T, "Interface `Greeter` has an abstract `name()`, a default method `greet()` returning `Hello, <name>!` and a static method `shout(text)` returning the text in capitals. Read a name, implement `Greeter` in a small class, print `greet()` and then `Greeter.shout(name)`.", "One word.", "Two lines.", "No spaces",
   'Greeter g = () -> name;\nSystem.out.println(g.greet());\nSystem.out.println(Greeter.shout(name));', ["asha", "Ravi", "k", "meena", "SANA"], [("String", "name")],
   classes='''interface Greeter {
    String name();
    default String greet() {
        return "Hello, " + name() + "!";
    }
    static String shout(String text) {
        return text.toUpperCase();
    }
}''')
jq("j-oop-interface-inheritance", "Interface Inheritance", "MEDIUM", T, "`Printer extends Scanner2` (an interface that extends another). `Scanner2` has `scan()` returning `Scanning <doc>` and `Printer` adds `print()` returning `Printing <doc>`. A class `Machine` implements `Printer`. Read a document word and print the results of `scan()` and `print()`.", "One word.", "Two lines.", "No spaces",
   'Machine m = new Machine(doc);\nSystem.out.println(m.scan());\nSystem.out.println(m.print());', ["report", "a", "notes", "invoice", "x1"], [("String", "doc")],
   classes='''interface Scanner2 {
    String scan();
}

interface Printer extends Scanner2 {
    String print();
}

class Machine implements Printer {
    String doc;
    Machine(String doc) {
        this.doc = doc;
    }
    public String scan() {
        return "Scanning " + doc;
    }
    public String print() {
        return "Printing " + doc;
    }
}''')
jq("j-oop-loose-coupling", "Loose Coupling with an Interface", "MEDIUM", T, "`Checkout` depends only on the interface `Payment`. `Card` charges `amount + 2` and `Upi` charges `amount`; each prints `<kind> paid <charged>`. Read `kind amount` (`card` or `upi`) and pay through a `Payment` reference.", "One line: `kind amount`.", "One line.", "kind is card or upi",
   'Payment p = kind.equals("card") ? new Card() : new Upi();\np.pay(amount);', ["card 100", "upi 100", "card 0", "upi 55", "card 998"], [("String", "kind"), ("int", "amount")],
   classes='''interface Payment {
    void pay(int amount);
}

class Card implements Payment {
    public void pay(int amount) {
        System.out.println("Card paid " + (amount + 2));
    }
}

class Upi implements Payment {
    public void pay(int amount) {
        System.out.println("UPI paid " + amount);
    }
}''')
jq("j-oop-diamond-problem", "The Diamond Problem", "HARD", T, "Interfaces `A` and `B` both have a default method `hello()`. Class `C` implements both, so it must override `hello()`; it chooses `A`'s version with `A.super.hello()`. `A.hello()` returns `Hello from A`, `B.hello()` returns `Hello from B`. Read a word and print `C says: ` followed by `A`'s message and the word `<w>`.", "One word.", "One line.", "No spaces",
   'System.out.println("C says: " + new C().hello() + " " + w);', ["x", "world", "Java", "ok", "1"], [("String", "w")],
   classes='''interface A {
    default String hello() {
        return "Hello from A";
    }
}

interface B {
    default String hello() {
        return "Hello from B";
    }
}

class C implements A, B {
    public String hello() {
        return A.super.hello();
    }
}''')
jq("j-oop-immutable-class", "An Immutable Class", "MEDIUM", T, "`Person` has `final` fields and no setters; `withAge(age)` returns a **new** `Person`. Read `name age newAge`, make the person, make an older copy with `withAge` and print `<name> <age>` for the original and then the copy.", "One line: `name age newAge`.", "Two lines.", "name has no spaces",
   'Person p = new Person(name, age);\nPerson q = p.withAge(newAge);\nSystem.out.println(p.getName() + " " + p.getAge());\nSystem.out.println(q.getName() + " " + q.getAge());', ["Asha 20 21", "Ravi 30 40", "K 1 2", "Meena 50 50", "Sana 0 99"], [("String", "name"), ("int", "age newAge")],
   classes='''final class Person {
    private final String name;
    private final int age;
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    String getName() {
        return name;
    }
    int getAge() {
        return age;
    }
    Person withAge(int newAge) {
        return new Person(name, newAge);
    }
}''')
jq("j-oop-instanceof-casting", "instanceof and Casting", "MEDIUM", T, "`Dog` and `Cat` extend `Pet`. Read `n` words (`dog` or `cat`) and keep the objects as `Pet`. For each, use `instanceof` and a downcast: a dog prints `Dog fetches`, a cat prints `Cat purrs`. Finally print `Dogs: <count>`.", "First line `n`, then `n` words.", "`n` lines then a count.", "1 <= n <= 100",
   'int dogs = 0;\nfor (int i = 0; i < n; i++) {\n    Pet p = in.next().equals("dog") ? new Dog() : new Cat();\n    if (p instanceof Dog) {\n        Dog d = (Dog) p;\n        System.out.println(d.fetch());\n        dogs++;\n    } else if (p instanceof Cat) {\n        System.out.println(((Cat) p).purr());\n    }\n}\nSystem.out.println("Dogs: " + dogs);', ["3\ndog cat dog", "1\ncat", "2\ndog dog", "4\ncat cat dog cat", "1\ndog"], [("int", "n")],
   classes='''class Pet {
}

class Dog extends Pet {
    String fetch() {
        return "Dog fetches";
    }
}

class Cat extends Pet {
    String purr() {
        return "Cat purrs";
    }
}''')
jq("j-oop-using-packages", "Using Library Packages", "EASY", T, "Classes live in packages and are brought in with `import`. Use `java.time.LocalDate` to print the date `n` days after a given date, as `yyyy-MM-dd`.", "One line: `year month day n`.", "One date.", "Valid dates, 0 <= n <= 10000",
   'LocalDate d = LocalDate.of(y, m, day).plusDays(n);\nSystem.out.println(d);', ["2024 2 28 2", "2023 12 31 1", "2000 1 1 0", "2024 1 1 366", "1999 12 31 10000"], [("int", "y m day n")], imports="java.time.LocalDate")
jq("j-oop-access-modifiers", "Access Modifiers", "MEDIUM", T, "`Base` has a `public`, a `protected`, a package-private and a `private` field. A subclass `Derived` can reach the first three (but not the private one without a getter). Read an integer `v`; `Base` sets all four fields to `v`, `v + 1`, `v + 2`, `v + 3`. Print `public <a>`, `protected <b>`, `default <c>` and `private <d>` (the last through a getter).", "One integer.", "Four lines.", "|v| <= 1000",
   'Derived d = new Derived(v);\nSystem.out.println(d.show());', ["1", "0", "-5", "100", "7"], [("int", "v")],
   classes='''class Base {
    public int a;
    protected int b;
    int c;
    private int d;
    Base(int v) {
        a = v;
        b = v + 1;
        c = v + 2;
        d = v + 3;
    }
    int getD() {
        return d;
    }
}

class Derived extends Base {
    Derived(int v) {
        super(v);
    }
    String show() {
        return "public " + a + "\\nprotected " + b + "\\ndefault " + c + "\\nprivate " + getD();
    }
}''')

T = "OOP: nested classes and patterns"
jq("j-oop-inner-class", "A Non-Static Inner Class", "MEDIUM", T, "`Outer` has a private field `secret`. Its inner class `Peek` can read it. Read `n`, make `Outer(n)`, create a `Peek` through the outer object and print `Secret: <n * 2>` (the inner class returns twice the secret).", "One integer.", "One line.", "|n| <= 10^6",
   'Outer o = new Outer(n);\nOuter.Peek p = o.new Peek();\nSystem.out.println("Secret: " + p.doubled());', ["5", "0", "-3", "1000000", "21"], [("int", "n")],
   classes='''class Outer {
    private int secret;
    Outer(int secret) {
        this.secret = secret;
    }
    class Peek {
        int doubled() {
            return secret * 2;
        }
    }
}''')
jq("j-oop-static-nested", "A Static Nested Class", "MEDIUM", T, "`Outer.Point` is a `static` nested class: it needs no `Outer` object. Read `x y`, make an `Outer.Point` and print its distance from the origin as `Distance: <d>` (two decimals).", "One line: `x y`.", "One line.", "|values| <= 1000",
   'Outer.Point p = new Outer.Point(x, y);\nSystem.out.printf("Distance: %.2f%n", p.distance());', ["3 4", "0 0", "1 1", "-6 8", "5 12"], [("int", "x y")],
   classes='''class Outer {
    static class Point {
        int x, y;
        Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
        double distance() {
            return Math.sqrt(x * x + y * y);
        }
    }
}''')
jq("j-oop-local-inner-class", "A Class Inside a Method", "MEDIUM", T, "Inside a static method `sumTo(n)` define a local class `Adder` with a method `add(i)` and use it to add up `1` to `n`. Read `n` and print `Sum: <sum>`.", "One integer.", "One line.", "0 <= n <= 10^5",
   'System.out.println("Sum: " + sumTo(n));', ["10", "0", "1", "100", "100000"], [("int", "n")],
   members='''static long sumTo(int n) {
    class Adder {
        long total = 0;
        void add(int i) {
            total += i;
        }
    }
    Adder a = new Adder();
    for (int i = 1; i <= n; i++) a.add(i);
    return a.total;
}''')
jq("j-oop-anonymous-class", "An Anonymous Class", "MEDIUM", T, "Interface `Greeting` has `String say(String name)`. Implement it with an anonymous class (`new Greeting() { ... }`) that returns `Good day, <name>`. Read a name and print the result.", "One word.", "One line.", "No spaces",
   'Greeting g = new Greeting() {\n    public String say(String who) {\n        return "Good day, " + who;\n    }\n};\nSystem.out.println(g.say(name));', ["Asha", "Ravi", "K", "Meena", "Sana"], [("String", "name")],
   classes='''interface Greeting {
    String say(String name);
}''')
jq("j-oop-lambda-functional", "A Functional Interface and Lambdas", "MEDIUM", T, "Interface `MathOp` has one method `int apply(int a, int b)` (annotated `@FunctionalInterface`). Read `a b` and use lambdas to print `add: <a + b>`, `multiply: <a * b>` and `max: <larger>`.", "One line: `a b`.", "Three lines.", "|values| <= 1000",
   'MathOp add = (x, y) -> x + y;\nMathOp mul = (x, y) -> x * y;\nMathOp max = (x, y) -> x > y ? x : y;\nSystem.out.println("add: " + add.apply(a, b));\nSystem.out.println("multiply: " + mul.apply(a, b));\nSystem.out.println("max: " + max.apply(a, b));', ["3 4", "-2 5", "0 0", "10 10", "7 -7"], [("int", "a b")],
   classes='''@FunctionalInterface
interface MathOp {
    int apply(int a, int b);
}''')
jq("j-oop-custom-annotation", "A Custom Annotation", "HARD", T, "Define a runtime annotation `@Info(author, version)` and put it on class `Report` (`author = \"asha\"`, `version = 3`). Read the annotation back with reflection and print `Author: asha` and `Version: 3`.", "There is no input.", "Two lines.", "None.",
   'Info info = Report.class.getAnnotation(Info.class);\nSystem.out.println("Author: " + info.author());\nSystem.out.println("Version: " + info.version());', [""], (), imports="java.lang.annotation.*", samples=1,
   classes='''@Retention(RetentionPolicy.RUNTIME)
@interface Info {
    String author();
    int version();
}

@Info(author = "asha", version = 3)
class Report {
}''')
jq("j-oop-clone-shallow", "Shallow Copy with clone()", "HARD", T, "`Box implements Cloneable` and holds an `int[] items`. `clone()` makes a shallow copy: the array is **shared**. Read `a b`, make a box with items `{a, b}`, clone it, set `items[0] = 99` through the clone and print the original's items as `<x> <y>`.", "One line: `a b`.", "One line.", "|values| <= 1000",
   'Box one = new Box(a, b);\nBox two = (Box) one.clone();\ntwo.items[0] = 99;\nSystem.out.println(one.items[0] + " " + one.items[1]);', ["1 2", "5 6", "0 0", "-1 -2", "100 200"], [("int", "a b")],
   classes='''class Box implements Cloneable {
    int[] items;
    Box(int a, int b) {
        items = new int[] {a, b};
    }
    protected Object clone() {
        try {
            return super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(e);
        }
    }
}''')
jq("j-oop-deep-copy", "Deep Copy", "HARD", T, "Make `clone()` copy the array too (`items.clone()`), so the copy is independent. Read `a b`, clone a box with items `{a, b}`, set `items[0] = 99` on the clone and print the original's items `<x> <y>`, then the clone's.", "One line: `a b`.", "Two lines.", "|values| <= 1000",
   'Box one = new Box(a, b);\nBox two = one.deepCopy();\ntwo.items[0] = 99;\nSystem.out.println(one.items[0] + " " + one.items[1]);\nSystem.out.println(two.items[0] + " " + two.items[1]);', ["1 2", "5 6", "0 0", "-1 -2", "100 200"], [("int", "a b")],
   classes='''class Box {
    int[] items;
    Box(int a, int b) {
        items = new int[] {a, b};
    }
    Box deepCopy() {
        Box copy = new Box(0, 0);
        copy.items = items.clone();
        return copy;
    }
}''')
jq("j-oop-default-method-conflict", "Resolving Default Method Conflicts", "HARD", T, "Interfaces `Walker` and `Swimmer` both have a default `move()`. Class `Frog` implements both and overrides `move()` to call **both** versions with `Walker.super.move()` and `Swimmer.super.move()`. They print `<w> walks` and `<w> swims`. Read a name `w` and call `move()` on a `Frog`.", "One word.", "Two lines.", "No spaces",
   'new Frog(w).move();', ["Kermit", "x", "Froggy", "Ben", "Z"], [("String", "w")],
   classes='''interface Walker {
    String name();
    default void move() {
        System.out.println(name() + " walks");
    }
}

interface Swimmer {
    String name();
    default void move() {
        System.out.println(name() + " swims");
    }
}

class Frog implements Walker, Swimmer {
    String n;
    Frog(String n) {
        this.n = n;
    }
    public String name() {
        return n;
    }
    public void move() {
        Walker.super.move();
        Swimmer.super.move();
    }
}''')
jq("j-oop-covariant-return", "Covariant Return Types", "MEDIUM", T, "`Animal.baby()` returns an `Animal`. `Dog` overrides it with the **narrower** return type `Dog` (a covariant return) so callers can use dog-only methods. Read a name; `Dog(name).baby()` is a `Dog` named `<name> Jr` whose `bark()` returns `<name> Jr barks`. Print that string.", "One word.", "One line.", "No spaces",
   'Dog pup = new Dog(name).baby();\nSystem.out.println(pup.bark());', ["Rex", "Tommy", "A", "Buddy", "Max"], [("String", "name")],
   classes='''class Animal {
    String name;
    Animal(String name) {
        this.name = name;
    }
    Animal baby() {
        return new Animal(name + " Jr");
    }
}

class Dog extends Animal {
    Dog(String name) {
        super(name);
    }
    Dog baby() {
        return new Dog(name + " Jr");
    }
    String bark() {
        return name + " barks";
    }
}''')
jq("j-oop-singleton", "The Singleton Pattern", "HARD", T, "A singleton has one instance for the whole program. Class `Config` has a private constructor and `getInstance()`; it keeps a `counter`. Read `n`, call `Config.getInstance().increment()` `n` times (each call fetches the instance again) and print `Same instance: true` (comparing two `getInstance()` results) and `Counter: <n>`.", "One integer.", "Two lines.", "0 <= n <= 1000",
   'for (int i = 0; i < n; i++) Config.getInstance().increment();\nSystem.out.println("Same instance: " + (Config.getInstance() == Config.getInstance()));\nSystem.out.println("Counter: " + Config.getInstance().counter);', ["3", "0", "1", "10", "500"], [("int", "n")],
   classes='''class Config {
    private static class Holder {
        static final Config INSTANCE = new Config();
    }
    int counter = 0;
    private Config() {
    }
    static Config getInstance() {
        return Holder.INSTANCE;
    }
    synchronized void increment() {
        counter++;
    }
}''')
jq("j-oop-composition", "Composition: a Car Has an Engine", "MEDIUM", T, "`Car` contains an `Engine` object (has-a). `Engine.start()` returns `Engine <hp> hp started`. `Car.drive()` starts the engine and returns `Car moving with engine of <hp> hp`. Read `hp` and print the two strings from `start` (through the car's engine) and `drive`.", "One integer: horsepower.", "Two lines.", "1 <= hp <= 2000",
   'Car c = new Car(hp);\nSystem.out.println(c.engine.start());\nSystem.out.println(c.drive());', ["90", "150", "1", "2000", "300"], [("int", "hp")],
   classes='''class Engine {
    int hp;
    Engine(int hp) {
        this.hp = hp;
    }
    String start() {
        return "Engine " + hp + " hp started";
    }
}

class Car {
    Engine engine;
    Car(int hp) {
        engine = new Engine(hp);
    }
    String drive() {
        return "Car moving with engine of " + engine.hp + " hp";
    }
}''')
jq("j-oop-factory-pattern", "The Factory Pattern", "HARD", T, "`ShapeFactory.create(kind, size)` returns a `Shape` (`circle` radius, `square` side, or `null`). Read `kind size` and print the area with two decimals (use `Math.PI`), or `Unknown shape` for another kind.", "One line: `kind size`.", "The area or a message.", "kind is a word; size a decimal",
   'Shape s = ShapeFactory.create(kind, size);\nif (s == null) System.out.println("Unknown shape");\nelse System.out.printf("%.2f%n", s.area());', ["circle 1", "square 4", "triangle 3", "circle 2.5", "square 0.5"], [("String", "kind"), ("double", "size")],
   classes='''interface Shape {
    double area();
}

class ShapeFactory {
    static Shape create(String kind, double size) {
        if (kind.equals("circle")) return () -> Math.PI * size * size;
        if (kind.equals("square")) return () -> size * size;
        return null;
    }
}''')
jq("j-oop-method-hiding", "Static Method Hiding", "HARD", T, "A static method is not overridden, it is *hidden*: the version that runs depends on the reference type. `Parent.who()` (static) returns `Parent static`, `Child.who()` returns `Child static`, and the instance methods `name()` return `Parent` and `Child`. With `Parent p = new Child();` print `p.who()` then `p.name()`. Read nothing; print the two lines.", "There is no input.", "Two lines.", "None.",
   'Parent p = new Child();\nSystem.out.println(p.who());\nSystem.out.println(p.name());', [""], (), samples=1,
   classes='''class Parent {
    static String who() {
        return "Parent static";
    }
    String name() {
        return "Parent";
    }
}

class Child extends Parent {
    static String who() {
        return "Child static";
    }
    String name() {
        return "Child";
    }
}''')
jq("j-oop-static-dynamic-binding", "Static and Dynamic Binding", "HARD", T, "`Printer` has `print(Animal a)` and `print(Dog d)` overloads (chosen at compile time by the **declared** type) and each animal has an overridden `speak()` (chosen at run time by the **real** type). With `Animal a = new Dog();` print `Printer.print(a)` (overload by declared type) and `a.speak()`.", "There is no input.", "Two lines.", "None.",
   'Animal a = new Dog();\nSystem.out.println(Printer.print(a));\nSystem.out.println(a.speak());', [""], (), samples=1,
   classes='''class Animal {
    String speak() {
        return "...";
    }
}

class Dog extends Animal {
    String speak() {
        return "Woof";
    }
}

class Printer {
    static String print(Animal a) {
        return "print(Animal)";
    }
    static String print(Dog d) {
        return "print(Dog)";
    }
}''')
jq("j-oop-defensive-copy", "Defensive Copying", "HARD", T, "An immutable class `Scores` must not trust the array it is given. Its constructor and its `get()` both copy the array. Read `a b`, build `Scores` from `{a, b}`, then change the original array's first element to 0 and call `get()` again, changing the returned array's first element to 0 too. Print the stored scores as `<x> <y>` (still the original values).", "One line: `a b`.", "One line.", "|values| <= 1000",
   'int[] data = {a, b};\nScores s = new Scores(data);\ndata[0] = 0;\nint[] got = s.get();\ngot[0] = 0;\nint[] stored = s.get();\nSystem.out.println(stored[0] + " " + stored[1]);', ["1 2", "5 6", "10 20", "-1 -2", "100 200"], [("int", "a b")],
   classes='''final class Scores {
    private final int[] values;
    Scores(int[] values) {
        this.values = values.clone();
    }
    int[] get() {
        return values.clone();
    }
}''')
jq("j-oop-builder-pattern", "The Builder Pattern", "HARD", T, "`Pizza` is built step by step: `new Pizza.Builder().size(s).cheese(c).toppings(t).build()`. Its `toString()` is `<size> pizza, cheese: <yes/no>, toppings: <t>`. Read `size cheese toppings` (cheese is `true` or `false`) and print the pizza.", "One line: `size cheese toppings`.", "One line.", "size is a word",
   'Pizza p = new Pizza.Builder().size(size).cheese(cheese).toppings(toppings).build();\nSystem.out.println(p);', ["large true 3", "small false 0", "medium true 1", "large false 5", "small true 2"], [("String", "size"), ("boolean", "cheese"), ("int", "toppings")],
   classes='''class Pizza {
    private final String size;
    private final boolean cheese;
    private final int toppings;
    private Pizza(Builder b) {
        size = b.size;
        cheese = b.cheese;
        toppings = b.toppings;
    }
    public String toString() {
        return size + " pizza, cheese: " + (cheese ? "yes" : "no") + ", toppings: " + toppings;
    }
    static class Builder {
        private String size = "medium";
        private boolean cheese;
        private int toppings;
        Builder size(String s) {
            size = s;
            return this;
        }
        Builder cheese(boolean c) {
            cheese = c;
            return this;
        }
        Builder toppings(int t) {
            toppings = t;
            return this;
        }
        Pizza build() {
            return new Pizza(this);
        }
    }
}''')
jq("j-oop-unmodifiable-collection", "Unmodifiable Views", "HARD", T, "A getter should not hand out a list that callers can change. `Team.members()` returns `Collections.unmodifiableList(...)`. Read `n` and `n` names, add them, then try `team.members().add(\"hacker\")`. Print `Members: <count>` and, if the attempt throws `UnsupportedOperationException`, `Cannot modify`.", "First line `n`, then `n` names.", "Two lines.", "1 <= n <= 100",
   'Team team = new Team();\nfor (int i = 0; i < n; i++) team.add(in.next());\ntry {\n    team.members().add("hacker");\n    System.out.println("Modified");\n} catch (UnsupportedOperationException e) {\n    System.out.println("Cannot modify");\n}\nSystem.out.println("Members: " + team.members().size());', ["3\nasha ravi meena", "1\nsolo", "2\na b", "4\nw x y z", "1\nk"], [("int", "n")],
   classes='''class Team {
    private final List<String> list = new ArrayList<>();
    void add(String name) {
        list.add(name);
    }
    List<String> members() {
        return Collections.unmodifiableList(list);
    }
}''')
