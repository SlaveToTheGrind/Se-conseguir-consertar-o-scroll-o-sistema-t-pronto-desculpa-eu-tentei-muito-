const fs = require('fs');
const path = require('path');

// default source image (if none provided) -> ../images/moto-4.jpg
const src = process.argv[2] || path.join(__dirname, '..', 'images', 'moto-4.jpg');
const tmp = src + '.fixed.jpg';
const thumb = path.join(path.dirname(src), 'thumb-' + path.basename(src));

let sharpAvailable = true;
let sharp = null;
try{ sharp = require('sharp'); } catch(e){ sharpAvailable = false; }

let jimpAvailable = true;
let Jimp = null;
try{ Jimp = require('jimp'); } catch(e){ jimpAvailable = false; }
if (jimpAvailable && Jimp && Jimp.default) Jimp = Jimp.default;

async function trySharpReencode() {
  if (!sharpAvailable) return false;
  try{
    await sharp(src).jpeg({quality:90}).toFile(tmp);
    return true;
  } catch(e){
    console.warn('sharp re-encode failed:', e && e.message ? e.message : e);
    return false;
  }
}

async function tryJimpReencode(){
  if (!jimpAvailable) return false;
  try{
    const img = await Jimp.read(src);
    await img.quality(90).writeAsync(tmp);
    return true;
  } catch(e){
    console.warn('Jimp re-encode failed:', e && e.message ? e.message : e);
    return false;
  }
}

async function makeThumbFrom(tmpPath){
  try{
    if (sharpAvailable){
      await sharp(tmpPath).resize(640,384,{fit:'cover'}).jpeg({quality:80}).toFile(thumb);
    } else if (jimpAvailable){
      const img = await Jimp.read(tmpPath);
      img.cover(640,384).quality(80);
      await img.writeAsync(thumb);
    } else {
      console.error('No image processors available to create thumbnail.');
      return false;
    }
    return true;
  } catch(e){
    console.warn('Thumbnail creation failed:', e && e.message ? e.message : e);
    return false;
  }
}

(async ()=>{
  if (!fs.existsSync(src)){
    console.error('Source file not found:', src);
    process.exit(1);
  }
  console.log('Attempting re-encode for', src);
  let ok = await trySharpReencode();
  if (!ok){
    ok = await tryJimpReencode();
  }
  if (!ok){
    console.error('Re-encode failed for', src);
    process.exit(2);
  }
  try{
    fs.copyFileSync(tmp, src);
    fs.unlinkSync(tmp);
    console.log('Re-encoded file written back to', src);
  } catch(e){
    console.warn('Failed to replace original file with re-encoded version:', e && e.message ? e.message : e);
  }
  const tOk = await makeThumbFrom(src);
  if (tOk) console.log('Thumbnail created:', thumb);
  else console.error('Thumbnail creation failed after re-encode.');
})();
