# 🏍️ MacDavis Motos - Sistema de Gerenciamento
20260129

Sistema web completo para gestão de loja de motocicletas com interface cliente e painel administrativo.

## 📋 Sobre o Projeto

Sistema desenvolvido para gerenciar vendas e agendamentos de visitas em loja de motocicletas, com separação clara entre área pública (clientes) e área administrativa.

**Versão Atual:** 4.0.0  
**Data:** 29 de Janeiro de 2026  
**Último Backup:** Sistema automático ativo + backups manuais disponíveis

### 📱 Novidades Mobile (v3.9.0)
- ✅ **Modal de Backups**: Botão Backups abre modal fullscreen no mobile (desktop navega normalmente)
- ✅ **Filtros Otimizados**: Grid 3 colunas no admin mobile sem cortar barra de busca
- ✅ **Cards Responsivos**: Motos vendidas com largura mínima 350px, layout 2x2 nos botões
- ✅ **Página de Backups Mobile-Friendly**: Fontes reduzidas, scroll interno, overflow controlado
- ✅ **Touch Optimization**: Event listeners touchend + click, z-index alto, touch-action manipulation

### 🎨 Novidades (v3.8.0)
- ✅ **Cards de Vendas Redesenhados**: Layout moderno minimalista com estrutura limpa
- ✅ **Tipografia Aprimorada**: Labels 13px, valores 16px bold, placa em destaque laranja
- ✅ **Busca Integrada**: Caixa de busca ao lado dos filtros, busca em tempo real
- ✅ **Grid de Specs**: 4 colunas (ANO/CILINDRADA/COR/KM) com valores destacados
- ✅ **Botões Minimalistas**: Gradientes coloridos, hover suave, responsivo

