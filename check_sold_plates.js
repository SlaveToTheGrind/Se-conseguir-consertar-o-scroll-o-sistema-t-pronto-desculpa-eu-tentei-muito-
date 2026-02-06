const fs = require('fs');
const path = require('path');

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const motorcycles = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));

const vendidas = motorcycles.filter(m => m.status === 'vendido');

console.log(`\n📊 ANÁLISE DE PLACAS DAS MOTOS VENDIDAS\n`);
console.log(`Total de motos vendidas: ${vendidas.length}\n`);

const comPlaca = vendidas.filter(m => m.placa && m.placa.trim() !== '');
const semPlaca = vendidas.filter(m => !m.placa || m.placa.trim() === '');

console.log(`✅ Com placa: ${comPlaca.length}`);
console.log(`❌ Sem placa: ${semPlaca.length}\n`);

if (semPlaca.length > 0) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 MOTOS SEM PLACA:\n`);
    semPlaca.forEach(moto => {
        console.log(`❌ ${moto.marca} ${moto.modelo || moto.name} (${moto.ano})`);
        console.log(`   Comprador: ${moto.buyerName}`);
        console.log(`   Placa: "${moto.placa || '(vazio)'}"`);
        console.log(`   RENAVAM: ${moto.renavam || '(vazio)'}\n`);
    });
}

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
