const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const filesToCompress = [
  'background.png',
  'bgcard.png',
  'pappermap.png'
];

const inputDir = path.join(__dirname, '../public/images');
const outputDir = path.join(__dirname, '../public/out');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function compress() {
  console.log('Bắt đầu nén ảnh...\n');
  for (const file of filesToCompress) {
    const inputPath = path.join(inputDir, file);
    if (!fs.existsSync(inputPath)) {
      console.log(`❌ Không tìm thấy ${file}`);
      continue;
    }

    const { size: originalSize } = fs.statSync(inputPath);
    
    // Nén sang WEBP giữ nguyên Alpha (lossless hoặc lossy chất lượng cao)
    const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
    await sharp(inputPath)
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(outputPath);

    const { size: newSize } = fs.statSync(outputPath);
    
    console.log(`✅ ${file}:`);
    console.log(`   - Gốc: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`   - Nén WEBP: ${(newSize / 1024).toFixed(1)} KB (Giảm ${((1 - newSize/originalSize) * 100).toFixed(1)}%)`);
  }
}

compress().catch(console.error);
