const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processImages() {
  const sourceDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\8b2d089a-b8f0-4bb4-bb76-6ee0def0d0a6\\.user_uploaded';
  const destDir = 'F:\\vds new\\frontend\\public\\images\\products';

  // Sort files by creation time
  const files = fs.readdirSync(sourceDir)
    .filter(f => f.startsWith('media_'))
    .map(f => ({ name: f, time: fs.statSync(path.join(sourceDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  // The two images for the 5L gel were uploaded right before the latest screenshot.
  // The latest screenshot is media_1791519067825.png (index 0).
  // The next one is media_1791518791367.png (index 1).
  // Then media_1791518033664.jpg and media_1791518033641.jpg (index 2 and 3).
  console.log("Latest uploaded files:", files.slice(0, 5).map(f => f.name));

  const img1 = files.find(f => f.name.includes('1791518033641.jpg')).name;
  const img2 = files.find(f => f.name.includes('1791518033664.jpg')).name;

  console.log("Processing", img1, "and", img2);

  await sharp(path.join(sourceDir, img1))
    .webp()
    .toFile(path.join(destDir, 'us-gel-5l_alt2.webp'));

  await sharp(path.join(sourceDir, img2))
    .webp()
    .toFile(path.join(destDir, 'us-gel-5l_alt3.webp'));

  console.log("Done");
}

processImages().catch(console.error);
