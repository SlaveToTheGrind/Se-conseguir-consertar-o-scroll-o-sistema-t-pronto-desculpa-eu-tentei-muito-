const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '20260129'; // versão usada para atualizar os docs

const IGNORE_DIRS = ['node_modules', '.git', 'Backup_Sistema_20260125_193240', '_pastas_antigas', 'Backups', 'Backup_Sistema_20260125_235740', 'Backup_Sistema_20260125_111508'];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(d => filePath.includes(path.sep + d + path.sep) || filePath.endsWith(path.sep + d));
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (shouldIgnore(filePath)) return;
      results.push(...walk(filePath));
    } else {
      if (file.toLowerCase().endsWith('.md')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    if (lines[0] && lines[0].startsWith('Versão:')) {
      lines[0] = `Versão: ${VERSION}`;
    } else if (lines[0] && lines[0].startsWith('#')) {
      // Insert version line after first heading
      lines.splice(1, 0, `Versão: ${VERSION}`);
    } else {
      lines.unshift(`Versão: ${VERSION}`);
    }
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    return { file: filePath, updated: true };
  } catch (err) {
    return { file: filePath, updated: false, error: err.message };
  }
}

(function main() {
  console.log('Scanning for .md files under', ROOT);
  const mdFiles = walk(ROOT);
  console.log('Found', mdFiles.length, '.md files');
  const results = [];
  mdFiles.forEach(f => {
    const res = updateFile(f);
    results.push(res);
    if (res.updated) console.log('Updated', f);
    else console.error('Failed updating', f, res.error);
  });
  console.log('Done. Updated files:', results.filter(r => r.updated).length);
})();
