// JavaScript do Painel Admin
let currentMotos = [];
let editingMoto = null;
let selectedMonthFilter = 'all'; // Armazenar o mês selecionado no filtro
let savedScrollPosition = 0; // Posição de scroll para restaurar após reload

// ===== FUNÇÕES DE LOADING =====
function showAdminLoading(message = 'Processando') {
    console.log('🎬 showAdminLoading chamado:', message);
    const overlay = document.getElementById('adminLoadingOverlay');
    const text = document.getElementById('adminLoadingText');
    console.log('Overlay:', overlay, 'Text:', text);
    if (overlay && text) {
        text.innerHTML = `${message}<span class="loading-dots"><span></span><span></span><span></span></span>`;
        overlay.classList.add('show');
        console.log('✅ Loading mostrado');
    } else {
        console.error('❌ Elementos de loading não encontrados!');
    }
}

function hideAdminLoading() {
    console.log('🎬 hideAdminLoading chamado');
    const overlay = document.getElementById('adminLoadingOverlay');
    if (overlay) {
        setTimeout(() => {
            overlay.classList.remove('show');
            console.log('✅ Loading escondido');
        }, 400);
    }
}

// Função para formatar números com pontos de milhar
function formatarNumero(numero) {
    if (!numero && numero !== 0) return '0';
    // Remover pontos existentes e converter para número
    const num = typeof numero === 'string' ? parseInt(numero.replace(/\./g, '')) : numero;
    // Formatar com pontos de milhar
    return num.toLocaleString('pt-BR');
}

// Tratamento global de erros
window.addEventListener('error', function(event) {
    console.error('❌ [GLOBAL ERROR]:', event.error);
    console.error('❌ [STACK]:', event.error?.stack);
});

// Verificar autenticação de administrador
function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        console.log('❌ Usuário não autenticado');
        window.location.href = 'login.html';
        return false;
    }
    
    const user = JSON.parse(userData);
    if (user.tipo !== 'admin') {
        console.log('❌ Acesso negado! Tipo de usuário:', user.tipo);
        alert('❌ Acesso negado! Esta área é apenas para administradores.');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ Admin autenticado:', user.nome);
    return true;
}

// Variável para controlar o auto-refresh
let autoRefreshInterval = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 [DEBUG] Admin panel inicializando...');
    // Verificar autenticação antes de carregar o painel
    if (!checkAdminAuth()) {
        return;
    }
    
    console.log('🔍 [DEBUG] Autenticação OK, carregando dados...');
    loadMotos();
    loadAppointments();
    loadStats();
    setupEventListeners();
    
    // Iniciar auto-refresh imediatamente
    console.log('🚀 [INIT] Iniciando auto-refresh dos agendamentos...');
    startAutoRefresh();
});

// Event Listeners
function setupEventListeners() {
    // Submissão do formulário
    const motorcycleForm = document.getElementById('motorcycleForm');
    if (motorcycleForm) {
        motorcycleForm.addEventListener('submit', handleMotoSubmit);
    } else {
        console.error('❌ Formulário motorcycleForm não encontrado!');
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMotos(this.dataset.categoria);
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchMotos, 300));
    }
    
    // Estilo filter
    const estiloFilter = document.getElementById('estiloFilter');
    if (estiloFilter) {
        estiloFilter.addEventListener('change', applyAllFilters);
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyAllFilters);
    }
    
    // Marca filter
    const marcaFilter = document.getElementById('marcaFilter');
    if (marcaFilter) {
        marcaFilter.addEventListener('change', applyAllFilters);
    }
    
    // Cilindrada filter
    const cilindradaFilter = document.getElementById('cilindradaFilter');
    if (cilindradaFilter) {
        cilindradaFilter.addEventListener('change', applyAllFilters);
    }
    
    // Upload de imagem via arrastar e soltar
    setupImageUpload();
    
    // Eventos do modal de visualização
    const viewModalElement = document.getElementById('viewModal');
    if (viewModalElement) {
        viewModalElement.addEventListener('click', function(e) {
            if (e.target === this) {
                closeViewModal();
            }
        });
        console.log('✅ Event listener do viewModal adicionado');
    } else {
        console.error('❌ Elemento viewModal não encontrado!');
    }
    
    // Eventos de teclado para fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const motorcycleModal = document.getElementById('motorcycleModal');
            if (motorcycleModal && motorcycleModal.classList.contains('active')) {
                closeModal();
            }
            const viewModalCheck = document.getElementById('viewModal');
            if (viewModalCheck && viewModalCheck.classList.contains('active')) {
                closeViewModal();
            }
        }
    });
}

// Carregar motocicletas do endpoint correto
async function loadMotos() {
    try {
        showLoading();
        console.log('🔄 Carregando motocicletas...');
        
        const response = await fetch('/api/motorcycles');
        if (!response.ok) {
            throw new Error('Erro ao carregar motocicletas: ' + response.status);
        }
        
        currentMotos = await response.json();
        console.log('✅ Motocicletas carregadas:', currentMotos.length);
        
        // Atualizar contadores
        updateCounters(currentMotos);
        
        // Preencher filtro de marcas
        populateMarcaFilter(currentMotos);
        
        // Garantir que o filtro padrão seja "disponivel" no primeiro carregamento
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter && !statusFilter.dataset.initialized) {
            statusFilter.value = 'disponivel';
            statusFilter.dataset.initialized = 'true';
        }
        
        // Aplicar filtros ativos ao invés de mostrar todas
        applyAllFilters();
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar motos:', error);
        showMessage('Erro ao carregar motocicletas: ' + error.message, 'error');
        hideLoading();
    }
}

// Função para atualizar contadores
function updateCounters(motos) {
    const total = motos.length;
    const disponiveis = motos.filter(m => m.status === 'disponivel' || !m.status).length;
    const vendidos = motos.filter(m => m.status === 'vendido').length;
    
    document.getElementById('totalMotos').textContent = total;
    document.getElementById('disponiveisCount').textContent = disponiveis;
    document.getElementById('vendidosCount').textContent = vendidos;
    
    console.log('📊 Contadores atualizados:', { total, disponiveis, vendidos });
}

// Variável global para armazenar agendamentos
let currentAppointments = [];

// Carregar agendamentos
async function loadAppointments() {
    try {
        console.log('📅 Carregando agendamentos...');
        const response = await fetch('/api/appointments');
        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos: ' + response.status);
        }
        
        currentAppointments = await response.json();
        console.log('✅ Agendamentos carregados:', currentAppointments.length);
        
        // Atualizar contador (apenas pendentes)
        const pendentes = currentAppointments.filter(a => !a.status || a.status === 'pendente');
        const totalAgendamentos = document.getElementById('totalAgendamentos');
        if (totalAgendamentos) {
            totalAgendamentos.textContent = pendentes.length;
        }
        
        // Aplicar filtro atual
        filterAppointments();
    } catch (error) {
        console.error('❌ Erro ao carregar agendamentos:', error);
        showMessage('Erro ao carregar agendamentos: ' + error.message, 'error');
    }
}

// Função auxiliar para obter nome do mês em português
function getMonthName(monthNumber) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1] || 'Mês Desconhecido';
}

// Função para agrupar agendamentos por mês
function groupAppointmentsByMonth(appointments) {
    const grouped = {};
    
    appointments.forEach(apt => {
        const [year, month, day] = apt.date.split('-');
        const monthKey = `${year}-${month}`;
        const monthLabel = `${getMonthName(parseInt(month))} ${year}`;
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                label: monthLabel,
                appointments: [],
                year: parseInt(year),
                month: parseInt(month)
            };
        }
        
        grouped[monthKey].appointments.push(apt);
    });
    
    // Converter para array e ordenar por data (mais recente primeiro)
    return Object.values(grouped).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
}

// Estado dos acordeões (quais meses estão expandidos)
let expandedMonths = new Set();

