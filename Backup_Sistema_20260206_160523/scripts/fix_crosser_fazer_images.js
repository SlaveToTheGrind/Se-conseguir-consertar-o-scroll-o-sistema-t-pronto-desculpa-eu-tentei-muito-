const fs = require('fs');

console.log('🔧 CORRIGINDO TROCA DE IMAGENS: Crosser com imagem errada!');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-fix-crosser-fazer-images-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));

const fazer = data.find(m => m.name.includes('FAZER'));
const crosser = data.find(m => m.name.includes('CROSSER'));

console.log('\n🔍 SITUAÇÃO ATUAL:');
console.log('FAZER (vermelha):', fazer.image);
console.log('CROSSER (beje):', crosser.image);

console.log('\n❌ PROBLEMA: Crosser está com imagem errada (Bros preta)');
console.log('✅ SOLUÇÃO: Dar à Crosser a imagem da pasta "Crosser 150 Z 2024"');

// Corrigir a Crosser - dar a imagem correta da pasta dela
crosser.image = 'images/Crosser 150 Z 2024/thumb-Foto 1.jpg';
crosser.images = ['images/Crosser 150 Z 2024/thumb-Foto 1.jpg'];
crosser.thumb = 'images/Crosser 150 Z 2024/thumb-Foto 1.jpg';

console.log('\n✅ CORREÇÃO APLICADA:');
console.log('CROSSER agora tem:', crosser.image);
console.log('FAZER mantém:', fazer.image);

// Salvar dados corrigidos
fs.writeFileSync('data/motorcycles.json', JSON.stringify(data, null, 2));

console.log('\n🎯 RESULTADO:');
console.log('✅ FAZER 150 2024/24 (Verm.) - imagem correta (vermelha)');
console.log('✅ CROSSER Z 150cc 2023/24 (Beje) - imagem correta (beje, perfil alto)');
console.log('✨ Correção salva com sucesso!');