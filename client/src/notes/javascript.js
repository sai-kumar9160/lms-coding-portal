// JavaScript notes. Each topic is a list of blocks that NotesPage renders:
//   p / h / list / points / note / warn / table / code / diagram
// Inside code strings, "§" stands for a backtick and "¤{" for "${" so the strings can stay plain template literals.
const c = s => s.replaceAll('§', '`').replaceAll('¤{', '${').trim();
const code = (source, out, title) => ({ t: 'code', code: c(source), out: out && c(out), title });

export const javascript = {
    language: 'JavaScript',
    tagline: 'The language of the web: runs in every browser and, with Node.js, on servers too.',
    topics: [
        {
            id: 'introduction', title: 'Introduction', time: 6,
            summary: 'What JavaScript is, where it runs and how to run your first line.',
            blocks: [
                { t: 'p', text: 'JavaScript is a high-level, dynamically typed, interpreted programming language. HTML gives a web page its structure, CSS gives it style, and **JavaScript gives it behaviour**: reacting to clicks, validating forms, loading data and updating the page without a reload.' },
                { t: 'p', text: 'It started in browsers in 1995. Today the same language also runs on servers (`Node.js`), in mobile apps (React Native) and in desktop apps (Electron).' },
                { t: 'h', text: 'Where does JavaScript run?' },
                { t: 'table', head: ['Environment', 'What it is', 'Typical use'], rows: [
                    ['Browser', 'Chrome, Firefox, Safari engines (V8, SpiderMonkey, JavaScriptCore)', 'Interactive pages, DOM, events'],
                    ['Node.js', 'V8 engine outside the browser', 'APIs, scripts, tooling'],
                    ['Deno / Bun', 'Newer runtimes', 'Servers and scripts'],
                ] },
                { t: 'h', text: 'Your first program' },
                code("console.log('Hello, NextByte!');\nconsole.log(2 + 3);", "Hello, NextByte!\n5", 'hello.js'),
                { t: 'p', text: 'Open any browser, press `F12`, choose the **Console** tab and type the lines above, or save them in a file and run `node hello.js`.' },
                { t: 'h', text: 'Adding JavaScript to a page' },
                code(`<!-- 1. Inline, in the page -->
<script>
  alert('Hi');
</script>

<!-- 2. External file (preferred) -->
<script src="app.js" defer></script>`, null, 'index.html'),
                { t: 'note', text: 'Use `defer` on external scripts. The browser downloads the file while it reads the page, then runs it once the HTML is ready.' },
                { t: 'points', items: ['JavaScript adds behaviour to web pages and also runs on servers.', 'Use `console.log()` to print values while learning.', 'Put code in a separate file and load it with `<script src defer>`.'] },
            ],
        },
        {
            id: 'variables', title: 'Variables and Data Types', time: 10,
            summary: 'let, const, var and the seven primitive types, plus how values are stored in memory.',
            blocks: [
                { t: 'p', text: 'A variable is a named box that holds a value. Modern JavaScript has three ways to declare one.' },
                { t: 'table', head: ['Keyword', 'Reassign?', 'Scope', 'Use it when'], rows: [
                    ['const', 'No', 'Block', 'The default choice. The name will not point to something else.'],
                    ['let', 'Yes', 'Block', 'The value changes, such as counters and totals.'],
                    ['var', 'Yes', 'Function', 'Avoid in new code. It is the old way and has surprising rules.'],
                ] },
                code(`const school = 'NextByte';
let score = 10;
score = score + 5;      // allowed
// school = 'Other';    // TypeError: Assignment to constant variable.

console.log(school, score);`, 'NextByte 15'),
                { t: 'h', text: 'Primitive data types' },
                { t: 'table', head: ['Type', 'Example', 'Notes'], rows: [
                    ['string', "'hello', \"hi\", §tpl§", 'Text'],
                    ['number', '42, 3.14, NaN, Infinity', 'One type for integers and decimals'],
                    ['bigint', '9007199254740993n', 'Whole numbers of any size'],
                    ['boolean', 'true, false', 'Logic'],
                    ['undefined', 'undefined', 'Declared but not given a value'],
                    ['null', 'null', 'Deliberately empty'],
                    ['symbol', 'Symbol("id")', 'Unique identifiers'],
                ].map(r => r.map(x => x.replaceAll('§', '`'))) },
                code(`console.log(typeof 'hi');       // string
console.log(typeof 42);         // number
console.log(typeof true);       // boolean
console.log(typeof undefined);  // undefined
console.log(typeof null);       // object  (a famous historic bug)
console.log(typeof [1, 2]);     // object  (arrays are objects)
console.log(Array.isArray([1, 2]));  // true`, "string\nnumber\nboolean\nundefined\nobject\nobject\ntrue"),
                { t: 'h', text: 'Primitives are copied, objects are shared' },
                { t: 'p', text: 'A primitive value is stored directly in the variable, so copying it makes an independent copy. An object lives on the heap and the variable only holds a **reference** to it, so copying the variable copies the reference, not the object.' },
                { t: 'diagram', name: 'memory', caption: 'a and b hold their own copies. p1 and p2 point at the same object.' },
                code(`let a = 5;
let b = a;
b = 99;
console.log(a, b);      // 5 99  (independent)

const p1 = { name: 'Asha' };
const p2 = p1;          // same object
p2.name = 'Ravi';
console.log(p1.name);   // Ravi  (changed through p2)`, "5 99\nRavi"),
                { t: 'h', text: 'Type conversion' },
                code(`console.log('5' + 2);     // '52'  (+ joins text)
console.log('5' - 2);     // 3     (- forces a number)
console.log(Number('42')); // 42
console.log(Number('abc')); // NaN
console.log(String(10) + '!'); // '10!'
console.log(Boolean(''));  // false`, "52\n3\n42\nNaN\n10!\nfalse"),
                { t: 'warn', text: 'Falsy values are `false`, `0`, `""`, `null`, `undefined`, `NaN` and `0n`. Everything else is truthy, including `"0"`, `[]` and `{}`.' },
                code(`console.log(0 == '0');   // true   (== converts types)
console.log(0 === '0');  // false  (=== compares type too)`, "true\nfalse"),
                { t: 'note', text: 'Always use `===` and `!==`. They never convert types behind your back.' },
                { t: 'points', items: ['Start with `const`, switch to `let` only when you must reassign.', 'Seven primitive types; everything else is an object.', 'Objects are copied by reference. Primitives are copied by value.', 'Use `===` instead of `==`.'] },
            ],
        },
        {
            id: 'operators', title: 'Operators and Strings', time: 9,
            summary: 'Arithmetic, comparison, logical and the modern shortcuts ?? and ?. , plus template strings.',
            blocks: [
                { t: 'table', head: ['Group', 'Operators', 'Example'], rows: [
                    ['Arithmetic', '+ - * / % **', '7 % 3 → 1,  2 ** 3 → 8'],
                    ['Assignment', '= += -= *= /=', 'x += 2'],
                    ['Comparison', '=== !== < > <= >=', '5 >= 5 → true'],
                    ['Logical', '&& || !', 'a && b'],
                    ['Nullish / optional', '?? ?.', 'name ?? "Guest"'],
                    ['Ternary', 'cond ? a : b', 'age >= 18 ? "adult" : "minor"'],
                ] },
                code(`let n = 7;
n++;                        // 8
console.log(n % 3);         // 2
console.log(2 ** 10);       // 1024
console.log(0.1 + 0.2);     // 0.30000000000000004 (floating point)`, "2\n1024\n0.30000000000000004"),
                { t: 'h', text: 'Short-circuit and nullish operators' },
                code(`const name = '';
console.log(name || 'Guest');   // Guest   (|| treats '' as missing)
console.log(name ?? 'Guest');   // ''      (?? only replaces null / undefined)

const user = { profile: null };
console.log(user.profile?.email);  // undefined, no crash`, "Guest\n(empty line)\nundefined"),
                { t: 'h', text: 'Strings and template literals' },
                code(`const user = 'Asha', marks = 92;
console.log(§Hello ¤{user}, you scored ¤{marks / 100 * 100}%§);

const s = 'JavaScript';
console.log(s.length);            // 10
console.log(s.toUpperCase());     // JAVASCRIPT
console.log(s.slice(0, 4));       // Java
console.log(s.includes('Script'));// true
console.log(s.split('a'));        // [ 'J', 'v', 'Script' ]
console.log('  hi  '.trim());     // hi`, "Hello Asha, you scored 92%\n10\nJAVASCRIPT\nJava\ntrue\n[ 'J', 'v', 'Script' ]\nhi"),
                { t: 'points', items: ['`%` gives the remainder and `**` raises to a power.', '`??` replaces only null and undefined; `||` replaces any falsy value.', '`?.` stops safely when something is null or undefined.', 'Template strings use backticks and `${}` to embed values.'] },
            ],
        },
        {
            id: 'conditions', title: 'Conditions', time: 7,
            summary: 'Make decisions with if, else, switch and the ternary operator.',
            blocks: [
                code(`const marks = 72;

if (marks >= 90) {
  console.log('Grade A');
} else if (marks >= 60) {
  console.log('Grade B');
} else {
  console.log('Needs work');
}`, 'Grade B'),
                { t: 'h', text: 'switch' },
                code(`const day = 3;
switch (day) {
  case 1:  console.log('Mon'); break;
  case 2:  console.log('Tue'); break;
  case 3:  console.log('Wed'); break;
  default: console.log('Other');
}`, 'Wed'),
                { t: 'warn', text: 'Forget `break` and execution "falls through" into the next case.' },
                { t: 'h', text: 'Ternary' },
                code(`const age = 20;
const label = age >= 18 ? 'adult' : 'minor';
console.log(label);`, 'adult'),
                { t: 'points', items: ['Conditions use truthy and falsy values, not only true and false.', 'Use `switch` when comparing one value to many constants.', 'Use the ternary for short value choices, not long logic.'] },
            ],
        },
        {
            id: 'loops', title: 'Loops', time: 8,
            summary: 'for, while, for...of and for...in, with break and continue.',
            blocks: [
                code(`for (let i = 1; i <= 3; i++) {
  console.log('Round', i);
}

let n = 3;
while (n > 0) {
  console.log(n);
  n--;
}`, "Round 1\nRound 2\nRound 3\n3\n2\n1"),
                { t: 'h', text: 'Looping over collections' },
                code(`const fruits = ['apple', 'mango', 'kiwi'];

for (const f of fruits) console.log(f);        // values of an array

const marks = { maths: 90, physics: 80 };
for (const subject in marks) {                 // keys of an object
  console.log(subject, marks[subject]);
}`, "apple\nmango\nkiwi\nmaths 90\nphysics 80"),
                { t: 'table', head: ['Loop', 'Use for'], rows: [
                    ['for', 'You know how many times'],
                    ['while', 'Repeat until a condition changes'],
                    ['for...of', 'Values of arrays, strings, Maps, Sets'],
                    ['for...in', 'Keys of an object'],
                ] },
                code(`for (let i = 1; i <= 6; i++) {
  if (i === 2) continue;   // skip this round
  if (i === 5) break;      // leave the loop
  console.log(i);
}`, "1\n3\n4"),
                { t: 'warn', text: 'Do not use `for...in` on arrays. It loops over keys (as strings) and can include extra properties. Use `for...of`.' },
                { t: 'points', items: ['`break` leaves a loop; `continue` skips to the next round.', 'Prefer `for...of` for arrays.', 'Make sure a `while` loop eventually makes its condition false.'] },
            ],
        },
        {
            id: 'functions', title: 'Functions', time: 12,
            summary: 'Declarations, arrow functions, parameters, return values and first-class functions.',
            blocks: [
                { t: 'p', text: 'A function is a reusable block of code. Write it once, call it many times with different inputs.' },
                code(`// Function declaration
function add(a, b) {
  return a + b;
}

// Function expression
const multiply = function (a, b) { return a * b; };

// Arrow function
const square = x => x * x;

console.log(add(2, 3), multiply(4, 5), square(6));`, '5 20 36'),
                { t: 'h', text: 'Default, rest and spread' },
                code(`function greet(name = 'Guest') {
  return 'Hello ' + name;
}
console.log(greet());          // Hello Guest

function total(...nums) {      // rest: gather arguments into an array
  return nums.reduce((s, n) => s + n, 0);
}
console.log(total(1, 2, 3, 4)); // 10

const parts = [1, 2, 3];
console.log(Math.max(...parts)); // spread: 3`, "Hello Guest\n10\n3"),
                { t: 'h', text: 'Functions are values' },
                { t: 'p', text: 'In JavaScript a function can be stored in a variable, passed to another function and returned from one. A function that receives another function is called a **higher-order function**, and the function passed in is a **callback**.' },
                code(`function repeat(times, action) {
  for (let i = 0; i < times; i++) action(i);
}
repeat(3, i => console.log('Step', i));`, "Step 0\nStep 1\nStep 2"),
                { t: 'note', text: 'A function without a `return` statement returns `undefined`. `return` also ends the function immediately.' },
                { t: 'points', items: ['Arrow functions are short and are the usual choice for callbacks.', 'Use default values instead of checking for missing arguments.', 'Rest (`...args`) collects values; spread (`...arr`) expands them.', 'Functions are values and can be passed around.'] },
            ],
        },
        {
            id: 'arrays', title: 'Arrays', time: 14,
            summary: 'Ordered lists and the methods you use every day: map, filter, reduce, find, sort.',
            blocks: [
                code(`const nums = [10, 20, 30];
console.log(nums[0], nums.length);   // 10 3

nums.push(40);        // add to end
nums.pop();           // remove from end
nums.unshift(5);      // add to start
nums.shift();         // remove from start
console.log(nums);    // [ 10, 20, 30 ]`, "10 3\n[ 10, 20, 30 ]"),
                { t: 'h', text: 'The big three: map, filter, reduce' },
                { t: 'p', text: 'These methods do not change the original array. They return a new result, which keeps your code predictable.' },
                code(`const marks = [35, 72, 90, 48];

const curved = marks.map(m => m + 5);          // transform each item
const passed = marks.filter(m => m >= 50);     // keep some items
const total  = marks.reduce((sum, m) => sum + m, 0); // combine into one value

console.log(curved);  // [ 40, 77, 95, 53 ]
console.log(passed);  // [ 72, 90 ]
console.log(total);   // 245`, "[ 40, 77, 95, 53 ]\n[ 72, 90 ]\n245"),
                { t: 'table', head: ['Method', 'Returns', 'Example'], rows: [
                    ['find', 'First match or undefined', '[3,8,5].find(n => n > 4) → 8'],
                    ['some / every', 'true or false', '[1,2].some(n => n > 1) → true'],
                    ['includes', 'true or false', '[1,2].includes(2) → true'],
                    ['indexOf', 'Position or -1', '["a","b"].indexOf("b") → 1'],
                    ['slice', 'Copy of a part', '[1,2,3].slice(1) → [2,3]'],
                    ['concat / spread', 'Joined copy', '[...a, ...b]'],
                    ['sort', 'Sorts in place', 'see warning below'],
                ] },
                code(`const scores = [100, 25, 9, 1000];
console.log([...scores].sort());              // [ 100, 1000, 25, 9 ]  (as text!)
console.log([...scores].sort((a, b) => a - b)); // [ 9, 25, 100, 1000 ]`, "[ 100, 1000, 25, 9 ]\n[ 9, 25, 100, 1000 ]"),
                { t: 'warn', text: '`sort()` without a compare function sorts as text, so 100 comes before 25. Always pass `(a, b) => a - b` for numbers. It also changes the original array, so copy first with `[...arr]`.' },
                { t: 'h', text: 'Chaining' },
                code(`const students = [
  { name: 'Asha', marks: 82 },
  { name: 'Ravi', marks: 45 },
  { name: 'Meena', marks: 91 },
];

const toppers = students
  .filter(s => s.marks >= 80)
  .map(s => s.name)
  .join(', ');

console.log(toppers);`, 'Asha, Meena'),
                { t: 'points', items: ['`map` transforms, `filter` selects, `reduce` combines.', 'Arrays are objects, so they are copied by reference.', 'Copy with `[...arr]` before methods that mutate, such as `sort` and `reverse`.'] },
            ],
        },
        {
            id: 'objects', title: 'Objects and Destructuring', time: 12,
            summary: 'Key-value data, nested objects, destructuring, JSON and the Map and Set collections.',
            blocks: [
                { t: 'p', text: 'An object stores related data as **key: value** pairs called properties. Values can be any type, including functions (called methods).' },
                code(`const student = {
  name: 'Asha',
  age: 20,
  skills: ['HTML', 'JS'],
  address: { city: 'Hyderabad' },
  intro() {
    return §I am ¤{this.name} from ¤{this.address.city}§;
  },
};

console.log(student.name);          // dot access
console.log(student['age']);        // bracket access
console.log(student.intro());
student.email = 'asha@example.com'; // add
delete student.age;                 // remove
console.log('age' in student);      // false`, "Asha\n20\nI am Asha from Hyderabad\nfalse"),
                { t: 'h', text: 'Destructuring and spread' },
                code(`const { name, address: { city } } = student;   // pull out properties
console.log(name, city);                          // Asha Hyderabad

const [first, , third] = ['a', 'b', 'c'];         // arrays too
console.log(first, third);                        // a c

const updated = { ...student, name: 'Ravi' };     // copy with a change
console.log(updated.name, student.name);          // Ravi Asha`, "Asha Hyderabad\na c\nRavi Asha"),
                { t: 'h', text: 'Looping through an object' },
                code(`const marks = { maths: 90, physics: 80 };
console.log(Object.keys(marks));    // [ 'maths', 'physics' ]
console.log(Object.values(marks));  // [ 90, 80 ]
for (const [subject, mark] of Object.entries(marks)) {
  console.log(subject, mark);
}`, "[ 'maths', 'physics' ]\n[ 90, 80 ]\nmaths 90\nphysics 80"),
                { t: 'h', text: 'JSON' },
                code(`const text = JSON.stringify({ id: 1, tags: ['a', 'b'] });
console.log(text);                  // {"id":1,"tags":["a","b"]}
console.log(JSON.parse(text).tags); // [ 'a', 'b' ]`, '{"id":1,"tags":["a","b"]}\n[ \'a\', \'b\' ]'),
                { t: 'h', text: 'Map and Set' },
                code(`const seen = new Set([1, 2, 2, 3, 3]);
console.log(seen.size, [...seen]);   // 3 [ 1, 2, 3 ]  (no duplicates)

const stock = new Map();
stock.set('apple', 12).set('kiwi', 4);
console.log(stock.get('apple'), stock.has('mango'));  // 12 false`, "3 [ 1, 2, 3 ]\n12 false"),
                { t: 'warn', text: 'Spread `{ ...obj }` makes a **shallow** copy. Nested objects are still shared. Use `structuredClone(obj)` for a deep copy.' },
                { t: 'points', items: ['Objects hold key-value pairs; access with `.key` or `["key"]`.', 'Destructuring unpacks values into variables in one line.', '`JSON.stringify` and `JSON.parse` convert between objects and text.', 'Use `Set` for unique values and `Map` for key-value lookups with any key type.'] },
            ],
        },
        {
            id: 'scope', title: 'Scope and Hoisting', time: 9,
            summary: 'Where a variable can be seen, how the scope chain works, and why var surprises people.',
            blocks: [
                { t: 'p', text: '**Scope** decides where a variable is visible. An inner scope can see the variables of every scope around it, but not the other way round. When a name is not found, JavaScript looks outward step by step. This path is the **scope chain**.' },
                { t: 'diagram', name: 'scope', caption: 'inner() can read i, o and g. outer() cannot read i.' },
                code(`const g = 'global';

function outer() {
  const o = 'outer';
  function inner() {
    const i = 'inner';
    console.log(i, o, g);   // finds all three
  }
  inner();
  // console.log(i);        // ReferenceError: i is not defined
}
outer();`, 'inner outer global'),
                { t: 'h', text: 'Block scope: let and const versus var' },
                code(`if (true) {
  let a = 1;
  var b = 2;
}
// console.log(a);  // ReferenceError (let stays inside the block)
console.log(b);     // 2 (var leaks out of the block)`, '2'),
                { t: 'h', text: 'Hoisting' },
                { t: 'p', text: 'Before running, JavaScript moves declarations to the top of their scope. Function declarations are fully available early; `var` is available but `undefined`; `let` and `const` exist but cannot be used until their line runs (the **temporal dead zone**).' },
                code(`console.log(sayHi());   // works: 'hi'
function sayHi() { return 'hi'; }

console.log(x);         // undefined (var is hoisted, value is not)
var x = 5;

// console.log(y);      // ReferenceError (temporal dead zone)
let y = 5;`, 'hi\nundefined'),
                { t: 'points', items: ['Inner scopes see outer variables, never the reverse.', '`let` and `const` are block scoped; `var` is function scoped.', 'Declare variables before you use them and hoisting will never matter.'] },
            ],
        },
        {
            id: 'closures', title: 'Closures', time: 9,
            summary: 'A function that remembers the variables around it, even after the outer function has finished.',
            blocks: [
                { t: 'p', text: 'A **closure** is a function bundled with the variables from the place where it was created. The inner function keeps access to them even after the outer function has returned. Closures give you private data and are behind callbacks, event handlers and many patterns in React.' },
                code(`function makeCounter() {
  let count = 0;            // private: nothing outside can touch it
  return function () {
    count++;
    return count;
  };
}

const a = makeCounter();
const b = makeCounter();
console.log(a(), a(), a());  // 1 2 3
console.log(b());            // 1  (its own separate count)`, "1 2 3\n1"),
                { t: 'h', text: 'A useful pattern: function factories' },
                code(`const multiplyBy = factor => n => n * factor;

const double = multiplyBy(2);
const triple = multiplyBy(3);
console.log(double(10), triple(10));  // 20 30`, '20 30'),
                { t: 'h', text: 'The classic loop trap' },
                code(`for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// prints 3 3 3 : one shared i, already 3 when the timers fire

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
// prints 0 1 2 : let makes a fresh j for each round`, "3\n3\n3\n0\n1\n2"),
                { t: 'points', items: ['A closure remembers the variables from where it was defined.', 'Each call to the outer function creates a new, separate set of variables.', 'Use `let` in loops that create callbacks.'] },
            ],
        },
        {
            id: 'classes', title: 'Classes and Prototypes', time: 12,
            summary: 'Blueprints for objects, inheritance with extends, and the prototype chain underneath.',
            blocks: [
                code(`class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return §¤{this.name} makes a sound§;
  }
}

class Dog extends Animal {
  speak() {
    return super.speak() + ' - Woof!';
  }
}

const d = new Dog('Rex');
console.log(d.speak());
console.log(d instanceof Animal);   // true`, "Rex makes a sound - Woof!\ntrue"),
                { t: 'h', text: 'The prototype chain' },
                { t: 'p', text: 'Under the hood every object has a hidden link to another object, its **prototype**. When you read `d.speak`, JavaScript looks on `d`, then on `Dog.prototype`, then `Animal.prototype`, then `Object.prototype`, and stops at `null`. `class` is a cleaner way of writing this same mechanism.' },
                { t: 'diagram', name: 'prototype', caption: 'Property lookup walks the chain until it finds the name or reaches null.' },
                { t: 'h', text: 'Private fields, getters and static members' },
                code(`class Account {
  #balance = 0;                 // private
  static bank = 'NextByte Bank';

  deposit(x) { this.#balance += x; return this; }
  get balance() { return this.#balance; }
}

const acc = new Account().deposit(500).deposit(250);
console.log(acc.balance, Account.bank);   // 750 'NextByte Bank'
// acc.#balance  -> SyntaxError`, "750 NextByte Bank"),
                { t: 'h', text: 'Understanding this' },
                { t: 'p', text: '`this` is decided by **how a function is called**. In a method call it is the object before the dot. Arrow functions do not have their own `this`; they use the one around them.' },
                code(`const timer = {
  seconds: 0,
  start() {
    setInterval(() => { this.seconds++; }, 1000);  // arrow keeps 'this' = timer
  },
};`),
                { t: 'points', items: ['A class is a blueprint; `new` creates an object from it.', '`extends` inherits, `super` calls the parent.', 'Objects look up missing properties along the prototype chain.', 'Use `#name` for private fields.'] },
            ],
        },
        {
            id: 'async', title: 'Asynchronous JavaScript', time: 16,
            summary: 'The event loop, callbacks, Promises, async/await and fetch.',
            blocks: [
                { t: 'p', text: 'JavaScript runs **one thing at a time** on a single thread. Slow work such as network calls and timers is handed to the browser, and its result comes back later through a queue. This keeps the page responsive instead of freezing while it waits.' },
                { t: 'h', text: 'The event loop' },
                { t: 'diagram', name: 'eventloop', caption: 'The event loop moves a waiting callback to the call stack only when the stack is empty.' },
                code(`console.log('1: start');

setTimeout(() => console.log('2: timeout'), 0);

Promise.resolve().then(() => console.log('3: promise'));

console.log('4: end');`, "1: start\n4: end\n3: promise\n2: timeout"),
                { t: 'note', text: 'Why that order? Normal code runs first (1, 4). Then **microtasks** such as Promise callbacks (3) run before the next **task** such as a timer (2), even a timer set to 0.' },
                { t: 'h', text: 'Promises' },
                { t: 'p', text: 'A Promise stands for a value that will arrive later. It is **pending**, then either **fulfilled** with a value or **rejected** with an error.' },
                code(`const wait = (ms, value) =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

wait(500, 'data ready')
  .then(v => { console.log(v); return v.toUpperCase(); })
  .then(v => console.log(v))
  .catch(e => console.log('failed', e))
  .finally(() => console.log('done'));`, "data ready\nDATA READY\ndone"),
                { t: 'h', text: 'async and await' },
                { t: 'p', text: '`async`/`await` is Promise code that reads like normal top-to-bottom code. `await` pauses only the async function, not the whole program.' },
                code(`async function loadUser(id) {
  try {
    const res = await fetch(§https://api.example.com/users/¤{id}§);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const user = await res.json();
    console.log(user.name);
  } catch (err) {
    console.log('Could not load:', err.message);
  }
}
loadUser(1);`),
                { t: 'h', text: 'Running tasks together' },
                code(`const [a, b] = await Promise.all([wait(300, 'A'), wait(300, 'B')]);
console.log(a, b);   // A B  after ~300 ms, not 600`, 'A B'),
                { t: 'warn', text: '`fetch` does not reject on HTTP errors like 404 or 500. Check `res.ok` yourself, as shown above.' },
                { t: 'points', items: ['One thread, so slow work is delegated and its callback queued.', 'Promise callbacks (microtasks) run before timers (tasks).', 'Use `async/await` with `try/catch` for readable error handling.', '`Promise.all` runs independent work in parallel.'] },
            ],
        },
        {
            id: 'dom', title: 'The DOM and Events', time: 13,
            summary: 'Select elements, change the page and respond to clicks and typing.',
            blocks: [
                { t: 'p', text: 'The **DOM** (Document Object Model) is the browser\'s live tree of your HTML. JavaScript can read and change this tree, and the page updates instantly.' },
                { t: 'diagram', name: 'dom', caption: 'Every tag becomes a node. document.querySelector finds one of them.' },
                { t: 'h', text: 'Selecting and changing elements' },
                code(`<h1 id="title">Hello</h1>
<ul id="list"></ul>
<button id="add">Add item</button>

<script>
  const title = document.querySelector('#title');
  title.textContent = 'Welcome to NextByte';
  title.classList.add('highlight');
  title.style.color = 'teal';

  const list = document.querySelector('#list');
  const li = document.createElement('li');
  li.textContent = 'New item';
  list.append(li);
</script>`, null, 'index.html'),
                { t: 'h', text: 'Events' },
                code(`document.querySelector('#add').addEventListener('click', () => {
  const li = document.createElement('li');
  li.textContent = 'Item ' + (list.children.length + 1);
  list.append(li);
});

document.querySelector('#name').addEventListener('input', e => {
  console.log('Typed:', e.target.value);
});`),
                { t: 'h', text: 'Event delegation' },
                { t: 'p', text: 'Instead of adding a listener to every list item, add one to the parent. Events **bubble** up from the clicked element, so the parent can handle them all, including items added later.' },
                code(`list.addEventListener('click', e => {
  if (e.target.matches('li')) e.target.classList.toggle('done');
});`),
                { t: 'h', text: 'Form handling' },
                code(`form.addEventListener('submit', e => {
  e.preventDefault();                    // stop the page reloading
  const data = Object.fromEntries(new FormData(form));
  console.log(data);                     // { name: 'Asha', email: '...' }
});`),
                { t: 'warn', text: 'Never put untrusted text into `innerHTML`. It can run injected scripts (XSS). Use `textContent` for plain text.' },
                { t: 'points', items: ['`querySelector` finds elements; `textContent`, `classList` and `style` change them.', '`addEventListener` attaches behaviour to events like click, input and submit.', 'Events bubble, so one listener on a parent can serve many children.'] },
            ],
        },
        {
            id: 'modern', title: 'Modules, Errors and Modern Features', time: 10,
            summary: 'import and export, try/catch, optional chaining and other everyday ES6+ tools.',
            blocks: [
                { t: 'h', text: 'Modules' },
                { t: 'p', text: 'Modules let you split code into files. Each file has its own scope and shares only what it exports.' },
                code(`// math.js
export const PI = 3.14159;
export function area(r) { return PI * r * r; }
export default function hello() { return 'hi'; }

// main.js
import hello, { PI, area } from './math.js';
console.log(area(2), PI);`, null, 'math.js and main.js'),
                { t: 'note', text: 'In a browser use `<script type="module" src="main.js">`. In Node.js use the `.mjs` extension or set `"type": "module"` in package.json.' },
                { t: 'h', text: 'Handling errors' },
                code(`try {
  JSON.parse('{ bad json');
} catch (err) {
  console.log(err.name);        // SyntaxError
} finally {
  console.log('always runs');
}

function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}`, "SyntaxError\nalways runs"),
                { t: 'h', text: 'Handy modern syntax' },
                code(`const user = { name: 'Asha', address: null };

console.log(user.address?.city ?? 'unknown');   // unknown
console.log([1, [2, [3]]].flat(Infinity));      // [ 1, 2, 3 ]
console.log(Object.fromEntries([['a', 1]]));    // { a: 1 }
console.log('a-b-c'.replaceAll('-', '+'));      // a+b+c
console.log([1, 2, 3].at(-1));                  // 3`, "unknown\n[ 1, 2, 3 ]\n{ a: 1 }\na+b+c\n3"),
                { t: 'h', text: 'Good habits' },
                { t: 'list', items: ['Turn on strict thinking: declare every variable with `const` or `let`.', 'Prefer `===`, small functions and clear names.', 'Handle errors from anything that can fail: network, JSON, user input.', 'Format with Prettier and check with ESLint.'] },
                { t: 'points', items: ['`export`/`import` split code into files.', '`try/catch/finally` keeps errors from crashing your program.', '`?.` and `??` remove a lot of manual null checks.'] },
            ],
        },
    ],
};

