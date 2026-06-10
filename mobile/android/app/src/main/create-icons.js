const sharp = require('sharp');
const fs = require('fs');

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
  'play-store': 512
};

async function generateIcons() {
  const inputSvg = 'icon.svg'; // Create this file with your app icon
  
  if (!fs.existsSync(inputSvg)) {
    console.log('Please create icon.svg first');
    return;
  }
  
  for (const [name, size] of Object.entries(sizes)) {
    const outputPath = `android/app/src/main/res/mipmap-${name}/ic_launcher.png`;
    const dir = `android/app/src/main/res/mipmap-${name}`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${outputPath}`);
  }
}

generateIcons();