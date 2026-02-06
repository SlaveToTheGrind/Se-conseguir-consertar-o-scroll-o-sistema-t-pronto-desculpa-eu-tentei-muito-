// Sistema de Agendamento - MacDavis Motos

// Função para formatar números com separador de milhares
function formatarNumero(numero) {
    if (!numero) return '0';
    const num = typeof numero === 'string' ? parseInt(numero.replace(/\./g, '')) : parseInt(numero);
    return num.toLocaleString('pt-BR');
}

let motorcycles = [];
let agendamentos = [];
let selectedMoto = null;
let userData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar login
    checkUserLogin();
    
    // Carregar dados
    await loadMotorcycles();
    
    // Configurar moto selecionada
    setupSelectedMoto();
    
    // Configurar formulário
    setupForm();
    
    // Carregar agendamentos
    await loadAppointments();
    
    // Renderizar interface
    renderSelectedMoto();
    renderUserInfo();
    renderAppointments();
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
    
    motorcycles.forEach((moto, index) => {
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
    
    // Configurar data mínima (hoje)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.min = today;
    }
    
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
        // Salvar agendamento
        await saveAppointment(appointment);
        
        // Reset do formulário
        e.target.reset();
        if (selectedMoto) {
            document.getElementById('serviceSelect').value = selectedMoto.id;
        }
        
        // Recarregar lista
        await loadAppointments();
        renderAppointments();
        
        // Feedback
        showSuccessMessage('Agendamento realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        showErrorMessage('Erro ao processar agendamento. Tente novamente.');
    }
    
    hideLoading();
}

// Obter nome do serviço
function getServiceName(serviceId) {
    const moto = motorcycles.find(m => m.id === serviceId);
    return moto ? `${moto.name} - ${moto.year} (${moto.color})` : 'Serviço não encontrado';
}

// Salvar agendamento
async function saveAppointment(appointment) {
    try {
        // Salvar na API primeiro
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar agendamento na API');
        }
        
        const savedAppointment = await response.json();
        console.log('✅ Agendamento salvo na API:', savedAppointment);
        
        // Adicionar ao array local
        agendamentos.push(savedAppointment);
        
    } catch (error) {
        console.error('❌ Erro ao salvar na API:', error);
        // Se falhar na API, adicionar localmente mesmo assim
        agendamentos.push(appointment);
    }
    
    // Sempre salvar no localStorage como backup
    localStorage.setItem('appointments', JSON.stringify(agendamentos));
}

// Carregar agendamentos
async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments');
        if (!response.ok) throw new Error('Erro na API');
        agendamentos = await response.json();
    } catch (error) {
        console.warn('API indisponível, carregando do localStorage:', error);
        const stored = localStorage.getItem('appointments');
        agendamentos = stored ? JSON.parse(stored) : [];
    }
    
    // Filtrar agendamentos do usuário atual
    agendamentos = agendamentos.filter(appt => 
        appt.email === userData.email || appt.cliente === userData.nome
    );
}

// Renderizar moto selecionada
function renderSelectedMoto() {
    const container = document.getElementById('selectedMoto');
    
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
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    
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
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// Mensagens de feedback
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
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