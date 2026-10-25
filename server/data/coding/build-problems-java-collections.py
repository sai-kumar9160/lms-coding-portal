# Java: exceptions, collections, generics and streams (50 problems).
T = "Exceptions"
jq("j-exc-arithmetic", "Division by Zero", "EASY", T, "Read `a b`. Try `a / b`; if `b` is 0 an `ArithmeticException` is thrown: catch it and print `Cannot divide by zero`, otherwise print the quotient.", "One line: `a b`.", "One line.", "|values| <= 10^6",
   'try {\n    System.out.println(a / b);\n} catch (ArithmeticException e) {\n    System.out.println("Cannot divide by zero");\n}', ["10 2", "7 0", "-9 3", "0 5", "100 7"], [("int", "a b")])
jq("j-exc-multiple-catch", "Several catch Blocks", "MEDIUM", T, "Read a word `s` and an index `i`. Try to parse `s` as an `int` `x`, compute `100 / x`, and read element `i` of the array `{10, 20, 30}`. Catch `NumberFormatException` (print `Not a number`), `ArithmeticException` (print `Zero division`) and `ArrayIndexOutOfBoundsException` (print `Bad index`). If nothing goes wrong print `<100 / x> <element>`.", "One line: `word index`.", "One line.", "word has no spaces",
   'int[] data = {10, 20, 30};\ntry {\n    int x = Integer.parseInt(s);\n    int q = 100 / x;\n    System.out.println(q + " " + data[i]);\n} catch (NumberFormatException e) {\n    System.out.println("Not a number");\n} catch (ArithmeticException e) {\n    System.out.println("Zero division");\n} catch (ArrayIndexOutOfBoundsException e) {\n    System.out.println("Bad index");\n}', ["5 1", "abc 0", "0 2", "4 3", "-10 0"], [("String", "s"), ("int", "i")])
jq("j-exc-finally", "The finally Block", "EASY", T, "Read `n`. In a `try` compute `100 / n` and print `Result: <value>`; catch `ArithmeticException` and print `Error: division by zero`. A `finally` block always prints `Cleanup done`.", "One integer.", "Two lines.", "|n| <= 1000",
   'try {\n    System.out.println("Result: " + 100 / n);\n} catch (ArithmeticException e) {\n    System.out.println("Error: division by zero");\n} finally {\n    System.out.println("Cleanup done");\n}', ["5", "0", "-4", "100", "7"], [("int", "n")])
jq("j-exc-throw", "Throwing an Exception", "EASY", T, "Write `static void check(int age)` that throws `new IllegalArgumentException(\"Age must be 0 to 150\")` when the age is outside 0 to 150. Read an age; call `check` inside a try and print `Age accepted` or the exception's message.", "One integer.", "One line.", "|age| <= 1000",
   'try {\n    check(age);\n    System.out.println("Age accepted");\n} catch (IllegalArgumentException e) {\n    System.out.println(e.getMessage());\n}', ["25", "-1", "150", "151", "0"], [("int", "age")],
   members='''static void check(int age) {
    if (age < 0 || age > 150) throw new IllegalArgumentException("Age must be 0 to 150");
}''')
jq("j-exc-throws", "The throws Clause", "MEDIUM", T, "A method that can throw a checked exception must say so with `throws`. `static String load(String name) throws Exception` throws `new Exception(\"File not found: <name>\")` when the name is `missing` and otherwise returns `Loaded <name>`. Read a name and print the result or the exception's message.", "One word.", "One line.", "No spaces",
   'try {\n    System.out.println(load(name));\n} catch (Exception e) {\n    System.out.println(e.getMessage());\n}', ["data", "missing", "config", "x", "missing"], [("String", "name")],
   members='''static String load(String name) throws Exception {
    if (name.equals("missing")) throw new Exception("File not found: " + name);
    return "Loaded " + name;
}''')
jq("j-exc-custom-checked", "A Custom Checked Exception", "MEDIUM", T, "Class `InsufficientFundsException extends Exception`. `withdraw(balance, amount)` throws it with the message `Need <shortfall> more` when `amount` is above the balance. Read `balance amount` and print `New balance: <balance - amount>` or the message.", "One line: `balance amount`.", "One line.", "0 <= values <= 10^6",
   'try {\n    System.out.println("New balance: " + withdraw(balance, amount));\n} catch (InsufficientFundsException e) {\n    System.out.println(e.getMessage());\n}', ["500 200", "100 150", "0 0", "50 50", "10 1000"], [("int", "balance amount")],
   classes='''class InsufficientFundsException extends Exception {
    InsufficientFundsException(String message) {
        super(message);
    }
}''', members='''static int withdraw(int balance, int amount) throws InsufficientFundsException {
    if (amount > balance) throw new InsufficientFundsException("Need " + (amount - balance) + " more");
    return balance - amount;
}''')
jq("j-exc-custom-unchecked", "A Custom Unchecked Exception", "MEDIUM", T, "`InvalidMarksException extends RuntimeException` carries the message `Invalid marks: <m>`. `grade(m)` throws it when `m` is outside 0 to 100, otherwise returns `Pass` (40 or more) or `Fail`. Read marks and print the grade or the message. (An unchecked exception needs no `throws`.)", "One integer.", "One line.", "|m| <= 1000",
   'try {\n    System.out.println(grade(m));\n} catch (InvalidMarksException e) {\n    System.out.println(e.getMessage());\n}', ["75", "40", "39", "101", "-5"], [("int", "m")],
   classes='''class InvalidMarksException extends RuntimeException {
    InvalidMarksException(int m) {
        super("Invalid marks: " + m);
    }
}''', members='''static String grade(int m) {
    if (m < 0 || m > 100) throw new InvalidMarksException(m);
    return m >= 40 ? "Pass" : "Fail";
}''')
jq("j-exc-try-with-resources", "try-with-resources", "MEDIUM", T, "A resource that implements `AutoCloseable` is closed automatically when the `try (...)` block ends. `Resource(name)` prints `Opening <name>` when made and `Closing <name>` when closed. Read two names, open both in one try-with-resources (first, second), print `Using both` inside, and see them close in reverse order.", "One line with two words.", "Five lines.", "No spaces",
   'try (Resource r1 = new Resource(a); Resource r2 = new Resource(b)) {\n    System.out.println("Using both");\n}', ["db file", "a b", "x y", "first second", "in out"], [("String", "a b")],
   classes='''class Resource implements AutoCloseable {
    String name;
    Resource(String name) {
        this.name = name;
        System.out.println("Opening " + name);
    }
    public void close() {
        System.out.println("Closing " + name);
    }
}''')
jq("j-exc-null-pointer", "NullPointerException", "EASY", T, "Read a word. If it is `null` use a `null` string reference, otherwise the word itself. Print its length, or catch `NullPointerException` and print `Caught NullPointerException`.", "One word.", "One line.", "No spaces",
   'String s = w.equals("null") ? null : w;\ntry {\n    System.out.println(s.length());\n} catch (NullPointerException e) {\n    System.out.println("Caught NullPointerException");\n}', ["hello", "null", "a", "world", "Java"], [("String", "w")])
