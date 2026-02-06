const fs = require('fs');
const path = require('path');

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const motorcycles = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));

const vendidas = motorcycles.filter(m => m.status === 'vendido');

console.log(`\n📊 RELATÓRIO COMPLETO DE PLACAS - MOTOS VENDIDAS\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

let comPlaca = 0;
let semPlaca = 0;

vendidas.forEach((moto, index) => {
    const temPlaca = moto.placa && moto.placa.trim() !== '';
    if (temPlaca) {
        comPlaca++;
    } else {
        semPlaca++;
        console.log(`❌ SEM PLACA: ${moto.marca} ${moto.modelo || moto.name} (${moto.ano})`);
        console.log(`   Comprador: ${moto.buyerName}`);
        console.log(`   Data venda: ${moto.saleDate ? new Date(moto.saleDate).toLocaleDateString('pt-BR') : 'N/A'}`);
        console.log(`   RENAVAM: ${moto.renavam || '(vazio)'}\n`);
    }
});

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`\n📈 RESUMO:`);
console.log(`✅ Com placa: ${comPlaca}/${vendidas.length} (${((comPlaca/vendidas.length)*100).toFixed(1)}%)`);
console.log(`❌ Sem placa: ${semPlaca}/${vendidas.length} (${((semPlaca/vendidas.length)*100).toFixed(1)}%)\n`);
