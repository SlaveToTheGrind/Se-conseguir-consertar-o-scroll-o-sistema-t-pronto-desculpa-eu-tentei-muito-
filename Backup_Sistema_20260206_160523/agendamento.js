// Sistema de Agendamento - MacDavis Motos
console.log('%c🚀 AGENDAMENTO.JS CARREGADO - VERSÃO CORRIGIDA - 22:37 - 16/01/2026', 'background: #4CAF50; color: white; font-size: 20px; padding: 10px;');
console.log('🔄 Timestamp:', new Date().toISOString());

// Função para formatar números com separador de milhares
function formatarNumero(numero) {
    if (!numero) return '0';
    const num = typeof numero === 'string' ? parseInt(numero.replace(/\./g, '')) : parseInt(numero);
    return num.toLocaleString('pt-BR');
}

let motorcycles = [];
let agendamentos = []; // Agendamentos do usuário (filtrados)
let todosAgendamentos = []; // TODOS os agendamentos (para verificar horários ocupados)
let selectedMoto = null;
let userData = null;
let autoRefreshInterval = null; // Intervalo de atualização automática
let lastAgendamentosHash = ''; // Hash para detectar mudanças

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📱 [AGENDAMENTO] Página carregada!');
    
    // 🔥 LIMPAR CACHE FORÇADAMENTE
    console.log('🧹 Limpando cache de agendamentos...');
    localStorage.removeItem('appointments');
    localStorage.removeItem('todosAgendamentos');
    sessionStorage.clear();
    console.log('✅ Cache limpo!');
    
    // Inicializar sistema Toast
    setTimeout(() => {
        if (window.Toast) {
            console.log('✅ Toast disponível no agendamento!');
            Toast.info('Sistema de agendamento carregado! 📅', 3000);
        } else {
            console.error('❌ Toast NÃO disponível no agendamento!');
        }
    }, 1000);
    
    // Verificar login
    checkUserLogin();
    
    // Carregar dados
    await loadMotorcycles();
    
    // Configurar moto selecionada
    setupSelectedMoto();
    
    // Configurar formulário
    setupForm();
    
    // Inicializar dropdown customizado de horários
    initCustomSelect();
    
    // Carregar agendamentos
    await loadAppointments();
    
    // Atualizar horários disponíveis após carregar agendamentos
    updateAvailableTimes();
    
    // Renderizar interface
    renderSelectedMoto();
    renderUserInfo();
    renderAppointments();
    
    // Iniciar atualização automática de horários disponíveis
    startAutoRefresh();
});

