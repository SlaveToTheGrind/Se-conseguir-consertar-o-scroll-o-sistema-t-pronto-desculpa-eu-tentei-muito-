# 📱 Configuração do Telegram Bot - MacDavis Motos
20260129

Sistema de notificações automáticas via Telegram para administradores.

---

## 🎯 O que faz?

Envia notificações instantâneas no seu Telegram quando:
- ✅ Novo agendamento é criado
- ❌ Agendamento é cancelado  
- 🔄 Status de agendamento muda
- 📊 Você solicita relatórios via comandos

**Funciona 24/7, mesmo com navegador fechado!**

---

## 📋 Configuração (5 minutos)

### Passo 1: Criar o Bot no Telegram

1. Abra o Telegram (celular ou desktop)
2. Busque por: `@BotFather`
3. Envie: `/newbot`
4. Escolha um **nome** para o bot:
   ```
   MacDavis Notificações
   ```
5. Escolha um **username** (deve terminar com "bot"):
   ```
   macdavis_notif_bot
   ```
6. **Copie o TOKEN** que o BotFather enviar. Será algo assim:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Passo 2: Configurar no Sistema

1. Na pasta do projeto, copie o arquivo `.env.example` para `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Abra o arquivo `.env` e cole seu TOKEN:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=
   ```

### Passo 3: Instalar Dependências

```powershell
npm install node-telegram-bot-api
```

### Passo 4: Iniciar o Servidor

```powershell
node server-client.js
```

Você verá:
```
✅ Telegram Bot inicializado!
📱 Envie /start no bot para completar configuração
```

### Passo 5: Conectar seu Telegram

1. No Telegram, busque o bot que você criou (pelo username)
2. Clique em **INICIAR** ou envie: `/start`
3. O bot responderá:
   ```
   🎉 MacDavis Motos - Notificações Ativadas!
   
   ✅ Você receberá notificações sobre:
   • Novos agendamentos
   • Cancelamentos
   • Alterações de status
   ```

4. **Pronto!** Seu Chat ID foi salvo automaticamente.

---

## 🎮 Comandos Disponíveis

Digite no bot do Telegram:

| Comando | Descrição |
|---------|-----------|
| `/start` | Ativar notificações |
| `/status` | Ver estatísticas do sistema |
| `/hoje` | Lista de agendamentos de hoje |
| `/ajuda` | Mostrar todos os comandos |

---

## 📬 Exemplos de Notificações

### Novo Agendamento
```
🆕 NOVO AGENDAMENTO!

👤 Cliente: Victor Abreu
📞 Telefone: (44) 99839-0950
🏍️ Moto: Honda CG 160 - 2020 (Vermelha)
📅 Data: 18/01/2026
⏰ Horário: 10:00
📝 Obs: Quero testar a moto

ID: 1234567890-abc123
```

### Cancelamento
```
❌ AGENDAMENTO CANCELADO

👤 Cliente: Victor Abreu
📅 Data: 18/01/2026
⏰ Horário: 10:00

ID: 1234567890-abc123
```

### Alteração de Status
```
✅ Status Alterado

👤 Cliente: Victor Abreu
📅 Data: 18/01/2026
⏰ Horário: 10:00

De: ⏳ pendente
Para: ✅ confirmado
```

---

## 🔒 Segurança

- ✅ Apenas você recebe as notificações (seu Chat ID)
- ✅ TOKEN fica no arquivo `.env` (nunca no GitHub)
- ✅ `.env` está no `.gitignore` (não sobe pro repositório)
- ✅ Se alguém obtiver o token, só pode enviar mensagens (não vê dados)

---

## ❓ Problemas Comuns

### "Telegram não configurado"
**Solução:** Certifique-se que o arquivo `.env` existe e tem o TOKEN correto.

### "Erro ao enviar notificação"
**Solução:** Verifique se você enviou `/start` para o bot no Telegram.

### "Token inválido"
**Solução:** Copie o token novamente do @BotFather. Não deve ter espaços extras.

### Não recebo notificações
**Checklist:**
1. ✅ Arquivo `.env` criado?
2. ✅ TOKEN correto no `.env`?
3. ✅ Enviou `/start` para o bot?
4. ✅ Servidor rodando?

---

## 🔧 Teste Manual

Para testar se está funcionando:

```powershell
node telegram-notifier.js
```

Você verá as instruções e pode verificar se há erros.

---

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar botões interativos (confirmar/cancelar direto do Telegram)
- [ ] Enviar foto da moto na notificação
- [ ] Notificações para múltiplos administradores
- [ ] Integração com WhatsApp Business

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no terminal
2. Leia a seção "Problemas Comuns" acima
3. Certifique-se que o `.env` está configurado corretamente

---

**Desenvolvido para MacDavis Motos** 🏍️

