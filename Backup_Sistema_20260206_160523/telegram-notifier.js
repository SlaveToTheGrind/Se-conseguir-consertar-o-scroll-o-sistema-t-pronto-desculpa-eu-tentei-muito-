// Sistema de Notificações Telegram - MacDavis Motos
// Envia notificações automáticas para o Telegram do administrador

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

class TelegramNotifier {
    constructor() {
        this.bot = null;
        this.chatId = null;
        this.enabled = false;
        this.lastNotificationTime = {};
        
        this.init();
    }

    // Inicializar bot
    init() {
        try {
            // Tentar carregar variáveis de ambiente
            if (fs.existsSync('.env')) {
                const envContent = fs.readFileSync('.env', 'utf8');
                const lines = envContent.split('\n');
                
                lines.forEach(line => {
                    const [key, ...valueParts] = line.split('=');
                    const value = valueParts.join('=').trim();
                    if (key && value) {
                        process.env[key.trim()] = value;
                    }
                });
            }

            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            if (!token) {
                console.log('⚠️  Telegram não configurado. Execute: node telegram-notifier.js setup');
                return;
            }

            this.bot = new TelegramBot(token, { polling: false }); // Desabilitar polling para evitar conflitos
            this.chatId = chatId;
            this.enabled = true;

            // Não imprimir mensagem aqui - será feito no getTelegramNotifier
            
            // Configurar comandos
            this.setupCommands();
            
            // Se não tem chatId, aguardar primeiro /start
            if (!chatId) {
                console.log('📱 Envie /start no bot para completar configuração');
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar Telegram:', error.message);
            this.enabled = false;
        }
    }

    // Configurar comandos do bot
    setupCommands() {
        if (!this.bot) return;

        // Comando /start - Obter chat ID
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            
            // Salvar chatId no .env
            this.chatId = chatId;
            this.updateEnvFile('TELEGRAM_CHAT_ID', chatId);
            
            this.bot.sendMessage(chatId, 
                '🎉 *MacDavis Motos - Notificações Ativadas!*\n\n' +
                '✅ Você receberá notificações sobre:\n' +
                '• Novos agendamentos\n' +
                '• Cancelamentos\n' +
                '• Alterações de status\n\n' +
                '*Comandos disponíveis:*\n' +
                '/status - Ver estatísticas\n' +
                '/hoje - Agendamentos de hoje\n' +
                '/ajuda - Lista de comandos',
                { parse_mode: 'Markdown' }
            );
        });

        // Comando /status
        this.bot.onText(/\/status/, (msg) => {
            if (msg.chat.id.toString() !== this.chatId?.toString()) return;
            
            this.sendStatus();
        });

        // Comando /hoje
        this.bot.onText(/\/hoje/, (msg) => {
            if (msg.chat.id.toString() !== this.chatId?.toString()) return;
            
            this.sendTodayAppointments();
        });

