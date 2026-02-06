const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo dados de quilometragem...');

// Ler dados atuais
const dataPath = 'data/motorcycles.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📊 Dados carregados:', data.length, 'motos');

// Corrections based on original document analysis
const corrections = [
    {
        id: 'moto-15', // CG Titan 160cc 2025/25 (Laranja)
        name: 'CG Titan 160cc',
        year: '2025/25',
        correctMileage: 0,
        correctMileageDisplay: '0',
        issue: 'Estava mostrando 6.659 km (da Crosser), deveria ser 0'
    },
    {
        id: 'moto-14', // CROSSER Z 150cc 2023/24 (Beje)
        name: 'CROSSER Z 150cc',
        year: '2023/24',
        correctMileage: 6659,
        correctMileageDisplay: '6.659',
        issue: 'Estava com 3.777 km, deveria ser 6.659'
    }
];

// Apply corrections
let correctionsMade = 0;

corrections.forEach(correction => {
    const moto = data.find(m => m.id === correction.id);
    if (moto) {
        const oldMileage = moto.mileage_display;
        moto.mileage = correction.correctMileage;
        moto.mileage_display = correction.correctMileageDisplay;
        
        console.log(`✅ ${correction.name} (${correction.year}):`);
        console.log(`   Anterior: ${oldMileage} -> Novo: ${correction.correctMileageDisplay}`);
        console.log(`   Motivo: ${correction.issue}`);
        correctionsMade++;
    } else {
        console.log(`❌ Não encontrado: ${correction.id}`);
    }
});

// Create backup with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-mileage-fix-${timestamp}.json`;
fs.writeFileSync(backupPath, fs.readFileSync(dataPath, 'utf8'));
console.log(`💾 Backup criado: ${backupPath}`);

// Save corrected data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\n🎯 Correções aplicadas: ${correctionsMade}`);
console.log('✨ Dados corrigidos salvos em:', dataPath);