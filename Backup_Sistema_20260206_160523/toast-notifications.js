/* 🎯 Sistema de Notificações Toast - MacDavis Motos */

class ToastSystem {
    constructor() {
        this.container = null;
        this.notificationPermission = Notification?.permission || 'default';
        
        // 🎵 Sistema de Sons
        this.audioContext = null;
        this.soundEnabled = localStorage.getItem('toast-sound-enabled') !== 'false';
        
        // 📱 Sistema de Vibração
        this.vibrationEnabled = localStorage.getItem('toast-vibration-enabled') !== 'false';
        
        // ⏱️ Histórico de Notificações
        this.history = [];
        this.maxHistory = 10;
        this.historyPanel = null;
        this.unreadCount = 0;
        
        // 🎨 Tema (admin vs cliente)
        this.theme = localStorage.getItem('toast-theme') || 'auto'; // 'auto', 'admin', 'client'
        
        // ⚡ Sistema de Batch (agrupamento)
        this.batchQueue = [];
        this.batchTimer = null;
        this.batchDelay = 1000; // 1 segundo para agrupar
        
        // 🔄 Sistema de Retry
        this.retryQueue = [];
        this.maxRetries = 3;
        
        // 📊 Analytics
        this.analytics = {
            total: 0,
            byType: { success: 0, error: 0, warning: 0, info: 0 },
            clicks: 0,
            dismisses: 0,
            browserNotifications: 0
        };
        this.loadAnalytics();
        
        this.init();
    }

    /**
     * 🎵 Sistema de Som - Web Audio API
     */
    initAudio() {
        if (!this.audioContext && window.AudioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        this.initAudio();
        
        const frequencies = {
            success: [523.25, 659.25, 783.99], // C5, E5, G5 (acorde de Dó maior)
            error: [392.00, 349.23], // G4, F4 (dissonante)
            warning: [587.33, 493.88], // D5, B4
            info: [659.25] // E5
        };
        
        const freq = frequencies[type] || frequencies.info;
        const now = this.audioContext.currentTime;
        
        freq.forEach((f, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = f;
            oscillator.type = 'sine';
            
            const startTime = now + (i * 0.08);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('toast-sound-enabled', this.soundEnabled);
        this.success(`Sons ${this.soundEnabled ? 'ativados' : 'desativados'}`, 2000);
    }

    /**
     * 📱 Sistema de Vibração Mobile (Android + iOS)
     */
    vibrate(type) {
        if (!this.vibrationEnabled) return;
        
        const patterns = {
            success: [50, 30, 50], // Dupla vibração curta
            error: [100, 50, 100, 50, 100], // Tripla vibração
            warning: [80, 40, 80], // Dupla vibração média
            info: [50] // Vibração única curta
        };
        
        const pattern = patterns[type] || patterns.info;
        
        // Android: usar navigator.vibrate
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
            return;
        }
        
        // iOS: usar audio feedback como alternativa
        this._iOSHaptic(pattern);
    }
    
    _iOSHaptic(pattern) {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const duration = Array.isArray(pattern) ? pattern[0] / 1000 : 0.05;
            
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Silenciosamente ignorar se não funcionar
        }
    }

    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        localStorage.setItem('toast-vibration-enabled', this.vibrationEnabled);
        if (this.vibrationEnabled) {
            this.vibrate('info');
        }
        this.success(`Vibração ${this.vibrationEnabled ? 'ativada' : 'desativada'}`, 2000);
    }

    /**
     * ⏱️ Sistema de Histórico
     */
    addToHistory(type, message, timestamp = Date.now()) {
        this.history.unshift({ type, message, timestamp, read: false });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.unreadCount++;
        this.updateHistoryBadge();
        this.saveHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('toast-history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Erro ao salvar histórico:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('toast-history');
            if (saved) {
                this.history = JSON.parse(saved);
                this.unreadCount = this.history.filter(h => !h.read).length;
            }
        } catch (e) {
            console.warn('Erro ao carregar histórico:', e);
        }
    }

