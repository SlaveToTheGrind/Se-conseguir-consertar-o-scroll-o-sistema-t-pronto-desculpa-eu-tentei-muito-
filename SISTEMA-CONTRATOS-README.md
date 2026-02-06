# 📄 Sistema de Contratos - MacDavis Motos
20260129

## ✅ Fase 1 Implementada

### Arquivos Criados

1. **contract-styles.css** - Estilos do sistema de contratos
2. **contract-functions.js** - Lógica JavaScript do sistema
3. **Modais adicionados ao admin.html**:
   - `contractModal` - Formulário de geração de contrato
   - `contractPreviewModal` - Preview do contrato antes de gerar PDF

### Funcionalidades Implementadas

#### 🎯 Modal de Contrato
- ✅ Seleção de 4 tipos de contrato (Venda, Compra, Troca, Consignação)
- ✅ Cards visuais para seleção de tipo com ícones
- ✅ Formulário completo com campos organizados em seções
- ✅ Pré-preenchimento automático de dados da moto
- ✅ Pré-preenchimento de dados do comprador (quando vindo do modal de venda)
- ✅ Validação de campos obrigatórios

#### 📋 Campos do Formulário

**Dados da Motocicleta** (pré-preenchidos):
- Marca/Modelo (readonly)
- Ano (readonly)
- Placa (readonly)
- Cor (readonly)
- Chassi (editável, obrigatório)
- RENAVAM (editável, obrigatório)

**Dados do Cliente** (título dinâmico por tipo):
- Nome Completo *
- CPF *
- RG *
- Endereço Completo *
- Cidade *
- Estado * (dropdown com todos os estados)
- Telefone *
- Email (opcional)

**Valores e Pagamento**:
- Valor Total *
- Forma de Pagamento * (À Vista, Parcelado, Financiado)
- Valor de Entrada (condicional)
- Número de Parcelas (condicional)

**Observações**:
- Campo de texto livre para cláusulas adicionais

#### 🔄 Lógica Implementada

**Funções Principais**:
- `openContractModal(motoId)` - Abre modal e preenche dados
- `closeContractModal()` - Fecha modal e limpa dados
- `updateContractForm()` - Atualiza títulos conforme tipo selecionado
- `toggleParcelamento()` - Mostra/oculta campos de parcelamento
- `previewContract()` - Gera preview HTML do contrato
- `generateContract(event)` - Valida e processa geração (Fase 2: PDF)
- `getContractData()` - Coleta dados do formulário
- `generateContractHTML(tipo, data)` - Gera HTML formatado
- `generatePaymentClause(valores)` - Gera cláusula de pagamento

#### 🎨 Estilos e UX

- Cards de tipo de contrato com hover e seleção visual
- Grid responsivo (4 colunas → 2 em mobile)
- Formulário organizado em seções com ícones
- Campos readonly com visual diferenciado
- Preview em estilo profissional (Times New Roman, fundo branco)
- Botão "Gerar Contrato" adicionado ao modal de venda

### Integração com Sistema Existente

#### No Modal de Venda
- Botão "📄 Gerar Contrato" após "Confirmar Venda"
- Pré-preenche dados da moto e comprador automaticamente
- Mantém valor de venda

#### Preview do Contrato
- Cabeçalho com dados da loja
- Seções: Vendedor, Comprador, Objeto do Contrato
- Cláusulas numeradas (Valor, Condições, Obrigações)
- Observações adicionais (se preenchidas)
- Área de assinaturas (2 colunas)
- Valores formatados em BRL
- Cálculo automático de parcelas

### Como Usar

1. **Acessar pelo Modal de Venda**:
   - Preencher dados da venda normalmente
   - Clicar em "📄 Gerar Contrato"
   - Dados já vêm pré-preenchidos

2. **Preencher Formulário**:
   - Selecionar tipo de contrato (Venda já vem marcado)
   - Completar chassi e RENAVAM
   - Preencher dados do comprador
   - Confirmar valores e forma de pagamento
   - Adicionar observações (opcional)

3. **Visualizar Preview**:
   - Clicar em "👁️ Visualizar"
   - Revisar contrato formatado
   - Voltar para editar ou confirmar geração

4. **Gerar PDF** (Fase 2):
   - Por enquanto, apenas gera preview
   - Mensagem: "Preview do contrato gerado! Integração PDF será implementada na Fase 2."

### Próximos Passos - Fase 2

- [ ] Integrar biblioteca jsPDF ou pdfmake
- [ ] Implementar geração real de PDF
- [ ] Adicionar logo da MacDavis no contrato
- [ ] Permitir download do PDF
- [ ] Adicionar opção de impressão
- [ ] Salvar histórico de contratos gerados
- [ ] Integrar com backend para persistência

### Arquivos Modificados

- ✅ `admin.html` - Adicionados 2 modais e link para CSS
- ✅ `admin.html` - Adicionado script contract-functions.js

### Dependências

- **Atuais**: Nenhuma (HTML/CSS/JS puro)
- **Fase 2**: jsPDF ou pdfmake (a definir)

### Compatibilidade

- ✅ Desktop (grid 4 colunas)
- ✅ Tablet (grid 2 colunas)
- ✅ Mobile (grid 1 coluna)
- ✅ Preview otimizado para impressão

---

**Data de Implementação**: 06/01/2025  
**Versão do Sistema**: 2.3  
**Status**: Fase 1 Completa ✅

