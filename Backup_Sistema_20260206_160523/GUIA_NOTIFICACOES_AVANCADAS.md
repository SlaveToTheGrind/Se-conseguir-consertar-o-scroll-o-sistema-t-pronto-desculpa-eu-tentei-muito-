# 🔔 Sistema Avançado de Notificações - MacDavis Motos
20260129

## 🎯 Novas Funcionalidades Implementadas

### 1. 🔊 Sistema de Som
**Descrição:** Sons discretos para cada tipo de notificação usando Web Audio API

**Características:**
- ✅ Success: Acorde de Dó maior (C5, E5, G5) - Som agradável e positivo
- ❌ Error: Notas dissonantes (G4, F4) - Som de alerta
- ⚠️ Warning: Notas médias (D5, B4) - Som de atenção
- ℹ️ Info: Nota única (E5) - Som neutro

**Como usar:**
```javascript
// Sons são tocados automaticamente com cada notificação
Toast.success('Operação concluída!'); // Toca som de sucesso

// Desativar/Ativar sons
Toast.toggleSound();

// Verificar se está ativado
console.log(Toast.soundEnabled); // true/false
```

**Configuração:**
- Salvo em `localStorage` como `toast-sound-enabled`
- Padrão: ativado

---

### 2. 📱 Vibração Mobile
**Descrição:** Feedback tátil em dispositivos móveis

**Padrões de vibração:**
- ✅ Success: [50ms, 30ms, 50ms] - Dupla vibração curta
- ❌ Error: [100ms, 50ms, 100ms, 50ms, 100ms] - Tripla vibração
- ⚠️ Warning: [80ms, 40ms, 80ms] - Dupla vibração média
- ℹ️ Info: [50ms] - Vibração única curta

**Como usar:**
```javascript
// Vibração automática em dispositivos móveis
Toast.error('Erro ao processar!'); // Vibra automaticamente

// Desativar/Ativar vibração
Toast.toggleVibration();

// Verificar se está ativado
console.log(Toast.vibrationEnabled); // true/false
```

**Compatibilidade:**
- Funciona apenas em dispositivos com suporte a `navigator.vibrate()`
- Desktop: não tem efeito

---

### 3. ⏱️ Histórico de Notificações
**Descrição:** Painel com as últimas 10 notificações

**Características:**
- 📋 Armazena últimas 10 notificações
- 🕐 Timestamps com data e hora
- 🔴 Badge com contador de não lidas
- 💾 Persistido em localStorage
- 🗑️ Botão para limpar histórico

**Como usar:**
```javascript
// Abrir/Fechar histórico
Toast.toggleHistory();

// Limpar histórico
Toast.clearHistory();

// Acessar histórico programaticamente
console.log(Toast.history); // Array com notificações

// Verificar não lidas
console.log(Toast.unreadCount); // Número
```

**Interface:**
- Botão flutuante no canto inferior direito (📋)
- Badge vermelho com contador
- Painel lateral com lista de notificações
- Click no painel marca todas como lidas

---

### 4. 🎨 Temas Personalizados
**Descrição:** Temas diferentes para admin e cliente

**Temas disponíveis:**
- `admin` - Laranja (FF6600)
- `client` - Azul (3B82F6)
- `auto` - Detecta automaticamente baseado na página

**Como usar:**
```javascript
// Definir tema manualmente
Toast.setTheme('admin'); // ou 'client' ou 'auto'

// Verificar tema atual
console.log(Toast.theme); // 'admin', 'client', 'auto'

// Auto-detectar (padrão)
Toast.detectTheme(); // Retorna 'admin' ou 'client'
```

**Detecção automática:**
- URLs com `/admin` → tema `admin` (laranja)
- Outras URLs → tema `client` (azul)

**Estilo aplicado:**
- Botão de histórico na cor do tema
- Borda do painel de histórico na cor do tema
- Bordas laterais dos toasts coloridas

---

### 5. ⚡ Notificações em Batch (Agrupamento)
**Descrição:** Agrupa múltiplas notificações recebidas em sequência rápida

**Características:**
- ⏱️ Janela de agrupamento: 1 segundo
- 📦 Agrupa por tipo (success, error, warning, info)
- 📊 Mostra contador: "+2 notificações"

**Como usar:**
```javascript
// Usar batchNotification ao invés de show/success/error
Toast.batchNotification('success', 'Item 1 salvo', 4000);
Toast.batchNotification('success', 'Item 2 salvo', 4000);
Toast.batchNotification('success', 'Item 3 salvo', 4000);

// Resultado: 1 toast com "Item 1 salvo\n\n+2 notificações"

// Processar fila manualmente (normalmente automático)
Toast.processBatch();

// Ajustar delay de agrupamento (em ms)
Toast.batchDelay = 2000; // 2 segundos
```