    updateHistoryBadge() {
        const badge = document.getElementById('toast-history-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    toggleHistory() {
        if (!this.historyPanel) {
            this.createHistoryPanel();
        }
        
        const panel = document.getElementById('toast-history-panel');
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        } else {
            this.renderHistory();
            panel.style.display = 'block';
            this.markAllAsRead();
        }
    }

    createHistoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'toast-history-panel';
        panel.innerHTML = `
            <div class="toast-history-header">
                <h3>📋 Histórico de Notificações</h3>
                <button onclick="Toast.toggleHistory()" class="toast-history-close">×</button>
            </div>
            <div id="toast-history-list" class="toast-history-list"></div>
            <div class="toast-history-footer">
                <button onclick="Toast.clearHistory()" class="toast-history-clear">🗑️ Limpar</button>
            </div>
        `;
        document.body.appendChild(panel);
        this.historyPanel = panel;
    }

    renderHistory() {
        const list = document.getElementById('toast-history-list');
        if (!list) return;
        
        if (this.history.length === 0) {
            list.innerHTML = '<div class="toast-history-empty">Nenhuma notificação ainda</div>';
            return;
        }
        
        list.innerHTML = this.history.map(item => {
            const time = new Date(item.timestamp);
            const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            return `
                <div class="toast-history-item ${item.type}">
                    <div class="toast-history-icon">${icons[item.type]}</div>
                    <div class="toast-history-content">
                        <div class="toast-history-message">${item.message}</div>
                        <div class="toast-history-time">${dateStr} ${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    markAllAsRead() {
        this.history.forEach(item => item.read = true);
        this.unreadCount = 0;
        this.updateHistoryBadge();
        this.saveHistory();
    }

    clearHistory() {
        if (confirm('Limpar todo o histórico de notificações?')) {
            this.history = [];
            this.unreadCount = 0;
            this.updateHistoryBadge();
            this.saveHistory();
            this.renderHistory();
        }
    }

    /**
     * 🎨 Sistema de Temas
     */
    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('toast-theme', theme);
        document.body.setAttribute('data-toast-theme', theme);
    }

    detectTheme() {
        // Auto-detectar baseado na página atual
        const isAdmin = window.location.pathname.includes('admin');
        return isAdmin ? 'admin' : 'client';
    }

    /**
     * ⚡ Sistema de Batch (Agrupamento)
     */
    batchNotification(type, message, duration) {
        this.batchQueue.push({ type, message, duration, timestamp: Date.now() });
        
        clearTimeout(this.batchTimer);
        this.batchTimer = setTimeout(() => {
            this.processBatch();
        }, this.batchDelay);
    }

    processBatch() {
        if (this.batchQueue.length === 0) return;
        
        if (this.batchQueue.length === 1) {
            const item = this.batchQueue[0];
            this.show(item.message, item.type, item.duration);
        } else {
            // Agrupar por tipo
            const grouped = {};
            this.batchQueue.forEach(item => {
                if (!grouped[item.type]) grouped[item.type] = [];
                grouped[item.type].push(item.message);
            });
            
            // Mostrar toasts agrupados
            Object.entries(grouped).forEach(([type, messages]) => {
                const count = messages.length;
                const preview = messages[0];
                const others = count - 1;
                
                const message = others > 0 
                    ? `${preview}\n\n+${others} ${others === 1 ? 'notificação' : 'notificações'}`
                    : preview;
                
                this.show(message, type, 6000);
            });
        }
        
        this.batchQueue = [];
    }

    /**
     * 🔄 Sistema de Retry Automático
     */
    async retryRequest(requestFn, options = {}) {
        const {
            maxRetries = this.maxRetries,
            delay = 1000,
            backoff = 2,
            onRetry = null
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const waitTime = delay * Math.pow(backoff, attempt);
                    
                    if (onRetry) {
                        onRetry(attempt + 1, waitTime);
                    } else {
                        this.warning(`Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${waitTime/1000}s...`, 2000);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    this.error(`Falha após ${maxRetries} tentativas: ${error.message}`, 5000);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * 📊 Sistema de Analytics
     */
    trackEvent(event, data = {}) {
        this.analytics.total++;
        
        if (event === 'show' && data.type) {
            this.analytics.byType[data.type]++;
        } else if (event === 'click') {
            this.analytics.clicks++;
        } else if (event === 'dismiss') {
            this.analytics.dismisses++;
        } else if (event === 'browser-notification') {
            this.analytics.browserNotifications++;
        }
        
        this.saveAnalytics();
    }

    saveAnalytics() {
        try {
            localStorage.setItem('toast-analytics', JSON.stringify(this.analytics));
        } catch (e) {
            console.warn('Erro ao salvar analytics:', e);
        }
    }

    loadAnalytics() {
        try {
            const saved = localStorage.getItem('toast-analytics');
            if (saved) {
                this.analytics = { ...this.analytics, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Erro ao carregar analytics:', e);
        }
    }

    getAnalytics() {
        return {
            ...this.analytics,
            clickRate: this.analytics.total > 0 ? (this.analytics.clicks / this.analytics.total * 100).toFixed(1) : 0,
            dismissRate: this.analytics.total > 0 ? (this.analytics.dismisses / this.analytics.total * 100).toFixed(1) : 0
        };
    }

    resetAnalytics() {
        this.analytics = {
            total: 0,
            byType: { success: 0, error: 0, warning: 0, info: 0 },
            clicks: 0,
            dismisses: 0,
            browserNotifications: 0
        };
        this.saveAnalytics();
        this.success('Analytics resetados', 2000);
    }

    /**
     * Solicita permissão para notificações do navegador
     * DEVE ser chamado por ação do usuário (clique)
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            console.log('🔔 Permissão de notificações:', permission);
            return permission;
        }
        return 'denied';
    }

    /**
     * Verifica se notificações estão ativadas
     */
    hasNotificationPermission() {
        return this.notificationPermission === 'granted';
    }

    /**
     * Mostra banner pedindo permissão de notificações
     */
    showNotificationBanner() {
        // Se já tem permissão, mostrar feedback
        if (this.notificationPermission === 'granted') {
            this.success('✅ Notificações já estão ativadas!', 3000);
            return;
        }
        
        // Se foi negado, instruir como desbloquear
        if (this.notificationPermission === 'denied') {
            this.warning('⚠️ Notificações bloqueadas.\n\nPara desbloquear:\n1. Clique no ícone 🔒 na barra de endereço\n2. Ative as notificações', 8000);
            return;
        }
        
        // Só mostrar banner se ainda não foi decidido
        if (this.notificationPermission !== 'default') return;
        
        const banner = document.createElement('div');
        banner.id = 'notification-permission-banner';
        banner.innerHTML = `
            <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 0 0 12px 12px; position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 999998; min-width: 500px; animation: slideDownBanner 0.5s ease;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🔔</span>
                    <div>
                        <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">Ativar Notificações</div>
                        <div style="font-size: 13px; opacity: 0.95;">Receba alertas de novos agendamentos mesmo em outras abas</div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="activate-notifications-btn" style="background: white; color: #1976d2; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                        Ativar
                    </button>
                    <button id="dismiss-notifications-btn" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                        Agora Não
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Botão Ativar
        document.getElementById('activate-notifications-btn').addEventListener('click', async () => {
            const permission = await this.requestNotificationPermission();
            if (permission === 'granted') {
                this.success('✅ Notificações ativadas! Você receberá alertas de novos agendamentos.', 5000);
            } else {
                this.warning('⚠️ Notificações bloqueadas. Você pode ativar nas configurações do navegador.', 5000);
            }
            banner.remove();
        });
        
        // Botão Dispensar
        document.getElementById('dismiss-notifications-btn').addEventListener('click', () => {
            banner.remove();
        });
    }

    init() {
        console.log('%c🎨 TOAST INIT CHAMADO!', 'background: blue; color: white; padding: 10px; font-size: 16px;');
        console.log('🔍 document.body existe?', !!document.body);
        console.log('🔍 document.readyState:', document.readyState);
        
        // Criar container de toasts se não existir
        const createContainer = () => {
            console.log('%c📦 CRIANDO CONTAINER...', 'background: purple; color: white; padding: 5px;');
            
            if (!document.querySelector('.toast-container')) {
                this.container = document.createElement('div');
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
                console.log('%c✅ Toast container CRIADO!', 'background: green; color: white; padding: 5px;', this.container);
            } else {
                this.container = document.querySelector('.toast-container');
                console.log('%c✅ Toast container JÁ EXISTIA!', 'background: green; color: white; padding: 5px;', this.container);
            }
            
            // Criar botão de histórico
            this.createHistoryButton();
            
            // Carregar histórico e tema
            this.loadHistory();
            if (this.theme === 'auto') {
                this.setTheme(this.detectTheme());
            }
            
            console.log('%c🎯 TOAST PRONTO PARA USO!', 'background: green; color: white; padding: 10px; font-size: 16px;');
        };
        
        // Garantir que o body existe antes de criar o container
        if (document.body) {
            createContainer();
        } else {
            // Se o body ainda não existe, esperar o DOM carregar
            document.addEventListener('DOMContentLoaded', createContainer);
        }
    }

    createHistoryButton() {
        if (document.getElementById('toast-history-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'toast-history-btn';
        btn.className = 'toast-history-btn';
        btn.innerHTML = `
            📋
            <span id="toast-history-badge" class="toast-history-badge" style="display: none;">0</span>
        `;
        btn.onclick = () => this.toggleHistory();
        btn.title = 'Histórico de Notificações';
        document.body.appendChild(btn);
        
        this.updateHistoryBadge();
    }

    /**
     * Mostra uma notificação toast
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duração em ms (padrão: 4000)
     */
    show(message, type = 'info', duration = 4000) {
        console.log('🎨 [TOAST] show() chamado:', { message, type, duration, containerExists: !!this.container });
        
        // Garantir que o container existe
        if (!this.container) {
            console.warn('⚠️ [TOAST] Container não existe! Tentando recriar...');
            this.init();
            if (!this.container) {
                console.error('❌ [TOAST] Falha ao criar container! Toast não será exibido.');
                return null;
            }
        }
        
        // 🎵 Tocar som
        this.playSound(type);
        
        // 📱 Vibrar
        this.vibrate(type);
        
        // ⏱️ Adicionar ao histórico
        this.addToHistory(type, message);
        
        // 📊 Rastrear evento
        this.trackEvent('show', { type });
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('data-toast-theme', this.theme);

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;

        this.container.appendChild(toast);
        console.log('✅ [TOAST] Toast adicionado ao container!', toast);

        // Botão fechar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.trackEvent('dismiss');
            this.remove(toast);
        });
        
        // Rastrear clique no toast
        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                this.trackEvent('click');
            }
        });

        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Mostra notificação do navegador (funciona mesmo com aba inativa)
     * @param {string} title - Título da notificação
     * @param {string} body - Corpo da notificação
     * @param {string} icon - URL do ícone (opcional)
     */
    browserNotification(title, body, icon = null) {
        if ('Notification' in window && this.notificationPermission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏍️</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
                tag: 'macdavis-appointment',
                requireInteraction: false,
                silent: false
            });
            
            // 📊 Rastrear
            this.trackEvent('browser-notification');
            
            // Fechar automaticamente após 10 segundos
            setTimeout(() => notification.close(), 10000);
            
            // Focar na janela ao clicar na notificação
            notification.onclick = () => {
                window.focus();
                notification.close();
                this.trackEvent('click');
            };
            
            console.log('🔔 Notificação do navegador exibida:', title);
            return notification;
        } else {
            console.warn('⚠️ Notificações do navegador não disponíveis ou sem permissão');
            return null;
        }
    }

    /**
     * Mostra Toast visual + Notificação do navegador
     * @param {string} message - Mensagem para o Toast
     * @param {string} title - Título para notificação do navegador
     * @param {number} duration - Duração do Toast
     */
    infoWithBrowserNotification(message, title = 'MacDavis Motos', duration = 8000) {
        // Toast visual
        this.info(message, duration);
        
        // Notificação do navegador
        this.browserNotification(title, message.replace(/\n/g, ' '));
    }

    /**
     * Mostra um diálogo de confirmação customizado
     * @param {string} message - Mensagem de confirmação
     * @param {object} options - Opções: title, confirmText, cancelText, icon
     * @returns {Promise<boolean>}
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirmar ação',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                icon = '❓'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-icon">${icon}</div>
                    <div class="confirm-title">${title}</div>
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="confirm-btn confirm-btn-secondary" data-action="cancel">
                            ${cancelText}
                        </button>
                        <button class="confirm-btn confirm-btn-primary" data-action="confirm">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const handleClick = (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    closeDialog();
                } else if (action === 'cancel') {
                    resolve(false);
                    closeDialog();
                }
            };

            const handleOverlayClick = (e) => {
                if (e.target === overlay) {
                    resolve(false);
                    closeDialog();
                }
            };

            const closeDialog = () => {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    if (overlay.parentElement) {
                        overlay.parentElement.removeChild(overlay);
                    }
                }, 200);
            };

            overlay.addEventListener('click', handleOverlayClick);
            overlay.querySelectorAll('.confirm-btn').forEach(btn => {
                btn.addEventListener('click', handleClick);
            });

            // Fechar com ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    resolve(false);
                    closeDialog();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    /**
     * Atalho para confirmação de exclusão
     */
    async confirmDelete(itemName) {
        return await this.confirm(
            `Tem certeza que deseja excluir "${itemName}"?\n\nEsta ação não pode ser desfeita!`,
            {
                title: 'Excluir item',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                icon: '🗑️'
            }
        );
    }

    /**
     * Atalho para confirmação de logout
     */
    async confirmLogout() {
        return await this.confirm(
            'Deseja fazer logout e voltar à tela de login?',
            {
                title: 'Confirmar Logout',
                confirmText: 'Sair',
                cancelText: 'Cancelar',
                icon: '🚪'
            }
        );
    }
}