jq("j-exc-number-format", "NumberFormatException", "EASY", T, "Read a word and try `Integer.parseInt`. Print the number plus 1 or, if it cannot be parsed, `Invalid number: <word>`.", "One word.", "One line.", "No spaces",
   'try {\n    System.out.println(Integer.parseInt(w) + 1);\n} catch (NumberFormatException e) {\n    System.out.println("Invalid number: " + w);\n}', ["41", "abc", "-5", "3.5", "0"], [("String", "w")])
jq("j-exc-array-index", "ArrayIndexOutOfBoundsException", "EASY", T, "Read `n`, then `n` integers into an array, then an index `i`. Print `a[i]`, or `Index <i> is out of range` if the index is invalid.", "Line 1 `n`, line 2 the array, line 3 `i`.", "One line.", "1 <= n <= 100",
   'try {\n    System.out.println(a[i]);\n} catch (ArrayIndexOutOfBoundsException e) {\n    System.out.println("Index " + i + " is out of range");\n}', ["3\n10 20 30\n1", "3\n10 20 30\n3", "1\n5\n0", "2\n1 2\n-1", "4\n7 8 9 10\n3"], [("arr", "n a"), ("int", "i")])
jq("j-exc-nested-try", "Nested try-catch", "MEDIUM", T, "Read `a b`. In an outer try, print `Outer start`. In an inner try compute `a / b`: catch `ArithmeticException` inside and print `Inner caught`. After that, throw `new IllegalStateException(\"outer\")` if `a` is negative, which the outer catch prints as `Outer caught: outer`. Always print `Done` last.", "One line: `a b`.", "Up to four lines.", "|values| <= 1000",
   'try {\n    System.out.println("Outer start");\n    try {\n        System.out.println(a / b);\n    } catch (ArithmeticException e) {\n        System.out.println("Inner caught");\n    }\n    if (a < 0) throw new IllegalStateException("outer");\n} catch (IllegalStateException e) {\n    System.out.println("Outer caught: " + e.getMessage());\n}\nSystem.out.println("Done");', ["10 2", "10 0", "-4 2", "-4 0", "0 5"], [("int", "a b")])
jq("j-exc-stack-trace", "Exception Details", "MEDIUM", T, "Catch an exception and report it: print `<ClassName>: <message>` using `getClass().getSimpleName()` and `getMessage()`, then `Has stack trace: true` if `getStackTrace().length > 0`. (Also call `printStackTrace()`, which writes to the error stream and does not change the answer.) Read `n` and parse the text `\"<n>\"` as an int after dividing: use `10 / n`.", "One integer.", "Two lines when n is 0, otherwise the quotient.", "|n| <= 1000",
   'try {\n    System.out.println(10 / n);\n} catch (ArithmeticException e) {\n    System.out.println(e.getClass().getSimpleName() + ": " + e.getMessage());\n    System.out.println("Has stack trace: " + (e.getStackTrace().length > 0));\n    e.printStackTrace();\n}', ["2", "0", "5", "-1", "10"], [("int", "n")])
jq("j-exc-rethrow", "Rethrowing an Exception", "MEDIUM", T, "`parse(s)` catches a `NumberFormatException`, then throws a new `IllegalArgumentException(\"Bad input: <s>\", e)` that keeps the original as its cause. Read a word and print the parsed value, or `<message>` followed by ` (cause: <cause class>)`.", "One word.", "One line.", "No spaces",
   'try {\n    System.out.println(parse(w));\n} catch (IllegalArgumentException e) {\n    System.out.println(e.getMessage() + " (cause: " + e.getCause().getClass().getSimpleName() + ")");\n}', ["12", "x1", "-3", "4.5", "0"], [("String", "w")],
   members='''static int parse(String s) {
    try {
        return Integer.parseInt(s);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Bad input: " + s, e);
    }
}''')
jq("j-exc-checked-vs-unchecked", "Checked versus Unchecked", "MEDIUM", T, "A checked exception must be caught or declared; an unchecked one need not be. Read `n`. If `n` is even, `risky` throws a checked `Exception`; if odd, an unchecked `IllegalStateException`. Print `Checked: <message>` or `Unchecked: <message>`; the messages are `even` and `odd`.", "One integer.", "One line.", "|n| <= 1000",
   'try {\n    risky(n);\n} catch (IllegalStateException e) {\n    System.out.println("Unchecked: " + e.getMessage());\n} catch (Exception e) {\n    System.out.println("Checked: " + e.getMessage());\n}', ["2", "3", "0", "-1", "100"], [("int", "n")],
   members='''static void risky(int n) throws Exception {
    if (n % 2 == 0) throw new Exception("even");
    throw new IllegalStateException("odd");
}''')

