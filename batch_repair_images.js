const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname);
const imagesDir = path.join(repo, 'images');

let sharpAvailable = true;
let sharp = null;
try{ sharp = require('sharp'); } catch(e){ sharpAvailable = false; }

let jimpAvailable = true;
let Jimp = null;
try{ Jimp = require('jimp'); } catch(e){ jimpAvailable = false; }
if (jimpAvailable && Jimp && Jimp.default) Jimp = Jimp.default;

function nowTs(){
  const d = new Date();
  return d.toISOString().replace(/[:.]/g,'').replace(/Z$/,'');
}

function listImages(){
  if (!fs.existsSync(imagesDir)) return [];
  return fs.readdirSync(imagesDir).filter(f => /\.jpg$/i.test(f) && !/^thumb-/i.test(f) && !/\.fixed\.jpg$/i.test(f) && !/\.bak-/.test(f));
}

async function repairOne(filename){
  const src = path.join(imagesDir, filename);
  const base = filename;
  const thumbName = 'thumb-' + base;
  const thumbPath = path.join(imagesDir, thumbName);
  if (fs.existsSync(thumbPath)) return {file: filename, status: 'skipped', reason: 'thumb exists'};

  const backupName = base + `.bak-${nowTs()}.jpg`;
  const backupPath = path.join(imagesDir, backupName);
  try{ fs.copyFileSync(src, backupPath); } catch(e){ return {file: filename, status: 'failed', reason: 'backup failed: '+(e && e.message)}; }

  const tmp = path.join(imagesDir, base + '.fixed.jpg');
  let reencoded = false;

  if (sharpAvailable){
    try{
      await sharp(src).jpeg({quality:90}).toFile(tmp);
      reencoded = true;
    } catch(e){
      // ignore
    }
  }

  if (!reencoded && jimpAvailable){
    try{
      const img = await Jimp.read(src);
      await img.quality(90).writeAsync(tmp);
      reencoded = true;
    } catch(e){
      // ignore
    }
  }

  if (!reencoded){
    return {file: filename, status: 'failed', reason: 're-encode failed'};
  }

  // try replace original
  try{
    // attempt atomic rename first
    try{ fs.renameSync(tmp, src); }
    catch(e){ fs.copyFileSync(tmp, src); fs.unlinkSync(tmp); }
  } catch(e){
    return {file: filename, status: 'failed', reason: 'replace failed: '+(e && e.message)};
  }

  // create thumbnail
  try{
    if (sharpAvailable){
      await sharp(src).resize(640,384,{fit:'cover'}).jpeg({quality:80}).toFile(thumbPath);
    } else if (jimpAvailable){
      const img = await Jimp.read(src);
      img.cover(640,384).quality(80);
      await img.writeAsync(thumbPath);
    } else {
      return {file: filename, status: 'partial', reason: 'no image processor available for thumbnail'};
    }
  } catch(e){
    return {file: filename, status: 'failed', reason: 'thumb failed: '+(e && e.message)};
  }

  return {file: filename, status: 'ok'};
}

(async ()=>{
  const images = listImages();
  console.log('Found', images.length, 'candidate images to repair (thumb missing will be processed).');
  const results = [];
  for (const img of images){
    // only process if thumb missing
    if (fs.existsSync(path.join(imagesDir, 'thumb-' + img))) continue;
    process.stdout.write(`Repairing ${img} ... `);
    const r = await repairOne(img);
    results.push(r);
    console.log(r.status + (r.reason ? ' - ' + r.reason : ''));
  }
  const ok = results.filter(r=>r.status==='ok').length;
  const failed = results.filter(r=>r.status!=='ok').length;
  console.log(`Summary: ${ok} fixed, ${failed} failed, total processed ${results.length}`);
})();