// Criar instância global e GARANTIR que está no window
const Toast = new ToastSystem();
window.Toast = Toast; // ⚡ FORÇA NO WINDOW!

console.log('%c🎨 TOAST CRIADO E EXPORTADO!', 'background: green; color: white; padding: 10px; font-size: 18px;');
console.log('🎨 Toast:', Toast);
console.log('🎨 window.Toast:', window.Toast);
console.log('🎨 Toast.container:', Toast.container);
console.log('🎨 Toast.info é função?', typeof Toast.info === 'function');

// Compatibilidade com alert antigo (opcional)
window.customAlert = (message) => {
    // Remove emojis do início se tiver
    const cleanMessage = message.replace(/^[✅❌⚠️ℹ️]\s*/, '');
    
    if (message.startsWith('✅')) {
        Toast.success(cleanMessage);
    } else if (message.startsWith('❌')) {
        Toast.error(cleanMessage);
    } else if (message.startsWith('⚠️')) {
        Toast.warning(cleanMessage);
    } else {
        Toast.info(cleanMessage);
    }
};

// Compatibilidade com confirm antigo
window.customConfirm = async (message) => {
    // Detectar tipo de confirmação
    if (message.includes('🗑️') || message.toLowerCase().includes('excluir')) {
        const itemName = message.match(/"([^"]+)"/)?.[1] || 'este item';
        return await Toast.confirmDelete(itemName);
    } else if (message.includes('🚪') || message.toLowerCase().includes('logout')) {
        return await Toast.confirmLogout();
    } else {
        return await Toast.confirm(message);
    }
};

console.log('🎨 Sistema de Notificações Toast carregado!');