### 🎨 Redesign Painel (v3.7.0)
- ✅ **Header Minimalista**: Identidade MacDavis profissional
- ✅ **Cards Estatísticos**: Design com gradientes laranja vibrantes e animações
- ✅ **Mobile 100% Funcional**: Filtros corrigidos, emojis otimizados, layout responsivo
- ✅ **UX Aprimorada**: Cores (#ff6600, #ff7800), tipografia aumentada, touch nativo

### 🐛 Correções Recentes (v3.6.1)
- ✅ **Bug de Cache de Imagens Resolvido**: Motocicletas sem foto não exibem mais a imagem anterior
- ✅ **Modal Otimizado**: Lógica de exibição de imagens completamente reescrita
- ✅ **Performance**: Elementos de imagem escondidos com `display: none` quando não aplicável

## ✨ Funcionalidades

### 👥 Área Cliente (Porta 3000)

- Catálogo de motocicletas **apenas disponíveis** (motos vendidas não aparecem)
- **Filtros inteligentes** por marca, categoria, estilo e status
- **Filtros por estilo visual**: Scooters, Streets, Esportiva, Custom, Trail
- **Ordenação automática** por categoria → cilindrada → ano
- **Categorização Trail inteligente**: Detecta modelos NC automaticamente
- Sistema de agendamento de visitas
- **🆕 Galeria de Fotos Navegável**:
  - Navegação entre múltiplas fotos com setas prev/next
  - Contador de posição (ex: "2 / 5")
  - Suporte a arrays de imagens por motocicleta
  - Controles intuitivos no modal de detalhes
- **Gerenciamento de Agendamentos pelo Cliente**:
  - Página "Meus Agendamentos" com busca por telefone
  - Confirmação de presença em agendamentos pendentes
  - Cancelamento de agendamentos com motivo obrigatório
  - Visualização de histórico completo (pendentes, confirmados, realizados, cancelados)
  - Visual diferenciado por status com gradientes coloridos
  - Notificação ao admin via Telegram em cancelamentos
  - **API compatível com mobile**: Caminhos relativos funcionam em qualquer dispositivo
  - **Scroll otimizado**: Funciona corretamente em dispositivos móveis
- **UX Melhorada**:
  - Botão de refresh reposicionado (topo-direito, compacto)
  - Campo de busca com texto branco visível
  - Badges de cilindrada removidos das imagens
  - Informação de cilindrada mantida na lista de detalhes
- Interface responsiva e moderna com modais aprimorados

### 🔧 Painel Administrativo (Porta 3001)

- **Painel de Vendas Redesenhado** 🎨:
  - **Cards de Vendas Minimalistas** (v3.8.0):
    - Layout limpo com header compacto (marca/modelo + placa laranja)
    - Grid de specs 4 colunas: ANO, CILINDRADA, COR, KM
    - Tipografia aprimorada: labels 13px, valores 16px bold
    - Placa em destaque: gradiente laranja, borda 2px, shadow
    - Badge "VENDIDA" verde discreta
    - Botões com gradientes coloridos e hover suave
    - Busca integrada ao lado dos filtros
    - Responsivo: 4→2 colunas no mobile
  - Header minimalista profissional com logo e branding MacDavis
  - Cards estatísticos com design moderno (gradientes laranja #ff6600, #ff7800)
  - 4 métricas principais: Total, Vendas no Ano, Mês Atual, Média por Mês
  - Animações suaves (cardFadeIn, hover effects, glow-pulse)
  - Layout responsivo: grid adaptativo (desktop 4 cols → tablet 2 cols → mobile 1 col)
  - Filtros inteligentes por marca e mês com contadores + busca em tempo real
  - **Mobile otimizado**: Selects nativos, emojis reduzidos, touch nativo
- **Sistema de Notificações Telegram** 📱:
  - Notificações automáticas de novos agendamentos
  - Alertas em tempo real no celular e computador
  - Integração com bot do Telegram (singleton pattern)
  - Configuração via arquivo .env
  - Suporte a múltiplos formatos de dados (português/inglês)
- **Sistema de Backup Completo** 💾:
  - Backups automáticos diários às 23:00
  - Backup manual via painel administrativo
  - Inclui: JSON files + pasta images/ + pasta DOCS Motos/
  - Retenção de 7 dias com rotação automática
  - Interface de restauração com preview
  - Metadados detalhados (tamanho, data, arquivos incluídos)
- **Sistema de Gestão de Administradores**:
  - Criação, edição e exclusão de perfis administradores
  - Gerenciamento de senhas e permissões
  - Interface dedicada no painel admin
  - Autenticação via API segura
  - Proteção contra exclusão do último admin
- **Identidade Visual Profissional**:
  - Logo MacDavis (PNG) em todas as páginas
  - Branding consistente no header
  - Painel de Status do Sistema com fundo laranja
  - Indicadores em tempo real (motos, integridade, API)
- **UI/UX Melhorada**:
  - Modais mobile com botão X centralizado e alinhado
  - Sistema de notificações otimizado (1 toast apenas)
  - Todos os modais iniciam ocultos (display:none)
  - Fechamento via X, click-outside e tecla ESC
- **CRUD completo** de motocicletas
- **Preservação de posição do scroll**: ao excluir motos, a lista mantém sua posição
- **Sistema de documentos PDF** para CRLV de cada motocicleta:
  - Upload de documentos PDF via campo de caminho
  - Visualização de PDFs direto no modal de detalhes
  - Armazenamento organizado em `DOCS Motos/[Nome da Moto]/`
  - Acesso seguro apenas via portal administrativo
- **Gestão de agendamentos** com auto-refresh (10s)
- **Sistema de vendas completo**:
  - Marcar motos como vendidas com formulário detalhado
  - **Detecção automática de Mottu**: contratos simplificados
  - **Contratos diferenciados por marca**:
    - **Mottu**: Contrato de retirada (1 página, sem valores, sem endereço)
    - **Outras marcas**: Contrato de venda completo com cláusulas e pagamento
  - Formulário inteligente que oculta campos de pagamento/endereço para Mottu
  - Captura de dados do comprador com autoformatação (CPF e RG)
  - Suporte a RG antigo (9 dígitos) e novo RG/CPF (11 dígitos)
  - Visualização de motos vendidas organizada por mês/ano
  - **Filtro por mês/ano** para acessar vendas de períodos específicos
  - Contador de vendas por período
  - Opções de teste: reverter venda ou excluir registro
  - Geração automática de PDFs de contrato
- **Campo de placa** para cada motocicleta
- **Contadores em tempo real** (total, disponíveis, vendidas, agendamentos)
- **Filtros combinados** (estilo, status, marca, cilindrada)
- **Categorização inteligente**:
  - Scooters (categoria 1)
  - Streets (categoria 2) - Motos < 500cc
  - Esportiva (categoria 3) - Motos ≥ 500cc (exceto Trail/Custom)
  - Custom (categoria 4)
  - Trail (categoria 5) - Adventure/enduro (incluindo NC 750X)
- **Ordenação inteligente** automática
- **Layout responsivo** com cards horizontais
- Tema dark moderno com glass effects
- **Compatível com Safari/iOS**

## 🔥 Firewall Auto-Fix

Sistema automático de manutenção de regras de firewall para acesso mobile.

### Características
- **Execução Automática**: Tarefa agendada roda ao iniciar o Windows
- **Privilégios Elevados**: Executa como SYSTEM com nível mais alto
- **Monitoramento**: Verifica portas 3000 (cliente) e 3001 (admin)
- **Log Detalhado**: firewall-auto-fix.log com timestamps
- **Instalação Fácil**: INSTALAR-AUTOFIX.bat para configuração rápida

### Instalação
```bash
# Execute como Administrador
.\fix-firewall\INSTALAR-AUTOFIX.bat
```

### Verificação
```powershell
# Ver log de execução
Get-Content .\fix-firewall\firewall-auto-fix.log -Tail 10
```

## 🚀 Tecnologias

- **Backend:** Node.js v22.20.0 + Express.js
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Armazenamento:** JSON (motorcycles.json, data.json, admin_users.json)
- **Autenticação:** API REST com validação de credenciais
- **Documentos:** PDF servidos via Express static middleware
- **Assets:** PNG para logo e branding
- **Estilo:** CSS moderno com gradientes e animações
- **Automação:** PowerShell + Windows Task Scheduler

## 📦 Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre no diretório
cd TCC-teste

# Instale as dependências
npm install

# Inicie o servidor cliente (Porta 3000)
npm run client

# Em outro terminal, inicie o servidor admin (Porta 3001)
npm run admin
```

## 🌐 Acesso

**Cliente:** <http://localhost:3000>  
**Admin:** <http://localhost:3001/admin-login.html>

**Credenciais Admin:**

- Usuário: `admin`
- Senha: `MacDavis@2025`

> **Nota:** Novos administradores podem ser criados através do painel de Gestão de Administradores.

## 📁 Estrutura do Projeto

```plaintext
TCC-teste/
├── server-client.js          # Servidor público (porta 3000)
├── server-admin.js           # Servidor admin (porta 3001) + API admin-users
├── package.json              # Dependências
├── motorcycles.json          # Base de dados de motos
├── data.json                 # Base de dados de agendamentos
├── admin_users.json          # Base de dados de administradores
│
├── PNG MD.png                # Logo MacDavis
│
├── DOCS Motos/               # Documentos PDF das motocicletas
│   └── [Nome da Moto]/       # Subpastas por motocicleta
│       └── CRLV.pdf          # Documento CRLV
│
├── CLIENTE/
│   ├── index.html            # Landing page
│   ├── login.html            # Login cliente
│   ├── catalog.html          # Catálogo
│   ├── catalog.js            # Lógica do catálogo
│   ├── catalog-styles-dark-modern.css  # Estilos do catálogo
│   ├── agendamento.html      # Agendamento de visitas
│   └── CSS.css               # Estilos cliente
│
├── ADMIN/
│   ├── admin.html            # Dashboard admin
│   ├── admin.js              # Lógica admin
│   ├── admin-users.js        # Lógica de gestão de administradores
│   ├── admin-login.html      # Login admin
│   └── admin-styles-dark-modern.css  # Tema dark
│
└── DOCUMENTACAO_COMPLETA.md  # Documentação técnica completa
```

## 🔄 Fluxo de Uso

1. Cliente acessa o catálogo e escolhe uma moto
2. Cliente agenda visita com data e horário
3. Agendamento aparece automaticamente no painel admin (auto-refresh 10s)
4. Admin marca agendamento como realizado após visita
5. Admin marca moto como vendida
6. Moto desaparece do catálogo cliente automaticamente

## 🎨 Features v2.2

### ✨ Organização Inteligente (Nova!)

- **Ordenação automática** por critérios:
  1. Categoria/Estilo (Scooter → Street → Alta Cilindrada → Custom)
  2. Cilindrada (menor para maior)
  3. Ano (mais antigo para mais novo)

### 🎯 Filtros por Estilo (Nova!)

- Filtros visuais no catálogo cliente
- Dropdown no painel admin
- Funciona combinado com todos os outros filtros
- Busca inteligente que respeita filtros ativos

### 🚀 Performance

- Código otimizado
- Filtros combinados funcionam perfeitamente
- Auto-refresh eficiente no admin

- ✅ **Auto-refresh automático** dos agendamentos (10 segundos)
- ✅ **Layout horizontal responsivo** (3 cards por linha)
- ✅ **Headers anti-cache** para sempre carregar versão atualizada
- ✅ **Logs coloridos** no console do navegador
- ✅ **Indicador visual** no título durante atualização
- ✅ **Cards compactos** com design otimizado

## 📊 API Endpoints

### Cliente (3000)

```http
GET  /api/motorcycles     # Listar motos disponíveis
POST /api/appointments    # Criar agendamento
```

### Admin (3001)

```http
GET    /api/motorcycles       # Listar todas
POST   /api/motorcycles       # Criar nova
PUT    /api/motorcycles/:id   # Atualizar/marcar como vendida
DELETE /api/motorcycles/:id   # Deletar

GET    /api/appointments      # Listar todos
PUT    /api/appointments/:id  # Marcar como realizado
DELETE /api/appointments/:id  # Deletar

# Gestão de Administradores
GET    /api/admin-users       # Listar admins (sem senhas)
POST   /api/admin-users/login # Autenticar admin
POST   /api/admin-users       # Criar novo admin
PUT    /api/admin-users/:id   # Atualizar admin
DELETE /api/admin-users/:id   # Deletar admin

# Rota de documentos (ADMIN APENAS)
GET    /docs/*                # Servir PDFs da pasta DOCS Motos
```

## 🛠️ Manutenção

### Backup

### 🛠️ Backups Automáticos

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "Backup_Completo_${timestamp}"
robocopy . $backupName /E /XD node_modules Backup_* .git /XF *.log /NFL /NDL /NJH /NJS
```

**Último Backup Criado:** 04/01/2026 17:30 - `Backup_Completo_20260104_173025`

### 🧹 Limpar Cache

Abra o DevTools (F12) → Clique direito no botão refresh → "Esvaziar cache e recarregar forçadamente"

**Cache Atual:** admin.js?v=crlv20251222, admin-users.js?v=20260104

## 🐛 Correções Recentes

### 🆕 v3.1.1 (16/01/2026)
- ✅ **UX Aprimorada - Preservação de Scroll**:
  - Sistema salva automaticamente a posição do scroll ao excluir motocicletas
  - Restauração instantânea após recarregar lista
  - Implementado em `admin.js` (funções `confirmDeleteMoto` e `loadMotos`)
  - Elimina necessidade de scrollar novamente após exclusões

### 🆕 v3.1.0 (16/01/2026)
- ✅ **Sistema Inteligente de Contratos por Marca**:
  - Detecção automática de motos Mottu
  - Modal simplificado para Mottu (sem campos de pagamento/endereço)
  - Geração de contrato de retirada para Mottu (1 página)
  - Contrato completo de venda para outras marcas (múltiplas páginas com cláusulas)
- ✅ **Formulário de Contrato Otimizado**:
  - Campos RG/CPF com autoformatação inteligente
  - Suporte a RG antigo (9 dígitos) e novo RG/CPF (11 dígitos)
  - Validação dinâmica: remove `required` de campos ocultos
  - Badge visual "🏍️ MOTTU" no modal quando detectado
- ✅ **Fluxo de Vendas Aprimorado**:
  - Criar Mottu como vendida → Modal simplificado automático
  - Marcar Mottu existente como vendida → Salva e abre modal correto
  - Outras marcas → Fluxo completo com modal de venda
- ✅ Endpoints separados: `/api/generate-contract` e `/api/generate-mottu-contract`
- ✅ Funções `formatCPF()` e `formatRG()` no frontend
- ✅ Correção de bug: campos `required` ocultos bloqueavam submit

### 🆕 v3.0.0 (04/01/2026)
- ✅ **Sistema de Gestão de Administradores** implementado
- ✅ CRUD completo de usuários admin via painel
- ✅ Autenticação via API REST (`/api/admin-users/login`)
- ✅ Validação de senha mínima (6 caracteres)
- ✅ Proteção contra exclusão do último admin
- ✅ Interface dedicada com modal para criação/edição
- ✅ **Identidade Visual Profissional**:
  - Logo MacDavis (PNG) adicionado em todas as páginas
  - Header com branding consistente
  - Favicon atualizado
  - Painel "Status do Sistema" com fundo laranja sólido
  - Indicadores em tempo real de motos e status da API
- ✅ Arquitetura dual-server corrigida (rotas admin no server-admin.js)
- ✅ Base de dados `admin_users.json` criada
- ✅ Senha padrão atualizada para `MacDavis@2025`

### 🆕 v2.5.0 (22/12/2025)
- ✅ **Sistema de documentos PDF** implementado
- ✅ Campo documentoPDF adicionado ao cadastro de motocicletas
- ✅ Visualização de PDFs direto no modal administrativo
- ✅ Rota `/docs` configurada no servidor admin (porta 3001)
- ✅ Catálogo cliente agora **filtra motos vendidas** automaticamente
- ✅ Segurança: documentos acessíveis apenas via portal admin
- ✅ Suporte a subpastas em `DOCS Motos/[Nome da Moto]/`

### ⚡ v2.4.1 (18/12/2025)

### ⚡ Performance
- ✅ Removidas todas as animações pesadas (backgroundShimmer, backgroundPulse, float)
- ✅ Modal de vendas otimizado: 100vh × 100vw fullscreen
- ✅ Filtro por mês com exibição otimizada (apenas mês atual visível)
- ✅ Redução de 80% no uso de GPU

### 🐞 Bugs Corrigidos
- ✅ Timezone: datas não subtraem mais 1 dia (conversão UTC → Local corrigida)
- ✅ Campo COR alterado para vermelho (#f44336) ao invés de rosa
- ✅ Prefixo `-webkit-backdrop-filter` adicionado em todos os CSS (compatibilidade Safari/iOS)
- ✅ Duplicação de condicionais removida (linha 1414-1415)

### 🎨 Melhorias Visuais
- ✅ Contraste melhorado: backgrounds #2a2a2a, cards #3a3a3a
- ✅ Fontes maiores e mais legíveis (título 26px, specs 22px)
- ✅ Placa destacada (18px, negrito)
- ✅ Espaçamento otimizado no modal fullscreen

## 📝 Licença

Projeto acadêmico - TCC

## 👨‍💻 Autor

Victor Abreu - MacDavis Motos

---

**Documentação Completa:** Consulte `DOCUMENTACAO_COMPLETA.md` para detalhes técnicos aprofundados.

# Sistema-MacDavis-parcialmente-pronto---
# Se-conseguir-consertar-o-scroll-o-sistema-t-pronto-desculpa-eu-tentei-muito-
