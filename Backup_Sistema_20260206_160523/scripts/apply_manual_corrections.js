const fs = require('fs');

console.log('🔧 Aplicando correções de quilometragem conforme verificação manual...');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-manual-corrections-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));
console.log('📊 Dados carregados:', data.length, 'motos');

// Correções baseadas na verificação manual do usuário
const corrections = [
    // 1. CB 250 TWISTER 2022/22 (Verm.) - moto-20
    { id: 'moto-20', newMileage: 5600, newMileageDisplay: '5.600', reason: 'Correção manual: 76.000 → 5.600' },
    
    // 2. CBX 250 TWISTER 2006/07 (Amarela) - moto-17  
    { id: 'moto-17', newMileage: 45000, newMileageDisplay: '45.000', reason: 'Correção manual: 15.256 → 45.000' },
    
    // 4. CBX 200 STRADA 1999/99 (Roxa) - moto-16
    { id: 'moto-16', newMileage: 15200, newMileageDisplay: '15.200', reason: 'Correção manual: 0 → 15.200' },
    
    // 6. BROS 160cc ESDD 2022/23 (Cinza) - moto-13
    { id: 'moto-13', newMileage: 3700, newMileageDisplay: '3.700', reason: 'Correção manual: 41.824 → 3.700' },
    
    // 7. BROS 160cc ESDD 2019/19 (Verm.) - moto-12
    { id: 'moto-12', newMileage: 41824, newMileageDisplay: '41.824', reason: 'Correção manual: 6.478 → 41.824' },
    
    // 9. CG Titan 150cc EX 2011/11 (Preta) - moto-11
    { id: 'moto-11', newMileage: 6478, newMileageDisplay: '6.478', reason: 'Correção manual: 400 → 6.478' }
];

// Aplicar correções
let correctionsMade = 0;
corrections.forEach(correction => {
    const moto = data.find(m => m.id === correction.id);
    if (moto) {
        const oldMileage = moto.mileage_display;
        moto.mileage = correction.newMileage;
        moto.mileage_display = correction.newMileageDisplay;
        
        console.log(`✅ ${moto.name} (${moto.year}):`);
        console.log(`   ${oldMileage} → ${correction.newMileageDisplay} km`);
        console.log(`   ${correction.reason}`);
        correctionsMade++;
    } else {
        console.log(`❌ Não encontrado: ${correction.id}`);
    }
});

// Remover moto-3 (Biz 125cc 2022/22 Branca) conforme solicitado
const initialCount = data.length;
const filteredData = data.filter(moto => moto.id !== 'moto-3');
const removedCount = initialCount - filteredData.length;

if (removedCount > 0) {
    console.log(`🗑️  Removida da vitrine: Biz 125cc 2022/22 (Branca) - ID: moto-3`);
    console.log(`   Total de motos: ${initialCount} → ${filteredData.length}`);
}

// Salvar dados corrigidos
fs.writeFileSync('data/motorcycles.json', JSON.stringify(filteredData, null, 2));

console.log(`\n🎯 Resumo das alterações:`);
console.log(`• Correções de quilometragem: ${correctionsMade}`);
console.log(`• Motos removidas: ${removedCount}`);
console.log(`• Total final de motos: ${filteredData.length}`);
console.log('✨ Dados atualizados salvos em: data/motorcycles.json');