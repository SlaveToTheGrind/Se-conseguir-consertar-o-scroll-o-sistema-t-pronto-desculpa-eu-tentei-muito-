// Sistema de Notificações Desktop - MacDavis Motos Admin
console.log('📢 Sistema de Notificações carregado');

class AdminNotifications {
    constructor() {
        this.permission = 'default';
        this.lastCheck = Date.now();
        this.knownAppointments = new Set();
    }

    // Solicitar permissão para notificações
    async requestPermission() {
        if (!("Notification" in window)) {
            console.warn('❌ Este navegador não suporta notificações');
            // Usar notificações in-page como fallback
            this.permission = 'in-page';
            return true;
        }

        // Verificar se está em contexto seguro
        const isSecureContext = window.isSecureContext || 
                               location.hostname === 'localhost' || 
                               location.hostname === '127.0.0.1';

        if (!isSecureContext) {
            console.warn('⚠️ Notificações desktop requerem HTTPS ou localhost');
            console.log('📢 Usando notificações visuais na página');
            this.permission = 'in-page'; // Usar notificações in-page
            // REMOVIDO: notificação automática ao ativar
            return true;
        }

        if (Notification.permission === 'granted') {
            console.log('✅ Permissão para notificações já concedida');
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this.permission = permission;
                
                if (permission === 'granted') {
                    console.log('✅ Permissão para notificações concedida');
                    this.showTestNotification();
                    return true;
                } else {
                    console.warn('⚠️ Permissão para notificações negada');
                    // Fallback para notificações in-page
                    this.permission = 'in-page';
                    // REMOVIDO: notificação automática
                    return true;
                }
            } catch (error) {
                console.warn('❌ Erro ao solicitar permissão:', error);
                this.permission = 'in-page';
                // REMOVIDO: notificação automática
                return true;
            }
        }

