# Documentação do Sistema de Catálogo e Agendamento de Motocicletas
20260129

**Versão:** 3.9.0  
**Versão:** 4.0.0  
**Data:** 29 de Janeiro de 2026  
**Última Atualização:** Atualização automática da lista de motos no painel admin (CRUD em tempo real) + Otimização Mobile Completa + Modal Backups + Cards de Vendas Redesenhados

## Visão Geral

Este sistema permite a exibição de um catálogo de motocicletas, agendamento de visitas/serviços, administração de dados e correções, com backend em Node.js/Express e frontend responsivo. Pode operar tanto com persistência local (localStorage) quanto com API backend.

---

## Funcionalidades

### 1. Catálogo de Motocicletas (Vitrine)
- Exibe lista de motos disponíveis, carregadas de `motorcycles.json`.
- Mostra nome, ano, quilometragem, preço e descrição de cada moto.
- Botão "Ver detalhes" abre modal com informações completas da moto.
- Botão "Tenho interesse" pré-seleciona a moto no formulário de agendamento.
- **🆕 Galeria de Fotos** (v3.4.0): Navegação entre múltiplas imagens com setas e contador.
- **🐛 Cache de Imagens Corrigido** (v3.6.1): Motos sem foto não exibem mais imagem anterior.
- **🎨 Cards de Vendas Redesenhados** (v3.8.0): Layout minimalista com grid de specs, busca integrada e tipografia aprimorada.
- **📱 Modal de Backups Mobile** (v3.9.0): Interface adaptativa - desktop navega, mobile abre modal fullscreen.

### 2. Agendamento de Visitas/Serviços
- Formulário para agendar visita/teste ou serviço para uma moto.
- Campos: nome, telefone, moto (seleção), data, horário, observações.
- Validação de campos obrigatórios.
- Impede agendamento duplicado para mesma moto/data/horário.
- Salva agendamentos no servidor (`data.json`) ou localStorage (fallback).
- Lista de agendamentos exibida na tela.
- Botão para excluir agendamento individual.
- Botão para limpar todos os agendamentos.
- Exportação de agendamentos para CSV.
- Importação de agendamentos via CSV.

### 3. Gerenciamento de Agendamentos pelo Cliente 🆕
- **Página "Meus Agendamentos"** (`meus-agendamentos.html`): Cliente busca seus agendamentos por telefone
- **Confirmação de Presença**: Cliente pode confirmar que comparecerá ao agendamento
- **Cancelamento pelo Cliente**: Cliente pode cancelar com motivo obrigatório
- **Histórico Completo**: Visualiza agendamentos pendentes, confirmados, realizados e cancelados
- **Visual por Status**: Cores e badges diferentes para cada estado
- **Notificações**: Admin recebe alerta via Telegram quando cliente cancela
- **Autonomia**: Cliente não precisa ligar para loja
- **Sistema de Lock**: Fila de escrita previne race conditions no `data.json`

### 4. Administração e Correções
- #### 🆕 Atualização automática do painel admin (v4.0.0)
- Após adicionar, editar, vender ou excluir uma moto, a lista é atualizada automaticamente.
- Não é mais necessário recarregar a página manualmente para ver as alterações.
- O painel reflete sempre o estado real dos dados após qualquer ação de CRUD.
- Botão "Corrigir cilindradas" (admin): abre modal para corrigir cilindrada de motos sem valor detectado.
- Permite informar cilindrada manualmente e salvar correções localmente.
- Botão "Aplicar e Ordenar": aplica correções, reordena e salva.
- Botão "Exportar correções": exporta arquivo `motorcycle_corrections.json` para backup ou uso externo.

### 4. API Backend (Node.js/Express)
- Endpoints REST para agendamentos:
  - `GET /api/appointments`: lista todos os agendamentos.
  - `POST /api/appointments`: cria novo agendamento.
  - `PATCH /api/appointments/:id/confirm`: cliente confirma presença 🆕
  - `PATCH /api/appointments/:id/cancel`: cliente cancela com motivo 🆕
  - `DELETE /api/appointments/:id`: exclui agendamento por id.
  - `DELETE /api/appointments`: exclui todos os agendamentos.
- Persistência em `data.json`.
- Verificação de conflito de agendamento.
- Sistema de Lock para prevenir race conditions 🆕
- Suporte a CORS e JSON.

