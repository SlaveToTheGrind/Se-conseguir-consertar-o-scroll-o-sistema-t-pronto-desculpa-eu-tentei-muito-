const fs = require('fs');
const path = require('path');

// Usage: node apply_corrections.js path/to/corrections.json
// corrections.json example: { "moto-3": 125, "moto-22": 250 }

const correctionsPath = process.argv[2];
if (!correctionsPath) {
  console.error('Uso: node apply_corrections.js motorcycle_corrections.json');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname);
const motorcyclesFile = path.join(repoRoot, 'motorcycles.json');
const backupFile = path.join(repoRoot, `motorcycles.json.bak-${Date.now()}`);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

try {
  if (!fs.existsSync(motorcyclesFile)) {
    console.error('Arquivo motorcycles.json não encontrado em', motorcyclesFile);
    process.exit(2);
  }
  if (!fs.existsSync(correctionsPath)) {
    console.error('Arquivo de correções não encontrado em', correctionsPath);
    process.exit(3);
  }

  const motorcycles = readJson(motorcyclesFile);
  const corrections = readJson(correctionsPath);

  // apply corrections
  let applied = 0;
  motorcycles.forEach(m => {
    if (corrections.hasOwnProperty(m.id)) {
      const val = parseInt(corrections[m.id], 10);
      if (!isNaN(val) && val > 0) {
        m.displacement = val;
        applied += 1;
      }
    }
  });

  if (applied === 0) {
    console.log('Nenhuma correção aplicada. Verifique o JSON de correções.');
    process.exit(0);
  }

  // backup
  fs.copyFileSync(motorcyclesFile, backupFile);
  console.log('Backup criado em', backupFile);

  // ordering helper: extract displacement from either displacement field or name/desc
  function extractDisplacement(m) {
    if (m.displacement) return parseInt(m.displacement, 10) || 0;
    const s = (m.name || '') + ' ' + (m.desc || '');
    const mm = s.match(/(\d{2,4})(?:\s*cc)?/i);
    if (mm) return parseInt(mm[1], 10);
    return 0;
  }

  function extractYear(m) {
    const y = (m.year || '').match(/(\d{4})/);
    if (y) return parseInt(y[1], 10);
    const yy = (m.year || '').match(/(\d{2,4})/);
    return yy ? parseInt(yy[1], 10) : 0;
  }

  function extractStyle(m) {
    const tokens = (m.name || '').split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      if (/\d{2,4}/.test(tokens[i])) {
        const rest = tokens.slice(i + 1).join(' ').trim();
        if (rest) return rest.toLowerCase();
        break;
      }
    }
    return tokens[tokens.length - 1] ? tokens[tokens.length - 1].toLowerCase() : '';
  }

  motorcycles.forEach(m => {
    m._displacement = extractDisplacement(m);
    m._yearNum = extractYear(m);
    m._style = extractStyle(m);
  });

  motorcycles.sort((a, b) => {
    if ((b._displacement || 0) !== (a._displacement || 0)) return (b._displacement || 0) - (a._displacement || 0);
    if ((b._yearNum || 0) !== (a._yearNum || 0)) return (b._yearNum || 0) - (a._yearNum || 0);
    return String(a._style || '').localeCompare(String(b._style || ''));
  });

  // write back without the temporary fields (keep displacement field)
  const out = motorcycles.map(m => {
    const copy = Object.assign({}, m);
    delete copy._displacement; delete copy._yearNum; delete copy._style;
    return copy;
  });

  writeJson(motorcyclesFile, out);
  console.log(`Aplicadas ${applied} correções e salvo em ${motorcyclesFile}`);
} catch (err) {
  console.error('Erro:', err && err.message || err);
  process.exit(99);
}
