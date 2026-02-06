const fs = require('fs');

console.log('🏍️ Adicionando Fazer 150 2024 ao catálogo...');

// Criar backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = `data/motorcycles.json.bak-add-fazer-${timestamp}.json`;
fs.copyFileSync('data/motorcycles.json', backupPath);
console.log(`💾 Backup criado: ${backupPath}`);

// Ler dados atuais
const data = JSON.parse(fs.readFileSync('data/motorcycles.json', 'utf8'));
console.log('📊 Dados carregados:', data.length, 'motos');

// Verificar se já existe
const fazerExists = data.find(m => m.name.includes('FAZER'));
if (fazerExists) {
    console.log('⚠️ Fazer já existe no catálogo:', fazerExists.name);
    return;
}

// Gerar próximo ID
const maxId = Math.max(...data.map(m => parseInt(m.id.replace('moto-', ''))));
const newId = `moto-${maxId + 1}`;

// Criar nova entrada para a Fazer
const novaFazer = {
    "id": newId,
    "name": "FAZER 150",
    "year": "2024/24",
    "color": "Azul", // Assumindo uma cor, pode ser ajustada depois
    "mileage_display": "0", // Assumindo zero km, pode ser ajustada depois
    "mileage": 0,
    "desc": "FAZER 150 2024/24 (Azul)",
    "displacement": 150,
    // Imagem será adicionada pelo processo de import automático
};

// Adicionar ao array
data.push(novaFazer);

// Ordenar por cilindrada e ano (opcional, para manter organização)
data.sort((a, b) => {
    if ((b.displacement || 0) !== (a.displacement || 0)) {
        return (b.displacement || 0) - (a.displacement || 0);
    }
    return (b.year || '').localeCompare(a.year || '');
});

// Salvar dados atualizados
fs.writeFileSync('data/motorcycles.json', JSON.stringify(data, null, 2));

console.log(`✅ Fazer 150 2024 adicionada com sucesso!`);
console.log(`📝 ID gerado: ${newId}`);
console.log(`🏍️ Nome: ${novaFazer.name} ${novaFazer.year}`);
console.log(`📊 Total de motos: ${data.length}`);

console.log('\n🔄 Executando re-import para mapear a imagem da Fazer...');

// Executar re-import para pegar a imagem
const { execSync } = require('child_process');
try {
    const importResult = execSync('node scripts/import_by_folder_name.js', { encoding: 'utf8' });
    console.log('📸 Import executado:');
    console.log(importResult);
} catch (error) {
    console.log('⚠️ Erro no import, execute manualmente:', error.message);
}

console.log('\n✨ Fazer 150 2024 mapeada e pronta para uso!');