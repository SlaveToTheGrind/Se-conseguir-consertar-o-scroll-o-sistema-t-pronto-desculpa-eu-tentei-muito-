# 🧪 GUIA COMPLETO DE TESTES - MacDavis Motos
20260129
## Sistema Integrado de Catálogo e Agendamento

---

## 🎯 **STATUS ATUAL DO SISTEMA**
- ✅ **Servidor**: Rodando em http://localhost:3000
- ✅ **API**: Funcionando (20 motocicletas + 5 agendamentos)
- ✅ **Cache**: Limpo e com sistema anti-cache
- ✅ **Autenticação**: Login duplo funcionando

---

## 📋 **ROTEIRO DE TESTES COMPLETO**

### 🔗 **LINKS DIRETOS PARA TESTES**
- 🔑 **Login**: http://localhost:3000/login.html
- 🏍️ **Vitrine**: http://localhost:3000/vitrine-nova-anticache.html  
- 🔧 **Admin**: http://localhost:3000/admin-anticache.html
- 🧹 **Limpar Cache**: http://localhost:3000/limpar-cache.html
- 🏠 **Home**: http://localhost:3000/

---

## 📝 **SEQUÊNCIA DE TESTES RECOMENDADA**

### **1. 🧹 PREPARAÇÃO (Opcional)**
```
Acesse: http://localhost:3000/limpar-cache.html
```
- ✅ Clique "Iniciar Limpeza"
- ✅ Aguarde "Limpeza concluída!"
- ✅ Teste se cache foi limpo

---

### **2. 🔑 TESTE DE LOGIN - ADMINISTRADOR**
```
Acesse: http://localhost:3000/login.html
```

**Credenciais Admin:**
- **Usuário**: `admin`
- **Senha**: `123456`

**Checklist Admin:**
- ✅ Formulário admin aparece?
- ✅ Login aceita credenciais?
- ✅ Redirecionamento para admin-anticache.html?
- ✅ Painel admin carrega sem erros?
- ✅ Mostra "20 Total de Motos"?
- ✅ Grid de motocicletas aparece?
- ✅ Cards das motos têm imagens?
- ✅ Botões "Editar" e "Excluir" funcionam (mostra alert)?
- ✅ Botão "Voltar ao Catálogo" funciona?
- ✅ Botão "Sair" funciona?

---

### **3. 🔑 TESTE DE LOGIN - CLIENTE**
```
Acesse: http://localhost:3000/login.html
```

**Dados Cliente (qualquer):**
- **Nome**: `João Silva`
- **Email**: `joao@email.com`
- **Telefone**: `11999887766`

**Checklist Cliente:**
- ✅ Formulário cliente aparece?
- ✅ Máscara de telefone funciona?
- ✅ Login aceita dados?
- ✅ Redirecionamento para vitrine-nova-anticache.html?
- ✅ Vitrine carrega sem erros?
- ✅ Mostra as 20 motocicletas?
- ✅ Filtros funcionam (marca, ano, etc)?
- ✅ Modal de detalhes abre?
- ✅ Botão "Agendar Visita" funciona?

---

### **4. 🏍️ TESTE DA VITRINE COMPLETA**
```
Acesse: http://localhost:3000/vitrine-nova-anticache.html
```

**Funcionalidades para testar:**
- ✅ **Loading**: Sistema mostra "Carregando"?
- ✅ **Grid**: 20 motocicletas aparecem?
- ✅ **Imagens**: Fotos das motos carregam?
- ✅ **Filtros**: 
  - Busca por texto funciona?
  - Filtro por marca funciona?
  - Filtro por faixa de preço funciona?
- ✅ **Modal de Detalhes**:
  - Abre ao clicar "Ver Detalhes"?
  - Mostra dados completos?
  - Botão "Agendar Visita" funciona?
- ✅ **Responsividade**: 
  - Layout adapta em tela menor?
  - Menu mobile funciona?

---

### **5. 📅 TESTE DE AGENDAMENTO**
```
A partir da vitrine, clique em "Agendar Visita" em qualquer moto
```

**Checklist Agendamento:**
- ✅ Modal de agendamento abre?
- ✅ Dados da moto aparecem?
- ✅ Formulário aceita dados?
- ✅ Validação de campos funciona?
- ✅ Data/hora são obrigatórias?
- ✅ Submit salva o agendamento?
- ✅ Confirmação aparece?

---

