const fs = require('fs');
const path = require('path');

const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');
let content = fs.readFileSync(seedPath, 'utf8');

const updates = [
  { id: 'exam-bed-sheet-10', price: 79.00, priceLabel: "'$79.00'", category: "'Linen & Gowns'" },
  { id: 'exam-couch-hilo', price: 1599.00, priceLabel: "'$1,599.00'", category: "'Clinic Furniture'" },
  { id: 'exam-gown-regular', price: 68.00, priceLabel: "'$68.00'", category: "'Linen & Gowns'" },
  { id: 'thermasonic-gel-warmer', price: 294.99, priceLabel: "'$294.99'", category: "'Ultrasound / Imaging'" },
  { id: 'med-warming-cabinet', price: 0, priceLabel: "'Price on request (quote)'", category: "'Ultrasound / Imaging'" },
  { id: 'mri-safe-wheelchair', price: 2499.00, priceLabel: "'$2,499.00'", category: "'Clinic Furniture'" },
  { id: 'sony-upp-110hg', price: 9.99, priceLabel: "'$9.99'", category: "'Ultrasound / Imaging'" },
  { id: 'tisora-facial-tissue', price: 68.99, priceLabel: "'$68.99'", category: "'Paper & Hygiene'" },
  { id: 'tisora-toilet-tissue', price: 49.99, priceLabel: "'$49.99'", category: "'Paper & Hygiene'" },
  { id: 'ultra-med-roll', price: 71.99, priceLabel: "'$71.99'", category: "'Paper & Hygiene'" },
  { id: 'us-gel-5l', price: 41.99, priceLabel: "'$41.99'", category: "'Ultrasound / Imaging'" },
  { id: 'us-gel-250ml', price: 5.99, priceLabel: "'$5.99'", category: "'Ultrasound / Imaging'" },
  { id: 'uv-probe-disinfector', price: 0, priceLabel: "'Price on request (quote)'", category: "'Ultrasound / Imaging'" },
  { id: 'xray-protective-apron', price: 349.99, priceLabel: "'$349.99'", category: "'Ultrasound / Imaging'" }
];

for (const update of updates) {
  const regexPrice = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?price:\\s*)[0-9.]+`, 'g');
  const regexPriceLabel = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?priceLabel:\\s*)'[^']*'`, 'g');
  const regexCategory = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?category:\\s*)'[^']*'`, 'g');
  
  content = content.replace(regexPrice, `$1${update.price}`);
  content = content.replace(regexPriceLabel, `$1${update.priceLabel}`);
  content = content.replace(regexCategory, `$1${update.category}`);
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Done modifying seed.js');
