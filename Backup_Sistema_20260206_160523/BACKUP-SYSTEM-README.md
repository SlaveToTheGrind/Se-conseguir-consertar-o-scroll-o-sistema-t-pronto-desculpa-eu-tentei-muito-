# 💾 Sistema de Backup Automático - MacDavis Motos
Versão: 20260129

Sistema completo de backup e restauração de dados com agendamento automático.

## 🎯 Funcionalidades

### ✅ Backup Automático
- **Agendamento diário** às 23:00
- Backup de todos os dados críticos
- Rotação automática (mantém últimos 7 dias)
- Logs detalhados

### ✅ Backup Manual
- Criar backup a qualquer momento via API ou interface
- Motivos customizados (manual, pre-restore, scheduled)
- Confirmação instantânea

### ✅ Restauração de Dados
- Restaurar qualquer backup disponível
- Backup de segurança antes de restaurar
- Lista de arquivos restaurados

### ✅ Gerenciamento
- Interface web intuitiva
- Listagem de todos os backups
- Visualização de metadados
- Indicadores de idade dos backups

## 📁 Arquivos e Pastas Incluídos no Backup

### Arquivos JSON:
1. **data.json** - Agendamentos de clientes (119+ registros)
2. **motorcycles.json** - Catálogo de motocicletas (107+ motos)
3. **admin_users.json** - Usuários administrativos

