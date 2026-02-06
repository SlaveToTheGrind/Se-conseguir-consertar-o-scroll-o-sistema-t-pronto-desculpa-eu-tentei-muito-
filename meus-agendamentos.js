// meus-agendamentos.js - Cliente gerencia seus próprios agendamentos
console.log('📱 Meus Agendamentos - Cliente iniciado');

// Usar caminho relativo para funcionar no celular também
const API_BASE = '';
let allAppointments = []; // Armazenar todos os agendamentos
let currentFilter = 'pendente'; // Filtro atual
let motorcyclesData = []; // Armazenar dados das motos
let autoRefreshInterval = null; // Controlar atualização automática
let isPageVisible = true; // Controlar visibilidade da página

// Máscara de telefone
document.getElementById('phoneInput')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    
    e.target.value = value;
});

// Buscar motos do catálogo
async function loadMotorcycles() {
    try {
        const response = await fetch(`${API_BASE}/api/motorcycles`);
        if (response.ok) {
            motorcyclesData = await response.json();
            console.log('✅ Motos carregadas:', motorcyclesData.length);
        }
    } catch (error) {
        console.error('Erro ao carregar motos:', error);
    }
}

// Função para obter nome da moto pelo ID
function getMotorcycleName(motorcycleId) {
    if (!motorcycleId) return null;
    const moto = motorcyclesData.find(m => m.id === motorcycleId);
    return moto ? `${moto.marca} ${moto.modelo} ${moto.ano}` : null;
}

// Permitir buscar com Enter
document.addEventListener('DOMContentLoaded', function() {
    // Carregar motos primeiro
    loadMotorcycles();
    
    const phoneInput = document.getElementById('phoneInput');
    
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAppointments();
            }
        });
        
        // Auto-preencher telefone salvo
        const savedPhone = localStorage.getItem('lastSearchPhone');
        if (savedPhone) {
            phoneInput.value = savedPhone;
        }
    }
});

// Buscar agendamentos por telefone
async function searchAppointments() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    if (!phone) {
        Toast.show('⚠️ Digite seu telefone', 'warning');
        phoneInput.focus();
        return;
    }
    
    const listContainer = document.getElementById('appointmentsList');
    listContainer.innerHTML = '<div class="loading">Buscando agendamentos</div>';
    
    try {
        // Adicionar timestamp para forçar nova requisição (evitar cache)
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE}/api/appointments?_=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar agendamentos');
        }
        
        const allAppointments = await response.json();
        
        console.log('📦 Total de agendamentos carregados:', allAppointments.length);
        
        // Normalizar telefone para comparação (remove caracteres especiais)
        const normalizedPhone = phone.replace(/\D/g, '');
        
        // Filtrar agendamentos do cliente (suporta campos PT e EN)
        const myAppointments = allAppointments.filter(apt => {
            const aptPhone = (apt.phone || apt.telefone || '').replace(/\D/g, '');
            return aptPhone === normalizedPhone;
        });
        
        console.log('📋 Agendamentos do cliente:', myAppointments.length);
        console.log('🔍 Status dos agendamentos:', myAppointments.map(a => ({ id: a.id, status: a.status })));
        
        if (myAppointments.length === 0) {
            showEmptyState();
            return;
        }
        
        // Ordenar por data (mais recentes primeiro) - suporta PT e EN
        myAppointments.sort((a, b) => {
            const dateA = new Date((a.date || a.data) + ' ' + (a.time || a.horario));
            const dateB = new Date((b.date || b.data) + ' ' + (b.time || b.horario));
            return dateB - dateA;
        });
        
        displayAppointments(myAppointments);
        Toast.show(`✅ ${myAppointments.length} agendamento(s) encontrado(s)`, 'success');
        
        // Ocultar seção de informações quando há resultados
        const infoSection = document.getElementById('infoSection');
        if (infoSection) {
            infoSection.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erro ao buscar:', error);
        listContainer.innerHTML = '';
        Toast.show('❌ ' + error.message, 'error');
    }
}

