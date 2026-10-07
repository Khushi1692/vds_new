const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join('f:', 'vds new', 'frontend', 'src', 'assets');
const destDir = path.join('f:', 'vds new', 'frontend', 'public', 'images', 'products');

async function processImages() {
  const files = fs.readdirSync(srcDir);
  const mappings = {};

  // Products from seed.js in order
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

  for (let i = 1; i <= 12; i++) {
    const regex = new RegExp(`^${i}(?: \\((\\d+)\\))?\\.png$`);
    const groupFiles = files.filter(f => regex.test(f));
    
    groupFiles.sort((a, b) => {
      const matchA = a.match(regex);
      const matchB = b.match(regex);
      const numA = matchA[1] ? parseInt(matchA[1]) : 0;
      const numB = matchB[1] ? parseInt(matchB[1]) : 0;
      return numA - numB;
    });

    const webpPaths = [];
    const productId = ids[i-1];

    for (let j = 0; j < groupFiles.length; j++) {
      const file = groupFiles[j];
      const suffix = j === 0 ? 'main' : `alt${j}`;
      const newName = `${productId}_${suffix}.webp`;
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, newName);

      await sharp(srcPath)
        .webp({ quality: 80 })
        .toFile(destPath);

      webpPaths.push(`/images/products/${newName}`);
    }

    if (webpPaths.length > 0) {
      mappings[productId] = webpPaths;
    }
  }

  // Update seed.js
  const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  for (let i = 1; i <= 12; i++) {
    const productId = ids[i-1];
    if (mappings[productId]) {
      const imagesArr = JSON.stringify(mappings[productId]);
      const mainImage = `'${mappings[productId][0]}'`;

      const productRegex = new RegExp(`(id:\\s*'${productId}'[\\s\\S]*?})`, 'g');
      seedContent = seedContent.replace(productRegex, (m) => {
        let newMatch = m;
        newMatch = newMatch.replace(/images:\s*\[[^\]]*\],?/, `images: ${imagesArr},`);
        newMatch = newMatch.replace(/image:\s*'[^']*'/, `image: ${mainImage}`);
        return newMatch;
      });
    }
  }

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  
  // Cleanup old files
  const destFiles = fs.readdirSync(destDir);
  for (const file of destFiles) {
    if (file.startsWith('product_') && file.endsWith('.webp')) {
      fs.unlinkSync(path.join(destDir, file));
    }
  }

  for (let i = 1; i <= 12; i++) {
    const regex = new RegExp(`^${i}(?: \\((\\d+)\\))?\\.png$`);
    const groupFiles = files.filter(f => regex.test(f));
    for (const file of groupFiles) {
      fs.unlinkSync(path.join(srcDir, file));
    }
  }

  // Also convert any other remaining .png in assets to .webp
  const remainingFiles = fs.readdirSync(srcDir);
  for (const file of remainingFiles) {
    if (file.endsWith('.png')) {
      const srcPath = path.join(srcDir, file);
      const newName = file.replace('.png', '.webp');
      const destPath = path.join(srcDir, newName);
      await sharp(srcPath).webp({ quality: 80 }).toFile(destPath);
      fs.unlinkSync(srcPath);
    }
  }

  console.log('Finished renaming, converting, updating seed.js, and cleaning up.');
}

processImages().catch(console.error);
