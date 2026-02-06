# 🚀 Início Rápido - Telegram Notifier
20260129

## ⚡ Configuração em 3 passos

### 1️⃣ Criar o Bot (2 minutos)

No Telegram, busque: **@BotFather**

```
Você: /newbot
BotFather: Alright, a new bot. How are we going to call it?
Você: MacDavis Notificações
BotFather: Good. Now let's choose a username for your bot.
Você: macdavis_notif_bot

BotFather: Done! Here is your token:
          123456789:ABCdefGHIjklMNOpqrsTUVwxyz
          
          Keep your token secure!
```

**COPIE O TOKEN!**

---

### 2️⃣ Configurar o Sistema (1 minuto)

1. Copie o arquivo de exemplo:
```powershell
Copy-Item .env.example .env
```

2. Abra `.env` e cole seu token:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=
```

---

### 3️⃣ Ativar (30 segundos)

1. Inicie o servidor:
```powershell
node server-client.js
```

2. No Telegram, busque seu bot e envie:
```
/start
```

3. O bot responderá:
```
🎉 MacDavis Motos - Notificações Ativadas!
```

---

## ✅ Pronto!

Agora você receberá notificações automáticas de:
- 🆕 Novos agendamentos
- ❌ Cancelamentos
- 🔄 Mudanças de status

---

## 🎮 Comandos Úteis

No bot do Telegram:

- `/status` - Ver estatísticas
- `/hoje` - Agendamentos de hoje
- `/ajuda` - Lista de comandos

---

## 🔍 Testar

Faça um agendamento de teste no site e veja a notificação chegar!

---

## ❌ Se algo der errado

### Não recebo notificações?

**Checklist:**
- [ ] Arquivo `.env` existe?
- [ ] TOKEN está correto no `.env`?
- [ ] Enviou `/start` para o bot?
- [ ] Servidor está rodando?

### Erro ao inicializar?

Verifique se instalou a dependência:
```powershell
npm install node-telegram-bot-api
```

---

**Mais detalhes:** Leia [TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)

