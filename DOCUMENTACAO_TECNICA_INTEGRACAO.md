# 📚 Documentação Técnica - MacDavis Motos
20260129
## Sistema de Gerenciamento de Motocicletas

---

## 📋 **Índice**
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [APIs e Endpoints](#apis-e-endpoints)
5. [Integração WhatsApp](#integração-whatsapp)
6. [Autenticação](#autenticação)
7. [Banco de Dados](#banco-de-dados)
8. [Deploy](#deploy)

---

## 🎯 **Visão Geral**

Sistema completo de gerenciamento de motocicletas com:
- **Catálogo público** para clientes (porta 3000)
- **Painel administrativo** para gestão (porta 3001)
- **Sistema de agendamentos** com notificações
- **Upload de documentos** (CRLVs)
- **Filtros avançados** e busca em tempo real

---

## 🏗️ **Arquitetura do Sistema**

### **Frontend (Concluído)**
```
┌─────────────────────────────────────────────┐
│           CATÁLOGO CLIENTE                  │
│  localhost:3000                             │
│  - Galeria de motos disponíveis             │
│  - Sistema de filtros e busca               │
│  - Agendamentos de visitas                  │
│  - Loading screens animados                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         PAINEL ADMINISTRATIVO               │
│  localhost:3001/admin.html                  │
│  - CRUD completo de motocicletas            │
│  - Gestão de vendas                         │
│  - Upload de documentos                     │
│  - Estatísticas em tempo real               │
│  - Filtros customizados com animações       │
└─────────────────────────────────────────────┘
```

### **Backend (A Integrar)**
```
┌─────────────────────────────────────────────┐
│           API REST (Node.js)                │
│  - Express.js + MongoDB/PostgreSQL          │
│  - Autenticação JWT                         │
│  - Upload de arquivos (Multer)              │
│  - WebSocket para real-time                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         INTEGRAÇÃO WHATSAPP                 │
│  - API WhatsApp Business                    │
│  - Twilio/Baileys                           │
│  - Notificações de agendamentos             │
│  - Confirmações automáticas                 │
└─────────────────────────────────────────────┘
```

---

## 📁 **Estrutura de Arquivos**

### **Arquivos Principais**

#### **Cliente (Frontend)**
```
catalog.html              → Página principal do catálogo
catalog.js                → Lógica do catálogo (filtros, cards)
catalog-styles-dark-modern.css → Estilos do catálogo
login.html                → Tela de login cliente
```

#### **Admin (Frontend)**
```
admin.html                → Painel administrativo
admin.js                  → Lógica principal do admin
admin-final-funcional.js  → CRUD de motocicletas
admin-styles-dark-modern.css → Estilos do painel admin
admin-login.html          → Login administrativo
```
Nota: o painel administrativo gerencia também o **preço** das motocicletas (`price` / `preco`), campo não exibido no catálogo público.
Também existe um campo `FIPE` (`fipe` / `FIPE`) no admin para armazenar o valor da tabela FIPE; ele é opcional e visível apenas no painel administrativo.

#### **Servidor (Backend Atual)**
```
server-client.js          → Servidor cliente (porta 3000)
server-admin.js           → Servidor admin (porta 3001)
```

#### **Dados**
```
motorcycles.json          → Dados de motocicletas (SUBSTITUIR POR BD)
data/appointments.json    → Agendamentos (SUBSTITUIR POR BD)
DOCS Motos/              → PDFs dos CRLVs
Fotos motos/             → Imagens das motos
```

#### **Sistema**
```
page-transitions.js       → Sistema de loading e transições
page-transitions.css      → Estilos de loading
CSS.css                   → Estilos globais
```

---

## 🔌 **APIs e Endpoints**

### **Endpoints Atuais (JSON)**

#### **Motocicletas**
```javascript
// GET - Listar todas as motos
GET /api/motorcycles
Response: Array<Motorcycle>

// GET - Buscar moto por ID
GET /api/motorcycles/:id
Response: Motorcycle

// POST - Criar nova moto (ADMIN)
POST /api/motorcycles
Body: {
  name: string,
  marca: string,
  estilo: string,
  cilindrada: string,
  ano: number,
  cor: string,
  km: string,
  price: number,
  status: "disponivel" | "vendido",
  image: string,
  documentoPDF: string (opcional)
}

// PUT - Atualizar moto (ADMIN)
PUT /api/motorcycles/:id
Body: Motorcycle

// DELETE - Excluir moto (ADMIN)
DELETE /api/motorcycles/:id
```

#### **Agendamentos**
```javascript
// GET - Listar agendamentos (ADMIN)
GET /api/appointments
Response: Array<Appointment>

// POST - Criar agendamento
POST /api/appointments
Body: {
  nome: string,
  email: string,
  telefone: string,
  moto: string,
  data: string,
  hora: string,
  mensagem: string (opcional)
}
```

### **Endpoints a Implementar no Backend**

#### **Autenticação**
```javascript
// POST - Login
POST /api/auth/login
Body: { username: string, password: string }
Response: { token: string, user: User }

// POST - Logout
POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }

// GET - Verificar token
GET /api/auth/verify
Headers: { Authorization: "Bearer <token>" }
```

#### **Upload de Arquivos**
```javascript
// POST - Upload de imagem
POST /api/upload/image
Content-Type: multipart/form-data
Body: { file: File }
Response: { url: string }

// POST - Upload de PDF (CRLV)
POST /api/upload/document
Content-Type: multipart/form-data
Body: { file: File }
Response: { url: string }
```

#### **Vendas**
```javascript
// POST - Registrar venda
POST /api/sales
Body: {
  motoId: string,
  compradorNome: string,
  compradorEmail: string (opcional),
  compradorTelefone: string (opcional),
  dataVenda: string,
  renavam: string (opcional)
}

// GET - Histórico de vendas
GET /api/sales
Query: { month?: string, year?: number }
Response: Array<Sale>
```

---

## 💬 **Integração WhatsApp**

### **Fluxo de Agendamentos**

```javascript
// 1. Cliente agenda no site
POST /api/appointments
↓
// 2. Backend salva no BD
Database.save(appointment)
↓
// 3. Envia WhatsApp automático
WhatsAppService.send({
  to: "+55" + telefone,
  template: "agendamento_confirmado",
  params: {
    nome: cliente.nome,
    moto: moto.name,
    data: appointment.data,
    hora: appointment.hora
  }
})
↓
// 4. Admin recebe notificação
WhatsAppService.send({
  to: ADMIN_PHONE,
  message: `🔔 Novo agendamento!\n
  Cliente: ${nome}\n
  Moto: ${moto}\n
  Data: ${data} às ${hora}`
})
```

### **Templates de Mensagem**

#### **Confirmação de Agendamento**
```
✅ Agendamento Confirmado - MacDavis Motos

Olá {{nome}}! 

Seu agendamento foi confirmado:
🏍️ Moto: {{moto}}
📅 Data: {{data}}
🕐 Horário: {{hora}}

📍 Endereço: [SEU ENDEREÇO]
📞 Contato: [SEU TELEFONE]

Aguardamos você!
MacDavis Motos 🧡
```

#### **Notificação Admin**
```
🔔 NOVO AGENDAMENTO

Cliente: {{nome}}
📱 {{telefone}}
✉️ {{email}}

Moto Interesse: {{moto}}
Data/Hora: {{data}} - {{hora}}

Mensagem: {{mensagem}}
```

### **Bibliotecas Recomendadas**

```json
{
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",  // Para WhatsApp Web
    "twilio": "^4.19.0",            // API oficial WhatsApp Business
    "baileys": "^6.5.0"             // Alternativa open-source
  }
}
```

---

## 🔐 **Autenticação**

### **Sistema Atual (Frontend)**
```javascript
// Credenciais hardcoded (SUBSTITUIR)
const validCredentials = {
  'admin': 'MacDavis@2025',
  'administrador': 'Admin@MacDavis',
  'root': 'Root@MacDavis2025'
};
```

### **Sistema Recomendado (Backend)**

#### **Schema do Usuário**
```javascript
const UserSchema = {
  _id: ObjectId,
  username: String,
  password: String,  // Hash bcrypt
  role: "admin" | "cliente",
  createdAt: Date,
  lastLogin: Date
};
```

#### **Fluxo de Autenticação**
```javascript
// 1. Login
POST /api/auth/login
{
  username: "admin",
  password: "MacDavis@2025"
}
↓
// 2. Backend verifica
const user = await User.findOne({ username });
const isValid = await bcrypt.compare(password, user.password);
↓
// 3. Gera JWT
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
↓
// 4. Retorna token
Response: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { username: "admin", role: "admin" }
}
```

#### **Middleware de Proteção**
```javascript
// Middleware para rotas protegidas
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Uso
app.get('/api/motorcycles', authMiddleware, (req, res) => {
  // Rota protegida
});
```

---

## 🗄️ **Banco de Dados**

> **Nota:** A escolha do banco de dados fica a critério do desenvolvedor backend.  
> Abaixo estão exemplos para **PostgreSQL** e **MongoDB**.

---

### **Opção 1: PostgreSQL (Relacional)**

#### **Tabela: motorcycles**
```sql
CREATE TABLE motorcycles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  estilo VARCHAR(50) NOT NULL,
  cilindrada VARCHAR(20) NOT NULL,
  ano INTEGER NOT NULL,
  cor VARCHAR(50) NOT NULL,
  km VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'disponivel',
  image TEXT,
  images TEXT[],
  documento_pdf TEXT,
  placa VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vendido_em TIMESTAMP,
  comprador_nome VARCHAR(255),
  comprador_telefone VARCHAR(20),
  renavam VARCHAR(20)
);

CREATE INDEX idx_motorcycles_status ON motorcycles(status);
CREATE INDEX idx_motorcycles_marca ON motorcycles(marca);
CREATE INDEX idx_motorcycles_estilo ON motorcycles(estilo);
```

#### **Tabela: appointments**
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  moto VARCHAR(255) NOT NULL,
  moto_id INTEGER REFERENCES motorcycles(id),
  data VARCHAR(20) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  mensagem TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  whatsapp_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_data ON appointments(data);
```

#### **Tabela: sales**
```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  moto_id INTEGER REFERENCES motorcycles(id),
  comprador_nome VARCHAR(255) NOT NULL,
  comprador_email VARCHAR(255),
  comprador_telefone VARCHAR(20),
  data_venda TIMESTAMP NOT NULL,
  valor_venda DECIMAL(10,2) NOT NULL,
  renavam VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_data_venda ON sales(data_venda);
```

#### **Tabela: users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'cliente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$...', 'admin');
```

---

### **Opção 2: MongoDB (NoSQL)**

#### **Collection: motorcycles**
```javascript
{
  _id: ObjectId,
  name: String,
  marca: String,
  estilo: String,
  cilindrada: String,
  ano: Number,
  cor: String,
  km: String,
  price: Number,
  status: String,
  image: String,
  images: [String],
  documentoPDF: String,
  placa: String,
  createdAt: Date,
  updatedAt: Date,
  vendidoEm: Date,
  compradorNome: String,
  compradorTelefone: String,
  renavam: String
}

// Índices
db.motorcycles.createIndex({ status: 1 })
db.motorcycles.createIndex({ marca: 1 })
db.motorcycles.createIndex({ estilo: 1 })
```

#### **Collection: appointments**
```javascript
{
  _id: ObjectId,
  nome: String,
  email: String,
  telefone: String,
  moto: String,
  motoId: ObjectId,
  data: String,
  hora: String,
  mensagem: String,
  status: String,
  createdAt: Date,
  confirmedAt: Date,
  whatsappSent: Boolean
}

db.appointments.createIndex({ status: 1 })
db.appointments.createIndex({ data: 1 })
```

#### **Collection: sales**
```javascript
{
  _id: ObjectId,
  motoId: ObjectId,
  compradorNome: String,
  compradorEmail: String,
  compradorTelefone: String,
  dataVenda: Date,
  valorVenda: Number,
  renavam: String,
  observacoes: String,
  createdAt: Date
}

db.sales.createIndex({ dataVenda: -1 })
```

---

### **Migrations**

#### **PostgreSQL - Migração de motorcycles.json**
```javascript
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  const data = JSON.parse(fs.readFileSync('motorcycles.json', 'utf8'));
  
  for (const moto of data) {
    await pool.query(
      `INSERT INTO motorcycles 
       (name, marca, estilo, cilindrada, ano, cor, km, price, status, image, documento_pdf, placa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [moto.name, moto.marca, moto.estilo, moto.cilindrada, moto.ano, 
       moto.cor, moto.km, moto.price, moto.status, moto.image, 
       moto.documentoPDF, moto.placa]
    );
  }
  
  console.log(`✅ ${data.length} motocicletas migradas para PostgreSQL!`);
  await pool.end();
}

migrateData();
```

#### **MongoDB - Migração de motorcycles.json**
```javascript
const fs = require('fs');
const mongoose = require('mongoose');
const Motorcycle = require('./models/Motorcycle');

async function migrateData() {
  const data = JSON.parse(fs.readFileSync('motorcycles.json', 'utf8'));
  await mongoose.connect(process.env.MONGODB_URI);
  
  await Motorcycle.insertMany(data.map(moto => ({
    ...moto,
    createdAt: new Date(),
    updatedAt: new Date()
  })));
  
  console.log(`✅ ${data.length} motocicletas migradas para MongoDB!`);
  await mongoose.disconnect();
}

migrateData();
```

---

## 🚀 **Deploy**

### **Variáveis de Ambiente (.env)**
```env
# Servidor
NODE_ENV=production
PORT=3000
ADMIN_PORT=3001

# Banco de Dados (escolher um)
# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/macdavis

# MongoDB
MONGODB_URI=mongodb://localhost:27017/macdavis

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h

# WhatsApp
WHATSAPP_API_KEY=your-api-key
ADMIN_PHONE=+5511999999999

# Upload
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha
```

### **Estrutura de Deploy**
```
/var/www/macdavis/
├── frontend/
│   ├── catalog.html
│   ├── admin.html
│   ├── css/
│   ├── js/
│   └── images/
├── backend/
│   ├── src/
│   ├── uploads/
│   └── node_modules/
└── .env
```

### **PM2 Configuration (pm2.config.js)**
```javascript
module.exports = {
  apps: [
    {
      name: 'macdavis-client',
      script: './server-client.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'macdavis-admin',
      script: './server-admin.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

### **Nginx Configuration**
```nginx
# Cliente
server {
    listen 80;
    server_name macdavis.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin
server {
    listen 80;
    server_name admin.macdavis.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎨 **Design System**

### **Cores MacDavis**
```css
:root {
  /* Laranja Primário */
  --orange-primary: #ff6600;
  --orange-light: #ff8533;
  --orange-dark: #cc5200;
  
  /* Fundos */
  --bg-primary: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  
  /* Texto */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  
  /* Bordas */
  --border-glass: rgba(255, 255, 255, 0.1);
  --border-accent: #ff6600;
  
  /* Raios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

### **Animações**
```css
/* Loading Moto */
@keyframes motoRide {
  0%, 100% { transform: translate(-50%, -50%) rotate(-5deg) scale(0.9); }
  50% { transform: translate(-50%, -55%) rotate(5deg) scale(1.1); }
}

/* Cascata Dropdowns */
@keyframes slideInCascade {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Bounce In */
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
```

---

## 📝 **Checklist de Integração**

### **Backend**
- [ ] Escolher banco de dados (PostgreSQL ou MongoDB)
- [ ] Configurar banco escolhido
- [ ] Criar schemas/tabelas
- [ ] Migrar dados de motorcycles.json para BD
- [ ] Implementar autenticação JWT
- [ ] Criar endpoints RESTful
- [ ] Implementar upload de arquivos (Multer)
- [ ] Configurar CORS
- [ ] Validação de dados (Joi/Yup)

### **WhatsApp**
- [ ] Escolher biblioteca (Twilio/Baileys)
- [ ] Configurar API WhatsApp Business
- [ ] Criar templates de mensagens
- [ ] Implementar notificações automáticas
- [ ] Testar fluxo completo

### **Segurança**
- [ ] Hash de senhas (bcrypt)
- [ ] Proteção CSRF
- [ ] Rate limiting
- [ ] Sanitização de inputs
- [ ] HTTPS em produção
- [ ] Variáveis de ambiente

### **Deploy**
- [ ] Configurar servidor (VPS/Cloud)
- [ ] Instalar Node.js + PM2
- [ ] Configurar Nginx/Apache
- [ ] SSL/TLS (Let's Encrypt)
- [ ] Backups automáticos
- [ ] Monitoring (Sentry/NewRelic)

---

## 🤝 **Suporte**

**Frontend Completo e Funcional** ✅  
**Pronto para integração com backend**

### **Próximos Passos:**
1. Seu parceiro implementa backend + API
2. Integração WhatsApp
3. Testes completos
4. Deploy em produção
5. Monitoramento e melhorias

---

**Desenvolvido por:** Equipe MacDavis  
**Data:** Dezembro 2025  
**Versão:** 1.0 - Frontend Completo  

🏍️ **MacDavis Motos** - Sua moto dos sonhos está aqui! 🧡

---

## ⚠️ Scroll travando — diagnóstico e correções

Este conteúdo descreve passos práticos para diagnosticar e corrigir travamentos de scroll em aplicações web — tanto em desktop quanto em mobile — e lista as causas comuns que temos encontrado no projeto.

---

## 1. Resumo rápido (uso imediato)
- **Reproduzir**: confirme o fluxo exato que trava o scroll (passos, URL, dispositivo, navegador).
- **Workaround temporário**: abrir DevTools e executar `document.body.style.overflow = 'auto'` ou remover classes que aplicam `overflow: hidden` ao `body`/`html`.
- **Coletar evidências**: console logs, screenshot/vídeo, trace de performance (DevTools > Performance).

---

## 2. Passo a passo para diagnosticar

1. Reproduza o problema e documente: navegador, versão, SO, dispositivo, hora, URL, usuário, commit/deploy.
2. Abra o console do DevTools (F12 / Ctrl+Shift+I) e verifique erros JS na aba `Console`.
3. Verifique elementos de overlay:
  - Na aba `Elements`, inspecione `body` e elementos que cobrem a página (modais, banners, menus). Procure `overflow: hidden`, `position: fixed` ou elementos com `height`/`width` 100% e `z-index` alto.
4. Teste rapidamente no console:
  - `document.body.style.overflow = ''` (ou `'auto'`) para ver se o scroll volta.
  - `document.querySelectorAll('*').forEach(e=>{ if(getComputedStyle(e).overflow==='hidden') console.log(e) })` — identificar elementos com overflow escondido.
5. Verifique listeners de toque/scroll:
  - Procure `addEventListener('touchmove', ...)` que chamam `preventDefault()` sem `passive: true`.
  - No Chrome, veja avisos sobre eventos não-passivos no console ao registrar listeners.
6. Registre um trace de performance (Performance tab):
  - Grave ~5–10s durante a reprodução. Procure long tasks (>50ms), layout/paint recorrente, e frames caindo.
7. Teste removendo scripts de terceiros (desabilitar extensões, DRM widgets ou anúncios) e veja se o problema some.
8. Teste em outro navegador / modo incógnito / dispositivo físico (para issues mobile específicas do Safari/Chrome Android).

---

## 3. Causas comuns (e por que travam o scroll)

- **`overflow: hidden` no `body`/`html`**: usado para bloquear scroll (modais, menus). Se aplicado erroneamente ou sem remoção, o scroll fica permanentemente desabilitado.
- **Overlays invisíveis / elemento cobrindo a página**: elementos com `position: fixed; top:0; left:0; width:100%; height:100%; z-index:9999` que capturam eventos de ponteiro.
- **Uso de `transform` em um ancestral do container scrollável**: quando um ancestor tem `transform` (ex: `transform: translateZ(0)`), o comportamento de `position: fixed` e alguns mecanismos de rolagem mudam, causando bloqueios ou perda de momentum.
- **`touchmove` + `preventDefault()` sem `passive: true`**: bloqueia o comportamento de scroll nativo e causa problemas em mobile (especialmente iOS/Android).
- **Listeners JS pesados / long tasks**: loops longos, `setInterval` intensivo, `synchronous XHR` ou tarefas que travam a main thread impedem o processamento de scroll.
- **Reflow/paint contínuo (layout thrashing)**: leituras/escritas repetidas nos estilos durante scroll (ex.: medir `offsetHeight` dentro de um loop) levam a frames perdidos.
- **Bibliotecas de virtual scroll mal configuradas**: contêineres que manipulam overflow interno e não atualizam corretamente.
- **Problemas com 100vh em mobile**: `height:100vh` pode ser menor/maior que a viewport real em navegadores móveis, produzindo comportamento estranho quando a barra de endereço aparece/desaparece.
- **`pointer-events` ou `touch-action` indevidos**: bloqueios de interação que impedem o scrolling por toque/gestos.
- **Scroll-snap ou CSS `overscroll-behavior` mal configurados**: podem prender o scroll em certas posições ou impedir o comportamento nativo.

---

## 4. Correções e snippets práticos

- Remoção temporária de bloqueio (console):

```js
// reativa scroll no body
document.body.style.overflow = 'auto';
// remove overflow escondido de todos os elementos
document.querySelectorAll('*').forEach(el => {
  if (getComputedStyle(el).overflow === 'hidden') el.style.overflow = '';
});
```

- Tornar listeners passivos (evitar bloquear o scroll):

```js
// ruim
window.addEventListener('touchmove', handler, { passive: false });
// melhor (se handler não chama preventDefault)
window.addEventListener('touchmove', handler, { passive: true });
```

- CSS para melhorar scroll mobile:

```css
html, body { height: 100%; }
.scrollable { -webkit-overflow-scrolling: touch; overflow: auto; }
/* evite usar height:100vh em elementos que devem rolar no mobile */
```

- Corrigir transform em ancestral:

```
/* Se um ancestral usa transform por performance, tente removê-lo ou aplicar hardware-accel de outra forma */
```

- Solução para modais que bloqueiam scroll: garantir que a classe que aplica `overflow: hidden` seja removida ao fechar o modal, ou usar um lock mais seguro (preservando posição):

```js
const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}`;
// ao fechar:
const y = document.body.style.top;
document.body.style.position = '';
document.body.style.top = '';
window.scrollTo(0, parseInt(y || '0') * -1);
```

---

## 5. Verificações após correção
- Reproduzir o fluxo original e verificar se o scroll está normal.
- Rodar trace de performance e comparar (menos long tasks, menos layout/paint). 
- Testar em múltiplos navegadores e em dispositivo móvel real (ou via remote debugging).

---

## 6. Escalonamento (quando envolver outro time)
- Colete e anexe: URL, passos exatos, vídeo/screenshot, console errors, performance trace (`.json` exportado do DevTools), commit hash/deploy id, dispositivo e versão do navegador.
- Se o problema ocorrer apenas após deploy recente, considerar rollback temporário enquanto investigamos.

---

## 7. Prevenção / checklist para code review
- Evitar `preventDefault` em `touchmove` sem necessidade.
- Usar `passive: true` quando o handler não precisa impedir o scroll.
- Evitar `overflow: hidden` em `body` sem controlar restauração.
- Não usar `transform` em elementos ancestrais dos containers scrolláveis sem testes.
- Medir perfomance ao adicionar scripts pesados; estabelecer budget (long tasks < 50ms típicos).

---

## 8. Anexos: checklist rápido para quem recebe o bug
1. Reproduzir e gravar vídeo.
2. Console aberto: anotar erros/warnings.
3. Executar snippet `document.body.style.overflow = 'auto'`.
4. Gravar Performance trace (DevTools) e anexar.
5. Testar com scripts de terceiros desativados.
6. Push informações no ticket/issue e marcar desenvolvedor responsável.

---

Se quiser, posso:
- adaptar esse guia para um checklist menor e imprimível;
- inserir o arquivo em uma pasta de docs (ex.: `DOCUMENTACAO_TECNICA/`);
- gerar um template de issue já preenchido para coleta de dados.

