const fs = require('fs');
const path = require('path');

const destDir = path.join('f:', 'vds new', 'frontend', 'public', 'images', 'products');
const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');

let seedContent = fs.readFileSync(seedPath, 'utf8');

const ids = [
  'exam-bed-sheet-10',
  'exam-couch-hilo',
  'exam-gown-regular',
  'thermasonic-gel-warmer',
  'med-warming-cabinet',
  'mri-safe-wheelchair',
  'sony-upp-110hg',
  'tisora-facial-tissue',
  'tisora-toilet-tissue',
  'ultra-med-roll',
  'us-gel-5l',
  'us-gel-250ml'
];

const files = fs.readdirSync(destDir);

for (const id of ids) {
  // Find all images for this product
  const productImages = files.filter(f => f.startsWith(id + '_'));
  
  // Sort so main is first, then alt1, alt2, etc.
  productImages.sort((a, b) => {
    if (a.includes('_main')) return -1;
    if (b.includes('_main')) return 1;
    const numA = parseInt(a.match(/_alt(\d+)/)?.[1] || 0);
    const numB = parseInt(b.match(/_alt(\d+)/)?.[1] || 0);
    return numA - numB;
  });
  
  if (productImages.length > 0) {
    const imagesArr = JSON.stringify(productImages.map(f => `/images/products/${f}`));
    const mainImage = `'/images/products/${productImages[0]}'`;
    
    // Instead of using a regex that stops at the first }, we will match the whole product object
    // Or simpler: replace 'image: ...' and add 'images: ...'
    // Since each ID is unique, we can find the index of the ID, then find the next 'image:' after it
    
    const idIndex = seedContent.indexOf(`id: '${id}'`);
    if (idIndex !== -1) {
      const nextImageIndex = seedContent.indexOf('image: ', idIndex);
      if (nextImageIndex !== -1) {
        // Find the end of the image line
        const endOfImageLine = seedContent.indexOf('\n', nextImageIndex);
        
        const before = seedContent.slice(0, nextImageIndex);
        const after = seedContent.slice(endOfImageLine);
        
        // Add images array right after image
        seedContent = before + `image: ${mainImage},\n    images: ${imagesArr},` + after.replace(/^,/, '');
      }
    }
  }
}

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log('Seed updated with correct image paths');
