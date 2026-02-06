const fs = require('fs');
const path = require('path');

/**
 * Script para restaurar RENAVAM, PLACA e CHASSI das motos vendidas
 * que perderam esses dados quando foram marcadas como vendidas
 */

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');

console.log('🔧 Iniciando restauração de dados das motos vendidas...\n');

// Ler arquivo principal
const motorcycles = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));

console.log(`📊 Total de motos no sistema: ${motorcycles.length}`);

// Separar vendidas e disponíveis
const vendidas = motorcycles.filter(m => m.status === 'vendido');
const disponiveis = motorcycles.filter(m => m.status !== 'vendido');

console.log(`💰 Motos vendidas: ${vendidas.length}`);
console.log(`🏍️  Motos disponíveis: ${disponiveis.length}\n`);

// Criar mapa de RENAVAMs das motos disponíveis (por marca/modelo/ano)
const renavamMap = new Map();
disponiveis.forEach(moto => {
    if (moto.renavam) {
        const key = `${moto.marca}-${moto.modelo || moto.name}-${moto.ano || moto.year}`;
        if (!renavamMap.has(key)) {
            renavamMap.set(key, {
                renavam: moto.renavam,
                placa: moto.placa,
                chassi: moto.chassi
            });
        }
    }
});

console.log(`📋 RENAVAMs disponíveis para matching: ${renavamMap.size}\n`);

// Estatísticas
let corrigidos = 0;
let semCorrecao = 0;
let jaCompletos = 0;

// Processar motos vendidas
vendidas.forEach(moto => {
    const temRenavam = moto.renavam && moto.renavam.trim() !== '';
    const temPlaca = moto.placa && moto.placa.trim() !== '';
    const temChassi = moto.chassi && moto.chassi.trim() !== '';
    
    // Se já tem todos os dados, pular
    if (temRenavam && temPlaca) {
        jaCompletos++;
        return;
    }
    
    // Tentar encontrar dados correspondentes
    const key = `${moto.marca}-${moto.modelo || moto.name}-${moto.ano || moto.year}`;
    const dados = renavamMap.get(key);
    
    if (dados) {
        let atualizado = false;
        
        if (!temRenavam && dados.renavam) {
            console.log(`✅ ${moto.marca} ${moto.modelo || moto.name} (${moto.ano})`);
            console.log(`   RENAVAM restaurado: ${dados.renavam}`);
            moto.renavam = dados.renavam;
            atualizado = true;
        }
        
        if (!temPlaca && dados.placa) {
            if (!atualizado) {
                console.log(`✅ ${moto.marca} ${moto.modelo || moto.name} (${moto.ano})`);
            }
            console.log(`   PLACA restaurada: ${dados.placa}`);
            moto.placa = dados.placa;
            atualizado = true;
        }
        
        if (!temChassi && dados.chassi) {
            if (!atualizado) {
                console.log(`✅ ${moto.marca} ${moto.modelo || moto.name} (${moto.ano})`);
            }
            console.log(`   CHASSI restaurado: ${dados.chassi}`);
            moto.chassi = dados.chassi;
            atualizado = true;
        }
        
        if (atualizado) {
            moto.updatedAt = new Date().toISOString();
            corrigidos++;
            console.log('');
        }
    } else {
        console.log(`⚠️  ${moto.marca} ${moto.modelo || moto.name} (${moto.ano}) - comprador: ${moto.buyerName}`);
        console.log(`   Sem dados disponíveis para restauração`);
        console.log('');
        semCorrecao++;
    }
});

console.log('\n📈 RESUMO:');
console.log(`✅ Motos corrigidas: ${corrigidos}`);
console.log(`✔️  Motos já completas: ${jaCompletos}`);
console.log(`⚠️  Motos sem correção disponível: ${semCorrecao}`);
console.log(`📊 Total processado: ${vendidas.length}\n`);

// Fazer backup antes de salvar
const backupFile = `${MOTORCYCLES_FILE}.backup-before-restore-${Date.now()}`;
fs.writeFileSync(backupFile, JSON.stringify(motorcycles, null, 2));
console.log(`💾 Backup criado: ${path.basename(backupFile)}\n`);

// Salvar arquivo atualizado
fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(motorcycles, null, 2));
console.log('✅ Arquivo motorcycles.json atualizado com sucesso!\n');

console.log('🎉 Restauração concluída!');
