const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const inputSvg = path.join(__dirname, 'public', 'food-animated-icon.svg');
  const icon192 = path.join(__dirname, 'public', 'icons', 'icon-192.png');
  const icon512 = path.join(__dirname, 'public', 'icons', 'icon-512.png');

  try {
    // Generate 192x192
    await sharp(inputSvg)
      .resize(192, 192)
      .png()
      .toFile(icon192);
      
    // Generate 512x512
    await sharp(inputSvg)
      .resize(512, 512)
      .png()
      .toFile(icon512);

    console.log('Successfully generated PWA PNG icons from food-animated-icon.svg!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
