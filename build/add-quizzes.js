// Injects quiz data + a Challenge exercise block into each day file.
// Idempotent: skips files that already contain a quiz property.
// Run: node build/add-quizzes.js
const fs = require('fs');
const path = require('path');
const quizzes = require('./quiz-data.js');
const root = path.join(__dirname, '..');

const challengeBlocks = require('./challenge-data.js');

let changed = 0, skipped = 0;
for (let day = 1; day <= 30; day++) {
  const rel = `js/content/day${String(day).padStart(2, '0')}.js`;
  const full = path.join(root, rel);
  let src = fs.readFileSync(full, 'utf8');

  if (src.includes('quiz:')) { skipped++; continue; }

  // 1. inject quiz before the closing backtick of the html property:
  //    find the LAST "`\n};" pattern and insert quiz property before "};" after html closes.
  const htmlClose = src.lastIndexOf('`');
  if (htmlClose === -1) { console.error('NO BACKTICK: ' + rel); continue; }
  // html property ends at last backtick; object closes with "\n};". Insert ",\n  quiz: [...]" after the backtick's following newline.
  const insertAt = src.indexOf('\n};', htmlClose);
  if (insertAt === -1) { console.error('NO CLOSER: ' + rel); continue; }

  const quizJson = JSON.stringify(quizzes[day], null, 2).replace(/\n/g, '\n  ');
  src = src.slice(0, insertAt) + `,\n  quiz: ${quizJson}\n` + src.slice(insertAt);

  // 2. inject Challenge block before "</ul>`" end — append before final closing of html:
  //    find last key-takeaways list end and add challenge callout after it, inside html.
  const challenge = challengeBlocks[day];
  if (challenge) {
    const htmlEnd = src.lastIndexOf('`\n};');
    src = src.slice(0, htmlEnd) + challenge + '\n' + src.slice(htmlEnd);
  }

  fs.writeFileSync(full, src, 'utf8');
  changed++;
  console.log('injected: ' + rel);
}
console.log(`done: ${changed} injected, ${skipped} already had quizzes`);
