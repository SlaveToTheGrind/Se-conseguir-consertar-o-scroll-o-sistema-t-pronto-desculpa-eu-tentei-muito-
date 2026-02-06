const fs = require('fs');
const path = require('path');

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const motorcycles = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));

const vendidas = motorcycles.filter(m => m.status === 'vendido');

console.log(`\n🔍 ANÁLISE DETALHADA DE PLACAS\n`);

// Agrupar por placa
const placaCount = {};
vendidas.forEach(moto => {
    const placa = moto.placa || '(sem placa)';
    if (!placaCount[placa]) {
        placaCount[placa] = [];
    }
    placaCount[placa].push({
        marca: moto.marca,
        modelo: moto.modelo || moto.name,
        ano: moto.ano,
        comprador: moto.buyerName
    });
});

console.log('Placas duplicadas ou suspeitas:\n');
Object.keys(placaCount).forEach(placa => {
    if (placaCount[placa].length > 1) {
        console.log(`⚠️  Placa ${placa} aparece ${placaCount[placa].length} vezes:`);
        placaCount[placa].forEach(moto => {
            console.log(`   - ${moto.marca} ${moto.modelo} (${moto.ano}) - ${moto.comprador}`);
        });
        console.log('');
    }
});

// Criar backup e limpar placas duplicadas
const backupFile = `${MOTORCYCLES_FILE}.backup-before-plate-fix-${Date.now()}`;
fs.writeFileSync(backupFile, JSON.stringify(motorcycles, null, 2));
console.log(`💾 Backup criado: ${path.basename(backupFile)}\n`);

let corrigidos = 0;
vendidas.forEach(moto => {
    // Se a placa é TBP-3I75 mas não é uma MOTTU, provavelmente foi preenchida erroneamente
    if (moto.placa === 'TBP-3I75' && moto.marca !== 'MOTTU') {
        console.log(`🔧 Removendo placa incorreta de: ${moto.marca} ${moto.modelo || moto.name} (${moto.comprador})`);
        moto.placa = '';
        moto.updatedAt = new Date().toISOString();
        corrigidos++;
    }
});

if (corrigidos > 0) {
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(motorcycles, null, 2));
    console.log(`\n✅ ${corrigidos} motos corrigidas (placas incorretas removidas)`);
} else {
    console.log(`\nℹ️  Nenhuma correção necessária`);
}
