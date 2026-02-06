# 📋 Sistema de Cancelamento e Confirmação para Clientes
20260129
**MacDavis Motos - v3.3.0**

## 🎯 Visão Geral
Sistema completo para clientes gerenciarem seus próprios agendamentos, incluindo confirmação de presença e cancelamento com motivo.

---

## 📱 Funcionalidades para Clientes

### ✅ Confirmação de Presença
- Cliente pode confirmar que comparecerá ao agendamento
- Status muda de `pendente` para `confirmado`
- Timestamp `confirmedAt` registra momento da confirmação
- Admin é notificado via painel e Telegram

### ❌ Cancelamento pelo Cliente
- Cliente pode cancelar seu próprio agendamento
- **Motivo obrigatório** via prompt
- Status muda para `cancelado`
- Timestamp `canceledAt` registra momento
- Campo `canceledBy` identifica "Cliente"
- Admin recebe notificação imediata

### 🔍 Busca de Agendamentos
- Busca por **telefone cadastrado**
- Mostra todos os agendamentos (pendentes, confirmados, realizados, cancelados)
- LocalStorage salva último telefone buscado
- Visual diferenciado por status

---

## 🗂️ Estrutura de Arquivos

### Frontend
```
meus-agendamentos.html    → Interface cliente
meus-agendamentos.js      → Lógica de gerenciamento
```

### Backend
```javascript
// server-client.js (Porta 3000)
PATCH /api/appointments/:id/confirm  → Confirmar presença
PATCH /api/appointments/:id/cancel   → Cancelar agendamento
```

### Notificações
```javascript
// telegram-notifier.js
notifyCanceledAppointment()  → Notifica admin via Telegram
```

---

## 🔧 Implementação Técnica

### 1. Rota de Confirmação

```javascript
app.patch('/api/appointments/:id/confirm', async (req, res) => {
  // Validações:
  // - Agendamento existe?
  // - Já está confirmado?
  // - Está cancelado?
  
  appointments[index] = {
    ...appointments[index],
    status: 'confirmado',
    confirmedAt: new Date().toISOString(),
    confirmedBy: req.body.confirmedBy || 'Cliente',
    updatedAt: new Date().toISOString()
  };
  
  await writeData(appointments);
});
```

### 2. Rota de Cancelamento

```javascript
app.patch('/api/appointments/:id/cancel', async (req, res) => {
  // Validações:
  // - Agendamento existe?
  // - Já está cancelado?
  // - Já foi realizado?
  
  appointments[index] = {
    ...appointments[index],
    status: 'cancelado',
    canceledAt: new Date().toISOString(),
    cancelReason: req.body.cancelReason || 'Cancelado pelo cliente',
    canceledBy: 'Cliente',
    updatedAt: new Date().toISOString()
  };
  
  await writeData(appointments);
  
  // Notificar admin via Telegram
  telegramNotifier.notifyCanceledAppointment(appointments[index]);
});
```

### 3. Sistema de Lock (Race Condition Fix)

```javascript
// Fila de escrita para evitar corrupção de JSON
let isWritingData = false;
const writeQueue = [];

function writeData(list) {
  return new Promise((resolve) => {
    writeQueue.push({ list, resolve });
    processWriteQueue();
  });
}

function processWriteQueue() {
  if (isWritingData || writeQueue.length === 0) return;
  
  isWritingData = true;
  const { list, resolve } = writeQueue.shift();
  
  try {
    // Validar JSON antes de escrever
    const jsonString = JSON.stringify(list, null, 2);
    JSON.parse(jsonString);
    
    fs.writeFileSync(DATA_FILE, jsonString, 'utf8');
    resolve(true);
  } catch (e) {
    resolve(false);
  } finally {
    isWritingData = false;
    setTimeout(processWriteQueue, 10);
  }
}
```

---

## 🎨 Interface do Cliente

### Busca de Agendamentos
```html
<input type="tel" id="phoneInput" placeholder="(44) 99999-9999">
<button onclick="searchAppointments()">🔎 Buscar</button>
```

### Card de Agendamento
```html
<div class="appointment-card ${status}">
  <div class="status-badge ${status}">${statusText}</div>
  
  <!-- Informações -->
  <div class="appointment-info">
    👤 Nome
    📞 Telefone
    📅 Data
    ⏰ Horário
    🏍️ Moto
    📝 Observações
  </div>
  
  <!-- Ações (se pendente) -->
  <div class="appointment-actions">
    <button class="btn-confirm" onclick="confirmAppointment('${id}')">
      ✅ Confirmar Presença
    </button>
    <button class="btn-cancel" onclick="cancelAppointment('${id}')">
      ❌ Cancelar Agendamento
    </button>
  </div>
</div>
```

### Estados Visuais
- **Pendente**: Borda laranja, ações habilitadas
- **Confirmado**: Borda azul, mostra timestamp de confirmação
- **Realizado**: Borda verde, sem ações
- **Cancelado**: Borda vermelha, mostra motivo e timestamp

---

## 📊 Estrutura de Dados

### Agendamento Confirmado
```json
{
  "id": "1737299123456-abc123",
  "name": "João Silva",
  "phone": "(44) 99999-9999",
  "motorcycle": "moto-21",
  "date": "2026-01-25",
  "time": "14:00",
  "status": "confirmado",
  "confirmedAt": "2026-01-19T15:30:00.000Z",
  "confirmedBy": "Cliente",
  "updatedAt": "2026-01-19T15:30:00.000Z"
}
```

### Agendamento Cancelado
```json
{
  "id": "1737299123456-abc123",
  "name": "João Silva",
  "phone": "(44) 99999-9999",
  "motorcycle": "moto-21",
  "date": "2026-01-25",
  "time": "14:00",
  "status": "cancelado",
  "canceledAt": "2026-01-19T15:45:00.000Z",
  "cancelReason": "Imprevisto no trabalho",
  "canceledBy": "Cliente",
  "updatedAt": "2026-01-19T15:45:00.000Z"
}
```

