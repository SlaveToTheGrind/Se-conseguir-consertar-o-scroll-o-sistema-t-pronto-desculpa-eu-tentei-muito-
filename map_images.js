const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname);
const imagesDir = path.join(repo, 'images');
const motosFile = path.join(repo, 'motorcycles.json');

if (!fs.existsSync(motosFile)) {
  console.error('motorcycles.json not found');
  process.exit(1);
}
const list = JSON.parse(fs.readFileSync(motosFile, 'utf8'));

function fileExists(p) { try { return fs.existsSync(p); } catch (e) { return false; } }

const found = {};
if (fileExists(imagesDir)) {
  const imgs = fs.readdirSync(imagesDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  imgs.forEach(f => found[f.toLowerCase()] = f);
}

let updated = 0;
list.forEach(m => {
  const idFile = `moto-${m.id && m.id.replace(/^moto-/, '')}.jpg`;
  const candidate1 = `moto-${m.id.replace(/^moto-/, '')}.jpg`;
  // direct id match
  const p1 = path.join(imagesDir, `${m.id}.jpg`);
  if (fileExists(p1)) {
    m.image = `images/${m.id}.jpg`;
    updated++;
    return;
  }
  // try common filenames
  const p2 = path.join(imagesDir, candidate1);
  if (fileExists(p2)) {
    m.image = `images/${candidate1}`;
    updated++;
    return;
  }
  // try any image that contains name tokens
  const name = (m.name || '').toLowerCase().replace(/[çãáéíóúâêôü]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  const imgs = Object.keys(found);
  for (const fn of imgs) {
    const base = fn.replace(/\.(jpe?g|png|webp)$/i, '');
    let matched = true;
    for (const t of name.slice(0,2)) { // require at least first two tokens if present
      if (t && base.indexOf(t) === -1) { matched = false; break; }
    }
    if (matched) {
      m.image = `images/${found[fn]}`;
      updated++;
      break;
    }
  }
});

fs.writeFileSync(motosFile, JSON.stringify(list, null, 2), 'utf8');
console.log('map_images: wrote', motosFile, 'updated entries:', updated);
