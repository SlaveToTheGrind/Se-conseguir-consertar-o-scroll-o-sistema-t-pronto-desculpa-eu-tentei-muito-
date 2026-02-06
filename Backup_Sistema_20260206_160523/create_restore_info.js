const fs = require('fs');
const path = require('path');

// Usage: node create_restore_info.js <backupName>
const nameArg = process.argv[2] || `manual-${Date.now()}`;
const backupName = nameArg;
const restoreInfo = {
  restored: true,
  backupName,
  backupPath: path.join(__dirname, 'backups', backupName),
  restoredAt: new Date().toISOString()
};

const outPath = path.join(__dirname, 'RESTORE_INFO.json');
fs.writeFileSync(outPath, JSON.stringify(restoreInfo, null, 2), 'utf8');
console.log('RESTORE_INFO.json written to', outPath);
console.log(JSON.stringify(restoreInfo, null, 2));