// Renderizar agendamentos
function renderAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;
    
    console.log(`📋 Renderizando ${appointments.length} agendamentos...`);
    
    if (appointments.length === 0) {
        const filter = document.getElementById('appointmentStatusFilter')?.value || 'pendente';
        const message = filter === 'pendente' ? 'Nenhum agendamento pendente' : 
                       filter === 'realizado' ? 'Nenhum agendamento realizado' : 
                       'Nenhum agendamento no momento';
        appointmentsList.innerHTML = `<div class="no-appointments">${message}</div>`;
        return;
    }
    
    // Verificar se está filtrando apenas realizados
    const filter = document.getElementById('appointmentStatusFilter')?.value || 'pendente';
    const isRealizadosView = filter === 'realizado';
    
    if (isRealizadosView && appointments.length > 0) {
        // Agrupar por mês para agendamentos realizados
        const groupedByMonth = groupAppointmentsByMonth(appointments);
        
        appointmentsList.innerHTML = groupedByMonth.map((monthGroup, index) => {
            const monthAppointments = monthGroup.appointments.sort((a, b) => {
                // Ordenar por data dentro do mês (mais recente primeiro)
                const timeA = parseInt(a.id.split('-')[0]) || 0;
                const timeB = parseInt(b.id.split('-')[0]) || 0;
                return timeB - timeA;
            });
            
            const monthId = `month-${monthGroup.label.replace(/\s+/g, '-')}`;
            const isExpanded = expandedMonths.has(monthId);
            const accordionClass = isExpanded ? 'expanded' : 'collapsed';
            const iconSymbol = isExpanded ? '▼' : '▶';
            
            return `
                <div class="month-group">
                    <div class="month-header" onclick="toggleMonthAccordion('${monthId}')">
                        <div class="month-header-content">
                            <span class="accordion-icon" id="icon-${monthId}">${iconSymbol}</span>
                            <h4>📅 ${monthGroup.label}</h4>
                        </div>
                        <span class="month-count">${monthAppointments.length} agendamento(s)</span>
                    </div>
                    <div class="month-appointments ${accordionClass}" id="${monthId}">
                        ${monthAppointments.map(apt => renderAppointmentCard(apt)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // Renderização normal (sem agrupamento) para pendentes
        const sortedAppointments = appointments.sort((a, b) => {
            const timeA = parseInt(a.id.split('-')[0]) || 0;
            const timeB = parseInt(b.id.split('-')[0]) || 0;
            return timeB - timeA;
        });
        
        appointmentsList.innerHTML = sortedAppointments.map(apt => renderAppointmentCard(apt)).join('');
    }
    
    console.log(`✅ Cards HTML gerados: ${appointments.length}`);
}

// Função para alternar o acordeão de meses
function toggleMonthAccordion(monthId) {
    const monthContent = document.getElementById(monthId);
    const icon = document.getElementById(`icon-${monthId}`);
    
    if (!monthContent || !icon) return;
    
    const isCollapsed = monthContent.classList.contains('collapsed');
    
    if (isCollapsed) {
        monthContent.classList.remove('collapsed');
        monthContent.classList.add('expanded');
        icon.textContent = '▼';
        expandedMonths.add(monthId);
    } else {
        monthContent.classList.add('collapsed');
        monthContent.classList.remove('expanded');
        icon.textContent = '▶';
        expandedMonths.delete(monthId);
    }
}

// Função auxiliar para renderizar um card de agendamento
function renderAppointmentCard(apt) {
    // Encontrar a moto correspondente
    const moto = currentMotos.find(m => m.id === apt.motorcycle);
    const motoName = moto ? `${moto.marca || ''} ${moto.modelo || moto.name || moto.nome || ''}`.trim() : 'Moto não encontrada';
    
    // Formatar data
    const [year, month, day] = apt.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const isRealizado = apt.status === 'realizado';
    const statusClass = isRealizado ? 'realizado' : 'pendente';
    
    return `
        <div class="appointment-card ${statusClass}">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="appointment-icon">${isRealizado ? '✅' : '👤'}</div>
                <div class="appointment-info">
                    <div class="client-name">${apt.name}</div>
                    <div class="moto-name">🏍️ ${motoName}</div>
                    <div class="contact-info">📞 ${apt.phone}</div>
                </div>
            </div>
            <div class="appointment-datetime">
                <div class="appointment-date">📅 ${formattedDate}</div>
                <div class="appointment-time">🕐 ${apt.time}</div>
            </div>
            ${apt.notes ? `<div class="appointment-notes">💬 ${apt.notes}</div>` : ''}
            <div class="appointment-actions">
                ${!isRealizado ? `
                    <button class="btn-complete" onclick="markAppointmentComplete('${apt.id}')" title="Marcar como realizado">
                        ✓ Realizado
                    </button>
                ` : `
                    <span class="status-label completed">✅ Concluído</span>
                `}
                <button class="btn-delete-appointment" onclick="deleteAppointment('${apt.id}')" title="Excluir agendamento">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// Função para atualizar apenas agendamentos
async function refreshAppointments() {
    await loadAppointments();
    showMessage('Agendamentos atualizados!', 'success');
}

// ⏱️ Auto-refresh dos agendamentos a cada 10 segundos
function startAutoRefresh() {
    // Intervalo de 10 segundos (10000ms)
    const refreshTime = 10000;
    let refreshCount = 0;
    
    console.log(`%c🕐 AUTO-REFRESH ATIVADO! Atualizando a cada ${refreshTime / 1000} segundos`, 'background: #4caf50; color: white; padding: 8px; font-weight: bold; border-radius: 4px;');
    
    // Adicionar indicador visual no título
    const originalTitle = document.title;
    
    autoRefreshInterval = setInterval(async () => {
        refreshCount++;
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        console.log(`%c🔄 [${timestamp}] Auto-refresh #${refreshCount} - Buscando novos agendamentos...`, 'color: #ff6600; font-weight: bold; font-size: 14px;');
        
        // Atualizar título temporariamente
        document.title = `🔄 Atualizando... (${refreshCount})`;
        
        try {
            await loadAppointments();
            console.log(`%c✅ [${timestamp}] Lista atualizada com sucesso! Refresh #${refreshCount}`, 'color: #4caf50; font-weight: bold; font-size: 14px;');
            
            // Restaurar título
            setTimeout(() => {
                document.title = originalTitle;
            }, 2000);
        } catch (error) {
            console.error('❌ [AUTO-REFRESH] Erro ao atualizar:', error);
            document.title = originalTitle;
        }
    }, refreshTime);
    
    console.log(`%c✅ setInterval configurado! ID: ${autoRefreshInterval}`, 'background: #2196f3; color: white; padding: 4px; font-weight: bold;');
}

// Função para parar o auto-refresh (se necessário)
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏹️ [AUTO-REFRESH] Parado');
    }
}

// Marcar agendamento como realizado
async function markAppointmentComplete(appointmentId) {
    if (!confirm('Marcar este agendamento como REALIZADO?')) {
        return;
    }
    
    try {
        console.log('✅ [DEBUG] Marcando agendamento como realizado:', appointmentId);
        
        // Mostrar loading
        const card = event?.target?.closest('.appointment-card');
        if (card) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        }
        
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'realizado' })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar agendamento');
        }
        
        console.log('✅ [DEBUG] Agendamento marcado como realizado');
        
        // Recarregar lista
        await loadAppointments();
        
        // Mostrar mensagem de sucesso após reload
        showMessage('✅ Agendamento marcado como realizado!', 'success');
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao marcar agendamento:', error);
        showMessage('❌ Erro ao marcar agendamento como realizado', 'error');
        // Recarregar mesmo com erro para garantir sincronização
        await loadAppointments();
    }
}

// Excluir agendamento
async function deleteAppointment(appointmentId) {
    if (!confirm('Deseja EXCLUIR este agendamento permanentemente?')) {
        return;
    }
    
    try {
        console.log('🗑️ [DEBUG] Excluindo agendamento:', appointmentId);
        
        // Mostrar loading
        const card = event?.target?.closest('.appointment-card');
        if (card) {
            card.style.opacity = '0.3';
            card.style.pointerEvents = 'none';
        }
        
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir agendamento');
        }
        
        console.log('✅ [DEBUG] Agendamento excluído');
        
        // Recarregar lista
        await loadAppointments();
        
        // Mostrar mensagem de sucesso após reload
        showMessage('🗑️ Agendamento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao excluir agendamento:', error);
        showMessage('❌ Erro ao excluir agendamento', 'error');
        // Recarregar mesmo com erro para garantir sincronização
        await loadAppointments();
    }
}

// Filtrar agendamentos
function filterAppointments() {
    const filter = document.getElementById('appointmentStatusFilter')?.value || 'pendente';
    let filtered = currentAppointments;
    
    if (filter === 'pendente') {
        filtered = currentAppointments.filter(a => !a.status || a.status === 'pendente');
    } else if (filter === 'realizado') {
        filtered = currentAppointments.filter(a => a.status === 'realizado');
    }
    
    renderAppointments(filtered);
}

// Tornar funções disponíveis globalmente
window.markAppointmentComplete = markAppointmentComplete;
window.deleteAppointment = deleteAppointment;
window.filterAppointments = filterAppointments;
window.refreshAppointments = refreshAppointments;
window.toggleMonthAccordion = toggleMonthAccordion;

// Renderizar motocicletas
function renderMotos(motos) {
    console.log('🔍 [DEBUG] renderMotos chamado com', motos.length, 'motos');
    const grid = document.getElementById('adminGrid');
    
    if (!grid) {
        console.error('❌ [ERROR] Elemento adminGrid não encontrado!');
        return;
    }
    
    if (motos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div style="text-align: center; padding: 3rem; opacity: 0.6;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🏍️</div>
                    <h3>Nenhuma motocicleta encontrada</h3>
                    <p>Adicione sua primeira motocicleta clicando no botão "Adicionar Nova Motocicleta"</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Ordenar motos para o painel admin
    const motosSorted = [...motos].sort((a, b) => {
        // Função auxiliar para determinar categoria
        const getCategoria = (moto) => {
            const tipo = (moto.type || moto.tipo || '').toLowerCase();
            const categoria = (moto.categoria || '').toLowerCase();
            const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
            
            if (tipo === 'scooter' || categoria === 'scooter') return 1; // Scooters primeiro
            if (tipo === 'custom' || categoria === 'custom') return 4; // Custom por último
            if (cilindrada >= 500) return 3; // Alta cilindrada
            return 2; // Streets
        };
        
        const catA = getCategoria(a);
        const catB = getCategoria(b);
        
        // 1º: Ordenar por categoria
        if (catA !== catB) return catA - catB;
        
        // 2º: Ordenar por cilindrada (menor para maior)
        const cilA = parseInt(a.displacement || a.cilindradas || a.engine_cc || a.cc || 0);
        const cilB = parseInt(b.displacement || b.cilindradas || b.engine_cc || b.cc || 0);
        if (cilA !== cilB) return cilA - cilB;
        
        // 3º: Ordenar por ano (mais antigo para mais novo)
        const anoA = parseInt(a.year || a.ano || 0);
        const anoB = parseInt(b.year || b.ano || 0);
        return anoA - anoB;
    });
    
    grid.innerHTML = motosSorted.map(moto => {
        // Codificar URL da imagem para lidar com espaços e caracteres especiais
        const imagePath = moto.image || moto.thumb || 'images/placeholder.svg';
        const encodedImagePath = imagePath.split('/').map(part => encodeURIComponent(part)).join('/');
        
        // Verificar status
        const status = moto.status || 'disponivel';
        const isVendido = status === 'vendido';
        const statusBadge = isVendido 
            ? '<span class="status-badge vendido">✓ VENDIDO</span>'
            : '<span class="status-badge disponivel">● DISPONÍVEL</span>';
        
        console.log('🔍 [DEBUG] Renderizando moto:', moto.id, moto.name || moto.nome, 'Status:', status);
        return `
        <div class="moto-card ${isVendido ? 'vendido' : ''}" data-id="${moto.id}">
            <img src="${encodedImagePath}" 
                 alt="${moto.name || moto.nome}" 
                 class="moto-image"
                 onerror="this.src='images/placeholder.svg'">
            
            <div class="moto-info">
                <div class="moto-header">
                    <h3 class="moto-title">${moto.name || moto.nome}</h3>
                    ${statusBadge}
                </div>
                
                <div class="moto-details">
                    <span>${moto.marca || 'Marca não informada'}</span>
                    <span>${moto.displacement || moto.cilindradas || 0}cc</span>
                    <span>${moto.year || moto.ano}</span>
                    <span>${moto.color || moto.cor || ''}</span>
                    ${moto.placa ? `<span class="placa-badge">🏷️ ${moto.placa}</span>` : ''}
                    ${moto.renavam ? `<span class="doc-badge">📋 RENAVAM: ${moto.renavam}</span>` : ''}
                    ${moto.chassi ? `<span class="doc-badge">🔢 Chassi: ${moto.chassi}</span>` : ''}
                </div>
                
                <div class="moto-specs">
                    <span class="km-badge">📏 ${formatarNumero(moto.mileage || moto.quilometragem || moto.km || 0)} km</span>
                    ${moto.type || moto.tipo ? `<span class="type-badge">🏍️ ${(moto.type || moto.tipo).charAt(0).toUpperCase() + (moto.type || moto.tipo).slice(1)}</span>` : '<span class="type-badge" style="background: rgba(255,0,0,0.1); border-color: rgba(255,0,0,0.3); color: #ff0000;">⚠️ Sem tipo</span>'}
                </div>
                
                <div class="moto-description">
                    <p>${(moto.desc || moto.descricao || 'Sem descrição').substring(0, 100)}${(moto.desc || moto.descricao || '').length > 100 ? '...' : ''}</p>
                </div>
                
                <div class="moto-actions">
                    <button class="btn-secondary btn-small edit-btn" data-moto-id="${moto.id}">
                        ✏️ Editar
                    </button>
                    ${!isVendido ? `
                    <button class="btn-success btn-small sell-btn" data-moto-id="${moto.id}">
                        💰 Marcar como Vendida
                    </button>` : ''}
                    <button class="btn-danger btn-small delete-btn" data-moto-id="${moto.id}">
                        🗑️ ${isVendido ? 'Remover' : 'Excluir'}
                    </button>
                    <button class="btn-primary btn-small view-btn" data-moto-id="${moto.id}">
                        👁️ Ver
                    </button>
                </div>
            </div>
        </div>
    `;}).join('');
    
    console.log('✅ [DEBUG] renderMotos concluído. Adicionando event listeners...');
    
    // Adicionar event listeners para botões depois do render
    setTimeout(() => {
        // Botões de editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = this.getAttribute('data-moto-id');
                console.log('🔧 [DEBUG] Botão editar clicado para ID:', motoId);
                editMoto(motoId);
            });
        });
        
        // Botões de excluir
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = this.getAttribute('data-moto-id');
                console.log('🗑️ [DEBUG] Botão excluir clicado para ID:', motoId);
                confirmDeleteMoto(motoId);
            });
        });
        
        // Botões de marcar como vendida
        document.querySelectorAll('.sell-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = this.getAttribute('data-moto-id');
                console.log('💰 [DEBUG] Botão vender clicado para ID:', motoId);
                markAsSold(motoId);
            });
        });
        
        // Botões de visualizar
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = this.getAttribute('data-moto-id');
                console.log('👁️ [DEBUG] Botão visualizar clicado para ID:', motoId);
                viewMotoDetails(motoId);
            });
        });
        
        console.log('✅ [DEBUG] Event listeners adicionados com sucesso!');
    }, 100);
}

