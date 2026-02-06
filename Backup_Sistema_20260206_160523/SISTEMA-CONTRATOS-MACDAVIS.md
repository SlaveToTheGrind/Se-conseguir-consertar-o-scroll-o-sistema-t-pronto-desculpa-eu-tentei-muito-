# 📄 Sistema de Geração de Contratos - MacDavis Motos
20260129

## ✅ Implementação Concluída

Backup criado em: `Backup_Pre_Contrato_20260107_101335`

---

## 🎯 Como Funciona

O sistema gera contratos de venda de motocicletas em PDF usando o **template OFICIAL** da MacDavis Motos.

### Template do Contrato

O contrato segue EXATAMENTE o modelo fornecido:
- **Cláusula 00**: Objeto do Contrato (dados da moto)
- **Cláusula 01**: Preço e Forma de Pagamento (EDITÁVEL)
- **Cláusulas 02-07**: FIXAS (não editáveis)

---

## 📋 Como Usar

### 1. Abrir Modal de Contrato

No painel admin, ao visualizar uma moto:
1. Clique no card da motocicleta
2. Clique no botão **"📄 Gerar Contrato"** (no modal de venda)

OU

1. Acesse "Motos Vendidas"
2. Selecione uma moto vendida
3. Clique em "📄 Gerar Contrato"

### 2. Preencher Dados do Comprador

**Campos Obrigatórios:**
- Nome Completo
- CPF
- Nacionalidade (ex: brasileiro(a))
- Estado Civil (solteiro(a), casado(a), etc.)
- Profissão
- Endereço Completo

### 3. Configurar Cláusula 01 - Pagamento

**A ÚNICA cláusula editável do contrato:**

- **Valor Total**: Preço total da motocicleta
- **Valor em Dinheiro**: Quanto foi pago em dinheiro
- **Valor no Cartão**: Quanto foi pago no cartão
- **Número de Parcelas**: Se parcelado (1 a 60x)

**Exemplo:**
- Moto: R$ 22.900,00
- Dinheiro: R$ 16.000,00
- Cartão: R$ 6.900,00
- Parcelas: 10x

O sistema converte automaticamente os valores para extenso.

### 4. Gerar PDF

Clique em **"📄 Gerar Contrato PDF"**

O contrato será:
- Gerado em PDF profissional
- Salvo em: `DOCS Motos/Contratos/`
- Aberto automaticamente em nova aba
- Nome: `Contrato_[Marca]_[Modelo]_[Ano]_[Comprador].pdf`

---

## 📂 Estrutura de Arquivos

```
DOCS Motos/
└── Contratos/
    ├── Contrato_Honda_CB500_2020_João_Silva.pdf
    ├── Contrato_Yamaha_MT07_2021_Maria_Santos.pdf
    └── ...
```

---

## 🔧 Arquivos Modificados/Criados

### Criados:
- `contract-generator.js` - Gerador de PDF com template oficial
- `contract-functions-macdavis.js` - Funções JavaScript do modal
- `DOCS Motos/Contratos/` - Pasta para PDFs gerados

### Modificados:
- `admin.html` - Modal de contrato simplificado
- `server-admin.js` - Rotas `/api/generate-contract` e `/api/download-contract`
- `package.json` - Dependência `pdfkit` adicionada

---

## ✨ Recursos

### Conversão Automática para Extenso
- R$ 22.900,00 → "vinte e dois mil e novecentos reais"
- 10 parcelas → "dez"

### Dados Pré-preenchidos
- Informações da moto vindas do cadastro
- Vendedor: Sempre "MacDavis Motos LTDA"

### Cláusulas Fixas
- Todas as cláusulas de 02 a 07 são fixas conforme template
- Tradição e Transferência
- Declarações do Vendedor
- Obrigações do Comprador
- Garantia
- Foro
- Disposições Gerais

### Assinaturas
- Espaço para VENDEDOR (MacDavis)
- Espaço para COMPRADOR
- Espaço para 2 TESTEMUNHAS

---

## ⚠️ Importante

1. **NÃO modifique** o arquivo `contract-generator.js` sem autorização - contém o template oficial
2. **Todas as cláusulas** exceto a 01 são FIXAS e não podem ser alteradas
3. **Sempre revise** o PDF gerado antes de imprimir/assinar
4. **Atualize** os dados do VENDEDOR no arquivo `contract-generator.js` (linhas 162-168):
   ```javascript
   seller: {
       nome: 'MacDavis Motos LTDA',
       cpf: '00.000.000/0001-00', // ← SUBSTITUA PELO CNPJ REAL
       endereco: 'Rua Exemplo, 123...' // ← SUBSTITUA PELO ENDEREÇO REAL
   }
   ```

---

## 🧪 Teste

Para testar o sistema:

1. Reinicie o servidor admin (`Ctrl+C` e execute novamente)
2. Acesse o painel admin
3. Selecione uma moto
4. Clique em "Gerar Contrato"
5. Preencha os dados
6. Gere o PDF
7. Verifique se o contrato está correto

---

## 🐛 Solução de Problemas

### Erro "pdfkit not found"
```bash
npm install pdfkit
```

### Servidor não reiniciou
```bash
# Feche todos os terminais node
Ctrl+C (nos 2 terminais)

# Execute novamente
.\start-both.bat
```

### PDF não abre
- Verifique se a pasta `DOCS Motos/Contratos` existe
- Verifique as permissões da pasta
- Veja o console do navegador (F12) para erros

---

## 📞 Suporte

Qualquer dúvida ou ajuste necessário, entre em contato!

**Sistema implementado em:** 07/01/2026
**Versão:** 1.0 - MacDavis Template Oficial

