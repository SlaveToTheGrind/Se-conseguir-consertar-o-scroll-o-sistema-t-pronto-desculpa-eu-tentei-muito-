const fs = require('fs');
const path = require('path');

/**
 * Script de restauração profunda - vasculha TODOS os backups
 * para recuperar RENAVAM, PLACA e CHASSI das motos vendidas
 */

const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const BACKUP_DIRS = [
    __dirname,
    path.join(__dirname, 'data'),
    path.join(__dirname, 'backup_versao_funcional_sistema_22_Dezembro'),
    path.join(__dirname, 'Backup_Completo_20251222_235757'),
    path.join(__dirname, 'Backup_Completo_20251223_155651'),
    path.join(__dirname, 'Backup_Completo_20251222_235809'),
    path.join(__dirname, 'Backup_Completo_20251222_082135'),
    path.join(__dirname, 'Backup_Completo_20251222_080403'),
    path.join(__dirname, 'Backup_Completo_20251221_115627'),
    path.join(__dirname, 'Backup_que_ainda_nao_quebrou')
];

console.log('🔍 RESTAURAÇÃO PROFUNDA - Vasculhando todos os backups...\n');

// Ler arquivo atual
const currentMotos = JSON.parse(fs.readFileSync(MOTORCYCLES_FILE, 'utf8'));
const vendidas = currentMotos.filter(m => m.status === 'vendido');

console.log(`📊 Total de motos: ${currentMotos.length}`);
console.log(`💰 Motos vendidas: ${vendidas.length}\n`);

// Criar mapa de motos vendidas por ID
const vendidasMap = new Map();
vendidas.forEach(moto => {
    vendidasMap.set(moto.id, {
        moto: moto,
        index: currentMotos.indexOf(moto),
        marca: moto.marca,
        modelo: moto.modelo || moto.name,
        ano: moto.ano || moto.year,
        comprador: moto.buyerName,
        temRenavam: !!(moto.renavam && moto.renavam.trim()),
        temPlaca: !!(moto.placa && moto.placa.trim()),
        temChassi: !!(moto.chassi && moto.chassi.trim())
    });
});

// Mapa para armazenar dados encontrados
const dadosEncontrados = new Map();

// Buscar em todos os arquivos de backup
let arquivosProcessados = 0;