        // Comando /ajuda
        this.bot.onText(/\/ajuda/, (msg) => {
            if (msg.chat.id.toString() !== this.chatId?.toString()) return;
            
            this.bot.sendMessage(msg.chat.id,
                '*📋 Comandos Disponíveis:*\n\n' +
                '/status - Estatísticas do sistema\n' +
                '/hoje - Agendamentos de hoje\n' +
                '/ajuda - Esta mensagem\n\n' +
                '_As notificações são enviadas automaticamente!_',
                { parse_mode: 'Markdown' }
            );
        });
    }

    // Atualizar arquivo .env
    updateEnvFile(key, value) {
        try {
            let envContent = '';
            
            if (fs.existsSync('.env')) {
                envContent = fs.readFileSync('.env', 'utf8');
            }

            const lines = envContent.split('\n');
            let found = false;

            const newLines = lines.map(line => {
                if (line.startsWith(key + '=')) {
                    found = true;
                    return `${key}=${value}`;
                }
                return line;
            });

            if (!found) {
                newLines.push(`${key}=${value}`);
            }

            fs.writeFileSync('.env', newLines.join('\n'));
            console.log(`✅ ${key} salvo em .env`);
        } catch (error) {
            console.error('❌ Erro ao atualizar .env:', error.message);
        }
    }

    // Enviar notificação de novo agendamento
    async notifyNewAppointment(appointment) {
        if (!this.enabled || !this.chatId) return;

        try {
            const message = this.formatAppointmentMessage('novo', appointment);
            
            const result = await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log('✅ Notificação enviada:', appointment.id);
            console.log(`📱 Telegram API respondeu: Chat ID ${result.chat.id} - Message ID ${result.message_id}`);
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error.message);
        }
    }

    // Enviar notificação de cancelamento
    async notifyCancellation(appointment) {
        if (!this.enabled || !this.chatId) return;

        try {
            const message = this.formatAppointmentMessage('cancelado', appointment);
            
            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown'
            });

            console.log('✅ Notificação de cancelamento enviada:', appointment.id);
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error.message);
        }
    }

    // Enviar notificação de cancelamento pelo cliente
    async notifyCanceledAppointment(appointment) {
        if (!this.enabled || !this.chatId) return;

        try {
            const date = appointment.date || appointment.data;
            const time = appointment.time || appointment.horario;
            const name = appointment.name || appointment.cliente;
            const phone = appointment.phone || appointment.telefone;
            
            const message = 
                `🚫 *CLIENTE CANCELOU AGENDAMENTO*\n\n` +
                `👤 *Cliente:* ${name}\n` +
                `📞 *Telefone:* ${phone}\n` +
                `📅 *Data:* ${this.formatDate(date)}\n` +
                `⏰ *Horário:* ${time}\n` +
                `📝 *Motivo:* ${appointment.cancelReason || 'Não informado'}\n` +
                `👥 *Cancelado por:* ${appointment.canceledBy || 'Cliente'}\n` +
                `\n_ID: ${appointment.id}_`;
            
            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown'
            });

            console.log('✅ Notificação de cancelamento cliente enviada:', appointment.id);
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error.message);
        }
    }

    // Enviar notificação de alteração de status
    async notifyStatusChange(appointment, oldStatus, newStatus) {
        if (!this.enabled || !this.chatId) return;

        try {
            const statusEmoji = {
                'pendente': '⏳',
                'confirmado': '✅',
                'realizado': '🎉',
                'cancelado': '❌'
            };

            const message = 
                `${statusEmoji[newStatus] || '📝'} *Status Alterado*\n\n` +
                `👤 Cliente: ${appointment.name}\n` +
                `📅 Data: ${this.formatDate(appointment.date || appointment.data)}\n` +
                `⏰ Horário: ${appointment.time || appointment.horario}\n\n` +
                `De: ${statusEmoji[oldStatus]} ${oldStatus}\n` +
                `Para: ${statusEmoji[newStatus]} *${newStatus}*`;

            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown'
            });

            console.log('✅ Notificação de alteração enviada:', appointment.id);
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error.message);
        }
    }

    // Formatar mensagem de agendamento
    formatAppointmentMessage(type, appointment) {
        const date = appointment.date || appointment.data;
        const time = appointment.time || appointment.horario;
        const motorcycle = appointment.motorcycle || appointment.servico || appointment.servicoId;
        const name = appointment.name || appointment.cliente;
        const phone = appointment.phone || appointment.telefone;
        const notes = appointment.notes || appointment.observacoes;

        if (type === 'novo') {
            return `🆕 *NOVO AGENDAMENTO!*\n\n` +
                   `👤 *Cliente:* ${name}\n` +
                   `📞 *Telefone:* ${phone}\n` +
                   `🏍️ *Moto:* ${this.getMotoName(motorcycle)}\n` +
                   `📅 *Data:* ${this.formatDate(date)}\n` +
                   `⏰ *Horário:* ${time}\n` +
                   (notes ? `📝 *Obs:* ${notes}\n` : '') +
                   `\n_ID: ${appointment.id}_`;
        } else if (type === 'cancelado') {
            return `❌ *AGENDAMENTO CANCELADO*\n\n` +
                   `👤 Cliente: ${name}\n` +
                   `📅 Data: ${this.formatDate(date)}\n` +
                   `⏰ Horário: ${time}\n` +
                   `\n_ID: ${appointment.id}_`;
        }
    }

    // Formatar data
    formatDate(dateStr) {
        if (!dateStr) return 'Data não informada';
        
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    // Obter nome da moto
    getMotoName(motoId) {
        try {
            const motorcycles = JSON.parse(fs.readFileSync('motorcycles.json', 'utf8'));
            const moto = motorcycles.find(m => m.id === motoId);
            
            if (moto) {
                return `${moto.name} - ${moto.year} (${moto.color})`;
            }
            return motoId;
        } catch (error) {
            return motoId;
        }
    }

    // Enviar status do sistema
    async sendStatus() {
        try {
            const appointments = JSON.parse(fs.readFileSync('data.json', 'utf8'));
            
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(a => 
                (a.date || a.data) === today && 
                a.status !== 'cancelado' && 
                a.status !== 'realizado'
            );

            const pendentes = appointments.filter(a => a.status === 'pendente').length;
            const confirmados = appointments.filter(a => a.status === 'confirmado').length;

            const message = 
                `📊 *Status do Sistema*\n\n` +
                `📅 *Hoje (${this.formatDate(today)}):*\n` +
                `   ${todayAppointments.length} agendamento(s)\n\n` +
                `📋 *Geral:*\n` +
                `   ⏳ Pendentes: ${pendentes}\n` +
                `   ✅ Confirmados: ${confirmados}\n` +
                `   📝 Total: ${appointments.length}`;

            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error('❌ Erro ao enviar status:', error.message);
        }
    }

    // Enviar agendamentos de hoje
    async sendTodayAppointments() {
        try {
            const appointments = JSON.parse(fs.readFileSync('data.json', 'utf8'));
            const today = new Date().toISOString().split('T')[0];
            
            const todayAppointments = appointments.filter(a => 
                (a.date || a.data) === today && 
                a.status !== 'cancelado'
            ).sort((a, b) => {
                const timeA = a.time || a.horario;
                const timeB = b.time || b.horario;
                return timeA.localeCompare(timeB);
            });

            if (todayAppointments.length === 0) {
                await this.bot.sendMessage(this.chatId, 
                    `📅 *Agendamentos de Hoje*\n\n` +
                    `Nenhum agendamento para ${this.formatDate(today)}`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            let message = `📅 *Agendamentos de Hoje (${this.formatDate(today)})*\n\n`;

            todayAppointments.forEach((apt, index) => {
                const statusEmoji = {
                    'pendente': '⏳',
                    'confirmado': '✅',
                    'realizado': '🎉'
                };
                const time = apt.time || apt.horario;
                const emoji = statusEmoji[apt.status] || '📝';
                
                message += `${emoji} *${time}* - ${apt.name}\n`;
                message += `   ${this.getMotoName(apt.motorcycle || apt.servico)}\n`;
                if (index < todayAppointments.length - 1) message += '\n';
            });

            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error('❌ Erro ao enviar agendamentos:', error.message);
        }
    }
}

// Exportar instância única
const notifier = new TelegramNotifier();

module.exports = notifier;

// Se executado diretamente, mostrar instruções
if (require.main === module) {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   📱 TELEGRAM NOTIFIER - MacDavis Motos              ║
╚═══════════════════════════════════════════════════════╝

📋 CONFIGURAÇÃO INICIAL:

1️⃣  Criar Bot no Telegram:
   • Abra o Telegram e busque: @BotFather
   • Envie: /newbot
   • Escolha um nome: MacDavis Notificações
   • Escolha um username: macdavis_notif_bot
   • Copie o TOKEN que ele fornecer

2️⃣  Configurar no Sistema:
   • Crie arquivo .env na raiz do projeto
   • Adicione: TELEGRAM_BOT_TOKEN=seu_token_aqui

3️⃣  Obter seu Chat ID:
   • Inicie o servidor: node server-client.js
   • Envie /start para o bot no Telegram
   • O sistema salvará automaticamente seu Chat ID

✅ Pronto! As notificações funcionarão automaticamente.

═══════════════════════════════════════════════════════

Para mais informações, leia: TELEGRAM-SETUP.md
`);
}

// Singleton instance
let notifierInstance = null;

function getTelegramNotifier() {
    if (!notifierInstance) {
        console.log('🔧 Criando nova instância do TelegramNotifier...');
        notifierInstance = new TelegramNotifier();
        if (notifierInstance.enabled) {
            console.log('✅ Telegram Bot inicializado (modo envio apenas)!');
        }
    } else {
        console.log('♻️  Reutilizando instância existente do TelegramNotifier');
    }
    return notifierInstance;
}

// Exportar classe e função singleton
module.exports = { TelegramNotifier, getTelegramNotifier };

// Se executado diretamente
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'setup') {
        showSetupInstructions();
    } else if (command === 'test') {
        const notifier = getTelegramNotifier();
        setTimeout(() => {
            notifier.sendNewAppointmentNotification({
                id: 'TEST-001',
                cliente: 'Cliente Teste',
                telefone: '11999999999',
                moto: 'Honda CG 125 Fan KS',
                data: '24/01/2026',
                horario: '10:00'
            });
        }, 2000);
    } else {
        console.log('Uso: node telegram-notifier.js [setup|test]');
    }
}
