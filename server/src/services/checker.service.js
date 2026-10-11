// Output comparison modes (spec 9.2.3). Each returns true when the program's output is accepted.
const lines = text => text.replace(/\r\n?/g, '\n').split('\n');
const trimmed = text => lines(text).map(line => line.trimEnd()).join('\n').replace(/\n+$/, '');
const tokens = text => text.split(/\s+/).filter(Boolean);

function numericEqual(a, b, epsilon) {
    const x = Number(a), y = Number(b);
    if (Number.isNaN(x) || Number.isNaN(y)) return a === b;
    const diff = Math.abs(x - y);
    return diff <= epsilon || diff <= epsilon * Math.max(Math.abs(x), Math.abs(y)); // absolute or relative
}

export const CHECKERS = {
    // Ignores trailing spaces on each line and blank lines at the end. The default.
    TRIMMED: (actual, expected) => trimmed(actual) === trimmed(expected),
    // Byte for byte (line endings normalised, so Windows output is not penalised).
    EXACT: (actual, expected) => actual.replace(/\r\n?/g, '\n') === expected.replace(/\r\n?/g, '\n'),
    // Whitespace-separated tokens in order.
    TOKEN: (actual, expected) => tokens(actual).join(' ') === tokens(expected).join(' '),
    CASE_INSENSITIVE: (actual, expected) => trimmed(actual).toLowerCase() === trimmed(expected).toLowerCase(),
    // Tokens compared as numbers within epsilon; non-numeric tokens must match exactly.
    NUMERIC: (actual, expected, epsilon) => {
        const a = tokens(actual), b = tokens(expected);
        return a.length === b.length && a.every((token, i) => numericEqual(token, b[i], epsilon));
    },
    // Lines as a multiset: any order is accepted.
    UNORDERED: (actual, expected) => {
        const sort = text => trimmed(text).split('\n').map(line => line.trim()).filter(Boolean).sort();
        const a = sort(actual), b = sort(expected);
        return a.length === b.length && a.every((line, i) => line === b[i]);
    },
};

export function checkerFor(mode = 'TRIMMED', epsilon = 1e-6) {
    const check = CHECKERS[mode] ?? CHECKERS.TRIMMED;
    return (actual, expected) => check(actual, expected, epsilon);
}

// Score of a submission from its hidden-case results (spec 9.2.2). cases: [{ weight, group, passed }].
export function scoreCases(mode, cases, maxScore) {
    if (!cases.length) return 0;
    const round = value => Math.round(value * 100) / 100;
    if (mode === 'BINARY')
        return cases.every(c => c.passed) ? maxScore : 0;
    if (mode === 'GROUP') {
        const groups = new Map();
        for (const c of cases) {
            const key = c.group || `case-${groups.size}`;
            const g = groups.get(key) ?? { weight: 0, passed: true };
            g.weight += c.weight;
            g.passed &&= c.passed;
            groups.set(key, g);
        }
        const total = [...groups.values()].reduce((n, g) => n + g.weight, 0);
        return total ? round(([...groups.values()].filter(g => g.passed).reduce((n, g) => n + g.weight, 0) / total) * maxScore) : 0;
    }
    const total = cases.reduce((n, c) => n + c.weight, 0);
    return total ? round((cases.filter(c => c.passed).reduce((n, c) => n + c.weight, 0) / total) * maxScore) : 0;
}
