const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const pdfPath = path.join('C:', 'Users', 'W10', 'Downloads', 'Contrato_Mottu_Retirada_UAU_8I95_Wesley_Francisco_Rofrigues_de_Oliveira.pdf');

console.log('📄 Lendo contrato Mottu...\n');

async function readPDF() {
    try {
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        console.log('TEXTO DO CONTRATO MOTTU:');
        console.log('='.repeat(80));
        console.log(fullText);
        console.log('='.repeat(80));
        
        // Salvar em arquivo para análise
        fs.writeFileSync('contrato_mottu_texto.txt', fullText);
        console.log('\n✅ Texto salvo em contrato_mottu_texto.txt');
        
    } catch (error) {
        console.error('❌ Erro ao ler PDF:', error.message);
    }
}

readPDF();
