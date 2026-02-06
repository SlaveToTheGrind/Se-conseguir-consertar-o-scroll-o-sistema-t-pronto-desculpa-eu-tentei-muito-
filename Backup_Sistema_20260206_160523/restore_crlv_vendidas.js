const fs = require('fs');
const path = require('path');

console.log('🔧 Restaurando CRLV das motos vendidas...\n');

// Ler arquivo atual
const currentFile = path.join(__dirname, 'motorcycles.json');
const currentData = JSON.parse(fs.readFileSync(currentFile, 'utf8'));

// Ler backup mais recente (antes das vendas)
const backupFile = path.join(__dirname, 'Backup_Completo_20260104_173025', 'motorcycles.json');

if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup não encontrado em:', backupFile);
    process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

console.log(`📊 Arquivo atual: ${currentData.length} motos`);
console.log(`📊 Backup: ${backupData.length} motos\n`);

// Criar mapa de motos do backup por ID
const backupMap = {};
backupData.forEach(moto => {
    backupMap[moto.id] = moto;
});

let restored = 0;
let notFound = 0;

// Restaurar documentoPDF para motos vendidas
currentData.forEach(moto => {
    if (moto.status === 'vendido' && !moto.documentoPDF) {
        const backupMoto = backupMap[moto.id];
        if (backupMoto && backupMoto.documentoPDF) {
            moto.documentoPDF = backupMoto.documentoPDF;
            console.log(`✅ Restaurado CRLV: ${moto.marca} ${moto.modelo} (${moto.id})`);
            restored++;
        } else {
            console.log(`⚠️  Sem CRLV no backup: ${moto.marca} ${moto.modelo} (${moto.id})`);
            notFound++;
        }
    }
});

console.log(`\n📈 Resumo:`);
console.log(`   ✅ Restaurados: ${restored}`);
console.log(`   ⚠️  Não encontrados: ${notFound}`);

if (restored > 0) {
    // Fazer backup antes de salvar
    const backupName = `motorcycles.json.backup-before-crlv-restore-${Date.now()}`;
    fs.copyFileSync(currentFile, path.join(__dirname, backupName));
    console.log(`\n💾 Backup criado: ${backupName}`);
    
    // Salvar arquivo atualizado
    fs.writeFileSync(currentFile, JSON.stringify(currentData, null, 2));
    console.log(`\n✅ Arquivo atualizado com sucesso!`);
    console.log(`🔄 Reinicie o servidor para ver as mudanças.`);
} else {
    console.log(`\n⚠️  Nenhum CRLV foi restaurado.`);
}
