// Starting code for the editor: what a student sees before typing anything.
//   1. Python problems get the lines of their reference solution that read the input (nothing that solves the problem).
//   2. Problems that accept other languages get those same reads translated into C, C++, Java and JavaScript.
//   3. Starters written by hand and stored with the problem (the C, Java and React tracks) take priority.
// Reading the input first is all a starter does, e.g. for Python:
//   if __name__ == '__main__':
//       n = int(input())

// The top-level import lines and input-reading lines at the start of a Python reference solution.
function pythonReading(solution) {
    const imports = [], reading = [];
    for (const line of String(solution ?? '').split('\n')) {
        if (!line.trim()) continue;
        if (/^\s/.test(line)) break; // only top-level lines
        if (/\binput\(|sys\.stdin/.test(line)) reading.push(line);
        else if (!reading.length && /^(import|from)\s/.test(line)) imports.push(line);
        else break;
    }
    return { imports, reading };
}

export function pythonStarter(solution) {
    const { imports, reading } = pythonReading(solution);
    if (!reading.length) return null;
    return `${imports.length ? `${imports.join('\n')}\n\n` : ''}if __name__ == '__main__':\n${reading.map(line => `    ${line}`).join('\n')}\n    \n`;
}

// The few input shapes the reference solutions use, as steps; anything else cannot be translated (returns null).
function parseReading(reading) {
    const steps = [];
    let count = null; // the last single number read: how long the following list is
    for (const line of reading) {
        let match;
        if ((match = /^(\w+) = int\(input\(\)\)$/.exec(line))) { steps.push({ kind: 'int', names: [match[1]] }); count = match[1]; }
        else if ((match = /^(\w+(?:, \w+)+) = map\(int, input\(\)\.split\(\)\)$/.exec(line))) steps.push({ kind: 'ints', names: match[1].split(', ') });
        else if (/^input\(\)$/.test(line)) { steps.push({ kind: 'int', names: ['n'] }); count = 'n'; }
        else if (count && (match = /^(\w+) = list\(map\(int, input\(\)\.split\(\)\)\)$/.exec(line))) steps.push({ kind: 'intList', names: [match[1]], count });
        else if (count && (match = /^(\w+) = input\(\)\.split\(\)$/.exec(line))) steps.push({ kind: 'wordList', names: [match[1]], count });
        else return null;
    }
    return steps;
}

const indent = (lines, spaces) => lines.map(line => `${' '.repeat(spaces)}${line}`.trimEnd()).join('\n');

const emitters = {
    c(step) {
        const [name] = step.names;
        switch (step.kind) {
            case 'int': return [`int ${name};`, `scanf("%d", &${name});`];
            case 'ints': return [`int ${step.names.join(', ')};`, `scanf("${step.names.map(() => '%d').join(' ')}", ${step.names.map(n => `&${n}`).join(', ')});`];
            case 'intList': return [`int *${name} = malloc(sizeof(int) * ${step.count});`, `for (int i = 0; i < ${step.count}; i++) scanf("%d", &${name}[i]);`];
            default: return [`char **${name} = malloc(sizeof(char *) * ${step.count});`, `for (int i = 0; i < ${step.count}; i++) {`, `    ${name}[i] = malloc(64);`, `    scanf("%63s", ${name}[i]);`, '}'];
        }
    },
    cpp(step) {
        const [name] = step.names;
        switch (step.kind) {
            case 'int': return [`int ${name};`, `cin >> ${name};`];
            case 'ints': return [`int ${step.names.join(', ')};`, `cin >> ${step.names.join(' >> ')};`];
            case 'intList': return [`vector<int> ${name}(${step.count});`, `for (auto &x : ${name}) cin >> x;`];
            default: return [`vector<string> ${name}(${step.count});`, `for (auto &x : ${name}) cin >> x;`];
        }
    },
    java(step) {
        const [name] = step.names;
        switch (step.kind) {
            case 'int': return [`int ${name} = in.nextInt();`];
            case 'ints': return [`int ${step.names.map(n => `${n} = in.nextInt()`).join(', ')};`];
            case 'intList': return [`int[] ${name} = new int[${step.count}];`, `for (int i = 0; i < ${step.count}; i++) ${name}[i] = in.nextInt();`];
            default: return [`String[] ${name} = new String[${step.count}];`, `for (int i = 0; i < ${step.count}; i++) ${name}[i] = in.next();`];
        }
    },
    javascript(step) {
        const [name] = step.names;
        switch (step.kind) {
            case 'int': return [`const ${name} = Number(next());`];
            case 'ints': return [`const [${step.names.join(', ')}] = [${step.names.map(() => 'Number(next())').join(', ')}];`];
            case 'intList': return [`const ${name} = Array.from({ length: ${step.count} }, () => Number(next()));`];
            default: return [`const ${name} = Array.from({ length: ${step.count} }, () => next());`];
        }
    },
};

const wrappers = {
    c: body => `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n${indent(body, 4)}\n    \n    return 0;\n}\n`,
    cpp: body => `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n${indent(body, 4)}\n    \n    return 0;\n}\n`,
    java: body => `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n${indent(body, 8)}\n        \n    }\n}\n`,
    javascript: body => `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter(Boolean);\nlet pos = 0;\nconst next = () => data[pos++];\n\n${body.join('\n')}\n\n`,
};

// Every starter a problem has, by language id. `allowed` lists the languages the problem accepts (null = all).
export function startersFor({ referenceLanguage, referenceSolution, starters }, allowed = null) {
    const found = {};
    if ((referenceLanguage ?? 'python') === 'python') {
        const python = pythonStarter(referenceSolution);
        if (python) found.python = python;
        // Other languages: only for problems that accept them (the DSA track); the Python track is Python only.
        const steps = parseReading(pythonReading(referenceSolution).reading);
        if (steps?.length) {
            for (const language of Object.keys(wrappers)) {
                if (allowed && !allowed.includes(language)) continue;
                found[language] = wrappers[language](steps.flatMap(emitters[language]));
            }
        }
    }
    return { ...found, ...(starters && typeof starters === 'object' ? starters : {}) };
}
