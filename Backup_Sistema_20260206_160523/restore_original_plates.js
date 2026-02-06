const fs = require('fs');
const path = require('path');

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const BACKUP_ORIGINAL = path.join(__dirname, 'motorcycles.json.backup-before-restore-1767036197639');

console.log('🔍 Comparando estado ANTES da restauração profunda...\n');

// Ler arquivo atual
const atual = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));

// Ler backup antes da restauração profunda
let original;
try {
    original = JSON.parse(fs.readFileSync(BACKUP_ORIGINAL, 'utf8'));
} catch (error) {
    console.log('⚠️  Backup não encontrado, usando motorcycles.json.backup-1765975898525');
    original = JSON.parse(fs.readFileSync(path.join(__dirname, 'motorcycles.json.backup-1765975898525'), 'utf8'));
}

// Comparar vendidas
const vendidasAtual = atual.filter(m => m.status === 'vendido');
const vendidasOriginal = original.filter(m => m.status === 'vendido');

console.log(`📊 Motos vendidas atuais: ${vendidasAtual.length}`);
console.log(`📊 Motos vendidas no backup: ${vendidasOriginal.length}\n`);

// Criar mapa do original
const originalMap = new Map();
vendidasOriginal.forEach(moto => {
    originalMap.set(moto.id, {
        placa: moto.placa || '',
        renavam: moto.renavam || ''
    });
});

// Verificar quais placas foram adicionadas incorretamente
let placasAdicionadas = [];
vendidasAtual.forEach(moto => {
    const original = originalMap.get(moto.id);
    if (original) {
        const placaAtual = moto.placa || '';
        const placaOriginal = original.placa || '';
        
        if (placaAtual && !placaOriginal) {
            placasAdicionadas.push({
                id: moto.id,
                marca: moto.marca,
                modelo: moto.modelo || moto.name,
                ano: moto.ano,
                comprador: moto.buyerName,
                placaAdicionada: placaAtual
            });
        }
    }
});

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`🔧 PLACAS ADICIONADAS PELO SCRIPT (serão removidas):\n`);

placasAdicionadas.forEach(info => {
    console.log(`⚠️  ${info.marca} ${info.modelo} (${info.ano}) - ${info.comprador}`);
    console.log(`   Placa adicionada: ${info.placaAdicionada}\n`);
});

if (placasAdicionadas.length > 0) {
    // Fazer backup
    const backupFile = `${MOTORCYCLES_FILE}.backup-before-plate-removal-${Date.now()}`;
    fs.writeFileSync(backupFile, JSON.stringify(atual, null, 2));
    console.log(`💾 Backup criado: ${path.basename(backupFile)}\n`);
    
    // Remover placas adicionadas incorretamente
    placasAdicionadas.forEach(info => {
        const moto = atual.find(m => m.id === info.id);
        if (moto) {
            moto.placa = '';
            moto.updatedAt = new Date().toISOString();
        }
    });
    
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(atual, null, 2));
    console.log(`✅ ${placasAdicionadas.length} placas removidas (voltaram ao estado original)\n`);
} else {
    console.log(`ℹ️  Nenhuma placa foi adicionada incorretamente\n`);
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
