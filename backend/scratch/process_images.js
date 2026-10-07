const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join('f:', 'vds new', 'frontend', 'src', 'assets');
const destDir = path.join('f:', 'vds new', 'frontend', 'public', 'images', 'products');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function processImages() {
  const files = fs.readdirSync(srcDir);
  const mappings = {};

  for (let i = 1; i <= 12; i++) {
    const regex = new RegExp(`^${i}(?: \\((\\d+)\\))?\\.png$`);
    const groupFiles = files.filter(f => regex.test(f));
    
    // Sort so that 1.png comes first, then 1 (1).png, 1 (2).png etc.
    groupFiles.sort((a, b) => {
      const matchA = a.match(regex);
      const matchB = b.match(regex);
      const numA = matchA[1] ? parseInt(matchA[1]) : 0;
      const numB = matchB[1] ? parseInt(matchB[1]) : 0;
      return numA - numB;
    });

    const webpPaths = [];

    for (let j = 0; j < groupFiles.length; j++) {
      const file = groupFiles[j];
      const suffix = j === 0 ? 'main' : `alt${j}`;
      const newName = `product_${i}_${suffix}.webp`;
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, newName);

      await sharp(srcPath)
        .webp({ quality: 80 })
        .toFile(destPath);

      webpPaths.push(`/images/products/${newName}`);
    }

    if (webpPaths.length > 0) {
      mappings[i] = webpPaths;
    }
  }

  // Now update seed.js
  const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // We have 14 products in seed.js. Let's assume the first 12 match 1-12.
  // Actually we need to extract their IDs in order of appearance in seed.js
  const ids = [];
  const idRegex = /id:\s*'([^']+)'/g;
  let match;
  while ((match = idRegex.exec(seedContent)) !== null) {
    ids.push(match[1]);
  }

  for (let i = 1; i <= 12; i++) {
    if (mappings[i] && ids[i-1]) {
      const productId = ids[i-1];
      const imagesArr = JSON.stringify(mappings[i]);
      const mainImage = `'${mappings[i][0]}'`;

      const productRegex = new RegExp(`(id:\\s*'${productId}'[\\s\\S]*?})`, 'g');
      seedContent = seedContent.replace(productRegex, (m) => {
        let newMatch = m;
        if (newMatch.includes('images:')) {
          newMatch = newMatch.replace(/images:\s*\[[^\]]*\],?/, `images: ${imagesArr},`);
        } else {
          newMatch = newMatch.replace(/(image:\s*'[^\n]+',?)/, `$1\n    images: ${imagesArr},`);
        }
        newMatch = newMatch.replace(/image:\s*'[^']*'/, `image: ${mainImage}`);
        return newMatch;
      });
    }
  }

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log('Finished processing images and updating seed.js');
}

processImages().catch(console.error);