// Small diagrams drawn as inline SVG; NoteDiagram in NotesPage renders them.
export const diagrams = {
    memory: {
        w: 640, h: 235,
        texts: [{ x: 20, y: 22, text: 'STACK (variables)', head: true }, { x: 410, y: 22, text: 'HEAP (objects)', head: true }],
        boxes: [
            { x: 20, y: 36, w: 220, h: 36, text: 'a = 5' }, { x: 20, y: 80, w: 220, h: 36, text: 'b = 99   (own copy)' },
            { x: 20, y: 130, w: 220, h: 36, text: 'p1 = ref', tone: 'b' }, { x: 20, y: 174, w: 220, h: 36, text: 'p2 = ref', tone: 'b' },
            { x: 410, y: 120, w: 210, h: 60, text: "{ name: 'Ravi' }", tone: 'c' },
        ],
        arrows: [{ from: [240, 148], to: [408, 142] }, { from: [240, 192], to: [408, 160] }],
    },
    scope: {
        w: 640, h: 260,
        boxes: [
            { x: 10, y: 10, w: 620, h: 240, text: 'Global scope      const g', top: true, tone: 'plain' },
            { x: 40, y: 55, w: 560, h: 180, text: 'function outer      const o', top: true, tone: 'b' },
            { x: 70, y: 100, w: 500, h: 110, text: 'function inner      const i', top: true, tone: 'c' },
        ],
        texts: [{ x: 90, y: 168, text: 'looks up: i  →  o  →  g', accent: true }],
    },
    prototype: {
        w: 700, h: 150,
        boxes: [
            { x: 10, y: 50, w: 120, h: 50, text: 'd (Dog obj)', tone: 'a' }, { x: 170, y: 50, w: 130, h: 50, text: 'Dog.prototype', tone: 'b' },
            { x: 340, y: 50, w: 150, h: 50, text: 'Animal.prototype', tone: 'b' }, { x: 530, y: 50, w: 150, h: 50, text: 'Object.prototype', tone: 'c' },
        ],
        arrows: [{ from: [130, 75], to: [170, 75] }, { from: [300, 75], to: [340, 75] }, { from: [490, 75], to: [530, 75] }],
        texts: [{ x: 600, y: 128, text: '→ null', accent: true }, { x: 10, y: 28, text: '[[Prototype]] links, searched left to right', head: true }],
    },
    eventloop: {
        w: 700, h: 280,
        boxes: [
            { x: 10, y: 20, w: 190, h: 240, text: 'Call stack', top: true, tone: 'b' },
            { x: 500, y: 20, w: 190, h: 70, text: 'Web APIs (timers, fetch, DOM)', tone: 'a' },
            { x: 500, y: 110, w: 190, h: 60, text: 'Microtask queue (Promises)', tone: 'c' },
            { x: 500, y: 190, w: 190, h: 70, text: 'Task queue (timers, clicks)', tone: 'c' },
            { x: 260, y: 105, w: 180, h: 70, text: 'Event loop', tone: 'plain' },
        ],
        arrows: [{ from: [200, 55], to: [498, 55], label: 'slow work handed off' }, { from: [498, 140], to: [440, 140] }, { from: [498, 225], to: [440, 160] }, { from: [260, 140], to: [202, 140], label: 'when empty' }],
    },
    dom: {
        w: 640, h: 270,
        boxes: [
            { x: 270, y: 10, w: 100, h: 34, text: 'html', tone: 'b' },
            { x: 150, y: 80, w: 100, h: 34, text: 'head', tone: 'a' }, { x: 390, y: 80, w: 100, h: 34, text: 'body', tone: 'a' },
            { x: 80, y: 150, w: 100, h: 34, text: 'title' }, { x: 300, y: 150, w: 100, h: 34, text: 'h1', tone: 'c' }, { x: 470, y: 150, w: 100, h: 34, text: 'ul', tone: 'c' },
            { x: 400, y: 220, w: 80, h: 32, text: 'li' }, { x: 520, y: 220, w: 80, h: 32, text: 'li' },
        ],
        arrows: [
            { from: [320, 44], to: [200, 80], line: true }, { from: [320, 44], to: [440, 80], line: true },
            { from: [200, 114], to: [130, 150], line: true }, { from: [440, 114], to: [350, 150], line: true }, { from: [440, 114], to: [520, 150], line: true },
            { from: [520, 184], to: [440, 220], line: true }, { from: [520, 184], to: [560, 220], line: true },
        ],
    },
};
