# 🏍️ MacDavis Motos - Sistema Completo
## Frontend Pronto para Integração Backend

---

## 📦 **O que tem nesta pasta**

Este é o **frontend completo e funcional** do sistema MacDavis Motos, pronto para você integrar com o backend.

### **Funcionalidades Implementadas:**
✅ Catálogo de motocicletas com filtros avançados  
✅ Painel administrativo completo (CRUD)  
✅ Sistema de agendamentos  
✅ Upload de documentos (CRLVs em PDF)  
✅ Loading screens animados com moto laranja  
✅ Design moderno com tema dark  
✅ Responsivo para mobile  
✅ Autenticação frontend (pronta para JWT)  

---

## 🚀 **Como Rodar na Sua Máquina**

### **1. Pré-requisitos**
Certifique-se de ter instalado:
- **Node.js** (versão 14 ou superior)
  - Download: https://nodejs.org/
  - Verificar: `node --version`
- **npm** (vem com Node.js)
  - Verificar: `npm --version`

---

### **2. Instalação**

#### **Passo 1: Abrir pasta no terminal**
```bash
cd "Pega ae Jack 4"
```

#### **Passo 2: Instalar dependências**
```bash
npm install
```

Isso vai instalar o Express e outras dependências necessárias.

---

### **3. Iniciar os Servidores**

O sistema usa **2 servidores** separados:

#### **Terminal 1 - Servidor Cliente (Catálogo)**
```bash
node server-client.js
```
- Porta: **3000**
- Acesso: http://localhost:3000

#### **Terminal 2 - Servidor Admin (Painel)**
```bash
node server-admin.js
```
- Porta: **3001**
- Acesso: http://localhost:3001/admin-login.html

---

### **4. Acessar o Sistema**

#### **Catálogo Público** 📱
```
http://localhost:3000
```
- Login inicial: qualquer nome
- Visualizar motos disponíveis
- Filtrar por marca, estilo, cilindrada
- Fazer agendamentos

#### **Painel Administrativo** 🔒
```
http://localhost:3001/admin-login.html
```

**Credenciais de acesso:**
- **Usuário:** `admin` | **Senha:** `MacDavis@2025`
- **Usuário:** `administrador` | **Senha:** `Admin@MacDavis`
- **Usuário:** `root` | **Senha:** `Root@MacDavis2025`

**Funcionalidades Admin:**
- Adicionar/editar/excluir motocicletas
- Marcar como vendido
- Ver histórico de vendas
- Upload de CRLVs (PDF)
- Estatísticas em tempo real

---

## 📂 **Estrutura do Projeto**

```
Pega ae Jack 4/
│
├── README.md                          ← Você está aqui
├── DOCUMENTACAO_TECNICA_INTEGRACAO.md ← Guia para backend
├── package.json                       ← Dependências
│
├── server-client.js                   ← Servidor catálogo (porta 3000)
├── server-admin.js                    ← Servidor admin (porta 3001)
│
├── catalog.html                       ← Página catálogo
├── catalog.js                         ← Lógica catálogo
├── catalog-styles-dark-modern.css     ← Estilos catálogo
│
├── admin.html                         ← Painel administrativo
├── admin.js                           ← Lógica admin
├── admin-final-funcional.js           ← CRUD motos
├── admin-styles-dark-modern.css       ← Estilos admin
│
├── login.html                         ← Login cliente
├── admin-login.html                   ← Login admin
│
├── agendamento.html                   ← Página agendamentos
├── agendamento.js                     ← Lógica agendamentos
│
├── motorcycles.json                   ← Dados atuais (MIGRAR PARA BD)
├── data/
│   └── appointments.json              ← Agendamentos (MIGRAR PARA BD)
│
├── Fotos motos/                       ← Imagens motos
├── DOCS Motos/                        ← PDFs CRLVs
│
└── CSS.css                            ← Estilos globais
```

---

## 🔧 **Próximos Passos - Backend**

### **O que você precisa implementar:**

#### **1. Banco de Dados**
Escolha entre:
- **PostgreSQL** (recomendado para dados estruturados)
- **MongoDB** (flexível para NoSQL)

Ver schemas completos em: [DOCUMENTACAO_TECNICA_INTEGRACAO.md](DOCUMENTACAO_TECNICA_INTEGRACAO.md)

