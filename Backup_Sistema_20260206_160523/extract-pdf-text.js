const fs = require('fs');
const path = require('path');

// Leia o PDF enviado pelo usuário
const pdfPath = path.join('C:', 'Users', 'W10', 'Downloads', 'Contrato Twister 250 2022 Bruno.pdf');

console.log('📄 Analisando PDF original da loja...');
console.log('Caminho:', pdfPath);

if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log('✅ PDF encontrado!');
    console.log('Tamanho:', stats.size, 'bytes');
    console.log('\n🔍 Agora vou estudar o PDF e recriar o gerador EXATO\n');
    
    // O PDF tem o conteúdo que preciso replicar
    // Vou criar o gerador baseado no que vi nas screenshots do Word
} else {
    console.log('❌ PDF não encontrado em:', pdfPath);
}
