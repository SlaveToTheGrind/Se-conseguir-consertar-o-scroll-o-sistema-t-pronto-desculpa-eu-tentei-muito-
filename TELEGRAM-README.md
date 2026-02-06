# 📱 Sistema de Notificações Telegram - RESUMO
20260129

## ✅ O que foi implementado?

Sistema de notificações automáticas via Telegram Bot que envia alertas instantâneos para o administrador quando:
- 🆕 Novo agendamento é criado
- ❌ Agendamento é cancelado
- 🔄 Status muda (pendente → confirmado → realizado)

**Funciona 24/7, mesmo com navegador fechado!**

---

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `telegram-notifier.js` | Sistema principal de notificações |
| `.env.example` | Modelo de configuração |
| `TELEGRAM-SETUP.md` | Guia completo de configuração |
| `TELEGRAM-QUICKSTART.md` | Guia rápido (3 passos) |

## 📝 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `server-client.js` | Adicionado envio de notificação ao criar agendamento |
| `package.json` | Adicionada dependência `node-telegram-bot-api` |

---

## 🚀 Como Ativar?

### Rápido (3 passos):

1. **Criar bot** no Telegram (@BotFather)
2. **Copiar** `.env.example` para `.env` e colar o token
3. **Enviar** `/start` para o bot

**Leia:** [TELEGRAM-QUICKSTART.md](TELEGRAM-QUICKSTART.md)

---

## 🎯 Como Funciona?

```
Cliente agenda → server-client.js salva → telegram-notifier.js envia → Você recebe
```

O sistema monitora novos agendamentos e envia notificação instantânea via API do Telegram.

---

## 💡 Exemplo de Notificação

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

---

## 🔒 Segurança

- ✅ TOKEN fica em `.env` (não sobe pro GitHub)
- ✅ Apenas você recebe notificações
- ✅ `.env` está no `.gitignore`

---

## ❓ Problemas?

**Não funciona?**
1. Verifique se `.env` existe e tem o TOKEN
2. Certifique-se que enviou `/start` para o bot
3. Confirme que o servidor está rodando

**Mais ajuda:** [TELEGRAM-SETUP.md](TELEGRAM-SETUP.md)

---

## 🔄 Como Desativar?

Se quiser desativar temporariamente:

1. **Opção 1:** Renomeie `.env` para `.env.disabled`
2. **Opção 2:** Remova o TOKEN do `.env`
3. **Opção 3:** Comente a linha no `server-client.js`:
   ```javascript
   // const telegramNotifier = require('./telegram-notifier');
   ```

Para reativar, desfaça a mudança.

---

## 📊 Status

- ✅ Sistema implementado
- ✅ Dependências instaladas
- ⏳ Aguardando configuração do .env
- ⏳ Aguardando /start do usuário

---

**Desenvolvido para MacDavis Motos** 🏍️

