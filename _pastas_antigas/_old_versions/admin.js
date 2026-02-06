// JavaScript do Painel Admin
let currentMotos = [];
let editingMoto = null;

// Tratamento global de erros
window.addEventListener('error', function(event) {
    console.error('❌ [GLOBAL ERROR]:', event.error);
    console.error('❌ [STACK]:', event.error?.stack);
});

// Verificar autenticação de administrador
function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'login.html';
        return false;
    }
    
    const user = JSON.parse(userData);
    if (user.tipo !== 'admin') {
        alert('❌ Acesso negado! Esta área é apenas para administradores.');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 [DEBUG] Admin panel inicializando...');
    // Verificar autenticação antes de carregar o painel
    if (!checkAdminAuth()) {
        return;
    }
    
    console.log('🔍 [DEBUG] Autenticação OK, carregando dados...');
    loadMotos();
    loadStats();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Submissão do formulário
    document.getElementById('motoForm').addEventListener('submit', handleMotoSubmit);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMotos(this.dataset.categoria);
        });
    });
    
    // Search input
    document.getElementById('searchMotos').addEventListener('input', debounce(searchMotos, 300));
    
    // Upload de imagem via arrastar e soltar
    setupImageUpload();
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
        
        renderMotos(currentMotos);
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar motos:', error);
        showMessage('Erro ao carregar motocicletas: ' + error.message, 'error');
        hideLoading();
    }
}

