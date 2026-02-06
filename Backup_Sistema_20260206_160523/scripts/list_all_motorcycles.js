const fs = require('fs');

console.log('📋 LISTA COMPLETA DE MOTOCICLETAS E QUILOMETRAGENS\n');
console.log('=' * 80);

// Ler dados corrigidos
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));

// Ordenar por cilindrada e depois por ano
data.sort((a, b) => {
    if (a.displacement !== b.displacement) {
        return (b.displacement || 0) - (a.displacement || 0);
    }
    return (b.year || '').localeCompare(a.year || '');
});

console.log(`Total de motocicletas no catálogo: ${data.length}\n`);

// Agrupar por cilindrada
const groupedByDisplacement = {};
data.forEach(moto => {
    const disp = moto.displacement || 'Sem info';
    if (!groupedByDisplacement[disp]) {
        groupedByDisplacement[disp] = [];
    }
    groupedByDisplacement[disp].push(moto);
});

// Exibir agrupado
Object.keys(groupedByDisplacement).sort((a, b) => b - a).forEach(displacement => {
    console.log(`\n🏍️  ${displacement}cc CILINDRADAS:`);
    console.log('-'.repeat(50));
    
    groupedByDisplacement[displacement].forEach((moto, index) => {
        const km = moto.mileage_display || '0';
        const year = moto.year || 'N/A';
        const color = moto.color || '';
        
        console.log(`${index + 1}. ${moto.name} ${year} (${color})`);
        console.log(`   ID: ${moto.id} | Quilometragem: ${km} km`);
        
        // Verificar se tem imagem
        const hasImage = moto.image && moto.image !== 'images/moto-default.jpg';
        console.log(`   Imagem: ${hasImage ? '✅ Disponível' : '❌ Sem imagem'} ${moto.image || ''}`);
        console.log('');
    });
});

// Estatísticas
console.log('\n📊 ESTATÍSTICAS:');
console.log('=' * 40);

const stats = {
    total: data.length,
    withImages: data.filter(m => m.image && m.image !== 'images/moto-default.jpg').length,
    withoutImages: data.filter(m => !m.image || m.image === 'images/moto-default.jpg').length,
    zeroKm: data.filter(m => (m.mileage || 0) === 0).length,
    lowKm: data.filter(m => (m.mileage || 0) > 0 && (m.mileage || 0) <= 10000).length,
    mediumKm: data.filter(m => (m.mileage || 0) > 10000 && (m.mileage || 0) <= 50000).length,
    highKm: data.filter(m => (m.mileage || 0) > 50000).length
};

console.log(`Total de motos: ${stats.total}`);
console.log(`Com imagens: ${stats.withImages} (${((stats.withImages/stats.total)*100).toFixed(1)}%)`);
console.log(`Sem imagens: ${stats.withoutImages} (${((stats.withoutImages/stats.total)*100).toFixed(1)}%)`);
console.log('');
console.log('Por quilometragem:');
console.log(`• 0 km (zero): ${stats.zeroKm} motos`);
console.log(`• 1-10.000 km: ${stats.lowKm} motos`);
console.log(`• 10.001-50.000 km: ${stats.mediumKm} motos`);
console.log(`• Acima de 50.000 km: ${stats.highKm} motos`);

// Salvar relatório
const reportPath = 'reports/mileage_verification_report.txt';
if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
}

// Gerar conteúdo do relatório
let reportContent = `RELATÓRIO DE VERIFICAÇÃO DE QUILOMETRAGEM
Gerado em: ${new Date().toLocaleString('pt-BR')}
Total de motocicletas: ${data.length}

`;

Object.keys(groupedByDisplacement).sort((a, b) => b - a).forEach(displacement => {
    reportContent += `\n${displacement}cc CILINDRADAS:\n`;
    reportContent += '-'.repeat(50) + '\n';
    
    groupedByDisplacement[displacement].forEach((moto, index) => {
        const km = moto.mileage_display || '0';
        const year = moto.year || 'N/A';
        const color = moto.color || '';
        
        reportContent += `${index + 1}. ${moto.name} ${year} (${color})\n`;
        reportContent += `   ID: ${moto.id} | Quilometragem: ${km} km\n`;
        reportContent += `   Imagem: ${moto.image || 'Sem imagem'}\n\n`;
    });
});

fs.writeFileSync(reportPath, reportContent);
console.log(`\n📄 Relatório salvo em: ${reportPath}`);