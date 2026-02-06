const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname);
const motosFile = path.join(repo, 'motorcycles.json');
const fotosDir = path.join(repo, 'Fotos motos');
const imagesDir = path.join(repo, 'images');

function normalize(s){
  return String(s||'').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function tokens(s){ return normalize(s).split(' ').filter(Boolean); }

if (!fs.existsSync(motosFile)) { console.error('motorcycles.json not found'); process.exit(1); }
const list = JSON.parse(fs.readFileSync(motosFile,'utf8'));
if (!fs.existsSync(fotosDir)) { console.log('Fotos motos directory not found, nothing to map'); process.exit(0); }
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

// gather folders
const folders = fs.readdirSync(fotosDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>({name:d.name, path:path.join(fotosDir,d.name)}));

let sharpAvailable = true; let sharp = null; try{ sharp = require('sharp'); } catch(e){ sharpAvailable = false; }
let jimpAvailable = true; let Jimp = null; try{ Jimp = require('jimp'); } catch(e){ jimpAvailable = false; } if (jimpAvailable && Jimp && Jimp.default) Jimp = Jimp.default;

function scoreMatch(folderName, moto){
  const fTokens = tokens(folderName);
  const nameTokens = tokens(moto.name + ' ' + (moto.desc||''));
  if (fTokens.length === 0 || nameTokens.length === 0) return 0;
  let matches = 0;
  for (const t of fTokens){ if (nameTokens.includes(t)) matches++; }
  // year matching: look for 4-digit or 2-digit year in folderName
  const yearMatch = (folderName.match(/(19|20)\d{2}/) || folderName.match(/\b\d{2}\b/));
  let yearBoost = 0;
  if (yearMatch){
    const y = yearMatch[0];
    if (moto.year && moto.year.indexOf(y) !== -1) yearBoost = 1;
  }
  // proportion of tokens matched
  const prop = matches / fTokens.length;
  // final score
  return prop + yearBoost*0.5;
}

let assigned = 0; let copied = 0; let thumbed = 0;
const updated = [];

// backup motos file
const ts = new Date().toISOString().replace(/[:.]/g,'').replace(/Z$/,'');
const backupFile = motosFile + '.bak-' + ts + '.json';
fs.copyFileSync(motosFile, backupFile);
console.log('Backup written to', backupFile);

for (const folder of folders){
  const files = fs.readdirSync(folder.path).filter(f=>/\.(jpe?g|png|webp)$/i.test(f));
  if (!files.length) continue;
  const folderName = folder.name;
  let best = null; let bestScore = 0;
  for (const m of list){
    // skip if already has image
    if (m.image && m.image.startsWith('images/')) continue;
    const s = scoreMatch(folderName, m);
    if (s > bestScore){ bestScore = s; best = m; }
  }
  // require threshold
  if (best && bestScore >= 0.5){
    const src = path.join(folder.path, files[0]);
    const destName = best.id + '.jpg';
    const dest = path.join(imagesDir, destName);
    try{
      fs.copyFileSync(src, dest);
      copied++;
      best.image = 'images/' + destName;
      assigned++;
      updated.push({id:best.id, folder:folderName, score:bestScore, file:files[0]});
      // create thumbnail
      try{
        if (sharpAvailable){
          const thumbPath = path.join(imagesDir, 'thumb-' + best.id + '.jpg');
          // synchronous-ish: use toFile and wait via promise
          // but we'll do it synchronously via then/waiting: use deasync not available; instead produce and ignore errors
          sharp(dest).resize(640,384,{fit:'cover'}).jpeg({quality:80}).toFile(thumbPath).then(()=>{ thumbed++; }).catch(()=>{});
        } else if (jimpAvailable){
          (async ()=>{ try{ const img = await Jimp.read(dest); img.cover(640,384).quality(80); await img.writeAsync(path.join(imagesDir,'thumb-'+best.id+'.jpg')); thumbed++; }catch(e){} })();
        }
      } catch(e){ /* ignore */ }
    } catch(e){ console.warn('copy failed for', src, e && e.message); }
  }
}

fs.writeFileSync(motosFile, JSON.stringify(list, null, 2), 'utf8');
console.log('Assigned', assigned, 'images, copied', copied, 'files. Thumbnails generation requested (async).');
if (updated.length) console.log('Updated entries:', updated.map(u=>u.id+'('+u.score.toFixed(2)+') from '+u.folder).join(', '));
else console.log('No new matches found.');