T = "Collections"
jq("j-col-arraylist", "ArrayList Basics", "EASY", T, "Read `n` words into an `ArrayList`, then one more word `x`. Print `List: <list>` (the default `[a, b, c]` form), then remove the first element and print `After removing the first: <list>`, then `Contains <x>: <true/false>`.", "Line 1 `n`, then `n` words, then `x`.", "Three lines.", "1 <= n <= 100",
   'List<String> list = new ArrayList<>();\nfor (int i = 0; i < n; i++) list.add(in.next());\nString x = in.next();\nSystem.out.println("List: " + list);\nlist.remove(0);\nSystem.out.println("After removing the first: " + list);\nSystem.out.println("Contains " + x + ": " + list.contains(x));', ["3\nred green blue\ngreen", "1\nsolo\nsolo", "2\na b\na", "4\nw x y z\nz", "2\nNext Byte\nByte"], [("int", "n")])
jq("j-col-linkedlist-queue", "LinkedList as a Queue", "MEDIUM", T, "Use a `LinkedList` as a queue. Read `n` commands: `add x`, `poll` (remove and print the head, or `Empty`), `peek` (print the head without removing, or `Empty`). After all commands print `Size: <size>`.", "First line `n`, then `n` commands.", "One line per poll/peek, then the size.", "1 <= n <= 200",
   'LinkedList<Integer> q = new LinkedList<>();\nwhile (n-- > 0) {\n    String cmd = in.next();\n    if (cmd.equals("add")) q.add(in.nextInt());\n    else {\n        Integer head = cmd.equals("poll") ? q.poll() : q.peek();\n        System.out.println(head == null ? "Empty" : head);\n    }\n}\nSystem.out.println("Size: " + q.size());', ["5\nadd 1\nadd 2\npeek\npoll\npoll", "2\npoll\npeek", "3\nadd 7\nadd 8\npeek", "4\nadd 1\npoll\npoll\npeek", "1\nadd 5"], [("int", "n")])
jq("j-col-arraylist-vs-linkedlist", "ArrayList versus LinkedList", "MEDIUM", T, "Both lists support the same operations; they differ in speed. Insert the numbers 1 to `n` **at the front** of an `ArrayList` and of a `LinkedList`. Print `Same contents: <true/false>` and `First: <first element>`, `Last: <last element>` for the ArrayList. (A `LinkedList` is the better choice for front inserts.)", "One integer.", "Three lines.", "1 <= n <= 20000",
   'List<Integer> a = new ArrayList<>(), l = new LinkedList<>();\nfor (int i = 1; i <= n; i++) {\n    a.add(0, i);\n    l.add(0, i);\n}\nSystem.out.println("Same contents: " + a.equals(l));\nSystem.out.println("First: " + a.get(0));\nSystem.out.println("Last: " + a.get(a.size() - 1));', ["5", "1", "100", "20000", "7"], [("int", "n")])
jq("j-col-hashset", "HashSet: Unique Elements", "EASY", T, "Read `n` integers into a `HashSet`. Print `Unique: <count>` and then the unique values in increasing order on the next line (copy them into a `TreeSet` to sort).", "First line `n`, then `n` integers.", "Two lines.", "1 <= n <= 1000",
   'Set<Integer> set = new HashSet<>();\nfor (int i = 0; i < n; i++) set.add(in.nextInt());\nSystem.out.println("Unique: " + set.size());\nStringBuilder sb = new StringBuilder();\nfor (int v : new TreeSet<>(set)) sb.append(sb.length() > 0 ? " " : "").append(v);\nSystem.out.println(sb);', ["5\n3 1 3 2 1", "1\n9", "3\n4 4 4", "6\n5 4 3 2 1 0", "4\n-1 -1 2 2"], [("int", "n")])
jq("j-col-linkedhashset", "LinkedHashSet: Insertion Order", "EASY", T, "A `LinkedHashSet` removes repeats but remembers the order words first arrived. Read `n` words and print the unique ones in that order, separated by spaces.", "First line `n`, then `n` words.", "One line.", "1 <= n <= 1000",
   'Set<String> set = new LinkedHashSet<>();\nfor (int i = 0; i < n; i++) set.add(in.next());\nSystem.out.println(String.join(" ", set));', ["5\nb a b c a", "1\nx", "3\nz z z", "4\nd c b a", "6\nred blue red green blue red"], [("int", "n")])
jq("j-col-treeset", "TreeSet: Sorted Order", "EASY", T, "A `TreeSet` keeps its elements sorted. Read `n` integers and print `Sorted: <values>` (space-separated, repeats removed), `First: <smallest>` and `Last: <largest>`.", "First line `n`, then `n` integers.", "Three lines.", "1 <= n <= 1000",
   'TreeSet<Integer> set = new TreeSet<>();\nfor (int i = 0; i < n; i++) set.add(in.nextInt());\nStringBuilder sb = new StringBuilder();\nfor (int v : set) sb.append(sb.length() > 0 ? " " : "").append(v);\nSystem.out.println("Sorted: " + sb);\nSystem.out.println("First: " + set.first());\nSystem.out.println("Last: " + set.last());', ["5\n3 1 3 2 1", "1\n9", "3\n4 4 4", "6\n5 4 3 2 1 0", "4\n-1 -1 2 2"], [("int", "n")])