**Quando usar:**
- Múltiplas operações em sequência (importação, processamento em lote)
- Notificações de sincronização
- Atualizações em tempo real

---

### 6. 🔄 Retry Automático
**Descrição:** Sistema de retry com exponential backoff para requisições

**Características:**
- 🔁 Até 3 tentativas por padrão
- ⏱️ Exponential backoff (1s, 2s, 4s)
- 📊 Notificações de progresso
- ❌ Notificação de falha final

**Como usar:**
```javascript
// Wrapper para requisições com retry
const result = await Toast.retryRequest(
    async () => {
        const response = await fetch('/api/motos');
        if (!response.ok) throw new Error('Erro na API');
        return response.json();
    },
    {
        maxRetries: 3,        // Padrão: 3
        delay: 1000,          // Delay inicial: 1s
        backoff: 2,           // Multiplicador: 2x
        onRetry: (attempt, waitTime) => {
            console.log(`Tentativa ${attempt}, aguardando ${waitTime}ms`);
        }
    }
);

// Exemplo prático
async function salvarMoto(data) {
    try {
        return await Toast.retryRequest(async () => {
            const response = await fetch('/api/motos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response.json();
        });
    } catch (error) {
        Toast.error('Falha ao salvar após múltiplas tentativas');
    }
}
```

**Benefícios:**
- Maior resiliência a falhas temporárias
- Melhor UX em conexões instáveis
- Menos erros visíveis ao usuário

---

### 7. 📊 Sistema de Analytics
**Descrição:** Rastreamento detalhado de uso das notificações

**Métricas rastreadas:**
- 📈 Total de notificações exibidas
- 📊 Por tipo (success, error, warning, info)
- 👆 Clicks em notificações
- ❌ Dismisses (fechamentos)
- 🔔 Notificações do navegador enviadas
- 📉 Taxa de click
- 📉 Taxa de dismiss

**Como usar:**
```javascript
// Obter analytics
const stats = Toast.getAnalytics();
console.log(stats);
/* Retorna:
{
    total: 150,
    byType: { success: 80, error: 30, warning: 25, info: 15 },
    clicks: 45,
    dismisses: 30,
    browserNotifications: 20,
    clickRate: "30.0",      // %
    dismissRate: "20.0"     // %
}
*/

// Resetar analytics
Toast.resetAnalytics();

// Analytics são salvos automaticamente em localStorage
```

**Uso prático:**
```javascript
// Dashboard de analytics
function mostrarDashboard() {
    const stats = Toast.getAnalytics();
    
    console.log('📊 ANALYTICS DE NOTIFICAÇÕES');
    console.log(`Total: ${stats.total}`);
    console.log(`Success: ${stats.byType.success}`);
    console.log(`Errors: ${stats.byType.error}`);
    console.log(`Taxa de Click: ${stats.clickRate}%`);
    console.log(`Taxa de Dismiss: ${stats.dismissRate}%`);
    console.log(`Notificações Browser: ${stats.browserNotifications}`);
}
```

---

## 🎮 Exemplos Completos de Uso

### Exemplo 1: Salvar com Retry e Analytics
```javascript
async function salvarMotocicleta(motoData) {
    try {
        const result = await Toast.retryRequest(async () => {
            const response = await fetch('/api/motos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(motoData)
            });
            
            if (!response.ok) throw new Error('Erro ao salvar');
            return response.json();
        });
        
        // Sucesso com som + vibração + histórico
        Toast.success(`✅ ${motoData.nome} salva com sucesso!`);
        
        return result;
    } catch (error) {
        // Erro registrado no analytics
        Toast.error(`❌ Falha ao salvar: ${error.message}`);
        throw error;
    }
}
```

### Exemplo 2: Processamento em Batch
```javascript
async function importarMotos(motosArray) {
    for (const moto of motosArray) {
        try {
            await salvarMoto(moto);
            // Usar batch para agrupar múltiplos sucessos
            Toast.batchNotification('success', `${moto.nome} importada`, 3000);
        } catch (error) {
            Toast.batchNotification('error', `Falha: ${moto.nome}`, 5000);
        }
    }
    
    // Processar fila após loop
    Toast.processBatch();
}
```

### Exemplo 3: Notificações de Agendamento com Som
```javascript
function novoAgendamento(agendamento) {
    // Toast visual + Som + Vibração + Histórico
    Toast.success(`
        🏍️ Novo Agendamento!
        
        Cliente: ${agendamento.cliente}
        Moto: ${agendamento.moto}
        Data: ${agendamento.data}
    `, 8000);
    
    // Notificação do navegador (mesmo com aba inativa)
    if (Toast.hasNotificationPermission()) {
        Toast.browserNotification(
            '🏍️ MacDavis - Novo Agendamento',
            `${agendamento.cliente} - ${agendamento.moto}`
        );
    }
}
```