// Atualização automática de horários disponíveis
function startAutoRefresh() {
    // Atualizar a cada 1 segundo (mesma velocidade do admin)
    autoRefreshInterval = setInterval(async () => {
        const dateInput = document.getElementById('appointmentDate');
        
        // Só atualizar se houver uma data selecionada
        if (dateInput && dateInput.value) {
            // Recarregar agendamentos silenciosamente
            try {
                const response = await fetch('/api/appointments');
                if (response.ok) {
                    const agendamentosAtuais = await response.json();
                    
                    // Criar hash dos agendamentos para detectar mudanças
                    const currentHash = JSON.stringify(
                        agendamentosAtuais.map(a => ({
                            id: a.id,
                            status: a.status,
                            data: a.data || a.date,
                            horario: a.horario || a.time
                        }))
                    );
                    
                    // Se houve mudança, atualizar
                    if (currentHash !== lastAgendamentosHash) {
                        console.log('✅ Mudança detectada! Atualizando horários disponíveis...');
                        lastAgendamentosHash = currentHash;
                        todosAgendamentos = agendamentosAtuais;
                        updateAvailableTimes();
                        
                        // Mostrar notificação visual sutil
                        Toast.success('Horários atualizados!');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Auto-refresh: Erro ao verificar atualizações:', error);
            }
        }
    }, 1000); // 1 segundo - mesma velocidade do admin
}

// Função antiga removida - usando Toast.success agora
function showRefreshNotification() {
    // Mantida para compatibilidade, mas usa Toast
    Toast.success('Horários atualizados!');
}

// Parar atualização automática (quando sair da página)
window.addEventListener('beforeunload', function() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

// Verificar se usuário está logado
function checkUserLogin() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        window.location.href = 'login.html';
        return;
    }
    userData = JSON.parse(userDataStr);
}

// Logout
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Voltar ao catálogo
function goBack() {
    window.location.href = 'catalog.html';
}

// Carregar motocicletas
async function loadMotorcycles() {
    console.log('🔄 AGENDAMENTO: Carregando motocicletas...');
    
    try {
        const response = await fetch('/api/motorcycles', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        motorcycles = Array.isArray(data) ? data : [];
        console.log('✅ AGENDAMENTO: Motocicletas carregadas da API:', motorcycles.length);
        
        // Salvar backup no localStorage
        localStorage.setItem('motorcycles', JSON.stringify(motorcycles));
        
    } catch (error) {
        console.warn('⚠️ AGENDAMENTO: API indisponível, usando localStorage:', error.message);
        
        const stored = localStorage.getItem('motorcycles');
        if (stored) {
            try {
                motorcycles = JSON.parse(stored);
                console.log('✅ AGENDAMENTO: Motocicletas do localStorage:', motorcycles.length);
            } catch (e) {
                console.error('❌ AGENDAMENTO: Erro no localStorage:', e);
                motorcycles = [];
            }
        } else {
            console.warn('⚠️ AGENDAMENTO: Nenhuma motocicleta disponível');
            motorcycles = [];
        }
    }
}

// Configurar moto selecionada
function setupSelectedMoto() {
    const selectedMotoId = localStorage.getItem('selectedMotoId');
    const selectedMotoDataStr = localStorage.getItem('selectedMotoData');
    
    if (selectedMotoId) {
        // Primeiro tenta encontrar na lista carregada
        selectedMoto = motorcycles.find(m => m.id === selectedMotoId);
        
        // Se não encontrou mas tem dados salvos, usa os dados salvos
        if (!selectedMoto && selectedMotoDataStr) {
            try {
                selectedMoto = JSON.parse(selectedMotoDataStr);
                console.log('✅ AGENDAMENTO: Usando dados salvos da moto:', selectedMoto.name);
            } catch (e) {
                console.error('❌ AGENDAMENTO: Erro ao recuperar dados salvos:', e);
            }
        } else if (selectedMoto) {
            console.log('✅ AGENDAMENTO: Moto encontrada na lista:', selectedMoto.name);
        }
    }
}

// Configurar formulário
function setupForm() {
    console.log('🔧 AGENDAMENTO: Configurando formulário...');
    
    const form = document.getElementById('appointmentForm');
    const serviceSelect = document.getElementById('serviceSelect');
    
    if (!serviceSelect) {
        console.error('❌ AGENDAMENTO: Select não encontrado!');
        return;
    }
    
    // Limpar select
    serviceSelect.innerHTML = '';
    
    if (!motorcycles || motorcycles.length === 0) {
        serviceSelect.innerHTML = '<option value="">Nenhuma motocicleta disponível</option>';
        console.warn('⚠️ AGENDAMENTO: Lista de motocicletas vazia');
        return;
    }
    
    // Preencher select
    serviceSelect.innerHTML = '<option value="">Selecione uma motocicleta</option>';
    
    // Filtrar apenas motos disponíveis (não vendidas) E visíveis no catálogo
    const motosDisponiveis = motorcycles.filter(moto => 
        moto.status !== 'vendido' && 
        moto.showInCatalog !== false
    );
    
    if (motosDisponiveis.length === 0) {
        serviceSelect.innerHTML = '<option value="">Nenhuma motocicleta disponível</option>';
        console.warn('⚠️ AGENDAMENTO: Todas as motos estão vendidas');
        return;
    }
    
    motosDisponiveis.forEach((moto, index) => {
        const option = document.createElement('option');
        option.value = moto.id;
        option.textContent = `${moto.name} - ${moto.year} (${moto.color})`;
        serviceSelect.appendChild(option);
        console.log(`📋 AGENDAMENTO: Moto ${index + 1}: ${moto.name}`);
    });
    
    console.log(`✅ AGENDAMENTO: ${motorcycles.length} motocicletas no select`);
    
    // Pre-selecionar se há moto escolhida
    if (selectedMoto) {
        // Usar setTimeout para garantir que o DOM foi atualizado
        setTimeout(() => {
            const option = Array.from(serviceSelect.options).find(opt => opt.value === selectedMoto.id);
            if (option) {
                serviceSelect.value = selectedMoto.id;
                console.log('🎯 AGENDAMENTO: Moto pré-selecionada:', selectedMoto.name, '- ID:', selectedMoto.id);
            } else {
                console.warn('⚠️ AGENDAMENTO: Opção não encontrada para ID:', selectedMoto.id);
                console.log('Opções disponíveis:', Array.from(serviceSelect.options).map(o => o.value));
            }
        }, 100);
    }
    
    // Listener para atualizar preview quando mudar a seleção
    serviceSelect.addEventListener('change', function(e) {
        const motoId = e.target.value;
        updateMotoPreview(motoId);
    });
    
    // Se já tem moto selecionada, mostrar preview
    if (selectedMoto) {
        updateMotoPreview(selectedMoto.id);
    }
    
    // Configurar data mínima (hoje)
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const today = `${ano}-${mes}-${dia}`;
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.min = today;
        
        // Adicionar validação customizada para bloquear dias sem horários
        dateInput.addEventListener('input', function(e) {
            const selectedDate = e.target.value;
            if (selectedDate && !isDateAvailable(selectedDate)) {
                e.target.setCustomValidity('❌ Esta data não possui horários disponíveis. Por favor, escolha outra data.');
                showErrorMessage('❌ Esta data está completamente ocupada. Escolha outra data com horários disponíveis.');
            } else {
                e.target.setCustomValidity('');
            }
        });
        
        // Adicionar listener para atualizar horários quando a data mudar
        dateInput.addEventListener('change', function(e) {
            const selectedDate = e.target.value;
            
            if (selectedDate) {
                const dataSelecionada = new Date(selectedDate + 'T12:00:00');
                const diaDaSemana = dataSelecionada.getDay();
                
                // Bloquear domingos
                if (diaDaSemana === 0) {
                    e.target.value = '';
                    showErrorMessage('❌ Não abrimos aos domingos! Por favor, escolha outro dia.');
                    updateAvailableTimes();
                    return;
                }
                
                // Verificar disponibilidade
                if (!isDateAvailable(selectedDate)) {
                    e.target.value = '';
                    showErrorMessage('❌ Esta data não possui horários disponíveis. Por favor, escolha outra data.');
                    updateAvailableTimes();
                } else {
                    updateAvailableTimes();
                }
            } else {
                updateAvailableTimes();
            }
        });
    }
    
    // Atualizar horários disponíveis ao carregar
    updateAvailableTimes();
    
    // Handler do formulário (evitar duplicatas)
    if (form) {
        form.removeEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', handleFormSubmit);
    }
    
    console.log('✅ AGENDAMENTO: Formulário configurado com sucesso!');
}

// Handler do submit do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    showLoading();
    
    const formData = new FormData(e.target);
    
    const appointment = {
        id: Date.now().toString(),
        cliente: userData.nome || 'Cliente',
        email: userData.email || '',
        telefone: userData.telefone || '',
        servico: getServiceName(formData.get('service')),
        servicoId: formData.get('service'),
        data: formData.get('date'),
        horario: formData.get('time'),
        observacoes: formData.get('notes') || '',
        timestamp: new Date().toISOString(),
        status: 'agendado'
    };
    
    try {
        console.log('🔍 Verificando conflito...', {
            data: appointment.data,
            horario: appointment.horario,
            totalAgendamentos: todosAgendamentos.length,
            todosAgendamentos: todosAgendamentos
        });
        
        // VALIDAÇÃO 1: Verificar se a data tem horários disponíveis
        if (!isDateAvailable(appointment.data)) {
            hideLoading();
            showErrorMessage(`❌ A data ${formatDate(appointment.data)} não possui mais horários disponíveis. Por favor, escolha outra data.`);
            return;
        }
        
        // VALIDAÇÃO 2: Verificar se o horário específico já está ocupado
        // Apenas agendamentos PENDENTES/AGENDADOS bloqueiam o horário
        const horarioOcupado = todosAgendamentos.find(ag => {
            const agData = ag.data || ag.date;
            const agHorario = ag.horario || ag.time;
            const status = ag.status || 'pendente';
            return agData === appointment.data && 
                   agHorario === appointment.horario &&
                   status !== 'cancelado' &&
                   status !== 'realizado';
        });
        
        if (horarioOcupado) {
            hideLoading();
            showErrorMessage(`❌ O horário ${appointment.horario} do dia ${formatDate(appointment.data)} já está ocupado por outro cliente. Por favor, escolha outro horário.`);
            // Recarregar horários disponíveis
            await loadAppointments();
            updateAvailableTimes();
            return;
        }
        
        // VALIDAÇÃO 3: Prevenir corrida de condição (double-check antes de salvar)
        // Recarregar agendamentos direto da API para garantir dados mais recentes
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                const agendamentosAtualizados = await response.json();
                const conflito = agendamentosAtualizados.find(ag => {
                    const status = ag.status || 'pendente';
                    return (ag.data || ag.date) === appointment.data && 
                           (ag.horario || ag.time) === appointment.horario &&
                           status !== 'cancelado' &&
                           status !== 'realizado';
                });
                
                if (conflito) {
                    hideLoading();
                    showErrorMessage(`❌ Este horário acabou de ser reservado por outro usuário. Por favor, escolha outro horário.`);
                    await loadAppointments();
                    updateAvailableTimes();
                    return;
                }
            }
        } catch (error) {
            console.warn('Não foi possível verificar conflitos em tempo real:', error);
        }
        
        // Salvar agendamento
        await saveAppointment(appointment);
        
        // NOTIFICAÇÃO VISUAL DE SUCESSO - TOAST GRANDE E BONITO!
        if (window.Toast) {
            Toast.success(`✅ Agendamento confirmado!\n📅 ${formatDate(appointment.data)} às ${appointment.horario}\n🏍️ ${getServiceName(appointment.servico)}`, 6000);
        } else {
            showSuccessMessage(`✅ Agendamento confirmado para ${formatDate(appointment.data)} às ${appointment.horario}!`);
        }
        
        // Recarregar lista de agendamentos (IMPORTANTE: aguardar antes de atualizar horários)
        await loadAppointments();
        renderAppointments();
        
        // Atualizar horários disponíveis (agora com lista atualizada)
        updateAvailableTimes();
        
        // Reset do formulário APÓS atualizar horários
        e.target.reset();
        if (selectedMoto) {
            document.getElementById('serviceSelect').value = selectedMoto.id;
        }
        
        // Mostrar card de confirmação detalhado
        showAppointmentConfirmation(appointment);
        
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        if (window.Toast) {
            Toast.error('❌ ' + (error.message || 'Erro ao processar agendamento. Tente novamente.'), 5000);
        } else {
            showErrorMessage(error.message || 'Erro ao processar agendamento. Tente novamente.');
        }
    }
    
    hideLoading();
}

