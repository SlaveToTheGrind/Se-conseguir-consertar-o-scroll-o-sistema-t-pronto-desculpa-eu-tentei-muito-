const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const repoRoot = path.resolve(__dirname, '..');
const motosFile = path.join(repoRoot, 'data', 'motorcycles.json');
const imagesRoot = path.join(repoRoot, 'images');
const backupsRoot = path.join(repoRoot, 'backups');

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); }
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

(async function main(){
  try{
    if(!fs.existsSync(motosFile)) throw new Error('motorcycles.json not found at '+motosFile);
    if(!fs.existsSync(imagesRoot)) throw new Error('images directory not found at '+imagesRoot);

    const motos = readJson(motosFile);
    const timestamp = Date.now();
    const backupImagesDir = path.join(backupsRoot, `images_originals_${timestamp}`);
    ensureDir(backupImagesDir);
    // backup JSON
    const jsonBak = path.join(path.dirname(motosFile), `motorcycles.json.bak-${timestamp}.json`);
    fs.copyFileSync(motosFile, jsonBak);
    console.log('JSON backup at', jsonBak);

    let thumbsCreated = 0;
    let originalsMoved = 0;

    for(const m of motos){
      // prefer m.images array if present, else fallback to m.image only
      const imgs = Array.isArray(m.images) && m.images.length>0 ? m.images : (m.image ? [m.image] : []);
      if(imgs.length === 0) continue;

      // work on first image to create thumb
      const first = imgs[0];
      const absolute = path.join(repoRoot, first.replace(/\//g, path.sep));
      if(!fs.existsSync(absolute)) {
        console.warn('Original image not found for', m.id, absolute);
        continue;
      }

      const dir = path.dirname(absolute);
      const base = path.basename(absolute);

      // Normalize thumb name: if file already starts with one or more "thumb-" prefixes
      // collapse them to a single "thumb-". This avoids creating "thumb-thumb-..." on re-runs.
      const normalizedBaseIfThumb = base.replace(/^(thumb-)+/, 'thumb-');
      let finalThumbName;
      let finalThumbPath;

      if (/^thumb-/.test(base)) {
        // The referenced file is already a thumb (possibly with duplicate prefix).
        finalThumbName = normalizedBaseIfThumb;
        finalThumbPath = path.join(dir, finalThumbName);

        // If file has duplicate prefix (e.g. thumb-thumb-...), rename to normalized name.
        if (finalThumbName !== base) {
          const currentPath = path.join(dir, base);
          if (fs.existsSync(currentPath) && !fs.existsSync(finalThumbPath)) {
            try {
              fs.renameSync(currentPath, finalThumbPath);
            } catch (e) {
              console.warn('Failed to normalize thumb name', currentPath, '->', finalThumbPath, e.message);
            }
          }
        }
        // If final thumb path doesn't exist (rare), attempt to create it from the referenced file if possible.
        if (!fs.existsSync(finalThumbPath) && fs.existsSync(absolute)) {
          try {
            await sharp(absolute).resize({ width: 400 }).jpeg({ quality: 80 }).toFile(finalThumbPath);
            thumbsCreated++;
          } catch (e) {
            console.warn('Sharp failed creating normalized thumb for', absolute, e.message);
          }
        }
      } else {
        // Regular flow: create thumb if it doesn't already exist
        finalThumbName = `thumb-${base}`;
        finalThumbPath = path.join(dir, finalThumbName);
        if (!fs.existsSync(finalThumbPath)) {
          try{
            await sharp(absolute).resize({ width: 400 }).jpeg({ quality: 80 }).toFile(finalThumbPath);
            thumbsCreated++;
          } catch(e){
            console.warn('Sharp failed for', absolute, e.message);
            continue;
          }
        }
      }

      // set thumb path relative (posix)
      const relThumb = path.posix.join('images', path.relative(imagesRoot, dir).split(path.sep).join('/'), finalThumbName).replace(/\\/g,'/');
      m.thumb = relThumb;
      // switch display image to thumb for vitrine
      m.image = relThumb;

      // move original(s) for this folder into backup location, preserve folder structure
      for(const imgRel of imgs){
        const abs = path.join(repoRoot, imgRel.replace(/\//g, path.sep));
        if(!fs.existsSync(abs)) continue;
        const b = path.basename(abs);
        // don't move thumb files
        if (/^(thumb-)/.test(b)) continue;
        const relUnderImages = path.relative(imagesRoot, abs);
        const dest = path.join(backupImagesDir, relUnderImages);
        ensureDir(path.dirname(dest));
        try{
          fs.renameSync(abs, dest);
          originalsMoved++;
        } catch(e){
          console.warn('Failed to move', abs, '->', dest, e.message);
        }
      }
      // update images array to remove moved originals and keep thumb only
      m.images = [m.thumb];
    }

    writeJson(motosFile, motos);
    console.log(`Thumbs created: ${thumbsCreated}, originals moved to ${backupImagesDir}: ${originalsMoved}`);
  }catch(err){ console.error('Error:', err.message); process.exit(1); }
})();