// Modal de adição/edição
function showSuccess(message) {
    console.log('✅ [SUCCESS]', message);
    alert('✅ ' + message);
}

function showError(message) {
    console.error('❌ [ERROR]', message);
    alert('❌ ' + message);
}

function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, message);
    alert((type === 'error' ? '❌ ' : '✅ ') + message);
}

// ============ FUNÇÕES AUXILIARES ============

function showAddMotorcycleModal() {
    console.log('🔧 [DEBUG] showAddMotorcycleModal chamado');
    try {
        editingMoto = null;
        const modalTitle = document.getElementById('modalTitle');
        const motorcycleForm = document.getElementById('motorcycleForm');
        const motorcycleModal = document.getElementById('motorcycleModal');
        
        if (!modalTitle || !motorcycleForm || !motorcycleModal) {
            console.error('❌ [ERROR] Elementos do modal não encontrados!');
            alert('Erro: Modal não encontrado. Recarregue a página.');
            return;
        }
        
        modalTitle.textContent = 'Nova Motocicleta';
        motorcycleForm.reset();
        motorcycleModal.classList.add('active');
        motorcycleModal.style.display = 'flex';
        motorcycleModal.style.opacity = '1';
        motorcycleModal.style.visibility = 'visible';
        motorcycleModal.style.position = 'fixed';
        motorcycleModal.style.zIndex = '999999';
        motorcycleModal.style.inset = '0';
        motorcycleModal.style.background = 'rgba(0, 0, 0, 0.8)';
        motorcycleModal.style.alignItems = 'center';
        motorcycleModal.style.justifyContent = 'center';
        
        // Forçar visibilidade do conteúdo do modal
        const modalContent = motorcycleModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.position = 'relative';
            modalContent.style.maxWidth = '600px';
            modalContent.style.width = '90%';
            modalContent.style.backgroundColor = 'white';
            modalContent.style.padding = '2rem';
            modalContent.style.borderRadius = '12px';
            modalContent.style.zIndex = '1000000';
        }
        
        document.body.style.overflow = 'hidden';
        console.log('✅ [DEBUG] Modal de adição exibido com sucesso');
    } catch (error) {
        console.error('❌ [ERROR] showAddMotorcycleModal:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

function showEditMotorcycleModal(id) {
    console.log('✏️ [DEBUG] showEditMotorcycleModal chamado com ID:', id);
    
    try {
        const moto = currentMotos.find(m => m.id === id);
        
        if (!moto) {
            console.error('❌ [DEBUG] Moto não encontrada:', id);
            alert('Motocicleta não encontrada!');
            return;
        }
        
        editingMoto = moto;
        
        const modalTitle = document.getElementById('modalTitle');
        const motorcycleModal = document.getElementById('motorcycleModal');
        
        if (!modalTitle || !motorcycleModal) {
            console.error('❌ [ERROR] Elementos do modal não encontrados!');
            alert('Erro: Modal não encontrado. Recarregue a página.');
            return;
        }
        
        modalTitle.textContent = 'Editar Motocicleta';
        
        // Preencher campos do formulário com verificação de existência
        const marca = document.getElementById('marca');
        const modelo = document.getElementById('modelo');
        const ano = document.getElementById('ano');
        const cor = document.getElementById('cor');
        const placa = document.getElementById('placa');
        const renavam = document.getElementById('renavam');
        const chassi = document.getElementById('chassi');
        const quilometragem = document.getElementById('quilometragem');
        const cilindradas = document.getElementById('cilindradas');
        const tipo = document.getElementById('tipo');
        const categoria = document.getElementById('categoria');
        const combustivel = document.getElementById('combustivel');
        const status = document.getElementById('status');
        const descricao = document.getElementById('descricao');
        const imagem = document.getElementById('imagem');
        const imagem2 = document.getElementById('imagem2');
        const imagem3 = document.getElementById('imagem3');
        const imagem4 = document.getElementById('imagem4');
        const documentoPDF = document.getElementById('documentoPDF');
        
        if (marca) marca.value = moto.marca || '';
        if (modelo) modelo.value = moto.modelo || moto.name || moto.nome || '';
        if (ano) ano.value = moto.year || moto.ano || '';
        if (cor) cor.value = moto.color || moto.cor || '';
        if (placa) placa.value = moto.placa || '';
        if (renavam) renavam.value = moto.renavam || '';
        if (chassi) chassi.value = moto.chassi || '';
        if (quilometragem) quilometragem.value = moto.mileage || moto.quilometragem || '';
        if (cilindradas) cilindradas.value = moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || '';
        if (categoria) categoria.value = moto.category || moto.categoria || '';
        if (combustivel) combustivel.value = moto.fuel || moto.combustivel || '';
        
        // DEBUG: Verificar tipo da moto
        const tipoMoto = moto.type || moto.tipo || '';
        console.log('🏍️ [DEBUG] Tipo da moto no JSON:', tipoMoto);
        if (tipo) {
            tipo.value = tipoMoto;
            console.log('🏍️ [DEBUG] Tipo definido no select:', tipo.value);
        }
        
        if (status) status.value = moto.status || 'disponivel';
        if (descricao) descricao.value = moto.desc || moto.description || '';
        
        // Preencher campos de imagem
        if (imagem) imagem.value = moto.image || '';
        if (imagem2 && moto.images && moto.images[1]) imagem2.value = moto.images[1];
        if (imagem3 && moto.images && moto.images[2]) imagem3.value = moto.images[2];
        if (imagem4 && moto.images && moto.images[3]) imagem4.value = moto.images[3];
        
        // Preencher campo de documento PDF
        if (documentoPDF) documentoPDF.value = moto.documentoPDF || '';
        
        motorcycleModal.classList.add('active');
        motorcycleModal.style.display = 'flex';
        motorcycleModal.style.opacity = '1';
        motorcycleModal.style.visibility = 'visible';
        motorcycleModal.style.position = 'fixed';
        motorcycleModal.style.zIndex = '999999';
        motorcycleModal.style.inset = '0';
        motorcycleModal.style.background = 'rgba(0, 0, 0, 0.8)';
        motorcycleModal.style.alignItems = 'center';
        motorcycleModal.style.justifyContent = 'center';
        
        // Forçar visibilidade do conteúdo do modal
        const modalContent = motorcycleModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.position = 'relative';
            modalContent.style.maxWidth = '600px';
            modalContent.style.width = '90%';
            modalContent.style.backgroundColor = 'white';
            modalContent.style.padding = '2rem';
            modalContent.style.borderRadius = '12px';
            modalContent.style.zIndex = '1000000';
        }
        
        document.body.style.overflow = 'hidden';
        console.log('✅ [DEBUG] Modal de edição exibido com sucesso');
    } catch (error) {
        console.error('❌ [ERROR] showEditMotorcycleModal:', error);
        alert('Erro ao abrir modal de edição: ' + error.message);
    }
}

function closeModal() {
    console.log('❌ [DEBUG] closeModal chamado');
    const modal = document.getElementById('motorcycleModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.style.overflow = 'auto';
    editingMoto = null;
}

// Handler para submissão do formulário de motocicleta
async function handleMotoSubmit(e) {
    e.preventDefault();
    console.log('📝 [DEBUG] Formulário de motocicleta submetido');
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Processar caminho da imagem
    let imagePath = formData.get('imagem') || '';
    console.log('🖼️ [DEBUG] Caminho original da imagem:', imagePath);
    
    // Processar imagens adicionais
    const imagem2 = formData.get('imagem2') || '';
    const imagem3 = formData.get('imagem3') || '';
    const imagem4 = formData.get('imagem4') || '';
    
    // Função auxiliar para processar caminhos de imagem
    function processImagePath(path) {
        if (!path) return '';
        
        console.log('🔍 [DEBUG] Processando caminho:', path);
        
        // Se for caminho completo do Windows (C:\Users\...), extrair a estrutura da pasta
        if (path.includes('\\') || path.includes(':')) {
            // Procurar por "Fotos motos\" ou "images\" para extrair o caminho relativo
            if (path.includes('Fotos motos\\')) {
                const relativePath = path.split('Fotos motos\\')[1];
                path = `images/${relativePath}`;
            } else if (path.includes('images\\')) {
                const relativePath = path.split('images\\')[1];
                path = `images/${relativePath}`;
            } else {
                const fileName = path.split('\\').pop().split('/').pop();
                path = `images/${fileName}`;
            }
            path = path.replace(/\\/g, '/');
        }
        // Se não tiver prefixo images/, adicionar
        else if (!path.startsWith('images/')) {
            path = `images/${path}`;
        }
        
        console.log('✅ [DEBUG] Caminho processado:', path);
        return path;
    }
    
    // Processar todas as imagens
    imagePath = processImagePath(imagePath);
    const imagem2Path = processImagePath(imagem2);
    const imagem3Path = processImagePath(imagem3);
    const imagem4Path = processImagePath(imagem4);
    
    // Construir array de imagens (apenas caminhos não vazios)
    const imagesArray = [imagePath, imagem2Path, imagem3Path, imagem4Path].filter(path => path && path !== 'images/');
    console.log('📷 [DEBUG] Array de imagens:', imagesArray);
    
    // DEBUG: Verificar valor do tipo no formulário
    const tipoValue = formData.get('tipo');
    console.log('🏍️ [DEBUG] Valor do campo tipo no formulário:', tipoValue);
    
    const motoData = {
        marca: formData.get('marca'),
        name: formData.get('modelo'),
        nome: formData.get('modelo'),
        modelo: formData.get('modelo'),
        year: formData.get('ano'),
        ano: formData.get('ano'),
        color: formData.get('cor'),
        cor: formData.get('cor'),
        placa: formData.get('placa') || '',
        renavam: formData.get('renavam') || '',
        chassi: formData.get('chassi') || '',
        mileage: parseInt(formData.get('quilometragem')) || 0,
        mileage_display: formData.get('quilometragem'),
        quilometragem: formData.get('quilometragem'),
        displacement: parseInt(formData.get('cilindradas')) || 0,
        cilindradas: parseInt(formData.get('cilindradas')) || 0,
        engine_cc: parseInt(formData.get('cilindradas')) || 0,
        cc: parseInt(formData.get('cilindradas')) || 0,
        type: tipoValue,
        tipo: tipoValue,
        category: formData.get('categoria') || '',
        categoria: formData.get('categoria') || '',
        fuel: formData.get('combustivel') || '',
        combustivel: formData.get('combustivel') || '',
        status: formData.get('status'),
        desc: formData.get('descricao'),
        description: formData.get('descricao'),
        image: imagesArray[0] || imagePath,
        thumb: imagesArray[0] || imagePath,
        images: imagesArray,
        documentoPDF: formData.get('documentoPDF') || '',
        id: editingMoto ? editingMoto.id : generateMotoId()
    };
    
    console.log('📤 [DEBUG] Dados que serão enviados:', JSON.stringify(motoData, null, 2));
    
    try {
        if (editingMoto) {
            // Editar moto existente
            console.log('🔄 [DEBUG] Atualizando moto:', editingMoto.id);
            const response = await fetch(`/api/motorcycles/${editingMoto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(motoData)
            });
            
            if (response.ok) {
                showSuccess('Motocicleta atualizada com sucesso!');
                closeModal();
                loadMotos();
            } else {
                throw new Error('Erro ao atualizar motocicleta');
            }
        } else {
            // Adicionar nova moto
            const response = await fetch('/api/motorcycles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(motoData)
            });
            
            if (response.ok) {
                const newMoto = await response.json();
                showSuccess('Motocicleta adicionada com sucesso!');
                closeModal();
                
                // Se foi marcada como vendida, abrir modal de venda
                if (motoData.status === 'vendido') {
                    setTimeout(() => {
                        openSaleModal(newMoto);
                    }, 300);
                }
                
                loadMotos();
            } else {
                throw new Error('Erro ao adicionar motocicleta');
            }
        }
    } catch (error) {
        console.error('❌ [ERROR] Erro ao salvar motocicleta:', error);
        showError('Erro ao salvar motocicleta: ' + error.message);
    }
}

function generateMotoId() {
    return 'moto-' + Date.now();
}

function openAddMotoModal() {
    try {
        console.log('➕ [DEBUG] openAddMotoModal chamado');
        editingMoto = null;
        
        // Verificar se elementos existem
        const modalTitle = document.getElementById('modalTitle');
        const motoForm = document.getElementById('motorcycleForm');
        const motoModal = document.getElementById('motorcycleModal');
        
        if (!modalTitle || !motoForm || !motoModal) {
            console.error('❌ [DEBUG] Elementos do modal não encontrados');
            alert('Erro: Modal não está disponível. Recarregue a página.');
            return;
        }
        
        modalTitle.textContent = 'Nova Motocicleta';
        motoForm.reset();
        
        // Verificar se clearImagePreview existe antes de chamar
        if (typeof clearImagePreview === 'function') {
            clearImagePreview();
        }
        
        console.log('➕ [DEBUG] Modal sendo exibido...');
        motoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('✅ [DEBUG] Modal de adição exibido!');
    } catch (error) {
        console.error('❌ [ERROR] openAddMotoModal:', error);
        alert('Erro ao abrir modal de adição. Por favor, recarregue a página.');
    }
}

function editMoto(motoId) {
    try {
        console.log('🔧 [DEBUG] editMoto chamado com ID:', motoId);
        
        if (!motoId) {
            console.error('❌ [DEBUG] ID da moto não fornecido');
            alert('Erro: ID da motocicleta não encontrado!');
            return;
        }
        
        // Chamar a nova função de modal de edição
        showEditMotorcycleModal(motoId);
        
    } catch (error) {
        console.error('❌ [ERROR] Erro em editMoto:', error);
        alert('Erro ao abrir editor: ' + error.message);
    }
}

// ============ FUNÇÃO AUXILIAR DE EDIÇÃO (VERSÃO ANTIGA) ============
function editMotoLegacy(moto) {
    try {
        console.log('✅ [DEBUG] Moto encontrada:', moto.name || moto.nome);
        
        editingMoto = moto;
        
        // Verificar elementos do modal
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        if (!modalTitle || !submitBtn) {
            console.error('❌ [DEBUG] Elementos do modal não encontrados para edição');
            alert('Erro: Modal não está disponível. Recarregue a página.');
            return;
        }
        
        modalTitle.textContent = 'Editar Motocicleta';
        submitBtn.textContent = 'Salvar Alterações';
        
        // Preencher formulário com dados existentes
        const fillField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            } else {
                console.warn(`⚠️ [DEBUG] Campo ${id} não encontrado`);
            }
        };
        
        fillField('nome', moto.name || moto.nome);
        fillField('marca', moto.marca);
        fillField('categoria', getCategoryFromDisplacement(moto.displacement || moto.cilindradas));
        fillField('ano', moto.year || moto.ano);
        fillField('km', moto.mileage || moto.km);
        fillField('descricao_resumida', moto.desc_resumida || moto.descricao_resumida);
        fillField('descricao_completa', moto.desc || moto.descricao);
        fillField('pontos_fortes', moto.pontos_fortes);
        
        // Exibir modal
        const motoModal = document.getElementById('motorcycleModal');
        if (motoModal) {
            motoModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('✅ [DEBUG] Modal de edição exibido!');
        } else {
            console.error('❌ [DEBUG] Modal não encontrado');
            alert('Erro: Modal não encontrado. Recarregue a página.');
        }
    } catch (error) {
        console.error('❌ [ERROR] Erro no editMotoLegacy:', error);
        alert('Erro ao abrir modal de edição. Por favor, recarregue a página.');
    }
}

// ============ FUNÇÕES AUXILIARES PARA CAMPOS ============

function addExtraFieldsToForm(moto) {
    // Adicionar campos específicos se necessário
    const cilindradasField = document.getElementById('cilindradas');
    if (cilindradasField) {
        cilindradasField.value = moto.displacement || moto.cilindradas || '';
    }
    
    const especificacoesField = document.getElementById('especificacoes');
    if (especificacoesField) {
        especificacoesField.value = moto.especificacoes || '';
    }
}

function showImagePreview(imageUrl) {
    // Mostrar preview da imagem se existir
    if (imageUrl) {
        console.log('🖼️ [DEBUG] Mostrando preview:', imageUrl);
        // Implementar preview se necessário
    }
}

// ============ FUNÇÕES AUXILIARES PARA FORMULÁRIO ============

function addExtraFieldsToForm(moto) {
    // Adicionar campos extras específicos do formato atual
    const form = document.getElementById('motorcycleForm');
    
    // Verificar se já existem campos extras
    let extraFields = form.querySelector('.extra-fields');
    if (!extraFields) {
        extraFields = document.createElement('div');
        extraFields.className = 'extra-fields';
        extraFields.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="cor">Cor</label>
                    <input type="text" id="cor" name="cor" placeholder="Cor da motocicleta">
                </div>
                <div class="form-group">
                    <label for="quilometragem">Quilometragem</label>
                    <input type="text" id="quilometragem" name="quilometragem" placeholder="Ex: 15.000">
                </div>
            </div>
        `;
        
        // Inserir antes dos botões de ação
        const formActions = form.querySelector('.form-actions');
        form.insertBefore(extraFields, formActions);
    }
    
    // Preencher campos extras
    document.getElementById('cor').value = moto.color || moto.cor || '';
    document.getElementById('quilometragem').value = moto.mileage_display || moto.km || '';
}

function closeMotoModal() {
    const modal = document.getElementById('motorcycleModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingMoto = null;
    clearImagePreview();
}

// Função para marcar moto como vendida
async function markAsSold(motoId) {
    const moto = currentMotos.find(m => m.id === motoId);
    if (!moto) {
        showMessage('❌ Motocicleta não encontrada', 'error');
        return;
    }
    
    // Abrir modal para capturar dados da venda
    openSaleModal(moto);
}

// Abrir modal de venda
function openSaleModal(moto) {
    const modal = document.getElementById('saleModal');
    const motoInfo = document.getElementById('saleMotorcycleInfo');
    const saleMotoId = document.getElementById('saleMotoId');
    const saleDate = document.getElementById('saleDate');
    
    // Definir ID da moto
    saleMotoId.value = moto.id;
    
    // Definir data de hoje como padrão
    const today = new Date().toISOString().split('T')[0];
    saleDate.value = today;
    
    // Preencher automaticamente campos já existentes na moto
    if (moto.renavam) {
        document.getElementById('saleRenavam').value = moto.renavam;
    }
    if (moto.placa) {
        document.getElementById('salePlaca').value = moto.placa;
    }
    if (moto.chassi) {
        document.getElementById('saleChassi').value = moto.chassi;
    }
    
    // Mostrar informações da moto
    motoInfo.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #ff6600;">
            ${moto.marca || ''} ${moto.modelo || moto.name || ''}
        </h4>
        <p style="margin: 5px 0; opacity: 0.8;">
            <strong>Ano:</strong> ${moto.ano || moto.year || 'N/A'} | 
            <strong>Cor:</strong> ${moto.cor || moto.color || 'N/A'} | 
            <strong>Cilindrada:</strong> ${moto.cilindradas || moto.cc || 'N/A'}cc
        </p>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fechar modal de venda
function closeSaleModal() {
    const modal = document.getElementById('saleModal');
    const form = document.getElementById('saleForm');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    form.reset();
    
    // Limpar campos específicos
    document.getElementById('saleRenavam').value = '';
    document.getElementById('salePlaca').value = '';
    document.getElementById('saleChassi').value = '';
}

// Processar formulário de venda
document.addEventListener('DOMContentLoaded', function() {
    const saleForm = document.getElementById('saleForm');
    if (saleForm) {
        saleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const motoId = document.getElementById('saleMotoId').value;
            const buyerName = document.getElementById('buyerName').value;
            const saleDate = document.getElementById('saleDate').value;
            const saleNotes = document.getElementById('saleNotes').value;
            const renavam = document.getElementById('saleRenavam').value;
            const placa = document.getElementById('salePlaca').value;
            const chassi = document.getElementById('saleChassi').value;
            
            if (!buyerName || !saleDate) {
                showMessage('❌ Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            try {
                console.log('💰 [DEBUG] Registrando venda:', { motoId, buyerName, saleDate, renavam, placa, chassi });
                
                // Converter data local para ISO sem perder o dia
                const [year, month, day] = saleDate.split('-');
                const localDate = new Date(year, month - 1, day);
                const saleDateISO = localDate.toISOString();
                
                // Buscar dados atuais da moto para preservar informações
                const motoAtual = currentMotos.find(m => m.id === motoId);
                
                const response = await fetch(`/api/motorcycles/${motoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'vendido',
                        buyerName: buyerName,
                        saleDate: saleDateISO,
                        saleNotes: saleNotes,
                        // Preservar dados existentes se não forem preenchidos no formulário
                        renavam: renavam || motoAtual?.renavam || '',
                        placa: placa || motoAtual?.placa || '',
                        chassi: chassi || motoAtual?.chassi || '',
                        soldAt: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao registrar venda');
                }
                
                console.log('✅ [DEBUG] Venda registrada com sucesso');
                
                // Fechar modal ANTES da mensagem
                closeSaleModal();
                
                // Recarregar lista de motos
                await loadMotos();
                
                // Mostrar mensagem após fechar
                showMessage('✅ Venda registrada com sucesso!', 'success');
                
            } catch (error) {
                console.error('❌ [DEBUG] Erro ao registrar venda:', error);
                showMessage('❌ Erro ao registrar venda', 'error');
            }
        });
    }
});

// Função para mostrar motos vendidas
async function showSoldMotorcycles() {
    try {
        showAdminLoading('Carregando vendas');
        const loadingStart = Date.now();
        
        const response = await fetch('/api/motorcycles');
        if (!response.ok) {
            throw new Error('Erro ao carregar motocicletas');
        }
        
        const motorcycles = await response.json();
        const soldMotos = motorcycles.filter(m => m.status === 'vendido');
        
        // Garantir que o loading fique visível por pelo menos 500ms
        const loadingTime = Date.now() - loadingStart;
        if (loadingTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - loadingTime));
        }
        hideAdminLoading();
        
        if (soldMotos.length === 0) {
            showMessage('ℹ️ Nenhuma motocicleta vendida ainda', 'info');
            return;
        }
        
        // Ordenar por data de venda (mais recente primeiro)
        soldMotos.sort((a, b) => {
            // Parse correto para timezone local
            const dateA = a.saleDate ? new Date(a.saleDate) : new Date(a.soldAt || 0);
            const dateB = b.saleDate ? new Date(b.saleDate) : new Date(b.soldAt || 0);
            return dateB - dateA;
        });
        
        // Agrupar por mês/ano
        const motosPorMes = {};
        soldMotos.forEach(moto => {
            // Parse correto para timezone local
            const date = moto.saleDate ? new Date(moto.saleDate) : new Date(moto.soldAt);
            const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            if (!motosPorMes[mesAno]) {
                motosPorMes[mesAno] = [];
            }
            motosPorMes[mesAno].push(moto);
        });
        
        const modal = document.getElementById('soldMotorcyclesModal');
        const content = document.getElementById('soldMotorcyclesContent');
        
        // Calcular estatísticas
        const totalVendas = soldMotos.length;
        const vendasEsteAno = soldMotos.filter(m => {
            const year = new Date(m.saleDate || m.soldAt).getFullYear();
            return year === new Date().getFullYear();
        }).length;
        const vendasEsteMes = soldMotos.filter(m => {
            const date = new Date(m.saleDate || m.soldAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
        
        // Criar dropdown de filtro por mês com dashboard de estatísticas
        const mesesDisponiveis = Object.keys(motosPorMes);
        const filterHtml = `
            <!-- Dashboard de Estatísticas -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 20px 25px 20px;">
                <div style="background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%); padding: 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.2);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div style="background: rgba(255, 255, 255, 0.15); width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            💰
                        </div>
                        <div>
                            <p style="margin: 0; font-size: 11px; opacity: 0.85; color: white; font-weight: 600; text-transform: uppercase;">Total Vendido</p>
                            <h2 style="margin: 3px 0 0 0; font-size: 28px; font-weight: 700; color: white;">${totalVendas}</h2>
                        </div>
                    </div>
                    <p style="margin: 0; font-size: 10px; opacity: 0.75; color: white;">📊 Histórico completo</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); padding: 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div style="background: rgba(255, 255, 255, 0.15); width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            📅
                        </div>
                        <div>
                            <p style="margin: 0; font-size: 11px; opacity: 0.85; color: white; font-weight: 600; text-transform: uppercase;">Este Ano</p>
                            <h2 style="margin: 3px 0 0 0; font-size: 28px; font-weight: 700; color: white;">${vendasEsteAno}</h2>
                        </div>
                    </div>
                    <p style="margin: 0; font-size: 10px; opacity: 0.75; color: white;">📈 ${new Date().getFullYear()}</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%); padding: 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div style="background: rgba(255, 255, 255, 0.15); width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            🔥
                        </div>
                        <div>
                            <p style="margin: 0; font-size: 11px; opacity: 0.85; color: white; font-weight: 600; text-transform: uppercase;">Este Mês</p>
                            <h2 style="margin: 3px 0 0 0; font-size: 28px; font-weight: 700; color: white;">${vendasEsteMes}</h2>
                        </div>
                    </div>
                    <p style="margin: 0; font-size: 10px; opacity: 0.75; color: white;">⚡ Últimos 30 dias</p>
                </div>
            </div>
            
            <!-- Filtro e Controles -->
            <div style="background: rgba(255, 102, 0, 0.1); padding: 18px 20px; border-radius: 12px; border-left: 4px solid #ff6600; margin: 0 20px 25px 20px; backdrop-filter: blur(5px);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #ff6600; display: flex; align-items: center; gap: 8px;">
                            🔍 Filtros e Navegação
                        </h3>
                        <p style="font-size: 11px; margin: 0; opacity: 0.7; color: white;">
                            💡 <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 10px;">ESC</kbd> Fechar 
                            <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 8px;">F</kbd> Filtro
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <select id="monthFilter" onchange="filterSoldMotorcycles()" style="padding: 12px 18px; border-radius: 10px; border: 2px solid rgba(255, 102, 0, 0.5); background: linear-gradient(135deg, rgba(255, 102, 0, 0.15), rgba(255, 102, 0, 0.05)); color: white; font-size: 15px; font-weight: 700; cursor: pointer; min-width: 250px; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 102, 0, 0.2);">
                            <option value="all">📅 Todos os meses (${totalVendas})</option>
                            ${mesesDisponiveis.map(mes => {
                                const capitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
                                const count = motosPorMes[mes].length;
                                return `<option value="${mes}">📊 ${capitalizado} (${count})</option>`;
                            }).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        let html = filterHtml;
        
        // Renderizar por mês
        Object.keys(motosPorMes).forEach(mesAno => {
            const motosDoMes = motosPorMes[mesAno];
            const capitalizado = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
            
            html += `
                <div class="month-section" data-month="${mesAno}" style="margin: 0 20px 35px 20px; display: none;">
                    <div style="background: linear-gradient(135deg, rgba(255, 102, 0, 0.25) 0%, rgba(255, 102, 0, 0.08) 100%); padding: 16px 24px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ff6600; box-shadow: 0 3px 12px rgba(255, 102, 0, 0.15);">
                        <h3 style="margin: 0; font-size: 22px; color: #ff6600; font-weight: 800; display: flex; align-items: center; gap: 12px;">
                            📅 ${capitalizado}
                            <span style="background: linear-gradient(135deg, #ff6600, #ff8533); color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);">
                                ${motosDoMes.length} ${motosDoMes.length === 1 ? 'venda' : 'vendas'}
                            </span>
                        </h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 16px;">
            `;
            
            motosDoMes.forEach(moto => {
                // Parse correto para timezone local
                const saleDate = moto.saleDate ? new Date(moto.saleDate).toLocaleDateString('pt-BR') : 'N/A';
                const buyerName = moto.buyerName || 'Não informado';
                const saleNotes = moto.saleNotes || '';
                
                html += `
                    <div style="background: linear-gradient(145deg, #3a3a3a, #2f2f2f); padding: 0; border-radius: 14px; border: 1px solid rgba(255, 102, 0, 0.3); overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); color: white;">
                        <!-- Header do Card com Imagem -->
                        <div style="position: relative; height: 200px; overflow: hidden; background: linear-gradient(135deg, #2a2a2a, #1a1a1a);">
                            <img src="${moto.image || moto.thumb || '/images/placeholder.jpg'}" 
                                 alt="${moto.nome || moto.name}"
                                 style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            <div style="position: absolute; top: 8px; right: 8px;">
                                <span style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 5px 10px; border-radius: 14px; font-size: 10px; font-weight: 600; box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);">
                                    ✅ VENDIDA
                                </span>
                            </div>
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 16px 16px 10px;">
                                <h4 style="margin: 0; font-size: 26px; color: white; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">
                                    ${moto.marca || ''} ${moto.modelo || moto.name || ''}
                                </h4>
                            </div>
                        </div>
                        
                        <!-- Corpo do Card -->
                        <div style="padding: 16px;">
                            <!-- Especificações em Grid -->
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;">
                                <div style="background: rgba(255, 102, 0, 0.1); padding: 10px 12px; border-radius: 8px; border-left: 3px solid #ff6600;">
                                    <p style="margin: 0; font-size: 12px; opacity: 0.7; color: white; font-weight: 600; text-transform: uppercase;">Ano</p>
                                    <p style="margin: 4px 0 0 0; font-size: 22px; color: #ff6600; font-weight: 700;">${moto.ano || moto.year || 'N/A'}</p>
                                </div>
                                <div style="background: rgba(33, 150, 243, 0.1); padding: 10px 12px; border-radius: 8px; border-left: 3px solid #2196f3;">
                                    <p style="margin: 0; font-size: 12px; opacity: 0.7; color: white; font-weight: 600; text-transform: uppercase;">Cilindrada</p>
                                    <p style="margin: 4px 0 0 0; font-size: 22px; color: #2196f3; font-weight: 700;">${moto.cilindradas || moto.cc || 'N/A'}cc</p>
                                </div>
                                <div style="background: rgba(244, 67, 54, 0.1); padding: 10px 12px; border-radius: 8px; border-left: 3px solid #f44336;">
                                    <p style="margin: 0; font-size: 12px; opacity: 0.7; color: white; font-weight: 600; text-transform: uppercase;">Cor</p>
                                    <p style="margin: 4px 0 0 0; font-size: 18px; color: #f44336; font-weight: 700;">${moto.cor || moto.color || 'N/A'}</p>
                                </div>
                                <div style="background: rgba(255, 193, 7, 0.1); padding: 10px 12px; border-radius: 8px; border-left: 3px solid #ffc107;">
                                    <p style="margin: 0; font-size: 12px; opacity: 0.7; color: white; font-weight: 600; text-transform: uppercase;">KM</p>
                                    <p style="margin: 4px 0 0 0; font-size: 18px; color: #ffc107; font-weight: 700;">${formatarNumero(moto.quilometragem || moto.mileage || 0)}</p>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.05)); padding: 12px 14px; border-radius: 8px; margin-bottom: 14px; border: 1px solid rgba(156, 39, 176, 0.4);">
                                <p style="margin: 0; font-size: 14px; color: white; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 18px;">🏷️</span>
                                    <span style="opacity: 0.7;">Placa:</span>
                                    <span style="color: ` + (moto.placa ? '#ce93d8' : 'rgba(255, 255, 255, 0.5)') + `; font-weight: ` + (moto.placa ? '800' : '500') + `; font-family: monospace; letter-spacing: 2px; font-size: 18px;">` + (moto.placa || 'Não informado') + `</span>
                                </p>
                            </div>
                            
                            <!-- Informações da Venda -->
                            <div style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05)); padding: 14px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3); margin-bottom: 12px;">
                                <h5 style="margin: 0 0 12px 0; font-size: 15px; color: #4caf50; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 20px;">💰</span> Dados da Venda
                                </h5>
                                <div style="display: grid; gap: 8px;">
                                    <p style="margin: 0; font-size: 18px; color: white; display: flex; align-items: center; gap: 6px;">
                                        <span style="background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; min-width: 70px; font-size: 14px;">📅 Data:</span>
                                        <span style="font-weight: 600; color: #81c784;">${saleDate}</span>
                                    </p>
                                    <p style="margin: 0; font-size: 18px; color: white; display: flex; align-items: center; gap: 6px;">
                                        <span style="background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; min-width: 90px; font-size: 14px;">👤 Comprador:</span>
                                        <span style="font-weight: 600; color: #81c784; font-size: 18px;">${buyerName}</span>
                                    </p>
                                    <p style="margin: 0; font-size: 16px; color: white; display: flex; align-items: center; gap: 6px;">
                                        <span style="background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 14px;">📋 RENAVAM:</span>
                                        <span style="font-weight: 600; color: ` + (moto.renavam ? '#81c784' : 'rgba(255, 255, 255, 0.5)') + `; font-family: monospace;">` + (moto.renavam || 'Não informado') + `</span>
                                    </p>
                                    ${moto.chassi ? `
                                        <p style="margin: 0; font-size: 16px; color: white; display: flex; align-items: center; gap: 6px;">
                                            <span style="background: rgba(255, 255, 255, 0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 14px;">🔢 Chassi:</span>
                                            <span style="font-weight: 600; color: #81c784; font-family: monospace; font-size: 14px;">${moto.chassi}</span>
                                        </p>
                                    ` : ''}
                                    ${saleNotes ? `
                                        <p style="margin: 6px 0 0 0; font-size: 11px; color: rgba(255, 255, 255, 0.7); font-style: italic; padding: 6px; background: rgba(0, 0, 0, 0.2); border-radius: 4px; border-left: 2px solid #4caf50;">
                                            <strong style="color: #4caf50;">📝 Obs:</strong> ${saleNotes}
                                        </p>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Botões de Ação -->
                            <div style="display: grid; grid-template-columns: ${moto.documentoPDF ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'}; gap: 10px;">
                                ${moto.documentoPDF ? `
                                <button onclick="window.open('${moto.documentoPDF}', '_blank')" style="background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span>📄</span> CRLV
                                </button>
                                ` : ''}
                                <button onclick="editSoldMoto('${moto.id}')" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span>✏️</span> Editar
                                </button>
                                <button onclick="revertSale('${moto.id}')" style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span>🔄</span> Retornar
                                </button>
                                <button onclick="deleteSoldMoto('${moto.id}')" style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3); display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <span>🗑️</span> Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        content.innerHTML = html;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Restaurar filtro de mês selecionado anteriormente
        setTimeout(() => {
            const monthFilter = document.getElementById('monthFilter');
            if (monthFilter) {
                // Restaurar seleção anterior se existir
                if (selectedMonthFilter && selectedMonthFilter !== 'all') {
                    monthFilter.value = selectedMonthFilter;
                }
                filterSoldMotorcycles(); // Aplica filtro
            }
            
            // Restaurar posição de scroll se existir
            if (savedScrollPosition > 0) {
                const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
                if (modalContent) {
                    modalContent.scrollTop = savedScrollPosition;
                    console.log('📍 Posição de scroll restaurada:', savedScrollPosition);
                    savedScrollPosition = 0; // Limpar após usar
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao carregar motos vendidas:', error);
        hideAdminLoading();
        showMessage('❌ Erro ao carregar motos vendidas', 'error');
    }
}

// Fechar modal de motos vendidas
function closeSoldMotorcyclesModal() {
    const modal = document.getElementById('soldMotorcyclesModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Função para filtrar motos vendidas por mês
function filterSoldMotorcycles() {
    const selectedMonth = document.getElementById('monthFilter').value;
    const monthSections = document.querySelectorAll('.month-section');
    
    // Armazenar seleção atual
    selectedMonthFilter = selectedMonth;
    
    monthSections.forEach(section => {
        if (selectedMonth === 'all') {
            // Mostrar todas as seções
            section.style.display = 'block';
        } else {
            // Mostrar apenas a seção do mês selecionado
            const monthData = section.getAttribute('data-month');
            if (monthData === selectedMonth) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
    });
    
    console.log(`🔍 [DEBUG] Filtrando vendas por: ${selectedMonth === 'all' ? 'Todos os meses' : selectedMonth}`);
}

// Função para reverter venda (retornar ao catálogo)
async function revertSale(motoId) {
    if (!confirm('Deseja retornar esta motocicleta ao catálogo como DISPONÍVEL?\n\nOs dados da venda serão removidos.')) {
        return;
    }
    
    try {
        console.log('🔄 [DEBUG] Revertendo venda da moto:', motoId);
        
        // Salvar posição de scroll atual
        const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
        if (modalContent) {
            savedScrollPosition = modalContent.scrollTop;
        }
        
        const response = await fetch(`/api/motorcycles/${motoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'disponivel',
                buyerName: null,
                saleDate: null,
                saleNotes: null,
                soldAt: null
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao reverter venda');
        }
        
        console.log('✅ [DEBUG] Venda revertida com sucesso');
        
        // Recarregar painel de vendas ao invés de fechar
        await showSoldMotorcycles();
        
        // Recarregar lista principal em segundo plano
        loadMotos();
        
        // Mostrar mensagem
        showMessage('✅ Motocicleta retornada ao catálogo com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao reverter venda:', error);
        showMessage('❌ Erro ao reverter venda', 'error');
    }
}

// Função para excluir moto vendida permanentemente
async function deleteSoldMoto(motoId) {
    if (!confirm('⚠️ ATENÇÃO!\n\nDeseja EXCLUIR PERMANENTEMENTE esta motocicleta?\n\nEsta ação não pode ser desfeita!')) {
        return;
    }
    
    try {
        console.log('🗑️ [DEBUG] Excluindo moto vendida:', motoId);
        
        // Salvar posição de scroll atual
        const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
        if (modalContent) {
            savedScrollPosition = modalContent.scrollTop;
        }
        
        const response = await fetch(`/api/motorcycles/${motoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir motocicleta');
        }
        
        console.log('✅ [DEBUG] Moto excluída com sucesso');
        
        // Recarregar painel de vendas ao invés de fechar
        await showSoldMotorcycles();
        
        // Recarregar lista principal em segundo plano
        loadMotos();
        
        // Mostrar mensagem
        showMessage('✅ Motocicleta excluída com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao excluir moto:', error);
        showMessage('❌ Erro ao excluir motocicleta', 'error');
    }
}

// Função para excluir motocicleta
async function confirmDeleteMoto(motoId) {
    if (!motoId) {
        showError('ID da motocicleta não encontrado!');
        return;
    }
    if (!confirm('Tem certeza que deseja excluir esta motocicleta?')) return;
    try {
        const response = await fetch(`/api/motorcycles/${motoId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            showSuccess('Motocicleta excluída com sucesso!');
            loadMotos();
        } else {
            const err = await response.json();
            showError('Erro ao excluir: ' + (err.error || 'Falha desconhecida'));
        }
    } catch (error) {
        showError('Erro ao excluir motocicleta: ' + error.message);
    }
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Preview de imagem
function previewImage(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('A imagem deve ter no máximo 5MB', 'error');
            input.value = '';
            return;
        }
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            showMessage('Por favor, selecione apenas arquivos de imagem', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function showImagePreview(src) {
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('previewImg').src = src;
}

function removeImagePreview() {
    document.getElementById('uploadPlaceholder').style.display = 'flex';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('imagemUpload').value = '';
}

function clearImagePreview() {
    removeImagePreview();
}

// Setup do upload de imagem
function setupImageUpload() {
    const uploadArea = document.querySelector('.image-upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--admin-secondary)';
        uploadArea.style.background = 'rgba(52, 152, 219, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--admin-glass-border)';
        uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--admin-glass-border)';
        uploadArea.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('imagemUpload').files = files;
            previewImage(document.getElementById('imagemUpload'));
        }
    });
}

// Filtros e busca
function filterMotos(categoria) {
    if (categoria === 'todas') {
        renderMotos(currentMotos);
    } else {
        const filtered = currentMotos.filter(moto => moto.categoria === categoria);
        renderMotos(filtered);
    }
}

function searchMotos() {
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    if (!search.trim()) {
        applyAllFilters();
        return;
    }
    
    const filtered = currentMotos.filter(moto => 
        moto.nome.toLowerCase().includes(search) ||
        moto.marca.toLowerCase().includes(search) ||
        moto.categoria.toLowerCase().includes(search)
    );
    
    renderMotos(filtered);
}

// Aplicar todos os filtros combinados
function applyAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const estiloFilter = document.getElementById('estiloFilter');
    const selectedEstilo = estiloFilter ? estiloFilter.value : '';
    
    const statusFilter = document.getElementById('statusFilter');
    const selectedStatus = statusFilter ? statusFilter.value : '';
    
    const marcaFilter = document.getElementById('marcaFilter');
    const selectedMarca = marcaFilter ? marcaFilter.value : '';
    
    const cilindradaFilter = document.getElementById('cilindradaFilter');
    const selectedCilindrada = cilindradaFilter ? cilindradaFilter.value : '';
    
    let filtered = [...currentMotos];
    
    // Filtrar por busca
    if (searchTerm.trim()) {
        filtered = filtered.filter(moto => 
            (moto.nome || '').toLowerCase().includes(searchTerm) ||
            (moto.marca || '').toLowerCase().includes(searchTerm) ||
            (moto.categoria || '').toLowerCase().includes(searchTerm) ||
            (moto.modelo || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar por estilo
    if (selectedEstilo) {
        filtered = filtered.filter(moto => {
            const tipo = (moto.type || moto.tipo || '').toLowerCase();
            const categoria = (moto.categoria || '').toLowerCase();
            const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
            
            if (selectedEstilo === 'scooter') {
                return tipo === 'scooter' || categoria === 'scooter';
            } else if (selectedEstilo === 'custom') {
                return tipo === 'custom' || categoria === 'custom';
            } else if (selectedEstilo === 'trail') {
                return tipo === 'trail' || categoria === 'trail';
            } else if (selectedEstilo === 'alta-cilindrada') {
                return cilindrada >= 500;
            } else if (selectedEstilo === 'street') {
                return cilindrada < 500 && tipo !== 'scooter' && categoria !== 'scooter' && tipo !== 'custom' && categoria !== 'custom' && tipo !== 'trail' && categoria !== 'trail';
            }
            return true;
        });
    }
    
    // Filtrar por status
    if (selectedStatus) {
        filtered = filtered.filter(moto => moto.status === selectedStatus);
    }
    
    // Filtrar por marca
    if (selectedMarca) {
        filtered = filtered.filter(moto => moto.marca === selectedMarca);
    }
    
    // Filtrar por cilindrada
    if (selectedCilindrada) {
        if (selectedCilindrada.includes('-')) {
            // Filtro por intervalo (ex: 50-100)
            const [min, max] = selectedCilindrada.split('-').map(n => parseInt(n));
            filtered = filtered.filter(moto => {
                const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                return cilindrada >= min && cilindrada <= max;
            });
        } else if (selectedCilindrada.includes('+')) {
            // Filtro para 500+ (500 ou mais)
            const min = parseInt(selectedCilindrada.replace('+', ''));
            filtered = filtered.filter(moto => {
                const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                return cilindrada >= min;
            });
        }
    }
    
    renderMotos(filtered);
}

// Preencher filtro de marcas dinamicamente
function populateMarcaFilter(motos) {
    const marcaFilter = document.getElementById('marcaFilter');
    if (!marcaFilter) return;
    
    // Extrair marcas únicas
    const marcas = [...new Set(motos.map(moto => moto.marca).filter(marca => marca))];
    marcas.sort();
    
    // Limpar opções existentes (exceto a primeira)
    marcaFilter.innerHTML = '<option value="">Todas as Marcas</option>';
    
    // Adicionar opções de marcas
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        marcaFilter.appendChild(option);
    });
}

// Estatísticas
async function loadStats() {
    try {
        // Total de motos
        const totalElem = document.getElementById('totalMotos');
        if (totalElem) totalElem.textContent = currentMotos.length;
        
        // Disponíveis
        const disponiveis = currentMotos.filter(m => m.status === 'disponivel' || !m.status).length;
        const disponiveisElem = document.getElementById('disponiveisCount');
        if (disponiveisElem) disponiveisElem.textContent = disponiveis;
        
        // Vendidos
        const vendidos = currentMotos.filter(m => m.status === 'vendido').length;
        const vendidosElem = document.getElementById('vendidosCount');
        if (vendidosElem) vendidosElem.textContent = vendidos;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Utilitários

function refreshData() {
    console.log('🔄 Atualizando dados...');
    loadMotos();
    loadAppointments();
    loadStats();
}

function getCategoryName(categoria) {
    const categories = {
        'sport': 'Sport',
        'naked': 'Naked',
        'adventure': 'Adventure',
        'custom': 'Custom',
        'touring': 'Touring',
        'cruiser': 'Cruiser',
        'street': 'Street',
        'scooter': 'Scooter'
    };
    return categories[categoria] || categoria;
}

function getCategoryFromDisplacement(displacement) {
    if (!displacement) return 'street';
    if (displacement <= 125) return 'scooter';
    if (displacement <= 250) return 'street';
    if (displacement <= 600) return 'naked';
    if (displacement <= 1000) return 'sport';
    return 'touring';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showMessage(message, type) {
    // Remove mensagens existentes
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Inserir no início do container
    const container = document.querySelector('.admin-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading() {
    const grid = document.getElementById('adminGrid');
    if (!grid) {
        console.error('❌ [ERROR] Elemento adminGrid não encontrado!');
        return;
    }
    grid.innerHTML = `
        <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
            <div class="loading" style="margin: 0 auto"></div>
            <p style="margin-top: 1rem; opacity: 0.7;">Carregando motocicletas...</p>
        </div>
    `;
}

function hideLoading() {
    // Loading é removido quando renderMotos é chamado
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

// Função para navegar para o catálogo/vitrine
function goToClient() {
    window.location.href = 'index.html';
}

// Fechar modais com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('motoModal').style.display === 'block') {
            closeMotoModal();
        }
        if (document.getElementById('confirmModal').style.display === 'block') {
            closeConfirmModal();
        }
        if (document.getElementById('soldMotorcyclesModal').style.display === 'block') {
            closeSoldMotorcyclesModal();
        }
        if (document.getElementById('saleModal').style.display === 'block') {
            closeSaleModal();
        }
    }
    
    // Atalho F para abrir filtro (quando modal de vendas estiver aberto)
    if (e.key === 'f' && document.getElementById('soldMotorcyclesModal').style.display === 'block') {
        e.preventDefault();
        const filterSelect = document.getElementById('monthFilter');
        if (filterSelect) {
            filterSelect.focus();
        }
    }
});

// Fechar modais clicando fora
const motoModal = document.getElementById('motorcycleModal');
if (motoModal) {
    motoModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeMotoModal();
        }
    });
}

const confirmModal = document.getElementById('confirmModal');
if (confirmModal) {
    confirmModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmModal();
        }
    });
}

// ============ FUNÇÕES DE MODAL DE VISUALIZAÇÃO ============

let currentViewMoto = null;
let currentViewImageIndex = 0;

function viewMotoDetails(id) {
    console.log('👁️ [DEBUG] viewMotoDetails chamado com ID:', id);
    
    const moto = currentMotos.find(m => m.id === id);
    if (!moto) {
        console.error('❌ [DEBUG] Moto não encontrada:', id);
        alert('Motocicleta não encontrada!');
        return;
    }
    
    console.log('✅ [DEBUG] Moto encontrada:', moto.name || moto.nome);
    
    currentViewMoto = moto;
    currentViewImageIndex = 0;
    
    const viewContent = document.getElementById('viewContent');
    if (!viewContent) {
        console.error('❌ [DEBUG] Elemento viewContent não encontrado!');
        alert('Erro: Modal de visualização não encontrado!');
        return;
    }
    
    console.log('✅ [DEBUG] Elemento viewContent encontrado, preenchendo...');
    
    // Construir array de imagens
    const images = moto.images && moto.images.length > 0 
        ? moto.images 
        : (moto.image || moto.image_thumbnail ? [moto.image || moto.image_thumbnail] : []);
    
    const hasMultipleImages = images.length > 1;
    
    // Criar botão PDF se existir documento
    let botaoPDF = '';
    if (moto.documentoPDF) {
        let pdfPath = moto.documentoPDF;
        
        console.log('📄 [DEBUG] Caminho original do PDF:', pdfPath);
        
        // Se contém "DOCS Motos", extrair tudo após essa pasta e manter estrutura
        if (pdfPath.includes('DOCS Motos')) {
            const relativePath = pdfPath.split('DOCS Motos')[1]
                .replace(/^[\\\/]+/, '') // Remove barras iniciais
                .replace(/\\/g, '/');     // Converte barras invertidas
            pdfPath = `DOCS Motos/${relativePath}`;
        } 
        // Se for caminho completo mas sem "DOCS Motos", extrair nome do arquivo
        else if (pdfPath.includes('\\') || pdfPath.includes('/')) {
            const fileName = pdfPath.split('\\').pop().split('/').pop();
            pdfPath = `DOCS Motos/${fileName}`;
        } 
        // Se não tiver prefixo DOCS Motos/, adicionar
        else if (!pdfPath.startsWith('DOCS Motos/') && !pdfPath.startsWith('docs/')) {
            pdfPath = `DOCS Motos/${pdfPath}`;
        }
        
        // Codificar espaços e caracteres especiais para URL
        pdfPath = encodeURI(pdfPath);
        
        console.log('📄 [DEBUG] Caminho processado do PDF:', pdfPath);
        
        botaoPDF = `<div style="margin-top: 1rem;">
            <a href="${pdfPath}" target="_blank" style="background: #e74c3c; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                📄 Ver CRLV (PDF)
            </a>
        </div>`;
    }
    
    viewContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
            <div class="view-image">
                <div class="modal-image-gallery">
                    <img id="viewModalImage" src="${images[0] || '/images/placeholder.jpg'}" 
                         alt="${moto.name}">
                    ${hasMultipleImages ? `
                        <button class="gallery-nav prev" id="viewPrevBtn" onclick="navigateViewGallery(-1)">&#10094;</button>
                        <button class="gallery-nav next" id="viewNextBtn" onclick="navigateViewGallery(1)">&#10095;</button>
                        <div class="gallery-counter" id="viewCounter">1 / ${images.length}</div>
                    ` : ''}
                </div>
            </div>
            <div class="view-details">
                <h2>${moto.name}</h2>
                <div>
                    <div><strong>Categoria:</strong> ${moto.category || 'Não informado'}</div>
                    <div><strong>Tipo:</strong> ${moto.type || 'Não informado'}</div>
                    <div><strong>Ano:</strong> ${moto.year || 'Não informado'}</div>
                    <div><strong>Cilindrada:</strong> ${moto.engine_cc || moto.cc || 'Não informado'}</div>
                    <div><strong>Combustível:</strong> ${moto.fuel || 'Não informado'}</div>
                    ${moto.color || moto.cor ? `<div><strong>Cor:</strong> ${moto.color || moto.cor}</div>` : ''}
                    ${moto.mileage_display || moto.km ? `<div><strong>Quilometragem:</strong> ${moto.mileage_display || moto.km}</div>` : ''}
                </div>
                ${moto.description ? `<div style="margin-top: 1rem;"><strong>Descrição:</strong><br>${moto.description}</div>` : ''}
                ${botaoPDF}
            </div>
        </div>
    `;
    
    console.log('✅ [DEBUG] Conteúdo preenchido, mostrando modal...');
    const viewModal = document.getElementById('viewModal');
    if (viewModal) {
        console.log('✅ [DEBUG] viewModal encontrado:', viewModal);
        console.log('✅ [DEBUG] Classes antes:', viewModal.className);
        viewModal.classList.add('active');
        console.log('✅ [DEBUG] Classes depois:', viewModal.className);
        console.log('✅ [DEBUG] Display computado:', window.getComputedStyle(viewModal).display);
        document.body.style.overflow = 'hidden';
        console.log('✅ [DEBUG] Modal viewModal exibido!');
    } else {
        console.error('❌ [DEBUG] Modal viewModal não encontrado!');
    }
}

function navigateViewGallery(direction) {
    if (!currentViewMoto) return;
    
    const images = currentViewMoto.images && currentViewMoto.images.length > 0 
        ? currentViewMoto.images 
        : (currentViewMoto.image || currentViewMoto.image_thumbnail ? [currentViewMoto.image || currentViewMoto.image_thumbnail] : []);
    
    if (images.length <= 1) return;
    
    currentViewImageIndex += direction;
    
    // Garantir que o índice está dentro dos limites
    if (currentViewImageIndex < 0) currentViewImageIndex = 0;
    if (currentViewImageIndex >= images.length) currentViewImageIndex = images.length - 1;
    
    // Atualizar imagem
    const imgElement = document.getElementById('viewModalImage');
    if (imgElement) {
        imgElement.src = images[currentViewImageIndex];
    }
    
    // Atualizar contador
    const counter = document.getElementById('viewCounter');
    if (counter) {
        counter.textContent = `${currentViewImageIndex + 1} / ${images.length}`;
    }
    
    // Atualizar estado dos botões
    const prevBtn = document.getElementById('viewPrevBtn');
    const nextBtn = document.getElementById('viewNextBtn');
    if (prevBtn) prevBtn.disabled = currentViewImageIndex === 0;
    if (nextBtn) nextBtn.disabled = currentViewImageIndex === images.length - 1;
}

function closeViewModal() {
    const viewModal = document.getElementById('viewModal');
    if (viewModal) {
        viewModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    currentViewMoto = null;
    currentViewImageIndex = 0;
}

// ============================================
// FUNÇÕES DE EDIÇÃO DE MOTOS VENDIDAS
// ============================================

// Abrir modal de edição de venda
async function editSoldMoto(motoId) {
    try {
        console.log('✏️ Editando venda:', motoId);
        
        // Salvar posição de scroll atual do modal de vendidas
        const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
        if (modalContent) {
            savedScrollPosition = modalContent.scrollTop;
            console.log('💾 Posição de scroll salva:', savedScrollPosition);
        }
        
        // Buscar dados atualizados da moto
        const response = await fetch('/api/motorcycles');
        if (!response.ok) throw new Error('Erro ao carregar motocicletas');
        
        const motorcycles = await response.json();
        const moto = motorcycles.find(m => m.id === motoId);
        
        if (!moto) {
            showMessage('❌ Motocicleta não encontrada', 'error');
            return;
        }
        
        // Preencher modal
        document.getElementById('editSoldMotoId').value = moto.id;
        document.getElementById('editBuyerName').value = moto.buyerName || '';
        document.getElementById('editSaleRenavam').value = moto.renavam || '';
        document.getElementById('editSalePlaca').value = moto.placa || '';
        document.getElementById('editSaleChassi').value = moto.chassi || '';
        document.getElementById('editSaleNotes').value = moto.saleNotes || '';
        
        // Formatar data para input date
        if (moto.saleDate) {
            const date = new Date(moto.saleDate);
            const dateStr = date.toISOString().split('T')[0];
            document.getElementById('editSaleDate').value = dateStr;
        }
        
        // Mostrar informações da moto
        const motoInfo = document.getElementById('editSoldMotoInfo');
        motoInfo.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #ff6600; font-size: 18px;">
                ${moto.marca || ''} ${moto.modelo || moto.name || ''}
            </h4>
            <p style="margin: 5px 0; opacity: 0.9; font-size: 14px;">
                <strong>Ano:</strong> ${moto.ano || moto.year || 'N/A'} | 
                <strong>Cor:</strong> ${moto.cor || moto.color || 'N/A'} | 
                <strong>Cilindrada:</strong> ${moto.cilindradas || moto.cc || 'N/A'}cc
            </p>
        `;
        
        // Abrir modal
        const modal = document.getElementById('editSoldMotoModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Erro ao abrir edição:', error);
        showMessage('❌ Erro ao carregar dados da venda', 'error');
    }
}

// Fechar modal de edição
function closeEditSoldMotoModal() {
    const modal = document.getElementById('editSoldMotoModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('editSoldMotoForm').reset();
}

// Processar formulário de edição
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editSoldMotoForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const motoId = document.getElementById('editSoldMotoId').value;
            const buyerName = document.getElementById('editBuyerName').value;
            const saleDate = document.getElementById('editSaleDate').value;
            const renavam = document.getElementById('editSaleRenavam').value;
            const placa = document.getElementById('editSalePlaca').value;
            const chassi = document.getElementById('editSaleChassi').value;
            const saleNotes = document.getElementById('editSaleNotes').value;
            
            if (!buyerName || !saleDate) {
                showMessage('❌ Nome do comprador e data são obrigatórios', 'error');
                return;
            }
            
            try {
                console.log('💾 Salvando alterações da venda:', motoId);
                
                // Converter data local para ISO
                const [year, month, day] = saleDate.split('-');
                const localDate = new Date(year, month - 1, day);
                const saleDateISO = localDate.toISOString();
                
                const response = await fetch(`/api/motorcycles/${motoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        buyerName: buyerName,
                        saleDate: saleDateISO,
                        renavam: renavam || '',
                        placa: placa || '',
                        chassi: chassi || '',
                        saleNotes: saleNotes || '',
                        updatedAt: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao salvar alterações');
                }
                
                console.log('✅ Alterações salvas com sucesso');
                
                // Fechar modal
                closeEditSoldMotoModal();
                
                // Recarregar painel de vendas
                showSoldMotorcycles();
                
                showMessage('✅ Dados da venda atualizados com sucesso!', 'success');
                
            } catch (error) {
                console.error('❌ Erro ao salvar alterações:', error);
                showMessage('❌ Erro ao salvar alterações', 'error');
            }
        });
    }
});