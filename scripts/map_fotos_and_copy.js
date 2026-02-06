const fs = require('fs');
const path = require('path');

// run from scripts/, so data is ../data and Fotos motos/images are ../Fotos motos and ../images
const repo = path.resolve(__dirname);
const motosFile = path.join(__dirname, '..', 'data', 'motorcycles.json');
const fotosDir = path.join(__dirname, '..', 'Fotos motos');
const imagesDir = path.join(__dirname, '..', 'images');

function normalize(s){
  return String(s||'').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

if (!fs.existsSync(motosFile)) { console.error('motorcycles.json not found at', motosFile); process.exit(1); }
const list = JSON.parse(fs.readFileSync(motosFile,'utf8'));

if (!fs.existsSync(fotosDir)) { console.log('Fotos motos directory not found, nothing to map'); process.exit(0); }
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

const folders = fs.readdirSync(fotosDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>path.join(fotosDir,d.name));
const imgsByFolder = {};
folders.forEach(folder => {
  const files = fs.readdirSync(folder).filter(f=>/\.(jpe?g|png|webp)$/i.test(f));
  if (files.length) imgsByFolder[folder] = files.map(f=>path.join(folder,f));
});

let copied = 0;
let assigned = 0;
let thumbed = 0;

let sharpAvailable = true;
let sharp = null;
try{ sharp = require('sharp'); } catch(e){ sharpAvailable = false; }

let jimpAvailable = true;
let Jimp = null;
try{ Jimp = require('jimp'); } catch(e){ jimpAvailable = false; }
if (jimpAvailable && Jimp && Jimp.default) Jimp = Jimp.default;

const thumbPromises = [];

for (const folder of Object.keys(imgsByFolder)){
  const folderName = path.basename(folder);
  const normFolder = normalize(folderName);
  const tokens = normFolder.split(' ').filter(Boolean);
  let best = null;
  let bestScore = 0;
  list.forEach(m => {
    const nameNorm = normalize(m.name + ' ' + (m.desc||''));
    let score = 0;
    for (const t of tokens){ if (t && nameNorm.indexOf(t) !== -1) score++; }
    if (score > bestScore){ bestScore = score; best = m; }
  });
  if (best && bestScore > 0){
    const src = imgsByFolder[folder][0];
    const destName = `${best.id}.jpg`;
    const dest = path.join(imagesDir,destName);
    try{
      fs.copyFileSync(src,dest);
      copied++;
      if (!best.image || !best.image.startsWith('images/')) {
        best.image = `images/${destName}`;
        assigned++;
      }
      if (sharpAvailable){
        const thumbPath = path.join(imagesDir, `thumb-${best.id}.jpg`);
        const p = sharp(dest).resize(640,384,{fit:'cover'}).jpeg({quality:80}).toFile(thumbPath)
          .then(() => { thumbed++; })
          .catch(async err => {
            console.warn('thumb error for', dest, err && err.message ? err.message : err);
            if (jimpAvailable){
              try{
                const image = await Jimp.read(dest);
                image.cover(640,384).quality(80);
                await image.writeAsync(thumbPath);
                thumbed++;
              } catch(e){
                console.warn('jimp fallback failed for', dest, e && e.message ? e.message : e);
              }
            }
          });
        thumbPromises.push(p);
      }
    } catch(e){ console.warn('failed to copy', src, e); }
  }
}

Promise.all(thumbPromises)
  .then(() => {
    fs.writeFileSync(motosFile, JSON.stringify(list, null, 2), 'utf8');
    console.log(`map_fotos_and_copy: copied ${copied} files, assigned ${assigned} image fields, generated ${sharpAvailable?thumbed:'0 (sharp missing)'} thumbnails.`);
    if (!sharpAvailable) console.log('Note: sharp not installed — to generate thumbnails run: npm install sharp');
  })
  .catch(err => {
    try{ fs.writeFileSync(motosFile, JSON.stringify(list, null, 2), 'utf8'); } catch(e){}
    console.error('map_fotos_and_copy: thumbnail generation encountered an error', err && err.message ? err.message : err);
  });