### Exemplo 4: Painel de Controle
```javascript
// Adicionar botões de controle na interface
function criarPainelControle() {
    const html = `
        <div class="toast-controls">
            <button onclick="Toast.toggleSound()">
                🔊 ${Toast.soundEnabled ? 'Desativar' : 'Ativar'} Sons
            </button>
            <button onclick="Toast.toggleVibration()">
                📱 ${Toast.vibrationEnabled ? 'Desativar' : 'Ativar'} Vibração
            </button>
            <button onclick="Toast.toggleHistory()">
                📋 Ver Histórico (${Toast.unreadCount})
            </button>
            <button onclick="mostrarAnalytics()">
                📊 Ver Analytics
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function mostrarAnalytics() {
    const stats = Toast.getAnalytics();
    Toast.info(`
        📊 ANALYTICS
        
        Total: ${stats.total}
        Clicks: ${stats.clicks} (${stats.clickRate}%)
        Success: ${stats.byType.success}
        Errors: ${stats.byType.error}
    `, 10000);
}
```

---

## 🔧 Configurações Disponíveis

### localStorage Keys
- `toast-sound-enabled` - Sons ativados (true/false)
- `toast-vibration-enabled` - Vibração ativada (true/false)
- `toast-theme` - Tema atual (admin/client/auto)
- `toast-history` - Histórico de notificações (JSON)
- `toast-analytics` - Métricas de uso (JSON)

### Propriedades Configuráveis
```javascript
Toast.soundEnabled = true;           // Ativar/desativar sons
Toast.vibrationEnabled = true;       // Ativar/desativar vibração
Toast.theme = 'auto';                // Tema: admin, client, auto
Toast.maxHistory = 10;               // Máximo de itens no histórico
Toast.batchDelay = 1000;            // Delay para agrupamento (ms)
Toast.maxRetries = 3;               // Tentativas de retry
```

---

## 🎨 Customização de Estilos

### CSS Variables
```css
/* Customizar cores do tema */
[data-toast-theme="admin"] {
    --toast-primary: #ff6600;
    --toast-secondary: #ff8533;
}

[data-toast-theme="client"] {
    --toast-primary: #3b82f6;
    --toast-secondary: #2563eb;
}
```

### Classes CSS
- `.toast-container` - Container de toasts
- `.toast` - Toast individual
- `.toast.success/error/warning/info` - Tipos
- `.toast-history-btn` - Botão de histórico
- `#toast-history-panel` - Painel de histórico
- `.toast-history-badge` - Badge de não lidas

---

## 📱 Compatibilidade

### Navegadores
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Funcionalidades por Browser
| Funcionalidade | Chrome | Firefox | Safari | Edge |
|---------------|--------|---------|--------|------|
| Toasts | ✅ | ✅ | ✅ | ✅ |
| Sons | ✅ | ✅ | ✅ | ✅ |
| Vibração | ✅ | ❌ | ❌ | ✅ |
| Notificações | ✅ | ✅ | ⚠️ | ✅ |
| Histórico | ✅ | ✅ | ✅ | ✅ |

⚠️ Safari: requer interação do usuário para notificações

---

## 🐛 Troubleshooting

### Sons não tocam
```javascript
// Verificar se AudioContext foi iniciado
Toast.initAudio();

// Verificar se está ativado
console.log(Toast.soundEnabled); // deve ser true
```

### Vibração não funciona
```javascript
// Verificar suporte do navegador
console.log('vibrate' in navigator); // deve ser true

// Verificar se está ativado
console.log(Toast.vibrationEnabled); // deve ser true
```

### Histórico não persiste
```javascript
// Verificar localStorage
console.log(localStorage.getItem('toast-history'));

// Forçar save
Toast.saveHistory();
```

---

## 📄 Changelog

**Versão 2.0.0** (16/01/2026)
- ✅ Sistema de sons (Web Audio API)
- ✅ Vibração mobile
- ✅ Histórico de notificações
- ✅ Temas personalizados (admin/client)
- ✅ Notificações em batch
- ✅ Retry automático
- ✅ Sistema de analytics

**Versão 1.0.0** (15/01/2026)
- Toasts básicos (success, error, warning, info)
- Notificações do navegador
- Diálogos de confirmação

---

## 👨‍💻 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador: `F12`
2. Verificar estado do Toast: `console.log(Toast)`
3. Verificar analytics: `console.log(Toast.getAnalytics())`
4. Resetar sistema: `Toast.resetAnalytics(); localStorage.clear();`

---

**MacDavis Motos** - Sistema de Notificações v2.0.0

