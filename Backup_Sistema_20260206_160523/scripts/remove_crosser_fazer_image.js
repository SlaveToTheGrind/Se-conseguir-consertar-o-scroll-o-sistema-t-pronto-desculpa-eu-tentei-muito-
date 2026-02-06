const fs = require('fs');

console.log('🖼️ Removendo imagem incorreta da Crosser (foto é da Fazer)...');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-remove-crosser-image-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));
console.log('📊 Dados carregados:', data.length, 'motos');

// Encontrar e corrigir a Crosser
const crosser = data.find(m => m.id === 'moto-14');
if (crosser) {
    const oldImage = crosser.image;
    
    console.log(`🔍 Encontrada: ${crosser.name} ${crosser.year}`);
    console.log(`📸 Imagem atual: ${oldImage}`);
    console.log('🚨 PROBLEMA: Foto mostra uma FAZER, não uma CROSSER');
    
    // Remover referências de imagem incorreta
    delete crosser.image;
    delete crosser.images;
    delete crosser.thumb;
    
    console.log('✅ Imagem da Fazer removida da Crosser');
    console.log('📝 Status: Crosser agora aparece "sem foto"');
    console.log('💡 Nota: A Fazer não está cadastrada no sistema');
    
    // Salvar dados atualizados
    fs.writeFileSync('data/motorcycles.json', JSON.stringify(data, null, 2));
    
    console.log('\n🎯 Resumo:');
    console.log('• Imagem incorreta removida da Crosser Z 150cc');
    console.log('• Motivo: Foto era de uma Fazer, não de uma Crosser'); 
    console.log('• A Fazer não consta no catálogo atual');
    console.log('• Crosser agora aguarda foto correta');
    console.log('✨ Dados atualizados salvos');
} else {
    console.log('❌ Crosser não encontrada');
}

// Listar todas as motos sem foto agora
console.log('\n📋 MOTOS SEM FOTO APÓS CORREÇÃO:');
const motosWithoutImages = data.filter(m => !m.image);
motosWithoutImages.forEach((m, i) => {
    console.log(`${i+1}. ${m.name} ${m.year} (${m.color}) - ${m.mileage_display} km`);
});