BACKUP_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Diretório não encontrado: ${dir}`);
        return;
    }
    
    // Verificar se é um diretório
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
        console.log(`⚠️  Não é um diretório: ${dir}`);
        return;
    }
    
    const files = fs.readdirSync(dir);
    const jsonFiles = files.filter(f => 
        f.includes('motorcycles.json') && 
        !f.includes('backup-before-restore') &&
        (f.endsWith('.json') || f.includes('.json.bak') || f.includes('.backup'))
    );
    
    jsonFiles.forEach(file => {
        const filePath = path.join(dir, file);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const motos = JSON.parse(content);
            
            if (!Array.isArray(motos)) return;
            
            arquivosProcessados++;
            console.log(`📁 Processando: ${path.basename(dir)}/${file}`);
            
            motos.forEach(moto => {
                // Tentar encontrar por ID exato
                if (moto.id && vendidasMap.has(moto.id)) {
                    const vendidaInfo = vendidasMap.get(moto.id);
                    
                    // Se a moto vendida não tem os dados mas este backup tem
                    if (moto.renavam && moto.renavam.trim() && !vendidaInfo.temRenavam) {
                        if (!dadosEncontrados.has(moto.id)) {
                            dadosEncontrados.set(moto.id, {});
                        }
                        dadosEncontrados.get(moto.id).renavam = moto.renavam;
                        dadosEncontrados.get(moto.id).fonte_renavam = file;
                    }
                    
                    if (moto.placa && moto.placa.trim() && !vendidaInfo.temPlaca) {
                        if (!dadosEncontrados.has(moto.id)) {
                            dadosEncontrados.set(moto.id, {});
                        }
                        dadosEncontrados.get(moto.id).placa = moto.placa;
                        dadosEncontrados.get(moto.id).fonte_placa = file;
                    }
                    
                    if (moto.chassi && moto.chassi.trim() && !vendidaInfo.temChassi) {
                        if (!dadosEncontrados.has(moto.id)) {
                            dadosEncontrados.set(moto.id, {});
                        }
                        dadosEncontrados.get(moto.id).chassi = moto.chassi;
                        dadosEncontrados.get(moto.id).fonte_chassi = file;
                    }
                }
                
                // Tentar match por marca/modelo/ano para motos que perderam ID
                vendidasMap.forEach((vendidaInfo, vendidaId) => {
                    if (!dadosEncontrados.has(vendidaId) || 
                        (!dadosEncontrados.get(vendidaId).renavam && !vendidaInfo.temRenavam)) {
                        
                        const matchMarca = moto.marca === vendidaInfo.marca;
                        const matchModelo = (moto.modelo || moto.name) === vendidaInfo.modelo;
                        const matchAno = (moto.ano || moto.year) === vendidaInfo.ano;
                        
                        if (matchMarca && matchModelo && matchAno) {
                            if (moto.renavam && moto.renavam.trim() && !vendidaInfo.temRenavam) {
                                if (!dadosEncontrados.has(vendidaId)) {
                                    dadosEncontrados.set(vendidaId, {});
                                }
                                if (!dadosEncontrados.get(vendidaId).renavam) {
                                    dadosEncontrados.get(vendidaId).renavam = moto.renavam;
                                    dadosEncontrados.get(vendidaId).fonte_renavam = file + ' (match)';
                                }
                            }
                            
                            if (moto.placa && moto.placa.trim() && !vendidaInfo.temPlaca) {
                                if (!dadosEncontrados.has(vendidaId)) {
                                    dadosEncontrados.set(vendidaId, {});
                                }
                                if (!dadosEncontrados.get(vendidaId).placa) {
                                    dadosEncontrados.get(vendidaId).placa = moto.placa;
                                    dadosEncontrados.get(vendidaId).fonte_placa = file + ' (match)';
                                }
                            }
                            
                            if (moto.chassi && moto.chassi.trim() && !vendidaInfo.temChassi) {
                                if (!dadosEncontrados.has(vendidaId)) {
                                    dadosEncontrados.set(vendidaId, {});
                                }
                                if (!dadosEncontrados.get(vendidaId).chassi) {
                                    dadosEncontrados.get(vendidaId).chassi = moto.chassi;
                                    dadosEncontrados.get(vendidaId).fonte_chassi = file + ' (match)';
                                }
                            }
                        }
                    }
                });
            });
            
        } catch (error) {
            // Ignorar arquivos que não podem ser lidos
        }
    });
});

console.log(`\n📚 Arquivos de backup processados: ${arquivosProcessados}\n`);
console.log(`🔎 Dados encontrados para: ${dadosEncontrados.size} motos\n`);

// Aplicar as correções
let corrigidos = 0;
let detalhes = [];

dadosEncontrados.forEach((dados, motoId) => {
    const vendidaInfo = vendidasMap.get(motoId);
    const moto = vendidaInfo.moto;
    
    let log = `✅ ${moto.marca} ${moto.modelo || moto.name} (${moto.ano}) - ${moto.buyerName}`;
    let atualizado = false;
    
    if (dados.renavam && !vendidaInfo.temRenavam) {
        moto.renavam = dados.renavam;
        log += `\n   ✓ RENAVAM: ${dados.renavam}`;
        log += `\n     Fonte: ${dados.fonte_renavam}`;
        atualizado = true;
    }
    
    if (dados.placa && !vendidaInfo.temPlaca) {
        moto.placa = dados.placa;
        log += `\n   ✓ PLACA: ${dados.placa}`;
        log += `\n     Fonte: ${dados.fonte_placa}`;
        atualizado = true;
    }
    
    if (dados.chassi && !vendidaInfo.temChassi) {
        moto.chassi = dados.chassi;
        log += `\n   ✓ CHASSI: ${dados.chassi}`;
        log += `\n     Fonte: ${dados.fonte_chassi}`;
        atualizado = true;
    }
    
    if (atualizado) {
        moto.updatedAt = new Date().toISOString();
        corrigidos++;
        detalhes.push(log);
    }
});

// Exibir detalhes das correções
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 DETALHES DAS RESTAURAÇÕES:\n');
detalhes.forEach(d => console.log(d + '\n'));

// Estatísticas finais
const comRenavam = vendidas.filter(m => m.renavam && m.renavam.trim()).length;
const comPlaca = vendidas.filter(m => m.placa && m.placa.trim()).length;
const comChassi = vendidas.filter(m => m.chassi && m.chassi.trim()).length;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 ESTATÍSTICAS FINAIS:');
console.log(`✅ Motos restauradas nesta execução: ${corrigidos}`);
console.log(`📋 Total com RENAVAM: ${comRenavam}/${vendidas.length}`);
console.log(`🏷️  Total com PLACA: ${comPlaca}/${vendidas.length}`);
console.log(`🔢 Total com CHASSI: ${comChassi}/${vendidas.length}`);
console.log(`⚠️  Ainda sem RENAVAM: ${vendidas.length - comRenavam}`);
console.log(`⚠️  Ainda sem PLACA: ${vendidas.length - comPlaca}\n`);

if (corrigidos > 0) {
    // Fazer backup antes de salvar
    const backupFile = `${MOTORCYCLES_FILE}.backup-deep-restore-${Date.now()}`;
    fs.writeFileSync(backupFile, fs.readFileSync(MOTORCYCLES_FILE));
    console.log(`💾 Backup criado: ${path.basename(backupFile)}\n`);
    
    // Salvar arquivo atualizado
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(currentMotos, null, 2));
    console.log('✅ Arquivo motorcycles.json atualizado com sucesso!\n');
    console.log('🎉 Restauração profunda concluída!');
} else {
    console.log('ℹ️  Nenhuma restauração necessária - todos os dados já estão atualizados.');
}