// Renderizar motocicletas
function renderMotos(motos) {
    console.log('🔍 [DEBUG] renderMotos chamado com', motos.length, 'motos');
    const grid = document.getElementById('motosGrid');
    
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
    
    grid.innerHTML = motos.map(moto => {
        console.log('🔍 [DEBUG] Renderizando moto:', moto.id, moto.name || moto.nome);
        return `
        <div class="moto-card" data-id="${moto.id}">
            <img src="${moto.image || moto.thumb || 'images/placeholder.svg'}" 
                 alt="${moto.name || moto.nome}" 
                 class="moto-image"
                 onerror="this.src='images/placeholder.svg'">
            
            <div class="moto-info">
                <div class="moto-header">
                    <h3 class="moto-title">${moto.name || moto.nome}</h3>

                </div>
                
                <div class="moto-details">
                    <span>${moto.marca || 'Marca não informada'}</span>
                    <span>${moto.displacement || moto.cilindradas || 0}cc</span>
                    <span>${moto.year || moto.ano}</span>
                    <span>${moto.color || moto.cor || ''}</span>
                </div>
                
                <div class="moto-specs">
                    <span class="km-badge">📏 ${moto.mileage_display || moto.km || '0'} km</span>
                    <span class="category-badge category-${getCategoryFromDisplacement(moto.displacement || moto.cilindradas)}">
                        ${getCategoryFromDisplacement(moto.displacement || moto.cilindradas)}
                    </span>
                </div>
                
                <div class="moto-description">
                    <p>${(moto.desc || moto.descricao || 'Sem descrição').substring(0, 100)}${(moto.desc || moto.descricao || '').length > 100 ? '...' : ''}</p>
                </div>
                
                <div class="moto-actions">
                    <button class="btn-secondary btn-small edit-btn" data-moto-id="${moto.id}">
                        ✏️ Editar
                    </button>
                    <button class="btn-danger btn-small delete-btn" data-moto-id="${moto.id}">
                        🗑️ Excluir
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
            btn.addEventListener('click', function() {
                const motoId = this.getAttribute('data-moto-id');
                console.log('🔧 [DEBUG] Botão editar clicado para ID:', motoId);
                editMoto(motoId);
            });
        });
        
        // Botões de excluir
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const motoId = this.getAttribute('data-moto-id');
                console.log('🗑️ [DEBUG] Botão excluir clicado para ID:', motoId);
                confirmDeleteMoto(motoId);
            });
        });
        
        // Botões de visualizar
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
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
    editingMoto = null;
    document.getElementById('modalTitle').textContent = 'Nova Motocicleta';
    document.getElementById('motorcycleForm').reset();
    document.getElementById('motorcycleModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showEditMotorcycleModal(id) {
    console.log('✏️ [DEBUG] showEditMotorcycleModal chamado com ID:', id);
    
    const moto = currentMotos.find(m => m.id === id);
    if (!moto) {
        console.error('❌ [DEBUG] Moto não encontrada:', id);
        alert('Motocicleta não encontrada!');
        return;
    }
    
    editingMoto = moto;
    document.getElementById('modalTitle').textContent = 'Editar Motocicleta';
    
    // Preencher campos do formulário
    document.getElementById('marca').value = moto.marca || '';
    document.getElementById('modelo').value = moto.name || moto.nome || '';
    document.getElementById('ano').value = moto.year || moto.ano || '';
    document.getElementById('cor').value = moto.color || moto.cor || '';
    document.getElementById('preco').value = moto.price || moto.preco || '';
    document.getElementById('quilometragem').value = moto.mileage || moto.quilometragem || '';
    document.getElementById('status').value = moto.status || 'disponivel';
    document.getElementById('descricao').value = moto.desc || moto.description || '';
    document.getElementById('imagem').value = moto.image || '';
    
    document.getElementById('motorcycleModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    console.log('❌ [DEBUG] closeModal chamado');
    document.getElementById('motorcycleModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    editingMoto = null;
}

// Submeter formulário de motocicleta
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('motorcycleForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 [DEBUG] Formulário de motocicleta submetido');
            
            const formData = new FormData(form);
            const motoData = {
                marca: formData.get('marca'),
                name: formData.get('modelo'),
                nome: formData.get('modelo'),
                year: formData.get('ano'),
                ano: formData.get('ano'),
                color: formData.get('cor'),
                cor: formData.get('cor'),
                price: formData.get('preco'),
                preco: formData.get('preco'),
                mileage: parseInt(formData.get('quilometragem')) || 0,
                mileage_display: formData.get('quilometragem'),
                quilometragem: formData.get('quilometragem'),
                status: formData.get('status'),
                desc: formData.get('descricao'),
                description: formData.get('descricao'),
                image: formData.get('imagem'),
                displacement: 0, // Valor padrão, pode ser editado depois
                id: editingMoto ? editingMoto.id : generateMotoId()
            };
            
            try {
                if (editingMoto) {
                    // Editar moto existente
                    const response = await fetch(`/api/motorcycles/${editingMoto.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(motoData)
                    });
                    
                    if (response.ok) {
                        showSuccess('Motocicleta atualizada com sucesso!');
                        closeModal();
                        loadMotorcycles();
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
                        showSuccess('Motocicleta adicionada com sucesso!');
                        closeModal();
                        loadMotorcycles();
                    } else {
                        throw new Error('Erro ao adicionar motocicleta');
                    }
                }
            } catch (error) {
                console.error('❌ [ERROR] Erro ao salvar motocicleta:', error);
                showError('Erro ao salvar motocicleta: ' + error.message);
            }
        });
    }
});

function generateMotoId() {
    return 'moto-' + Date.now();
}

function openAddMotoModal() {
    try {
        console.log('➕ [DEBUG] openAddMotoModal chamado');
        editingMoto = null;
        
        // Verificar se elementos existem
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        const motoForm = document.getElementById('motoForm');
        const motoModal = document.getElementById('motoModal');
        
        if (!modalTitle || !submitBtn || !motoForm || !motoModal) {
            console.error('❌ [DEBUG] Elementos do modal não encontrados');
            alert('Erro: Modal não está disponível. Recarregue a página.');
            return;
        }
        
        modalTitle.textContent = 'Adicionar Nova Motocicleta';
        submitBtn.textContent = 'Adicionar Motocicleta';
        motoForm.reset();
        clearImagePreview();
        console.log('➕ [DEBUG] Modal sendo exibido...');
        motoModal.style.display = 'block';
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
        }
        
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
        fillField('preco', moto.price || moto.preco);
        fillField('km', moto.mileage || moto.km);
        fillField('descricao_resumida', moto.desc_resumida || moto.descricao_resumida);
        fillField('descricao_completa', moto.desc || moto.descricao);
        fillField('pontos_fortes', moto.pontos_fortes);
        
        // Exibir modal
        const motoModal = document.getElementById('motoModal');
        if (motoModal) {
            motoModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('✅ [DEBUG] Modal de edição exibido!');
        } else {
            console.error('❌ [DEBUG] Modal não encontrado');
            alert('Erro: Modal não encontrado. Recarregue a página.');
        }
        
    } catch (error) {
        console.error('❌ [ERROR] editMoto:', error);
        alert('Erro ao editar motocicleta. Por favor, recarregue a página.');
    }
}
    document.getElementById('cilindradas').value = moto.displacement || moto.cilindradas || '';
