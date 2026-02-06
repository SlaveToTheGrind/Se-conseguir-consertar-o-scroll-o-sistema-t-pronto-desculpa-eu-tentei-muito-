const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname);
const motorcyclesFile = path.join(repoRoot, 'motorcycles.json');
const fotosDir = path.join(repoRoot, 'Fotos motos');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
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
  "moto-13": "Bros preta 2023", // for moto-13 BROS 160cc ESDD 2022/23 (Cinza) - color not match, but perhaps
  "moto-14": "Crosser 150 Z 2024", // year 2024 vs 2023/24
  "moto-8": "Fan 125 KS 2010", // year 2010 vs 2009/10
  "moto-2": "Biz 125 ES 2009" // for moto-2 Biz 125cc EX 2014/14 (Preta) - year not match, but perhaps
};

try {
  const motorcycles = readJson(motorcyclesFile);

  let updated = 0;
  motorcycles.forEach(m => {
    if (imageMappings[m.id]) {
      const dir = imageMappings[m.id];
      const fullDir = path.join(fotosDir, dir);
      if (fs.existsSync(fullDir)) {
        const images = [];
        for (let i = 1; ; i++) {
          const foto = path.join(fullDir, `Foto ${i}.jpg`);
          if (fs.existsSync(foto)) {
            images.push(`Fotos motos/${dir}/Foto ${i}.jpg`);
          } else {
            break;
          }
        }
        if (images.length > 0) {
          m.images = images;
          m.image = images[0]; // for backward compatibility
          updated++;
        } else {
          console.log(`No photos found in ${fullDir}`);
        }
      } else {
        console.log(`Directory ${fullDir} not found`);
      }
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