### **6. 🔧 TESTE DO PAINEL ADMIN COMPLETO**
```
Acesse: http://localhost:3000/admin-anticache.html
(Faça login como admin primeiro)
```

**Funcionalidades Admin:**
- ✅ **Dashboard**:
  - Estatísticas corretas (20 total)?
  - Cards das motos aparecem?
  - Loading funciona?
- ✅ **Ações**:
  - Botão "Nova Motocicleta" funciona (alert)?
  - Botão "Atualizar" recarrega dados?
  - Botões "Editar" nas motos funcionam (alert)?
  - Botões "Excluir" nas motos funcionam (alert)?
- ✅ **Navegação**:
  - "Voltar ao Catálogo" vai para vitrine?
  - "Sair" desloga e vai para login?

---

### **7. 🌐 TESTE DE NAVEGAÇÃO GERAL**
```
Testar transições entre páginas
```

**Fluxos para testar:**
- ✅ **Login** → **Admin** → **Voltar** → **Vitrine**
- ✅ **Login** → **Cliente** → **Vitrine** → **Agendamento**
- ✅ **Logout** → **Login** → **Troca de usuário**
- ✅ **Cache**: Páginas carregam sempre atualizadas?
- ✅ **URLs**: Anti-cache parameters funcionam?

---

### **8. 🧪 TESTE DE APIs**
```
Opcional: Verificar endpoints diretamente
```

**URLs para testar no navegador:**
- ✅ http://localhost:3000/api/motorcycles
- ✅ http://localhost:3000/api/appointments  
- ✅ http://localhost:3000/api/test

**Verificar se retornam:**
- JSON válido
- 20 motocicletas
- 5+ agendamentos
- Status "ok"

---

### **9. 🚨 TESTE DE CENÁRIOS DE ERRO**
```
Testar comportamento em situações adversas
```

- ✅ **Login inválido**: Credenciais erradas mostram erro?
- ✅ **Campos vazios**: Validação funciona?
- ✅ **Páginas diretas**: Acesso sem login redireciona?
- ✅ **Cache do navegador**: F5 carrega versão atualizada?

---

### **10. ✅ TESTE FINAL DE INTEGRAÇÃO**
```
Fluxo completo do usuário
```

**Cenário Cliente:**
1. Limpar cache
2. Fazer login como cliente
3. Navegar pela vitrine
4. Filtrar motocicletas
5. Ver detalhes de uma moto
6. Agendar visita
7. Confirmar agendamento

**Cenário Admin:**
1. Fazer login como admin
2. Ver painel com estatísticas
3. Verificar lista de motos
4. Testar botões de ação
5. Navegar para vitrine
6. Voltar ao admin
7. Fazer logout

---

## 🎯 **CRITÉRIOS DE APROVAÇÃO**

### **Sistema APROVADO se:**
- ✅ **Todas as páginas carregam sem erro 404**
- ✅ **Login funciona para admin e cliente**
- ✅ **20 motocicletas aparecem na vitrine**
- ✅ **Filtros e busca funcionam**
- ✅ **Modal de detalhes abre corretamente**
- ✅ **Agendamento pode ser realizado**
- ✅ **Painel admin mostra dados corretos**
- ✅ **Navegação entre páginas funciona**
- ✅ **Logout redireciona para login**
- ✅ **Sem travamentos de cache**

### **Sistema REPROVADO se:**
- ❌ **Páginas retornam 404**
- ❌ **Login não funciona**
- ❌ **Motocicletas não carregam**
- ❌ **JavaScript apresenta erros**
- ❌ **Cache trava páginas**

---

## 📊 **RELATÓRIO DE TESTES**

**Após completar todos os testes, marque:**

```
[ ] 1. Preparação - Cache limpo
[ ] 2. Login Admin - Funcionando
[ ] 3. Login Cliente - Funcionando  
[ ] 4. Vitrine - 20 motos carregadas
[ ] 5. Agendamento - Formulário funcional
[ ] 6. Painel Admin - Interface completa
[ ] 7. Navegação - Transições OK
[ ] 8. APIs - Retornando dados
[ ] 9. Cenários Erro - Tratados
[ ] 10. Integração - Fluxo completo
```

---

## 🚀 **PRÓXIMOS PASSOS**

**Se todos os testes PASSARAM:**
✅ Sistema está APROVADO para backup final!

**Se algum teste FALHOU:**
❌ Reportar qual teste falhou para correção

---

*Guia criado em 08/11/2025 - 16:35*
*Sistema MacDavis Motos v2.0 - Anti-Cache Edition*