jq("j-col-hashmap-phonebook", "HashMap: a Phone Book", "EASY", T, "Read `n` entries `name phone`, then a name to look up. Print the phone number, or `Not found`.", "First line `n`, then `n` lines `name phone`, then the name.", "One line.", "1 <= n <= 100",
   'Map<String, String> book = new HashMap<>();\nfor (int i = 0; i < n; i++) book.put(in.next(), in.next());\nString who = in.next();\nSystem.out.println(book.getOrDefault(who, "Not found"));', ["3\nasha 111\nravi 222\nmeena 333\nravi", "1\nk 5\nk", "2\na 1\nb 2\nz", "3\nx 1\nx 2\ny 3\nx", "1\nq 9\nr"], [("int", "n")])
jq("j-col-linkedhashmap", "LinkedHashMap: Insertion Order", "EASY", T, "Read `n` pairs `key value` into a `LinkedHashMap` (a repeated key keeps its first position but takes the new value). Print the entries in insertion order, one `key=value` per line.", "First line `n`, then `n` pairs.", "One line per key.", "1 <= n <= 100",
   'Map<String, Integer> map = new LinkedHashMap<>();\nfor (int i = 0; i < n; i++) map.put(in.next(), in.nextInt());\nfor (Map.Entry<String, Integer> e : map.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());', ["3\nb 2\na 1\nc 3", "1\nx 1", "3\nk 1\nk 2\nj 3", "2\nz 9\ny 8", "4\nd 4\nc 3\nb 2\na 1"], [("int", "n")])
jq("j-col-treemap", "TreeMap: Sorted Keys", "EASY", T, "A `TreeMap` keeps its keys sorted. Read `n` pairs `key value` (a repeated key takes the new value) and print the entries in key order, one `key=value` per line.", "First line `n`, then `n` pairs.", "One line per key.", "1 <= n <= 100",
   'Map<String, Integer> map = new TreeMap<>();\nfor (int i = 0; i < n; i++) map.put(in.next(), in.nextInt());\nfor (Map.Entry<String, Integer> e : map.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());', ["3\nb 2\na 1\nc 3", "1\nx 1", "3\nk 1\nk 2\nj 3", "2\nz 9\ny 8", "4\nd 4\nc 3\nb 2\na 1"], [("int", "n")])
jq("j-col-word-frequency", "Word Frequency", "MEDIUM", T, "Read one line of words. Count how often each word appears (a `HashMap`, but print in alphabetical order) as `word: count` lines.", "One line of words.", "One line per distinct word.", "At most 200 characters",
   'Map<String, Integer> freq = new TreeMap<>();\nfor (String w : line.trim().split("\\\\s+")) freq.merge(w, 1, Integer::sum);\nfor (Map.Entry<String, Integer> e : freq.entrySet()) System.out.println(e.getKey() + ": " + e.getValue());', ["the cat and the hat", "a", "to be or not to be", "x y x y x", "one two three"], [("line", "line")])
jq("j-col-comparable", "Sorting with Comparable", "MEDIUM", T, "`Student implements Comparable<Student>`: higher marks come first, and equal marks are ordered by name. Read `n` students (`name marks`) and print the sorted list as `name marks` lines.", "First line `n`, then `n` lines `name marks`.", "`n` lines.", "1 <= n <= 100",
   'List<Student> list = new ArrayList<>();\nfor (int i = 0; i < n; i++) list.add(new Student(in.next(), in.nextInt()));\nCollections.sort(list);\nfor (Student s : list) System.out.println(s.name + " " + s.marks);', ["3\nasha 82\nravi 91\nmeena 77", "1\nk 50", "4\nzed 50\namy 50\nbob 70\ncat 50", "2\nb 1\na 1", "3\nx 9\ny 9\nz 10"], [("int", "n")],
   classes='''class Student implements Comparable<Student> {
    String name;
    int marks;
    Student(String name, int marks) {
        this.name = name;
        this.marks = marks;
    }
    public int compareTo(Student o) {
        if (marks != o.marks) return Integer.compare(o.marks, marks);
        return name.compareTo(o.name);
    }
}''')
jq("j-col-comparator", "Sorting with a Comparator", "MEDIUM", T, "Sort `n` words by length (shortest first); words of the same length stay in alphabetical order. Use a `Comparator` object. Print the words on one line.", "First line `n`, then `n` words.", "One line.", "1 <= n <= 100",
   'List<String> words = new ArrayList<>();\nfor (int i = 0; i < n; i++) words.add(in.next());\nCollections.sort(words, new Comparator<String>() {\n    public int compare(String a, String b) {\n        if (a.length() != b.length()) return a.length() - b.length();\n        return a.compareTo(b);\n    }\n});\nSystem.out.println(String.join(" ", words));', ["4\nbanana fig apple kiwi", "1\nsolo", "3\nccc bb a", "5\ndd cc bb aa e", "2\nzebra apple"], [("int", "n")])
jq("j-col-stack-deque", "Stack with ArrayDeque", "MEDIUM", T, "Use an `ArrayDeque` as a stack. Read `n` commands: `push x`, `pop` (print the top and remove it, or `Empty`), `peek` (print the top, or `Empty`). Print `Size: <size>` last.", "First line `n`, then `n` commands.", "One line per pop/peek, then the size.", "1 <= n <= 200",
   'Deque<Integer> st = new ArrayDeque<>();\nwhile (n-- > 0) {\n    String cmd = in.next();\n    if (cmd.equals("push")) st.push(in.nextInt());\n    else {\n        Integer top = cmd.equals("pop") ? st.poll() : st.peek();\n        System.out.println(top == null ? "Empty" : top);\n    }\n}\nSystem.out.println("Size: " + st.size());', ["5\npush 1\npush 2\npeek\npop\npop", "2\npop\npeek", "3\npush 7\npush 8\npeek", "4\npush 1\npop\npop\npeek", "1\npush 5"], [("int", "n")])