### Pastas Completas:
4. **images/** - Todas as fotos das motocicletas
5. **DOCS Motos/** - Documentos PDF (CRLV) organizados por moto

**Total aproximado:** ~500MB por backup (depende da quantidade de imagens)

## 🚀 Como Usar

### Via Interface Web

1. Acesse o painel admin: `http://localhost:3000/admin.html`
2. Clique no botão "💾 Backups" no cabeçalho
3. Use a interface para:
   - Criar backup manual
   - Visualizar backups disponíveis
   - Restaurar backup específico

### Via API

#### Criar Backup
```javascript
POST /api/backup/create
Content-Type: application/json

{
  "reason": "manual" // ou "pre-restore", "scheduled", etc
}
```

#### Listar Backups
```javascript
GET /api/backup/list
```

#### Restaurar Backup
```javascript
POST /api/backup/restore
Content-Type: application/json

{
  "backupName": "backup_2026-01-22T20-00-00_manual"
}
```

## ⚙️ Configuração

No arquivo `server.js`, o sistema é inicializado com:

```javascript
initBackupScheduler({
    backupDir: path.join(__dirname, 'backups'),     // Pasta de destino
    dataFiles: [                                      // Arquivos para backup
        'data.json', 
        'motorcycles.json', 
        'admin_users.json'
    ],
    retentionDays: 7,                                 // Dias de retenção
    autoBackupTime: '23:00',                          // Hora do backup automático
    enabled: true                                     // Ativar/desativar
});
```

### Alterar Horário do Backup Automático

Edite a linha `autoBackupTime` no `server.js`:

```javascript
autoBackupTime: '03:00',  // Backup às 3h da manhã
autoBackupTime: '12:00',  // Backup ao meio-dia
autoBackupTime: '18:30',  // Backup às 18h30
```

### Alterar Período de Retenção

Edite a linha `retentionDays` no `server.js`:

```javascript
retentionDays: 3,   // Manter últimos 3 dias
retentionDays: 14,  // Manter últimos 14 dias
retentionDays: 30,  // Manter último mês
```

### Desativar Backup Automático

```javascript
enabled: false  // Desativa o agendamento (backups manuais ainda funcionam)
```text

## 📂 Estrutura de Pastas

```text
TCC - teste/
├── backups/
│   ├── backup_2026-01-22T20-00-00_scheduled/
│   │   ├── data.json
│   │   ├── motorcycles.json
│   │   ├── admin_users.json
│   │   └── _metadata.json
│   ├── backup_2026-01-22T21-30-15_manual/
│   │   └── ...
│   └── backup_2026-01-23T10-45-00_pre-restore/
│       └── ...
├── backup-scheduler.js
├── admin-backups.html
└── server.js
```

## 📊 Metadados do Backup

Cada backup contém um arquivo `_metadata.json` com informações:

```json
{
  "success": true,
  "timestamp": "2026-01-22T20:00:00.123Z",
  "backupName": "backup_2026-01-22T20-00-00_scheduled",
  "backupPath": "C:\\...\\backups\\backup_2026-01-22T20-00-00_scheduled",
  "reason": "scheduled",
  "files": [
    {
      "name": "data.json",
      "size": 15234,
      "sizeFormatted": "14.88 KB",
      "status": "ok"
    }
  ],
  "errors": []
}
```

## 🔔 Logs do Sistema

O sistema registra todas as operações:

```log
✅ Sistema de backup inicializado
⏰ Próximo backup automático agendado para: 22/01/2026 23:00:00
   (em 2h 45min)

🕐 Executando backup automático agendado...
✅ Backup criado: data.json (14.88 KB)
✅ Backup criado: motorcycles.json (125.45 KB)
✅ Backup criado: admin_users.json (2.15 KB)

✅ Backup concluído: backup_2026-01-22T23-00-00_scheduled
📁 Localização: C:\...\backups\backup_2026-01-22T23-00-00_scheduled
📊 Arquivos: 3 ok, 0 erros

🧹 Limpando 2 backup(s) antigo(s)...
🗑️ Removido: backup_2026-01-15T23-00-00_scheduled
🗑️ Removido: backup_2026-01-14T23-00-00_scheduled
```

## 🛡️ Segurança

## ℹ️ Nota Importante (v4.0.0)
O painel admin agora reflete imediatamente o estado real dos dados após operações de backup ou restauração. Não é mais necessário atualizar a página manualmente para ver as alterações.

### Backup Antes de Restaurar

O sistema **sempre** cria um backup de segurança antes de restaurar dados:

```log
🔄 Restaurando backup: backup_2026-01-20T15-30-00_manual...
📦 Criando backup de segurança...
✅ Backup de segurança criado: backup_2026-01-22T20-15-30_pre-restore
✅ Restaurado: data.json
✅ Restaurado: motorcycles.json
✅ Restaurado: admin_users.json
✅ Restauração concluída!
```

### Confirmação de Restauração

A interface web solicita confirmação antes de restaurar:

```text
⚠️ ATENÇÃO!

Você está prestes a restaurar o backup:
backup_2026-01-20T15-30-00_manual

Todos os dados atuais serão substituídos!
Um backup de segurança será criado antes da restauração.

Deseja continuar?
```

## 🔧 Solução de Problemas

### Backup não está sendo criado

1. Verifique os logs do servidor
2. Confirme que `enabled: true` no `server.js`
3. Verifique permissões da pasta `backups/`

### Erro ao restaurar backup

1. Verifique se o backup existe na pasta `backups/`
2. Confirme que os arquivos JSON estão válidos
3. Verifique permissões de escrita

### Espaço em disco

Os backups são automaticamente limpos após o período de retenção. Para limpeza manual:

```bash
# Manter apenas últimos 3 backups
# Deletar manualmente as pastas antigas em backups/
```

## 📈 Estatísticas

A interface mostra:
- **Total de backups** disponíveis
- **Backup mais recente** (idade)
- **Retenção configurada** (dias)
- **Horário do backup automático**

## 🎨 Interface

### Página de Backups
- **URL**: `http://localhost:3000/admin-backups.html`
- **Acesso**: Via botão "💾 Backups" no painel admin
- **Funcionalidades**:
  - Criar backup manual
  - Visualizar todos os backups
  - Restaurar backup específico
  - Ver detalhes e metadados

## 💡 Boas Práticas

1. ✅ **Faça backup manual** antes de grandes alterações
2. ✅ **Teste a restauração** periodicamente
3. ✅ **Monitore os logs** para erros
4. ✅ **Ajuste a retenção** conforme necessidade
5. ✅ **Verifique espaço em disco** regularmente

## 🔄 Atualizações Futuras

Possíveis melhorias:
- [ ] Backup em nuvem (Google Drive, Dropbox)
- [ ] Compressão de backups (ZIP)
- [ ] Notificações por email/Telegram
- [ ] Backup incremental
- [ ] Dashboard de estatísticas
- [ ] Agendamentos múltiplos
- [ ] Backup de imagens

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do servidor
2. Consulte este README
3. Verifique as permissões de arquivos
4. Reinicie o servidor

---

**Sistema desenvolvido para MacDavis Motos**  
Versão: 1.0.0  
Data: Janeiro 2026
