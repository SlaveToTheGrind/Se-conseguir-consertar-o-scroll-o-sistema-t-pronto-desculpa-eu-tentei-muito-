/**
 * Script de teste para o sistema de backup
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/backup';

async function testBackupSystem() {
    console.log('\n🧪 TESTE DO SISTEMA DE BACKUP\n');
    console.log('='.repeat(50));

    try {
        // 1. Listar backups existentes
        console.log('\n1️⃣ Listando backups existentes...');
        const listResponse = await axios.get(`${API_URL}/list`);
        console.log(`✅ Backups encontrados: ${listResponse.data.length}`);
        
        if (listResponse.data.length > 0) {
            console.log('\n📋 Backups disponíveis:');
            listResponse.data.slice(0, 3).forEach((backup, index) => {
                console.log(`   ${index + 1}. ${backup.name}`);
                console.log(`      📅 Criado: ${new Date(backup.created).toLocaleString('pt-BR')}`);
                console.log(`      ⏱️ Idade: ${backup.age}`);
            });
        }

        // 2. Criar backup de teste
        console.log('\n2️⃣ Criando backup de teste...');
        const createResponse = await axios.post(`${API_URL}/create`, {
            reason: 'test'
        });
        
        if (createResponse.data.success) {
            console.log(`✅ Backup criado: ${createResponse.data.backupName}`);
            console.log(`   📊 Arquivos: ${createResponse.data.files.length}`);
            createResponse.data.files.forEach(file => {
                console.log(`      - ${file.name}: ${file.sizeFormatted}`);
            });
        }

        // 3. Listar novamente para confirmar
        console.log('\n3️⃣ Verificando novo backup...');
        const updatedList = await axios.get(`${API_URL}/list`);
        console.log(`✅ Total de backups agora: ${updatedList.data.length}`);

        // 4. Estatísticas
        console.log('\n📊 ESTATÍSTICAS:');
        console.log(`   Total de backups: ${updatedList.data.length}`);
        if (updatedList.data.length > 0) {
            console.log(`   Mais recente: ${updatedList.data[0].age}`);
            const totalSize = updatedList.data.reduce((sum, backup) => {
                if (backup.metadata && backup.metadata.files) {
                    return sum + backup.metadata.files.reduce((s, f) => s + f.size, 0);
                }
                return sum;
            }, 0);
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            console.log(`   Espaço total: ${totalSizeMB} MB`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!\n');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Mensagem: ${error.response.data.error || error.message}`);
        } else {
            console.error(`   ${error.message}`);
        }
        console.log('\n💡 Certifique-se de que o servidor está rodando!\n');
        process.exit(1);
    }
}

// Executar teste
testBackupSystem();
