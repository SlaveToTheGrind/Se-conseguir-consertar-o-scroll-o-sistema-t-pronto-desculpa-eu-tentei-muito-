const fs = require('fs');
const path = require('path');

const infile = process.argv[2] || 'Tabela_de_produtos_MacDavis_Motos_-_Copia[1].json';
const outFile = process.argv[3] || 'motorcycles.json';

if (!fs.existsSync(infile)) {
  console.error('Input file not found:', infile);
  process.exit(1);
}

const raw = fs.readFileSync(infile,'utf8');
const data = JSON.parse(raw);
const text = data.text || '';
const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

// Heuristic: lines that start with '-' contain motorcycle summary
const motoLines = lines.filter(l => l.startsWith('-'));

const motorcycles = motoLines.map((line, idx) => {
  // Example line: "- Biz 125cc 2008/09 (Preta) – 9.500,00/ Km: 55.116"
  const obj = { id: `moto-${idx+1}`, name: '', year: '', color: '', mileage_display: null, mileage: null, desc: '' };
  // remove leading '- '
  let s = line.replace(/^-\s*/, '');
  // split by ' – ' (emdash or hyphen-like) or ' - '
  const parts = s.split(/\s–\s|\s-\s|\s—\s/);
  // first part contains name/year/color
  const first = parts[0] || '';
  // try to capture name and year using regex
  const m = first.match(/^(.+?)\s(\d{4}\/\d{2}|\d{4})\s*\(([^)]+)\)/);
  if (m) {
    obj.name = m[1].trim();
    obj.year = m[2].trim();
    obj.color = m[3].trim();
  } else {
    // fallback: take first token as name
    const tokens = first.split(/\s{2,}|\s\(|\s-\s/);
    obj.name = tokens[0] || first;
  }

  // pricing intentionally omitted for public catalog

  // mileage: look for Km: or Km or just a number after '/'
  const kmMatch = s.match(/Km:\s*([\d\.]+)/i) || s.match(/\/\s*Km:\s*([\d\.]+)/i) || s.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  if (kmMatch) {
    const rawKm = kmMatch[1].trim();
    obj.mileage_display = rawKm;
    const kmNum = parseInt(rawKm.replace(/\./g,''), 10);
    if (!isNaN(kmNum)) obj.mileage = kmNum;
  }

  // we intentionally skip RENAVAM and FIPE for the vitrine/sample JSON
  // (these technical fields are not exported to the public catalog)

  obj.desc = first;
  return obj;
});

fs.writeFileSync(outFile, JSON.stringify(motorcycles, null, 2), 'utf8');
console.log('Wrote', outFile, 'with', motorcycles.length, 'entries');
