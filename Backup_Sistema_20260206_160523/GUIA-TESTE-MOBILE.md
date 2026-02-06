# 📱 GUIA DE TESTE MOBILE - MacDavis Motos
20260129

## 🌐 Servidor Ativo

✅ **Servidor rodando em:** http://localhost:3000

---

## 📋 PÁGINAS PARA TESTAR

### 1️⃣ Catálogo (Página Principal)
**URL:** http://localhost:3000/catalog.html

**Testar:**
- [ ] Cards de motos aparecem corretamente
- [ ] Filtros funcionam em mobile
- [ ] Modal de detalhes abre fullscreen
- [ ] Botão "Agendar Visita" é clicável (mínimo 48px)
- [ ] Galeria de fotos funciona
- [ ] Bottom navigation aparece
- [ ] Scroll suave

---

### 2️⃣ Login do Cliente
**URL:** http://localhost:3000/login.html

**Testar:**
- [ ] Inputs têm tamanho adequado (48px altura)
- [ ] Teclado não dá zoom no iOS (font-size 16px)
- [ ] Botão de login é touch-friendly
- [ ] Layout não quebra em portrait

---

### 3️⃣ Agendamento
**URL:** http://localhost:3000/agendamento.html

**Testar:**
- [ ] Formulário é usável
- [ ] Calendário funciona em touch
- [ ] Campos de seleção são grandes o suficiente
- [ ] Botão de confirmar é clicável

---

### 4️⃣ Admin Login
**URL:** http://localhost:3000/admin-login.html

**Testar:**
- [ ] Layout mobile funcional
- [ ] Inputs adequados
- [ ] Sem zoom indesejado

---

### 5️⃣ Painel Admin (Requer Login)
**URL:** http://localhost:3000/admin.html

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `123`

**Testar:**
- [ ] Menu hamburger aparece e funciona
- [ ] Sidebar slide-in funciona
- [ ] Cards de estatísticas são legíveis
- [ ] Tabela de motos é responsiva
- [ ] Modais de edição funcionam
- [ ] Botões de ação são touch-friendly
- [ ] Formulários são usáveis

---

## 🛠️ COMO TESTAR NO NAVEGADOR

### Google Chrome / Edge:

1. Pressione **F12** para abrir DevTools
2. Clique no ícone de **dispositivo móvel** (ou pressione Ctrl+Shift+M)
3. Selecione um dispositivo:
   - **iPhone 12 Pro** (390x844)
   - **iPhone SE** (375x667) - tela pequena
   - **Samsung Galaxy S20** (360x800)
   - **Pixel 5** (393x851)
4. Teste em **Portrait** e **Landscape**
5. Use o **Touch Mode** (ícone de cursor/dedo)

### Firefox:

1. Pressione **F12**
2. Clique em **Responsive Design Mode** (Ctrl+Shift+M)
3. Selecione dimensões ou dispositivos
4. Teste touch events

---

## 🎯 CHECKLIST DE PROBLEMAS COMUNS

### ❌ O QUE PROCURAR:

- [ ] **Texto muito pequeno** (< 14px)
- [ ] **Botões pequenos** (< 48x48px)
- [ ] **Elementos sobrepostos** (z-index problems)
- [ ] **Scroll horizontal** (overflow)
- [ ] **Modais que não cabem** na tela
- [ ] **Menu que não abre** ou não fecha
- [ ] **Cards cortados** ou mal formatados
- [ ] **Imagens distorcidas**
- [ ] **Inputs que dão zoom** no iOS
- [ ] **Navbar fixa cobrindo conteúdo**
- [ ] **Bottom nav cobrindo elementos**
- [ ] **Hover effects** que não funcionam em touch

---

## 📸 RESOLUÇÕES CRÍTICAS

| Dispositivo | Largura | Altura | Prioridade |
|-------------|---------|--------|------------|
| iPhone SE   | 375px   | 667px  | 🔴 Alta    |
| iPhone 12   | 390px   | 844px  | 🟡 Média   |
| Galaxy S20  | 360px   | 800px  | 🔴 Alta    |
| iPad Mini   | 768px   | 1024px | 🟢 Baixa   |

**Foco:** 360px - 414px (90% dos celulares)

---

## 🚨 PROBLEMAS CONHECIDOS A VERIFICAR

### Catálogo:
- Modal de detalhes pode não abrir fullscreen
- Filtros podem estar pequenos
- Cards podem estar desalinhados

### Admin:
- Menu hamburger pode não aparecer
- Sidebar pode não fazer slide-in
- Tabelas podem ter scroll horizontal
- Modais de edição podem sair da tela

---

## ✅ APÓS TESTAR

1. **Anote** todos os problemas encontrados
2. **Screenshot** de bugs visuais
3. **Liste** páginas/componentes quebrados
4. **Priorize** o que precisa correção urgente

Depois conversamos sobre as otimizações necessárias! 🚀

