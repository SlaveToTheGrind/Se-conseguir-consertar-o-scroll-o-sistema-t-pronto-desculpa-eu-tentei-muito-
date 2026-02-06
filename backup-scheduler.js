/**
 * Sistema de Backup Automático - MacDavis Motos
 * 
 * Funcionalidades:
 * - Backup diário automático às 23:00
 * - Backup manual via API
 * - Rotação automática (mantém últimos 7 dias)
 * - Backup de: data.json, motorcycles.json, admin_users.json
 * - Backup de pastas: images/, DOCS Motos/ (incluindo contratos)
 * - Logs detalhados
 */

const fs = require('fs');
const path = require('path');

class BackupScheduler {
    constructor(options = {}) {
        this.backupDir = options.backupDir || path.join(__dirname, 'backups');
        this.dataFiles = options.dataFiles || [
            'data.json',
            'motorcycles.json', 
            'admin_users.json'
        ];
        this.dataFolders = options.dataFolders || [
            'images',
            'DOCS Motos'
        ];
        this.retentionDays = options.retentionDays || 7;
        this.autoBackupTime = options.autoBackupTime || '23:00'; // HH:MM
        this.enabled = options.enabled !== false;
        
        // Criar pasta de backups se não existir
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('📁 Pasta de backups criada:', this.backupDir);
        }
        