jq("j-col-priority-queue", "PriorityQueue", "MEDIUM", T, "A `PriorityQueue` always gives the smallest element first. Read `n` integers and print them in increasing order on the first line (by polling a min-queue), then in decreasing order on the second line (a queue made with `Collections.reverseOrder()`).", "First line `n`, then `n` integers.", "Two lines.", "1 <= n <= 1000",
   'PriorityQueue<Integer> min = new PriorityQueue<>(), max = new PriorityQueue<>(Collections.reverseOrder());\nfor (int i = 0; i < n; i++) {\n    int x = in.nextInt();\n    min.add(x);\n    max.add(x);\n}\nStringBuilder a = new StringBuilder(), b = new StringBuilder();\nwhile (!min.isEmpty()) a.append(a.length() > 0 ? " " : "").append(min.poll());\nwhile (!max.isEmpty()) b.append(b.length() > 0 ? " " : "").append(max.poll());\nSystem.out.println(a);\nSystem.out.println(b);', ["5\n3 1 4 1 5", "1\n9", "3\n2 2 2", "4\n-1 10 0 5", "6\n6 5 4 3 2 1"], [("int", "n")])
jq("j-col-iterator", "Iterator and ListIterator", "MEDIUM", T, "Read `n` integers into a list. Remove all even numbers **safely with an `Iterator`** (removing inside a for-each would throw `ConcurrentModificationException`) and print the list. Then walk it backwards with a `ListIterator` and print the numbers on the next line, separated by spaces (print `Empty` for both if nothing is left).", "First line `n`, then `n` integers.", "Two lines.", "1 <= n <= 1000",
   'List<Integer> list = new ArrayList<>();\nfor (int i = 0; i < n; i++) list.add(in.nextInt());\nIterator<Integer> it = list.iterator();\nwhile (it.hasNext()) if (it.next() % 2 == 0) it.remove();\nSystem.out.println(list.isEmpty() ? "Empty" : list.toString());\nStringBuilder sb = new StringBuilder();\nListIterator<Integer> li = list.listIterator(list.size());\nwhile (li.hasPrevious()) sb.append(sb.length() > 0 ? " " : "").append(li.previous());\nSystem.out.println(sb.length() > 0 ? sb.toString() : "Empty");', ["5\n1 2 3 4 5", "2\n2 4", "1\n7", "4\n10 11 12 13", "3\n1 3 5"], [("int", "n")])
jq("j-col-utility-methods", "The Collections Utility Class", "MEDIUM", T, "Read `n` integers. Print `Sorted: <list>`, `Reversed: <list>`, `Max: <x>` and `Min: <y>` using `Collections.sort`, `reverse`, `max` and `min`, then print `Shuffled: <list>` after `Collections.shuffle(list, new Random(42))` (a fixed seed makes it repeatable).", "First line `n`, then `n` integers.", "Five lines.", "1 <= n <= 50",
   'List<Integer> list = new ArrayList<>();\nfor (int i = 0; i < n; i++) list.add(in.nextInt());\nCollections.sort(list);\nSystem.out.println("Sorted: " + list);\nCollections.reverse(list);\nSystem.out.println("Reversed: " + list);\nSystem.out.println("Max: " + Collections.max(list));\nSystem.out.println("Min: " + Collections.min(list));\nCollections.shuffle(list, new Random(42));\nSystem.out.println("Shuffled: " + list);', ["5\n3 1 4 1 5", "1\n9", "3\n2 2 2", "4\n-1 10 0 5", "6\n6 5 4 3 2 1"], [("int", "n")])
jq("j-col-array-list-conversion", "Arrays and Lists", "EASY", T, "Read `n` integers into an array. Convert it to a `List` with `Arrays.asList` (using the `Integer` wrapper type) and print `Size: <size>` and `Sum: <sum>`. Then turn the list back into an array with `toArray` and print `Array length: <length>`.", "First line `n`, then `n` integers.", "Three lines.", "1 <= n <= 1000",
   'Integer[] boxed = new Integer[n];\nfor (int i = 0; i < n; i++) boxed[i] = a[i];\nList<Integer> list = Arrays.asList(boxed);\nint sum = 0;\nfor (int v : list) sum += v;\nSystem.out.println("Size: " + list.size());\nSystem.out.println("Sum: " + sum);\nSystem.out.println("Array length: " + list.toArray().length);', [arr([1, 2, 3, 4]), arr([10]), arr([-5, 5, 10]), arr([100, 200, 300]), arr([7, 7, 7])], [("arr", "n a")])

T = "Streams and generics"
jq("j-str-filter-map", "Streams: filter and map", "MEDIUM", T, "Read `n` integers. With a stream keep the **even** numbers, square them and collect them into a list. Print the list in the default `[a, b]` form.", "First line `n`, then `n` integers.", "One line.", "1 <= n <= 100",
   'List<Integer> out = Arrays.stream(a).filter(x -> x % 2 == 0).map(x -> x * x).boxed().collect(Collectors.toList());\nSystem.out.println(out);', [arr([1, 2, 3, 4]), arr([1, 3]), arr([10]), arr([-2, -3, 4]), arr([0, 5, 6])], [("arr", "n a")], imports="java.util.stream.*")
