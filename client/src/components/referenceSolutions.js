// Predefined reference solutions for coding problems in multiple languages.
export const REFERENCE_SOLUTIONS = {
    'power-set': {
        python: `n = int(input())
print('{}')
def go(start, cur):
    for i in range(start, n + 1):
        cur.append(i)
        print(*cur)
        go(i + 1, cur)
        cur.pop()
go(1, [])
`,
        javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();
if (input) {
    const n = parseInt(input, 10);
    console.log('{}');
    const cur = [];
    function go(start) {
        for (let i = start; i <= n; i++) {
            cur.push(i);
            console.log(cur.join(' '));
            go(i + 1);
            cur.pop();
        }
    }
    go(1);
}
`,
        java: `import java.util.*;

public class Main {
    static int n;
    static List<Integer> cur = new ArrayList<>();

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        n = sc.nextInt();
        System.out.println("{}");
        go(1);
    }

    static void go(int start) {
        for (int i = start; i <= n; i++) {
            cur.add(i);
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < cur.size(); j++) {
                if (j > 0) sb.append(' ');
                sb.append(cur.get(j));
            }
            System.out.println(sb.toString());
            go(i + 1);
            cur.remove(cur.size() - 1);
        }
    }
}
`,
        c: `#include <stdio.h>

int n;
int cur[32];
int len = 0;

void go(int start) {
    for (int i = start; i <= n; i++) {
        cur[len++] = i;
        for (int j = 0; j < len; j++) {
            printf("%d%c", cur[j], j == len - 1 ? '\\n' : ' ');
        }
        go(i + 1);
        len--;
    }
}

int main(void) {
    if (scanf("%d", &n) == 1) {
        printf("{}\\n");
        go(1);
    }
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

using namespace std;

int n;
vector<int> cur;

void go(int start) {
    for (int i = start; i <= n; i++) {
        cur.push_back(i);
        for (size_t j = 0; j < cur.size(); j++) {
            cout << cur[j] << (j + 1 == cur.size() ? '\\n' : ' ');
        }
        go(i + 1);
        cur.pop_back();
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    if (cin >> n) {
        cout << "{}\\n";
        go(1);
    }
    return 0;
}
`,
        csharp: `using System;
using System.Collections.Generic;

public class Main {
    static int n;
    static List<int> cur = new List<int>();

    public static void Main(string[] args) {
        string line = Console.ReadLine();
        if (int.TryParse(line?.Trim(), out n)) {
            Console.WriteLine("{}");
            Go(1);
        }
    }

    static void Go(int start) {
        for (int i = start; i <= n; i++) {
            cur.Add(i);
            Console.WriteLine(string.Join(" ", cur));
            Go(i + 1);
            cur.RemoveAt(cur.Count - 1);
        }
    }
}
`,
    },
    'hello-world': {
        python: 'print("Hello, World!")\\n',
        javascript: 'console.log("Hello, World!");\\n',
        java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
        c: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
        csharp: `using System;

public class Main {
    public static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}
`,
    },
    'sum-of-two-numbers': {
        python: 'a, b = map(int, input().split())\\nprint(a + b)\\n',
        javascript: `const fs = require('fs');
const [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);
console.log(a + b);
`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        System.out.println(a + b);
    }
}
`,
        c: `#include <stdio.h>

int main(void) {
    long long a, b;
    if (scanf("%lld %lld", &a, &b) == 2) {
        printf("%lld\\n", a + b);
    }
    return 0;
}
`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << (a + b) << "\\n";
    }
    return 0;
}
`,
        csharp: `using System;

public class Main {
    public static void Main(string[] args) {
        string[] parts = Console.ReadLine().Trim().Split();
        long a = long.Parse(parts[0]);
        long b = long.Parse(parts[1]);
        Console.WriteLine(a + b);
    }
}
`,
    },
    'even-or-odd': {
        python: 'n = int(input())\\nprint("Even" if n % 2 == 0 else "Odd")\\n',
        javascript: `const fs = require('fs');
const n = parseInt(fs.readFileSync(0, 'utf8').trim(), 10);
console.log(n % 2 === 0 ? 'Even' : 'Odd');
`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        System.out.println(n % 2 == 0 ? "Even" : "Odd");
    }
}
`,
        c: `#include <stdio.h>

int main(void) {
    long long n;
    if (scanf("%lld", &n) == 1) {
        printf("%s\\n", n % 2 == 0 ? "Even" : "Odd");
    }
    return 0;
}
`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    long long n;
    if (cin >> n) {
        cout << (n % 2 == 0 ? "Even" : "Odd") << "\\n";
    }
    return 0;
}
`,
        csharp: `using System;

public class Main {
    public static void Main(string[] args) {
        long n = long.Parse(Console.ReadLine().Trim());
        Console.WriteLine(n % 2 == 0 ? "Even" : "Odd");
    }
}
`,
    },
};

export function getProblemSolutions(slug) {
    return (slug && REFERENCE_SOLUTIONS[slug]) || {};
}

