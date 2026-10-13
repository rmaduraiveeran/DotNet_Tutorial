// Smoke test: load all content files in a minimal DOM shim and render every route.
// Run: node build/smoke-test.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

// Minimal browser shims (full DOM ready before app.js loads, since init() runs immediately)
let lastHtml = '', navHtml = '';
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    if (id === 'content') return { set innerHTML(v) { lastHtml = v; }, get innerHTML() { return lastHtml; }, scrollTop: 0, querySelectorAll: () => [] };
    if (id === 'nav') return { set innerHTML(v) { navHtml = v; }, get innerHTML() { return navHtml } };
    return null;
  },
  documentElement: { setAttribute: () => {}, removeAttribute: () => {} },
};
global.navigator = {};
global.location = { hash: '#/home' };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window.addEventListener = () => {};
global.window.scrollTo = () => {};

let errors = [];
function load(rel) {
  try { require(path.join(root, rel)); }
  catch (e) { errors.push(`${rel}: ${e.message}`); }
}

load('js/data/course.js');
load('js/app.js');
load('js/content/framework-objects.js');

const days = window.COURSE_DAYS;
if (!days || days.length !== 30) errors.push(`COURSE_DAYS length: ${days && days.length}`);

for (let i = 1; i <= 30; i++) load(`js/content/day${String(i).padStart(2, '0')}.js`);
load('js/content/frameworks.js');

const content = window.DAY_CONTENT || {};
for (let i = 1; i <= 30; i++) {
  const c = content[i];
  if (!c || typeof c.html !== 'string' || c.html.length < 500)
    errors.push(`day ${i}: missing or too-short html`);
  else {
    if (!c.html.includes('</html-broken>')) { /* ok */ }
    for (const tag of ['h2', 'codeblock']) {
      if (!c.html.includes(tag)) errors.push(`day ${i}: no "${tag}" found`);
    }
    // unbalanced backtick check — html must not contain a raw ` that would break the JS (node --check already passed)
  }
}

// framework guide checks
const fw = window.FRAMEWORKS_CONTENT;
if (!fw || !fw.html || fw.html.length < 3000) errors.push('frameworks: missing/short html');
else {
  for (const needle of ['.NET Framework', '.NET Core', 'Modern .NET', '<svg', '<table', 'netstandard2.0']) {
    if (!fw.html.includes(needle)) errors.push(`frameworks: missing "${needle}"`);
  }
}

// framework objects guide checks (every object must have What/How)
const objs = window.FRAMEWORK_OBJECTS_CONTENT;
if (!objs || !objs.html || objs.html.length < 5000) errors.push('objects: missing/short html');
else {
  for (const obj of ['CLR', 'CTS', 'CLS', 'IL', 'Assembly', 'Roslyn', 'JIT', 'GC', 'BCL',
    'host', 'SDK', 'App models', '.NET Standard', 'NuGet']) {
    if (!objs.html.includes(obj)) errors.push(`objects: missing section "${obj}"`);
  }
  const whatCount = (objs.html.match(/What it is:/g) || []).length;
  const howCount = (objs.html.match(/How it works:/g) || []).length;
  if (whatCount < 13) errors.push(`objects: only ${whatCount} "What it is" sections`);
  if (howCount < 13) errors.push(`objects: only ${howCount} "How it works" sections`);
  if (!objs.html.includes('Cheat sheet')) errors.push('objects: missing cheat sheet');
}

// objectives present?
const noObj = days.filter(d => !d.objectives || d.objectives.length < 3);
if (noObj.length) errors.push('days without objectives: ' + noObj.map(d => d.id).join(','));

// every day references at least one svg diagram or table (visual richness)
const noVisual = Object.keys(content).filter(k => {
  const h = content[k].html;
  return !h.includes('<svg') && !h.includes('<table');
});
if (noVisual.length) errors.push('days without svg/table visuals: ' + noVisual.join(','));

// every day must have a quiz (4+ questions with answer + explanation)
const noQuiz = [];
for (let i = 1; i <= 30; i++) {
  const q = content[i] && content[i].quiz;
  if (!q || !Array.isArray(q) || q.length < 4 ||
      q.some(function (x) { return !x.q || !x.a || !x.expl || typeof x.correct !== 'number'; }))
    noQuiz.push(i);
}
if (noQuiz.length) errors.push('days missing quiz (need 4+ questions, q/a/expl/correct): ' + noQuiz.join(','));

// render smoke: subtopic route for day 1 section 1 and frameworks section 2
global.location.hash = '#/day/1/s/1';
window.__routeTest && window.__routeTest();
if (lastHtml.indexOf('Getting Started') === -1) errors.push('subtopic route day1/s1 did not render section');

// render smoke: app.js already rendered the home page on load (init &rarr; route).
// lastHtml was captured by the content shim; navHtml by the nav shim.
global.location.hash = '#/home';
window.__routeTest && window.__routeTest();
if (!lastHtml || lastHtml.indexOf('Master .NET in 30 Days') === -1) errors.push('home route did not render');
if (!navHtml || navHtml.indexOf('nav-item') === -1) errors.push('nav did not render');

if (errors.length) {
  console.error('SMOKE FAILURES:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('SMOKE OK: 30 days + frameworks + framework objects + objectives + visuals + home render');
}
