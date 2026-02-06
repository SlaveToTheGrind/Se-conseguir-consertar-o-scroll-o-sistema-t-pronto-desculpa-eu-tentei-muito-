const fs = require('fs');
const path = require('path');

const motorcyclesFile = path.join(__dirname, '..', 'motorcycles.json');

function normalizeType(value) {
  if (!value && value !== 0) return '';
  const v = String(value).trim().toLowerCase();
  const map = {
    'streets': 'street',
    'street': 'street',
    'st': 'street',
    'sports': 'sport',
    'sport': 'sport',
    'scooters': 'scooter',
    'scooter': 'scooter',
    'naked': 'naked',
    'adventure': 'adventure',
    'adv': 'adventure',
    'custom': 'custom',
    'touring': 'touring',
    'cruiser': 'cruiser'
  };
  return map[v] || v;
}

function backupFile(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = `${filePath}.bak-${timestamp}`;
  fs.copyFileSync(filePath, dest);
  return dest;
}

try {
  if (!fs.existsSync(motorcyclesFile)) {
    console.error('motorcycles.json não encontrado em', motorcyclesFile);
    process.exit(1);
  }

  console.log('Fazendo backup de motorcycles.json...');
  const bak = backupFile(motorcyclesFile);
  console.log('Backup criado em:', bak);

  const raw = fs.readFileSync(motorcyclesFile, 'utf8');
  const list = JSON.parse(raw || '[]');

  let changed = 0;
  const out = list.map(m => {
    const t = m.type || m.tipo || m.categoria;
    const norm = normalizeType(t || '');
    if (norm && (m.type !== norm)) {
      changed++;
      m.type = norm;
    }
    return m;
  });

  fs.writeFileSync(motorcyclesFile, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Pronto. ${changed} item(ns) atualizados. Arquivo salvo em ${motorcyclesFile}`);
  console.log('Recomendo reiniciar o servidor admin para aplicar mudanças.');
} catch (err) {
  console.error('Erro:', err.message);
  process.exit(1);
}
