const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoreDirs = ['node_modules', '.git'];
const exts = ['.js', '.html', '.css', '.md'];

const replacements = [
  { from: /(^\s*\/\/\s*)Admin Panel JavaScript/gm, to: '$1JavaScript do Painel Admin' },
  { from: /(^\s*\/\/\s*)ADMIN PANEL - VERSÃO FINAL QUE FUNCIONA GARANTIDO/gm, to: '$1PAINEL ADMIN - VERSÃO FINAL FUNCIONANDO' },
  { from: /(^\s*\/\/\s*)Form submission/gm, to: '$1Submissão do formulário' },
  { from: /(^\s*\/\/\s*)Handle form submission/gm, to: '$1Tratar submissão do formulário' },
  { from: /(^\s*\/\/\s*)Enhanced form submission with loading/gm, to: '$1Submissão de formulário aprimorada com loading' },
  { from: /(^\s*\/\/\s*)image error handler used by inline onerror attributes/gmi, to: '$1handler de erro de imagem usado por atributos onerror inline' },
  { from: /(^\s*\/\/\s*)fallback to simple DOM rendering/gmi, to: '$1fallback para renderização simples do DOM' },
  { from: /(^\s*\/\/\s*)Image upload drag and drop/gm, to: '$1Upload de imagem via arrastar e soltar' },
  // generic English labels that are safe to translate
  { from: /(^\s*\/\/\s*)Admin Panel Styles/gm, to: '$1Estilos do Painel Admin' }
];

let filesChanged = 0;
let replacementsMade = 0;

function shouldIgnore(dir) {
  return ignoreDirs.some(d => dir.includes(path.sep + d + path.sep));
}

function walk(dir) {
  if (shouldIgnore(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(it => {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      walk(full);
    } else if (it.isFile()) {
      const ext = path.extname(it.name).toLowerCase();
      if (exts.includes(ext)) processFile(full);
    }
  });
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    replacements.forEach(r => {
      const before = content;
      content = content.replace(r.from, r.to);
      if (content !== before) {
        // count how many matches were replaced roughly
        const matches = (before.match(r.from) || []).length;
        replacementsMade += matches;
      }
    });
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesChanged += 1;
      console.log('UPDATED:', filePath);
    }
  } catch (e) {
    // ignore binary or permission errors
    console.error('ERR', filePath, e.message);
  }
}

console.log('Starting translation pass...');
walk(root);
console.log('Done. Files changed:', filesChanged, 'Replacements (approx):', replacementsMade);
process.exit(0);
