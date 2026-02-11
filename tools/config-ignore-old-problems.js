const fs = require('fs');
const path = require('path');

// Script para atualizar/crear .vscode/settings.json e adicionar patterns
// que escondem problemas/arquivos de pastas de backup antigas na aba PROBLEMS.

const workspaceRoot = path.resolve(__dirname, '..');
const vscodeDir = path.join(workspaceRoot, '.vscode');
const settingsPath = path.join(vscodeDir, 'settings.json');

const patternsToAdd = {
  problemsExclude: {
    "**/_pastas_antigas/**": true,
    "**/_old_versions/**": true,
    "**/backup*/**": true,
    "**/*backup*/**": true,
    "**/Pega ae Jack*/**": true,
    "**/node_modules/**": true,
    "**/.history/**": true,
    "**/.sass-cache/**": true
  },
  filesExclude: {
    "**/_pastas_antigas/**": true,
    "**/_old_versions/**": true,
    "**/backup*/**": true,
    "**/Pega ae Jack*/**": true
  },
  searchExclude: {
    "**/_pastas_antigas/**": true,
    "**/backup*/**": true,
    "**/_old_versions/**": true
  }
};

function ensureVscodeDir() {
  if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir, { recursive: true });
}

function readSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.warn('Não foi possível ler .vscode/settings.json, sobrescrevendo com novo arquivo. Erro:', e && e.message);
    return {};
  }
}

function merge(obj = {}, additions = {}) {
  const out = Object.assign({}, obj);
  for (const k of Object.keys(additions)) {
    if (typeof additions[k] === 'object' && additions[k] !== null) {
      out[k] = Object.assign({}, out[k] || {}, additions[k]);
    } else {
      out[k] = additions[k];
    }
  }
  return out;
}

function main() {
  ensureVscodeDir();
  const settings = readSettings();

  // Prepare structure if not present
  settings['problems.exclude'] = settings['problems.exclude'] || {};
  settings['files.exclude'] = settings['files.exclude'] || {};
  settings['search.exclude'] = settings['search.exclude'] || {};

  // Merge patterns
  settings['problems.exclude'] = merge(settings['problems.exclude'], patternsToAdd.problemsExclude);
  settings['files.exclude'] = merge(settings['files.exclude'], patternsToAdd.filesExclude);
  settings['search.exclude'] = merge(settings['search.exclude'], patternsToAdd.searchExclude);

  // Pretty write
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  console.log('✅ Atualizado .vscode/settings.json com patterns para ocultar problemas de backups/old folders.');
  console.log('ℹ️ Depois recarregue o VS Code (Command Palette → Reload Window) para aplicar.');
}

main();
