const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function rotateImage(filename) {
  const filePath = path.join(__dirname, '../../frontend/public/images', filename);
  const tempPath = path.join(__dirname, '../../frontend/public/images', 'temp_' + filename);
  
  if (fs.existsSync(filePath)) {
    await sharp(filePath)
      .rotate(90) // rotate 90 degrees clockwise
      .toFile(tempPath);
    
    try {
      fs.copyFileSync(tempPath, filePath);
      fs.unlinkSync(tempPath);
      console.log(`Rotated ${filename}`);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

async function run() {
  await rotateImage('ultrasound_gel_250ML.webp');
}

run().catch(console.error);