### 5. Sistema de Backup Completo 🆕 (v3.6.0)
- **Backup Automático Diário** às 23:00 com rotação de 7 dias
- **Backup Manual** via painel administrativo
- **Inclui**: JSON files + pasta images/ + pasta DOCS Motos/ (~500MB)
- **Interface de Restauração** com preview e metadados detalhados
- **Backup de Segurança** antes de restaurações

### 6. Funcionalidades Extras
- Fallback automático para localStorage se API estiver offline.
- Modal de detalhes da moto com botão para agendar.
- Validação de datas passadas (alerta ao usuário).
- Interface responsiva e estilizada (CSS moderno).
- Mensagens de erro e alertas para feedback do usuário.
- Scripts para normalizar/preencher preços e cilindradas em lote.
- **Sistema de Notificações Telegram** (v3.6.0): Alertas em tempo real de novos agendamentos.
- **Otimização Mobile Admin** (v3.9.0): Filtros 3 colunas, cards responsivos, modal de backups adaptativo.
- **Painel de Vendas Moderno** (v3.8.0): Cards minimalistas, busca integrada, placa destacada.
- **Otimização Mobile Admin** (v3.9.0): Filtros 3 colunas, cards responsivos, modal de backups adaptativo.
- **Painel de Vendas Moderno** (v3.8.0): Cards minimalistas, busca integrada, placa destacada.

---

## Estrutura dos Principais Arquivos

- `index.html`: Frontend principal (catálogo, agendamento, administração).
- `catalog.html`: Catálogo de motos com filtros e busca.
- `agendamento.html`: Formulário de agendamento de visitas.
- `meus-agendamentos.html`: 🆕 Gerenciamento de agendamentos pelo cliente.
- `meus-agendamentos.js`: 🆕 Lógica de busca, confirmação e cancelamento.
- `motorcycles.json`: Catálogo de motos.
- `data.json`: Agendamentos salvos pelo backend.
- `server-client.js`: Servidor Cliente (Porta 3000) - API REST, arquivos estáticos.
- `server-admin.js`: Servidor Admin (Porta 3001) - Painel administrativo.
- `admin.html`/`admin.js`: Painel administrativo (CRUD completo).
- `CSS.css`: Estilos do frontend.
- `telegram-notifier.js`: 🆕 Sistema de notificações via Telegram (singleton pattern).
- `backup-scheduler.js`: 🆕 Sistema de backup automático e restauração.
- `admin-backups.html`: 🆕 Interface de gerenciamento de backups.
- Scripts utilitários: `apply_corrections.js`, `format_price_display.js`, etc.

---

## Fluxo de Uso

1. **Usuário acessa o catálogo** e visualiza motos disponíveis.
2. **Pode agendar uma visita** preenchendo o formulário.
3. **Cliente pode gerenciar seus agendamentos** via "Meus Agendamentos" 🆕
   - Confirmar presença
   - Cancelar com motivo
   - Visualizar histórico completo
4. **Admin pode corrigir cilindradas** de motos pendentes.
5. **Agendamentos podem ser exportados/importados** em CSV.
6. **Todos os dados podem ser persistidos** localmente ou via API backend.

---

## Observações
- O sistema funciona mesmo sem backend, usando localStorage.
- Para uso completo, rode os servidores:
  - Cliente: `node server-client.js` (porta 3000)
  - Admin: `node server-admin.js` (porta 3001)
- Scripts utilitários ajudam a manter os dados normalizados e corrigidos.
- Sistema de notificações Telegram requer configuração do bot.
- Sistema de Lock previne corrupção do `data.json` em operações simultâneas.
- O painel admin agora reflete as alterações em tempo real, sem necessidade de atualizar manualmente.

---

## Documentação Relacionada
- `DOCUMENTACAO_COMPLETA.md` - Documentação detalhada completa (v3.7.1)
- `SISTEMA-CANCELAMENTO-CLIENTE.md` - Guia específico do sistema de gerenciamento pelo cliente
- `BACKUP-SYSTEM-README.md` - 🆕 Guia completo do sistema de backup
- `CHANGELOG.md` - Histórico de versões e atualizações (v3.6.1)
- `README.md` - Visão geral do sistema (v3.6.1)

---

## Contato e Suporte
Para dúvidas ou melhorias, consulte o README ou entre em contato com o desenvolvedor responsável.