document.getElementById('ano').value = moto.year || moto.ano || '';
    document.getElementById('descricao').value = moto.desc || moto.descricao || '';
    document.getElementById('especificacoes').value = moto.especificacoes || '';
    
    // Adicionar campos específicos do sistema atual
    addExtraFieldsToForm(moto);
    
    // Mostrar imagem atual se existir
    if (moto.image || moto.thumb) {
        showImagePreview(moto.image || moto.thumb);
    }
    
    document.getElementById('motoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';


function addExtraFieldsToForm(moto) {
    // Adicionar campos extras específicos do formato atual
    const form = document.getElementById('motoForm');
    
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
    document.getElementById('motoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    editingMoto = null;
    clearImagePreview();
}

// Submissão do formulário
async function handleMotoSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const form = e.target;
    
    // Validações básicas
    const requiredFields = ['nome', 'marca', 'categoria', 'cilindradas', 'ano'];
    for (let field of requiredFields) {
        if (!form[field].value.trim()) {
            showMessage(`Campo ${field} é obrigatório`, 'error');
            return;
        }
    }
    
    // Preparar dados
    const motoData = {
        nome: form.nome.value.trim(),
        marca: form.marca.value,
        categoria: form.categoria.value,
        cilindradas: parseInt(form.cilindradas.value),
ano: parseInt(form.ano.value),
        descricao: form.descricao.value.trim(),
        especificacoes: form.especificacoes.value.trim()
    };
    
    // Se editando, incluir ID
    if (editingMoto) {
        motoData.id = editingMoto.id;
    }
    
    // Adicionar dados ao FormData
    Object.keys(motoData).forEach(key => {
        formData.append(key, motoData[key]);
    });
    
    // Adicionar imagem se selecionada
    const imageInput = form.imagem;
    if (imageInput.files[0]) {
        formData.append('imagem', imageInput.files[0]);
    }
    
    try {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
        submitBtn.disabled = true;
        
        const url = editingMoto ? `/api/motorcycles/${editingMoto.id}` : '/api/motorcycles';
        const method = editingMoto ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar motocicleta');
        }
        
        const result = await response.json();
        
        showMessage(editingMoto ? 'Motocicleta atualizada com sucesso!' : 'Motocicleta adicionada com sucesso!', 'success');
        
        closeMotoModal();
        loadMotos();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao salvar moto:', error);
        showMessage('Erro ao salvar motocicleta: ' + error.message, 'error');
    } finally {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = editingMoto ? 'Salvar Alterações' : 'Adicionar Motocicleta';
        submitBtn.disabled = false;
    }
}

// Confirmação de exclusão
function confirmDeleteMoto(motoId) {
    console.log('🗑️ [DEBUG] confirmDeleteMoto chamado com ID:', motoId);
    const moto = currentMotos.find(m => m.id === motoId);
    if (!moto) {
        console.error('❌ [DEBUG] Moto não encontrada para exclusão:', motoId);
        alert('Motocicleta não encontrada!');
        return;
    }
    
    console.log('✅ [DEBUG] Confirmando exclusão de:', moto.name || moto.nome);
    if (!moto) return;
    
    document.getElementById('confirmMessage').textContent = 
        `Tem certeza que deseja excluir a motocicleta "${moto.nome}"? Esta ação não pode ser desfeita.`;
    
    document.getElementById('confirmAction').onclick = () => deleteMoto(motoId);
    document.getElementById('confirmModal').style.display = 'block';
}