// Obter nome do serviço
function getServiceName(serviceId) {
    const moto = motorcycles.find(m => m.id === serviceId);
    return moto ? `${moto.name} - ${moto.year} (${moto.color})` : 'Serviço não encontrado';
}

// Verificar se uma data tem horários disponíveis
function isDateAvailable(dateStr) {
    const allTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Buscar horários ocupados nesta data
    // APENAS agendamentos PENDENTES bloqueiam (não cancelados nem realizados)
    const bookedTimes = todosAgendamentos
        .filter(appt => {
            const apptDate = appt.data || appt.date;
            const status = appt.status || 'pendente';
            return apptDate === dateStr && 
                   status !== 'cancelado' && 
                   status !== 'realizado';
        })
        .map(appt => appt.horario || appt.time);
    
    // Se todos os horários estão ocupados, data não disponível
    const availableCount = allTimes.filter(time => !bookedTimes.includes(time)).length;
    
    console.log(`📅 isDateAvailable(${dateStr}):`, {
        totalHorarios: allTimes.length,
        ocupados: bookedTimes.length,
        disponiveis: availableCount,
        resultado: availableCount > 0 ? '✅ DISPONÍVEL' : '❌ OCUPADA'
    });
    
    return availableCount > 0;
}

// Obter dias com horários disponíveis
function getDaysWithAvailableSlots() {
    const allTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Criar mapa de datas -> horários ocupados
    // APENAS agendamentos PENDENTES bloqueiam (não cancelados nem realizados)
    const dateMap = new Map();
    todosAgendamentos.forEach(appt => {
        const status = appt.status || 'pendente';
        if (status === 'cancelado' || status === 'realizado') return;
        
        const date = appt.data || appt.date;
        const time = appt.horario || appt.time;
        
        if (!dateMap.has(date)) {
            dateMap.set(date, []);
        }
        dateMap.get(date).push(time);
    });
    
    // Retornar apenas datas que têm pelo menos 1 horário disponível
    const availableDates = new Set();
    const today = new Date();
    const maxDays = 90; // Verificar próximos 90 dias
    
    for (let i = 0; i < maxDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const bookedTimes = dateMap.get(dateStr) || [];
        const availableSlots = allTimes.filter(time => !bookedTimes.includes(time));
        
        if (availableSlots.length > 0) {
            availableDates.add(dateStr);
        }
    }
    
    console.log(`📅 ${availableDates.size} datas com horários disponíveis nos próximos ${maxDays} dias`);
    return availableDates;
}

