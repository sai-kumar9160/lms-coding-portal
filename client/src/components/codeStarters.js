// Starting code for each language: read STDIN, print to STDOUT.
export const STARTERS = {
    python: '# Read input from STDIN and print the answer to STDOUT.\n# Example: a, b = map(int, input().split())\n\n',
    java: 'import java.util.*;\nimport java.io.*;\n\n// Keep the class name Main.\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        Scanner in = new Scanner(System.in);\n        \n    }\n}\n',
    c: '#include <stdio.h>\n\nint main(void) {\n    \n    return 0;\n}\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}\n',
    javascript: "// Read input from STDIN and print the answer to STDOUT.\nconst input = require('fs').readFileSync(0, 'utf8');\nconst lines = input.split('\\n');\n\n// console.log(answer);\n",
    csharp: 'using System;\nusing System.Linq;\n\n// Keep the class name Main.\npublic class Main {\n    public static void Main(string[] args) {\n        string line = Console.ReadLine();\n        \n    }\n}\n',
    go: 'package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    in := bufio.NewReader(os.Stdin)\n    _ = in\n    fmt.Println()\n}\n',
    kotlin: 'fun main() {\n    val line = readLine()!!\n    \n}\n',
    ruby: '# Read input from STDIN and print the answer to STDOUT.\nline = gets\n\n',
    php: "<?php\n// Read input from STDIN and print the answer to STDOUT.\n$line = trim(fgets(STDIN));\n\n",
};

// Keep language preference across visits; source-code drafts live only in this tab.
const storageFor = key => key === 'lms-code-lang' ? localStorage : sessionStorage;
export const store = {
    get(key) { try { return storageFor(key).getItem(key); } catch { return null; } },
    set(key, value) { try { storageFor(key).setItem(key, value); } catch { /* ignore */ } },
    remove(key) { try { storageFor(key).removeItem(key); } catch { /* ignore */ } },
};
