# 📸 Guia de Galeria de Fotos - Sistema MacDavis Motos
20260129

## ✨ Melhorias Implementadas

### 1. **Aumento do Tamanho e Qualidade das Imagens nos Cards**
- **Catálogo Cliente**: Altura aumentada de 240px para **300px**
- **Painel Admin**: Altura aumentada de 220px para **280px**
- **Qualidade**: Usa `object-fit: cover` com `object-position: center` para preencher todo o espaço
- **Fundo**: Adicionado fundo escuro (#1a1a1a) para destacar melhor as imagens
- **Visual**: Imagens preenchem 100% do card de borda a borda

### 2. **Galeria de Fotos nos Detalhes da Motocicleta**
- ✅ Navegação entre múltiplas fotos com botões **◄** e **►**
- ✅ Contador de fotos (ex: "1 / 4")
- ✅ Funciona tanto no **catálogo do cliente** quanto no **painel administrativo**
- ✅ Suporte a navegação por teclado (setas)
- ✅ Botões desabilitados nos extremos
- ✅ Animações suaves entre transições

### 3. **Painel Lateral Inteligente no Catálogo**
- ✅ **Oculto por padrão** - só aparece quando uma moto é selecionada
- ✅ **Desliza da esquerda** com animação suave (0.4s cubic-bezier)
- ✅ **Tamanho maior**: 360px de largura, 240px de altura para imagem
- ✅ **Botão de fechar** (X) com rotação no hover
- ✅ **Navegação de fotos integrada** - transita entre múltiplas imagens
- ✅ **Interface limpa** - não polui a tela inicial

### 4. **Campos de Imagens Adicionais no Admin**
- ✅ **4 campos de imagem** no formulário de edição/criação
- ✅ Campo principal + 3 campos opcionais adicionais
- ✅ Processamento automático de caminhos Windows
- ✅ Suporte a caminhos completos ou relativos
- ✅ Auto-preenchimento ao editar moto existente

### 5. **Preview Visual na Tela de Agendamento**
- ✅ **Card de preview da moto** com imagem grande
- ✅ Aparece automaticamente ao selecionar moto
- ✅ Mostra: Imagem, nome, ano, cor e quilometragem
- ✅ **Confirmação visual** após agendamento com foto
- ✅ Layout responsivo (lado a lado ou empilhado)

---

## 📁 Como Adicionar Múltiplas Fotos para uma Motocicleta

### Método 1: Script Automático (Recomendado)

**Passo 1: Organizar as Fotos**
1. Acesse a pasta: `Fotos motos/`
2. Crie uma pasta com o nome da motocicleta (ex: `CB 300R 2012`)
3. Adicione todas as fotos da moto nesta pasta:
   - `Foto 1.jpg` (será a foto principal)
   - `Foto 2.jpg`
   - `Foto 3.jpg`
   - `Foto 4.jpg`
   - etc.

**Passo 2: Executar o Script de Mapeamento**
```bash
node scan_all_photos.js
```

Este script irá:
- 🔍 Escanear todas as pastas em "Fotos motos"
- 📋 Mapear automaticamente as fotos para as motos correspondentes
- 📂 Copiar as imagens para `images/[nome-da-pasta]/`
- 💾 Atualizar o arquivo `motorcycles.json` com os caminhos das imagens
- 🔄 Criar backup automático antes de salvar

**Passo 3: Reiniciar os Servidores**
```bash
# Terminal 1 - Cliente
npm run client

# Terminal 2 - Admin
npm run admin
```

### Método 2: Manual via Painel Admin

**Passo 1: Preparar as Imagens**
1. Coloque as fotos em `images/[pasta-da-moto]/`
2. Anote os caminhos completos ou relativos

**Passo 2: Adicionar/Editar Moto**
1. Acesse o painel admin (localhost:3001)
2. Clique em "Editar" ou "Nova Moto"
3. Preencha os 4 campos de imagem:
   - **Imagem Principal**: `images/CB300R/foto1.jpg`
   - **Imagem Adicional 2**: `images/CB300R/foto2.jpg`
   - **Imagem Adicional 3**: `images/CB300R/foto3.jpg`
   - **Imagem Adicional 4**: `images/CB300R/foto4.jpg`
4. Salve

**Aceita:**
- Caminhos relativos: `images/Bandit/foto.jpg`
- Caminhos completos: `C:\Users\...\Fotos motos\Bandit\foto.jpg`
- Nome do arquivo: `foto.jpg` (adiciona `images/` automaticamente)

---

## 🎮 Como Usar a Galeria

### No Catálogo do Cliente (localhost:3000)
1. **Selecionar Moto**: Clique em "Ver Detalhes" em qualquer card
2. **Painel Aparece**: Desliza da esquerda com animação
3. **Navegar Fotos**: Use botões **◄** e **►** ou setas do teclado
4. **Ver Contador**: Mostra posição atual (ex: "2 / 4")
5. **Fechar**: Clique no **X** vermelho ou fora do catálogo

### No Painel Administrativo (localhost:3001)
1. Clique no ícone 👁️ "Ver" em qualquer motocicleta
2. O modal será exibido com a primeira foto
3. Se houver múltiplas fotos:
   - Use os botões **◄** e **►** para navegar
   - Veja o contador de fotos no canto inferior

### Na Tela de Agendamento
1. **Preview Automático**: Aparece ao selecionar/pré-selecionar moto
2. **Visualização Grande**: Card com imagem 280px + detalhes
3. **Confirmação**: Após agendar, mostra a moto novamente
4. **Troca Dinâmica**: Muda automaticamente ao selecionar outra moto

---

## 🔧 Estrutura Técnica

### Formato no JSON
```json
{
  "id": "moto-21",
  "name": "NC 750X",
  "image": "images/NC 750X 2015/Foto 1.jpg",
  "images": [
    "images/NC 750X 2015/Foto 1.jpg",
    "images/NC 750X 2015/Foto 2.jpg",
    "images/NC 750X 2015/Foto 3.jpg"
  ],
  "thumb": "images/NC 750X 2015/Foto 1.jpg"
}
```

### Lógica da Galeria
- Se `images` array tem mais de 1 foto → mostra controles de navegação
- Se `images` array tem 1 foto ou está vazio → usa apenas `image` principal
- Primeira foto do array é sempre a imagem principal
- Navegação bloqueada nos extremos (botões desabilitados)

### Arquivos Modificados
- `catalog.html` - Painel lateral com galeria
- `catalog-styles-dark-modern.css` - Estilos da galeria
- `admin.html` - Campos adicionais de imagem
- `admin.js` - Processamento de múltiplas imagens
- `admin-styles-dark-modern.css` - Estilos da galeria admin
- `agendamento.html` - Preview da moto
- `scan_all_photos.js` - Script de mapeamento automático

---

## 📊 Estatísticas da Última Execução

```
✅ Motos atualizadas: 17
📷 Total de fotos adicionadas: 35
📈 Média de fotos por moto: 2.1
```

---

## 🎨 Estilos Customizados

### Botões de Navegação
- Fundo escuro semi-transparente `rgba(0,0,0,0.7)`
- Hover laranja (`--orange-primary`)
- Posicionados nos cantos laterais
- Responsivos para telas menores
- Padding: 1rem, Font-size: 1.5rem

### Contador de Fotos
- Fundo escuro `rgba(0,0,0,0.8)`
- Posicionado na parte inferior central
- Texto branco com fonte legível (0.9rem)

### Imagens
- `object-fit: cover` - preenche todo o espaço
- `object-position: center` - centraliza o corte
- Fundo escuro (#1a1a1a) para contraste
- Transições suaves (0.3s - 0.4s)

### Painel Lateral
- Transform: `translateX(-100%)` (oculto)
- Transform: `translateX(0)` (visível)
- Transição: `0.4s cubic-bezier(0.4, 0, 0.2, 1)`
- Largura: 360px, Altura imagem: 240px

---

## ⚠️ Troubleshooting

### Problema: Fotos não aparecem no sistema
**Solução:**
1. Verifique se executou `node scan_all_photos.js`
2. Confirme que as fotos estão em `images/[pasta-da-moto]/`
3. Reinicie os servidores
4. Limpe o cache do navegador (Ctrl+Shift+R)

### Problema: Galeria não aparece mesmo com múltiplas fotos
**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros JavaScript
3. Confirme que `moto.images` é um array no JSON
4. Verifique se o CSS foi carregado corretamente

### Problema: Script não encontra a pasta da moto
**Solução:**
1. Renomeie a pasta para corresponder ao nome ou modelo da moto
2. Use nomes simples e claros (ex: "CB 300R 2012")
3. Execute o script novamente

### Problema: Painel lateral não aparece
**Solução:**
1. Certifique-se de clicar em "Ver Detalhes"
2. Verifique se há erros no console
3. Teste o botão X para fechar e reabrir

### Problema: Preview não aparece no agendamento
**Solução:**
1. Selecione uma moto no dropdown
2. Verifique se a moto tem imagem no JSON
3. Limpe o cache e recarregue

---

## 🚀 Funcionalidades Extras Implementadas

### 1. Interface Responsiva
- Layout adaptativo para mobile/desktop
- Cards empilham verticalmente em telas pequenas
- Imagens redimensionam proporcionalmente

### 2. Animações
- Fade in ao abrir painel lateral
- Scale animation nos cards de status
- Rotação do botão X no hover
- Transições suaves entre fotos

### 3. Feedback Visual
- Botões disabled quando nos extremos
- Hover states em todos os controles
- Cores consistentes com o tema laranja
- Loading states preservados

---

## 📝 Notas Importantes

- ✅ Sistema totalmente funcional nos dois acessos (cliente e admin)
- ✅ Backup automático antes de qualquer alteração
- ✅ Script inteligente com múltiplos métodos de matching
- ✅ Suporte a JPG, JPEG, PNG e WEBP
- ✅ Interface responsiva e moderna
- ✅ Campos opcionais - não obrigatório preencher todas as imagens
- ✅ Preview visual no agendamento para confirmar a moto

---

**Última atualização:** 17/12/2025  
**Versão:** 2.0.0  
**Novas funcionalidades:** Painel lateral inteligente, campos múltiplos de imagem no admin, preview no agendamento