#### **2. API REST**
Criar endpoints para:
```
GET    /api/motorcycles          → Listar motos
POST   /api/motorcycles          → Criar moto
PUT    /api/motorcycles/:id      → Editar moto
DELETE /api/motorcycles/:id      → Excluir moto

POST   /api/appointments         → Criar agendamento
GET    /api/appointments         → Listar agendamentos

POST   /api/upload/image         → Upload imagens
POST   /api/upload/document      → Upload PDFs

POST   /api/auth/login           → Login JWT
POST   /api/auth/logout          → Logout
GET    /api/auth/verify          → Verificar token
```

#### **3. Autenticação JWT**
- Implementar login com JWT
- Middleware de proteção para rotas admin
- Hash de senhas com bcrypt

#### **4. Integração WhatsApp**
- API WhatsApp Business (Twilio ou Baileys)
- Notificação automática ao criar agendamento
- Templates prontos na documentação

#### **5. Upload de Arquivos**
- Multer para Node.js
- Validação de tipos (imagens: jpg/png, docs: pdf)
- Armazenamento local ou cloud (AWS S3, Cloudinary)

---

## 📚 **Documentação Completa**

Leia o arquivo [DOCUMENTACAO_TECNICA_INTEGRACAO.md](DOCUMENTACAO_TECNICA_INTEGRACAO.md) para:
- 🏗️ Arquitetura detalhada
- 🔌 Especificação completa de APIs
- 🗄️ Schemas de banco de dados (PostgreSQL + MongoDB)
- 💬 Templates WhatsApp prontos
- 🔐 Sistema de autenticação
- 🚀 Configuração de deploy
- ✅ Checklist de integração

---

## 🎨 **Design System**

### **Cores MacDavis**
```css
--orange-primary: #ff6600;   /* Cor principal */
--orange-light: #ff8533;     /* Hover */
--orange-dark: #cc5200;      /* Ativo */
--bg-primary: #0d0d0d;       /* Fundo escuro */
```

### **Animações**
- Loading com moto animada (SVG customizado)
- Transições de página suaves
- Dropdowns com efeito cascata
- Hover com glow laranja

---

## 🐛 **Troubleshooting**

### **Porta já em uso**
```
Error: listen EADDRINUSE :::3000
```
**Solução:** Feche o processo usando a porta ou mude em `server-client.js` e `server-admin.js`

### **node_modules não encontrado**
```
Error: Cannot find module 'express'
```
**Solução:** Execute `npm install` novamente

### **Imagens não carregam**
**Solução:** Verifique se as pastas `Fotos motos/` e `DOCS Motos/` existem

### **Erro ao salvar JSON**
```
ENOENT: no such file or directory
```
**Solução:** Crie a pasta `data/` manualmente: `mkdir data`

---

## 📞 **Contato**

Se tiver dúvidas sobre o frontend, consulte:
- [DOCUMENTACAO_TECNICA_INTEGRACAO.md](DOCUMENTACAO_TECNICA_INTEGRACAO.md)
- Código comentado nos arquivos principais
- Console do navegador (F12) para debug

---

## ✨ **Status do Projeto**

| Componente | Status | Notas |
|------------|--------|-------|
| Frontend | ✅ Completo | UI/UX finalizado |
| Design | ✅ Completo | MacDavis branding |
| Animações | ✅ Completo | Loading + transições |
| Mobile | ✅ Completo | Responsivo |
| Backend | ⏳ Pendente | Sua parte! |
| BD | ⏳ Pendente | PostgreSQL ou MongoDB |
| WhatsApp | ⏳ Pendente | API Business |
| Deploy | ⏳ Pendente | Após backend |

---

## 🎯 **Objetivo Final**

Quando você terminar o backend, teremos:

✅ Sistema completo de gerenciamento  
✅ Catálogo online profissional  
✅ Painel administrativo funcional  
✅ Notificações WhatsApp automáticas  
✅ Upload de documentos  
✅ Autenticação segura  
✅ Pronto para produção  

---

**Desenvolvido com 🧡 por MacDavis Motos**  
**Versão:** 1.0 - Frontend Completo  
**Data:** Dezembro 2025
