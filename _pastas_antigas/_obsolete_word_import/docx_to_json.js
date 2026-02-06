#!/usr/bin/env node
// docx_to_json.js
// Usage: node docx_to_json.js path/to/file.docx
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node docx_to_json.js <file.docx>');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }

  try {
    const result = await mammoth.convertToHtml({ path: abs });
    const html = result.value; // The generated HTML
    const text = (await mammoth.extractRawText({ path: abs })).value;

    const outBase = path.join(path.dirname(abs), path.basename(abs, path.extname(abs)));
    fs.writeFileSync(outBase + '.html', html, 'utf8');
    fs.writeFileSync(outBase + '.txt', text, 'utf8');
    // Simple JSON object with both
    const json = { html, text };
    fs.writeFileSync(outBase + '.json', JSON.stringify(json, null, 2), 'utf8');

    console.log('Wrote:', outBase + '.html', outBase + '.txt', outBase + '.json');
  } catch (e) {
    console.error('Conversion error', e);
    process.exit(2);
  }
}

run();
