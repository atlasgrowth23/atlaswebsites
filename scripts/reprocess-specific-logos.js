const fs = require('fs');
const https = require('https');
const sharp = require('sharp');
const path = require('path');

// Companies that need logo reprocessing with improved quality
const logosToReprocess = [
  ['1st-choice-heating-and-cooling', 'https://lh6.googleusercontent.com/-QQKtjLzduJk/AAAAAAAAAAI/AAAAAAAAAAA/NIPrqCzEQWQ/s44-p-k-no-ns-nd/photo.jpg'],
  ['1st-class-comfort-heating-air', 'https://lh5.googleusercontent.com/-fDw0fVyPRm8/AAAAAAAAAAI/AAAAAAAAAAA/0APGrS0uNBc/s44-p-k-no-ns-nd/photo.jpg'],
  ['205-heating-cooling-llc', 'https://lh6.googleusercontent.com/-AmscpkMuQPA/AAAAAAAAAAI/AAAAAAAAAAA/Y7gEUaBA27Y/s44-p-k-no-ns-nd/photo.jpg'],
  ['256-heating-and-cooling', 'https://lh4.googleusercontent.com/-eOyjhB7hF4Y/AAAAAAAAAAI/AAAAAAAAAAA/R4fzypazj2Q/s44-p-k-no-ns-nd/photo.jpg'],
  ['airzone-llc', 'https://lh5.googleusercontent.com/-ig3gp9boNas/AAAAAAAAAAI/AAAAAAAAAAA/ghxj-OIeoBI/s44-p-k-no-ns-nd/photo.jpg'],
  ['absolute-heat-air-llc', 'https://lh6.googleusercontent.com/-AQilN7W5aY0/AAAAAAAAAAI/AAAAAAAAAAA/SgHpJvg56KI/s44-p-k-no-ns-nd/photo.jpg'],
  ['airmax', 'https://lh3.googleusercontent.com/-x9iR6zGqBks/AAAAAAAAAAI/AAAAAAAAAAA/trSrO2WdSIc/s44-p-k-no-ns-nd/photo.jpg'],
  ['byrds-heating-cooling', 'https://lh6.googleusercontent.com/-3sd1WxdrttY/AAAAAAAAAAI/AAAAAAAAAAA/raVfLLSHSws/s44-p-k-no-ns-nd/photo.jpg'],
  ['casper-heating-and-cooling', 'https://lh5.googleusercontent.com/-WXqSY0xB0ho/AAAAAAAAAAI/AAAAAAAAAAA/WSJoJeCupS4/s44-p-k-no-ns-nd/photo.jpg'],
  ['channell-comfort-cooling-heating-llc', 'https://lh5.googleusercontent.com/-o-WbrzkF9K8/AAAAAAAAAAI/AAAAAAAAAAA/1wti_lm7LMw/s44-p-k-no-ns-nd/photo.jpg'],
  ['comfort-plus-air-and-heating', 'https://lh6.googleusercontent.com/-9G9_sVxDvdg/AAAAAAAAAAI/AAAAAAAAAAA/pfFZyvVswkw/s44-p-k-no-ns-nd/photo.jpg'],
  ['jacksons-refrigeration-llc', 'https://lh5.googleusercontent.com/-tG5MMLTMEnA/AAAAAAAAAAI/AAAAAAAAAAA/n9BrPs8B8dg/s44-p-k-no-ns-nd/photo.jpg'],
  ['scott-kiersey-heat-air', 'https://lh4.googleusercontent.com/-Oq0sUbK2NdA/AAAAAAAAAAI/AAAAAAAAAAA/Lc_G9dr_NUI/s44-p-k-no-ns-nd/photo.jpg'],
  ['spann-sons-ac-and-heat', 'https://lh5.googleusercontent.com/--NfOjPRXzKU/AAAAAAAAAAI/AAAAAAAAAAA/atoBfDnX4lo/s44-p-k-no-ns-nd/photo.jpg'],
  ['taylor-heating-air', 'https://lh6.googleusercontent.com/-qePf0DS0LMQ/AAAAAAAAAAI/AAAAAAAAAAA/bIr8QfH_OUM/s44-p-k-no-ns-nd/photo.jpg'],
  ['temperaturepro', 'https://lh5.googleusercontent.com/-0HDfzpSWIq4/AAAAAAAAAAI/AAAAAAAAAAA/Rr3tthckbdY/s44-p-k-no-ns-nd/photo.jpg'],
  ['vandys-heating-air-conditioning-llc', 'https://lh6.googleusercontent.com/-WJQ--TiSjsY/AAAAAAAAAAI/AAAAAAAAAAA/O2FZQfkNOAs/s44-p-k-no-ns-nd/photo.jpg']
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Upgrade URL to higher resolution (s400 instead of s44)
    const improvedUrl = url.replace(/\/s\d+-p-k-no-ns-nd/, '/s400-p-k-no-ns-nd');
    
    const file = fs.createWriteStream(filepath);
    https.get(improvedUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function processLogos() {
  console.log('🎨 Starting logo reprocessing with improved quality...');
  
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  
  // Ensure logos directory exists
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }
  
  let processed = 0;
  let errors = 0;
  
  for (const [slug, originalUrl] of logosToReprocess) {
    try {
      console.log(`Processing ${slug}...`);
      
      const tempPath = path.join(logosDir, `${slug}_temp.jpg`);
      const finalPath = path.join(logosDir, `${slug}.png`);
      
      // Download improved quality image
      await downloadImage(originalUrl, tempPath);
      
      // Process with Sharp for better quality
      await sharp(tempPath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: false,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 6 })
        .toFile(finalPath);
      
      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      processed++;
      console.log(`✅ Successfully processed ${slug}`);
      
    } catch (error) {
      errors++;
      console.error(`❌ Error processing ${slug}:`, error.message);
    }
  }
  
  console.log(`\n📊 Logo reprocessing complete:`);
  console.log(`✅ Successfully processed: ${processed} logos`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`🎯 All logos now use improved 400px resolution instead of blurry 44px`);
}

processLogos().catch(console.error);