jq("j-str-statistics", "Streams: Statistics", "MEDIUM", T, "Read `n` integers. With `IntSummaryStatistics` print `Max: <x>`, `Min: <y>` and `Average: <avg>` (two decimals).", "First line `n`, then `n` integers.", "Three lines.", "1 <= n <= 1000",
   'IntSummaryStatistics st = Arrays.stream(a).summaryStatistics();\nSystem.out.println("Max: " + st.getMax());\nSystem.out.println("Min: " + st.getMin());\nSystem.out.printf("Average: %.2f%n", st.getAverage());', [arr([1, 2, 3, 4]), arr([10]), arr([-5, 5, 10]), arr([100, 200, 300, 401]), arr([7, 7, 7])], [("arr", "n a")])
jq("j-str-grouping", "Streams: groupingBy", "HARD", T, "Read `n` words and group them by length with `Collectors.groupingBy` into a `TreeMap`. Print one line per length as `<length>: [<words in the order read>]`.", "First line `n`, then `n` words.", "One line per length.", "1 <= n <= 100",
   'List<String> words = Arrays.asList(w);\nMap<Integer, List<String>> groups = words.stream().collect(Collectors.groupingBy(String::length, TreeMap::new, Collectors.toList()));\nfor (Map.Entry<Integer, List<String>> e : groups.entrySet()) System.out.println(e.getKey() + ": " + e.getValue());', ["5\nbanana fig apple kiwi pear", "1\nsolo", "3\nccc bb a", "4\nab cd ef gh", "2\nzebra apple"], [("words", "n w")], imports="java.util.stream.*")
jq("j-gen-generic-class", "A Generic Class", "MEDIUM", T, "Write `class Box<T>` with `set`, `get` and `describe()` returning `Box<<type>>: <value>` (the type is `value.getClass().getSimpleName()`). Read an integer and a word and make a `Box<Integer>` and a `Box<String>`; print both descriptions.", "One line: `integer word`.", "Two lines.", "No spaces in the word",
   'Box<Integer> a = new Box<>();\na.set(i);\nBox<String> b = new Box<>();\nb.set(w);\nSystem.out.println(a.describe());\nSystem.out.println(b.describe());', ["5 hello", "-1 x", "0 zero", "100 Java", "7 seven"], [("int", "i"), ("String", "w")],
   classes='''class Box<T> {
    private T value;
    void set(T value) {
        this.value = value;
    }
    T get() {
        return value;
    }
    String describe() {
        return "Box<" + value.getClass().getSimpleName() + ">: " + value;
    }
}''')
jq("j-gen-bounded-type", "Bounded Type Parameters", "MEDIUM", T, "Write `static <T extends Comparable<T>> T bigger(T a, T b)`. Use it for two integers and for two words and print `Bigger number: <x>` and `Bigger word: <y>` (the word that comes later in dictionary order).", "One line: `a b w1 w2`.", "Two lines.", "No spaces in words",
   'System.out.println("Bigger number: " + bigger(a, b));\nSystem.out.println("Bigger word: " + bigger(w1, w2));', ["3 9 apple banana", "9 3 pear fig", "5 5 x x", "-1 -2 a b", "100 99 zeta alpha"], [("int", "a b"), ("String", "w1 w2")],
   members='''static <T extends Comparable<T>> T bigger(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}''')
jq("j-gen-wildcards", "Wildcard Generics", "HARD", T, "Write `static double total(List<? extends Number> list)` (works for a list of any number type) and `static void addTo(List<? super Integer> list, int n)` that adds the numbers 1 to `n`. Read `n`, add 1..n to a `List<Number>` with `addTo`, and print `Total: <total>` (as a double, like `15.0`).", "One integer.", "One line.", "0 <= n <= 1000",
   'List<Number> list = new ArrayList<>();\naddTo(list, n);\nSystem.out.println("Total: " + total(list));', ["5", "0", "1", "100", "1000"], [("int", "n")],
   members='''static double total(List<? extends Number> list) {
    double sum = 0;
    for (Number x : list) sum += x.doubleValue();
    return sum;
}
static void addTo(List<? super Integer> list, int n) {
    for (int i = 1; i <= n; i++) list.add(i);
}''')

T = "Collections in practice"
jq("j-col-lru-cache", "An LRU Cache", "HARD", T, "A least-recently-used cache holds at most `cap` entries; when it is full, the entry used longest ago is dropped. Build it from `LinkedHashMap` (access order, and override `removeEldestEntry`). Read `cap` and `n` commands: `put k v` or `get k` (print the value, or `-1`). At the end print the keys from least to most recently used.", "Line 1 `cap n`, then `n` commands.", "One line per get, then the keys.", "1 <= cap <= 10, 1 <= n <= 100",
   'LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(16, 0.75f, true) {\n    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {\n        return size() > cap;\n    }\n};\nwhile (n-- > 0) {\n    String cmd = in.next();\n    if (cmd.equals("put")) cache.put(in.nextInt(), in.nextInt());\n    else {\n        Integer v = cache.get(in.nextInt());\n        System.out.println(v == null ? -1 : v);\n    }\n}\nSystem.out.println(cache.keySet());', ["2 6\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3", "1 3\nput 5 5\nget 5\nget 6", "3 4\nput 1 10\nput 2 20\nput 3 30\nget 2", "2 5\nput 1 1\nput 1 9\nget 1\nput 2 2\nput 3 3", "2 2\nget 1\nput 1 1"], [("int", "cap n")])
jq("j-col-find-duplicates", "Find Duplicates with a Set", "EASY", T, "Read `n` integers. Print every value that appears more than once, each once, in the order the repeat is first noticed, on one line (or `None`). Use a `HashSet` of seen values.", "First line `n`, then `n` integers.", "The duplicates or `None`.", "1 <= n <= 1000",
   'Set<Integer> seen = new HashSet<>(), dups = new LinkedHashSet<>();\nfor (int x : a) if (!seen.add(x)) dups.add(x);\nSystem.out.println(dups.isEmpty() ? "None" : dups.toString().replaceAll("[\\\\[\\\\],]", ""));', [arr([1, 2, 3, 2, 1]), arr([5]), arr([4, 4, 4]), arr([9, 8, 9, 7, 8]), arr([1, 2, 3])], [("arr", "n a")])
