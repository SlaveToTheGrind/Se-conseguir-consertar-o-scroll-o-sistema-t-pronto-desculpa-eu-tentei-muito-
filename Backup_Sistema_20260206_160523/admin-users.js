// ====== GERENCIAMENTO DE ADMINISTRADORES ======

let currentAdminUsers = [];
let editingAdminUser = null;

// Mostrar modal de listagem de administradores
function showAdminUsersModal() {
    const modal = document.getElementById('adminUsersListModal');
    if (modal) {
        modal.style.display = 'flex';
        loadAdminUsers();
    }
}

// Fechar modal de listagem de administradores
function closeAdminUsersListModal() {
    const modal = document.getElementById('adminUsersListModal');
    if (modal) {
        modal.classList.add('force-hide');
        modal.style.display = 'none';
        setTimeout(() => modal.classList.remove('force-hide'), 100);
    }
}

// Atualizar lista de administradores
function refreshAdminUsers() {
    loadAdminUsers();
}

// Carregar lista de administradores
async function loadAdminUsers() {
    try {
        console.log('📡 Carregando administradores...');
        const response = await fetch('/api/admin-users');
        const users = await response.json();
        
        currentAdminUsers = users;
        renderAdminUsers();
        console.log('✅ Administradores carregados:', users.length);
    } catch (error) {
        console.error('❌ Erro carregando administradores:', error);
        showAdminError('Erro ao carregar administradores');
    }
}

// Renderizar lista de administradores
function renderAdminUsers() {
    const container = document.getElementById('adminUsersList') || document.getElementById('adminUsersListContent');
    if (!container) return;
    
    if (currentAdminUsers.length === 0) {
        container.innerHTML = `
            <div class="no-admin-users" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                <h3>Nenhum administrador cadastrado</h3>
                <p>Clique em "Novo Administrador" para adicionar</p>
            </div>
        `;
        return;
    }
    
    const html = currentAdminUsers.map(user => `
        <div class="admin-user-card">
            <div class="admin-user-header">
                <div class="admin-user-icon">👤</div>
                <div class="admin-user-info">
                    <h4>${user.fullName || user.username}</h4>
                    <div class="admin-user-username">@${user.username}</div>
                </div>
            </div>
            
            <div class="admin-user-details">
                <div class="admin-user-detail">
                    <span class="admin-user-detail-label">Status:</span>
                    <span class="admin-user-detail-value" style="color: ${user.active ? '#4caf50' : '#e74c3c'};">
                        ${user.active ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                </div>
                <div class="admin-user-detail">
                    <span class="admin-user-detail-label">Criado em:</span>
                    <span class="admin-user-detail-value">${formatDate(user.createdAt)}</span>
                </div>
                <div class="admin-user-detail">
                    <span class="admin-user-detail-label">Último acesso:</span>
                    <span class="admin-user-detail-value">${user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}</span>
                </div>
            </div>
            
            <div class="admin-user-actions">
                <button class="btn-edit-admin" onclick="editAdminUser('${user.id}')">
                    ✏️ Editar
                </button>
                <button class="btn-delete-admin" onclick="deleteAdminUser('${user.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Mostrar modal de adicionar/editar administrador
function showAddAdminModal() {
    editingAdminUser = null;
    document.getElementById('adminUserModalTitle').textContent = '👤 Novo Administrador';
    document.getElementById('adminUserForm').reset();
    document.getElementById('editAdminUserId').value = '';
    document.getElementById('adminUserModal').style.display = 'flex';
}

// Editar administrador
function editAdminUser(userId) {
    const user = currentAdminUsers.find(u => u.id === userId);
    if (!user) {
        alert('Administrador não encontrado!');
        return;
    }
    
    editingAdminUser = user;
    document.getElementById('adminUserModalTitle').textContent = '✏️ Editar Administrador';
    document.getElementById('editAdminUserId').value = user.id;
    document.getElementById('adminUsername').value = user.username;
    document.getElementById('adminFullName').value = user.fullName || '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPasswordConfirm').value = '';
    document.getElementById('adminPassword').required = false;
    document.getElementById('adminPasswordConfirm').required = false;
    document.getElementById('adminUserModal').style.display = 'flex';
}

// Fechar modal - FORÇA FECHAMENTO
function closeAdminUserModal() {
    const modal = document.getElementById('adminUserModal');
    // Adiciona classe para ocultar ANTES de remover style
    modal.classList.add('force-hide');
    modal.style.display = 'none';
    // Remove o modal da visualização imediatamente
    setTimeout(() => {
        modal.classList.remove('force-hide');
    }, 100);
    editingAdminUser = null;
    const form = document.getElementById('adminUserForm');
    if (form) form.reset();
    const pwd = document.getElementById('adminPassword');
    const pwdConfirm = document.getElementById('adminPasswordConfirm');
    if (pwd) pwd.required = true;
    if (pwdConfirm) pwdConfirm.required = true;
}

// Fechar modal ao clicar fora - VERSÃO MELHORADA
window.addEventListener('click', function(event) {
    const modal = document.getElementById('adminUserModal');
    if (modal && event.target === modal) {
        console.log('🖱️ Clique fora do modal detectado');
        closeAdminUserModal();
    }
    const listModal = document.getElementById('adminUsersListModal');
    if (listModal && event.target === listModal) {
        console.log('🖱️ Clique fora do modal de lista detectado');
        closeAdminUsersListModal();
    }
});

// ADICIONAR: Fechar modais com tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        const adminModal = document.getElementById('adminUserModal');
        const listModal = document.getElementById('adminUsersListModal');
        
        if (adminModal && adminModal.style.display === 'flex') {
            console.log('⌨️ ESC pressionado - fechando modal admin');
            closeAdminUserModal();
        }
        if (listModal && listModal.style.display === 'flex') {
            console.log('⌨️ ESC pressionado - fechando modal lista');
            closeAdminUsersListModal();
        }
    }
});

// Deletar administrador
async function deleteAdminUser(userId) {
    const user = currentAdminUsers.find(u => u.id === userId);
    if (!user) return;
    
    const _msg_del_admin = `Tem certeza que deseja excluir o administrador "${user.username}"?\n\nEsta ação não pode ser desfeita.`;
    const _confirmed_del_admin = await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_msg_del_admin) : Promise.resolve(confirm(_msg_del_admin)));
    if (!_confirmed_del_admin) return;
    
    try {
        const response = await fetch(`/api/admin-users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Administrador excluído com sucesso!');
            loadAdminUsers();
        } else {
            alert('❌ ' + (data.error || 'Erro ao excluir administrador'));
        }
    } catch (error) {
        console.error('❌ Erro ao excluir admin:', error);
        alert('Erro ao excluir administrador');
    }
}

