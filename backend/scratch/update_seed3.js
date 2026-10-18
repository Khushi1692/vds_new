const fs = require('fs');
const path = require('path');

const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');
let content = fs.readFileSync(seedPath, 'utf8');

const updates = [
  { id: 'exam-bed-sheet-10', price: 79.49, priceLabel: "'$79.49 / Box of 100'" },
  { id: 'exam-couch-hilo', price: 1699.00, priceLabel: "'$1,699.00 / Each'" },
  { id: 'exam-gown-regular', price: 76.00, priceLabel: "'$76.00 / Box of 100'" },
  { id: 'thermasonic-gel-warmer', price: 294.90, priceLabel: "'$294.90 / Each'" },
  { id: 'med-warming-cabinet', price: 2499.00, priceLabel: "'$2,499.00 / Each'" },
  { id: 'mri-safe-wheelchair', price: 2499.00, priceLabel: "'$2,499.00 / Each'" },
  { id: 'sony-upp-110hg', price: 99.99, priceLabel: "'$99.99 / Box of 10'" },
  { id: 'tisora-facial-tissue', price: 54.49, priceLabel: "'$54.49 / Box of 50'" },
  { id: 'tisora-toilet-tissue', price: 49.99, priceLabel: "'$49.99 / Box of 48'" },
  { id: 'ultra-med-roll', price: 58.90, priceLabel: "'$58.90 / Box of 20'" },
  { id: 'us-gel-5l', price: 47.75, priceLabel: "'$47.75 / Each'" },
  { id: 'us-gel-250ml', price: 63.99, priceLabel: "'$63.99 / Carton of 12'" },
  { id: 'uv-probe-disinfector', price: 0, priceLabel: "'Price on request (quote)'" },
  { id: 'xray-protective-apron', price: 399.90, priceLabel: "'$399.90 / Each'" }
];

for (const update of updates) {
  const productRegex = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?})`, 'g');
  content = content.replace(productRegex, (match) => {
    let newMatch = match;
    newMatch = newMatch.replace(/price:\s*[0-9.]+/, `price: ${update.price}`);
    newMatch = newMatch.replace(/priceLabel:\s*'[^']*'/, `priceLabel: ${update.priceLabel}`);
    newMatch = newMatch.replace(/category:\s*'[^']*'/, `category: ${update.category}`);
    return newMatch;
  });
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Done modifying seed.js');