jq("j-col-generic-stack", "A Generic Stack", "HARD", T, "Write your own `MyStack<T>` (an `ArrayList` inside) with `push`, `pop` (returns `null` when empty) and `isEmpty`. Read `n` integers, push them all, then pop everything and print the numbers popped, separated by spaces.", "First line `n`, then `n` integers.", "The numbers in reverse.", "1 <= n <= 1000",
   'MyStack<Integer> st = new MyStack<>();\nfor (int x : a) st.push(x);\nStringBuilder sb = new StringBuilder();\nwhile (!st.isEmpty()) sb.append(sb.length() > 0 ? " " : "").append(st.pop());\nSystem.out.println(sb);', [arr([1, 2, 3]), arr([7]), arr([5, 4, 3, 2, 1]), arr([-1, 0, 1]), arr([9, 9])], [("arr", "n a")],
   classes='''class MyStack<T> {
    private final List<T> items = new ArrayList<>();
    void push(T x) {
        items.add(x);
    }
    T pop() {
        return items.isEmpty() ? null : items.remove(items.size() - 1);
    }
    boolean isEmpty() {
        return items.isEmpty();
    }
}''')
jq("j-col-first-unique-char", "First Non-Repeating Character", "MEDIUM", T, "Read a word. Count its characters in a `LinkedHashMap` (it remembers the order) and print the first character whose count is 1, or `None`.", "One word.", "One character or `None`.", "1 <= length <= 100",
   'Map<Character, Integer> count = new LinkedHashMap<>();\nfor (char c : w.toCharArray()) count.merge(c, 1, Integer::sum);\nfor (Map.Entry<Character, Integer> e : count.entrySet()) {\n    if (e.getValue() == 1) {\n        System.out.println(e.getKey());\n        return;\n    }\n}\nSystem.out.println("None");', ["swiss", "aabb", "hello", "a", "abcabcd"], [("String", "w")])
jq("j-col-lambda-comparator", "A Lambda Comparator", "MEDIUM", T, "Sort `n` words by their **last letter**; words with the same last letter go in dictionary order. Write the comparator as a lambda and print the words on one line.", "First line `n`, then `n` words.", "One line.", "1 <= n <= 100",
   'List<String> words = new ArrayList<>(Arrays.asList(w));\nwords.sort((x, y) -> {\n    int c = Character.compare(x.charAt(x.length() - 1), y.charAt(y.length() - 1));\n    return c != 0 ? c : x.compareTo(y);\n});\nSystem.out.println(String.join(" ", words));', ["4\nbanana fig apple kiwi", "1\nsolo", "3\nab cb aa", "5\ndog cat pig rat bat", "2\nzebra apple"], [("words", "n w")])
jq("j-col-custom-linked-list", "Your Own Linked List", "HARD", T, "Build a singly linked list yourself (class `Node` plus a `MyList` with `addFirst`, `addLast` and `toString`). Read `n` commands `F x` (add at the front) or `L x` (add at the end) and print the list as `a -> b -> c`, or `Empty`.", "First line `n`, then `n` commands.", "One line.", "1 <= n <= 200",
   'MyList list = new MyList();\nwhile (n-- > 0) {\n    char where = in.next().charAt(0);\n    int x = in.nextInt();\n    if (where == \'F\') list.addFirst(x);\n    else list.addLast(x);\n}\nSystem.out.println(list);', ["4\nL 1\nL 2\nF 0\nL 3", "1\nF 5", "3\nF 1\nF 2\nF 3", "2\nL 7\nL 8", "2\nF 9\nL 1"], [("int", "n")],
   classes='''class Node {
    int value;
    Node next;
    Node(int value) {
        this.value = value;
    }
}

class MyList {
    Node head, tail;
    void addFirst(int x) {
        Node n = new Node(x);
        n.next = head;
        head = n;
        if (tail == null) tail = n;
    }
    void addLast(int x) {
        Node n = new Node(x);
        if (tail == null) head = n;
        else tail.next = n;
        tail = n;
    }
    public String toString() {
        if (head == null) return "Empty";
        StringBuilder sb = new StringBuilder();
        for (Node p = head; p != null; p = p.next) sb.append(p.value).append(p.next != null ? " -> " : "");
        return sb.toString();
    }
}''')
jq("j-col-concurrent-hashmap", "ConcurrentHashMap Iteration", "HARD", T, "Removing from a plain `HashMap` while looping over it throws `ConcurrentModificationException`; a `ConcurrentHashMap` allows it. Put the numbers 1 to `n` in a `ConcurrentHashMap` (key `i`, value `i`), loop over its keys and remove every key that is **odd**. Print `Remaining: <count>` and the remaining keys in increasing order.", "One integer.", "Two lines.", "1 <= n <= 1000",
   'Map<Integer, Integer> map = new ConcurrentHashMap<>();\nfor (int i = 1; i <= n; i++) map.put(i, i);\nfor (Integer key : map.keySet()) if (key % 2 == 1) map.remove(key);\nSystem.out.println("Remaining: " + map.size());\nStringBuilder sb = new StringBuilder();\nfor (int k : new TreeSet<>(map.keySet())) sb.append(sb.length() > 0 ? " " : "").append(k);\nSystem.out.println(sb);', ["6", "1", "2", "10", "7"], [("int", "n")], imports="java.util.concurrent.ConcurrentHashMap")
