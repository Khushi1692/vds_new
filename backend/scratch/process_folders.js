const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const destDir = path.join('f:', 'vds new', 'frontend', 'public', 'images', 'products');
const seedPath = path.join('f:', 'vds new', 'backend', 'seed.js');

const folderMap = {
  "Bedsheets": "exam-bed-sheet-10",
  "Examination bed": "exam-couch-hilo",
  "Facial tissues": "tisora-facial-tissue",
  "Gel warmer": "thermasonic-gel-warmer",
  "Gowns": "exam-gown-regular",
  "MRI chair": "mri-safe-wheelchair",
  "Media warmer": "med-warming-cabinet",
  "Thermal paper": "sony-upp-110hg",
  "Toilet paper": "tisora-toilet-tissue",
  "Towel rolls": "ultra-med-roll",
  "UV probe disinfector": "uv-probe-disinfector",
  "Ultrasound gel 250 mL": "us-gel-250ml",
  "Ultrasound gel 5 L": "us-gel-5l",
  "X-ray lead apron": "xray-protective-apron"
};

async function processFolders() {
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Clean up any old generated webp files in the root first (except ones we just generate)
  const rootFiles = fs.readdirSync(destDir, { withFileTypes: true });
  for (const file of rootFiles) {
    if (file.isFile() && (file.name.endsWith('.webp') || file.name.endsWith('.png'))) {
      fs.unlinkSync(path.join(destDir, file.name));
    }
  }

  for (const [folderName, productId] of Object.entries(folderMap)) {
    const folderPath = path.join(destDir, folderName);
    if (!fs.existsSync(folderPath)) {
      console.log(`Folder not found: ${folderName}`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(png|jpe?g|webp)$/i));
    
    // Simple sort to keep main image first if possible
    files.sort((a, b) => {
      // Prioritize files without numbers as main
      const numA = a.match(/\d+/) ? 1 : 0;
      const numB = b.match(/\d+/) ? 1 : 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const webpPaths = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const suffix = i === 0 ? 'main' : `alt${i}`;
      const newName = `${productId}_${suffix}.webp`;
      const srcPath = path.join(folderPath, file);
      const targetPath = path.join(destDir, newName);

      await sharp(srcPath)
        .webp({ quality: 80 })
        .toFile(targetPath);

      webpPaths.push(`/images/products/${newName}`);
    }

    if (webpPaths.length > 0) {
      const imagesArr = JSON.stringify(webpPaths);
      const mainImage = `'${webpPaths[0]}'`;

      const idIndex = seedContent.indexOf(`id: '${productId}'`);
      if (idIndex !== -1) {
        const nextImageIndex = seedContent.indexOf('image: ', idIndex);
        if (nextImageIndex !== -1) {
          const endOfImageLine = seedContent.indexOf('\n', nextImageIndex);
          const before = seedContent.slice(0, nextImageIndex);
          const after = seedContent.slice(endOfImageLine);
          
          let afterCleaned = after;
          // check if images: is already there to replace it too
          const imagesMatch = afterCleaned.match(/^\s*images:\s*\[[^\]]*\],?\n?/);
          if (imagesMatch) {
            afterCleaned = afterCleaned.replace(imagesMatch[0], '');
          }

          seedContent = before + `image: ${mainImage},\n    images: ${imagesArr},` + afterCleaned.replace(/^,/, '');
        }
      }
    }

    // Delete original folder and files
    for (const file of fs.readdirSync(folderPath)) {
      fs.unlinkSync(path.join(folderPath, file));
    }
    fs.rmdirSync(folderPath);
  }

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log('Successfully processed folders and updated seed.js');
}

processFolders().catch(console.error);
