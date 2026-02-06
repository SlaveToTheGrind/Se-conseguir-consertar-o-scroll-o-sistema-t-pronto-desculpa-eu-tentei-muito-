# 🛡️ REGRAS CRÍTICAS DO PROJETO - LEITURA OBRIGATÓRIA
20260129

**⚠️ ATENÇÃO: Leia este arquivo ANTES de fazer qualquer modificação no projeto!**

**Data de criação:** 10/01/2026  
**Última atualização:** 12/01/2026  
**Status:** ATIVO E OBRIGATÓRIO

---

## 📋 ÍNDICE

1. [QUANDO desenvolver MOBILE vs DESKTOP](#quando-desenvolver-mobile-vs-desktop) ⭐ **NOVO**
2. [Regra #1: Interfaces Separadas (CRÍTICA!)](#regra-1-interfaces-separadas-crítica)
3. [Regra #2: Elementos Proibidos](#regra-2-elementos-proibidos)
4. [Regra #3: Breakpoints Fixos](#regra-3-breakpoints-fixos)
5. [Regra #4: Grid Mobile](#regra-4-grid-mobile)
6. [Regra #5: Estilos Inline](#regra-5-estilos-inline)
7. [Regra #6: Segurança](#regra-6-segurança)
8. [Regra #7: Arquivos Mobile](#regra-7-arquivos-mobile)
9. [Regra #8: Análise de Risco Obrigatória](#regra-8-análise-de-risco-obrigatória)
10. [Regra #9: Checagem de Problemas do VS Code](#regra-9-checagem-de-problemas-do-vs-code)
11. [Regra #10: Replicação Obrigatória de Mudanças](#regra-10-replicação-obrigatória-de-mudanças) 🔥 **CRÍTICA**

---

## 🎯 QUANDO DESENVOLVER MOBILE VS DESKTOP

### 🖥️ DESENVOLVA PARA DESKTOP QUANDO:

- ✅ Criar **novas funcionalidades** (contratos, vendas, agendamentos)
- ✅ Adicionar **novos módulos** ao sistema
- ✅ Modificar **lógica JavaScript** (não afeta layout)
- ✅ Alterar **estrutura HTML** base
- ✅ Ajustar **cores, fontes, espaçamentos** gerais
- ✅ Corrigir **bugs de comportamento** (não visuais)

**Arquivos permitidos:**
- ✅ `admin.js`, `catalog.js`, `agendamento.js`
- ✅ `contract-functions-macdavis.js`, `contract-generator.js`
- ✅ `server-admin.js`, `server-client.js`
- ✅ `admin-styles-dark-modern.css` (FORA de media queries)

### 📱 DESENVOLVA PARA MOBILE QUANDO:

- ⚠️ Usuário reportar **problema visual em celular**
- ⚠️ Cards/botões não aparecem corretamente em tela pequena
- ⚠️ Layout quebrado em mobile (sobreposições, texto cortado)
- ⚠️ Modais não cabem na tela do celular
- ⚠️ Grid desorganizado em portrait

**Arquivos permitidos:**
- ✅ `mobile-*.css` (todos os arquivos mobile)
- ✅ `admin-styles-dark-modern.css` (DENTRO de `@media (max-width: 1400px)`)
- ✅ `mobile-ux.js` (comportamentos mobile-específicos)

### 🚨 REGRA DE OURO:

> **Se você está adicionando/modificando FUNCIONALIDADE → Desktop primeiro!**  
> **Se você está corrigindo LAYOUT EM CELULAR → Mobile depois!**

### 📊 Fluxo de Desenvolvimento Correto:

```
1. Nova Feature (Desktop)
   ↓
2. Testar no navegador desktop (Chrome/Firefox)
   ↓
3. Commit e backup
   ↓
4. Testar em celular físico
   ↓
5. Se quebrou mobile → Corrigir em mobile-*.css
   ↓
6. Commit final
```

### ❌ NUNCA:
- Desenvolver funcionalidade nova pensando em mobile primeiro
- Modificar CSS base para "consertar mobile"
- Adicionar media queries sem necessidade
- Testar só em celular e não testar em desktop

---

## 🚨 REGRA #1: INTERFACES SEPARADAS (CRÍTICA!)

### ❌ NUNCA MISTURAR MOBILE E DESKTOP!

Esta é a regra mais importante. Violá-la MATA a interface.

### Quando trabalhar em MOBILE:

✅ **PERMITIDO:**
- Modificar arquivos `mobile-*.css` e `mobile-*.js`
- Modificar media queries `@media (max-width: 1400px)`
- Adicionar estilos dentro de media queries mobile

❌ **PROIBIDO:**
- Tocar em estilos CSS base (fora de media queries)
- Alterar layouts desktop
- Modificar CSS que afeta desktop
- Mudar estrutura HTML que impacta desktop

### Quando trabalhar em DESKTOP:

✅ **PERMITIDO:**
- Modificar CSS base (fora de media queries)
- Alterar layouts desktop
- Modificar estilos gerais

❌ **PROIBIDO:**
- Tocar em arquivos `mobile-*`
- Alterar media queries mobile
- Modificar breakpoints `@media (max-width: 1400px)`
- Mudar estrutura que afeta mobile

### ⚠️ CONSEQUÊNCIAS DE VIOLAR:
- 💀 Interface quebrada
- 📱 Mobile ou desktop não funciona
- 🔥 Necessidade de restaurar backup
- ⏰ Horas de trabalho perdidas

---

## ⚠️ REGRA #2: ELEMENTOS PROIBIDOS

### ❌ NUNCA ADICIONAR:

| Elemento | Motivo | Impacto |
|----------|--------|---------|
| `spinner-ring` | Quebra layout mobile | CRÍTICO |
| `.decorative-elements` | Causa problemas de layout | ALTO |
| `.floating-shape` | Causa problemas de layout | ALTO |
| Elementos decorativos | Performance + compatibilidade | MÉDIO |

### 🔍 Como identificar:
```css
/* PROIBIDO */
.spinner-ring { }
.decorative-elements { }
.floating-shape { }
*[class*="decorative"] { }
*[class*="floating"] { }
```

### ✅ O que foi feito:
Estes elementos foram **removidos** e há proteções CSS para garantir que não apareçam:
```css
.spinner-ring,
*[class*="spinner-ring"],
div[class*="spinner-ring"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}
```

**Não remova estas proteções!**

---

## ⚠️ REGRA #3: BREAKPOINTS FIXOS

### ✅ BREAKPOINT CORRETO PARA MOBILE:
```css
@media (max-width: 1400px) {
    /* Estilos mobile aqui */
}
```

### ❌ BREAKPOINT PROIBIDO:
```css
@media (max-width: 768px) {
    /* NÃO FUNCIONA! */
}
```

### 📐 POR QUÊ?

O viewport está configurado com `initial-scale=0.45`:
- Tela real: 360px
- Tela virtual: 360px ÷ 0.45 = **800px**
- 800px > 768px = media query nunca ativa!

**Resultado:** Media queries de 768px ou menos **NÃO FUNCIONAM**.

### ⚠️ VIEWPORT É INTOCÁVEL:
```html
<!-- NÃO MEXER! -->
<meta name="viewport" content="width=device-width, initial-scale=0.45">
```

### 📋 Arquivos já corrigidos:
- ✅ `admin-styles-dark-modern.css`
- ✅ `mobile-fix-urgent.css` (15 media queries)
- ✅ `mobile-extreme.css`
- ✅ `mobile-portrait-force.css`

---

## ⚠️ REGRA #4: GRID MOBILE

### ✅ CONFIGURAÇÃO OBRIGATÓRIA:

```css
@media (max-width: 1400px) {
    .motorcycle-grid {
        grid-template-columns: 1fr 1fr; /* 2 COLUNAS */
    }
}
```

### ❌ PROIBIDO SEM AUTORIZAÇÃO:
```css
grid-template-columns: 1fr; /* 1 coluna - NÃO! */
grid-template-columns: 1fr 1fr 1fr; /* 3+ colunas - NÃO! */
```

### 📱 POR QUÊ 2 COLUNAS?
- Testado e aprovado em celulares
- Melhor aproveitamento de espaço
- Mantém cards legíveis
- Não quebra layout

### 📍 Localização:
- Arquivo: `admin-styles-dark-modern.css`
- Linha: ~1660

---

## ⚠️ REGRA #5: ESTILOS INLINE

### ✅ RESPEITAR ESTILOS INLINE EXISTENTES

**Não remova estilos inline!** Eles existem por motivos importantes:

### Casos legítimos de estilos inline:

#### 1️⃣ SVG Gradients
```html
<stop offset="0%" style="stop-color:#b84400;stop-opacity:1" />
```
**Motivo:** SVG requer atributos inline.

#### 2️⃣ JavaScript dinâmico
```html
<button onmouseover="this.style.transform='scale(1.05)'" 
        style="transition: all 0.4s">
```
**Motivo:** Manipulação JavaScript necessária.

#### 3️⃣ Display condicional
```html
<div id="paymentDetailsGroup" style="display: none;">
```
**Motivo:** JavaScript alterna visibilidade dinamicamente.

#### 4️⃣ Layouts únicos
```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
```
**Motivo:** Estilo não reutilizado, inline é mais eficiente.

### ⚠️ CONSEQUÊNCIAS DE REMOVER:
- 💥 Animações JavaScript quebradas
- 🎨 SVG gradients não funcionam
- 👻 "Flash" visual em elementos condicionais
- 📉 Performance pior (mais CSS desnecessário)

### 📊 VS Code Problems:
- 147 avisos de "CSS inline" = **IGNORAR TODOS**
- São avisos, não erros
- Código funciona perfeitamente

---

## 🔒 REGRA #6: SEGURANÇA

### ✅ WORKFLOW OBRIGATÓRIO:

1. **ANTES** de qualquer mudança:
   ```powershell
   # Criar backup
   $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
   Copy-Item -Path "c:\Users\W10\Documents\TCC - teste" `
             -Destination "c:\Users\W10\Documents\Backup_$timestamp" `
             -Recurse -Exclude 'node_modules','Backup_*','.git'
   ```

2. **FAZER** a modificação

3. **TESTAR** em:
   - ✅ Desktop (navegador normal)
   - ✅ Mobile (DevTools ou celular real)
   - ✅ Ambas as interfaces funcionando

4. **SE** algo quebrar:
   ```powershell
   # Restaurar backup
   Copy-Item -Path "c:\Users\W10\Documents\Backup_XXXXXXXX_XXXXXX\*" `
             -Destination "c:\Users\W10\Documents\TCC - teste" `
             -Recurse -Force
   ```

### ❌ NUNCA:
- Assumir que funciona sem testar
- Fazer múltiplas mudanças sem backup
- Testar apenas em uma plataforma

---

## 📁 REGRA #7: ARQUIVOS MOBILE

### 🚫 NÃO TOCAR QUANDO TRABALHANDO EM DESKTOP:

| Arquivo | Propósito |
|---------|-----------|
| `mobile-extreme.css` | Estilos mobile extremos |
| `mobile-fix-urgent.css` | Correções urgentes mobile |
| `mobile-portrait-force.css` | Força orientação portrait |
| `mobile-cards-squared.css` | Cards quadrados mobile |
| `mobile-ux.js` | UX específica mobile |

### 🔍 Como identificar trabalho mobile vs desktop:

**Trabalho MOBILE:**
- Menção a "celular", "mobile", "responsivo"
- Problemas em telas pequenas
- Media queries
- Arquivos `mobile-*`

**Trabalho DESKTOP:**
- Menção a "computador", "desktop", "tela grande"
- Layout principal
- CSS base
- Sem media queries

### ⚠️ REGRA DE OURO:
**Mobile e Desktop = Mundos separados. Zero cruzamento!**

---

## 🎯 REGRA #8: ANÁLISE DE RISCO OBRIGATÓRIA

### 📊 ANTES DE QUALQUER MUDANÇA, APRESENTAR:

#### Template de Análise de Risco:

```markdown
## 📊 ANÁLISE DE RISCO - [Nome da Mudança]

### 🎯 Objetivo:
[O que será feito]

### 📁 Arquivos afetados:
- Arquivo 1
- Arquivo 2

### 📱 Impacto MOBILE:
- [Alto/Médio/Baixo/Nenhum]
- [Descrição]

### 🖥️ Impacto DESKTOP:
- [Alto/Médio/Baixo/Nenhum]
- [Descrição]

### ⚠️ Riscos identificados:
1. Risco 1
2. Risco 2

### 💥 O que pode quebrar:
- Item 1
- Item 2

### 🛡️ Mitigação:
- Backup criado: [Sim/Não]
- Rollback disponível: [Sim/Não]
- Testes planejados: [Lista]

### ❓ APROVAR MUDANÇA? [SIM/NÃO]
```

### ⚠️ WORKFLOW:

1. ✅ Calcular riscos
2. ✅ Apresentar análise ao usuário
3. ✅ **AGUARDAR** confirmação explícita
4. ❌ **NUNCA** executar sem aprovação
5. ✅ Criar backup
6. ✅ Fazer mudança
7. ✅ Testar
8. ✅ Confirmar sucesso

---

## � REGRA #9: CHECAGEM DE PROBLEMAS DO VS CODE

### 📊 VERIFICAÇÃO PERIÓDICA OBRIGATÓRIA

**Quando checar o terminal de problemas:**
- ✅ Antes de iniciar trabalho em uma sessão
- ✅ Após fazer modificações em arquivos
- ✅ Antes de criar um backup
- ✅ Ao finalizar uma tarefa
- ✅ Quando solicitado pelo usuário

### 🎯 FILTRAGEM: PROBLEMAS REAIS vs SUGESTÕES

#### ❌ PROBLEMAS REAIS (CORRIGIR IMEDIATAMENTE):

| Tipo | Severidade | Ação |
|------|-----------|------|
| Erros de sintaxe | CRÍTICA | Corrigir agora |
| Variáveis não definidas | ALTA | Corrigir agora |
| Imports quebrados | ALTA | Corrigir agora |
| Funções não encontradas | ALTA | Investigar |
| Tipos incompatíveis | MÉDIA | Revisar |

**Exemplos de problemas reais:**
```javascript
// ERRO: Missing semicolon
const x = 5

// ERRO: 'y' is not defined
console.log(y);

// ERRO: Cannot find module
import { algo } from './nao-existe';
```

#### ✅ SUGESTÕES (PODEM SER IGNORADAS):

| Tipo | Pode Ignorar? | Motivo |
|------|--------------|--------|
| "CSS inline styles should not be used" | **SIM** | Ver Regra #5 |
| "Consider using const" | SIM | Sugestão de estilo |
| "Variable is declared but never used" | Depende | Verificar se realmente não usa |
| "Missing JSDoc comment" | SIM | Documentação opcional |
| "Prefer template literals" | SIM | Preferência de estilo |

**Exemplos de sugestões (OK ignorar):**
```html
<!-- SUGESTÃO (OK): CSS inline -->
<div style="display: none;">...</div>

<!-- SUGESTÃO (OK): Preferência de código -->
let x = 5; // "Consider using const"
```

### 📋 PROCESSO DE ANÁLISE:

1. **Abrir terminal de problemas**
   ```
   VS Code: View > Problems (Ctrl+Shift+M)
   ```

2. **Filtrar por severidade:**
   - 🔴 **Errors** (Erros) → Prioridade MÁXIMA
   - 🟡 **Warnings** (Avisos) → Analisar caso a caso
   - 🔵 **Info** (Informações) → Geralmente ignorar

3. **Analisar cada problema:**
   ```markdown
   [ ] É erro de sintaxe real?
   [ ] Quebra funcionalidade?
   [ ] É sugestão de estilo?
   [ ] Está na lista de ignorados?
   [ ] Precisa correção?
   ```

4. **Reportar ao usuário:**
   ```markdown
   ## 🔍 Análise de Problemas VS Code
   
   **Total:** X problemas
   - ❌ Erros críticos: X
   - ⚠️ Avisos importantes: X
   - ✅ Sugestões ignoráveis: X
   
   ### Problemas críticos encontrados:
   1. [Descrição + Arquivo + Linha]
   2. [Descrição + Arquivo + Linha]
   
   ### Sugestões ignoradas:
   - X avisos de CSS inline (esperado)
   - X sugestões de estilo
   ```

### 🚫 PROBLEMAS CONHECIDOS E IGNORÁVEIS:

#### 1. CSS Inline (147 avisos)
```
CSS inline styles should not be used
```
**Status:** ✅ IGNORAR (Ver Regra #5 e ANALISE_PROBLEMAS_147.md)

#### 2. Preferências de código
```
Consider using const instead of let
Prefer template literal over string concatenation
```
**Status:** ✅ IGNORAR (Sugestões de estilo)

#### 3. JSDoc comments
```
Missing JSDoc comment
```
**Status:** ✅ IGNORAR (Documentação opcional)

### ⚠️ QUANDO REPORTAR PROBLEMAS:

**SEMPRE reportar:**
- 🔴 Todos os erros (errors)
- ⚠️ Avisos sobre funcionalidade quebrada
- ⚠️ Imports/módulos não encontrados
- ⚠️ Variáveis/funções não definidas

**NUNCA reportar (filtrar):**
- ✅ 147 avisos de CSS inline
- ✅ Sugestões de preferência de código
- ✅ Avisos de documentação
- ✅ Problemas em backups/arquivos antigos

### 📊 TEMPLATE DE RELATÓRIO:

```markdown
## 🔍 CHECAGEM PERIÓDICA DE PROBLEMAS

**Data/Hora:** [timestamp]
**Contexto:** [antes de modificação / após modificação / rotina]

### Estatísticas:
- Total de problemas: X
- Erros críticos: X
- Avisos: X
- Sugestões: X

### 🔴 ERROS CRÍTICOS (Requerem ação):
[Se houver]
1. Arquivo: [caminho]
   Linha: [número]
   Erro: [descrição]
   Impacto: [Alto/Médio/Baixo]

[Se não houver]
✅ Nenhum erro crítico encontrado

### ⚠️ AVISOS IMPORTANTES (Revisar):
[Se houver]
1. [Descrição]

[Se não houver]
✅ Nenhum aviso importante

### ✅ SUGESTÕES IGNORADAS:
- CSS inline: X avisos (esperado)
- Preferências de código: X avisos
- Outros: X avisos

### 🎯 AÇÃO REQUERIDA:
[Se houver problemas]
- [ ] Corrigir erro 1
- [ ] Corrigir erro 2

[Se não houver]
✅ Sistema está limpo, pode prosseguir
```

### 🔄 FREQUÊNCIA DE CHECAGEM:

| Situação | Quando Checar |
|----------|---------------|
| Início de sessão | Sempre |
| Após edição de arquivos | Sempre |
| Antes de commit/backup | Sempre |
| Durante desenvolvimento | A cada 15-30min |
| Antes de deploy/teste | Sempre |
| Quando solicitado | Imediatamente |

### 🛡️ INTEGRAÇÃO COM OUTRAS REGRAS:

- **Regra #6 (Segurança):** Checar problemas antes de criar backup
- **Regra #8 (Análise de Risco):** Incluir problemas na análise
- **Regra #5 (Estilos Inline):** Ignorar avisos CSS inline

---

## �📚 HISTÓRICO DE PROBLEMAS

### Por que estas regras existem?

Ver documentos de referência:
- `CORRECOES_COMPLETAS_20260108.md` - Correções feitas
- `ANALISE_PROBLEMAS_147.md` - Análise dos 147 "problemas"
- `OTIMIZACOES_PERFORMANCE_MOBILE.md` - Otimizações mobile

### Problemas que motivaram as regras:

| Problema | Impacto | Regra Criada |
|----------|---------|--------------|
| Spinner rings quebravam mobile | CRÍTICO | Regra #2 |
| Media queries não funcionavam | CRÍTICO | Regra #3 |
| Mudanças mobile quebravam desktop | CRÍTICO | Regra #1 |
| Elementos decorativos causavam lag | ALTO | Regra #2 |
| Estilos inline removidos quebravam JS | MÉDIO | Regra #5 |

---

## ✅ CHECKLIST RÁPIDO

Antes de modificar o projeto, confirme:

- [ ] Li as regras críticas completas
- [ ] Sei se vou trabalhar em mobile OU desktop
- [ ] Não vou misturar mobile e desktop
- [ ] Não vou adicionar elementos proibidos
- [ ] Vou usar breakpoint correto (1400px)
- [ ] Vou respeitar grid mobile (2 colunas)
- [ ] Não vou remover estilos inline
- [ ] Vou criar backup antes
- [ ] Vou apresentar análise de risco
- [ ] Vou aguardar aprovação
- [ ] Vou testar em mobile E desktop
- [ ] Vou checar problemas no VS Code
- [ ] Vou filtrar problemas reais de sugestões

---

## 🆘 EM CASO DE EMERGÊNCIA

### Se algo quebrar:

1. **NÃO ENTRE EM PÂNICO**
2. **PARE** de fazer mudanças
3. **IDENTIFIQUE** o que quebrou (mobile/desktop)
4. **RESTAURE** último backup funcional:
   - `Backup_Sistema_20260110_112838`
   - `Backup_Sistema_20260110_112840`
   - `Backup_Sistema_Contratos_Mottu_20260108_134600`
5. **DOCUMENTE** o que deu errado
6. **REVISE** estas regras

---

## 📞 CONTATO E MANUTENÇÃO

**Responsável:** Victor  
**Última revisão:** 10/01/2026  

### Quando atualizar este documento:
- Nova regra identificada
- Problema crítico resolvido
- Mudança de arquitetura
- Nova descoberta importante

### Versioning:
- v1.0 - 10/01/2026 - Criação inicial (8 regras)
- v1.1 - 10/01/2026 - Adicionada Regra #9 (Checagem de Problemas VS Code)

---

## 🔥 REGRA #10: REPLICAÇÃO OBRIGATÓRIA DE MUDANÇAS

### 📌 QUANDO UMA MUDANÇA FOR TESTADA E APROVADA:

**OBRIGAÇÃO ABSOLUTA:** Toda mudança implementada e testada com sucesso **DEVE** ser replicada em **TODAS** as cópias do sistema.

### ✅ MUDANÇAS QUE EXIGEM REPLICAÇÃO:

#### 1️⃣ Funcionalidades (PRIORIDADE MÁXIMA):
- ✅ Novos recursos adicionados
- ✅ Correções de bugs funcionais
- ✅ Alterações em lógica JavaScript
- ✅ Modificações em funções de servidor
- ✅ Mudanças em manipulação de dados
- ✅ Atualizações de segurança

#### 2️⃣ Interface Visual:
- ✅ Ajustes de layout que melhoram UX
- ✅ Correções de CSS que resolvem problemas
- ✅ Otimizações mobile aprovadas
- ✅ Melhorias de acessibilidade
- ✅ Correções de responsividade

#### 3️⃣ Dados e Configurações:
- ✅ Alterações em estruturas JSON
- ✅ Atualizações de dados críticos
- ✅ Modificações em configurações
- ✅ Novos padrões de validação

### 🔄 PROCESSO DE REPLICAÇÃO:

```
1. Implementar mudança na VERSÃO PRINCIPAL
   ↓
2. Testar completamente (Desktop + Mobile)
   ↓
3. Confirmar que funciona 100%
   ↓
4. IMEDIATAMENTE replicar para:
   • Backup_Sistema_[timestamp]
   • Backup_Sistema_[timestamp]_copia1  
   • Backup_Sistema_[timestamp]_copia2
   ↓
5. Criar novo backup completo com a mudança aplicada
```

### ⚠️ CONSEQUÊNCIAS DE NÃO REPLICAR:

- ❌ Inconsistência entre versões
- ❌ Perda de funcionalidades em backups
- ❌ Impossibilidade de restauração confiável
- ❌ Versões desatualizadas circulando
- ❌ Bugs já corrigidos reaparecendo

### 🎯 REGRAS DE SINCRONIZAÇÃO:

1. **NUNCA** deixe versões diferentes com features distintas
2. **SEMPRE** replique correções de bugs imediatamente
3. **DOCUMENTE** qual versão está mais atualizada
4. **TESTE** cada cópia após replicação
5. **DELETE** backups antigos após criar novo backup sincronizado

### 📝 CHECKLIST DE REPLICAÇÃO:

```
☐ Mudança implementada e testada na versão principal
☐ Funcionalidade confirmada (sem bugs)
☐ Interface verificada (desktop + mobile)
☐ Arquivo/código copiado para todas as versões
☐ Teste rápido em cada cópia
☐ Commit/backup com descrição clara da mudança
☐ Documentação atualizada (se necessário)
```

### 🚨 EXCEÇÕES (quando NÃO replicar):

- ⚠️ Mudanças experimentais não testadas
- ⚠️ Testes temporários que serão revertidos
- ⚠️ Configurações específicas de ambiente de desenvolvimento

### 💡 EXEMPLO PRÁTICO:

```
Cenário: Corrigiu bug no filtro de motos

✅ CORRETO:
1. Corrige em catalog.js da versão principal
2. Testa completamente
3. Copia catalog.js para:
   - Backup_Sistema_20260112_000032/catalog.js
   - Backup_Sistema_20260112_000032_copia1/catalog.js
   - Backup_Sistema_20260112_000032_copia2/catalog.js
4. Cria novo backup: Backup_Sistema_20260112_010000
5. Deleta backups antigos desatualizados

❌ ERRADO:
1. Corrige apenas na versão principal
2. Esquece de replicar
3. Semana depois, restaura backup antigo
4. Bug volta a aparecer 💥
```

### 🔐 RESPONSABILIDADE:

Esta regra é **CRÍTICA** para manter a integridade do projeto. Violá-la pode resultar em:
- Perda de trabalho
- Retrabalho desnecessário
- Confusão sobre qual versão usar
- Problemas em produção

**⚠️ LEMBRE-SE: Um backup desatualizado é pior que nenhum backup!**

---

## ⚖️ LICENÇA E USO

Este documento é parte crítica do projeto MacDavis Motos.

**USO OBRIGATÓRIO** para:
- Desenvolvedores
- IAs (GitHub Copilot, ChatGPT, etc.)
- Colaboradores
- Mantenedores

**Leitura obrigatória antes de qualquer modificação no código.**

---

**🛡️ FIM DO DOCUMENTO - ESTAS REGRAS SALVAM O PROJETO!**

