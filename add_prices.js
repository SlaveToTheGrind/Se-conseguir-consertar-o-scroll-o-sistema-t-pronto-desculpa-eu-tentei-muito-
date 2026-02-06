const fs = require('fs');
const path = require('path');

// Ler o arquivo de motocicletas
const motorcyclesFile = path.join(__dirname, 'motorcycles.json');
const motorcycles = JSON.parse(fs.readFileSync(motorcyclesFile, 'utf8'));

// Função para calcular preço baseado em cilindrada, ano e quilometragem
function calculatePrice(displacement, year, mileage) {
    let basePrice = 0;
    
    // Preço base por cilindrada
    if (displacement <= 125) {
        basePrice = 5000;
    } else if (displacement <= 160) {
        basePrice = 7000;
    } else if (displacement <= 250) {
        basePrice = 12000;
    } else if (displacement <= 600) {
        basePrice = 18000;
    } else if (displacement <= 750) {
        basePrice = 25000;
    } else {
        basePrice = 35000;
    }
    
    // Ajustar por ano
    const currentYear = new Date().getFullYear();
    const bikeYear = parseInt(year.split('/')[0]);
    const ageMultiplier = Math.max(0.4, 1 - ((currentYear - bikeYear) * 0.05));
    
    // Ajustar por quilometragem
    const mileageMultiplier = Math.max(0.6, 1 - (mileage / 100000) * 0.3);
    
    const finalPrice = basePrice * ageMultiplier * mileageMultiplier;
    
    // Arredondar para múltiplos de 500
    return Math.round(finalPrice / 500) * 500;
}

// Adicionar preços e campos faltantes
motorcycles.forEach(moto => {
    if (!moto.preco) {
        moto.preco = calculatePrice(
            moto.displacement || 125,
            moto.year || '2015',
            moto.mileage || 50000
        );
    }
    
    // Adicionar campos faltantes
    if (!moto.marca) {
        // Extrair marca do nome
        const name = moto.name.toLowerCase();
        if (name.includes('cb') || name.includes('cbx') || name.includes('nc') || name.includes('cg') || name.includes('biz')) {
            moto.marca = 'Honda';
        } else if (name.includes('xv') || name.includes('virago')) {
            moto.marca = 'Yamaha';
        } else if (name.includes('titan')) {
            moto.marca = 'Honda';
        } else {
            moto.marca = 'Honda'; // Default
        }
    }
    
    if (!moto.categoria) {
        moto.categoria = getCategoryFromDisplacement(moto.displacement || 125);
    }
});

function getCategoryFromDisplacement(displacement) {
    if (!displacement) return 'street';
    if (displacement <= 125) return 'scooter';
    if (displacement <= 250) return 'street';
    if (displacement <= 600) return 'naked';
    if (displacement <= 1000) return 'sport';
    return 'touring';
}

// Criar backup
const backupName = `motorcycles.json.bak-${Date.now()}`;
fs.copyFileSync(motorcyclesFile, backupName);
console.log(`Backup criado: ${backupName}`);

// Salvar arquivo atualizado
fs.writeFileSync(motorcyclesFile, JSON.stringify(motorcycles, null, 2));
console.log('Preços e campos adicionados com sucesso!');
console.log(`${motorcycles.length} motocicletas atualizadas`);