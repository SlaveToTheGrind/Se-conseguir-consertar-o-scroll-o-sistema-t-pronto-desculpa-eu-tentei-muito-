# 📚 Documentação Completa - Sistema MacDavis Motos
20260129

**Versão:** 4.0.0  
**Data:** 11/02/2026  
**Última Atualização:** Backup automático: 2026-02-11T14:41:48.2457673-03:00

---

## 🆕 Novidade v4.0.0
- O painel admin agora atualiza automaticamente a lista de motos após qualquer ação (adicionar, editar, vender, excluir), sem precisar recarregar a página.
- Feedback visual só aparece após a atualização da lista, garantindo sempre o estado real dos dados.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Funcionalidades](#funcionalidades)
4. [Sistema de Notificações](#sistema-de-notificações)
5. [Sistema SmartLoading](#sistema-smartloading)
6. [Sistema de Contratos](#sistema-de-contratos)
7. [Firewall Auto-Fix](#firewall-auto-fix) 🔥
8. [Categorização de Motocicletas](#categorização-de-motocicletas) 🏍️
9. [Gerenciamento de Agendamentos pelo Cliente](#gerenciamento-de-agendamentos-pelo-cliente) 👥
10. [Sistema de Auto-Fix Mobile](#sistema-de-auto-fix-mobile) 📱
11. [Painel de Vendas MacDavis](#painel-de-vendas-macdavis) 🎨
12. [Modal de Backups Mobile](#modal-de-backups-mobile) 💾 **NOVO**
13. [Servidores](#servidores)
14. [Estrutura de Arquivos](#estrutura-de-arquivos)
15. [Fluxo de Dados](#fluxo-de-dados)
16. [API Endpoints](#api-endpoints)
17. [Guia de Uso](#guia-de-uso)
18. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

Sistema web completo para gerenciamento de loja de motocicletas, dividido em duas interfaces:
- **Cliente (Porta 3000)**: Catálogo público, agendamento de visitas e gerenciamento de agendamentos
- **Admin (Porta 3001)**: Painel administrativo completo com gestão de estoque e agendamentos

### Tecnologias Utilizadas
- **Backend**: Node.js v22.20.0 + Express.js
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Armazenamento**: JSON (motorcycles.json, data.json)
- **Estilo**: Design moderno com gradientes laranja/preto, identidade MacDavis
- **Automação**: PowerShell + Windows Task Scheduler

### 📱 Otimização Mobile Completa (v3.9.0 - 27/01/2026)
- 💾 **Modal de Backups para Mobile**:
  - Desktop: Navega para admin-backups.html (comportamento original preservado)
  - Mobile: Abre modal fullscreen com iframe carregando página completa
  - Detecção: userAgent + matchMedia(max-width: 1400px) considera viewport scale
  - Iframe dinâmico: src carregado ao abrir, limpo ao fechar
  - Funções globais: `window.openBackupsModal()` e `window.closeBackupsModal()`
- ✅ **Filtros Admin Responsivos**:
  - Grid 3 colunas no mobile evita corte da barra de busca
  - Seletor específico: `.month-section [style*="450px"]` para motos vendidas
  - Cards de estatísticas não afetados (mantém grid 2x2)
- ✅ **Cards de Motos Vendidas**:
  - Largura mínima: 350px no mobile
  - Grid adaptativo: `repeat(auto-fill, minmax(350px, 1fr))`
  - Botões layout 2x2 reorganizado para telas pequenas
- ✅ **Página de Backups Mobile-Friendly**:
  - Container com scroll: max-height 600px, overflow-y auto
  - Scrollbar customizada: gradiente laranja matching identidade
  - Fontes reduzidas: 0.85em (título), 0.7em (meta)
  - Overflow controlado: word-wrap, text-overflow: ellipsis
  - Padding otimizado: 12px cards, 15px container
- ✅ **Touch Optimization**:
  - Event listeners: touchend (passive: false) + click
  - Z-index: 99999 para garantir clicabilidade
  - Touch-action: manipulation para resposta imediata
  - Background gradiente laranja no hover/active
- ✅ **CSS Específico**:
  - `#backupsButton` com z-index alto e pointer-events auto
  - `#backupsModal .modal-content` fullscreen (100vw x 100vh)
  - Padding, margin, border-radius todos zerados
  - Escopo global para funções de modal

### 🎨 Cards de Vendas Redesenhados (v3.8.0 - 27/01/2026)
- 🎨 **Cards de Vendas Redesenhados**: Layout moderno minimalista com estrutura limpa
- ✅ **Componentes do Card**:
  - Header compacto: Marca/Modelo + Placa em destaque laranja (gradiente, borda 2px, shadow)
  - Grid de specs: 4 colunas (ANO, CILINDRADA, COR, KM) com valores destacados
  - Info de venda: Layout label/valor com tipografia aprimorada
  - Botões minimalistas: Gradientes coloridos (purple, cyan, orange, blue, red)
- ✅ **Badge "VENDIDA"**: Verde discreto (#4caf50) no canto superior direito
- ✅ **Tipografia Melhorada**:
  - Labels: 13px bold uppercase (min-width: 90px)
  - Valores: 16px bold (aumento significativo para legibilidade)
  - Chassi e RENAVAM: fonte consistente sem monospace
- ✅ **Busca Integrada**: Caixa de busca ao lado de "Filtros e Navegação"
  - Busca em tempo real por marca, modelo, placa, comprador
  - Integração com filtros de marca e mês
- ✅ **Hover Effects**: Transform translateY(-2px) + box-shadow nos cards
- ✅ **Responsivo**: Grid specs 4→2 colunas, botões 33%→50% no mobile
- ✅ **Scroll Corrigido**: Modal body com overflow-y: auto funcionando corretamente
- ✅ **HTML Limpo**: Tags duplicadas e mal estruturadas removidas
- ✅ **Z-index Hierarchy**: Busca do catálogo escondida quando modal vendas aberto

### Melhorias Painel (v3.7.0 - 26/01/2026)
- 🎨 **Redesign Painel de Vendas**: Header minimalista profissional + cards estatísticos modernos
- ✅ **Identidade MacDavis**: Cores vibrantes (#ff6600, #ff7800), gradientes laranja, glassmorphism
- 📱 **Mobile 100% Funcional**: Filtros corrigidos (selects nativos), emojis otimizados, touch nativo
- ✅ **Cards Profissionais**: Estrutura 3-seções com animações (cardFadeIn, glow-pulse, hover effects)
- ✅ **UX Aprimorada**: Tipografia aumentada 40%, layout responsivo adaptativo
- ✅ **Header Profissional Mobile**: Logo posicionado, animação conic-gradient, botões 100% funcionais
- ✅ **Modal Moderno**: Overlay gradiente, bordas arredondadas, botões maiores (42px)
- ✅ **Filtros Completamente Clicáveis**: pointer-events:auto, z-index hierárquico
- ✅ **Estados Ativos Funcionais**: Filtros laranja quando selecionados (!important)
- ✅ **Badge 750cc Removido**: Não sobrepõe mais botão de atualizar
- ✅ **Proteção de Scroll Inteligente**: setTimeout + event listeners sem loops infinitos
- ✅ **Grid 2x2 Mantido**: Layout desktop preservado com media query
- ✅ **Todos os Botões Funcionais**: MEUS AGENDAMENTOS, SAIR, filtros, refresh
- ✅ **Zero Crashes**: Scripts otimizados sem conflitos ou loops

### Melhorias Anteriores (v3.5.0 - v3.6.0)
- 🔥 **CORREÇÃO CRÍTICA**: Scroll mobile completamente não funcional resolvido
- ✅ **Auto-Fix Mobile**: Sistema automático que monitora e corrige scroll em tempo real
- ✅ **Restauração de Backup**: Catálogo mobile restaurado do backup 21/01/2026
- ✅ **CSS Limpo**: Propriedades obsoletas removidas (-webkit-overflow-scrolling)
- ✅ **Debugging Sistemático**: Abordagem via console DevTools implementada
- ✅ **Galeria de Fotos**: Navegação entre múltiplas imagens com setas prev/next
- ✅ **Mobile Otimizado**: Scroll, touch e navegação por teclado funcionais
- ✅ **API Relativa**: Caminhos compatíveis com qualquer dispositivo/rede
- ✅ **Meus Agendamentos**: Cliente pode buscar, confirmar e cancelar agendamentos
- ✅ **Sistema de Lock**: Fila de escrita previne race conditions
- ✅ **Visual por Status**: Cores diferentes para cada estado do agendamento

---

## 🏗️ Arquitetura do Sistema

### Separação por Portas

```
┌─────────────────────────────────────────────────┐
│          SISTEMA MACDAVIS MOTOS                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  PORTA 3000 (Cliente)      PORTA 3001 (Admin)  │
│  ├─ index.html             ├─ admin.html        │
│  ├─ login.html             ├─ admin-login.html  │
│  ├─ catalog.html           ├─ CRUD completo     │
│  ├─ agendamento.html       ├─ Agendamentos      │
│  └─ API Read-Only          └─ API Full Access   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Segurança
- **Segregação de Portas**: Cliente e Admin isolados
- **Middleware de Bloqueio**: Páginas cliente bloqueadas no servidor admin
- **Autenticação**: localStorage com verificação de tipo de usuário
- **API Restrita**: Cliente só lê motos disponíveis e cria agendamentos

---

## ⚙️ Funcionalidades

### 👥 Interface Cliente (Porta 3000)

#### 1. **Catálogo de Motocicletas**
- Visualização de motos disponíveis (vendidas são ocultas)
- Filtros por marca, status e categoria
- Busca por nome/modelo
- Cards com informações detalhadas
- Botão "Agendar Visita" para cada moto
- **Galeria de Fotos Navegável**:
  - Setas prev/next para navegar entre múltiplas fotos
  - Contador de posição (ex: "1 / 3")
  - Suporte a arrays de imagens (campo `images[]` no JSON)
  - Navegação com teclado e mouse
  - Ocultação automática das setas quando há apenas 1 foto

#### 2. **Sistema de Agendamento**
- Seleção de motocicleta
- Escolha de data e horário
- Campo de observações
- Confirmação visual com detalhes
- Envio automático para API

#### 3. **Meus Agendamentos** 🆕
- **Busca por Telefone**: Cliente busca seus agendamentos por número
- **Confirmação de Presença**: Cliente pode confirmar que comparecerá
- **Cancelamento pelo Cliente**: Cliente pode cancelar com motivo obrigatório
- **Histórico Completo**: Visualiza agendamentos pendentes, confirmados, realizados e cancelados
- **Visual por Status**: Cores e badges diferentes para cada estado
- **Autonomia**: Sem precisar ligar para loja
- **LocalStorage**: Salva último telefone buscado para conveniência
- **Máscara de Telefone**: Formatação automática (44) 99999-9999
- **Notificações**: Admin é notificado via Telegram quando cliente cancela
- **Acesso Rápido**: Botões em catalog.html e agendamento.html

#### 4. **Autenticação**
- Login simplificado (apenas cliente)
- Sessão persistente via localStorage
- Logout funcional

### 🔧 Interface Admin (Porta 3001)

#### 1. **Gerenciamento de Motocicletas**
- **CRUD Completo**: Criar, Ler, Atualizar, Deletar
- **Contadores em Tempo Real**:
  - Total de motos
  - Motos disponíveis
  - Motos vendidas
- **Sistema de Status**:
  - Marcar como vendida (remove do catálogo cliente)
  - Badge visual de status (disponível/vendido)
  - Filtro por status
- **Cards com Ações**:
  - Editar informações
  - Marcar como vendida
  - Excluir/Remover
  - Visualizar detalhes

#### 2. **Gestão de Agendamentos**
- **Auto-refresh automático** a cada 10 segundos
- **Lista Dinâmica** ordenada por mais recentes (mais novos no topo)
- **Layout Responsivo**: Cards horizontais, 3 por linha, quebra automática
- **Filtros**:
  - Pendentes (padrão)
  - Realizados
  - Todos
- **Informações Exibidas**:
  - Nome do cliente
  - Telefone
  - Motocicleta escolhida
  - Data e horário
  - Observações
- **Ações**:
  - Marcar como realizado (✓ Realizado)
  - Excluir agendamento (🗑️)
- **Contador**: Mostra apenas agendamentos pendentes
- **Ordenação**: Mais novos no topo (timestamp do ID)
- **Auto-refresh**: Lista atualiza automaticamente após ações

#### 3. **Autenticação Admin**
- Login dedicado (admin-login.html)
- Credenciais: admin/123456
- Verificação de tipo de usuário
- Botão "Visualizar como Cliente" (abre porta 3000)

---

## � Gerenciamento de Agendamentos pelo Cliente

### 🎯 Visão Geral
Sistema completo que permite aos clientes gerenciarem seus próprios agendamentos de forma autônoma, sem precisar ligar para a loja. Acessível via `meus-agendamentos.html`.

### 📱 Funcionalidades

#### 1. **Busca de Agendamentos**
- **Busca por Telefone**: Cliente digita seu número para visualizar todos os agendamentos
- **LocalStorage**: Salva último telefone buscado para conveniência
- **Máscara Automática**: Formatação (44) 99999-9999
- **Histórico Completo**: Mostra agendamentos em todos os estados

#### 2. **Confirmação de Presença** ✅
- **Status**: Muda de `pendente` para `confirmado`
- **Timestamp**: Registra `confirmedAt` e `confirmedBy: "Cliente"`
- **Validações**: 
  - ❌ Já está confirmado → Aviso
  - ❌ Está cancelado → Aviso
  - ✅ Pendente → Pode confirmar
- **Feedback**: Toast duplo (confirmação + sucesso)
- **Notificação**: Admin visualiza status no painel

#### 3. **Cancelamento pelo Cliente** ❌
- **Motivo Obrigatório**: Prompt solicita motivo do cancelamento
- **Status**: Muda para `cancelado`
- **Dados Salvos**:
  - `canceledAt`: Timestamp do cancelamento
  - `cancelReason`: Motivo informado pelo cliente
  - `canceledBy`: "Cliente"
- **Validações**:
  - ❌ Já está cancelado → Aviso
  - ❌ Já foi realizado → Aviso
  - ⚠️ Motivo vazio → Alerta e não cancela
  - ✅ Pendente ou confirmado → Pode cancelar
- **Notificação Telegram**: Admin recebe mensagem formatada com todos os dados
- **Feedback**: Toast de confirmação antes + sucesso depois

#### 4. **Visual por Status**
Cards com cores e badges distintos:

| Status | Cor | Ícone | Gradient | Ações Disponíveis |
|--------|-----|-------|----------|-------------------|
| Pendente | Laranja | ⏳ | `#f093fb → #f5576c` | Confirmar, Cancelar |
| Confirmado | Azul | ✅ | `#4facfe → #00f2fe` | Cancelar |
| Realizado | Verde | ✔️ | `#43e97b → #38f9d7` | Nenhuma |
| Cancelado | Vermelho | ❌ | `#fa709a → #fee140` | Nenhuma |

### 🔧 Implementação Técnica

#### Rotas Backend (server-client.js)
```javascript
// Confirmar presença
PATCH /api/appointments/:id/confirm
Body: { confirmedBy: "Cliente" }
Response: { success: true, appointment: {...} }

// Cancelar agendamento
PATCH /api/appointments/:id/cancel
Body: { cancelReason: "Motivo...", canceledBy: "Cliente" }
Response: { success: true, appointment: {...} }
```

#### Sistema de Lock (Race Condition Prevention)
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
```

#### Estrutura de Dados

**Agendamento Confirmado:**
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

**Agendamento Cancelado:**
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

### 🔔 Notificação Telegram

Quando cliente cancela, admin recebe:
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

### 🎯 Benefícios

**Para o Cliente:**
- ✅ Autonomia para gerenciar agendamentos
- ✅ Não precisa ligar para cancelar/confirmar
- ✅ Histórico completo sempre acessível
- ✅ Interface intuitiva e responsiva
- ✅ Confirmação rápida de presença

**Para a Loja (Admin):**
- ✅ Reduz ligações de cancelamento
- ✅ Registra motivos automaticamente
- ✅ Notificações instantâneas via Telegram
- ✅ Auditoria completa (timestamps)
- ✅ Dados para análise de cancelamentos

### 📱 Acessos Rápidos

Botões adicionados para facilitar acesso:

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

### 🧪 Casos de Teste

#### Teste 1: Confirmação
1. Criar agendamento via `agendamento.html`
2. Acessar `meus-agendamentos.html`
3. Buscar pelo telefone
4. Clicar em "✅ Confirmar Presença"
5. Verificar status no admin (deve ser "confirmado")

#### Teste 2: Cancelamento
1. Ter agendamento pendente ou confirmado
2. Acessar `meus-agendamentos.html`
3. Clicar em "❌ Cancelar"
4. Digitar motivo válido
5. Verificar notificação no Telegram
6. Verificar motivo no painel admin

#### Teste 3: Race Condition
1. Abrir 2 abas de `meus-agendamentos.html`
2. Cancelar/confirmar simultaneamente
3. Verificar que `data.json` não corrompeu
4. Ambas operações devem completar com sucesso

### 📚 Documentação Relacionada
- [SISTEMA-CANCELAMENTO-CLIENTE.md](SISTEMA-CANCELAMENTO-CLIENTE.md) - Documentação detalhada
- [CHANGELOG.md](CHANGELOG.md) - Versão 3.3.0
- [telegram-notifier.js](telegram-notifier.js) - Sistema de notificações

---

## �🖥️ Servidores

### Server Client (server-client.js - Porta 3000)

**Responsabilidades:**
- Servir arquivos estáticos do cliente
- API de leitura de motocicletas (apenas disponíveis)
- API de criação de agendamentos
- Bloquear operações administrativas (403)

**Endpoints Disponíveis:**
```javascript
// Motocicletas
GET  /api/motorcycles     // Apenas motos com status="disponivel"

// Agendamentos
POST  /api/appointments               // Criar novo agendamento
GET   /api/appointments               // Listar agendamentos
PATCH /api/appointments/:id/confirm   // Cliente confirma presença
PATCH /api/appointments/:id/cancel    // Cliente cancela com motivo
```

**Logs:**
```
✅ Motocicletas carregadas: 19
✅ Motos disponíveis: 19
🚫 Motos vendidas (ocultas): 0
📡 [CLIENTE] POST /api/appointments
✅ Agendamento salvo: [ID]
```

### Server Admin (server-admin.js - Porta 3001)

**Responsabilidades:**
- Servir arquivos estáticos do admin
- API completa de motocicletas (CRUD)
- API completa de agendamentos (CRUD)
- Bloquear páginas de cliente (redirect silencioso)
- **Headers anti-cache agressivos** (ETag dinâmico, Last-Modified)

**Endpoints Disponíveis:**
```javascript
// Motocicletas
GET    /api/motorcycles       // Listar todas
POST   /api/motorcycles       // Criar nova
PUT    /api/motorcycles/:id   // Atualizar (marca como vendida)
DELETE /api/motorcycles/:id   // Deletar

// Agendamentos
GET    /api/appointments      // Listar todos
POST   /api/appointments      // Criar novo
PUT    /api/appointments/:id  // Atualizar status
DELETE /api/appointments/:id  // Deletar
```

**Middleware de Bloqueio:**
```javascript
// Redireciona páginas cliente para admin-login
['/login.html', '/index.html', '/catalog.html', '/agendamento.html']
→ Redirect para '/admin-login.html'
```

---

## 📁 Estrutura de Arquivos

### Arquivos Principais

```
TCC - teste/
├── 📄 server-client.js          # Servidor cliente (porta 3000)
├── 📄 server-admin.js           # Servidor admin (porta 3001)
├── 📄 package.json              # Dependências e scripts
│
├── 🌐 CLIENTE (Porta 3000)
│   ├── index.html               # Landing page
│   ├── login.html               # Login cliente
│   ├── catalog.html             # Catálogo de motos
│   ├── catalog.js               # Lógica do catálogo
│   ├── agendamento.html         # Formulário de agendamento (JS inline)
│   ├── meus-agendamentos.html   # 🆕 Gerenciamento de agendamentos
│   ├── meus-agendamentos.js     # 🆕 Lógica de busca/confirmação/cancelamento
│   └── CSS.css                  # Estilos cliente
│
├── 🔧 ADMIN (Porta 3001)
│   ├── admin.html               # Painel administrativo
│   ├── admin.js                 # Lógica admin completa
│   ├── admin-login.html         # Login admin dedicado
│   └── admin-styles-dark-modern.css  # Tema dark moderno
│
├── 💾 DADOS
│   ├── motorcycles.json         # Banco de motos (19 motos)
│   └── data.json                # Banco de agendamentos
│
└── 📚 DOCUMENTAÇÃO
    └── DOCUMENTACAO_COMPLETA.md # Este arquivo
```

### Scripts NPM

```json
{
  "scripts": {
    "client": "node server-client.js",
    "admin": "node server-admin.js"
  }
}
```

**Uso:**
```bash
npm run client   # Inicia servidor cliente (porta 3000)
npm run admin    # Inicia servidor admin (porta 3001)
```

---

## 🔄 Fluxo de Dados

### 1. Fluxo de Agendamento (Cliente → Admin)

```
CLIENTE (Porta 3000)
    ↓
Preenche formulário em agendamento.html
    ↓
JavaScript inline captura dados do usuário (localStorage)
    ↓
POST /api/appointments com objeto completo
    ↓
server-client.js salva em data.json
    ↓
ADMIN (Porta 3001) carrega via GET /api/appointments
    ↓
admin.js renderiza lista ordenada (mais recentes primeiro)
    ↓
Aparece no topo com status "Pendente"
```

### 2. Fluxo de Venda de Moto

```
ADMIN clica "💰 Marcar como Vendida"
    ↓
admin.js: markAsSold(motoId)
    ↓
PUT /api/motorcycles/:id { status: "vendido" }
    ↓
server-admin.js atualiza motorcycles.json
    ↓
EFEITOS:
├─ ADMIN: Badge "✓ VENDIDO", opacidade 75%, botão "Remover"
└─ CLIENTE: Moto desaparece do catálogo (filtro API)
```

### 3. Gestão de Agendamentos

```
ADMIN - Ações disponíveis:

✓ Realizado
    ↓
PUT /api/appointments/:id { status: "realizado" }
    ↓
Move para tab "Realizados"
    ↓
Contador pendentes -1

🗑️ Excluir
    ↓
DELETE /api/appointments/:id
    ↓
Remove do data.json
    ↓
Contador atualizado
    ↓
Lista recarregada automaticamente
```

---

## 🔌 API Endpoints

### Cliente (Porta 3000)

#### GET /api/motorcycles
**Filtro:** Apenas `status === 'disponivel' || !status`  
**Response:** Array de motos disponíveis

#### POST /api/appointments
**Body:**
```json
{
  "name": "Victor Abreu",
  "phone": "(44) 998390950",
  "motorcycle": "moto-21",
  "date": "2025-12-19",
  "time": "14:00",
  "notes": ""
}
```
**Response:** Objeto criado com ID e createdAt

### Admin (Porta 3001)

#### GET /api/motorcycles
**Descrição:** Retorna TODAS as motos (sem filtro de status)

#### PUT /api/motorcycles/:id
**Body:** `{ status: "vendido" }` ou outros campos  
**Response:** Objeto atualizado com updatedAt

#### PUT /api/appointments/:id
**Body:** `{ status: "realizado" }`  
**Response:** Objeto atualizado

#### DELETE /api/appointments/:id
**Response:** `{ message: "Agendamento removido com sucesso" }`

---

## 📖 Guia de Uso

### Iniciar o Sistema

**Terminal 1 - Cliente:**
```bash
cd "c:\Users\W10\Documents\TCC - teste"
npm run client
```

**Terminal 2 - Admin:**
```bash
npm run admin
```

### Acesso

**Cliente:** http://localhost:3000  
**Admin:** http://localhost:3001/admin-login.html

**Credenciais Admin:** admin / 123456

### Fluxo Completo de Venda

1. Cliente agenda visita (porta 3000)
2. Admin vê agendamento no topo da lista
3. Cliente visita presencialmente
4. Admin marca agendamento como "Realizado"
5. Venda concluída → Admin marca moto como "Vendida"
6. Moto desaparece do catálogo cliente
7. Badge "✓ VENDIDO" no admin

---

## 🛠️ Manutenção

### Backup

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "Backup_sistema_${timestamp}"
New-Item -ItemType Directory -Path "c:\Users\W10\Documents\TCC - teste\$backupName" -Force
Copy-Item -Path "*.js","*.html","*.css","*.json" -Destination "$backupName\" -Exclude "node.js","package-lock.json"
```

### Limpar Cache (DevTools Console)

```javascript
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### Reiniciar Servidores

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
npm run client  # Terminal 1
npm run admin   # Terminal 2
```

---

## 📊 Estrutura de Dados

### motorcycles.json

```json
{
  "id": "moto-21",
  "marca": "Honda",
  "modelo": "NC 750X",
  "status": "disponivel",  // ou "vendido"
  "createdAt": "2024-11-06T19:52:36.502Z",
  "updatedAt": "2025-12-16T15:23:48.735Z"
}
```

### data.json

```json
{
  "id": "1765896626237-8avxyox28",
  "name": "Victor Abreu",
  "phone": "(44) 998390950",
  "motorcycle": "moto-21",
  "date": "2025-12-19",
  "time": "14:00",
  "notes": "",
  "status": "pendente",  // ou "realizado"
  "createdAt": "2025-12-16T15:10:26.237Z",
  "updatedAt": "2025-12-16T15:15:30.123Z"
}
```

**Ordenação:** Por timestamp no ID (mais recentes primeiro)

---

## 🎨 Design

### Paleta de Cores

**Cliente:** Laranja (#ff6600) + Branco + Preto  
**Admin:** Dark mode com glass effect

### Animações

- Gradiente animado no header admin
- Hover effects nos cards
- Transições suaves
- Loading states visuais

---

## 🔔 Sistema de Notificações

### Status: **IMPLEMENTADO E FUNCIONAL** ✅

O sistema possui **dois módulos de notificações** complementares:

1. **Toast Notifications** (`toast-notifications.js`) - Interface geral do sistema
2. **Admin Notifications** (`admin-notifications.js`) - Notificações desktop para administradores

---

### 🔔 Admin Notifications (Desktop)

Sistema de notificações desktop em tempo real para administradores, alertando sobre novos agendamentos.

#### Características Principais

**🎯 Funcionalidades**
- **Notificações Desktop**: Usa a API nativa do navegador (Notification API)
- **Fallback In-Page**: Se desktop não disponível, mostra notificações na própria página
- **Monitoramento Automático**: Verifica novos agendamentos a cada 5 segundos
- **Som de Alerta**: Áudio feedback quando há novo agendamento
- **Visual Highlight**: Destaca agendamento ao clicar na notificação

**📋 Arquivos**
- `admin-notifications.js` - Sistema completo de notificações desktop
- Integrado em `admin.html` (linha 1688)

**🔧 Classe AdminNotifications**

```javascript
// Instância global
window.adminNotifications = new AdminNotifications();

// Solicitar permissão para notificações
await adminNotifications.requestPermission();

// Iniciar monitoramento (5 segundos)
adminNotifications.startMonitoring(5000);

// Parar monitoramento
adminNotifications.stopMonitoring();
```

**🆕 Notificação de Novo Agendamento**

Quando detecta novo agendamento (criado há menos de 30 segundos):
- Mostra notificação desktop (se permissão concedida)
- Ou mostra notificação in-page (fallback)
- Inclui: cliente, data, horário e moto
- Permite clicar para scroll até o agendamento

**🔘 Botão de Ativação**

Aparece automaticamente no canto inferior direito:
- 🔔 Ativar Notificações (laranja) - Clique para solicitar permissão
- ✅ Notificações Ativas (verde) - Permissão concedida
- ❌ Permissão Negada (vermelho) - Bloqueado pelo usuário

**📊 Tipos de Notificação In-Page**
- **success**: Fundo verde (#d4edda), ícone ✅
- **error**: Fundo vermelho (#f8d7da), ícone ❌
- **warning**: Fundo amarelo (#fff3cd), ícone ⚠️
- **info**: Fundo azul (#d1ecf1), ícone ℹ️
- **appointment**: Fundo laranja (#ffe8cc), ícone 🆕

**🔊 Som Personalizado**

Base64 WAV incorporado, volume 30%, reprodução automática

**💾 Gerenciamento de Memória**

- Armazena IDs de agendamentos conhecidos em `Set()`
- Limpa automaticamente quando passa de 100 itens
- Verifica apenas agendamentos não conhecidos

---

### 🍞 Toast Notifications (Interface Geral)

Sistema completo de notificações visuais substituindo alerts nativos do navegador, proporcionando feedback visual elegante e não-intrusivo para todas as ações do usuário.

#### Características Principais

#### 🎨 Tipos de Notificações
- **Success (Verde)**: Confirmações de ações bem-sucedidas
- **Error (Vermelho)**: Erros e falhas de operação
- **Warning (Laranja)**: Avisos importantes
- **Info (Azul)**: Informações gerais

#### 🔊 Recursos Multimídia
- **Sons**: Áudio feedback diferenciado por tipo usando Web Audio API
- **Vibração**: Padrões de vibração específicos para mobile
- **Animações**: Entrada suave com slide e fade

#### 📋 Funcionalidades Avançadas
- **Histórico**: Painel com últimas 10 notificações
- **Badge de Contador**: Indica notificações não lidas
- **Confirmações Modais**: Diálogos interativos para ações críticas
- **Auto-dismiss**: Fechamento automático configurável
- **Temas**: Suporte a tema claro/escuro automático

### Arquivos do Sistema

```
toast-notifications.js   // Classe ToastSystem completa
toast-notifications.css  // Estilos e animações
```

### API de Uso

#### Notificações Simples
```javascript
// Sucesso (verde)
Toast.success('Agendamento realizado com sucesso!', 4000);

// Erro (vermelho)
Toast.error('Erro ao salvar dados', 5000);

// Aviso (laranja)
Toast.warning('Atenção: dados não sincronizados', 4000);

// Informação (azul)
Toast.info('Sistema atualizado', 3000);
```

#### Notificações com Ações
```javascript
// Notificação com botão de ação
Toast.showWithAction(
    'Nova mensagem recebida',
    'info',
    () => { window.location.href = '/mensagens'; },
    'Ver Mensagem',
    6000
);
```

#### Confirmações Interativas
```javascript
// Confirmação genérica
const confirmed = await Toast.confirm('Deseja continuar?');
if (confirmed) {
    // Usuário clicou em confirmar
}

// Confirmação de exclusão
const shouldDelete = await Toast.confirmDelete('esta motocicleta');
if (shouldDelete) {
    // Processar exclusão
}

// Confirmação de logout
const shouldLogout = await Toast.confirmLogout();
if (shouldLogout) {
    // Fazer logout
}
```

#### Controle de Som e Vibração
```javascript
// Alternar som
Toast.toggleSound();

// Alternar vibração
Toast.toggleVibration();

// Verificar configurações
const soundEnabled = Toast.soundEnabled;
const vibrationEnabled = Toast.vibrationEnabled;
```

#### Gerenciamento de Histórico
```javascript
// Mostrar/ocultar painel de histórico
Toast.toggleHistory();

// Limpar histórico
Toast.clearHistory();

// Acessar histórico programaticamente
const history = Toast.history; // Array com últimas notificações
```

### Integração no Sistema

#### Admin Panel (admin.html)
```javascript
// Substituiu todos alert() e confirm()
// Exemplos de uso:

// Ao marcar agendamento como realizado
Toast.success('✅ Agendamento marcado como realizado!', 4000);

// Ao excluir agendamento
const confirmed = await Toast.confirmDelete('este agendamento');
if (confirmed) {
    // Processar exclusão
    Toast.success('🗑️ Agendamento excluído com sucesso!', 4000);
}

// Em erros de API
Toast.error('❌ Erro ao carregar dados', 5000);
```

#### Catálogo Cliente (catalog.html)
```javascript
// Ao selecionar moto para agendamento
Toast.success('✅ Moto selecionada! Redirecionando...', 3000);

// Em avisos de cache
Toast.warning('⚠️ Usando dados em cache', 3000);
```

#### Página de Agendamento (agendamento.html)
```javascript
// Confirmação de agendamento
Toast.success(`✅ Agendamento confirmado!\n\nMoto: ${motoNome}\nData: ${data}\nHorário: ${hora}`, 6000);

// Erros de validação
Toast.error('❌ Preencha todos os campos obrigatórios', 4000);
```

### Proteção contra Mensagens Antigas

O sistema inclui proteção CSS e JavaScript para garantir que mensagens antigas baseadas em DOM não apareçam:

```css
/* CSS de bloqueio */
.message, .success-message, .error-message {
    display: none !important;
    visibility: hidden !important;
}
```

```javascript
// Limpeza automática a cada 100ms
setInterval(() => {
    const oldMessages = document.querySelectorAll('.message, .success-message');
    oldMessages.forEach(msg => msg.remove());
}, 100);
```

### Cache e Versionamento

- **Versão atual**: `v=20260116toast8`
- **Cache-busting**: Parâmetros de versão em todos os includes
- **Exportação explícita**: `window.Toast = Toast` para garantir disponibilidade global

### Analytics Integrado

O sistema registra métricas de uso:
```javascript
Toast.analytics = {
    total: 0,                    // Total de notificações exibidas
    byType: {                    // Por tipo
        success: 0,
        error: 0,
        warning: 0,
        info: 0
    },
    clicks: 0,                   // Cliques em ações
    dismisses: 0,                // Dismisses manuais
    browserNotifications: 0      // Notificações do navegador
};
```

### Compatibilidade

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)
- ✅ Web Audio API para sons
- ✅ Vibration API para mobile
- ✅ Notification API (opcional)

---

## �🎬 Sistema SmartLoading

### Status: **IMPLEMENTADO E FUNCIONAL** ✅
**Data de Implementação:** 14/01/2026

Sistema de loading inteligente que proporciona transições suaves e profissionais entre telas e operações assíncronas.

### Arquivos

- **smart-loading.js** (241 linhas) - Lógica e controle
- **smart-loading.css** (174 linhas) - Animações e estilos

### Características Principais

#### ⏱️ Tempo Mínimo Garantido
- **2.5 segundos** de duração mínima
- Evita "flashes" de loading
- Garante que animação seja sempre visível

#### 🎨 Design Profissional
- Overlay escuro com `backdrop-filter: blur(10px)`
- Gradiente de fundo suave
- Spinner com 3 anéis animados
- Barra de progresso animada (0% → 90% → 100%)
- Transições suaves `cubic-bezier(0.4, 0, 0.2, 1)`

#### 🔝 Prioridade Visual
- `z-index: 9999999` - Sempre por cima de modais

### Implementações Ativas

#### 1. **Painel de Vendas ("Ver Vendidas")**
```javascript
// admin.js - showSoldMotorcycles()
- Marca tempo de início
- Mostra loading "Carregando vendas"
- Busca dados do servidor
- Constrói e exibe modal
- Aguarda renderização (2 frames + 300ms)
- Garante 2.5s mínimo total
- Esconde loading
```

#### 2. **Geração de Contratos**
```javascript
// contract-functions-macdavis.js
- Loading "Gerando contrato PDF..."
- Envia para API
- Aguarda processamento
- Garante 2.5s mínimo
- Abre PDF em nova aba
```

#### 3. **Navegação entre Páginas**
- Carregamento inicial (catalog, admin, agendamento)
- Transições suaves entre telas

### API SmartLoading

```javascript
// Mostrar loading
SmartLoading.show('Mensagem customizada');

// Esconder loading (SEMPRE com await!)
await SmartLoading.hide();

// Atualizar mensagem durante loading
SmartLoading.updateMessage('Nova mensagem');
```

### Funções Wrapper (admin.js)

```javascript
// Mostrar
function showAdminLoading(message = 'Processando') {
    if (window.SmartLoading) {
        SmartLoading.show(message);
    }
}

// Esconder (async!)
async function hideAdminLoading() {
    if (window.SmartLoading) {
        await SmartLoading.hide();
    }
}
```

### Padrão de Implementação

```javascript
// 1. Marcar início
const loadingStartTime = Date.now();

// 2. Mostrar loading
showAdminLoading('Carregando...');

// 3. Operação assíncrona
const data = await fetch(...);

// 4. Exibir conteúdo
modal.style.display = 'flex';

// 5. Aguardar renderização
await new Promise(resolve => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 300);
        });
    });
});

// 6. Garantir tempo mínimo
const elapsedTime = Date.now() - loadingStartTime;
const remainingTime = Math.max(0, 2500 - elapsedTime);
if (remainingTime > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingTime));
}

// 7. Esconder loading
await hideAdminLoading();
```

### Configuração

**Alterar tempo mínimo** em `smart-loading.js`:
```javascript
minLoadingTime: 2500, // Alterar aqui (ms)
```

---

## 🔒 Sistema de Contratos

### Status: **IMPLEMENTADO E FUNCIONAL** ✅

Sistema completo de geração automática de contratos em PDF integrado ao processo de vendas com suporte a:
- **Datas retroativas** (saleDate personalizável)
- **Dois tipos de contrato**: Padrão (MacDavis) e MOTTU (simplificado)
- **Template oficial** da loja com cláusulas fixas
- **Conversão automática** de valores para extenso
- **Formatação inteligente** de CPF/RG
- **Geração de PDF profissional** via pdfkit

---

### 📋 Tipos de Contratos

#### 1. **Contrato de Venda Padrão** 🏍️

**Quando usar:**
- Todas as motocicletas **EXCETO** marcas MOTTU
- Vendas normais da loja

**Campos obrigatórios:**
- **Comprador**: Nome completo, CPF, RG, endereço
- **Pagamento**: Valor total, dinheiro, cartão, parcelas
- **Data da venda**: Preenchida automaticamente ou editável

**Template:**
- **Cláusula 00**: Objeto do Contrato (dados da moto)
- **Cláusula 01**: Preço e Forma de Pagamento (EDITÁVEL)
- **Cláusulas 02-07**: Termos e condições (FIXAS)

**Validações:**
- Soma de dinheiro + cartão deve = valor total
- Todos os campos pessoais obrigatórios
- CPF e RG formatados automaticamente

**Rota API:** `/api/generate-contract`

**Nome do arquivo:** `Contrato_[Marca]_[Modelo]_[Ano]_[Comprador].pdf`

#### 2. **Contrato de Retirada MOTTU** 🛵

**Quando usar:**
- Detectado automaticamente quando marca contém "MOTTU"
- Motos de parceria/retirada

**Campos simplificados:**
- **Comprador**: Apenas Nome e CPF
- **Pagamento**: NÃO exigido (campo oculto)
- **Endereço**: NÃO exigido (campo oculto)

**Badge visual:**
- Mostra "🏍️ MOTTU" no modal de contrato
- Interface adaptada automaticamente

**Template especial:**
- Termo de retirada (não venda)
- Isenta loja de garantia/manutenção
- 4 cláusulas simplificadas

**Rota API:** `/api/generate-mottu-contract`

**Nome do arquivo:** `Contrato_Mottu_Retirada_[PLACA]_[NOME].pdf`

---

### 🎨 Interface de Geração

#### Abertura do Modal

**Três formas de abrir:**
1. No card de moto → Botão "📄 Gerar Contrato" (se vendida)
2. Modal de venda → Após marcar como vendida
3. Lista de motos vendidas → Ação "Gerar Contrato"

#### Detecção Automática MOTTU

```javascript
const isMottu = moto.marca && moto.marca.toUpperCase().includes('MOTTU');

if (isMottu) {
    // Oculta campos de pagamento
    // Oculta endereço
    // Mostra badge "🏍️ MOTTU"
    // Chama generateMottuContract()
}
```

#### Campos do Formulário

**Comprador:**
- Nome completo
- CPF (formatação automática: 000.000.000-00)
- RG (formatação inteligente: 00.000.000-0 ou 000.000.000-00)
- Endereço (oculto se MOTTU)

**Pagamento (oculto se MOTTU):**
- Valor total (com extenso automático)
- Dinheiro (com extenso automático)
- Cartão (com extenso automático)
- Parcelas (1-60x, com extenso automático)

**Data da Venda:**
- Preenchida automaticamente com `moto.saleDate`
- Editável para datas retroativas
- Formato: YYYY-MM-DD

---

### 🔧 Arquivos do Sistema

#### JavaScript

**contract-functions-macdavis.js** (568 linhas)
- `openContractModal(motoId)` - Abre modal e detecta MOTTU
- `generateContract(event)` - Gera contrato padrão
- `generateMottuContract()` - Gera contrato MOTTU
- `formatCPF(input)` - Formatador de CPF
- `formatRG(input)` - Formatador inteligente RG/CPF
- `numeroParaExtenso(numero)` - Converte números para texto
- `updateValorExtenso()` - Atualiza extenso do valor total
- `updatePagamentoValues()` - Sincroniza valores de pagamento

**contract-generator.js** (549 linhas)
- `generateContract(data)` - Backend padrão
- `generateMottuContract(data)` - Backend MOTTU
- `buildMottuContract(doc, data)` - Renderiza PDF MOTTU
- Usa **pdfkit** para geração de PDFs

#### Rotas API (server-admin.js)

```javascript
// Contrato padrão
POST /api/generate-contract
Body: { seller, buyer, motorcycle, payment, saleDate }

// Contrato MOTTU
POST /api/generate-mottu-contract
Body: { buyer: {nome, cpf}, motorcycle: {placa}, saleDate }

// Download
GET /api/download-contract/:filename
```

---

### 📂 Armazenamento

**Pasta:** `DOCS Motos/Contratos/`

**Nome dos arquivos:**
- Padrão: `Contrato_[Marca]_[Modelo]_[Ano]_[Comprador].pdf`
- MOTTU: `Contrato_Mottu_Retirada_[PLACA]_[NOME].pdf`

**Exemplos:**
```
DOCS Motos/
└── Contratos/
    ├── Contrato_Honda_CB500_2020_João_Silva.pdf
    ├── Contrato_Yamaha_MT07_2021_Maria_Santos.pdf
    └── Contrato_Mottu_Retirada_ABC1234_Carlos_Lima.pdf
```

---

### 💡 Conversão para Extenso

**Função:** `numeroParaExtenso(numero)`

**Suporta:**
- Números inteiros (0 a 999.999.999)
- Valores decimais (reais e centavos)
- Singular/plural automático

**Exemplos:**
```javascript
numeroParaExtenso(16000)
// "dezesseis mil reais"

numeroParaExtenso(6900.50)
// "seis mil e novecentos reais e cinquenta centavos"

numeroParaExtenso(10)
// "dez reais"
```

---

### 🔄 Fluxo de Geração

```
1. Admin marca moto como vendida
   ↓
2. Define saleDate (data da venda)
   ↓
3. Clica em "📄 Gerar Contrato"
   ↓
4. Sistema detecta: MOTTU ou Padrão?
   ↓
5a. Se MOTTU:                    5b. Se Padrão:
    - Oculta pagamento              - Mostra todos os campos
    - Oculta endereço               - Valida soma pagamento
    - Badge "🏍️ MOTTU"             - Requer endereço
    - Requer: nome, CPF             - Requer: nome, CPF, RG, endereço
   ↓                                ↓
6. Admin preenche formulário
   ↓
7. Clica "📄 Gerar Contrato PDF"
   ↓
8. SmartLoading exibe (2.5s mínimo)
   ↓
9. Backend gera PDF com pdfkit
   ↓
10. Salva em DOCS Motos/Contratos/
   ↓
11. Abre PDF em nova aba
   ↓
12. Toast de sucesso + fecha modal
```

---

### 📄 Estrutura de Dados

#### Contrato Padrão

```json
{
  "seller": {
    "nome": "MacDavis Motos LTDA",
    "cpf": "00.000.000/0001-00",
    "endereco": "Av. América, 1461, Cianorte-PR"
  },
  "buyer": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "rg": "12.345.678-9",
    "endereco": "Rua das Flores, 123, Centro, Cidade-UF"
  },
  "motorcycle": {
    "id": "uuid",
    "marca": "Honda",
    "modelo": "CB 500F",
    "ano": 2020,
    "cor": "Preta",
    "placa": "ABC-1234",
    "chassi": "9BWAA05048R123456",
    "renavam": "12345678901",
    "quilometragem": 15000,
    "estado": "BOM"
  },
  "payment": {
    "valorTotal": 22900.00,
    "valorTotalExtenso": "vinte e dois mil e novecentos reais",
    "dinheiro": 16000.00,
    "dinheiroExtenso": "dezesseis mil reais",
    "cartao": 6900.00,
    "cartaoExtenso": "seis mil e novecentos reais",
    "parcelas": 10,
    "parcelasExtenso": "dez"
  },
  "saleDate": "2026-01-15"
}
```

#### Contrato MOTTU

```json
{
  "buyer": {
    "nome": "Carlos Lima",
    "cpf": "987.654.321-00"
  },
  "motorcycle": {
    "id": "uuid",
    "marca": "MOTTU",
    "modelo": "E125",
    "placa": "XYZ-9876"
  },
  "saleDate": "2026-01-19"
}
```

---

### ⚙️ Configurações e Dependências

**package.json:**
```json
{
  "dependencies": {
    "pdfkit": "^0.13.0"
  }
}
```

**Instalação:**
```bash
npm install pdfkit
```

---

### 🎯 Validações Implementadas

#### Contrato Padrão
- ✅ Nome completo obrigatório
- ✅ CPF obrigatório e formatado
- ✅ RG obrigatório e formatado
- ✅ Endereço obrigatório
- ✅ Valor total > 0
- ✅ Soma dinheiro + cartão = valor total
- ✅ Parcelas entre 1 e 60

#### Contrato MOTTU
- ✅ Nome completo obrigatório
- ✅ CPF obrigatório e formatado
- ✅ Placa da motocicleta obrigatória
- ⚠️ Pagamento NÃO exigido
- ⚠️ Endereço NÃO exigido

---

### 🔐 Segurança

- **Acesso restrito**: Apenas admin (porta 3001)
- **Validação server-side**: Backend valida todos os dados
- **Sanitização**: Nomes de arquivos sanitizados (sem caracteres especiais)
- **Armazenamento isolado**: Pasta dedicada DOCS Motos/Contratos/
- **Download protegido**: Rota `/api/download-contract` com validação

---

### 📊 Histórico de Versões

**v3.1.1** (19/01/2026)
- Documentação completa adicionada
- Sistema MOTTU documentado

**v3.1.0** (19/01/2026)
- Sistema funcionando com ambos os tipos

**v3.0.0** (07/01/2026)
- Implementação inicial
- Template oficial MacDavis
- Suporte a datas retroativas (saleDate)
- Backup: `Backup_Pre_Contrato_20260107_101335`

### Fluxo de Uso Planejado

```
┌────────────────────────────────────────────┐
│  1. Realizar Venda no Painel Admin         │
│     ├─ Selecionar moto                     │
│     ├─ Preencher dados do comprador        │
│     └─ Escolher gerar contrato (opcional)  │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│  2. Abrir Modal de Geração de Contrato     │
│     ├─ Tipo: Venda/Compra/Troca/Consign.   │
│     ├─ Dados pré-preenchidos               │
│     ├─ Campos editáveis                    │
│     └─ Preview do contrato                 │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│  3. Preencher Campos Específicos           │
│     ├─ Condições de pagamento              │
│     ├─ Garantias                           │
│     ├─ Observações                         │
│     └─ Termos adicionais                   │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│  4. Gerar PDF do Contrato                  │
│     ├─ Validação de campos obrigatórios    │
│     ├─ Geração do PDF via biblioteca       │
│     ├─ Armazenamento em /DOCS Contratos/   │
│     └─ Download automático                 │
└────────────────────────────────────────────┘
```

### Estrutura de Template de Contrato

```javascript
{
  "id": "contrato-uuid",
  "tipo": "venda|compra|troca|consignacao",
  "dataGeracao": "2026-01-06T18:00:00Z",
  "moto": {
    "id": "moto-1",
    "marca": "Honda",
    "modelo": "CB 300R",
    "ano": "2024",
    "placa": "ABC-1234",
    "chassi": "9BWAA05048R123456",
    "renavam": "12345678901",
    "cor": "Preta",
    "km": "5000"
  },
  "vendedor": {
    "tipo": "loja|particular",
    "nome": "MacDavis Motos LTDA",
    "cpfCnpj": "12.345.678/0001-90",
    "endereco": "Rua Principal, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "telefone": "(11) 9999-9999"
  },
  "comprador": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "rg": "12.345.678-9",
    "endereco": "Rua Secundária, 456",
    "cidade": "São Paulo",
    "estado": "SP",
    "telefone": "(11) 8888-8888",
    "email": "joao@email.com"
  },
  "valores": {
    "valorVenda": 15000.00,
    "formaPagamento": "À vista|Parcelado|Financiado",
    "entrada": 5000.00,
    "parcelas": 10,
    "valorParcela": 1000.00
  },
  "observacoes": "Moto em perfeito estado...",
  "clausulas": [
    "O veículo é vendido no estado em que se encontra...",
    "O comprador se responsabiliza pela transferência..."
  ],
  "assinaturas": {
    "vendedor": true,
    "comprador": true,
    "testemunha1": { "nome": "", "cpf": "" },
    "testemunha2": { "nome": "", "cpf": "" }
  },
  "arquivoPDF": "/DOCS Contratos/contrato-venda-001-2026.pdf"
}
```

### Tecnologias Planejadas

- **Geração PDF**: jsPDF ou pdfmake
- **Template Engine**: Handlebars ou template literals
- **Armazenamento**: Pasta `/DOCS Contratos/`
- **Vinculação**: Campo `contratoId` em motorcycles.json

### Campos do Formulário de Geração

#### Dados Automáticos (pré-preenchidos)
- ✅ Dados da moto (do JSON)
- ✅ Dados do vendedor (MacDavis Motos)
- ✅ Data e hora da geração

#### Campos Obrigatórios
- ⚠️ Nome completo do comprador
- ⚠️ CPF do comprador
- ⚠️ RG do comprador
- ⚠️ Endereço completo
- ⚠️ Telefone
- ⚠️ Valor da venda
- ⚠️ Forma de pagamento

#### Campos Opcionais
- Email
- Testemunhas
- Observações adicionais
- Cláusulas específicas

### Implementação Futura

**Fase 1: Estrutura Base** ✅ **CONCLUÍDA - 06/01/2025**
- [x] ✅ Criar modal de geração de contratos
- [x] ✅ Formulário com campos obrigatórios
- [x] ✅ Validação de dados
- [x] ✅ Preview do contrato em HTML
- [x] ✅ Integração com modal de venda
- [x] ✅ Seleção de 4 tipos de contrato
- [x] ✅ Pré-preenchimento automático de dados

**Arquivos Criados**:
- `contract-styles.css` - Estilos do sistema
- `contract-functions.js` - Lógica JavaScript
- Modais adicionados em `admin.html`

**Fase 2: Geração de PDF** 🔄 **PRÓXIMA**
- [ ] Integrar biblioteca de PDF
- [ ] Template visual do contrato
- [ ] Formatação profissional
- [ ] Logo e cabeçalho MacDavis

**Fase 3: Armazenamento**
- [ ] Sistema de salvamento de contratos
- [ ] Vinculação com vendas
- [ ] Histórico de contratos
- [ ] Busca e visualização

**Fase 4: Recursos Avançados**
- [ ] Assinatura digital
- [ ] Envio por email
- [ ] Impressão direta
- [ ] Modelos customizáveis

### Exemplo de Uso

1. Admin marca moto como vendida
2. Preenche dados do comprador
3. Clica em "Gerar Contrato"
4. Seleciona tipo (Venda)
5. Revisa dados pré-preenchidos
6. Adiciona informações de pagamento
7. Clica em "Gerar PDF"
8. Sistema cria contrato-venda-001-2026.pdf
9. Download automático
10. Contrato vinculado à venda no sistema

---

## 🚀 Changelog

**v2.3 (06/01/2026):**
- ✅ **Sistema de contratos planejado e documentado**
- ✅ **Auto-refresh otimizado** (1 segundo com cache inteligente)
- ✅ **Contadores dinâmicos** no filtro de agendamentos
- ✅ **Header da página de agendamento** com efeito neon laranja
- ✅ **Cards informativos** (Horário, Localização, Contato)
- ✅ **Performance melhorada** (silent mode + hash comparison)
- ✅ Logs otimizados (apenas a cada 10 refreshes)
- ✅ Select de filtro aumentado (1.2rem padding, 1.1rem font)
- ✅ Correção de bugs no loadAppointments

**v2.2 (16/12/2025 - Tarde):**
- ✅ **Atualização de imagens via painel admin**
- ✅ Correção do sistema de thumbs/imagens
- ✅ Remoção de aspas duplicadas nos caminhos de imagens
- ✅ Atualização da CB 300R com foto nova (Foto 1.jpg)
- ✅ Sistema de cópia de imagens funcionando corretamente
- ✅ Validação de caminhos de imagens no servidor
- ✅ Backup automático do sistema
- ✅ Preparação para commit no Git

**v2.1 (16/12/2025 - Manhã):**
- ✅ **Auto-refresh de agendamentos** (10 segundos)
- ✅ Layout horizontal responsivo dos cards de agendamentos
- ✅ Cards compactos (3 por linha, largura mínima 320px)
- ✅ Headers anti-cache agressivos no servidor admin
- ✅ Logs coloridos e destacados no console
- ✅ Contador de refreshes visível
- ✅ Título da página pisca durante atualização
- ✅ Script inline de verificação do auto-refresh
- ✅ Cache busting com timestamps dinâmicos

**v3.1.0 (19/01/2026):**
- ✅ Interface mobile aprimorada (modais com X centralizado)
- ✅ Notificações reduzidas (1 toast apenas)
- ✅ Firewall auto-fix (tarefa agendada Windows)
- ✅ Categorização Trail inteligente (detecta NC)
- ✅ Filtros sem emojis (interface limpa)
- ✅ "Alta Cilindrada" → "Esportiva"
- ✅ Lógica Trail antes de cilindrada ≥500cc

**v2.0 (16/12/2025):**
- ✅ Sistema de vendas (marcar como vendida)
- ✅ Gestão completa de agendamentos
- ✅ Contadores em tempo real
- ✅ Filtros pendentes/realizados/todos
- ✅ Ordenação por mais recentes
- ✅ Auto-refresh após ações
- ✅ Correção: agendamentos.html envia para API
- ✅ Badges visuais de status
- ✅ Funções globais (window scope)

**v1.5 (Dez 2024):**

---

## 🔥 Firewall Auto-Fix

### Descrição
Sistema automático de manutenção de regras de firewall do Windows para garantir acesso mobile permanente.

### Problema Resolvido
Regras de firewall desapareciam periodicamente, bloqueando acesso via IP local (192.168.1.158:3000 e :3001) de dispositivos mobile.

### Arquivos
- **auto-fix-firewall.ps1**: Script principal de verificação/criação de regras
- **INSTALAR.ps1**: Instalador da tarefa agendada
- **INSTALAR-AUTOFIX.bat**: Wrapper batch para execução com admin
- **DESINSTALAR-AUTO-FIX.ps1**: Removedor da tarefa agendada
- **firewall-auto-fix.log**: Log de execuções com timestamps

### Funcionamento
```
1. Sistema inicia (Windows boot)
   ↓
2. Tarefa agendada executa auto-fix-firewall.ps1
   ↓
3. Verifica existência de regras:
   - "MacDavis Motos - Cliente (TCP 3000)"
   - "MacDavis Motos - Admin (TCP 3001)"
   ↓
4. Se regra NÃO existe:
   - Cria regra com netsh advfirewall
   - Registra em log: "CRIADA Regra [porta]"
   ↓
5. Se regra existe:
   - Registra em log: "OK Regra [porta] existe"
```

### Instalação
```powershell
# 1. Abrir PowerShell como Administrador
# 2. Navegar até a pasta fix-firewall
cd "C:\Users\W10\Documents\TCC - teste\fix-firewall"

# 3. Executar instalador
.\INSTALAR-AUTOFIX.bat

# Ou executar diretamente:
powershell -ExecutionPolicy Bypass -File .\INSTALAR.ps1
```

### Verificação
```powershell
# Ver últimas 10 linhas do log
Get-Content .\firewall-auto-fix.log -Tail 10

# Verificar tarefa agendada
Get-ScheduledTask -TaskName "MacDavis Motos - Auto-Fix Firewall"

# Testar execução manual
.\auto-fix-firewall.ps1
```

### Configuração da Tarefa
- **Nome**: MacDavis Motos - Auto-Fix Firewall
- **Usuário**: SYSTEM
- **Privilégio**: Highest
- **Gatilho**: AtStartup (ao iniciar Windows)
- **Ação**: PowerShell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden
- **Timeout**: 5 minutos

### Log de Exemplo
```
2026-01-19 10:10:17 - ====== INICIANDO AUTO-FIX FIREWALL ======
2026-01-19 10:10:17 - Verificando regras de firewall...
2026-01-19 10:10:18 - OK Regra 3000 existe
2026-01-19 10:10:18 - OK Regra 3001 existe
2026-01-19 10:10:18 - ====== FIM AUTO-FIX FIREWALL ======
```

---

## 📱 Sistema de Interface Mobile Profissional (v3.7.0)

### 🎨 Visão Geral
Interface mobile completamente redesenhada com foco em profissionalismo, usabilidade e eliminação definitiva de problemas de scroll.

### 🛡️ Arquitetura de Proteção de Scroll

#### Problema Resolvido
- **v3.5.0 e anteriores**: Scroll travava após ações (agendamento, modais)
- **v3.7.0**: Proteção multi-camadas implementada

#### Solução Implementada

**1. CSS Mobile Dedicado**: `mobile-minimal.css v20260125008`
```css
/* Forçar scroll em mobile */
body, html {
    overflow: auto !important;
    overflow-y: auto !important;
    position: static !important;
    height: auto !important;
}
```

**2. Script de Proteção em catalog.html**:
```javascript
// Proteção agressiva com setInterval + event listeners
- setInterval 500ms durante primeiros segundos
- Listeners: visibilitychange, focus, pageshow
- MutationObserver monitorando classes modal-open
```

**3. Script de Proteção em agendamento.html**:
```javascript
// Proteção otimizada sem loops infinitos
- setTimeout em 1s, 2s e 5s (momento do agendamento)
- Event listeners críticos mantidos
- SEM setInterval (evita crash)
```

### 🎨 Design Profissional Mobile

#### Header Moderno
```css
.header-mobile {
    background: conic-gradient(from 45deg, #ff7a18, #ff9a4d, #ff7a18);
    animation: rotate-gradient 4s linear infinite;
    overflow: hidden;
}

.header-refresh-btn {
    z-index: 9999;
    pointer-events: auto !important;
}

.header-btn {
    z-index: 101;
    pointer-events: auto !important;
    -webkit-tap-highlight-color: rgba(255, 122, 24, 0.3);
}
```

**Características**:
- ✅ Logo posicionado à esquerda
- ✅ Animação conic-gradient rotativa
- ✅ Botões 100% clicáveis (z-index hierárquico)
- ✅ Highlight visual ao tocar
- ✅ Overflow:hidden para conter animação

#### Modal Profissional
```css
.modal-overlay {
    background: rgba(0, 0, 0, 0.9);
}

.modal-content {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 16px;
    max-height: 85vh;
    overflow-y: auto;
}

.modal button {
    min-height: 42px;
}
```

**Características**:
- ✅ Overlay 90% preto (mais imersivo)
- ✅ Gradiente de fundo moderno
- ✅ Bordas arredondadas (16px)
- ✅ Scroll interno quando conteúdo grande
- ✅ Botões maiores (42px) para mobile

#### Filtros Interativos
```css
.filter-btn {
    pointer-events: auto !important;
    z-index: 100;
    cursor: pointer;
}

.filter-btn.active {
    background: linear-gradient(135deg, #ff7a18, #ff9a4d) !important;
    color: white !important;
    transform: scale(1.05);
}
```

**Características**:
- ✅ 100% clicáveis (pointer-events)
- ✅ Estados ativos visíveis (laranja)
- ✅ Animação de escala ao ativar
- ✅ Z-index 100 para evitar sobreposição

### 📂 Arquivos Mobile

#### mobile-minimal.css (v20260125008)
**Usado em**: catalog.html, agendamento.html

**Seções**:
1. **Base Mobile** (linhas 1-40): Reset, scroll forçado
2. **Header** (linhas 50-100): Logo, animação, botões
3. **Badges** (linhas 86-95): .moto-badge display:none
4. **User Info** (linhas 150-180): Perfil, z-index
5. **Filtros** (linhas 190-305): Container, botões, estados ativos
6. **Grid 2x2** (linhas 350-400): Layout motos
7. **Modal** (linhas 400-470): Overlay, conteúdo, botões

#### Scripts de Proteção

**catalog.html** (linhas ~150-200):
- setInterval 500ms por 50 tentativas
- MutationObserver em body
- Event listeners completos

**agendamento.html** (linhas ~390-420):
- setTimeout estratégicos (1s, 2s, 5s)
- Event listeners essenciais
- SEM loops infinitos

### 🔧 Hierarquia Z-Index

```
9999 - Botão refresh header
 101 - Botões header (MEUS AGENDAMENTOS, SAIR)
 100 - Filtros e container de filtros
  10 - Header geral
   1 - Conteúdo normal
```

### ✅ Checklist de Funcionalidades Mobile

- ✅ Scroll em catalog.html
- ✅ Scroll em agendamento.html
- ✅ Botão MEUS AGENDAMENTOS clicável
- ✅ Botão SAIR clicável
- ✅ Botão refresh clicável
- ✅ Filtros de marca clicáveis
- ✅ Filtros de estilo clicáveis
- ✅ Filtros de cilindrada clicáveis
- ✅ Estados ativos nos filtros (laranja)
- ✅ Modal de detalhes abre/fecha
- ✅ Botão "Agendar Visita" funcional
- ✅ Grid 2x2 mantido
- ✅ Badge 750cc removido
- ✅ Zero crashes ou freezes

### 🚀 Performance

**Otimizações**:
- CSS com !important apenas onde necessário
- Scripts executam apenas em mobile (<1025px detectado via CSS)
- Event listeners removíveis (não persistem)
- setTimeout ao invés de setInterval em agendamento.html

**Resultados**:
- Carregamento instantâneo
- Scroll suave 60fps
- Zero travamentos
- Compatibilidade total Android/iOS

---

## 🏍️ Categorização de Motocicletas

### Ordem de Prioridade
Sistema utiliza ordem específica para categorizar motocicletas:

```javascript
// Função getCategoria() - Ordem de verificação:

1. Scooter (categoria 1)
   - tipo === 'scooter' OR
   - categoria === 'scooter'

2. Custom (categoria 4)
   - tipo === 'custom' OR
   - categoria === 'custom'

3. Trail (categoria 5) ⚠️ VERIFICADO ANTES DE CILINDRADA
   - tipo === 'trail' OR
   - categoria === 'trail' OR
   - modelo.includes('nc') OR
   - modelo.includes('xre') OR
   - modelo.includes('crosser')

4. Esportiva (categoria 3)
   - cilindrada >= 500 AND
   - NÃO é Trail

5. Street (categoria 2)
   - Todas as demais (< 500cc)
```

### Detecção Trail Inteligente
Sistema detecta motos Trail por:
- **Campo tipo**: "trail", "enduro"
- **Campo categoria**: "trail"
- **Campo modelo**: "NC", "XRE", "Crosser"

**Exemplo**: Honda NC 750X
- ✅ `modelo = "NC 750X"` → `.includes('nc')` → Trail (5)
- ❌ NÃO cai em Esportiva mesmo tendo 750cc

### Filtros no Catálogo
```javascript
// Trail (inclui NC)
currentEstiloFilter === 'trail'
→ tipo.includes('trail') OR modelo.includes('nc')

// Esportiva (exclui Trail)
currentEstiloFilter === 'alta-cilindrada'
→ cilindrada >= 500 AND !isTrail
```

### Arquivos com Lógica de Categorização
1. **catalog.html** (3 locais):
   - Linha ~1025: Filtro por estilo (função anônima)
   - Linha ~1088: Filtro duplicado em outra função
   - Linha ~1166: Função getCategoria() para ordenação

2. **catalog.js**:
   - Linha ~215: Filtro por estilo
   - Linha ~380: Função getCategoria()

3. **admin.js**:
   - Função de ordenação de motocicletas

### Interface de Filtros

**Antes (v3.0)**:
```
🛵 Scooters | 🏍️ Streets | 🏁 Alta Cilindrada | 🎸 Custom
```

**Depois (v3.1.0)**:
```
Scooters | Streets | Esportiva | Custom | Trail
```

---
- Separação cliente/admin em portas
- Middleware de bloqueio
- Autenticação melhorada

**v1.0 (Nov 2024):**
- Sistema inicial

---

**Documentação Completa - MacDavis Motos v2.0** 📚✨




