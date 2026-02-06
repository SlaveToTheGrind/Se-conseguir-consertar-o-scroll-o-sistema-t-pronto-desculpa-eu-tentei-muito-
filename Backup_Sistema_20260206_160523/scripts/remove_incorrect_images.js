const fs = require('fs');

console.log('🖼️ Removendo imagens temporariamente da Twister 2007 e Virago...');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-remove-images-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));
console.log('📊 Dados carregados:', data.length, 'motos');

// IDs das motos para remover imagens
const motosToRemoveImages = [
    {
        id: 'moto-17', // CBX 250 TWISTER 2006/07 (Amarela)
        name: 'CBX 250 TWISTER 2006/07 (Amarela)',
        reason: 'Imagem incorreta - aguardando foto correta'
    },
    {
        id: 'moto-22', // XV 250S VIRAGO 1998/98 (Preta)
        name: 'XV 250S VIRAGO 1998/98 (Preta)',
        reason: 'Imagem incorreta - aguardando foto correta'
    }
];

let modificationsCount = 0;

motosToRemoveImages.forEach(motoInfo => {
    const moto = data.find(m => m.id === motoInfo.id);
    if (moto) {
        const oldImage = moto.image;
        
        // Remover referências de imagem
        delete moto.image;
        delete moto.images;
        delete moto.thumb;
        
        console.log(`✅ ${motoInfo.name}:`);
        console.log(`   Imagem removida: ${oldImage}`);
        console.log(`   Motivo: ${motoInfo.reason}`);
        console.log('   Status: Sem foto (aguardando imagem correta)');
        modificationsCount++;
    } else {
        console.log(`❌ Não encontrado: ${motoInfo.id}`);
    }
});

// Salvar dados atualizados
fs.writeFileSync('data/motorcycles.json', JSON.stringify(data, null, 2));

console.log(`\n🎯 Resumo:`);
console.log(`• Imagens removidas: ${modificationsCount} motos`);
console.log('• Status: Twister 2007 e Virago agora aparecem "sem foto"');
console.log('• Próximo passo: Adicionar fotos corretas nas pastas correspondentes');
console.log('✨ Dados atualizados salvos em: data/motorcycles.json');