const fs = require('fs');
const path = require('path');

// Função para limpar backups antigos (manter apenas últimas 48 horas)
function cleanupOldBackups() {
    const currentDir = __dirname;
    const fortyEightHoursAgo = new Date(Date.now() - (48 * 60 * 60 * 1000));
    
    console.log('🧹 Limpando backups antigos...');
    console.log(`Data limite: ${fortyEightHoursAgo.toLocaleString()}`);
    
    let removedCount = 0;
    let keptCount = 0;
    
    try {
        const files = fs.readdirSync(currentDir);
        
        files.forEach(file => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            // Verificar se é arquivo de backup
            const isBackupFile = (
                file.startsWith('motorcycles.json.bak-') ||
                file.startsWith('backup_') ||
                file.endsWith('.bak') ||
                (stat.isDirectory() && file.startsWith('backup_'))
            );
            
            if (isBackupFile) {
                const fileDate = stat.mtime;
                
                if (fileDate < fortyEightHoursAgo) {
                    try {
                        if (stat.isDirectory()) {
                            // Remover diretório recursivamente
                            fs.rmSync(filePath, { recursive: true, force: true });
                            console.log(`🗑️  Diretório removido: ${file}`);
                        } else {
                            // Remover arquivo
                            fs.unlinkSync(filePath);
                            console.log(`🗑️  Arquivo removido: ${file}`);
                        }
                        removedCount++;
                    } catch (error) {
                        console.error(`❌ Erro ao remover ${file}:`, error.message);
                    }
                } else {
                    console.log(`✅ Mantido (recente): ${file}`);
                    keptCount++;
                }
            }
        });
        
        console.log(`\n📊 Resultado da limpeza:`);
        console.log(`   📦 Backups mantidos: ${keptCount}`);
        console.log(`   🗑️  Backups removidos: ${removedCount}`);
        console.log(`   💾 Espaço liberado!`);
        
    } catch (error) {
        console.error('❌ Erro durante limpeza:', error.message);
    }
}

// Executar limpeza
cleanupOldBackups();