async function deleteMoto(motoId) {
    try {
        const response = await fetch(`/api/motorcycles/${motoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir motocicleta');
        }
        
        showMessage('Motocicleta excluída com sucesso!', 'success');
        closeConfirmModal();
        loadMotos();
        loadStats();
        
    } catch (error) {
        console.error('Erro ao excluir moto:', error);
        showMessage('Erro ao excluir motocicleta: ' + error.message, 'error');
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
    const search = document.getElementById('searchMotos').value.toLowerCase();
    if (!search.trim()) {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.categoria;
        filterMotos(activeFilter);
        return;
    }
    
    const filtered = currentMotos.filter(moto => 
        moto.nome.toLowerCase().includes(search) ||
        moto.marca.toLowerCase().includes(search) ||
        moto.categoria.toLowerCase().includes(search)
    );
    
    renderMotos(filtered);
}

// Estatísticas
async function loadStats() {
    try {
        // Total de motos
        document.getElementById('totalMotos').textContent = currentMotos.length;
        
        // Agendamentos hoje (simulado)
        document.getElementById('totalAgendamentos').textContent = '0';
        
        // Avaliação média (simulado)
        document.getElementById('mediaAvaliacoes').textContent = '4.8';
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Utilitários


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
    const grid = document.getElementById('motosGrid');
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
    }
});

// Fechar modais clicando fora
document.getElementById('motoModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeMotoModal();
    }
});

document.getElementById('confirmModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeConfirmModal();
    }
});

// ============ FUNÇÕES DE MODAL DE VISUALIZAÇÃO ============

function viewMotoDetails(id) {
    console.log('👁️ [DEBUG] viewMotoDetails chamado com ID:', id);
    
    const moto = currentMotos.find(m => m.id === id);
    if (!moto) {
        console.error('❌ [DEBUG] Moto não encontrada:', id);
        alert('Motocicleta não encontrada!');
        return;
    }
    
    console.log('✅ [DEBUG] Moto encontrada:', moto.name || moto.nome);
    
    const viewContent = document.getElementById('viewContent');
    if (!viewContent) {
        console.error('❌ [DEBUG] Elemento viewContent não encontrado!');
        alert('Erro: Modal de visualização não encontrado!');
        return;
    }
    
    console.log('✅ [DEBUG] Elemento viewContent encontrado, preenchendo...');
    
    viewContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
            <div class="view-image">
                <img src="${moto.image_thumbnail || moto.image || '/images/placeholder.jpg'}" 
                     alt="${moto.name}" 
                     style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            <div class="view-details">
                <h2 style="margin: 0 0 1rem 0; color: #333;">${moto.name}</h2>
                <div style="display: grid; gap: 0.8rem;">
                    <div><strong>Categoria:</strong> ${moto.category || 'Não informado'}</div>
                    <div><strong>Tipo:</strong> ${moto.type || 'Não informado'}</div>
                    <div><strong>Ano:</strong> ${moto.year || 'Não informado'}</div>
                    <div><strong>Cilindrada:</strong> ${moto.engine_cc || moto.cc || 'Não informado'}</div>
                    <div><strong>Combustível:</strong> ${moto.fuel || 'Não informado'}</div>
                    ${moto.color || moto.cor ? `<div><strong>Cor:</strong> ${moto.color || moto.cor}</div>` : ''}
                    ${moto.mileage_display || moto.km ? `<div><strong>Quilometragem:</strong> ${moto.mileage_display || moto.km}</div>` : ''}
                </div>
                ${moto.description ? `<div style="margin-top: 1rem;"><strong>Descrição:</strong><br>${moto.description}</div>` : ''}
            </div>
        </div>
    `;
    
    console.log('✅ [DEBUG] Conteúdo preenchido, mostrando modal...');
    document.getElementById('viewModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    console.log('✅ [DEBUG] Modal viewModal exibido!');
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Adicionar eventos para o modal de visualização
document.getElementById('viewModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeViewModal();
    }
});

// Atualizar eventos de teclado para incluir viewModal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('motoModal').style.display === 'block') {
            closeMotoModal();
        }
        if (document.getElementById('confirmModal').style.display === 'block') {
            closeConfirmModal();
        }
        if (document.getElementById('viewModal').style.display === 'block') {
            closeViewModal();
        }
    }
});