// Atualizar horários disponíveis baseado na data selecionada
function updateAvailableTimes() {
    console.log('%c▶️ updateAvailableTimes() CHAMADA - VERSÃO CORRIGIDA 22:57', 'background: #0066ff; color: white; font-size: 14px; padding: 5px;');
    
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    const customTimeOptions = document.getElementById('customTimeOptions');
    const customTimeValue = document.getElementById('customTimeValue');
    
    if (!dateInput || !timeSelect) return;
    
    const selectedDate = dateInput.value;
    
    // Verificar se é domingo (bloqueado - não abrimos)
    if (selectedDate) {
        const dataSelecionada = new Date(selectedDate + 'T12:00:00');
        const diaDaSemana = dataSelecionada.getDay(); // 0 = Domingo, 6 = Sábado
        
        if (diaDaSemana === 0) {
            // DOMINGO - Não abrimos
            timeSelect.innerHTML = '<option value="">❌ Não abrimos aos domingos</option>';
            if (customTimeOptions) customTimeOptions.innerHTML = '';
            if (customTimeValue) {
                customTimeValue.textContent = '❌ Não abrimos aos domingos';
                customTimeValue.style.color = '#ff4444';
            }
            console.log('🚫 DOMINGO bloqueado - loja fechada');
            return;
        }
    }
    
    // Horários disponíveis da loja
    // Segunda a Sexta: 9h às 17:30  
    // Sábado: 9h às 11:30 (fechamos às 12h)
    let allTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    console.log(`📊 allTimes inicial: ${allTimes.length} horários`);
    
    // Verificar se é sábado e limitar horários
    if (selectedDate) {
        const dataSelecionada = new Date(selectedDate + 'T12:00:00');
        const diaDaSemana = dataSelecionada.getDay();
        
        console.log(`📅 Dia da semana: ${diaDaSemana} (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb)`);
        
        if (diaDaSemana === 6) {
            // SÁBADO - Só até 11:30h  
            allTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
            console.log('📅 SÁBADO detectado - horários limitados até 11:30h (a partir de 09:00)');
        }
    }
    
    console.log(`📊 allTimes após verificar sábado: ${allTimes.length} horários`);
    
    // Se a data selecionada for HOJE, filtrar horários que já passaram
    // USAR DATA LOCAL (não UTC) para evitar problemas de timezone
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hoje = `${ano}-${mes}-${dia}`;
    
    console.log(`🕐 COMPARAÇÃO DE DATAS:`);
    console.log(`   - Hoje (LOCAL): ${hoje}`);
    console.log(`   - Data selecionada: ${selectedDate}`);
    console.log(`   - São iguais? ${selectedDate === hoje}`);
    console.log(`   - Hora atual: ${agora.toLocaleString('pt-BR')}`);
    
    if (selectedDate === hoje) {
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();
        
        console.log(`⏰ Hora atual: ${horaAtual}:${minutoAtual}`);
        
        allTimes = allTimes.filter(horario => {
            const [hora, minuto] = horario.split(':').map(Number);
            
            // Horário futuro: maior que a hora atual
            if (hora > horaAtual) return true;
            
            // Mesma hora: minuto precisa ser maior que o atual
            if (hora === horaAtual && minuto > minutoAtual) return true;
            
            // Horário já passou
            return false;
        });
        
        console.log(`⏰ Horários após filtrar passados: ${allTimes.length}`);
    }
    
    console.log(`📊 allTimes FINAL antes de limpar select: ${allTimes.length} horários`, allTimes);
    
    // Limpar select
    timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
    
    // Limpar dropdown customizado
    if (customTimeOptions) customTimeOptions.innerHTML = '';
    if (customTimeValue) {
        customTimeValue.textContent = 'Selecione um horário';
        customTimeValue.style.color = '';
    }
    
    if (!selectedDate) {
        // Se não há data selecionada, mostrar todos os horários
        allTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
            
            // Adicionar ao dropdown customizado
            if (customTimeOptions) {
                const customOption = document.createElement('div');
                customOption.className = 'custom-option disponivel';
                customOption.textContent = `${time} ✅ Disponível`;
                customOption.onclick = () => selectCustomTime(time, 'disponivel');
                customTimeOptions.appendChild(customOption);
            }
        });
        console.log(`✅ ${allTimes.length} horários adicionados ao dropdown (sem data selecionada)`);
        return;
    }
    
    // Buscar TODOS os agendamentos para a data selecionada (não só os do usuário)
    // Apenas agendamentos PENDENTES/AGENDADOS bloqueiam horários
    // Cancelados e realizados liberam o horário automaticamente
    
    console.log(`\n🔍 INICIANDO VERIFICAÇÃO DE HORÁRIOS`);
    console.log(`📅 Data selecionada: ${selectedDate}`);
    console.log(`📊 Total de agendamentos no array todosAgendamentos: ${todosAgendamentos.length}`);
    
    const bookedTimes = todosAgendamentos
        .filter(ag => {
            const agDate = ag.data || ag.date;
            const status = ag.status || 'pendente';
            const matchDate = agDate === selectedDate;
            const isBlocking = status !== 'cancelado' && status !== 'realizado';
            const shouldBlock = matchDate && isBlocking;
            
            if (matchDate) {
                console.log(`  📍 Data ${agDate}: ${ag.horario || ag.time} | Status: "${status}" | Bloqueia: ${shouldBlock ? '🔴 SIM' : '🟢 NÃO'}`);
            }
            
            return shouldBlock;
        })
        .map(ag => ag.horario || ag.time);
    
    console.log(`\n🚫 Horários bloqueados:`, bookedTimes);
    console.log(`📊 Total de horários bloqueados: ${bookedTimes.length}\n`);
    console.log(`📊 TODOS os agendamentos:`, todosAgendamentos.length);
    console.log(`🔍 Agendamentos para ${selectedDate}:`, todosAgendamentos.filter(ag => {
        const agDate = ag.data || ag.date;
        return agDate === selectedDate;
    }));
    console.log(`�🚫 Horários ocupados:`, bookedTimes);
    
    // Adicionar APENAS os horários disponíveis (não ocupados)
    const availableCount = allTimes.filter(time => !bookedTimes.includes(time)).length;
    
    // Mostrar TODOS os horários com indicação visual de disponibilidade
    allTimes.forEach(time => {
        const isBooked = bookedTimes.includes(time);
        
        // Select nativo (para envio do formulário)
        const option = document.createElement('option');
        option.value = time;
        option.textContent = isBooked ? `${time} ❌ Ocupado` : `${time} ✅ Disponível`;
        if (isBooked) option.disabled = true;
        option.className = isBooked ? 'horario-ocupado' : 'horario-disponivel';
        option.setAttribute('data-status', isBooked ? 'ocupado' : 'disponivel');
        timeSelect.appendChild(option);
        
        // Dropdown customizado (visual)
        const customTimeOptions = document.getElementById('customTimeOptions');
        if (customTimeOptions) {
            const customOption = document.createElement('div');
            customOption.className = isBooked ? 'custom-option ocupado' : 'custom-option disponivel';
            customOption.textContent = isBooked ? `${time} ❌ Ocupado` : `${time} ✅ Disponível`;
            customOption.setAttribute('data-value', time);
            customOption.setAttribute('data-status', isBooked ? 'ocupado' : 'disponivel');
            
            if (!isBooked) {
                customOption.addEventListener('click', () => selectCustomTime(time, 'disponivel'));
            } else {
                customOption.addEventListener('click', (e) => {
                    e.preventDefault();
                    showErrorMessage('❌ Este horário já está ocupado. Escolha outro horário disponível.');
                });
            }
            
            customTimeOptions.appendChild(customOption);
        }
    });
    
    console.log(`✅ Resumo de horários para ${selectedDate}:`, {
        total: allTimes.length,
        ocupados: bookedTimes.length,
        disponiveis: availableCount,
        horariosOcupados: bookedTimes,
        percentualOcupacao: Math.round((bookedTimes.length / allTimes.length) * 100) + '%'
    });
    
    // Se não há horários disponíveis, adicionar aviso visual
    if (availableCount === 0) {
        console.warn('⚠️ ATENÇÃO: Todos os horários estão ocupados para', selectedDate);
        // Adicionar aviso no topo do select
        const warningOption = document.createElement('option');
        warningOption.value = '';
        warningOption.textContent = '⚠️ Todos os horários estão ocupados - Escolha outra data';
        warningOption.disabled = true;
        warningOption.selected = true;
        warningOption.style.color = '#ff6600';
        warningOption.style.fontWeight = 'bold';
        timeSelect.insertBefore(warningOption, timeSelect.firstChild.nextSibling);
        
        // Adicionar aviso no dropdown customizado
        if (customTimeOptions) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'custom-option ocupado';
            warningDiv.style.textAlign = 'center';
            warningDiv.style.fontWeight = 'bold';
            warningDiv.style.cursor = 'not-allowed';
            warningDiv.textContent = '⚠️ Todos os horários estão ocupados - Escolha outra data';
            customTimeOptions.appendChild(warningDiv);
        }
    }
}

