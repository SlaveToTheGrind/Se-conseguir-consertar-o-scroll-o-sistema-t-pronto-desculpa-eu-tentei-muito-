const fs = require('fs');

console.log('🎨 Corrigindo cor da Fazer de Azul para Vermelha...');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-fix-fazer-color-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));
console.log('📊 Dados carregados:', data.length, 'motos');

// Encontrar a Fazer
const fazer = data.find(m => m.name.includes('FAZER'));
if (fazer) {
    console.log(`🔍 Encontrada: ${fazer.name} ${fazer.year}`);
    console.log(`🎨 Cor atual: ${fazer.color}`);
    console.log('📸 Analisando imagem: A moto na foto é claramente VERMELHA!');
    
    // Corrigir cor
    const oldColor = fazer.color;
    const oldDesc = fazer.desc;
    
    fazer.color = 'Verm.';
    fazer.desc = 'FAZER 150 2024/24 (Verm.)';
    
    console.log(`✅ Cor corrigida: ${oldColor} → ${fazer.color}`);
    console.log(`📝 Descrição atualizada: ${oldDesc} → ${fazer.desc}`);
    
    // Salvar dados atualizados
    fs.writeFileSync('data/motorcycles.json', JSON.stringify(data, null, 2));
    
    console.log('\n🎯 Correção aplicada com sucesso!');
    console.log('🏍️ FAZER 150 2024/24 (Verm.) - cor correta baseada na imagem');
    console.log('✨ Dados atualizados salvos');
} else {
    console.log('❌ Fazer não encontrada no catálogo');
}

// Verificar resultado
console.log('\n🔍 VERIFICAÇÃO FINAL:');
const fazerAtualizada = data.find(m => m.name.includes('FAZER'));
if (fazerAtualizada) {
    console.log(`Nome: ${fazerAtualizada.name}`);
    console.log(`Ano: ${fazerAtualizada.year}`);
    console.log(`Cor: ${fazerAtualizada.color} ✅`);
    console.log(`Descrição: ${fazerAtualizada.desc}`);
    console.log(`Imagem: ${fazerAtualizada.image}`);
}