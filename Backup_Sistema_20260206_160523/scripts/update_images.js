const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const motorcyclesFile = path.join(repoRoot, 'data', 'motorcycles.json');
const fotosDir = path.join(repoRoot, 'Fotos motos');
const imagesDir = path.join(repoRoot, 'images');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Mapping from motorcycle id to directory name in Fotos motos
const imageMappings = {
  "moto-5": "Biz 110-i branca 2023",
  "moto-3": "Biz 125 branca 2022",
  "moto-4": "Biz 125 prata 2023",
  "moto-15": "CG 160 Titan 2025",
  "moto-6": "Elite 125 2025",
  "moto-7": "Fan 125 KS 2007",
  "moto-10": "Titan 150 2005",
  "moto-18": "Twister 2016",
  "moto-20": "Twister 2022",
  "moto-13": "Bros preta 2023",
  "moto-14": "Crosser 150 Z 2024",
  "moto-8": "Fan 125 KS 2010",
  "moto-2": "Biz 125 ES 2009"
};

try {
  if (!fs.existsSync(motorcyclesFile)) {
    console.error('motorcycles.json not found at', motorcyclesFile);
    process.exit(1);
  }

  const motorcycles = readJson(motorcyclesFile);

  // backup
  const bakName = `motorcycles.json.bak-${Date.now()}.json`;
  const bakPath = path.join(path.dirname(motorcyclesFile), bakName);
  fs.copyFileSync(motorcyclesFile, bakPath);
  console.log('Backup created at', bakPath);

  let updated = 0;

  Object.keys(imageMappings).forEach(id => {
    const dir = imageMappings[id];
    const fullDir = path.join(fotosDir, dir);
    const moto = motorcycles.find(m => m.id === id || String(m.id) === String(id));
    if (!moto) return;

    if (fs.existsSync(fullDir)) {
      const destDir = path.join(imagesDir, dir);
      ensureDir(destDir);

      const images = [];
      for (let i = 1; ; i++) {
        const srcFoto = path.join(fullDir, `Foto ${i}.jpg`);
        if (fs.existsSync(srcFoto)) {
          const destFoto = path.join(destDir, `Foto ${i}.jpg`);
          try {
            fs.copyFileSync(srcFoto, destFoto);
            images.push(path.posix.join('images', dir.replace(/\\/g, '/'), `Foto ${i}.jpg`));
          } catch (err) {
            console.warn(`Failed to copy ${srcFoto} -> ${destFoto}:`, err.message);
          }
        } else {
          break;
        }
      }

      if (images.length > 0) {
        moto.images = images;
        moto.image = images[0];
        updated++;
      } else {
        console.log(`No photos found in ${fullDir}`);
      }
    } else {
      console.log(`Directory ${fullDir} not found`);
    }
  });

  if (updated > 0) {
    writeJson(motorcyclesFile, motorcycles);
    console.log(`Updated images for ${updated} motorcycles`);
  } else {
    console.log('No updates made');
  }
} catch (err) {
  console.error('Error:', err.message);
}