---

## 🔔 Notificações Telegram

### Cancelamento por Cliente
```
🚫 CLIENTE CANCELOU AGENDAMENTO

👤 Cliente: João Silva
📞 Telefone: (44) 99999-9999
📅 Data: 25/01/2026
⏰ Horário: 14:00
📝 Motivo: Imprevisto no trabalho
👥 Cancelado por: Cliente

ID: 1737299123456-abc123
```

---

## 🚀 Fluxo de Uso

### Cliente Confirma Presença
1. Cliente acessa `meus-agendamentos.html`
2. Digita telefone e clica em "Buscar"
3. Sistema lista todos os agendamentos
4. Cliente clica em "✅ Confirmar Presença"
5. Toast de confirmação dupla
6. Requisição PATCH enviada
7. Status muda para `confirmado`
8. Timestamp registrado
9. Toast de sucesso
10. Lista atualizada

### Cliente Cancela Agendamento
1. Cliente clica em "❌ Cancelar Agendamento"
2. Toast de confirmação: "Tem certeza?"
3. Prompt solicita motivo
4. Se vazio, mostra aviso
5. Requisição PATCH enviada com motivo
6. Status muda para `cancelado`
7. Timestamp e motivo salvos
8. Telegram notifica admin
9. Toast de sucesso
10. Lista atualizada

---

## 🔐 Validações

### Confirmação
- ❌ Agendamento não encontrado → 404
- ❌ Já está confirmado → 400
- ❌ Está cancelado → 400
- ✅ Pendente → Pode confirmar

### Cancelamento
- ❌ Agendamento não encontrado → 404
- ❌ Já está cancelado → 400
- ❌ Já foi realizado → 400
- ⚠️ Motivo vazio → Alerta
- ✅ Pendente ou confirmado → Pode cancelar

---

## 🎯 Benefícios

### Para o Cliente
- ✅ Autonomia para gerenciar agendamentos
- ✅ Não precisa ligar para cancelar
- ✅ Histórico completo de agendamentos
- ✅ Confirmação rápida de presença
- ✅ Interface intuitiva e responsiva

### Para a Loja (Admin)
- ✅ Reduz ligações de cancelamento
- ✅ Registra motivos automaticamente
- ✅ Notificações instantâneas
- ✅ Auditoria completa (timestamps)
- ✅ Dados para análise de cancelamentos

---

## 📱 Acessos Rápidos

### Menu de Navegação
**catalog.html** (linha 633):
```html
<button onclick="window.location.href='meus-agendamentos.html'">
  📅 MEUS AGENDAMENTOS
</button>
```

**agendamento.html** (linha 229):
```html
<button onclick="window.location.href='meus-agendamentos.html'">
  📅 Meus Agendamentos
</button>
```

---

## 🧪 Testes

### Teste 1: Confirmação
1. Criar agendamento via `agendamento.html`
2. Acessar `meus-agendamentos.html`
3. Buscar pelo telefone
4. Clicar em "✅ Confirmar Presença"
5. Verificar status no admin

### Teste 2: Cancelamento
1. Ter agendamento pendente
2. Acessar `meus-agendamentos.html`
3. Clicar em "❌ Cancelar"
4. Digitar motivo
5. Verificar notificação no Telegram
6. Verificar motivo no admin

### Teste 3: Race Condition
1. Abrir 2 abas de `meus-agendamentos.html`
2. Cancelar/confirmar simultaneamente
3. Verificar que `data.json` não corrompeu
4. Ambas operações devem completar

---

## 🔄 Integração com Sistemas Existentes

### Admin Notifications
- Detecta novos cancelamentos (últimos 30s)
- Mostra notificação desktop
- Toast in-page com esquema vermelho
- Click-to-action muda filtro para "cancelado"

### Telegram Bot
- Envia mensagem formatada
- Inclui todos os dados relevantes
- Diferencia cancelamento de admin vs cliente

### Painel Admin
- Visualiza status `confirmado`
- Visualiza status `cancelado`
- Mostra motivo do cancelamento
- Exibe quem cancelou (Admin/Cliente)

---

## 📝 Notas Técnicas

- **Porta Cliente**: 3000
- **Porta Admin**: 3001
- **Async/Await**: Rotas usam promises para evitar race conditions
- **Validação JSON**: Antes de escrever no arquivo
- **Toast System**: Confirmações duplas (confirmar + motivo)
- **LocalStorage**: Salva último telefone buscado
- **Máscara**: Telefone formatado automaticamente

---

## 🎨 Cores e Ícones

| Status | Cor | Ícone | Gradient |
|--------|-----|-------|----------|
| Pendente | Amarelo | ⏳ | `#f093fb → #f5576c` |
| Confirmado | Azul | ✅ | `#4facfe → #00f2fe` |
| Realizado | Verde | ✔️ | `#43e97b → #38f9d7` |
| Cancelado | Vermelho | ❌ | `#fa709a → #fee140` |

---

## 📚 Referências

- [SISTEMA-CANCELAMENTO-AGENDAMENTOS.md](SISTEMA-CANCELAMENTO-AGENDAMENTOS.md) - Cancelamento admin
- [GUIA_NOTIFICACOES_AVANCADAS.md](GUIA_NOTIFICACOES_AVANCADAS.md) - Sistema de notificações
- [DOCUMENTACAO_COMPLETA.md](DOCUMENTACAO_COMPLETA.md) - Documentação geral

---

**Versão**: 3.3.0  
**Data**: 19/01/2026  
**Autor**: MacDavis Motos Development Team