        console.warn('❌ Notificações bloqueadas pelo usuário');
        // Fallback para notificações in-page
        this.permission = 'in-page';
        // REMOVIDO: notificação automática
        return true;
    }

    // Mostrar notificação de teste
    showTestNotification() {
        const notification = new Notification('MacDavis Motos', {
            body: '✅ Notificações ativadas com sucesso!',
            icon: 'PNG MD.png',
            badge: 'PNG MD.png',
            tag: 'test',
            requireInteraction: false
        });

        setTimeout(() => notification.close(), 3000);
    }

    // Mostrar notificação in-page (fallback para quando desktop notifications não funciona)
    showInPageNotification(title, message, type = 'info') {
        const container = document.getElementById('in-page-notifications') || this.createNotificationContainer();
        
        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '✅' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '❌' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '⚠️' },
            info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'ℹ️' },
            appointment: { bg: '#ffe8cc', border: '#ffd699', text: '#cc5500', icon: '🆕' },
            canceled: { bg: '#ffebee', border: '#ffcdd2', text: '#c62828', icon: '🚫' }
        };
        
        const style = colors[type] || colors.info;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${style.bg};
            border: 2px solid ${style.border};
            color: ${style.text};
            padding: 16px 20px;
            margin-bottom: 12px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            position: relative;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 24px; flex-shrink: 0;">${style.icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; white-space: pre-line;">${message}</div>
            </div>
            <button style="
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: ${style.text};
                opacity: 0.6;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;
        
        notification.onmouseover = () => notification.style.transform = 'translateX(-4px)';
        notification.onmouseout = () => notification.style.transform = 'translateX(0)';
        
        const closeBtn = notification.querySelector('button');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        };
        
        container.appendChild(notification);
        
        // Som de notificação
        this.playNotificationSound();
        
        // Auto-remover após 10 segundos (exceto agendamentos)
        if (type !== 'appointment') {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 10000);
        }
        
        return notification;
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'in-page-notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-width: calc(100vw - 40px);
            z-index: 999999;
            pointer-events: none;
        `;
        container.querySelectorAll = function() {
            return Array.from(this.children);
        };
        container.style.pointerEvents = 'all';
        document.body.appendChild(container);
        
        // Adicionar animações CSS
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        return container;
    }

    // Mostrar notificação de novo agendamento
    showNewAppointmentNotification(appointment) {
        const cliente = appointment.cliente || appointment.name;
        const data = appointment.data || appointment.date;
        const horario = appointment.horario || appointment.time;
        const moto = appointment.servico || appointment.motorcycle;

        // Se tem permissão para notificações desktop, usar
        if (this.permission === 'granted') {
            const notification = new Notification('🆕 Novo Agendamento!', {
                body: `Cliente: ${cliente}\nData: ${data} às ${horario}\nMoto: ${moto}`,
                icon: 'PNG MD.png',
                badge: 'PNG MD.png',
                tag: `appointment-${appointment.id}`,
                requireInteraction: true,
                vibrate: [200, 100, 200]
            });

            // Ao clicar, focar na janela do admin
            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Scroll até o novo agendamento
                const appointmentRow = document.querySelector(`[data-id="${appointment.id}"]`);
                if (appointmentRow) {
                    appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    appointmentRow.style.animation = 'highlight 1s ease';
                }
            };
        } else {
            // Fallback: usar notificações in-page
            const message = `Cliente: ${cliente}\nData: ${data} às ${horario}\nMoto: ${moto}`;
            const notif = this.showInPageNotification('Novo Agendamento!', message, 'appointment');
            
            // Ao clicar, scroll até o agendamento
            notif.onclick = () => {
                const appointmentRow = document.querySelector(`[data-id="${appointment.id}"]`);
                if (appointmentRow) {
                    appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    appointmentRow.style.animation = 'highlight 1s ease';
                }
                notif.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notif.remove(), 300);
            };
        }
    }

    // Mostrar notificação de agendamento cancelado
    showCanceledAppointmentNotification(appointment) {
        const cliente = appointment.cliente || appointment.name;
        const data = appointment.data || appointment.date;
        const horario = appointment.horario || appointment.time;
        const motivo = appointment.cancelReason || 'Não informado';

        // Se tem permissão para notificações desktop, usar
        if (this.permission === 'granted') {
            const notification = new Notification('🚫 Agendamento Cancelado!', {
                body: `Cliente: ${cliente}\nData: ${data} às ${horario}\nMotivo: ${motivo}`,
                icon: 'PNG MD.png',
                badge: 'PNG MD.png',
                tag: `canceled-${appointment.id}`,
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 300]
            });

            // Ao clicar, focar na janela do admin e filtrar cancelados
            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Mudar filtro para cancelados
                const filterElement = document.getElementById('appointmentStatusFilter');
                if (filterElement) {
                    filterElement.value = 'cancelado';
                    if (window.filterAppointments) {
                        window.filterAppointments();
                    }
                }
                
                // Scroll até o agendamento cancelado
                setTimeout(() => {
                    const appointmentRow = document.querySelector(`[data-id="${appointment.id}"]`);
                    if (appointmentRow) {
                        appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        appointmentRow.style.animation = 'highlight 1s ease';
                    }
                }, 500);
            };
        } else {
            // Fallback: usar notificações in-page
            const message = `Cliente: ${cliente}\nData: ${data} às ${horario}\nMotivo: ${motivo}`;
            const notif = this.showInPageNotification('Agendamento Cancelado!', message, 'canceled');
            
            // Ao clicar, mudar para filtro de cancelados e fazer scroll
            notif.onclick = () => {
                const filterElement = document.getElementById('appointmentStatusFilter');
                if (filterElement) {
                    filterElement.value = 'cancelado';
                    if (window.filterAppointments) {
                        window.filterAppointments();
                    }
                }
                
                setTimeout(() => {
                    const appointmentRow = document.querySelector(`[data-id="${appointment.id}"]`);
                    if (appointmentRow) {
                        appointmentRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        appointmentRow.style.animation = 'highlight 1s ease';
                    }
                }, 500);
                
                notif.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notif.remove(), 300);
            };
        }
    }

    // Tocar som de notificação
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIHWm98OScTQwOUKfh8LZjHAU7k9X0y3csB');
            audio.volume = 0.3;
            audio.play().catch(() => console.log('Som de notificação bloqueado'));
        } catch (e) {
            console.log('Não foi possível tocar som');
        }
    }

    // Verificar novos agendamentos e cancelamentos
    async checkNewAppointments() {
        try {
            const response = await fetch('/api/appointments');
            if (!response.ok) return;

            const appointments = await response.json();
            
            const now = Date.now();
            
            // Verificar agendamentos novos (criados nos últimos 30 segundos)
            const recentAppointments = appointments.filter(appt => {
                const createdAt = new Date(appt.createdAt || appt.timestamp).getTime();
                const isNew = (now - createdAt) < 30000; // 30 segundos
                const notKnown = !this.knownAppointments.has(appt.id);
                return isNew && notKnown && appt.status !== 'cancelado';
            });

            // Verificar agendamentos cancelados recentemente (últimos 30 segundos)
            const recentCancellations = appointments.filter(appt => {
                if (appt.status !== 'cancelado') return false;
                if (!appt.canceledAt) return false;
                
                const canceledAt = new Date(appt.canceledAt).getTime();
                const isCanceledRecently = (now - canceledAt) < 30000; // 30 segundos
                const wasKnown = this.knownAppointments.has(appt.id);
                
                return isCanceledRecently && wasKnown;
            });

            // Mostrar notificação para cada novo agendamento
            recentAppointments.forEach(appt => {
                this.knownAppointments.add(appt.id);
                this.showNewAppointmentNotification(appt);
                console.log('🔔 Nova notificação de agendamento:', appt);
            });

            // Mostrar notificação para cada cancelamento
            recentCancellations.forEach(appt => {
                this.showCanceledAppointmentNotification(appt);
                console.log('🚫 Nova notificação de cancelamento:', appt);
            });

            // Limpar agendamentos antigos da memória
            if (this.knownAppointments.size > 100) {
                const currentIds = new Set(appointments.map(a => a.id));
                this.knownAppointments.forEach(id => {
                    if (!currentIds.has(id)) {
                        this.knownAppointments.delete(id);
                    }
                });
            }

        } catch (error) {
            console.warn('Erro ao verificar novos agendamentos:', error);
        }
    }

    // Iniciar monitoramento
    startMonitoring(intervalMs = 30000) { // ⏱️ Otimizado: 30s ao invés de 5s
        console.log(`📢 Iniciando monitoramento de notificações (${intervalMs}ms)`);
        
        // Popular conhecidos inicialmente
        fetch('/api/appointments')
            .then(r => r.json())
            .then(appointments => {
                appointments.forEach(appt => {
                    this.knownAppointments.add(appt.id);
                });
                console.log(`✅ ${this.knownAppointments.size} agendamentos conhecidos`);
            });

        // Verificar periodicamente
        this.monitoringInterval = setInterval(() => this.checkNewAppointments(), intervalMs);
    }

    // Parar monitoramento
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('⏹️ Monitoramento de notificações parado');
        }
    }
}

// Instância global
window.adminNotifications = new AdminNotifications();

// Reativar automaticamente se o usuário já tiver habilitado antes
try {
    const saved = localStorage.getItem('adminNotificationsEnabled');
    if (saved === '1') {
        (async () => {
            try {
                if (Notification && Notification.permission === 'default') {
                    await window.adminNotifications.requestPermission();
                }
            } catch (e) { /* silent */ }
            // Inicia monitoramento (usar in-page se permissões não existirem)
            window.adminNotifications.startMonitoring(5000);
        })();
    }
} catch (e) {
    console.warn('Erro ao acessar localStorage para notificações', e);
}

// Botão para ativar notificações
function createNotificationButton() {
    // Se o usuário já pediu para manter notificações habilitadas, não mostrar o botão
    try {
        const saved = localStorage.getItem('adminNotificationsEnabled');
        if (saved === '1') return; // já ativado, não precisa do botão
    } catch (e) { /* ignore localStorage errors */ }

    const button = document.createElement('button');
    button.id = 'notificationButton';
    button.innerHTML = '🔔 Ativar Notificações';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff6600;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(255, 102, 0, 0.4);
        z-index: 9999;
        transition: all 0.3s;
        font-size: 14px;
    `;

    button.onmouseover = () => {
        button.style.background = '#ff7711';
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(255, 102, 0, 0.5)';
    };

    button.onmouseout = () => {
        button.style.background = '#ff6600';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(255, 102, 0, 0.4)';
    };

    button.onclick = async () => {
        const granted = await window.adminNotifications.requestPermission();
        if (granted) {
            button.innerHTML = '✅ Notificações Ativas';
            button.style.background = '#28a745';
            try { localStorage.setItem('adminNotificationsEnabled', '1'); } catch(e) {}
            setTimeout(() => button.remove(), 3000);

            // Iniciar monitoramento
            window.adminNotifications.startMonitoring(5000); // Verifica a cada 5 segundos
        } else {
            button.innerHTML = '❌ Permissão Negada';
            button.style.background = '#dc3545';
            try { localStorage.removeItem('adminNotificationsEnabled'); } catch(e) {}
        }
    };

    document.body.appendChild(button);

    // Se já tem permissão, ativar automaticamente
    if (Notification.permission === 'granted') {
        button.innerHTML = '✅ Notificações Ativas';
        button.style.background = '#28a745';
        window.adminNotifications.permission = 'granted';
        try { localStorage.setItem('adminNotificationsEnabled', '1'); } catch(e) {}
        window.adminNotifications.startMonitoring(5000);
        setTimeout(() => button.remove(), 3000);
    }
}

// Criar botão quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNotificationButton);
} else {
    createNotificationButton();
}

// CSS para animação de highlight
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(255, 102, 0, 0.3); }
    }
`;
document.head.appendChild(style);
