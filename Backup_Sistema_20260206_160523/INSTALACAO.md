# 🚀 Guia de Instalação - MacDavis Motos
20260129

## 📋 Pré-requisitos

- **Node.js** versão 22.20.0 ou superior ([Download aqui](https://nodejs.org/))
- **Git** instalado ([Download aqui](https://git-scm.com/))

## 🔧 Instalação Passo a Passo

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/SlaveToTheGrind/pega-ae-jack-3.git
cd pega-ae-jack-3
```

### 2️⃣ Instale as Dependências

```bash
npm install
```

### 3️⃣ Inicie os Servidores

**Opção A - Dois terminais separados (RECOMENDADO):**

Terminal 1 - Servidor Cliente:
```bash
node server-client.js
```

Terminal 2 - Servidor Admin:
```bash
node server-admin.js
```

**Opção B - Um terminal com PowerShell (Windows):**
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server-client.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node server-admin.js"
```

### 4️⃣ Acesse o Sistema

- **Interface Cliente:** http://localhost:3000
  - Catálogo público de motos
  - Sistema de agendamento
  
- **Painel Admin:** http://localhost:3001/admin-login.html
  - Login: `admin`
  - Senha: `admin123`
  - Gestão completa de motos e agendamentos

## 📂 Estrutura do Projeto

```
📁 Projeto
├── 🌐 FRONTEND
│   ├── index.html          → Página inicial
│   ├── catalog.html        → Catálogo de motos
│   ├── agendamento.html    → Agendamentos (cliente)
│   └── admin.html          → Painel administrativo
│
├── ⚙️ BACKEND
│   ├── server-client.js    → Servidor porta 3000 (público)
│   ├── server-admin.js     → Servidor porta 3001 (admin)
│   ├── motorcycles.json    → Banco de dados de motos
│   └── data.json           → Banco de agendamentos
│
└── 🎨 ASSETS
    ├── images/             → Fotos das motos
    └── Fotos motos/        → Backup das fotos
```

## 🔥 Funcionalidades

### Cliente (Porta 3000)
✅ Catálogo de motos com filtros  
✅ Sistema de agendamento de visitas  
✅ Visualização detalhada de cada moto  
✅ Design responsivo laranja/branco/preto  

### Admin (Porta 3001)
✅ CRUD completo de motocicletas  
✅ Upload e gerenciamento de imagens  
✅ Gestão de agendamentos  
✅ Marcar motos como vendidas  
✅ Auto-refresh em tempo real  
✅ Dark mode com efeitos glass  

## 🐛 Solução de Problemas

**Erro "Porta já em uso":**
```bash
# Windows - Encontrar e matar processo na porta
netstat -ano | findstr :3000
taskkill /PID [número_do_processo] /F
```

**Erro "Cannot find module":**
```bash
# Reinstale as dependências
rm -rf node_modules package-lock.json
npm install
```

**Imagens não aparecem:**
- Verifique se a pasta `images/` existe
- Certifique-se de que os caminhos em `motorcycles.json` estão corretos

## 📝 Dados de Teste

O sistema já vem com:
- **19 motocicletas** cadastradas
- **29 agendamentos** de exemplo
- **Imagens** de demonstração

## 🔒 Segurança

⚠️ **IMPORTANTE para produção:**
- Altere as credenciais de admin
- Configure HTTPS
- Use variáveis de ambiente para senhas
- Implemente JWT ou sessões seguras

## 📞 Suporte

Problemas ou dúvidas? Abra uma [issue no GitHub](https://github.com/SlaveToTheGrind/pega-ae-jack-2/issues)

---

**Sistema:** MacDavis Motos  
**Versão do Sistema:** 3.6.1  
**Versão do Guia:** 2.3  
**Data:** 25 de Janeiro de 2026

