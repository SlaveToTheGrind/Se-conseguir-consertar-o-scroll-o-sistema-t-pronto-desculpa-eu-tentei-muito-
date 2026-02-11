#!/usr/bin/env node
// convert-docx.js
// Convert all .docx files in common documentation folders to html/text/json
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const candidates = [
  'documents',
  'DOCS',
  'DOCS Motos',
  'documents',
  'docs',
  'DOCUMENTACAO',
  '.'
];

function findDocxFiles(root) {
  const results = [];
  function walk(dir) {
    let list;
    try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const entry of list) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        if (/\.docx$/i.test(entry.name)) results.push(full);
      }
    }
  }
  walk(root);
  return results;
}

(async function main(){
  const cwd = process.cwd();
  let all = [];
  for (const cand of candidates) {
    const p = path.join(cwd, cand);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      all = all.concat(findDocxFiles(p));
    }
  }
  // also check root directly (but we'll filter out unwanted large folders)
  all = all.concat(findDocxFiles(cwd));

  // remove duplicates
  all = Array.from(new Set(all));

  // Filter out large or irrelevant folders to keep fast conversion for backups
  const excludePatterns = [/\\node_modules\\/i, /_pastas_antigas/i, /old_versions/i, /Backup_Sistema_/i];
  all = all.filter(f => !excludePatterns.some(rx => rx.test(f)));

  if (all.length === 0) {
    console.log('No .docx files found to convert.');
    process.exit(0);
  }

  console.log('Found', all.length, '.docx files. Converting...');
  for (const f of all) {
    console.log('Converting', f);
    try {
      // call existing docx_to_json.js script
      execFileSync(process.execPath, [path.join(__dirname, 'docx_to_json.js'), f], { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to convert', f, e && e.message ? e.message : e);
    }
  }
  console.log('Done.');
})();
