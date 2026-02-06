const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const motosFile = path.join(repoRoot, 'data', 'motorcycles.json');
const fotosDir = path.join(repoRoot, 'Fotos motos');
const imagesDir = path.join(repoRoot, 'images');

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); }
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function normalize(s){ return (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

try{
  if(!fs.existsSync(motosFile)) throw new Error('motorcycles.json not found at '+motosFile);
  if(!fs.existsSync(fotosDir)) throw new Error('Fotos motos directory not found at '+fotosDir);

  const motos = readJson(motosFile);

  // backup
  const bak = path.join(path.dirname(motosFile), `motorcycles.json.bak-${Date.now()}.json`);
  fs.copyFileSync(motosFile, bak);
  console.log('Backup created at', bak);

  const dirs = fs.readdirSync(fotosDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name);
  let copied = 0;
  let matched = 0;

  dirs.forEach(dirName => {
    const src = path.join(fotosDir, dirName);
    const destDir = path.join(imagesDir, dirName);
    ensureDir(destDir);

    const files = fs.readdirSync(src).filter(f => fs.statSync(path.join(src,f)).isFile());
    files.forEach(f => {
      const srcF = path.join(src, f);
      const destF = path.join(destDir, f);
      try{ fs.copyFileSync(srcF, destF); copied++; } catch(e){ console.warn('copy failed', srcF, e.message); }
    });

    // try to match this folder to a motorcycle entry
    const nDir = normalize(dirName);
    let found = null;
    for(const m of motos){
      const candidates = [m.name, m.desc, m.year, m.color].map(normalize);
      if(candidates.some(c => c && (nDir.includes(c) || c.includes(nDir) || c.split(' ').some(tok=> tok && nDir.includes(tok)) ))){
        found = m; break;
      }
    }

    if(found){
      const imgs = files.map(f => path.posix.join('images', dirName.replace(/\\/g,'/'), f));
      if(imgs.length>0){ found.images = imgs; found.image = imgs[0]; matched++; }
    }
  });

  writeJson(motosFile, motos);
  console.log(`Copied ${copied} files from ${dirs.length} folders. Matched and updated ${matched} motorcycles.`);
}catch(err){ console.error('Error:', err.message); process.exit(1); }
