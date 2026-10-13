// One-time repair: move Challenge block from after '};' to inside the html template
// (before the closing backtick), and restore the proper '};' ending.
// Run: node build/fix-challenges.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

for (let day = 1; day <= 30; day++) {
  const full = path.join(root, `js/content/day${String(day).padStart(2, '0')}.js`);
  let src = fs.readFileSync(full, 'utf8');

  const MARK = '<h2>Challenge mode';
  const mIdx = src.lastIndexOf(MARK);
  if (mIdx === -1) { console.log('no challenge: ' + full); continue; }

  // The challenge block runs from mIdx to its closing </ul> (challenge always ends with </ul>)
  const ulEnd = src.indexOf('</ul>', mIdx);
  if (ulEnd === -1) { console.error('MALFORMED challenge in ' + full); process.exit(1); }
  const block = src.slice(mIdx, ulEnd + '</ul>'.length);

  // Remove the misplaced block (and stray blank lines after it)
  let without = src.slice(0, mIdx) + src.slice(ulEnd + '</ul>'.length).replace(/^\s*\n+/, '');

  // Ensure the file ends with the object close after the quiz, and the html template
  // closes with the backtick BEFORE which we insert the challenge block.
  // Expected shape now: ...quiz: [...]\n\n};  (challenge removed)
  const closer = without.lastIndexOf('\n};');
  if (closer === -1) { console.error('NO CLOSER: ' + full); process.exit(1); }

  // Insert block before the final backtick that closes html.
  // Find last backtick before the object close.
  const bt = without.lastIndexOf('`', closer);
  if (bt === -1) { console.error('NO BACKTICK: ' + full); process.exit(1); }

  without = without.slice(0, bt) + block + '\n' + without.slice(bt);
  fs.writeFileSync(full, without, 'utf8');
  console.log('fixed: ' + path.basename(full));
}
console.log('repair done');
