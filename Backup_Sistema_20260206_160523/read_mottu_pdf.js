const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join('C:', 'Users', 'W10', 'Downloads', 'Contrato_Mottu_Retirada_UAU_8I95_Wesley_Francisco_Rofrigues_de_Oliveira.pdf');

console.log('📄 Lendo contrato Mottu...\n');

async function readPDF() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf.default ? await pdf.default(dataBuffer) : await pdf(dataBuffer);
        
        console.log('TEXTO DO CONTRATO MOTTU:');
        console.log('='.repeat(80));
        console.log(data.text);
        console.log('='.repeat(80));
        
        // Salvar em arquivo para análise
        fs.writeFileSync('contrato_mottu_texto.txt', data.text);
        console.log('\n✅ Texto salvo em contrato_mottu_texto.txt');
        
    } catch (error) {
        console.error('❌ Erro ao ler PDF:', error.message);
    }
}

readPDF();
