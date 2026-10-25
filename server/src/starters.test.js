import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startersFor } from './modules/coding/models/starters.js';

const solution = 'n = int(input())\nv = list(map(int, input().split()))\nprint(sum(v))\n';

test('Python reference reads become starters in every language the problem allows', () => {
    const all = startersFor({ referenceLanguage: 'python', referenceSolution: solution }, ['python', 'c', 'cpp', 'java', 'javascript']);
    assert.equal(all.python, "if __name__ == '__main__':\n    n = int(input())\n    v = list(map(int, input().split()))\n    \n");
    assert.match(all.c, /scanf\("%d", &n\);/);
    assert.match(all.c, /int \*v = malloc\(sizeof\(int\) \* n\);/);
    assert.match(all.cpp, /vector<int> v\(n\);/);
    assert.match(all.java, /int\[\] v = new int\[n\];/);
    assert.match(all.javascript, /const v = Array\.from\(\{ length: n \}/);
    for (const code of Object.values(all)) assert.ok(!code.includes('sum('), 'A starter must not contain the solution');
});

test('Python-only problems and untranslatable reads get no other language', () => {
    assert.deepEqual(Object.keys(startersFor({ referenceLanguage: 'python', referenceSolution: solution }, ['python'])), ['python']);
    assert.deepEqual(Object.keys(startersFor({ referenceLanguage: 'python', referenceSolution: 'text = input()\nprint(text)\n' }, null)).filter(l => l !== 'python'), []);
});

test('starters written with the problem win over generated ones', () => {
    const found = startersFor({ referenceLanguage: 'c', referenceSolution: 'int main(){}', starters: { c: 'custom' } });
    assert.deepEqual(found, { c: 'custom' });
});