// Atualizar lista
function refreshAdminUsers() {
    loadAdminUsers();
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mostrar erro
function showAdminError(message) {
    const container = document.getElementById('adminUsersList');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #e74c3c;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3>${message}</h3>
                <button onclick="loadAdminUsers()" class="btn-primary" style="margin-top: 1rem;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Submit do formulário
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('adminUserForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            const passwordConfirm = document.getElementById('adminPasswordConfirm').value;
            const fullName = document.getElementById('adminFullName').value;
            const userId = document.getElementById('editAdminUserId').value;
            
            // Validações
            if (password && password !== passwordConfirm) {
                alert('❌ As senhas não coincidem!');
                return;
            }
            
            if (password && password.length < 6) {
                alert('❌ A senha deve ter no mínimo 6 caracteres!');
                return;
            }
            
            try {
                const isEdit = !!userId;
                const url = isEdit ? `/api/admin-users/${userId}` : '/api/admin-users';
                const method = isEdit ? 'PUT' : 'POST';
                
                const body = {
                    username,
                    fullName
                };
                
                if (password) {
                    body.password = password;
                }
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert(isEdit ? '✅ Administrador atualizado com sucesso!' : '✅ Administrador criado com sucesso!');
                    closeAdminUserModal();
                    loadAdminUsers();
                } else {
                    alert('❌ ' + (data.error || 'Erro ao salvar administrador'));
                }
            } catch (error) {
                console.error('❌ Erro ao salvar admin:', error);
                alert('Erro ao salvar administrador');
            }
        });
    }
    
    // Carregar administradores ao iniciar
    if (document.getElementById('adminUsersList') || document.getElementById('adminUsersListContent')) {
        // Não carregar automaticamente, apenas quando abrir o modal
    }
});
