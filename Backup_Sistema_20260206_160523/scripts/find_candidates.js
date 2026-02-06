const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FOTOS_DIR = path.join(ROOT, 'Fotos motos');

function normalize(s){
  return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function listFolders(dir){
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d=>d.isDirectory())
    .map(d=>d.name);
}

const folders = listFolders(FOTOS_DIR);
const motos = JSON.parse(fs.readFileSync(path.join(ROOT,'data','motorcycles.json'),'utf8'));

const targets = motos.filter(m=>!(m.thumb|| (m.image && m.image.includes('thumb-')))).map(m=>m.id);
console.log('Targets without thumbs:', targets.join(', '));

for(const id of targets){
  const m = motos.find(x=>x.id===id);
  const mt = normalize(m.name + ' ' + (m.desc||''));
  const mtokens = mt.split(/\s+/).filter(Boolean);
  console.log('\n--', id, m.name);
  for(const f of folders){
    const ft = normalize(f);
    const ftokens = ft.split(/\s+/).filter(Boolean);
    const common = ftokens.filter(t=>mtokens.includes(t));
    console.log(f, '-> score', common.length, 'common:', common.join(','));
  }
}
