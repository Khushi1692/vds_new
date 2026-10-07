const fs = require('fs');
const path = require('path');

const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');
let content = fs.readFileSync(seedPath, 'utf8');

const updates = [
  { id: 'exam-bed-sheet-10', priceLabel: "'$79.00 / Carton'" },
  { id: 'exam-couch-hilo', priceLabel: "'$1,599.00 / Each'" },
  { id: 'exam-gown-regular', priceLabel: "'$68.00 / Carton'" },
  { id: 'thermasonic-gel-warmer', priceLabel: "'$294.99 / Each'" },
  { id: 'med-warming-cabinet', priceLabel: "'Price on request (quote)'" },
  { id: 'mri-safe-wheelchair', priceLabel: "'$2,499.00 / Each'" },
  { id: 'sony-upp-110hg', priceLabel: "'$9.99 / Roll'" },
  { id: 'tisora-facial-tissue', priceLabel: "'$68.99 / Pack of 50'" },
  { id: 'tisora-toilet-tissue', priceLabel: "'$49.99 / Pack of 48'" },
  { id: 'ultra-med-roll', priceLabel: "'$71.99 / Pack of 20'" },
  { id: 'us-gel-5l', priceLabel: "'$41.99 / Each'" },
  { id: 'us-gel-250ml', priceLabel: "'$5.99 / Each'" },
  { id: 'uv-probe-disinfector', priceLabel: "'Price on request (quote)'" },
  { id: 'xray-protective-apron', priceLabel: "'$349.99 / Each'" }
];

for (const update of updates) {
  const regexPriceLabel = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?priceLabel:\\s*)'[^']*'`, 'g');
  content = content.replace(regexPriceLabel, `$1${update.priceLabel}`);
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Done modifying seed.js for units');