        // Iniciar agendamento automático
        if (this.enabled) {
            this.scheduleDaily();
        }
    }
    
    /**
     * Criar backup manual
     */
    async createBackup(reason = 'manual') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupName = `backup_${timestamp}_${reason}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        try {
            // Criar pasta do backup
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            
            const results = {
                success: true,
                timestamp: new Date().toISOString(),
                backupName,
                backupPath,
                reason,
                files: [],
                errors: []
            };
            
            // Fazer backup de cada arquivo
            for (const fileName of this.dataFiles) {
                const sourcePath = path.join(__dirname, fileName);
                const destPath = path.join(backupPath, fileName);
                
                try {
                    if (fs.existsSync(sourcePath)) {
                        const content = fs.readFileSync(sourcePath, 'utf8');
                        fs.writeFileSync(destPath, content, 'utf8');
                        
                        const stats = fs.statSync(destPath);
                        results.files.push({
                            name: fileName,
                            size: stats.size,
                            sizeFormatted: this.formatBytes(stats.size),
                            status: 'ok',
                            type: 'file'
                        });
                        
                        console.log(`✅ Backup criado: ${fileName} (${this.formatBytes(stats.size)})`);
                    } else {
                        results.errors.push({
                            file: fileName,
                            error: 'Arquivo não encontrado'
                        });
                        console.warn(`⚠️ Arquivo não encontrado: ${fileName}`);
                    }
                } catch (err) {
                    results.errors.push({
                        file: fileName,
                        error: err.message
                    });
                    console.error(`❌ Erro ao fazer backup de ${fileName}:`, err.message);
                }
            }
            
            // Fazer backup de cada pasta
            for (const folderName of this.dataFolders) {
                const sourcePath = path.join(__dirname, folderName);
                const destPath = path.join(backupPath, folderName);
                
                try {
                    if (fs.existsSync(sourcePath)) {
                        const folderSize = this.copyDirectory(sourcePath, destPath);
                        
                        results.files.push({
                            name: folderName,
                            size: folderSize,
                            sizeFormatted: this.formatBytes(folderSize),
                            status: 'ok',
                            type: 'folder'
                        });
                        
                        console.log(`✅ Backup criado: ${folderName}/ (${this.formatBytes(folderSize)})`);
                    } else {
                        console.warn(`⚠️ Pasta não encontrada: ${folderName}`);
                    }
                } catch (err) {
                    results.errors.push({
                        file: folderName,
                        error: err.message
                    });
                    console.error(`❌ Erro ao fazer backup de ${folderName}/:`, err.message);
                }
            }
            
            // Salvar metadata do backup
            const metadataPath = path.join(backupPath, '_metadata.json');
            fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2), 'utf8');
            
            console.log(`\n✅ Backup concluído: ${backupName}`);
            console.log(`📁 Localização: ${backupPath}`);
            console.log(`📊 Arquivos: ${results.files.length} ok, ${results.errors.length} erros\n`);
            
            // Limpar backups antigos
            await this.cleanOldBackups();
            
            return results;
            
        } catch (err) {
            console.error('❌ Erro ao criar backup:', err.message);
            throw err;
        }
    }
    
    /**
     * Limpar backups antigos (manter apenas os últimos N dias)
     */
    async cleanOldBackups() {
        try {
            const now = Date.now();
            const maxAge = this.retentionDays * 24 * 60 * 60 * 1000; // dias em ms
            
            const backups = fs.readdirSync(this.backupDir)
                .filter(name => name.startsWith('backup_'))
                .map(name => ({
                    name,
                    path: path.join(this.backupDir, name),
                    mtime: fs.statSync(path.join(this.backupDir, name)).mtime.getTime()
                }))
                .filter(backup => (now - backup.mtime) > maxAge)
                .sort((a, b) => a.mtime - b.mtime); // mais antigos primeiro
            
            if (backups.length > 0) {
                console.log(`🧹 Limpando ${backups.length} backup(s) antigo(s)...`);
                
                for (const backup of backups) {
                    this.deleteDirectory(backup.path);
                    console.log(`🗑️ Removido: ${backup.name}`);
                }
            }
            
        } catch (err) {
            console.error('❌ Erro ao limpar backups antigos:', err.message);
        }
    }
    
    /**
     * Listar todos os backups disponíveis
     */
    listBackups() {
        try {
            const items = fs.readdirSync(this.backupDir);
            
            const backups = items
                .filter(name => {
                    // Filtrar apenas diretórios que começam com "backup_"
                    const itemPath = path.join(this.backupDir, name);
                    try {
                        const stats = fs.statSync(itemPath);
                        return stats.isDirectory() && name.startsWith('backup_');
                    } catch (e) {
                        return false;
                    }
                })
                .map(name => {
                    try {
                        const backupPath = path.join(this.backupDir, name);
                        const metadataPath = path.join(backupPath, '_metadata.json');
                        const stats = fs.statSync(backupPath);
                        
                        let metadata = null;
                        if (fs.existsSync(metadataPath)) {
                            try {
                                metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                            } catch (e) {
                                console.warn(`⚠️ Erro ao ler metadata de ${name}`);
                            }
                        }
                        
                        return {
                            name,
                            path: backupPath,
                            created: stats.mtime,
                            age: this.getAge(stats.mtime),
                            metadata
                        };
                    } catch (e) {
                        console.error(`❌ Erro ao processar backup ${name}:`, e.message);
                        return null;
                    }
                })
                .filter(backup => backup !== null)
                .sort((a, b) => b.created - a.created); // mais recentes primeiro
            
            return backups;
            
        } catch (err) {
            console.error('❌ Erro ao listar backups:', err.message);
            return [];
        }
    }
    
    /**
     * Restaurar backup específico
     */
    async restoreBackup(backupName) {
        const backupPath = path.join(this.backupDir, backupName);
        
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup não encontrado: ${backupName}`);
        }
        
        try {
            console.log(`🔄 Restaurando backup: ${backupName}...`);
            
            const results = {
                success: true,
                timestamp: new Date().toISOString(),
                backupName,
                files: [],
                errors: []
            };
            
            // Fazer backup dos arquivos atuais antes de restaurar
            await this.createBackup('pre-restore');
            
            // Restaurar cada arquivo
            for (const fileName of this.dataFiles) {
                const sourcePath = path.join(backupPath, fileName);
                const destPath = path.join(__dirname, fileName);
                
                try {
                    if (fs.existsSync(sourcePath)) {
                        const content = fs.readFileSync(sourcePath, 'utf8');
                        fs.writeFileSync(destPath, content, 'utf8');
                        
                        results.files.push({
                            name: fileName,
                            status: 'restored',
                            type: 'file'
                        });
                        
                        console.log(`✅ Restaurado: ${fileName}`);
                    } else {
                        results.errors.push({
                            file: fileName,
                            error: 'Arquivo não encontrado no backup'
                        });
                        console.warn(`⚠️ Arquivo não encontrado no backup: ${fileName}`);
                    }
                } catch (err) {
                    results.errors.push({
                        file: fileName,
                        error: err.message
                    });
                    console.error(`❌ Erro ao restaurar ${fileName}:`, err.message);
                }
            }
            
            // Restaurar cada pasta
            for (const folderName of this.dataFolders) {
                const sourcePath = path.join(backupPath, folderName);
                const destPath = path.join(__dirname, folderName);
                
                try {
                    if (fs.existsSync(sourcePath)) {
                        // Remover pasta existente
                        if (fs.existsSync(destPath)) {
                            this.deleteDirectory(destPath);
                        }
                        
                        // Copiar pasta do backup
                        this.copyDirectory(sourcePath, destPath);
                        
                        results.files.push({
                            name: folderName,
                            status: 'restored',
                            type: 'folder'
                        });
                        
                        console.log(`✅ Restaurado: ${folderName}/`);
                    } else {
                        console.warn(`⚠️ Pasta não encontrada no backup: ${folderName}`);
                    }
                } catch (err) {
                    results.errors.push({
                        file: folderName,
                        error: err.message
                    });
                    console.error(`❌ Erro ao restaurar ${folderName}/:`, err.message);
                }
            }
            
            console.log(`\n✅ Restauração concluída!`);
            console.log(`📊 Arquivos: ${results.files.length} restaurados, ${results.errors.length} erros\n`);
            
            // Write a small sentinel file so the frontend can detect
            // that the system was just restored from a backup and show
            // a visible label to the operator.
            try {
                const restoreInfo = {
                    restored: true,
                    backupName: backupName,
                    backupPath: backupPath,
                    restoredAt: new Date().toISOString()
                };
                const restoreFile = path.join(__dirname, 'RESTORE_INFO.json');
                fs.writeFileSync(restoreFile, JSON.stringify(restoreInfo, null, 2), 'utf8');
                console.log('🛈 RESTORE_INFO.json criado para sinalizar restauração.');
            } catch (e) {
                console.warn('⚠️ Não foi possível escrever RESTORE_INFO.json:', e && e.message);
            }

            return results;
            
        } catch (err) {
            console.error('❌ Erro ao restaurar backup:', err.message);
            throw err;
        }
    }
    
    /**
     * Agendar backup diário
     */
    scheduleDaily() {
        const [hours, minutes] = this.autoBackupTime.split(':').map(Number);
        
        const scheduleNext = () => {
            const now = new Date();
            const scheduled = new Date();
            scheduled.setHours(hours, minutes, 0, 0);
            
            // Se já passou da hora hoje, agendar para amanhã
            if (scheduled <= now) {
                scheduled.setDate(scheduled.getDate() + 1);
            }
            
            const msUntilBackup = scheduled - now;
            const hoursUntil = Math.floor(msUntilBackup / (1000 * 60 * 60));
            const minutesUntil = Math.floor((msUntilBackup % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`⏰ Próximo backup automático agendado para: ${scheduled.toLocaleString('pt-BR')}`);
            console.log(`   (em ${hoursUntil}h ${minutesUntil}min)`);
            
            setTimeout(async () => {
                console.log('\n🕐 Executando backup automático agendado...');
                await this.createBackup('scheduled');
                
                // Agendar o próximo
                scheduleNext();
            }, msUntilBackup);
        };
        
        scheduleNext();
    }
    
    /**
     * Helpers
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    getAge(date) {
        const now = Date.now();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h atrás`;
        if (hours > 0) return `${hours}h atrás`;
        return 'recente';
    }
    
    copyDirectory(source, destination) {
        let totalSize = 0;
        
        try {
            // Criar pasta de destino
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }
            
            // Copiar todos os arquivos e subpastas
            const items = fs.readdirSync(source);
            
            for (const item of items) {
                try {
                    const sourcePath = path.join(source, item);
                    const destPath = path.join(destination, item);
                    
                    const stats = fs.lstatSync(sourcePath);
                    
                    if (stats.isDirectory()) {
                        // Copiar subpasta recursivamente
                        totalSize += this.copyDirectory(sourcePath, destPath);
                    } else {
                        // Copiar arquivo
                        fs.copyFileSync(sourcePath, destPath);
                        totalSize += stats.size;
                    }
                } catch (itemErr) {
                    // Se falhar em copiar um arquivo específico, continuar com os outros
                    console.warn(`⚠️ Erro ao copiar ${item}:`, itemErr.message);
                }
            }
        } catch (err) {
            console.error(`❌ Erro ao copiar diretório ${source}:`, err.message);
            throw err;
        }
        
        return totalSize;
    }
    
    deleteDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteDirectory(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }
}

// Singleton
let backupScheduler = null;

function initBackupScheduler(options) {
    if (!backupScheduler) {
        backupScheduler = new BackupScheduler(options);
        console.log('✅ Sistema de backup inicializado');
    }
    return backupScheduler;
}

function getBackupScheduler() {
    if (!backupScheduler) {
        throw new Error('Backup scheduler não inicializado. Chame initBackupScheduler() primeiro.');
    }
    return backupScheduler;
}

module.exports = {
    BackupScheduler,
    initBackupScheduler,
    getBackupScheduler
};