function displayAppointments(appointments) {
    // Armazenar todos os agendamentos
    allAppointments = appointments;
    
    // Atualizar contadores
    updateFilterCounts();
    
    // Mostrar filtros
    const filterTabs = document.getElementById('filterTabs');
    if (filterTabs) {
        filterTabs.style.display = 'flex';
    }
    
    // Aplicar filtro atual
    const filteredAppointments = filterAppointmentsByStatus(appointments, currentFilter);
    
    const listContainer = document.getElementById('appointmentsList');
    
    if (filteredAppointments.length === 0) {
        showEmptyFilterState(currentFilter);
        return;
    }
    
    listContainer.innerHTML = filteredAppointments.map(apt => {
        // Suportar campos PT e EN
        const date = apt.date || apt.data;
        const time = apt.time || apt.horario;
        const name = apt.name || apt.cliente;
        const phone = apt.phone || apt.telefone;
        const motorcycle = apt.motorcycle || apt.servicoId;
        const notes = apt.notes || apt.observacoes;
        // Normalizar status: agendado = pendente
        let status = apt.status || 'pendente';
        if (status === 'agendado') status = 'pendente';
        
        // Buscar nome da moto
        const motorcycleName = getMotorcycleName(motorcycle);
        
        const dateTime = new Date(date + ' ' + time);
        const now = new Date();
        const isPast = dateTime < now;
        const canManage = !isPast && status === 'pendente';
        const canConfirm = !isPast && status === 'pendente';
        
        // Formatar data
        const dateFormatted = new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Status em português
        const statusMap = {
            'pendente': '⏳ Pendente',
            'agendado': '⏳ Pendente',
            'confirmado': '✅ Confirmado',
            'realizado': '✔️ Realizado',
            'cancelado': '❌ Cancelado'
        };
        
        const statusText = statusMap[status] || status;
        
        return `
            <div class="appointment-card ${status}">
                <div class="status-badge ${status}">${statusText}</div>
                
                <div class="appointment-info">
                    <div class="info-row">
                        <span class="info-icon">👤</span>
                        <span><strong>${name}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📞</span>
                        <span>${phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📅</span>
                        <span>${dateFormatted}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">⏰</span>
                        <span>${time}</span>
                    </div>
                    
                    ${motorcycle ? `
                        <div class="motorcycle-info">
                            <div class="info-row">
                                <span class="info-icon">🏍️</span>
                                <span><strong>Moto de Interesse</strong></span>
                            </div>
                            <div style="margin-top: 8px; padding-left: 34px; color: rgba(255,255,255,0.8); font-size: 0.95em;">
                                ${motorcycleName || `ID: ${motorcycle}`}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${notes ? `
                        <div class="info-row">
                            <span class="info-icon">📝</span>
                            <span>${notes}</span>
                        </div>
                    ` : ''}
                    
                    ${status === 'confirmado' && apt.confirmedAt ? `
                        <div class="info-row" style="color: #28a745; font-size: 0.9em; margin-top: 10px;">
                            <span class="info-icon">✓</span>
                            <span>Confirmado em ${new Date(apt.confirmedAt).toLocaleString('pt-BR')}</span>
                        </div>
                        <div style="margin-top: 10px;">
                            <button onclick="copyAppointmentId('${apt.id}')" 
                                    style="width: 100%; padding: 8px 12px; background: rgba(255,122,24,0.15); border: 1px solid rgba(255,122,24,0.4); border-radius: 6px; color: #ff7a18; cursor: pointer; font-size: 0.9em; font-weight: 500; transition: all 0.2s;"
                                    onmouseover="this.style.background='rgba(255,122,24,0.25)'; this.style.borderColor='rgba(255,122,24,0.6)'"
                                    onmouseout="this.style.background='rgba(255,122,24,0.15)'; this.style.borderColor='rgba(255,122,24,0.4)'">
                                📋 Copiar ID para Admin
                            </button>
                        </div>
                    ` : ''}
                    
                    ${status === 'cancelado' && apt.canceledAt ? `
                        <div class="info-row" style="color: #dc3545; font-size: 0.9em; margin-top: 10px;">
                            <span class="info-icon">✗</span>
                            <span>Cancelado em ${new Date(apt.canceledAt).toLocaleString('pt-BR')}</span>
                        </div>
                        ${apt.cancelReason ? `
                            <div class="info-row" style="padding-left: 34px; font-size: 0.9em; color: #666;">
                                Motivo: ${apt.cancelReason}
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
                
                ${canManage ? `
                    <div class="appointment-actions">
                        ${canConfirm ? `
                            <button class="btn-action btn-confirm" onclick="confirmAppointment('${apt.id}')">
                                ✅ Confirmar Presença
                            </button>
                        ` : ''}
                        <button class="btn-action btn-cancel" onclick="cancelAppointment('${apt.id}')">
                            ❌ Cancelar Agendamento
                        </button>
                    </div>
                ` : ''}
                
                ${isPast && status === 'pendente' ? `
                    <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 8px; color: #856404; font-size: 0.9em;">
                        ⚠️ Este agendamento já passou
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function showEmptyState() {
    const listContainer = document.getElementById('appointmentsList');
    listContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h2>Nenhum agendamento encontrado</h2>
            <p>Não encontramos agendamentos com este telefone.</p>
            <p style="margin-top: 20px;">
                <a href="agendamento.html" style="color: white; text-decoration: underline;">
                    Agendar uma visita
                </a>
            </p>
        </div>
    `;
    
    // Mostrar seção de informações novamente
    const infoSection = document.getElementById('infoSection');
    if (infoSection) {
        infoSection.style.display = 'block';
    }
}

// Confirmar presença
async function confirmAppointment(appointmentId) {
    const confirmed = await ModalDialog.confirm({
        title: 'Confirmar Presença',
        message: 'Você confirma que comparecerá neste horário marcado?',
        icon: '✅',
        type: 'success',
        confirmText: 'Sim, Confirmo',
        cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/confirm`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirmedBy: 'Cliente'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao confirmar');
        }
        
        await ModalDialog.success('Sua presença foi confirmada com sucesso!', 'Confirmado!');
        
        // Atualizar lista
        searchAppointments();
        
    } catch (error) {
        console.error('Erro ao confirmar:', error);
        await ModalDialog.error(error.message || 'Não foi possível confirmar o agendamento');
    }
}

// Cancelar agendamento
async function cancelAppointment(appointmentId) {
    const confirmed = await ModalDialog.confirm({
        title: 'Cancelar Agendamento',
        message: 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.',
        icon: '❌',
        type: 'error',
        confirmText: 'Sim, Cancelar',
        cancelText: 'Não Cancelar'
    });
    
    if (!confirmed) return;
    
    // Solicitar motivo
    const reason = await ModalDialog.prompt({
        title: 'Motivo do Cancelamento',
        message: 'Por favor, informe o motivo do cancelamento para que possamos melhorar nossos serviços:',
        placeholder: 'Ex: Surgiram outros compromissos...',
        icon: '✏️',
        type: 'warning',
        multiline: true,
        required: true,
        confirmText: 'Confirmar Cancelamento',
        cancelText: 'Voltar'
    });
    
    if (!reason) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cancelReason: reason,
                canceledBy: 'Cliente'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao cancelar');
        }
        
        await ModalDialog.success('Agendamento cancelado. Agradecemos pelo aviso!', 'Cancelado!');
        
        // Atualizar lista
        searchAppointments();
        
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        await ModalDialog.error(error.message || 'Não foi possível cancelar o agendamento');
    }
}

// Copiar ID do agendamento para a área de transferência
async function copyAppointmentId(appointmentId) {
    try {
        await navigator.clipboard.writeText(appointmentId);
        Toast.show('✅ ID copiado! Cole no admin para encontrar o agendamento.', 'success', 3000);
    } catch (error) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = appointmentId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            Toast.show('✅ ID copiado! Cole no admin para encontrar o agendamento.', 'success', 3000);
        } catch (err) {
            Toast.show('❌ Não foi possível copiar. ID: ' + appointmentId, 'error', 5000);
        }
        document.body.removeChild(textArea);
    }
}

// Auto-buscar se houver telefone salvo no localStorage
window.addEventListener('load', () => {
    const savedPhone = localStorage.getItem('lastSearchPhone');
    const phoneInput = document.getElementById('phoneInput');
    
    if (savedPhone && phoneInput) {
        phoneInput.value = savedPhone;
        // Auto-buscar após 500ms
        setTimeout(() => {
            if (phoneInput.value.trim()) {
                searchAppointments();
            }
        }, 500);
    }
    
    // Iniciar atualização automática
    startAutoRefresh();
});

// Detectar quando a aba fica visível/invisível para pausar atualizações
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    console.log('👁️ Página', isPageVisible ? 'visível' : 'oculta');
    
    if (isPageVisible && allAppointments.length > 0) {
        // Atualizar imediatamente quando voltar para a aba
        refreshAppointmentsSilently();
    }
});

// Salvar telefone buscado
const originalSearch = searchAppointments;
searchAppointments = async function() {
    const phone = document.getElementById('phoneInput').value.trim();
    if (phone) {
        localStorage.setItem('lastSearchPhone', phone);
    }
    await originalSearch();
};

// Atualizar contadores dos filtros
function updateFilterCounts() {
    if (allAppointments.length === 0) return;
    
    const pendentes = allAppointments.filter(a => {
        const status = a.status || 'pendente';
        return status === 'pendente' || status === 'agendado';
    }).length;
    
    const realizados = allAppointments.filter(a => a.status === 'realizado').length;
    const cancelados = allAppointments.filter(a => a.status === 'cancelado').length;
    const confirmados = allAppointments.filter(a => a.status === 'confirmado').length;
    const todos = allAppointments.length;
    
    // Atualizar contadores na UI
    const countPendente = document.getElementById('count-pendente');
    const countTodos = document.getElementById('count-todos');
    const countRealizado = document.getElementById('count-realizado');
    const countCancelado = document.getElementById('count-cancelado');
    const countConfirmado = document.getElementById('count-confirmado');
    
    if (countPendente) countPendente.textContent = `(${pendentes})`;
    if (countTodos) countTodos.textContent = `(${todos})`;
    if (countRealizado) countRealizado.textContent = `(${realizados})`;
    if (countCancelado) countCancelado.textContent = `(${cancelados})`;
    if (countConfirmado) countConfirmado.textContent = `(${confirmados})`;
    
    console.log('📊 Contadores atualizados:', { pendentes, confirmados, realizados, cancelados, todos });
}

// Filtrar agendamentos por status
function filterAppointmentsByStatus(appointments, status) {
    if (status === 'todos') {
        return appointments;
    }
    
    if (status === 'pendente') {
        return appointments.filter(a => {
            const aptStatus = a.status || 'pendente';
            return aptStatus === 'pendente' || aptStatus === 'agendado';
        });
    }
    
    return appointments.filter(a => a.status === status);
}

// Filtrar por status (callback dos botões)
function filterByStatus(status) {
    console.log('🔍 Filtrando por status:', status);
    currentFilter = status;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-tab').forEach(btn => {
        if (btn.getAttribute('data-status') === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Re-renderizar com filtro
    if (allAppointments.length > 0) {
        const filtered = filterAppointmentsByStatus(allAppointments, status);
        
        const listContainer = document.getElementById('appointmentsList');
        
        if (filtered.length === 0) {
            showEmptyFilterState(status);
            return;
        }
        
        listContainer.innerHTML = filtered.map(apt => {
            // Suportar campos PT e EN
            const date = apt.date || apt.data;
            const time = apt.time || apt.horario;
            const name = apt.name || apt.cliente;
            const phone = apt.phone || apt.telefone;
            const motorcycle = apt.motorcycle || apt.servicoId;
            const notes = apt.notes || apt.observacoes;
            // Normalizar status: agendado = pendente
            let aptStatus = apt.status || 'pendente';
            if (aptStatus === 'agendado') aptStatus = 'pendente';
            
            // Buscar nome da moto
            const motorcycleName = getMotorcycleName(motorcycle);
            
            const dateTime = new Date(date + ' ' + time);
            const now = new Date();
            const isPast = dateTime < now;
            const canManage = !isPast && aptStatus === 'pendente';
            const canConfirm = !isPast && aptStatus === 'pendente';
            
            // Formatar data
            const dateFormatted = new Date(date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            
            // Status em português
            const statusMap = {
                'pendente': '⏳ Pendente',
                'agendado': '⏳ Pendente',
                'confirmado': '✅ Confirmado',
                'realizado': '✔️ Realizado',
                'cancelado': '❌ Cancelado'
            };
            
            const statusText = statusMap[aptStatus] || aptStatus;
            
            return `
                <div class="appointment-card ${aptStatus}">
                    <div class="status-badge ${aptStatus}">${statusText}</div>
                    
                    <div class="appointment-info">
                        <div class="info-row">
                            <span class="info-icon">👤</span>
                            <span><strong>${name}</strong></span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📞</span>
                            <span>${phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">📅</span>
                            <span>${dateFormatted}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-icon">⏰</span>
                            <span>${time}</span>
                        </div>
                        
                        ${motorcycle ? `
                            <div class="motorcycle-info">
                                <div class="info-row">
                                    <span class="info-icon">🏍️</span>
                                    <span><strong>Moto de Interesse</strong></span>
                                </div>
                                <div style="margin-top: 8px; padding-left: 34px; color: rgba(255,255,255,0.8); font-size: 0.95em;">
                                    ${motorcycleName || `ID: ${motorcycle}`}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${notes ? `
                            <div class="info-row">
                                <span class="info-icon">📝</span>
                                <span>${notes}</span>
                            </div>
                        ` : ''}
                        
                        ${aptStatus === 'confirmado' && apt.confirmedAt ? `
                            <div class="info-row" style="color: #28a745; font-size: 0.9em; margin-top: 10px;">
                                <span class="info-icon">✓</span>
                                <span>Confirmado em ${new Date(apt.confirmedAt).toLocaleString('pt-BR')}</span>
                            </div>
                        ` : ''}
                        
                        ${aptStatus === 'cancelado' && apt.canceledAt ? `
                            <div class="info-row" style="color: #dc3545; font-size: 0.9em; margin-top: 10px;">
                                <span class="info-icon">✗</span>
                                <span>Cancelado em ${new Date(apt.canceledAt).toLocaleString('pt-BR')}</span>
                            </div>
                            ${apt.cancelReason ? `
                                <div class="info-row" style="padding-left: 34px; font-size: 0.9em; color: #666;">
                                    Motivo: ${apt.cancelReason}
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                    
                    ${canManage ? `
                        <div class="appointment-actions">
                            ${canConfirm ? `
                                <button class="btn-action btn-confirm" onclick="confirmAppointment('${apt.id}')">
                                    ✅ Confirmar Presença
                                </button>
                            ` : ''}
                            <button class="btn-action btn-cancel" onclick="cancelAppointment('${apt.id}')">
                                ❌ Cancelar Agendamento
                            </button>
                        </div>
                    ` : ''}
                    
                    ${isPast && aptStatus === 'pendente' ? `
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 8px; color: #856404; font-size: 0.9em;">
                            ⚠️ Este agendamento já passou
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
}

// ========== ATUALIZAÇÃO AUTOMÁTICA ==========

// Iniciar atualização automática inteligente
function startAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Atualizar a cada 45 segundos (leve e não invasivo)
    autoRefreshInterval = setInterval(() => {
        // Só atualizar se:
        // 1. A página estiver visível
        // 2. Houver agendamentos carregados
        if (isPageVisible && allAppointments.length > 0) {
            refreshAppointmentsSilently();
        }
    }, 45000); // 45 segundos
    
    console.log('🔄 Atualização automática ativada (45s)');
}

// Atualizar agendamentos silenciosamente (sem loaders ou mensagens)
async function refreshAppointmentsSilently() {
    try {
        const phoneInput = document.getElementById('phoneInput');
        const phone = phoneInput?.value.trim();
        
        if (!phone) return; // Não há telefone para buscar
        
        console.log('🔄 Atualizando agendamentos silenciosamente...');
        
        // Adicionar timestamp para forçar nova requisição (evitar cache)
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE}/api/appointments?_=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) return; // Falha silenciosa
        
        const allAppointmentsFromAPI = await response.json();
        
        // Normalizar telefone para comparação
        const normalizedPhone = phone.replace(/\D/g, '');
        
        // Filtrar agendamentos do cliente
        const myAppointments = allAppointmentsFromAPI.filter(apt => {
            const aptPhone = (apt.phone || apt.telefone || '').replace(/\D/g, '');
            return aptPhone === normalizedPhone;
        });
        
        // Verificar se houve mudanças
        const hasChanges = JSON.stringify(myAppointments) !== JSON.stringify(allAppointments);
        
        if (hasChanges) {
            console.log('✨ Mudanças detectadas, atualizando interface...');
            console.log('🔍 Novos status:', myAppointments.map(a => ({ id: a.id, status: a.status })));
            
            // Ordenar por data
            myAppointments.sort((a, b) => {
                const dateA = new Date((a.date || a.data) + ' ' + (a.time || a.horario));
                const dateB = new Date((b.date || b.data) + ' ' + (b.time || b.horario));
                return dateB - dateA;
            });
            
            // Atualizar interface sem mensagens
            displayAppointments(myAppointments);
        } else {
            console.log('✓ Nenhuma mudança detectada');
        }
        
    } catch (error) {
        // Falha silenciosa - não mostrar erro ao usuário
        console.log('⚠️ Erro na atualização automática (ignorado):', error.message);
    }
}

// Parar atualização automática (útil se o usuário sair da página)
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('🛑 Atualização automática pausada');
    }
}

// Pausar quando sair da página
window.addEventListener('beforeunload', stopAutoRefresh);

// Mostrar estado vazio para filtro
function showEmptyFilterState(filter) {
    const listContainer = document.getElementById('appointmentsList');
    
    const messages = {
        'pendente': '⏳ Nenhum agendamento pendente',
        'confirmado': '✅ Nenhum agendamento confirmado',
        'todos': '📭 Nenhum agendamento encontrado',
        'realizado': '✔️ Nenhum agendamento realizado',
        'cancelado': '❌ Nenhum agendamento cancelado'
    };
    
    listContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h2>${messages[filter] || 'Nenhum agendamento'}</h2>
            <p>Não há agendamentos nesta categoria.</p>
        </div>
    `;
}