// Salvar agendamento
async function saveAppointment(appointment) {
    // Salvar na API
    const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Erro ao salvar agendamento';
        
        // Se for conflito (409), mostrar mensagem específica
        if (response.status === 409) {
            throw new Error(`❌ Horário já ocupado! ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
    }
    
    const savedAppointment = await response.json();
    console.log('✅ Agendamento salvo na API:', savedAppointment);
    
    // NÃO salvar no localStorage - sempre usar apenas a API
    
    return savedAppointment;
}

// Carregar agendamentos
async function loadAppointments() {
    console.log('🔄 Carregando agendamentos da API...');
    try {
        const response = await fetch('/api/appointments');
        if (!response.ok) {
            throw new Error(`API respondeu com status ${response.status}`);
        }
        todosAgendamentos = await response.json();
        console.log('✅ Agendamentos carregados da API:', todosAgendamentos.length);
    } catch (error) {
        console.error('❌ ERRO ao carregar da API:', error);
        // Em caso de erro, inicializar vazio
        todosAgendamentos = [];
        console.warn('⚠️ Array de agendamentos inicializado vazio');
    }
    
    // Log detalhado dos agendamentos
    console.log('📋 TODOS OS AGENDAMENTOS:', todosAgendamentos);
    todosAgendamentos.forEach((appt, i) => {
        console.log(`  ${i+1}. Data: ${appt.data || appt.date}, Hora: ${appt.horario || appt.time}, Status: ${appt.status}`);
    });
    
    // Filtrar agendamentos do usuário atual (para exibição)
    agendamentos = todosAgendamentos.filter(appt => 
        appt.email === userData.email || appt.cliente === userData.nome
    );
    
    console.log('📊 Resumo:', {
        total: todosAgendamentos.length,
        doUsuario: agendamentos.length,
        cancelados: todosAgendamentos.filter(a => a.status === 'cancelado').length
    });
}

// Atualizar preview da moto selecionada
function updateMotoPreview(motoId) {
    const previewCard = document.getElementById('motoPreviewCard');
    
    if (!previewCard) {
        console.log('ℹ️ Card de preview não encontrado');
        return;
    }
    
    if (!motoId) {
        previewCard.style.display = 'none';
        return;
    }
    
    const moto = motorcycles.find(m => m.id === motoId);
    
    if (!moto) {
        previewCard.style.display = 'none';
        return;
    }
    
    // Atualizar imagem
    const imgElement = document.getElementById('motoPreviewImage');
    if (imgElement) {
        imgElement.src = moto.image || moto.thumb || 'images/placeholder.jpg';
        imgElement.alt = moto.name || 'Moto';
    }
    
    // Atualizar nome
    const nameElement = document.getElementById('motoPreviewName');
    if (nameElement) {
        nameElement.textContent = (moto.marca ? moto.marca + ' ' : '') + 
                                   (moto.modelo || moto.name || moto.nome || 'Moto');
    }
    
    // Atualizar ano
    const yearElement = document.getElementById('motoPreviewYear');
    if (yearElement) {
        yearElement.textContent = moto.ano || moto.year || 'N/A';
    }
    
    // Atualizar cor
    const colorElement = document.getElementById('motoPreviewColor');
    if (colorElement) {
        colorElement.textContent = moto.cor || moto.color || 'N/A';
    }
    
    // Atualizar KM
    const kmElement = document.getElementById('motoPreviewKm');
    if (kmElement) {
        const km = moto.mileage_display || moto.quilometragem || moto.mileage || moto.km || 0;
        const kmFormatted = typeof km === 'string' ? km : km.toLocaleString('pt-BR');
        kmElement.textContent = kmFormatted + ' km';
    }
    
    // Mostrar card com animação
    previewCard.style.display = 'block';
    previewCard.animate([
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
    ], {
        duration: 400,
        easing: 'ease-out'
    });
    
    console.log('✅ Preview atualizado:', moto.name || moto.modelo);
}

// Renderizar moto selecionada
function renderSelectedMoto() {
    const container = document.getElementById('selectedMoto');
    
    // Se o container não existir, não fazer nada (elemento opcional)
    if (!container) {
        console.log('ℹ️ Container selectedMoto não encontrado (opcional)');
        return;
    }
    
    if (!selectedMoto) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; background: rgba(255,255,255,0.1); border-radius: 15px; margin-bottom: 30px;">
                <h3 style="color: white; margin-bottom: 15px;">Nenhuma motocicleta selecionada</h3>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 20px;">Escolha uma motocicleta do catálogo ou selecione no formulário abaixo.</p>
                <button onclick="goBack()" style="background: var(--accent); color: #000; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Voltar ao Catálogo
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.2); border-radius: 20px; padding: 25px; margin-bottom: 30px; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3);">
            <h3 style="color: white; margin-bottom: 20px; font-size: 1.3rem;">🏍️ Motocicleta Selecionada</h3>
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                ${selectedMoto.image ? `
                    <img src="${selectedMoto.image}" alt="${selectedMoto.name}" 
                         style="width: 120px; height: 80px; object-fit: cover; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3);">
                ` : `
                    <div style="width: 120px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                        📷
                    </div>
                `}
                <div style="flex: 1; min-width: 200px;">
                    <h4 style="color: white; margin: 0 0 10px 0; font-size: 1.2rem;">${selectedMoto.name}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; color: rgba(255,255,255,0.9);">
                        <div><strong>Ano:</strong> ${selectedMoto.year || selectedMoto.ano || 'N/A'}</div>
                        <div><strong>Cor:</strong> ${selectedMoto.color || selectedMoto.cor || 'N/A'}</div>
                        <div><strong>KM:</strong> ${formatarNumero(selectedMoto.mileage || selectedMoto.quilometragem || selectedMoto.km || 0)} km</div>
                        <div><strong>Cilindrada:</strong> ${selectedMoto.displacement || selectedMoto.cilindrada || '0'}cc</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar informações do usuário
function renderUserInfo() {
    const container = document.getElementById('userInfoDisplay');
    
    // Se o container não existir, não fazer nada (elemento opcional)
    if (!container) {
        console.log('ℹ️ Container userInfoDisplay não encontrado (opcional)');
        return;
    }
    
    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.15); border-radius: 15px; padding: 20px; margin-bottom: 25px; backdrop-filter: blur(10px);">
            <h4 style="color: white; margin: 0 0 15px 0;">👤 Seus Dados</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; color: rgba(255,255,255,0.9);">
                <div><strong>Nome:</strong> ${userData.nome || 'Não informado'}</div>
                <div><strong>Email:</strong> ${userData.email || 'Não informado'}</div>
                ${userData.telefone ? `<div><strong>Telefone:</strong> ${userData.telefone}</div>` : ''}
            </div>
        </div>
    `;
}

// Renderizar agendamentos
function renderAppointments() {
    const container = document.getElementById('appointmentsList');
    
    // Se o container não existir, não fazer nada (elemento opcional)
    if (!container) {
        console.log('ℹ️ Container appointmentsList não encontrado (opcional)');
        return;
    }
    
    if (agendamentos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                <p>Você ainda não possui agendamentos.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data/horário
    const sortedAppointments = [...agendamentos].sort((a, b) => {
        const dateA = new Date(`${a.data} ${a.horario}`);
        const dateB = new Date(`${b.data} ${b.horario}`);
        return dateB - dateA;
    });
    
    container.innerHTML = sortedAppointments.map((appt, index) => `
        <div style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; margin-bottom: 15px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <h4 style="color: white; margin: 0; font-size: 1.1rem;">📅 Agendamento #${index + 1}</h4>
                <span style="background: rgba(76, 175, 80, 0.2); color: #4CAF50; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                    ${appt.status || 'Agendado'}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; color: rgba(255,255,255,0.9); margin-bottom: 15px;">
                <div><strong>Motocicleta:</strong> ${appt.servico}</div>
                <div><strong>Data:</strong> ${formatDate(appt.data)}</div>
                <div><strong>Horário:</strong> ${appt.horario}</div>
            </div>
            
            ${appt.observacoes ? `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <strong style="color: rgba(255,255,255,0.8);">Observações:</strong>
                    <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-style: italic;">"${appt.observacoes}"</p>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="editAppointment(${index})" 
                        style="background: rgba(33, 150, 243, 0.8); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    ✏️ Editar
                </button>
                <button onclick="deleteAppointment(${index})" 
                        style="background: rgba(244, 67, 54, 0.8); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Formatar data
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Editar agendamento
function editAppointment(index) {
    const appt = agendamentos[index];
    if (!appt) return;
    
    // Preencher formulário
    document.getElementById('serviceSelect').value = appt.servicoId || '';
    document.getElementById('appointmentDate').value = appt.data;
    document.getElementById('appointmentTime').value = appt.horario;
    document.getElementById('notes').value = appt.observacoes || '';
    
    // Marcar como editando
    document.getElementById('appointmentForm').dataset.editingIndex = index;
    
    // Alterar texto do botão
    const submitBtn = document.querySelector('.submit-btn-enhanced');
    submitBtn.innerHTML = '<span>✏️</span> Atualizar Agendamento';
    
    // Scroll para o formulário
    document.querySelector('.agendamento').scrollIntoView({ behavior: 'smooth' });
}

// Excluir agendamento
async function deleteAppointment(index) {
    const confirmed = await Toast.confirm('Tem certeza que deseja excluir este agendamento?', {
        title: 'Excluir Agendamento',
        icon: '🗑️',
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
    
    showLoading();
    
    agendamentos.splice(index, 1);
    
    try {
        // Salvar na API
        await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agendamentos)
        });
    } catch (error) {
        console.warn('API indisponível, salvando localmente');
    }
    
    // Salvar no localStorage
    localStorage.setItem('appointments', JSON.stringify(agendamentos));
    
    renderAppointments();
    showSuccessMessage('Agendamento excluído com sucesso!');
    
    hideLoading();
}

// Loading functions
function showLoading() {
    if (window.SmartLoading) {
        SmartLoading.show('Processando agendamento...');
    }
}

function hideLoading() {
    if (window.SmartLoading) {
        SmartLoading.hide();
    }
}

// Mensagens de feedback
function showSuccessMessage(message) {
    // Usar Toast moderno se disponível, senão fallback
    if (window.Toast && Toast.success) {
        Toast.success(message);
    } else {
        showMessage(message, 'success');
    }
}

function showErrorMessage(message) {
    // Usar Toast moderno se disponível, senão fallback
    if (window.Toast && Toast.error) {
        Toast.error(message);
    } else {
        showMessage(message, 'error');
    }
}

function showMessage(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        ${type === 'success' ? 
            'background: rgba(76, 175, 80, 0.9); color: white; border: 1px solid rgba(76, 175, 80, 0.3);' : 
            'background: rgba(244, 67, 54, 0.9); color: white; border: 1px solid rgba(244, 67, 54, 0.3);'
        }
    `;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Mostrar card de confirmação do agendamento
function showAppointmentConfirmation(appointment) {
    console.log('📋 Mostrando card de confirmação...', appointment);
    
    const statusCard = document.getElementById('statusCard');
    const statusInfo = document.getElementById('statusInfo');
    const motoPreviewCard = document.getElementById('motoPreviewCard');
    
    console.log('🔍 Elementos encontrados:', {
        statusCard: statusCard ? '✅' : '❌',
        statusInfo: statusInfo ? '✅' : '❌',
        motoPreviewCard: motoPreviewCard ? '✅' : '❌'
    });
    
    if (!statusCard || !statusInfo) {
        console.warn('⚠️ Elementos de confirmação não encontrados, usando notificação simples');
        showSuccessMessage('✅ Agendamento realizado com sucesso!');
        return;
    }
    
    // ESCONDER card da moto para dar espaço ao status
    if (motoPreviewCard) {
        motoPreviewCard.style.display = 'none';
        console.log('🚫 Card da moto escondido');
    }
    
    // Buscar dados da moto
    const moto = motorcycles.find(m => m.id === appointment.servicoId);
    const motoName = moto ? ((moto.marca ? moto.marca + ' ' : '') + (moto.modelo || moto.name || moto.nome || 'Moto')) : appointment.servico;
    const motoImage = moto ? (moto.image || moto.thumb || 'images/placeholder.jpg') : '';
    
    console.log('🏍️ Dados da moto:', { motoName, motoImage });
    
    // Preencher card com informações
    statusInfo.innerHTML = `
        <div style='color:#27ae60;font-size:1.3em;margin-bottom:20px;font-weight:600;'>✅ Agendamento realizado com sucesso!</div>
        ${motoImage ? `<div style='width:100%;max-width:300px;height:200px;background:#0f1419;border-radius:12px;overflow:hidden;margin:20px auto;'>
            <img src='${motoImage}' alt='${motoName}' style='width:100%;height:100%;object-fit:cover;object-position:center;' />
        </div>` : ''}
        <div style='margin-bottom:8px;font-size:1.1em;'>Motocicleta: <b style='color:#e67e22;'>${motoName}</b></div>
        <div style='font-size:1.05em;'>Data: <b style='color:#e67e22;'>${formatDate(appointment.data)}</b> &nbsp;•&nbsp; Horário: <b style='color:#e67e22;'>${appointment.horario}</b></div>
        ${appointment.observacoes ? `<div style='margin-top:12px;padding:12px;background:rgba(230,126,34,0.1);border-radius:8px;border-left:3px solid #e67e22;'>📝 ${appointment.observacoes}</div>` : ''}
    `;
    
    statusInfo.style.color = '#fff';
    statusCard.style.display = 'flex';
    
    console.log('✅ Card exibido! Display:', statusCard.style.display);
    
    // Animar card
    statusCard.animate([
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1 }
    ], {
        duration: 420,
        easing: 'ease-out'
    });
    
    console.log('✅ Card de confirmação exibido com animação');
}

// ==================== DROPDOWN CUSTOMIZADO ====================

// Selecionar horário no dropdown customizado
function selectCustomTime(time, status) {
    if (status === 'ocupado') return;
    
    const timeSelect = document.getElementById('appointmentTime');
    const customTimeValue = document.getElementById('customTimeValue');
    const customTimeTrigger = document.getElementById('customTimeTrigger');
    const customTimeOptions = document.getElementById('customTimeOptions');
    
    // Atualizar select nativo
    timeSelect.value = time;
    
    // Atualizar dropdown customizado
    if (customTimeValue) {
        customTimeValue.textContent = `${time} ✅ Disponível`;
        customTimeValue.style.color = '#2e7d32';
        customTimeValue.style.fontWeight = '600';
    }
    
    // Fechar dropdown
    if (customTimeTrigger) customTimeTrigger.classList.remove('active');
    if (customTimeOptions) customTimeOptions.classList.remove('active');
    
    console.log('✅ Horário selecionado:', time);
}

// Inicializar dropdown customizado
function initCustomSelect() {
    console.log('🔍 Iniciando dropdown customizado...');
    
    const customTimeTrigger = document.getElementById('customTimeTrigger');
    const customTimeOptions = document.getElementById('customTimeOptions');
    
    console.log('🔍 Elementos encontrados:', {
        trigger: customTimeTrigger ? '✅' : '❌',
        options: customTimeOptions ? '✅' : '❌'
    });
    
    if (!customTimeTrigger || !customTimeOptions) {
        console.error('❌ ERRO: Dropdown customizado não encontrado!');
        return;
    }
    
    // Toggle dropdown ao clicar no trigger
    customTimeTrigger.addEventListener('click', function(e) {
        console.log('🖱️ Click no dropdown trigger');
        e.stopPropagation();
        this.classList.toggle('active');
        customTimeOptions.classList.toggle('active');
        console.log('🔄 Classes toggled:', {
            trigger: this.classList.contains('active'),
            options: customTimeOptions.classList.contains('active')
        });
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select-wrapper')) {
            if (customTimeTrigger.classList.contains('active')) {
                console.log('🚪 Fechando dropdown (click fora)');
            }
            customTimeTrigger.classList.remove('active');
            customTimeOptions.classList.remove('active');
        }
    });
    
    console.log('✅ Dropdown customizado TOTALMENTE inicializado');
}

// Função de debug para diagnosticar problemas
function debugHorarios() {
    console.clear();
    console.log('\n='.repeat(50));
    console.log('🐛 DEBUG DE HORÁRIOS - MacDavis Motos');
    console.log('='.repeat(50));
    
    const dateInput = document.getElementById('appointmentDate');
    const selectedDate = dateInput ? dateInput.value : null;
    
    console.log('\n📅 DATA SELECIONADA:', selectedDate || 'NENHUMA');
    
    console.log('\n📊 ARRAY todosAgendamentos:');
    console.log('  - Length:', todosAgendamentos.length);
    console.log('  - Dados:', todosAgendamentos);
    
    if (selectedDate) {
        const agendamentosData = todosAgendamentos.filter(ag => {
            const agDate = ag.data || ag.date;
            return agDate === selectedDate;
        });
        
        console.log(`\n📋 Agendamentos para ${selectedDate}:`, agendamentosData.length);
        agendamentosData.forEach((ag, i) => {
            const status = ag.status || 'pendente';
            const horario = ag.horario || ag.time;
            const bloqueia = status !== 'cancelado' && status !== 'realizado';
            console.log(`  ${i+1}. ${horario} - "${status}" - Bloqueia: ${bloqueia ? '🔴 SIM' : '🟢 NÃO'}`);
        });
        
        const bloqueadores = todosAgendamentos.filter(ag => {
            const agDate = ag.data || ag.date;
            const status = ag.status || 'pendente';
            return agDate === selectedDate && 
                   status !== 'cancelado' && 
                   status !== 'realizado';
        });
        
        console.log('\n🚫 HORÁRIOS BLOQUEADOS:', bloqueadores.length);
        bloqueadores.forEach(ag => {
            console.log(`  - ${ag.horario || ag.time}`);
        });
        
        const allTimes = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ];
        
        const bookedTimes = bloqueadores.map(ag => ag.horario || ag.time);
        const availableTimes = allTimes.filter(t => !bookedTimes.includes(t));
        
        console.log('\n✅ HORÁRIOS DISPONÍVEIS:', availableTimes.length);
        availableTimes.forEach(t => {
            console.log(`  ✅ ${t}`);
        });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Abra o DevTools (F12) para ver os logs acima');
    console.log('='.repeat(50) + '\n');
    
    // Forçar atualização
    updateAvailableTimes();
    
    alert('🐛 Debug executado! Abra o Console (F12) para ver os logs detalhados.');
}

// Função para forçar recarga dos horários
async function forceReloadHorarios() {
    console.clear();
    console.log('%c🔄 FORÇANDO RECARGA DOS DADOS...', 'background: #28a745; color: white; font-size: 16px; padding: 10px;');
    
    // Recarregar agendamentos da API
    await loadAppointments();
    
    // Atualizar horários
    updateAvailableTimes();
    
    console.log('%c✅ ATUALIZAÇÃO CONCLUÍDA!', 'background: #28a745; color: white; font-size: 16px; padding: 10px;');
    
    alert('✅ Dados atualizados! Verifique os horários agora.');
}