jq("j-col-optional", "Optional", "MEDIUM", T, "Read `n` words and a letter. Use `Optional` to find the first word that starts with that letter: print `Found: <WORD IN CAPITALS>` or `Nothing starts with <letter>` (use `map` and `orElse`).", "Line 1 `n`, then `n` words, then a letter.", "One line.", "1 <= n <= 100",
   'char letter = in.next().charAt(0);\nOptional<String> hit = Arrays.stream(w).filter(s -> s.charAt(0) == letter).findFirst();\nSystem.out.println(hit.map(s -> "Found: " + s.toUpperCase()).orElse("Nothing starts with " + letter));', ["3\napple banana cherry\nb", "2\nfig kiwi\nz", "1\nsolo\ns", "4\nred green blue gold\ng", "2\nx y\nx"], [("words", "n w")])
jq("j-col-flatmap", "Streams: flatMap", "HARD", T, "Read `n` lines; each begins with a count `k` followed by `k` integers. Flatten all the lists into one stream with `flatMap` and print `Total: <sum>` and the distinct numbers in increasing order.", "First line `n`, then `n` lines: `k` and `k` integers.", "Two lines.", "1 <= n <= 20",
   'List<List<Integer>> lists = new ArrayList<>();\nfor (int i = 0; i < n; i++) {\n    int k = in.nextInt();\n    List<Integer> one = new ArrayList<>();\n    for (int j = 0; j < k; j++) one.add(in.nextInt());\n    lists.add(one);\n}\nint total = lists.stream().flatMap(List::stream).mapToInt(Integer::intValue).sum();\nSystem.out.println("Total: " + total);\nSystem.out.println(lists.stream().flatMap(List::stream).distinct().sorted().map(String::valueOf).collect(Collectors.joining(" ")));', ["2\n3 1 2 3\n2 3 4", "1\n1 5", "3\n1 1\n1 1\n1 1", "2\n2 -1 0\n3 5 5 5", "1\n4 9 8 7 6"], [("int", "n")], imports="java.util.stream.*")
jq("j-col-generic-queue", "A Generic Queue", "HARD", T, "Write your own `MyQueue<T>` with `enqueue`, `dequeue` (returns `null` when empty) and `size`, backed by a linked list of nodes. Read `n` integers, enqueue them all, then dequeue everything and print the numbers in order, separated by spaces, followed on the next line by `Size: <size>`.", "First line `n`, then `n` integers.", "Two lines.", "1 <= n <= 1000",
   'MyQueue<Integer> q = new MyQueue<>();\nfor (int x : a) q.enqueue(x);\nStringBuilder sb = new StringBuilder();\nInteger x;\nwhile ((x = q.dequeue()) != null) sb.append(sb.length() > 0 ? " " : "").append(x);\nSystem.out.println(sb);\nSystem.out.println("Size: " + q.size());', [arr([1, 2, 3]), arr([7]), arr([5, 4, 3, 2, 1]), arr([-1, 0, 1]), arr([9, 9])], [("arr", "n a")],
   classes='''class MyQueue<T> {
    private class Cell {
        T value;
        Cell next;
        Cell(T value) {
            this.value = value;
        }
    }
    private Cell head, tail;
    private int size;
    void enqueue(T x) {
        Cell c = new Cell(x);
        if (tail == null) head = c;
        else tail.next = c;
        tail = c;
        size++;
    }
    T dequeue() {
        if (head == null) return null;
        T v = head.value;
        head = head.next;
        if (head == null) tail = null;
        size--;
        return v;
    }
    int size() {
        return size;
    }
}''')
jq("j-col-file-word-count", "Word Count with File Errors", "HARD", T, "First try to open a file named `missing.txt` with a `FileReader`; it does not exist, so catch the `FileNotFoundException` and print `File not found: missing.txt`. Then count the words of the text on standard input (all lines until the end) in a `TreeMap` and print `<word>: <count>` lines in alphabetical order.", "Any number of lines of text.", "One error line, then the counts.", "At most 1000 words",
   'try (FileReader fr = new FileReader("missing.txt")) {\n    System.out.println("Opened");\n} catch (FileNotFoundException e) {\n    System.out.println("File not found: missing.txt");\n}\nMap<String, Integer> freq = new TreeMap<>();\nwhile (in.hasNext()) freq.merge(in.next(), 1, Integer::sum);\nfor (Map.Entry<String, Integer> e : freq.entrySet()) System.out.println(e.getKey() + ": " + e.getValue());', ["the cat\nthe hat\n", "a\n", "to be or\nnot to be\n", "x y x\ny x\n", "one\n"], (), imports="java.io.*", scanner=True)
jq("j-col-map-merge", "Merging Maps", "HARD", T, "Read two maps. The first has `n` pairs `key value` and the second `m` pairs. Merge the second into the first with `Map.merge(key, value, Integer::sum)`, so a key that is in both gets the **sum** of its values. Print the result in key order as `key=value` lines.", "Line 1 `n`, `n` pairs, then `m`, `m` pairs.", "One line per key.", "1 <= n, m <= 50",
   'Map<String, Integer> a = new TreeMap<>();\nfor (int i = 0; i < n; i++) a.put(in.next(), in.nextInt());\nint m = in.nextInt();\nfor (int i = 0; i < m; i++) a.merge(in.next(), in.nextInt(), Integer::sum);\nfor (Map.Entry<String, Integer> e : a.entrySet()) System.out.println(e.getKey() + "=" + e.getValue());', ["2\na 1\nb 2\n2\nb 3\nc 4", "1\nx 1\n1\nx 1", "1\nk 5\n2\nj 1\nk 2", "2\np 1\nq 2\n1\nr 3", "3\na 1\nb 1\nc 1\n3\na 1\nb 1\nc 1"], [("int", "n")])
