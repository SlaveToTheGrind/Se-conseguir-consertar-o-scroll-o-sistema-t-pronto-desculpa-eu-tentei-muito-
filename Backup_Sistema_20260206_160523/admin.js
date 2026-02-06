// JavaScript do Painel Admin
let currentMotos = [];
let allMotos = []; // Lista completa original
let activeFilter = 'disponivel'; // Filtro ativo (inicia com "disponivel" conforme select HTML)
let searchTerm = ''; // Termo de busca ativo
let editingMoto = null;
let selectedMonthFilter = 'all'; // Armazenar o mês selecionado no filtro
let savedScrollPosition = 0; // Posição de scroll para restaurar após reload
let __savedScrollSource = null; // 'page' | 'modal' | null

function setSavedScrollPosition(pos, source) {
    try {
        savedScrollPosition = Number(pos) || 0;
        __savedScrollSource = source || null;
        try {
            const stack = (new Error()).stack || '';
            console.warn(`💾 setSavedScrollPosition -> source=${__savedScrollSource}, pos=${savedScrollPosition}\nStack:\n${stack.split('\n').slice(1,6).join('\n')}`);
        } catch (e) {
            console.warn('💾 setSavedScrollPosition logged (no stack)');
        }
    } catch (e) {
        savedScrollPosition = 0;
        __savedScrollSource = null;
    }
}

function clearSavedScrollPosition() {
    savedScrollPosition = 0;
    __savedScrollSource = null;
}

// ===== AUTO-SAVE MODAL DE VENDA =====
const SALE_FORM_STORAGE_KEY = 'admin_sale_form_autosave';
const SALE_MODAL_STATE_KEY = 'admin_sale_modal_open';

function saveSaleFormData() {
    const formData = {
        motoId: document.getElementById('saleMotoId')?.value || '',
        buyerName: document.getElementById('buyerName')?.value || '',
        buyerCPF: document.getElementById('buyerCPF')?.value || '',
        saleDate: document.getElementById('saleDate')?.value || '',
        salePrice: document.getElementById('salePrice')?.value || '',
        saleNotes: document.getElementById('saleNotes')?.value || '',
        renavam: document.getElementById('saleRenavam')?.value || '',
        placa: document.getElementById('salePlaca')?.value || '',
        chassi: document.getElementById('saleChassi')?.value || '',
        km: document.getElementById('saleKm')?.value || '',
        timestamp: Date.now()
    };
    localStorage.setItem(SALE_FORM_STORAGE_KEY, JSON.stringify(formData));
    console.log('💾 Formulário de venda salvo automaticamente');
}

function restoreSaleFormData() {
    const savedData = localStorage.getItem(SALE_FORM_STORAGE_KEY);
    if (!savedData) return null;
    
    try {
        const formData = JSON.parse(savedData);
        // Verificar se dados não são muito antigos (24 horas)
        const age = Date.now() - formData.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SALE_FORM_STORAGE_KEY);
            return null;
        }
        return formData;
    } catch (e) {
        console.error('❌ Erro ao restaurar dados do formulário:', e);
        return null;
    }
}

function clearSaleFormData() {
    localStorage.removeItem(SALE_FORM_STORAGE_KEY);
    localStorage.removeItem(SALE_MODAL_STATE_KEY);
    console.log('🗑️ Dados do formulário limpos');
}

function setupSaleFormAutoSave() {
    const formInputs = [
        'buyerName', 'buyerCPF', 'saleDate', 'salePrice', 
        'saleNotes', 'saleRenavam', 'salePlaca', 'saleChassi', 'saleKm'
    ];
    
    formInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', saveSaleFormData);
            input.addEventListener('change', saveSaleFormData);
        }
    });
    console.log('✅ Auto-save configurado para formulário de venda');
}

// ===== FUNÇÕES DE LOADING =====
function showAdminLoading(message = 'Processando') {
    console.log('🎬 showAdminLoading chamado:', message);
    if (window.SmartLoading) {
        SmartLoading.show(message);
        console.log('✅ SmartLoading mostrado');
    } else {
        console.error('❌ SmartLoading não disponível!');
    }
}

async function hideAdminLoading() {
    console.log('🔴 hideAdminLoading chamado');
    if (window.SmartLoading) {
        await SmartLoading.hide(); // ⏳ Aguarda tempo mínimo de 2.5s
        console.log('✅ SmartLoading escondido');
    } else {
        console.error('❌ SmartLoading não disponível!');
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

// Retorna o ano do modelo (parte direita de "YYYY/YYYY") quando disponível.
function getModelYear(moto) {
    try {
        if (!moto) return 'N/A';
        const raw = moto.ano || moto.year || '';
        if (typeof raw === 'string' && raw.includes('/')) {
            const parts = raw.split('/').map(s => s.trim());
            if (parts[1]) return parts[1];
        }
        // Se moto.modelYear existir, use-a
        if (moto.modelYear) return String(moto.modelYear);
        // Se year for numérico, retornar como string
        if (moto.year) return String(moto.year);
        if (typeof raw === 'string' && raw.length) return raw;
        return 'N/A';
    } catch (e) {
        return 'N/A';
    }
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
        // Esperar Toast carregar se ainda não disponível
        setTimeout(() => {
            if (window.Toast) {
                Toast.error('❌ Acesso negado! Esta área é apenas para administradores.', 5000);
            } else {
                alert('❌ Acesso negado! Esta área é apenas para administradores.');
            }
        }, 100);
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ Admin autenticado:', user.nome);
    return true;
}

// Variável para controlar o auto-refresh
let autoRefreshInterval = null;
// Cache do último estado para evitar re-renderizações desnecessárias
let lastAppointmentsHash = '';

// 🧹 CLEANUP DE RECURSOS - Limpar intervalos quando a página for fechada/trocada
window.addEventListener('beforeunload', function() {
    console.log('🧹 Limpando recursos antes de sair...');
    stopAutoRefresh();
    if (window.adminNotifications) {
        window.adminNotifications.stopMonitoring();
    }
});

// 🧹 CLEANUP quando a tab fica inativa (economiza recursos)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('👁️ Página oculta, pausando auto-refresh...');
        stopAutoRefresh();
    } else {
        console.log('👁️ Página visível novamente, retomando auto-refresh...');
        startAutoRefresh();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔍 [DEBUG] Admin panel inicializando...');
    
    // TIMEOUT DE SEGURANÇA - Forçar remoção do loading após 5 segundos no máximo
    const safetyTimeout = setTimeout(() => {
        console.warn('⚠️ [SAFETY] Timeout de segurança ativado! Forçando remoção do loading...');
            if (window.SmartLoading && window.SmartLoading.overlay) {
            window.SmartLoading.overlay.classList.remove('active');
            if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = '';
        }
        // Remover qualquer outro overlay que possa existir
        const overlays = document.querySelectorAll('.smart-loading-overlay, [id*="loading"]');
        overlays.forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });
    }, 5000);
    
    try {
        // Atualizar mensagem do loading
        if (window.SmartLoading) {
            SmartLoading.updateMessage('Verificando autenticação...');
        }
        
        // Verificar autenticação antes de carregar o painel
        if (!checkAdminAuth()) {
            if (window.SmartLoading) SmartLoading.hide();
            clearTimeout(safetyTimeout);
            return;
        }
        
        console.log('🔍 [DEBUG] Autenticação OK, carregando dados...');
        
        if (window.SmartLoading) {
            SmartLoading.updateMessage('Carregando motocicletas...');
        }
        
        // Configurar event listeners PRIMEIRO (antes de carregar dados)
        console.log('⚙️ [DEBUG] Configurando event listeners...');
        setupEventListeners();

        // Check for a recent restore marker and show a small blue label if present
        try {
            (async function checkRestoreLabel(){
                const candidateUrls = ['RESTORE_INFO.json', './RESTORE_INFO.json', '/RESTORE_INFO.json', 'backups/RESTORE_INFO.json'];
                const maxAttempts = 5;

                // Do not show the restore label on small/mobile screens (avoids UI clutter)
                try {
                    if (typeof window !== 'undefined' && window.innerWidth && window.innerWidth <= 768) {
                        console.debug('checkRestoreLabel: skipping restore label on mobile screens');
                        return;
                    }
                } catch (e) {
                    // ignore and continue on non-browser or unexpected errors
                }

                for (let attempt=1; attempt<=maxAttempts; attempt++) {
                    for (const url of candidateUrls) {
                        try {
                            console.debug('checkRestoreLabel: trying', url, 'attempt', attempt);
                            const res = await fetch(url, { cache: 'no-store' });
                            if (!res.ok) { console.debug('checkRestoreLabel: not ok', url, res.status); continue; }
                            const info = await res.json();
                            if (!info || !info.backupName) { console.debug('checkRestoreLabel: invalid info from', url); continue; }

                            // Allow user to dismiss a specific restore label
                            const dismissed = localStorage.getItem('restoreLabelDismissed');
                            if (dismissed === info.backupName) { console.debug('checkRestoreLabel: dismissed for', info.backupName); return; }

                            console.log('checkRestoreLabel: RESTORE_INFO found at', url, info);

                            const label = document.createElement('div');
                            label.className = 'restore-label';
                            label.style.cssText = 'background:#0074D9;color:white;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:10px;font-weight:600;margin:12px;box-shadow:0 6px 18px rgba(0,0,0,0.18);';
                            const timeText = info.restoredAt ? new Date(info.restoredAt).toLocaleString() : '';
                            label.innerHTML = `<span style="display:inline-block;min-width:10px;height:10px;border-radius:50%;background:#9ad0ff;margin-right:6px;"></span>Restored from <strong>${info.backupName}</strong> ${timeText ? 'at ' + timeText : ''}`;

                            const btn = document.createElement('button');
                            btn.textContent = 'Dismiss';
                            btn.style.cssText = 'margin-left:8px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:white;padding:6px 8px;border-radius:6px;cursor:pointer;font-weight:600;';
                            btn.addEventListener('click', function(){
                                try { localStorage.setItem('restoreLabelDismissed', info.backupName); } catch(e) {}
                                try { label.remove(); } catch(e) {}
                            });

                            label.appendChild(btn);

                            // Insert label near top of body (after header if exists)
                            try {
                                const headerEl = document.querySelector('header') || document.querySelector('.app-header') || document.body.firstChild;
                                if (headerEl && headerEl.parentElement) {
                                    headerEl.parentElement.insertBefore(label, headerEl.nextSibling);
                                } else {
                                    document.body.insertBefore(label, document.body.firstChild);
                                }
                            } catch (e) {
                                document.body.insertBefore(label, document.body.firstChild);
                            }

                            return;
                        } catch (err) {
                            console.debug('checkRestoreLabel fetch error for', url, err && err.message);
                        }
                    }

                    // wait a bit before retrying
                    await new Promise(r => setTimeout(r, 1500));
                }

                console.debug('checkRestoreLabel: no RESTORE_INFO found after attempts');
            })();
        } catch(e) { console.warn('checkRestoreLabel setup failed', e); }
        
        // Configurar botão Backups (mobile: modal | desktop: navegação)
        const backupsBtn = document.getElementById('backupsButton');
        if (backupsBtn) {
            console.log('✅ Botão Backups encontrado, configurando listeners...');
            
            // Detecção de mobile confiável (considerando viewport scale)
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           (window.matchMedia && window.matchMedia('(max-width: 1400px)').matches);
            
            console.log('📱 Dispositivo detectado:', isMobile ? 'MOBILE' : 'DESKTOP');
            
            // Manipulador de toque para mobile
            backupsBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 Touch detectado no botão Backups');
                if (isMobile) {
                    console.log('📱 Mobile confirmado, abrindo modal...');
                    openBackupsModal();
                } else {
                    console.log('💻 Desktop confirmado, navegando...');
                    window.location.href = 'admin-backups.html';
                }
            }, { passive: false });
            
            // Manipulador de clique (alternativa)
            backupsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click detectado no botão Backups');
                if (isMobile) {
                    console.log('📱 Mobile confirmado, abrindo modal...');
                    openBackupsModal();
                } else {
                    console.log('💻 Desktop confirmado, navegando...');
                    window.location.href = 'admin-backups.html';
                }
            });
            
            console.log('✅ Listeners do botão Backups configurados!');
        } else {
            console.error('❌ Botão Backups NÃO encontrado!');
        }
        
        // Depois carregar dados (AGUARDAR todos para garantir que tudo carregue antes de esconder loading)
        console.log('📦 [DEBUG] Carregando motocicletas...');
        await loadMotos();
        console.log('✅ [DEBUG] Motocicletas carregadas!');
        
        console.log('📅 [DEBUG] Carregando agendamentos...');
        await loadAppointments();
        console.log('✅ [DEBUG] Agendamentos carregados!');
        
        console.log('📊 [DEBUG] Carregando estatísticas...');
        await loadStats();
        console.log('✅ [DEBUG] Estatísticas carregadas!');
        
    } catch (error) {
        console.error('❌ [ERROR] Erro durante inicialização:', error);
        clearTimeout(safetyTimeout);
        if (window.SmartLoading) {
            SmartLoading.hide();
        }
    }
});

// Event listeners
let eventListenersSetup = false; // Flag para evitar duplicação

function setupEventListeners() {
        // Botão de backups no desktop (header-actions)
        const backupsButtonMenuDesktop = document.getElementById('backupsButtonMenuDesktop');
        if (backupsButtonMenuDesktop) {
            backupsButtonMenuDesktop.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'admin-backups.html';
            });
        }
    // Prevenir múltiplas inicializações
    if (eventListenersSetup) {
        console.log('⚠️ Event listeners já configurados, pulando...');
        return;
    }
    
    console.log('🔧 Configurando event listeners...');
    
    // Botão de backups no menu mobile (hamburger)
    const backupsButtonMenuMobile = document.getElementById('backupsButtonMenuMobile');
    if (backupsButtonMenuMobile) {
        backupsButtonMenuMobile.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openBackupsModal();
            toggleMobileMenu();
        });
    }

    // Botão Limpar Cache (mobile) dentro do menu
    const clearCacheMobileBtn = document.getElementById('clearCacheMobileBtn');
    if (clearCacheMobileBtn) {
        clearCacheMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Reusar função forceHardReload existente
            forceHardReload();
            // Fechar menu mobile após ação
            try { toggleMobileMenu(); } catch (err) {}
        });
    }

    // Botão adiciona moto (mobile)
    const addMotoMobileBtn = document.getElementById('addMotoMobileBtn');
    if (addMotoMobileBtn) {
        addMotoMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            try { showAddMotorcycleModal(); } catch (err) { console.error(err); }
            try { toggleMobileMenu(); } catch (err) {}
        });
    }

    // Botão abrir Status do Sistema (mobile)
    const systemStatusMobileBtn = document.getElementById('systemStatusMobileBtn');
    if (systemStatusMobileBtn) {
        systemStatusMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSystemStatusModal();
            try { toggleMobileMenu(); } catch (err) {}
        });
    }
    
    // Submissão do formulário
    const motorcycleForm = document.getElementById('motorcycleForm');
    if (motorcycleForm) {
        motorcycleForm.addEventListener('submit', handleMotoSubmit);
    } else {
        console.error('❌ Formulário motorcycleForm não encontrado!');
    }
    
    // Botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMotos(this.dataset.categoria);
        });
    });
    
    // Campo de busca
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
    
    // Appointment status filter
    const appointmentStatusFilter = document.getElementById('appointmentStatusFilter');
    if (appointmentStatusFilter) {
        appointmentStatusFilter.addEventListener('change', function() {
            console.log('🔄 Filter changed:', this.value);
            filterAppointments();
        });
        console.log('✅ Event listener do appointmentStatusFilter adicionado');
    } else {
        console.error('❌ Elemento appointmentStatusFilter não encontrado!');
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
    
    // 🎯 DELEGAÇÃO DE EVENTOS - Ouvinte de eventos único no grid de motos (evita vazamento de memória)
    const adminGrid = document.getElementById('adminGrid');
    if (adminGrid) {
        adminGrid.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const sellBtn = e.target.closest('.sell-btn');
            const viewBtn = e.target.closest('.view-btn');
            
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = editBtn.getAttribute('data-moto-id');
                console.log('🔧 [DEBUG] Botão editar clicado para ID:', motoId);
                editMoto(motoId);
            } else if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = deleteBtn.getAttribute('data-moto-id');
                console.log('🗑️ [DEBUG] Botão excluir clicado para ID:', motoId);
                confirmDeleteMoto(motoId);
            } else if (sellBtn) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = sellBtn.getAttribute('data-moto-id');
                console.log('💰 [DEBUG] Botão vender clicado para ID:', motoId);
                markAsSold(motoId);
            } else if (viewBtn) {
                e.preventDefault();
                e.stopPropagation();
                const motoId = viewBtn.getAttribute('data-moto-id');
                console.log('👁️ [DEBUG] Botão visualizar clicado para ID:', motoId);
                viewMotoDetails(motoId);
            }
        });
        console.log('✅ Delegação de eventos configurada no adminGrid');
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
    
    // Marcar que os ouvintes de eventos foram configurados
    eventListenersSetup = true;
    console.log('✅ Event listeners configurados com sucesso!');
    
    // 📱 Renderizar filtros estilo pills somente em telas pequenas
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
    if (isMobile) {
        console.log('📱 Mobile detectado - renderizando filtros estilo pills (<=1024px)');
        setTimeout(() => {
            renderMobileFilterPills();
        }, 300);
    }

    // Normalize potential duplicate appointment status controls (some restores created a second one)
    (function normalizeAppointmentFilterControls(){
        try {
            const selects = Array.from(document.querySelectorAll('#appointmentStatusFilter'));
            if (selects.length <= 1) return;
            console.warn('normalizeAppointmentFilterControls: encontrado(s)', selects.length, 'elementos #appointmentStatusFilter - removendo duplicatas');
            // keep first, remove others
            const primary = selects[0];
            selects.slice(1).forEach(s => { try { s.remove(); } catch(e) {} });

            // ensure native select is hidden and a single custom-select exists
            try { primary.style.display = 'none'; primary.setAttribute('aria-hidden','true'); } catch(e) {}
            const prev = primary.previousElementSibling;
            if (!prev || !prev.classList.contains('custom-select')) {
                try { if (typeof createCustomSelect === 'function') createCustomSelect(primary); } catch(e) {}
            }
            // remove any other stray custom-selects that target this select by looking for duplicates nearby
            document.querySelectorAll('.custom-select').forEach(cs => {
                try {
                    const next = cs.nextElementSibling;
                    if (!next || next.id !== 'appointmentStatusFilter') {
                        // ignore
                    } else if (next !== primary) {
                        cs.remove();
                    }
                } catch(e) {}
            });
        } catch(e) { console.warn('normalizeAppointmentFilterControls failed', e); }

        // Additionally: remove any visible duplicate controls in the header-actions
        try {
            const header = document.querySelector('.appointments-section .section-header .header-actions') || document.querySelector('.header-actions');
            if (header) {
                const pendentesNodes = Array.from(header.querySelectorAll('select, .custom-select, button'))
                    .filter(n => n.textContent && n.textContent.includes && n.textContent.includes('Pendentes'));
                if (pendentesNodes.length > 1) {
                    console.warn('normalizeAppointmentFilterControls: removing', pendentesNodes.length - 1, 'duplicate Pendentes controls in header-actions');
                    // keep the right-most (last) node which is likely the functional one
                    pendentesNodes.slice(0, -1).forEach(n => { try { n.remove(); } catch(e) {} });
                }
            }
        } catch(e) { console.warn('normalizeAppointmentFilterControls (cleanup visible) failed', e); }
    })();


    // Filtros do admin: manter apenas sticky puro no CSS, sem portal/fixed
    // Se necessário, garantir que .admin-filters tenha position: sticky/top no CSS
    // Delegated handler for mobile filter pills (works even if pills are rendered later)
    if (!document.__filterPillsHandlerAdded) {
        document.addEventListener('click', function(e) {
            const pill = e.target.closest && e.target.closest('.filter-pill-button');
            if (!pill) return;
            e.preventDefault();
            e.stopPropagation();

            const filterId = pill.getAttribute('data-filter');
            const value = pill.getAttribute('data-value');
            if (filterId) {
                const selectEl = document.getElementById(filterId);
                if (selectEl) {
                    selectEl.value = value;
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // Toggle active state within the same pill group
            const group = pill.parentElement;
            if (group) {
                group.querySelectorAll('.filter-pill-button').forEach(b => b.classList.remove('active'));
                pill.classList.add('active');
            }
        }, true);
        document.__filterPillsHandlerAdded = true;
        console.log('🔁 Delegated filter-pill handler instalado');
    }

    // Delegated handler for custom selects (triggers + options) - robust if createCustomSelect listeners weren't attached
    if (!document.__customSelectHandlerAdded) {
        document.addEventListener('click', function(e) {
            const trigger = e.target.closest && e.target.closest('.custom-select-trigger');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();

                const custom = trigger.closest('.custom-select');
                if (!custom) return;

                // Toggle this custom select open state. Do NOT forcibly close other
                // custom-selects so multiple can be opened simultaneously (needed
                // for modal workflows where the user may compare multiple dropdowns).
                custom.classList.toggle('open');
                return;
            }

            const customOption = e.target.closest && e.target.closest('.custom-option');
            if (customOption) {
                e.preventDefault();
                e.stopPropagation();

                const custom = customOption.closest('.custom-select');
                if (!custom) return;

                const options = Array.from(custom.querySelectorAll('.custom-option'));
                const index = options.indexOf(customOption);

                // Native select is expected to be the next sibling (createCustomSelect inserts custom before original select)
                const selectEl = custom.nextElementSibling && custom.nextElementSibling.tagName === 'SELECT' ? custom.nextElementSibling : null;
                if (selectEl) {
                    selectEl.selectedIndex = index;
                    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Update visual state
                const triggerEl = custom.querySelector('.custom-select-trigger');
                if (triggerEl) triggerEl.textContent = customOption.textContent;
                options.forEach(o => o.classList.remove('selected'));
                customOption.classList.add('selected');

                // Close dropdown
                custom.classList.remove('open');
                return;
            }
        }, true);
        document.__customSelectHandlerAdded = true;
        console.log('🔁 Delegated custom-select handler instalado');
    }
}

// Modal functions for System Status (mobile)
function openSystemStatusModal() {
    const modal = document.getElementById('systemStatusModal');
    const body = document.getElementById('systemStatusModalBody');
    const panel = document.querySelector('.system-status-panel');
    if (!modal || !body || !panel) return;
    // Clone content to modal body
    body.innerHTML = panel.innerHTML;
    modal.style.display = 'block';
}

function closeSystemStatusModal() {
    const modal = document.getElementById('systemStatusModal');
    if (!modal) return;
    modal.style.display = 'none';
}

// 📱 RENDERIZAR FILTROS ESTILO PILLS PARA MOBILE
function renderMobileFilterPills() {
    const adminFiltersList = document.querySelectorAll('.admin-filters');
    if (!adminFiltersList || adminFiltersList.length === 0) return;

    // Guard: only run on small screens (double-check in case matchMedia triggered incorrectly)
    if (!(window.matchMedia && window.matchMedia('(max-width: 1024px)').matches)) return;

    const filterGroups = [
        { name: 'ESTILO', id: 'estiloFilter', options: [
            { value: '', label: 'Todos' },
            { value: 'scooter', label: 'Scooters' },
            { value: 'street', label: 'Streets' },
            { value: 'trail', label: 'Trail' },
            { value: 'alta-cilindrada', label: 'Esportiva' },
            { value: 'custom', label: 'Custom' }
        ]},
        { name: 'CILINDRADA', id: 'cilindradaFilter', options: [
            { value: '', label: 'Todas' },
            { value: '50-100', label: '50-100cc' },
            { value: '110-190', label: '110-190cc' },
            { value: '200-400', label: '200-400cc' },
            { value: '500+', label: '500cc+' }
        ]},
        { name: 'STATUS', id: 'statusFilter', options: [
            { value: '', label: 'Todos' },
            { value: 'disponivel', label: 'Disponível' },
            { value: 'vendido', label: 'Vendido' }
        ]}
    ];

    // Only render pills into the first `.admin-filters` container to avoid duplicates.
    const primaryContainer = adminFiltersList[0];
    if (!primaryContainer) return;

    // Idempotency guard: if we've already rendered pills here, skip.
    if (primaryContainer.dataset.pillsRendered === '1') {
        console.log('renderMobileFilterPills: already rendered, skipping');
        return;
    }

    // Remove any pill groups from other containers (cleanup)
    adminFiltersList.forEach(container => {
        if (container !== primaryContainer) {
            try { container.querySelectorAll('.filter-pill-group').forEach(el => el.remove()); } catch (e) {}
        }
    });

    try {
        // remove any old groups inside the primary container
        primaryContainer.querySelectorAll('.filter-pill-group').forEach(el => el.remove());

        // hide native selects only inside the primary container
        primaryContainer.querySelectorAll('select.filter-select, select#estiloFilter, select#statusFilter, select#marcaFilter, select#cilindradaFilter').forEach(s => {
            try {
                s.style.setProperty('display', 'none', 'important');
                s.style.pointerEvents = 'none';
                s.setAttribute('aria-hidden', 'true');
            } catch (e) {}
        });

        // create and insert pill groups into primary container
        filterGroups.forEach(group => {
            if (primaryContainer.querySelector('.filter-pill-group[data-label="' + group.name + '"]')) return;

            const pillGroup = document.createElement('div');
            pillGroup.className = 'filter-pill-group';
            pillGroup.setAttribute('data-label', group.name);

            const selectElement = primaryContainer.querySelector('#' + group.id) || document.getElementById(group.id);

            group.options.forEach(option => {
                const pill = document.createElement('button');
                pill.type = 'button';
                pill.className = 'filter-pill-button';
                pill.textContent = option.label;
                pill.setAttribute('data-value', option.value);
                pill.setAttribute('data-filter', group.id);

                if (selectElement && selectElement.value === option.value) pill.classList.add('active');

                pill.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectElement) {
                        try {
                            selectElement.value = option.value;
                            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                        } catch (err) {}
                    }
                    pillGroup.querySelectorAll('.filter-pill-button').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                });

                pillGroup.appendChild(pill);
            });

            primaryContainer.appendChild(pillGroup);
        });
    } catch (err) {
        console.error('Erro ao renderizar pills de filtro (primary):', err);
    }
    // mark as rendered to avoid duplicate runs
    try { primaryContainer.dataset.pillsRendered = '1'; } catch(e) {}

    console.log('✅ Filtros estilo pills renderizados e selects nativos ocultados via JS!');
}

// Carregar motos (função principal)
async function loadMotos() {
    try {
        // Sempre buscar do servidor para garantir atualização
        try {
            const resp = await fetch('/api/motorcycles');
            if (!resp.ok) throw new Error('Falha ao buscar motocicletas: ' + resp.status);
            const dados = await resp.json();
            allMotos = Array.isArray(dados) ? dados : [];
            currentMotos = [...allMotos];
            console.log(`✅ [LOAD] ${allMotos.length} motocicletas carregadas do servidor`);
        } catch (fetchErr) {
            console.error('❌ [LOAD] Erro ao buscar motocicletas do servidor:', fetchErr);
            // seguir com array vazio para evitar bloqueio
            allMotos = [];
            currentMotos = [];
        }
        console.log('📊 [UPDATE] Atualizando contadores...');
        updateCounters(allMotos);
        
        // Preencher filtro de marcas
        console.log('🔧 [FILTER] Populando filtro de marcas...');
        populateMarcaFilter(allMotos);
        
        // Garantir que o filtro padrão seja "disponivel" no primeiro carregamento
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter && !statusFilter.dataset.initialized) {
            statusFilter.value = 'disponivel';
            statusFilter.dataset.initialized = 'true';
        }
        
        // Aplicar filtros ativos ao invés de mostrar todas
        console.log('🎯 [FILTER] Aplicando filtros...');
        applyAllFilters();
        console.log('✅ [COMPLETE] loadMotos finalizado!');
        
        // Restaurar posição do scroll se foi salva (somente se veio da página)
        if (savedScrollPosition > 0 && __savedScrollSource === 'page') {
            setTimeout(() => {
                try {
                    window.scrollTo(0, savedScrollPosition);
                } catch (e) {}
                clearSavedScrollPosition(); // Resetar após uso
            }, 100); // Pequeno delay para garantir que o DOM foi atualizado
        }
    } catch (error) {
        console.error('❌ [ERROR] Erro ao carregar motos:', error);
        if (window.Toast) {
            Toast.error('Erro ao carregar motocicletas: ' + error.message, 5000);
        } else {
            showMessage('Erro ao carregar motocicletas: ' + error.message, 'error');
        }
        // Garantir que mesmo com erro não fique travado
        const grid = document.getElementById('adminGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem; color: #ff6b6b;">⚠️</div>
                        <h3 style="color: #ff6b6b;">Erro ao carregar motocicletas</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">
                            🔄 Recarregar Página
                        </button>
                    </div>
                </div>
            `;
        }
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
    
    // Atualizar status do sistema
    const catalogMotoCount = document.getElementById('catalog-moto-count');
    const adminApiStatus = document.getElementById('admin-api-status');
    
    if (catalogMotoCount) {
        catalogMotoCount.textContent = `${disponiveis} motocicletas`;
    }
    
    if (adminApiStatus) {
        adminApiStatus.textContent = '✅ Operacional';
        adminApiStatus.style.color = '#000';
    }
    
    console.log('📊 Contadores atualizados:', { total, disponiveis, vendidos });
}

// Variável global para armazenar agendamentos
let currentAppointments = [];

// Carregar agendamentos
async function loadAppointments(silent = false) {
    try {
        // If this is a silent auto-refresh invocation, respect the UI pause flag
        const pauseUntil = window._pauseAutoRefreshUntil || 0;
        if (silent && Date.now() < pauseUntil) {
            console.log(`%c⏸️ [AUTO-REFRESH] Silent load aborted - paused until ${new Date(pauseUntil).toLocaleTimeString()}`, 'color: #999;');
            return false;
        }

        if (!silent) console.log('📅 Carregando agendamentos...');
        const response = await fetch('/api/appointments');
        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos: ' + response.status);
        }
        
        const appointments = await response.json();
        
        // DEBUG: Mostrar IDs dos agendamentos recebidos da API
        console.log('🌐 API retornou', appointments.length, 'agendamentos');
        console.log('🆔 IDs da API:', appointments.map(a => a.id).slice(-5)); // Últimos 5 IDs
        
        // Guardar contagem anterior
        const previousCount = currentAppointments.length;
        
        // Criar hash dos dados para detectar mudanças
        const currentHash = JSON.stringify(appointments.map(a => ({ id: a.id, status: a.status })));
        
        // Se os dados não mudaram, pular atualização visual
        if (currentHash === lastAppointmentsHash) {
            if (!silent) console.log('⚡ Cache hit - dados inalterados, pulando re-renderização');
            return false;
        }
        
        // Detectar AUMENTO na quantidade = novo agendamento
        const countIncreased = appointments.length > previousCount;
        const newCount = appointments.length - previousCount;
        
        console.log('🔍 DEBUG:', {
            previousCount,
            currentCount: appointments.length,
            countIncreased,
            newCount,
            silent,
            hashChanged: currentHash !== lastAppointmentsHash
        });
        
        // Atualizar lista ANTES de notificar
        lastAppointmentsHash = currentHash;
        const oldAppointments = [...currentAppointments]; // Cópia da lista antiga
        currentAppointments = appointments;
        
        // Notificar se houve AUMENTO de agendamentos no modo silencioso
        if (silent && countIncreased && newCount > 0) {
            console.log(`%c🔔 ${newCount} NOVO(S) AGENDAMENTO(S) DETECTADO(S)!`, 'background: #2196f3; color: white; padding: 8px; font-weight: bold;');
            
            // Pegar os últimos N agendamentos (os novos)
            const newestAppointments = appointments.slice(-newCount);
            
            newestAppointments.forEach(appt => {
                const moto = appt.servico || 'Motocicleta';
                const data = formatDate(appt.data || appt.date);
                const horario = appt.horario || appt.time;
                const cliente = appt.cliente || 'Cliente';
                
                console.log('📋 Novo agendamento:', { cliente, moto, data, horario });
                
                // SEMPRE mostrar Toast VISUAL primeiro (mais importante)
                if (window.Toast) {
                    // Toast AZUL INFORMATIVO grande e bonito
                    Toast.info(
                        `🔔 Novo Agendamento!\n\n👤 ${cliente}\n🏍️ ${moto}\n📅 ${data} às ${horario}`,
                        10000 // 10 segundos para dar tempo de ler
                    );
                    
                    // Notificação do navegador APENAS se o admin estiver em outra aba/minimizado
                    if (document.hidden && Toast.browserNotification) {
                        Toast.browserNotification(
                            '🏍️ Novo Agendamento - MacDavis Motos',
                            `${cliente} - ${moto} - ${data} às ${horario}`
                        );
                    }
                    
                    console.log('✅ Toast visual exibido!');
                } else {
                    console.error('❌ Toast não disponível');
                    if (window.Toast) {
                        Toast.info(`Novo agendamento: ${cliente} - ${moto} - ${data} ${horario}`, 8000);
                    } else {
                        showMessage(`Novo agendamento: ${cliente} - ${moto} - ${data} ${horario}`, 'info');
                    }
                }
            });
        }
        
        if (!silent) console.log('✅ Agendamentos carregados:', currentAppointments.length);
        
        // Atualizar contador uma única vez
        const pendentes = currentAppointments.filter(a => !a.status || a.status === 'pendente' || a.status === 'agendado');
        const elem = document.getElementById('totalAgendamentos');
        if (elem) elem.textContent = String(pendentes.length);
        
        // Atualizar contadores do filtro
        updateAppointmentFilterCounts();
        
        // FORÇAR atualização após 500ms para garantir
        setTimeout(() => {
            console.log('🔄 [FORCE] Atualizando contadores com delay...');
            updateAppointmentFilterCounts();
        }, 500);
        
        // Aplicar filtro atual
        filterAppointments();
        return true; // Retorna true indicando que houve mudanças
    } catch (error) {
        console.error('❌ Erro ao carregar agendamentos:', error);
        if (window.Toast) {
            Toast.error('Erro ao carregar agendamentos: ' + error.message, 5000);
        } else {
            showMessage('Erro ao carregar agendamentos: ' + error.message, 'error');
        }
        return false;
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
        const dateField = apt.data || apt.date;
        const [year, month, day] = dateField.split('-');
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
    
    // 🚀 OTIMIZAÇÃO: Evitar re-renderização completa
    // Gerar hash dos IDs dos agendamentos para detectar mudanças
    const currentHash = appointments.map(a => a.id).sort().join(',');
    
    // Se o conteúdo não mudou, não re-renderizar
    if (appointmentsList.dataset.lastHash === currentHash) {
        console.log('⚡ Nenhuma mudança detectada nos agendamentos, pulando re-renderização');
        return;
    }
    
    // Salvar novo hash
    appointmentsList.dataset.lastHash = currentHash;
    
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
    
    // Atualizar contadores após renderizar
    updateAppointmentFilterCounts();
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
    // Encontrar a moto correspondente (aceitar ambos formatos)
    const motorcycleId = apt.servicoId || apt.motorcycle;
    const moto = currentMotos.find(m => m.id === motorcycleId);
    const motoName = moto ? `${moto.marca || ''} ${moto.modelo || moto.name || moto.nome || ''}`.trim() : 'Moto não encontrada';
    
    // Formatar data (aceitar ambos formatos)
    const dateField = apt.data || apt.date;
    const [year, month, day] = dateField.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    const isRealizado = apt.status === 'realizado';
    const isCancelado = apt.status === 'cancelado';
    const statusClass = isCancelado ? 'cancelado' : (isRealizado ? 'realizado' : 'pendente');
    
    // Normalizar campos (aceitar ambos formatos: português e inglês)
    const clientName = apt.cliente || apt.name || 'Cliente';
    const clientPhone = apt.telefone || apt.phone || '';
    const appointmentTime = apt.horario || apt.time || '';
    const notes = apt.observacoes || apt.notes || '';
    
    // Informações de cancelamento
    const cancelInfo = isCancelado ? `
        <div class="cancel-info">
            <div class="cancel-reason">📝 Motivo: ${apt.cancelReason || 'Não informado'}</div>
            ${apt.canceledAt ? `<div class="cancel-date">🕐 Cancelado em: ${new Date(apt.canceledAt).toLocaleString('pt-BR')}</div>` : ''}
        </div>
    ` : '';
    
    // Badge de confirmação do cliente (verde se confirmou)
    const clientConfirmedBadge = apt.confirmedByClient ? 
        '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.85em; font-weight: 600; margin-left: 8px;">✓ Cliente Confirmou</span>' 
        : '';
    
    return `
        <div class="appointment-card ${statusClass}">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="appointment-icon">${isCancelado ? '❌' : (isRealizado ? '✅' : '👤')}</div>
                <div class="appointment-info">
                    <div class="client-name">${clientName}${clientConfirmedBadge}</div>
                    <div class="moto-name">🏍️ ${motoName}</div>
                    <div class="contact-info">📞 ${clientPhone}</div>
                </div>
            </div>
            <div class="appointment-datetime">
                <div class="appointment-date">📅 ${formattedDate}</div>
                <div class="appointment-time">🕐 ${appointmentTime}</div>
            </div>
            ${notes ? `<div class="appointment-notes">💬 ${notes}</div>` : ''}
            ${cancelInfo}
            <div class="appointment-actions">
                ${!isRealizado && !isCancelado ? `
                    <button class="btn-complete" onclick="markAppointmentComplete('${apt.id}')" title="Marcar como realizado">
                        ✓ Realizado
                    </button>
                    <button class="btn-cancel" onclick="cancelAppointment('${apt.id}')" title="Cancelar agendamento">
                        ❌ Cancelar
                    </button>
                ` : isCancelado ? `
                    <span class="status-label canceled">❌ Cancelado</span>
                ` : `
                    <span class="status-label completed">✅ Concluído</span>
                `}
                <button class="btn-delete-appointment" onclick="deleteAppointment('${apt.id}')" title="Excluir agendamento permanentemente">
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

// ⏱️ Auto-refresh dos agendamentos a cada 2 segundos
function startAutoRefresh() {
    // Ensure we don't create multiple intervals
    try { stopAutoRefresh(); } catch(e){}

    // ⏱️ INTERVALO: 2 segundos para atualizações rápidas
    const refreshTime = 2000; // 2 segundos
    let refreshCount = 0;
    
    console.log(`%c🕐 AUTO-REFRESH ATIVADO! Atualizando a cada ${refreshTime / 1000} segundos`, 'background: #4caf50; color: white; padding: 8px; font-weight: bold; border-radius: 4px;');
    
    autoRefreshInterval = setInterval(async () => {
        refreshCount++;
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        // Check for temporary pause requested by UI (e.g., user typing in search)
        const pauseUntil = window._pauseAutoRefreshUntil || 0;
        if (Date.now() < pauseUntil) {
            console.log(`%c⏸️ [${timestamp}] Auto-refresh pausado até ${new Date(pauseUntil).toLocaleTimeString()}`, 'color: #999;');
            return;
        }

        console.log(`%c🔄 [${timestamp}] Auto-refresh #${refreshCount} - Buscando novos agendamentos...`, 'color: #ff6600; font-weight: bold;');
        
        try {
            const hasChanges = await loadAppointments(true); // Silent mode no auto-refresh
            
            if (hasChanges) {
                console.log(`%c✅ [${timestamp}] Novos dados detectados! Refresh #${refreshCount}`, 'color: #4caf50; font-weight: bold;');
            }
        } catch (error) {
            console.error('❌ [AUTO-REFRESH] Erro ao atualizar:', error);
        }
    }, refreshTime);
    
    console.log(`%c✅ setInterval configurado! ID: ${autoRefreshInterval}`, 'background: #2196f3; color: white; padding: 4px; font-weight: bold;');
}

// Utility: pause auto-refresh for a short period (ms)
function pauseAutoRefreshFor(ms) {
    try {
        const until = Date.now() + (ms || 2000);
        // Extend existing pause if needed
        window._pauseAutoRefreshUntil = Math.max(window._pauseAutoRefreshUntil || 0, until);
        console.log(`⏸️ Pausando auto-refresh até ${new Date(window._pauseAutoRefreshUntil).toLocaleTimeString()}`);

        // If an auto-refresh interval is running, stop it immediately to prevent
        // any in-flight or imminent silent fetches. Schedule a single resume timer
        // that will restart auto-refresh when the pause expires.
        try {
            // Clear existing resume timer if present
            if (window._autoRefreshResumeTimer) {
                clearTimeout(window._autoRefreshResumeTimer);
                window._autoRefreshResumeTimer = null;
            }

            // Stop the periodic interval now
            if (typeof stopAutoRefresh === 'function') {
                stopAutoRefresh();
            }

            // Schedule resume once pauseUntil passes (add a small buffer)
            const delay = Math.max(0, window._pauseAutoRefreshUntil - Date.now() + 50);
            window._autoRefreshResumeTimer = setTimeout(() => {
                try {
                    window._pauseAutoRefreshUntil = 0;
                    if (typeof startAutoRefresh === 'function') startAutoRefresh();
                    console.log('▶️ Auto-refresh retomado automaticamente após pausa');
                } catch (e) { console.warn('Erro ao retomar auto-refresh:', e); }
                window._autoRefreshResumeTimer = null;
            }, delay);
        } catch (e) { console.warn('Erro ao aplicar pausa no auto-refresh:', e); }
    } catch (e) { /* ignore */ }
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
    const _msg_mark = 'Marcar este agendamento como REALIZADO?';
    const _ok_mark = (window.askConfirm && typeof askConfirm === 'function') ? await askConfirm(_msg_mark) : confirm(_msg_mark);
    if (!_ok_mark) return;
    
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
        if (window.Toast) {
            Toast.success('✅ Agendamento marcado como realizado!', 4000);
        } else {
            showMessage('✅ Agendamento marcado como realizado!', 'success');
        }
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao marcar agendamento:', error);
        showMessage('❌ Erro ao marcar agendamento como realizado', 'error');
        // Recarregar mesmo com erro para garantir sincronização
        await loadAppointments();
    }
}

// Cancelar agendamento (preserva histórico)
async function cancelAppointment(appointmentId) {
    console.log('❌ [CANCELAMENTO] Iniciando cancelamento:', appointmentId);
    
    // Solicitar motivo do cancelamento
    let cancelReason = prompt('Por favor, informe o motivo do cancelamento:');
    
    // Se cancelou o prompt, abortar
    if (cancelReason === null) {
        console.log('⚠️ Cancelamento abortado pelo usuário');
        return;
    }
    
    // Se não informou motivo, usar padrão
    if (!cancelReason || cancelReason.trim() === '') {
        cancelReason = 'Não informado';
    }
    
    // Confirmar cancelamento
    const _cancelMsg = `Deseja CANCELAR este agendamento?\n\nMotivo: ${cancelReason}\n\nO agendamento será preservado no histórico.`;
    const confirmed = window.Toast && Toast.confirm
        ? await Toast.confirm(
            `Tem certeza que deseja CANCELAR este agendamento?\n\nMotivo: ${cancelReason}\n\n⚠️ O agendamento será marcado como cancelado e preservado no histórico.`,
            {
                title: 'Cancelar Agendamento',
                confirmText: 'Sim, cancelar',
                cancelText: 'Não',
                icon: '❌'
            }
          )
        : await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_cancelMsg) : Promise.resolve(confirm(_cancelMsg)));
    
    if (!confirmed) {
        return;
    }
    
    try {
        console.log('❌ [CANCELAMENTO] Enviando requisição...');
        console.log('📝 Motivo:', cancelReason);
        
        // Mostrar loading
        const card = event?.target?.closest('.appointment-card');
        if (card) {
            card.style.opacity = '0.3';
            card.style.pointerEvents = 'none';
        }
        
        const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                cancelReason: cancelReason,
                canceledBy: 'Admin'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao cancelar agendamento');
        }
        
        const result = await response.json();
        console.log('✅ [CANCELAMENTO] Agendamento cancelado:', result);
        
        // Recarregar lista
        await loadAppointments();
        
        // Mostrar mensagem de sucesso
        if (window.Toast) {
            Toast.success(`❌ Agendamento cancelado!\n📝 Motivo: ${cancelReason}`, 5000);
        } else {
            showMessage(`❌ Agendamento cancelado! Motivo: ${cancelReason}`, 'success');
        }
    } catch (error) {
        console.error('❌ [CANCELAMENTO] Erro:', error);
        if (window.Toast) {
            Toast.error('❌ Erro ao cancelar agendamento: ' + error.message, 5000);
        } else {
            showMessage('❌ Erro ao cancelar agendamento: ' + error.message, 'error');
        }
        // Recarregar mesmo com erro para garantir sincronização
        await loadAppointments();
    }
}

// Excluir agendamento
async function deleteAppointment(appointmentId) {
    // Usar Toast.confirm se disponível
    const _delMsg = 'Tem certeza que deseja EXCLUIR este agendamento permanentemente?';
    const confirmed = window.Toast && Toast.confirm
        ? await Toast.confirm(
            _delMsg,
            {
                title: 'Excluir Agendamento',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                icon: '🗑️'
            }
          )
        : await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_delMsg) : Promise.resolve(confirm(_delMsg)));
    
    if (!confirmed) {
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
        if (window.Toast) {
            Toast.success('🗑️ Agendamento excluído com sucesso!', 4000);
        } else {
            showMessage('🗑️ Agendamento excluído com sucesso!', 'success');
        }
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao excluir agendamento:', error);
        if (window.Toast) {
            Toast.error('❌ Erro ao excluir agendamento', 5000);
        } else {
            showMessage('❌ Erro ao excluir agendamento', 'error');
        }
        // Recarregar mesmo com erro para garantir sincronização
        await loadAppointments();
    }
}

// Atualizar contadores no filtro de agendamentos
function updateAppointmentFilterCounts() {
    console.log('🔄 [COUNTERS] Iniciando atualização dos contadores...');
    console.log('📊 [COUNTERS] currentAppointments.length:', currentAppointments.length);
    
    const pendentesCount = currentAppointments.filter(a => !a.status || a.status === 'pendente' || a.status === 'agendado').length;
    const realizadosCount = currentAppointments.filter(a => a.status === 'realizado').length;
    const canceladosCount = currentAppointments.filter(a => a.status === 'cancelado').length;
    const totalCount = currentAppointments.length;
    
    console.log('📊 [COUNTERS] Valores calculados:', { pendentesCount, realizadosCount, canceladosCount, totalCount });
    
    const filterElement = document.getElementById('appointmentStatusFilter');
    if (filterElement) {
        console.log('✅ [COUNTERS] Select encontrado!');
        console.log('📋 [COUNTERS] Número de options:', filterElement.options.length);
        
        const currentValue = filterElement.value;
        
        // Verificar se as options existem antes de atualizar
        if (filterElement.options.length >= 4) {
            // Atualizar VALOR e TEXTO das options
            filterElement.options[0].value = 'pendente';
            filterElement.options[0].text = `⏳ Pendentes (${pendentesCount})`;
            filterElement.options[1].value = 'todos';
            filterElement.options[1].text = `Todos (${totalCount})`;
            filterElement.options[2].value = 'realizado';
            filterElement.options[2].text = `✅ Realizados (${realizadosCount})`;
            filterElement.options[3].value = 'cancelado';
            filterElement.options[3].text = `❌ Cancelados (${canceladosCount})`;
            
            // Restaurar valor selecionado
            filterElement.value = currentValue;
            
            // ATUALIZAR o componente visual customizado
            updateCustomSelectForElement(filterElement);
            
            console.log('✅ [COUNTERS] Contadores atualizados:', {
                pendentes: filterElement.options[0].text,
                todos: filterElement.options[1].text,
                realizados: filterElement.options[2].text,
                cancelados: filterElement.options[3].text
            });
        } else {
            console.error('❌ [COUNTERS] Select não tem options suficientes! Tem:', filterElement.options.length);
        }
    } else {
        console.error('❌ [COUNTERS] Elemento appointmentStatusFilter não encontrado!');
    }
}

function filterAppointments() {
    const filterElement = document.getElementById('appointmentStatusFilter');
    const filter = filterElement?.value || 'pendente';
    console.log('🔍 [FILTER] Valor do filtro:', filter);
    console.log('🔍 [FILTER] Total de agendamentos:', currentAppointments.length);
    
    let filtered = currentAppointments;
    
    if (filter === 'pendente') {
        // Aceitar tanto "pendente" quanto "agendado" como pendentes
        filtered = currentAppointments.filter(a => !a.status || a.status === 'pendente' || a.status === 'agendado');
        console.log('🔍 [FILTER] Filtrando pendentes/agendados:', filtered.length);
    } else if (filter === 'realizado') {
        filtered = currentAppointments.filter(a => a.status === 'realizado');
        console.log('🔍 [FILTER] Filtrando realizados:', filtered.length);
    } else if (filter === 'cancelado') {
        filtered = currentAppointments.filter(a => a.status === 'cancelado');
        console.log('🔍 [FILTER] Filtrando cancelados:', filtered.length);
    }
    
    console.log('🔍 [FILTER] Agendamentos filtrados:', filtered.length);
    renderAppointments(filtered);
}

// Buscar agendamento por ID
function searchByAppointmentId(searchTerm) {
    const trimmed = searchTerm.trim();
    
    // Se vazio, mostrar todos (com filtro atual)
    if (!trimmed) {
        filterAppointments();
        return;
    }
    
    console.log('🔍 Buscando por ID:', trimmed);
    
    // Buscar agendamento que contenha o ID
    const found = currentAppointments.filter(apt => 
        apt.id && apt.id.toString().includes(trimmed)
    );
    
    console.log('✅ Encontrados:', found.length);
    
    if (found.length > 0) {
        renderAppointments(found);
        // Destacar o primeiro resultado
        setTimeout(() => {
            const firstCard = document.querySelector('.appointment-card');
            if (firstCard) {
                firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstCard.style.animation = 'pulse 1s ease-in-out 2';
            }
        }, 100);
    } else {
        renderAppointments([]);
    }
}

// Tornar funções disponíveis globalmente
window.markAppointmentComplete = markAppointmentComplete;
window.cancelAppointment = cancelAppointment;
window.deleteAppointment = deleteAppointment;
window.filterAppointments = filterAppointments;
window.searchByAppointmentId = searchByAppointmentId;
window.refreshAppointments = refreshAppointments;
window.toggleMonthAccordion = toggleMonthAccordion;

// Renderizar motocicletas
function renderMotos(motos) {
    try {
        console.log('🔍 [DEBUG] renderMotos chamado com', motos ? motos.length : 0, 'motos');
        
        if (!motos || !Array.isArray(motos)) {
            console.error('❌ [ERROR] renderMotos recebeu dados inválidos:', motos);
            motos = [];
        }
        
        const grid = document.getElementById('adminGrid');
    
    if (!grid) {
        console.error('❌ [ERROR] Elemento adminGrid não encontrado!');
        return;
    }
    
    if (motos.length === 0) {
        console.log('ℹ️ [INFO] Nenhuma moto para renderizar - mostrando estado vazio');
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
            const modelo = (moto.model || moto.modelo || '').toLowerCase();
            const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
            
            if (tipo === 'scooter' || categoria === 'scooter') return 1; // Scooters primeiro
            if (tipo === 'custom' || categoria === 'custom') return 4; // Custom por último
            if (tipo === 'trail' || categoria === 'trail' || tipo === 'enduro' || modelo.includes('xre') || modelo.includes('nc')) return 5; // Trail
            if (cilindrada >= 500) return 3; // Esportiva (só se não for Trail)
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
                    <span>${getModelYear(moto)}</span>
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
                    <button class="btn-primary btn-small view-btn" data-moto-id="${moto.id}">
                        👁️ Ver
                    </button>
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
                </div>
            </div>
        </div>
    `;}).join('');
    
    console.log('✅ [DEBUG] renderMotos concluído.');
    
    } catch (error) {
        console.error('❌ [ERROR] Erro em renderMotos:', error);
        const grid = document.getElementById('adminGrid');
        if (grid) {
            grid.innerHTML = `<div style="color:red;padding:2rem;">Erro ao renderizar motos: ${error.message}</div>`;
        }
    }
}

// Modal de adição/edição
function showSuccess(message) {
    console.log('✅ [SUCCESS]', message);
    if (window.Toast) {
        Toast.success(message, 4000);
    } else {
        showMessage(message, 'success');
    }
}

function showError(message) {
    console.error('❌ [ERROR]', message);
    if (window.Toast) {
        Toast.error(message, 5000);
    } else {
        showMessage(message, 'error');
    }
}

function showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, message);
    
    // Usar sistema Toast se disponível
    if (window.Toast) {
        switch(type) {
            case 'success':
                Toast.success(message, 4000);
                break;
            case 'error':
                Toast.error(message, 5000);
                break;
            case 'warning':
                Toast.warning(message, 4500);
                break;
            case 'info':
            default:
                Toast.info(message, 4000);
                break;
        }
    } else {
        // Fallback para console se Toast não disponível (evitar alerts)
        console.warn('[SHOWMESSAGE FALLBACK]', type.toUpperCase() + ':', message);
    }
}

// ============ FUNÇÕES AUXILIARES ============

// Robust scroll lock helpers (use instead of direct body.style.overflow assignments)
function lockBodyScrollAdmin(){
    try{
        window.__adminPrev = window.__adminPrev || {};
        if (window.__adminPrev.scrollY === undefined) window.__adminPrev.scrollY = window.scrollY || 0;
        if (!window.__adminPrev._locked){
            window.__adminPrev._locked = true;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.__adminPrev.scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            try{ clearTimeout(window.__adminPrev._safetyTimer); }catch(e){}
            window.__adminPrev._safetyTimer = setTimeout(()=>{ try{ unlockBodyScrollAdmin(); }catch(e){} }, 15000);
        }
    }catch(e){}
}

function unlockBodyScrollAdmin(){
    try{
        if (!window.__adminPrev) window.__adminPrev = {};
        const prevScroll = window.__adminPrev && window.__adminPrev.scrollY ? window.__adminPrev.scrollY : 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, prevScroll);
        try{ clearTimeout(window.__adminPrev._safetyTimer); }catch(e){}
        window.__adminPrev._locked = false;
        try { delete window.__adminPrev.scrollY; } catch(e){}
    }catch(e){}
}

// best-effort restore hooks
try{ window.addEventListener('pagehide', unlockBodyScrollAdmin); window.addEventListener('beforeunload', unlockBodyScrollAdmin); }catch(e){}


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
            // Make the modal content scrollable and responsive on small screens
            modalContent.style.boxSizing = 'border-box';
            modalContent.style.padding = '2rem';
            modalContent.style.borderRadius = '12px';
            modalContent.style.zIndex = '1000000';
            modalContent.style.maxHeight = 'calc(100vh - 48px)';
            modalContent.style.overflowY = 'auto';

            // Reduce padding and width on small viewports to avoid zoom/overflow
            if (window.innerWidth <= 900) {
                // Make modal visually smaller and more compact on narrow screens
                modalContent.style.width = '90%';
                modalContent.style.maxWidth = '360px';
                modalContent.style.padding = '0.4rem';
                modalContent.style.borderRadius = '8px';
                modalContent.style.maxHeight = 'calc(100vh - 18px)';
                modalContent.style.lineHeight = '1.02';

                // Keep touch-friendly font size for inputs to avoid auto-zoom
                modalContent.style.fontSize = '16px';
                const controls = modalContent.querySelectorAll('input, select, textarea, button, label, .form-row');
                controls.forEach(c => {
                    try {
                        const tag = (c.tagName||'').toLowerCase();
                        if (tag === 'button') {
                            c.style.padding = '0.45rem 0.5rem';
                            c.style.fontSize = '14px';
                        } else if (c.classList && c.classList.contains('form-row')) {
                            c.style.gap = '0.35rem';
                        } else if (tag === 'label') {
                            c.style.fontSize = '13px';
                        } else {
                            // inputs keep 16px but with compact padding
                            if (tag === 'input' || tag === 'select' || tag === 'textarea') {
                                c.style.fontSize = '16px';
                                c.style.padding = c.style.padding || '0.35rem 0.45rem';
                            }
                        }
                    } catch(e){}
                });

                // Slightly scale down to fit more content without triggering browser zoom
                modalContent.style.transformOrigin = 'top center';
                modalContent.style.transform = 'scale(0.95)';
            }
        }
        
        lockBodyScrollAdmin();
        console.log('✅ [DEBUG] Modal de adição exibido com sucesso');
    } catch (error) {
        console.error('❌ [ERROR] showAddMotorcycleModal:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

function showEditMotorcycleModal(id) {
    console.log('✏️ [DEBUG] showEditMotorcycleModal chamado com ID:', id);
    
    try {
        const moto = allMotos.find(m => m.id === id);
        
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
        if (ano) ano.value = moto.ano || moto.year || '';
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
        
        // Checkbox de visibilidade no catálogo (padrão: true se undefined)
        const showInCatalog = document.getElementById('showInCatalog');
        if (showInCatalog) {
            showInCatalog.checked = moto.showInCatalog !== false;
        }
        
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
        
        lockBodyScrollAdmin();
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
    unlockBodyScrollAdmin();
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
    
    // Ano/Modelo handling: accept "YYYY" or "YYYY/YYYY" from the `ano` field
    const anoCombined = formData.get('ano') || '';
    let anoFirst = null;
    if (anoCombined && anoCombined.includes('/')) {
        const parts = anoCombined.split('/');
        anoFirst = parseInt(parts[0], 10) || null;
    } else if (anoCombined) {
        anoFirst = parseInt(anoCombined, 10) || null;
    }

    const motoData = {
        marca: formData.get('marca'),
        name: formData.get('modelo'),
        nome: formData.get('modelo'),
        modelo: formData.get('modelo'),
        year: anoFirst || formData.get('ano'),
        ano: anoCombined,
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
        showInCatalog: formData.get('showInCatalog') === 'on',
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
                
                // Se foi marcada como vendida, abrir modal correto
                if (motoData.status === 'vendido') {
                    setTimeout(() => {
                        // Verificar se é Mottu
                        const isMottu = newMoto.marca && newMoto.marca.toUpperCase().includes('MOTTU');
                        if (isMottu) {
                            // Abrir direto o modal de contrato para Mottu
                            openContractModal(newMoto.id);
                        } else {
                            // Abrir modal de venda para outras marcas
                            openSaleModal(newMoto);
                        }
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
        if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
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
        fillField('ano', moto.ano || moto.year);
        fillField('km', moto.mileage || moto.km);
        fillField('descricao_resumida', moto.desc_resumida || moto.descricao_resumida);
        fillField('descricao_completa', moto.desc || moto.descricao);
        fillField('pontos_fortes', moto.pontos_fortes);
        
        // Exibir modal
        const motoModal = document.getElementById('motorcycleModal');
        if (motoModal) {
            motoModal.style.display = 'block';
            if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
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
    if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = 'auto';
    editingMoto = null;
    clearImagePreview();
}

// Função para marcar moto como vendida
async function markAsSold(motoId) {
    const moto = allMotos.find(m => m.id === motoId);
    if (!moto) {
        showMessage('❌ Motocicleta não encontrada', 'error');
        return;
    }
    
    // Verificar se é Mottu
    const isMottu = moto.marca && moto.marca.toUpperCase().includes('MOTTU');
    
    if (isMottu) {
        // Para Mottu: marcar como vendida primeiro, depois abrir modal de contrato
        try {
            const response = await fetch(`/api/motorcycles/${motoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...moto,
                    status: 'vendido',
                    showInCatalog: false,
                    saleDate: new Date().toISOString().split('T')[0]
                })
            });
            
            if (response.ok) {
                // Recarregar lista
                await loadMotos();
                
                // Abrir modal de contrato
                setTimeout(() => {
                    openContractModal(motoId);
                }, 300);
            } else {
                throw new Error('Erro ao marcar como vendida');
            }
        } catch (error) {
            console.error('Erro ao marcar Mottu como vendida:', error);
            showMessage('❌ Erro ao marcar como vendida', 'error');
        }
    } else {
        // Abrir modal de venda para outras marcas
        openSaleModal(moto);
    }
}

// Abrir modal de venda
function openSaleModal(moto) {
    const modal = document.getElementById('saleModal');
    const motoInfo = document.getElementById('saleMotorcycleInfo');
    const saleMotoId = document.getElementById('saleMotoId');
    const saleDate = document.getElementById('saleDate');
    
    // Definir ID da moto
    saleMotoId.value = moto.id;
    
    // Armazenar ID no formulário para o botão de contrato
    const saleForm = document.getElementById('saleForm');
    saleForm.dataset.motoId = moto.id;
    
    // Tentar restaurar dados salvos
    const savedData = restoreSaleFormData();
    if (savedData && savedData.motoId === moto.id) {
        // Restaurar dados apenas se for a mesma moto
        document.getElementById('buyerName').value = savedData.buyerName || '';
        document.getElementById('buyerCPF').value = savedData.buyerCPF || '';
        document.getElementById('saleDate').value = savedData.saleDate || '';
        document.getElementById('salePrice').value = savedData.salePrice || '';
        document.getElementById('saleNotes').value = savedData.saleNotes || '';
        document.getElementById('saleRenavam').value = savedData.renavam || '';
        document.getElementById('salePlaca').value = savedData.placa || '';
        document.getElementById('saleChassi').value = savedData.chassi || '';
        document.getElementById('saleKm').value = savedData.km || '';
        
        if (window.Toast) {
            Toast.info('📝 Dados anteriores restaurados! Clique em "Limpar" se quiser começar do zero.', 4000);
        }
    } else {
        // Definir data de hoje como padrão SOMENTE se o campo estiver vazio
        if (!saleDate.value) {
            const today = new Date().toISOString().split('T')[0];
            saleDate.value = today;
        }
        
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
    }
    
    // Marcar que modal está aberto
    localStorage.setItem(SALE_MODAL_STATE_KEY, moto.id);
    
    // Mostrar informações da moto
    const temCRLV = moto.documentoPDF ? true : false;
    const temContrato = moto.contratoPath ? true : false;
    
    // Preparar caminho limpo do CRLV
    const crlvPathLimpo = temCRLV ? moto.documentoPDF.replace(/^["']|["']$/g, '').trim() : '';
    const contratoPathLimpo = temContrato ? moto.contratoPath.replace(/^["']|["']$/g, '').trim() : '';
    
    motoInfo.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #ff6600;">
            ${moto.marca || ''} ${moto.modelo || moto.name || ''}
        </h4>
            <p style="margin: 5px 0; opacity: 0.8;">
            <strong>Ano:</strong> ${getModelYear(moto) || 'N/A'} | 
            <strong>Cor:</strong> ${moto.cor || moto.color || 'N/A'} | 
            <strong>Cilindrada:</strong> ${moto.cilindradas || moto.cc || 'N/A'}cc
        </p>
        ${temCRLV || temContrato ? `
        <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
            ${temCRLV ? `
                <button onclick="abrirCRLV(this.getAttribute('data-pdf-path'), '${moto.id}')" data-pdf-path="${crlvPathLimpo.replace(/"/g, '&quot;')}" style="background: #9c27b0; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                    📄 Ver CRLV
                </button>
            ` : ''}
            ${temContrato ? `
                <button onclick="abrirContrato(this.getAttribute('data-pdf-path'), '${moto.id}')" data-pdf-path="${contratoPathLimpo.replace(/"/g, '&quot;')}" style="background: #00bcd4; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                    📜 Ver Contrato
                </button>
            ` : ''}
        </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
    if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
}

// Fechar modal de venda
function closeSaleModal() {
    const modal = document.getElementById('saleModal');
    const form = document.getElementById('saleForm');
    modal.style.display = 'none';
    if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = 'auto';
    
    // Limpar estado do modal
    localStorage.removeItem(SALE_MODAL_STATE_KEY);
    
    // NÃO limpar auto-save aqui - só ao confirmar venda ou clicar em limpar
    // form.reset(); - REMOVIDO para preservar dados
}

// Nova função para limpar formulário manualmente
window.clearSaleForm = function() {
    const form = document.getElementById('saleForm');
    form.reset();
    
    // Limpar campos específicos
    document.getElementById('saleRenavam').value = '';
    document.getElementById('salePlaca').value = '';
    document.getElementById('saleChassi').value = '';
    document.getElementById('buyerName').value = '';
    document.getElementById('buyerCPF').value = '';
    document.getElementById('salePrice').value = '';
    document.getElementById('saleNotes').value = '';
    document.getElementById('saleKm').value = '';
    
    // Limpar auto-save
    clearSaleFormData();
    
    // Resetar data para hoje
    const saleDate = document.getElementById('saleDate');
    const today = new Date().toISOString().split('T')[0];
    saleDate.value = today;
    
    if (window.Toast) {
        Toast.success('🗑️ Formulário limpo!', 2000);
    }
};

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
            const paymentMethod = document.getElementById('paymentMethod')?.value || '';
            const paymentDetails = document.getElementById('paymentDetails')?.value || '';
            
            if (!buyerName || !saleDate) {
                showMessage('❌ Por favor, preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            try {
                console.log('💰 [DEBUG] Registrando venda:', { motoId, buyerName, saleDate, renavam, placa, chassi });
                
                // Usar a data no formato YYYY-MM-DD diretamente (não converter para ISO)
                // Isso evita problemas de timezone
                
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
                        saleDate: saleDate, // Usar diretamente o formato YYYY-MM-DD
                        saleNotes: saleNotes,
                        paymentMethod: paymentMethod,
                        paymentDetails: paymentDetails,
                        // Preservar dados existentes se não forem preenchidos no formulário
                        renavam: renavam || motoAtual?.renavam || '',
                        placa: placa || motoAtual?.placa || '',
                        chassi: chassi || motoAtual?.chassi || '',
                        // IMPORTANTE: Preservar documentoPDF da moto original
                        documentoPDF: motoAtual?.documentoPDF || '',
                        // Salvar caminho/URL do contrato se fornecido no formulário (campo `contratoPDF`)
                        contratoPath: (document.getElementById('contratoPDF') && document.getElementById('contratoPDF').value) ? document.getElementById('contratoPDF').value : (motoAtual?.contratoPath || ''),
                        soldAt: new Date().toISOString()
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao registrar venda');
                }
                
                console.log('✅ [DEBUG] Venda registrada com sucesso, saleDate:', saleDate);
                
                // Limpar auto-save após venda bem-sucedida
                clearSaleFormData();
                
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
        const loadingStartTime = Date.now(); // ⏱️ Marcar início para garantir 2.5s mínimo
        showAdminLoading('Carregando vendas');
        
        const response = await fetch('/api/motorcycles');
        if (!response.ok) {
            throw new Error('Erro ao carregar motocicletas');
        }
        
        const motorcycles = await response.json();
        const soldMotos = motorcycles.filter(m => m.status === 'vendido');

        // Cache sold list so filters can operate even if `allMotos` isn't populated
        try { window._soldMotosCache = soldMotos; } catch (e) {}
        
        if (soldMotos.length === 0) {
            await hideAdminLoading();
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
        
        // Calcular média de vendas por mês
        const mesesComVendas = Object.keys(motosPorMes).length;
        const mediaVendasPorMes = mesesComVendas > 0 ? (totalVendas / mesesComVendas).toFixed(1) : 0;
        
        // Criar dropdown de filtro por mês com dashboard de estatísticas MINIMALISTA PROFISSIONAL
        const mesesDisponiveis = Object.keys(motosPorMes);
        const filterHtml = `
            <!-- Dashboard MacDavis - Cards Profissionais -->
            <div class="sales-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 20px 25px 20px;">
                <!-- Card Total Vendido -->
                <div class="macdavis-stat-card">
                    <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);">
                            <span style="font-size: 1.5rem;">💰</span>
                        </div>
                        <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">TOTAL</div>
                    </div>
                    <div class="card-body">
                        <div class="card-value">${totalVendas}</div>
                        <div class="card-label" style="color: rgba(255, 120, 0, 0.95);">Vendas Realizadas</div>
                    </div>
                    <div class="card-footer">
                        <div class="card-detail" style="color: rgba(255, 120, 0, 0.85);">
                            <span class="detail-icon">📊</span>
                            <span class="detail-text">Histórico completo</span>
                        </div>
                    </div>
                </div>
                
                <!-- Card Este Ano -->
                <div class="macdavis-stat-card">
                    <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);">
                            <span style="font-size: 1.5rem;">📅</span>
                        </div>
                        <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">ANO</div>
                    </div>
                    <div class="card-body">
                        <div class="card-value">${vendasEsteAno}</div>
                        <div class="card-label" style="color: rgba(255, 120, 0, 0.95);">Vendas em ${new Date().getFullYear()}</div>
                    </div>
                    <div class="card-footer">
                        <div class="card-detail" style="color: rgba(255, 120, 0, 0.85);">
                            <span class="detail-icon">📈</span>
                            <span class="detail-text">Ano corrente</span>
                        </div>
                    </div>
                </div>
                
                <!-- Card Este Mês -->
                <div class="macdavis-stat-card">
                    <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);">
                            <span style="font-size: 1.5rem;">🔥</span>
                        </div>
                        <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">MÊS</div>
                    </div>
                    <div class="card-body">
                        <div class="card-value">${vendasEsteMes}</div>
                        <div class="card-label" style="color: rgba(255, 120, 0, 0.95);">Vendas Recentes</div>
                    </div>
                    <div class="card-footer">
                        <div class="card-detail" style="color: rgba(255, 120, 0, 0.85);">
                            <span class="detail-icon">⚡</span>
                            <span class="detail-text">Últimos 30 dias</span>
                        </div>
                    </div>
                </div>
                
                <!-- Card Média Mensal -->
                <div class="macdavis-stat-card">
                    <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);">
                            <span style="font-size: 1.5rem;">📊</span>
                        </div>
                        <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">MÉDIA</div>
                    </div>
                    <div class="card-body">
                        <div class="card-value">${mediaVendasPorMes}</div>
                        <div class="card-label" style="color: rgba(255, 120, 0, 0.95);">Vendas por Mês</div>
                    </div>
                    <div class="card-footer">
                        <div class="card-detail" style="color: rgba(255, 120, 0, 0.85);">
                            <span class="detail-icon">📊</span>
                            <span class="detail-text">${mesesComVendas} ${mesesComVendas === 1 ? 'mês' : 'meses'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filtro e Controles -->
            <div class="filter-controls-wrapper" style="background: rgba(255, 102, 0, 0.1); padding: 18px 20px; border-radius: 12px; border-left: 4px solid #ff6600; margin: 0 20px 25px 20px; backdrop-filter: blur(5px); position: relative; z-index: 1002; overflow: visible;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-direction: column; gap: 15px; position: relative; z-index: 1002; overflow: visible;">
                    <div style="width: 100%;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #ff6600; display: flex; align-items: center; gap: 8px;">
                            🔍 Filtros e Navegação
                        </h3>
                        <p style="font-size: 11px; margin: 0; opacity: 0.7; color: white;">
                            💡 <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 10px;">ESC</kbd> Fechar 
                            <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 8px;">F</kbd> Filtro
                        </p>
                    </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; position: relative; z-index: 1002; overflow: visible;">
                        <select id="soldMarcaFilter" onchange="debounceFilterSoldMotorcycles()" class="filter-select" style="width: 100%;">
                            <option value="all">Todas as Marcas</option>
                        </select>
                        <select id="monthFilter" onchange="debounceFilterSoldMotorcycles()" class="filter-select" style="width: 100%;">
                            <option value="all">Todos os meses (${totalVendas})</option>
                            ${mesesDisponiveis.map(mes => {
                                const capitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
                                const count = motosPorMes[mes].length;
                                return `<option value="${mes}">${capitalizado} (${count})</option>`;
                            }).join('')}
                        </select>

                            <input type="text" 
                                id="soldSearchInput" 
                                placeholder="Buscar por marca, modelo..." 
                                class="search-input sold-search-input"
                                oninput="debounceFilterSoldMotorcycles()"
                                style="width: 100%; margin-top: 0; grid-column: 1 / -1;">
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
                    <div data-marca="${moto.marca || ''}" class="sold-card-modern">
                        <!-- Imagem -->
                        <div class="sold-card-image">
                            <img src="${moto.image || moto.thumb || '/images/placeholder.jpg'}" 
                                 alt="${moto.nome || moto.name}" loading="lazy">
                            <div class="sold-badge">VENDIDA</div>
                        </div>
                        
                        <!-- Header -->
                        <div class="sold-card-header">
                            <h4>${moto.marca || ''} ${moto.modelo || moto.name || ''}</h4>
                            <span class="sold-card-plate">${moto.placa || '---'}</span>
                        </div>
                        
                        <!-- Specs -->
                        <div class="sold-card-specs">
                            <div class="spec-item">
                                <span class="spec-value">${moto.ano || '---'}</span>
                                <span class="spec-label">ANO</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${moto.cilindradas || moto.cc || '---'}<small>cc</small></span>
                                <span class="spec-label">CILINDRADA</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${moto.cor || '---'}</span>
                                <span class="spec-label">COR</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${formatarNumero(moto.quilometragem || moto.mileage || 0)}</span>
                                <span class="spec-label">KM</span>
                            </div>
                        </div>
                        
                        <!-- Info Venda -->
                        <div class="sold-card-sale-info">
                            <div class="sale-info-row">
                                <span class="info-label">Data</span>
                                <span class="info-value">${saleDate}</span>
                            </div>
                            <div class="sale-info-row">
                                <span class="info-label">Comprador</span>
                                <span class="info-value">${buyerName}</span>
                            </div>
                            ${moto.renavam ? `
                            <div class="sale-info-row">
                                <span class="info-label">RENAVAM</span>
                                <span class="info-value">${moto.renavam}</span>
                            </div>
                            ` : ''}
                            ${moto.chassi ? `
                            <div class="sale-info-row">
                                <span class="info-label">Chassi</span>
                                <span class="info-value chassi-text">${moto.chassi}</span>
                            </div>
                            ` : ''}
                            ${moto.paymentMethod ? `
                            <div class="sale-info-row">
                                <span class="info-label">Pagamento</span>
                                <span class="info-value">${moto.paymentMethod}${moto.paymentDetails ? ' - ' + moto.paymentDetails : ''}</span>
                            </div>
                            ` : ''}
                            ${saleNotes ? `
                            <div class="sale-info-row sale-notes">
                                <span class="info-label">Obs</span>
                                <span class="info-value">${saleNotes}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- Botões -->
                        <div class="sold-card-actions">
                            ${moto.documentoPDF ? `
                            <button onclick="abrirCRLV(this.getAttribute('data-pdf-path'), '${moto.id}')" 
                                    data-pdf-path="${(moto.documentoPDF || '').replace(/^["']|["']$/g, '').trim().replace(/"/g, '&quot;')}" 
                                    class="action-btn btn-purple">
                                📄 CRLV
                            </button>
                            ` : ''}
                            ${moto.contratoPath ? `
                            <button onclick="abrirContrato(this.getAttribute('data-pdf-path'), '${moto.id}')" 
                                    data-pdf-path="${(moto.contratoPath || '').replace(/^["']|["']$/g, '').trim().replace(/"/g, '&quot;')}" 
                                    class="action-btn btn-cyan">
                                📜 Contrato
                            </button>
                            ` : ''}
                            <button onclick="editSoldMoto('${moto.id}')" class="action-btn btn-orange">
                                ✏️ Editar
                            </button>
                            <button onclick="revertSale('${moto.id}')" class="action-btn btn-blue">
                                🔄 Retornar
                            </button>
                            <button onclick="deleteSoldMoto('${moto.id}')" class="action-btn btn-red">
                                🗑️ Excluir
                            </button>
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
        // Populate sold filters (brands and months) based on soldMotos data
        try {
            if (typeof populateSoldFilters === 'function') {
                populateSoldFilters(soldMotos, mesesDisponiveis, motosPorMes, totalVendas);
            }
        } catch (e) { console.warn('Erro ao popular filtros de vendas:', e); }
        // Ensure stats and filter panels exist — defensive injection when template parts
        // were not rendered into the modal for any reason (race / dedupe / relocation).
        try {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                let topWrapper = modalBody.querySelector('.sales-top-wrapper');
                if (!topWrapper) {
                    topWrapper = document.createElement('div');
                    topWrapper.className = 'sales-top-wrapper';
                    topWrapper.style.marginBottom = '18px';
                    topWrapper.style.opacity = topWrapper.style.opacity || '1';
                }

                // sales-stats-grid: recreate from already-calculated values if missing
                if (!topWrapper.querySelector('.sales-stats-grid') && (typeof totalVendas !== 'undefined')) {
                    try {
                        const statsDiv = document.createElement('div');
                        statsDiv.className = 'sales-stats-grid';
                        statsDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 20px 6px 20px;';
                        statsDiv.style.opacity = statsDiv.style.opacity || '1';
                        statsDiv.innerHTML = `
                            <div class="macdavis-stat-card">
                                <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                                <div class="card-header"><div class="card-icon" style="background: rgba(255,102,0,0.1);">💰</div><div class="card-badge">TOTAL</div></div>
                                <div class="card-body"><div class="card-value">${totalVendas}</div><div class="card-label">Vendas Realizadas</div></div>
                            </div>
                            <div class="macdavis-stat-card">
                                <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                                <div class="card-header"><div class="card-icon" style="background: rgba(255,102,0,0.1);">📅</div><div class="card-badge">ANO</div></div>
                                <div class="card-body"><div class="card-value">${vendasEsteAno}</div><div class="card-label">Vendas em ${new Date().getFullYear()}</div></div>
                            </div>
                            <div class="macdavis-stat-card">
                                <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                                <div class="card-header"><div class="card-icon" style="background: rgba(255,102,0,0.1);">🔥</div><div class="card-badge">MÊS</div></div>
                                <div class="card-body"><div class="card-value">${vendasEsteMes}</div><div class="card-label">Vendas Recentes</div></div>
                            </div>
                            <div class="macdavis-stat-card">
                                <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                                <div class="card-header"><div class="card-icon" style="background: rgba(255,102,0,0.1);">📊</div><div class="card-badge">MÉDIA</div></div>
                                <div class="card-body"><div class="card-value">${mediaVendasPorMes}</div><div class="card-label">Vendas / mês</div></div>
                            </div>
                        `;
                        topWrapper.appendChild(statsDiv);
                    } catch (e) { console.warn('Erro ao recriar sales-stats-grid:', e); }
                }

                // filter-controls-wrapper: recreate a minimal one if missing
                if (!topWrapper.querySelector('.filter-controls-wrapper')) {
                    try {
                        const filterDiv = document.createElement('div');
                        filterDiv.className = 'filter-controls-wrapper';
                        filterDiv.style.cssText = 'background: rgba(255, 102, 0, 0.1); padding: 18px 20px; border-radius: 12px; border-left: 4px solid #ff6600; margin: 0 20px 25px 20px; position: relative; z-index: 1002; overflow: visible;';
                        filterDiv.innerHTML = `
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:12px;">
                                    <select id="soldMarcaFilter" class="filter-select" style="flex:1"><option value="all">Todas as Marcas</option></select>
                                    <select id="monthFilter" class="filter-select" style="flex:1"><option value="all">Todos os meses (${totalVendas})</option>${(mesesDisponiveis||[]).map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
                                </div>
                                <div style="display:flex;gap:8px;width:100%">
                                    <input id="soldSearchInput" class="search-input sold-search-input" placeholder="Buscar por marca, modelo..." style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);" />
                                    <button id="soldSearchButton" class="btn-search" style="padding:10px 14px;border-radius:8px;background:#ff6600;color:#fff;border:none;cursor:pointer;">Buscar</button>
                                </div>
                            </div>
                        `;
                        topWrapper.appendChild(filterDiv);
                    } catch (e) { console.warn('Erro ao criar filter-controls-wrapper:', e); }
                }

                // insert wrapper into modalBody before first month-section
                try {
                    const firstMonth = modalBody.querySelector('.month-section');
                    if (topWrapper.parentElement !== modalBody) {
                        if (firstMonth) modalBody.insertBefore(topWrapper, firstMonth);
                        else modalBody.insertBefore(topWrapper, modalBody.firstChild);
                    }
                } catch (e) {}

                // Deduplicate any duplicate filter elements that may exist elsewhere
                try {
                    ['soldMarcaFilter','monthFilter','soldSearchInput'].forEach(id => {
                        const all = Array.from(document.querySelectorAll('#' + id));
                        if (all.length > 1) {
                            // Prefer the element that lives inside this modal
                            const keeper = all.find(el => modal.contains(el)) || all[0];
                            all.forEach(el => { if (el !== keeper && el.parentElement) el.parentElement.removeChild(el); });
                        }
                    });
                } catch (e) { console.warn('Erro ao deduplicar filtros:', e); }

                // ensure visible and trigger visual update
                try {
                    topWrapper.style.opacity = topWrapper.style.opacity || '1';
                    const mb = modalBody;
                    setTimeout(()=>{ try{ mb.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('resize')); }catch(e){} }, 40);
                } catch (e) {}
            }
        } catch (e) { console.warn('Erro defensivo ao garantir stats/filters:', e); }
        // Now that real content is in place, remove the skeleton/placeholder
        try {
            // remove any element(s) with this id (defensive: duplicates may exist)
            const skeletons = Array.from(document.querySelectorAll('#soldPanelSkeleton'));
            skeletons.forEach(s => { try { s.remove(); } catch(e){} });

            // Force a scroll/resize event to trigger the fade updater (it listens to scroll/resize)
            try {
                const modalBody = modal.querySelector('.modal-body');
                if (modalBody) {
                    // small delayed dispatch to allow layout to settle
                    setTimeout(() => {
                        try { modalBody.dispatchEvent(new Event('scroll')); } catch(e){}
                        try { window.dispatchEvent(new Event('resize')); } catch(e){}
                    }, 40);
                } else {
                    try { window.dispatchEvent(new Event('resize')); } catch(e){}
                }
            } catch (e) { /* ignore */ }
        } catch (e) { /* ignore */ }

        // Deduplicate any filter/stats nodes created inside the rendered HTML.
        // When `content.innerHTML` is re-rendered we can end up with new
        // `.filter-controls-wrapper` and `.sales-stats-grid` elements inside
        // the scrollable `modalBody`. Keep at most one instance and prefer
        // the one already moved to `modalContent` (persistent). This
        // prevents multiple stacked overlays and inconsistent fixed toggles.
        try {
            const modalBody = modal.querySelector('.modal-body');
            const modalContent = modal.querySelector('.modal-content');
            if (modalBody && modalContent) {
                // If modalContent already has a persistent filter, remove any in modalBody
                const persistentFilter = modalContent.querySelector('.filter-controls-wrapper');
                const filtersInBody = Array.from(modalBody.querySelectorAll('.filter-controls-wrapper'));
                if (persistentFilter && filtersInBody.length) {
                    filtersInBody.forEach(f => { if (f !== persistentFilter) { try { f.remove(); } catch(e){} } });
                } else if (filtersInBody.length > 1) {
                    // keep the first one, remove extras
                    filtersInBody.slice(1).forEach(f => { try { f.remove(); } catch(e){} });
                }

                // Deduplicate sales-stats-grid: prefer one in modalContent, else move first from body and remove others
                const statsInContent = modalContent.querySelectorAll('.sales-stats-grid');
                const statsInBody = Array.from(modalBody.querySelectorAll('.sales-stats-grid'));
                if (statsInContent.length > 0) {
                    // remove any in body
                    statsInBody.forEach(s => { try { s.remove(); } catch(e){} });
                } else if (statsInBody.length > 1) {
                    // move the first to modalContent and remove extras
                    try {
                        const first = statsInBody[0];
                        modalContent.insertBefore(first, modalBody);
                    } catch(e) {}
                    statsInBody.slice(1).forEach(s => { try { s.remove(); } catch(e){} });
                }
            }
        } catch (e) { console.warn('Erro ao deduplicar filtros/estatísticas:', e); }

        // Garantir que os 4 counters de estatísticas fiquem fora do conteúdo
        // que é re-renderizado frequentemente (`soldMotorcyclesContent`). Criamos
        // um container persistente dentro do `modalBody` para inserir os cards
        // de estatísticas uma única vez e evitar que sejam removidos.
        try {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody && !modalBody.querySelector('.sales-stats-grid')) {
                const statsDiv = document.createElement('div');
                statsDiv.className = 'sales-stats-grid';
                statsDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 20px 6px 20px;';
                // start visible to avoid flash/blank before fade logic runs
                statsDiv.style.opacity = statsDiv.style.opacity || '1';
                statsDiv.innerHTML = `
                    <div class="macdavis-stat-card">
                        <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);"><span style="font-size:1.5rem;">💰</span></div>
                            <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">TOTAL</div>
                        </div>
                        <div class="card-body"><div class="card-value">${totalVendas}</div><div class="card-label">Total vendido</div></div>
                    </div>
                    <div class="macdavis-stat-card">
                        <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);"><span style="font-size:1.5rem;">📅</span></div>
                            <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">MÊS</div>
                        </div>
                        <div class="card-body"><div class="card-value">${vendasEsteMes}</div><div class="card-label">Vendas Recentes</div></div>
                    </div>
                    <div class="macdavis-stat-card">
                        <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);"><span style="font-size:1.5rem;">📊</span></div>
                            <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">MÉDIA</div>
                        </div>
                        <div class="card-body"><div class="card-value">${mediaVendasPorMes}</div><div class="card-label">Vendas / mês</div></div>
                    </div>
                    <div class="macdavis-stat-card">
                        <div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div>
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(255, 102, 0, 0.1);"><span style="font-size:1.5rem;">📈</span></div>
                            <div class="card-badge" style="background: rgba(255, 102, 0, 0.15); color: #ff6600;">MESES</div>
                        </div>
                        <div class="card-body"><div class="card-value">${mesesComVendas}</div><div class="card-label">Meses com vendas</div></div>
                    </div>
                `;

                // Inserir antes do primeiro filho para que fique acima das month-sections
                modalBody.insertBefore(statsDiv, modalBody.firstChild);
            }
        } catch (e) { console.warn('Erro ao inserir container de estatísticas persistente:', e); }

        // Fazer os filtros e estatísticas rolarem e aplicarem efeito de fade com o scroll
        try {
            const modalBody = modal.querySelector('.modal-body');
            if (!modalBody) throw new Error('modalBody não encontrado para behavior de fade');

            // Preferir elementos dentro do modalBody para que rolem normalmente
            let filterEl = modalBody.querySelector('.filter-controls-wrapper') || modal.querySelector('.filter-controls-wrapper');
            let statsEl = modalBody.querySelector('.sales-stats-grid') || modal.querySelector('.sales-stats-grid');

            // Se os elementos existirem mas estiverem fora do modalBody, mova-os para dentro
            // e agrupe em um wrapper `.sales-top-wrapper` para garantir: [stats] -> [filters/search] -> [cards]
            try {
                let topWrapper = modalBody.querySelector('.sales-top-wrapper');
                if (!topWrapper) {
                    topWrapper = document.createElement('div');
                    topWrapper.className = 'sales-top-wrapper';
                    topWrapper.style.marginBottom = '18px';
                    // ensure wrapper visible initially
                    topWrapper.style.opacity = topWrapper.style.opacity || '1';
                }

                const firstMonth = modalBody.querySelector('.month-section');

                // mover stats primeiro (mantendo ordem)
                try {
                    if (statsEl && statsEl.parentElement !== topWrapper) {
                        topWrapper.appendChild(statsEl);
                        try { statsEl.style.opacity = statsEl.style.opacity || '1'; } catch(e){}
                    }
                } catch (e) {}

                // mover filtros abaixo das estatísticas
                try {
                    if (filterEl && filterEl.parentElement !== topWrapper) {
                        topWrapper.appendChild(filterEl);
                        try { filterEl.style.opacity = filterEl.style.opacity || '1'; } catch(e){}
                    }
                } catch (e) {}

                // inserir wrapper antes do primeiro month-section (ou no topo)
                if (topWrapper.parentElement !== modalBody) {
                    if (firstMonth) modalBody.insertBefore(topWrapper, firstMonth);
                    else modalBody.insertBefore(topWrapper, modalBody.firstChild);
                }

                // atualizar referências
                statsEl = topWrapper.querySelector('.sales-stats-grid') || statsEl;
                filterEl = topWrapper.querySelector('.filter-controls-wrapper') || filterEl;
            } catch (e) { /* ignore move failures */ }

            // Guardar para não amarrar múltiplos listeners se já ligado
            if (modalBody._vendasFadeBound) {
                // update initial state once
                updateFade();
            } else {
                modalBody._vendasFadeBound = true;

                // apply smooth transition for visuals
                const applyTransition = (el) => {
                    try {
                        el.style.transition = el.style.transition || 'opacity 180ms linear, transform 220ms ease-out';
                        el.style.willChange = 'opacity, transform';
                    } catch (e) {}
                };

                function updateFade() {
                    try {
                        const els = [];
                        if (statsEl) els.push(statsEl);
                        if (filterEl) els.push(filterEl);

                        els.forEach(el => {
                            try {
                                applyTransition(el);
                                // position relative to visible top of modalBody
                                const elTop = el.offsetTop - modalBody.scrollTop;

                                // Use different fade distance for stats vs filters so
                                // stats disappear first, filters remain visible longer.
                                let denom;
                                let translateFactor = 12;
                                if (el.classList && el.classList.contains('sales-stats-grid')) {
                                    denom = Math.max(30, el.offsetHeight + 20);
                                    translateFactor = 14;
                                } else if (el.classList && el.classList.contains('filter-controls-wrapper')) {
                                    // make filters fade slower and translate less
                                    denom = Math.max(80, el.offsetHeight * 2 + 40);
                                    translateFactor = 8;
                                } else {
                                    denom = Math.max(40, el.offsetHeight + 40);
                                }

                                let opacity = Math.max(0, Math.min(1, elTop / denom));
                                opacity = Math.pow(opacity, 0.95);
                                el.style.opacity = String(opacity);
                                const ty = -Math.round((1 - opacity) * translateFactor);
                                el.style.transform = `translateY(${ty}px)`;

                                // Ensure filter isn't sticky (we want it to scroll away like cards)
                                if (el.classList && el.classList.contains('filter-controls-wrapper')) {
                                    try {
                                        el.style.position = '';
                                        el.style.top = '';
                                        el.style.zIndex = '';
                                    } catch (e) {}
                                }
                            } catch (e) {}
                        });
                    } catch (e) {}
                }

                // Throttle updates (simple RAF-based throttle)
                let scheduled = false;
                function scheduleUpdate() {
                    if (scheduled) return; scheduled = true;
                    requestAnimationFrame(() => { scheduled = false; updateFade(); });
                }

                modalBody.addEventListener('scroll', scheduleUpdate, { passive: true });
                window.addEventListener('resize', scheduleUpdate, { passive: true });

                // initial
                setTimeout(() => { updateFade(); }, 30);
            }
        } catch (e) {
            console.warn('🔧 Não foi possível ativar scroll-fade nos filtros/estatísticas:', e);
        }

        // Pós-render: aplicar pequeno fix para imagens/cards (evita reflow e problemas de altura)
        try {
            const gridEl = document.getElementById('adminGrid');
            if (gridEl) {
                const cards = Array.from(gridEl.querySelectorAll('.moto-card'));
                cards.forEach(card => {
                    try {
                        const imgs = Array.from(card.querySelectorAll('img'));
                        imgs.forEach(img => {
                            try {
                                img.style.display = 'block';
                                img.style.width = '100%';
                                img.style.height = '120px';
                                img.style.objectFit = 'cover';
                                img.style.marginBottom = '8px';
                            } catch (e) {}

                            if (!img.complete) {
                                img.addEventListener('load', () => { try { window.dispatchEvent(new Event('resize')); } catch(e) {} }, { once: true });
                                img.addEventListener('error', () => { try { window.dispatchEvent(new Event('resize')); } catch(e) {} }, { once: true });
                            }
                        });

                        card.style.willChange = 'transform';
                        void card.offsetHeight;
                        card.style.transform = 'translateZ(0)';
                    } catch (e) {}
                });

                setTimeout(() => {
                    try {
                        window.dispatchEvent(new Event('resize'));
                        // reset temporary styles
                        const cards2 = Array.from(gridEl.querySelectorAll('.moto-card'));
                        cards2.forEach(c => { try { c.style.willChange = 'auto'; c.style.transform = ''; } catch(e) {} });
                    } catch(e) {}
                }, 80);
            }
        } catch (e) {
            console.warn('postRenderSoldFix erro', e);
        }
        
        // Populalar filtro de marcas com marcas de motos vendidas
        const marcasVendidas = [...new Set(soldMotos.map(m => m.marca).filter(marca => marca))].sort();
        const marcaFilterSelect = modal ? modal.querySelector('#soldMarcaFilter') : document.getElementById('soldMarcaFilter');
        if (marcaFilterSelect && marcaFilterSelect.options.length <= 1) {
            marcasVendidas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca;
                option.textContent = marca;
                marcaFilterSelect.appendChild(option);
            });
            // Garantir que mudanças no select disparem o filtro (fallback ao custom-select)
            try {
                marcaFilterSelect.addEventListener('change', function(e) { console.log('DEBUG: soldMarcaFilter change ->', marcaFilterSelect.value); debounceFilterSoldMotorcycles(); });
            } catch (e) {}
            // Atualizar a versão customizada caso exista
            try { 
                updateCustomSelectForElement(marcaFilterSelect); 
            } catch (e) {}

            // Se existir o custom-select, também ligar os cliques das opções diretamente (fallback)
            try {
                const customForMarca = marcaFilterSelect.previousElementSibling;
                if (customForMarca && customForMarca.classList.contains('custom-select')) {
                    customForMarca.querySelectorAll('.custom-option').forEach(opt => {
                        opt.addEventListener('click', () => {
                            try {
                                const v = opt.dataset.value;
                                if (v !== undefined) {
                                    marcaFilterSelect.value = v;
                                    marcaFilterSelect.dispatchEvent(new Event('input', { bubbles: true }));
                                    marcaFilterSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                    debounceFilterSoldMotorcycles();

                                    // Atualizar visual do custom select
                                    const trigger = customForMarca.querySelector('.custom-select-trigger');
                                    if (trigger) trigger.textContent = opt.textContent;
                                    customForMarca.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                                    opt.classList.add('selected');
                                    customForMarca.classList.remove('open');
                                }
                            } catch(e) {}
                        });
                    });
                }
            } catch (e) { console.warn('Erro ao bindar custom options de marca:', e); }
        }

        // Atualizar e bind dos controles de mês e busca (podem existir no template)
        try {
            const monthFilterSelect = modal ? modal.querySelector('#monthFilter') : document.getElementById('monthFilter');
            if (monthFilterSelect) {
                monthFilterSelect.addEventListener('change', function(e) { console.log('DEBUG: monthFilter change ->', monthFilterSelect.value); debounceFilterSoldMotorcycles(); });
                try { updateCustomSelectForElement(monthFilterSelect); } catch (e) {}
                try {
                    const customForMonth = monthFilterSelect.previousElementSibling;
                    if (customForMonth && customForMonth.classList.contains('custom-select')) {
                        customForMonth.querySelectorAll('.custom-option').forEach(opt => {
                            opt.addEventListener('click', () => {
                                try {
                                    const v = opt.dataset.value;
                                    if (v !== undefined) {
                                        monthFilterSelect.value = v;
                                        monthFilterSelect.dispatchEvent(new Event('input', { bubbles: true }));
                                        monthFilterSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                        debounceFilterSoldMotorcycles();

                                        const trigger = customForMonth.querySelector('.custom-select-trigger');
                                        if (trigger) trigger.textContent = opt.textContent;
                                        customForMonth.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                                        opt.classList.add('selected');
                                        customForMonth.classList.remove('open');
                                    }
                                } catch(e) {}
                            });
                        });
                    }
                } catch (e) { console.warn('Erro ao bindar custom options de mês:', e); }
                // Restaurar seleção anterior, se houver
                if (selectedMonthFilter && selectedMonthFilter !== 'all') {
                    monthFilterSelect.value = selectedMonthFilter;
                }
            }

            const soldSearchInputEl = modal ? modal.querySelector('#soldSearchInput') : document.getElementById('soldSearchInput');
            const soldSearchButtonEl = modal ? modal.querySelector('#soldSearchButton') : document.getElementById('soldSearchButton');
            if (soldSearchInputEl) {
                soldSearchInputEl.addEventListener('keydown', function(ev) {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        console.log('DEBUG: soldSearchInput Enter ->', soldSearchInputEl.value);
                        debounceFilterSoldMotorcycles();
                    }
                });
            }
            if (soldSearchButtonEl) {
                soldSearchButtonEl.addEventListener('click', function() {
                    console.log('DEBUG: soldSearchButton clicked ->', soldSearchInputEl && soldSearchInputEl.value);
                    debounceFilterSoldMotorcycles();
                });
            }
        } catch (e) {
            console.warn('Erro ao adicionar listeners dos filtros de vendas:', e);
        }

        // Delegação: capturar clicks nas opções custom dentro do modal (diagnóstico + fallback)
        try {
            const soldModal = document.getElementById('soldMotorcyclesModal');
            if (soldModal) {
                soldModal.addEventListener('click', function(ev) {
                    const opt = ev.target.closest && ev.target.closest('.custom-option');
                    if (!opt) return;
                    console.log('DEBUG: custom-option clicked ->', opt.dataset.value, opt.textContent);
                    try {
                        const wrapper = opt.closest('.custom-select');
                        if (!wrapper) return;
                        const selectEl = wrapper.nextElementSibling && wrapper.nextElementSibling.tagName === 'SELECT' ? wrapper.nextElementSibling : null;
                        if (selectEl) {
                            selectEl.value = opt.dataset.value;
                            selectEl.dispatchEvent(new Event('input', { bubbles: true }));
                            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        // ensure filter runs
                        debounceFilterSoldMotorcycles();
                    } catch (e) { console.warn('DEBUG: erro no delegado custom-option:', e); }
                });

                // Delegated handlers: search button click and Enter key on input (no auto-pause)
                try {
                    soldModal.addEventListener('click', function(ev) {
                        try {
                            const btn = ev.target.closest && ev.target.closest('#soldSearchButton');
                            if (btn) {
                                const input = soldModal.querySelector('#soldSearchInput');
                                console.log('DEBUG: delegated soldSearchButton click ->', input && input.value);
                                debounceFilterSoldMotorcycles();
                                return;
                            }
                        } catch(e) { console.warn('Erro no delegado click do modal:', e); }
                    });

                    soldModal.addEventListener('keydown', function(ev) {
                        try {
                            const t = ev.target;
                            if (t && t.id === 'soldSearchInput' && ev.key === 'Enter') {
                                ev.preventDefault();
                                console.log('DEBUG: delegated soldSearchInput Enter ->', t.value);
                                debounceFilterSoldMotorcycles();
                            }
                        } catch (e) { console.warn('Erro no delegado keydown do modal:', e); }
                    });
                } catch (e) { console.warn('Erro ao adicionar delegados de input/keydown no soldModal:', e); }
            }
        } catch (e) { console.warn('DEBUG: erro ao adicionar delegação de clicks custom-option:', e); }
        
        // Mostrar modal imediatamente com skeleton
        modal.style.display = 'flex';
        if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';

        // Create a persistent top container inside `.modal-body` so the stats and
        // filters are part of the scrollable region (under the title) and are
        // re-inserted if a re-render replaces nodes inside the body.
        try {
            const modalBodyEl = modal.querySelector('.modal-body');
            const modalContentEl = modal.querySelector('.modal-content');
            const host = modalBodyEl || modalContentEl || modal;
            if (host) {
                let persistentTop = host.querySelector('#soldPersistentTop');
                if (!persistentTop) {
                    persistentTop = document.createElement('div');
                    persistentTop.id = 'soldPersistentTop';
                    // place it so it scrolls with modalBody (below header/title)
                    persistentTop.style.cssText = 'padding:6px 12px;margin:0 0 12px 0;display:block;width:100%;box-sizing:border-box;z-index:1001;';
                    // insert as first child of modalBody if available
                    if (modalBodyEl) modalBodyEl.insertBefore(persistentTop, modalBodyEl.firstChild);
                    else if (modalContentEl) modalContentEl.insertBefore(persistentTop, modalContentEl.firstChild);
                    else modal.insertBefore(persistentTop, modal.firstChild);
                }

                const ensureStats = () => {
                    if (!persistentTop.querySelector('.sales-stats-grid') && typeof totalVendas !== 'undefined') {
                        const s = document.createElement('div');
                        s.className = 'sales-stats-grid';
                        s.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 0 0 8px 0; width:100%;';
                        s.style.setProperty('opacity', '1', 'important');
                        s.innerHTML = `
                            <div class="macdavis-stat-card"><div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div><div class="card-body"><div class="card-value">${totalVendas}</div><div class="card-label">Total vendido</div></div></div>
                            <div class="macdavis-stat-card"><div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div><div class="card-body"><div class="card-value">${vendasEsteMes}</div><div class="card-label">Vendas este mês</div></div></div>
                            <div class="macdavis-stat-card"><div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div><div class="card-body"><div class="card-value">${mediaVendasPorMes}</div><div class="card-label">Média / mês</div></div></div>
                            <div class="macdavis-stat-card"><div class="card-accent" style="background: linear-gradient(90deg, #ff6600, #ff8533);"></div><div class="card-body"><div class="card-value">${mesesComVendas}</div><div class="card-label">Meses com vendas</div></div></div>
                        `;
                        persistentTop.appendChild(s);
                    }
                };

                const ensureFilters = () => {
                    if (!persistentTop.querySelector('.filter-controls-wrapper')) {
                        const f = document.createElement('div');
                        f.className = 'filter-controls-wrapper';
                        f.style.cssText = 'display:flex;gap:10px;align-items:center;padding:8px 6px;margin:0 0 12px 0;border-radius:8px;background:rgba(255,102,0,0.04);flex-wrap:wrap;';
                        f.style.setProperty('opacity', '1', 'important');
                        f.innerHTML = `
                            <div style="display:flex;gap:10px;align-items:center;width:100%;">
                                <select id="soldMarcaFilter" class="filter-select" style="min-width:160px;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.12);background:white;color:#222"><option value="all">Todas as marcas</option></select>
                                <select id="monthFilter" class="filter-select" style="min-width:160px;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.12);background:white;color:#222"><option value="all">Todos os meses (${totalVendas})</option></select>
                                <div style="display:flex;gap:8px;flex:1;min-width:220px;">
                                    <input id="soldSearchInput" placeholder="Buscar por marca, modelo..." style="flex:1;min-width:0;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.08);" />
                                    <button id="soldSearchButton" style="padding:10px 14px;border-radius:8px;background:#ff6600;color:#fff;border:none;cursor:pointer;">Buscar</button>
                                </div>
                            </div>
                        `;
                        persistentTop.appendChild(f);
                    }
                };

                // Ensure now
                ensureStats();
                ensureFilters();

                // Move any existing nodes from modal into persistentTop to avoid duplicates
                ['.sales-stats-grid', '.filter-controls-wrapper', '.sales-top-wrapper'].forEach(sel => {
                    try {
                        const found = modal.querySelector(sel);
                        if (found && found.parentElement !== persistentTop) {
                            persistentTop.appendChild(found);
                            found.style.setProperty('display', 'block', 'important');
                            found.style.setProperty('opacity', '1', 'important');
                            found.style.setProperty('position', 'static', 'important');
                        }
                    } catch (e) {}
                });

                // Observe modalBody for accidental removals and re-create if needed
                const observeTarget = modalBodyEl || modalContentEl || modal;
                if (observeTarget && !observeTarget._soldPersistentObserver) {
                    const mo = new MutationObserver(mutations => {
                        try {
                            ensureStats();
                            ensureFilters();
                        } catch (e) {}
                    });
                    mo.observe(observeTarget, { childList: true, subtree: true });
                    observeTarget._soldPersistentObserver = mo;
                }

                // Re-populate filters now that persistentTop (and its selects) exist
                try {
                    if (typeof populateSoldFilters === 'function') {
                        populateSoldFilters(soldMotos, mesesDisponiveis, motosPorMes, totalVendas);
                    }
                } catch (e) { console.warn('Erro ao repopular filtros após criar persistentTop:', e); }
            }
        } catch (e) { console.warn('Erro ao criar persistentTop:', e); }

        // Garantir que o modal tenha área de scroll interna e recalcular sticky dos filtros
        try {
            const modalContentEl = modal.querySelector('.modal-content');
            const modalBodyEl = modal.querySelector('.modal-body');
            const filterEl = modal.querySelector('.filter-controls-wrapper');

            if (modalContentEl) {
                modalContentEl.style.maxHeight = 'calc(100vh - 60px)';
                modalContentEl.style.overflow = 'hidden';
            }

            if (modalBodyEl) {
                // Reserve espaço for header + small gap
                modalBodyEl.style.maxHeight = 'calc(100vh - 160px)';
                modalBodyEl.style.overflowY = 'auto';
                modalBodyEl.style.webkitOverflowScrolling = 'touch';
                // Add small right padding so vertical scrollbar doesn't overlap content
                modalBodyEl.style.paddingRight = '12px';
            }

            if (filterEl && modalBodyEl) {
                try {
                    const headerEl = modal.querySelector('.sales-panel-header');
                    const headerRect = headerEl ? headerEl.getBoundingClientRect() : { bottom: 0 };
                    const modalBodyRect = modalBodyEl.getBoundingClientRect();
                    const statsExisting = modalBodyEl.querySelector('.sales-stats-grid');
                    const statsHeight = statsExisting ? Math.ceil(statsExisting.getBoundingClientRect().height) : 0;
                    const topOffset = Math.max(8, Math.ceil(headerRect.bottom - modalBodyRect.top + statsHeight + 8));
                    // Avoid applying `position: sticky` here to prevent conflicts with the
                    // JS fallback that toggles `position: fixed` on scroll. The scroll-listener
                    // already handles positioning; we only store the computed offset for
                    // diagnostics or future adjustments.
                    filterEl.dataset.topOffset = topOffset;
                    // Ensure z-index is moderate (kept if already set by earlier logic)
                    if (!filterEl.style.zIndex) filterEl.style.zIndex = '1002';
                } catch (e) { console.warn('Erro ao calcular topOffset dos filtros:', e); }
            }
        } catch (e) { console.warn('Erro ao forçar scroll interno do modal:', e); }
        
        // Renderizar conteúdo e remover skeleton
        // NOTE: previously we hid the skeleton very quickly (100ms) which could
        // leave an empty modal if the heavy render wasn't finished yet. Instead
        // insert a lightweight placeholder immediately and only remove the
        // skeleton after the real content is rendered below.
        try {
            const contentEl = document.getElementById('soldMotorcyclesContent');
            if (contentEl && (!contentEl.children || contentEl.children.length === 0)) {
                // lightweight visible placeholder so user doesn't see a blank area
                contentEl.innerHTML = '<div id="soldPanelSkeleton" style="padding:40px 20px;text-align:center;color:var(--admin-muted,#999);">Carregando vendas…</div>';
            }
        } catch (e) { /* ignore */ }
        
        // ⏳ Garantir que o loading dure PELO MENOS 2.5s desde o início
        const elapsedTime = Date.now() - loadingStartTime;
        const minimumLoadingTime = 2500; // 2.5 segundos
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
            console.log(`⏳ Aguardando ${remainingTime}ms para completar 2.5s de loading...`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Aguardar mais um pouco para garantir que os cards estão renderizados
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 300);
                });
            });
        });
        
        // ✅ Agora sim esconder o loading
        await hideAdminLoading();
        
        // Inicializar filtros e paginação
        setTimeout(() => {
            // Inicializar paginação
            currentSoldPage = 1;
            filteredSoldMotos = [];
            
            // Aplicar filtros iniciais (mostrar tudo)
            filterSoldMotorcycles();
            
            // Restaurar posição de scroll se existir (somente se veio do modal)
            if (savedScrollPosition > 0 && __savedScrollSource === 'modal') {
                const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
                if (modalContent) {
                    try { modalContent.scrollTop = savedScrollPosition; } catch(e) {}
                    console.log('📍 Posição de scroll restaurada (modal):', savedScrollPosition);
                    clearSavedScrollPosition(); // Limpar após usar
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro ao carregar motos vendidas:', error);
        await hideAdminLoading();
        showMessage('❌ Erro ao carregar motos vendidas', 'error');
    }
}

// Fechar modal de motos vendidas
function closeSoldMotorcyclesModal() {
    const modal = document.getElementById('soldMotorcyclesModal');
    modal.style.display = 'none';
    if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = 'auto';
}

// Função para renderizar a página atual de vendas
function renderSoldPage() {
    const content = document.getElementById('soldMotorcyclesContent');
    if (!content) return;
    
    const startIndex = (currentSoldPage - 1) * soldItemsPerPage;
    const endIndex = startIndex + soldItemsPerPage;
    const pageMotos = filteredSoldMotos.slice(startIndex, endIndex);
    
    // Agrupar motos da página por mês
    const motosPorMes = {};
    pageMotos.forEach(moto => {
        const date = moto.saleDate ? new Date(moto.saleDate) : new Date(moto.soldAt);
        const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        if (!motosPorMes[mesAno]) {
            motosPorMes[mesAno] = [];
        }
        motosPorMes[mesAno].push(moto);
    });
    
    // Gerar HTML das vendas da página
    let html = '';
    
    if (pageMotos.length === 0) {
        html = '<div style="text-align: center; padding: 3rem; color: #666;">Nenhuma venda encontrada com os filtros aplicados</div>';
    } else {
        Object.keys(motosPorMes).forEach(mesAno => {
            const motosDoMes = motosPorMes[mesAno];
            const capitalizado = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
            
            html += `
                <div class="month-section" data-month="${mesAno}" style="margin: 0 20px 35px 20px;">
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
                const saleDate = moto.saleDate ? new Date(moto.saleDate).toLocaleDateString('pt-BR') : 'N/A';
                const buyerName = moto.buyerName || 'Não informado';
                const saleNotes = moto.saleNotes || '';
                
                html += `
                    <div data-marca="${moto.marca || ''}" class="sold-card-modern">
                        <div class="sold-card-image">
                            <img src="${moto.image || moto.thumb || '/images/placeholder.jpg'}" 
                                 alt="${moto.nome || moto.name}" loading="lazy">
                            <div class="sold-badge">VENDIDA</div>
                        </div>
                        
                        <div class="sold-card-header">
                            <h4>${moto.marca || ''} ${moto.modelo || moto.name || ''}</h4>
                            <span class="sold-card-plate">${moto.placa || '---'}</span>
                        </div>
                        
                        <div class="sold-card-specs">
                            <div class="spec-item">
                                <span class="spec-value">${moto.ano || '---'}</span>
                                <span class="spec-label">ANO</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${moto.cilindradas || moto.cc || '---'}<small>cc</small></span>
                                <span class="spec-label">CILINDRADA</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${moto.cor || '---'}</span>
                                <span class="spec-label">COR</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-value">${formatarNumero(moto.quilometragem || moto.mileage || 0)}</span>
                                <span class="spec-label">KM</span>
                            </div>
                        </div>
                        
                        <div class="sold-card-sale-info">
                            <div class="sale-info-row">
                                <span class="info-label">Data</span>
                                <span class="info-value">${saleDate}</span>
                            </div>
                            <div class="sale-info-row">
                                <span class="info-label">Comprador</span>
                                <span class="info-value">${buyerName}</span>
                            </div>
                            ${moto.renavam ? `
                            <div class="sale-info-row">
                                <span class="info-label">RENAVAM</span>
                                <span class="info-value">${moto.renavam}</span>
                            </div>
                            ` : ''}
                            ${moto.chassi ? `
                            <div class="sale-info-row">
                                <span class="info-label">Chassi</span>
                                <span class="info-value chassi-text">${moto.chassi}</span>
                            </div>
                            ` : ''}
                            ${moto.paymentMethod ? `
                            <div class="sale-info-row">
                                <span class="info-label">Pagamento</span>
                                <span class="info-value">${moto.paymentMethod}${moto.paymentDetails ? ' - ' + moto.paymentDetails : ''}</span>
                            </div>
                            ` : ''}
                            ${saleNotes ? `
                            <div class="sale-info-row sale-notes">
                                <span class="info-label">Obs</span>
                                <span class="info-value">${saleNotes}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="sold-card-actions">
                            ${moto.documentoPDF ? `
                            <button onclick="abrirCRLV(this.getAttribute('data-pdf-path'), '${moto.id}')" 
                                    data-pdf-path="${(moto.documentoPDF || '').replace(/^["']|["']$/g, '').trim().replace(/"/g, '&quot;')}" 
                                    class="action-btn btn-purple">
                                📄 CRLV
                            </button>
                            ` : ''}
                            ${moto.contratoPath ? `
                            <button onclick="abrirContrato(this.getAttribute('data-pdf-path'), '${moto.id}')" 
                                    data-pdf-path="${(moto.contratoPath || '').replace(/^["']|["']$/g, '').trim().replace(/"/g, '&quot;')}" 
                                    class="action-btn btn-cyan">
                                📜 Contrato
                            </button>
                            ` : ''}
                            <button onclick="editSoldMoto('${moto.id}')" class="action-btn btn-orange">
                                ✏️ Editar
                            </button>
                            <button onclick="revertSale('${moto.id}')" class="action-btn btn-blue">
                                🔄 Retornar
                            </button>
                            <button onclick="deleteSoldMoto('${moto.id}')" class="action-btn btn-red">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
    }
    
    // Adicionar controles de paginação
    if (totalSoldPages > 1) {
        html += `
            <div class="pagination-controls" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px; padding: 15px; background: rgba(255, 102, 0, 0.1); border-radius: 12px;">
                <button onclick="changeSoldPage(${currentSoldPage - 1})" 
                        ${currentSoldPage <= 1 ? 'disabled' : ''} 
                        class="btn-secondary" style="padding: 8px 16px;">
                    ⬅️ Anterior
                </button>
                
                <span style="color: #ff6600; font-weight: 600;">
                    Página ${currentSoldPage} de ${totalSoldPages} 
                    <small style="color: #666;">(${filteredSoldMotos.length} vendas)</small>
                </span>
                
                <button onclick="changeSoldPage(${currentSoldPage + 1})" 
                        ${currentSoldPage >= totalSoldPages ? 'disabled' : ''} 
                        class="btn-secondary" style="padding: 8px 16px;">
                    Próxima ➡️
                </button>
            </div>
        `;
    }
    
    // Atualizar apenas o conteúdo das vendas, mantendo os filtros
    const existingContent = content.innerHTML;
    const filterEndIndex = existingContent.indexOf('<div class="month-section"') !== -1 ? 
                          existingContent.indexOf('<div class="month-section"') : 
                          existingContent.length;
    const filterHtml = existingContent.substring(0, filterEndIndex);
    
    content.innerHTML = filterHtml + html;
}

// Função para mudar página
function changeSoldPage(page) {
    if (page < 1 || page > totalSoldPages) return;
    
    currentSoldPage = page;
    renderSoldPage();
    
    // Scroll para o topo das vendas
    const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
    if (modalContent) {
        // After moving filters outside modal body they may live in modal-content; scroll to first month-section
        const firstMonth = modalContent.querySelector('.month-section');
        if (firstMonth) {
            modalContent.scrollTo({ top: firstMonth.offsetTop - 10, behavior: 'smooth' });
        } else {
            modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Função para filtrar motos vendidas por mês
let currentSoldPage = 1;
let soldItemsPerPage = 20;
let totalSoldPages = 1;
let filteredSoldMotos = [];

// Função debounced para filtro de vendas (evita execuções excessivas)
let debounceTimeout;
function debounceFilterSoldMotorcycles() {
    try { console.log('⏱️ debounceFilterSoldMotorcycles called at', new Date().toISOString()); } catch(e){}
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        try { console.log('⏱️ debounce executing filterSoldMotorcycles'); } catch(e){}
        filterSoldMotorcycles();
    }, 300); // 300ms de delay
}

function filterSoldMotorcycles() {
    // Defensive guards: elements may not exist yet during async render
    const soldModal = document.getElementById('soldMotorcyclesModal');
    const monthEl = soldModal ? soldModal.querySelector('#monthFilter') : document.getElementById('monthFilter');
    const marcaEl = soldModal ? soldModal.querySelector('#soldMarcaFilter') : document.getElementById('soldMarcaFilter');
    const searchEl = soldModal ? soldModal.querySelector('#soldSearchInput') : document.getElementById('soldSearchInput');

    // Prefer the option's displayed text when the value contains counts or differs from the label.
    const rawMonthValue = monthEl ? (monthEl.value || '') : '';
    const rawMonthText = monthEl ? ((monthEl.selectedOptions && monthEl.selectedOptions[0] && monthEl.selectedOptions[0].textContent) || '') : '';
    let selectedMonth;
    if (rawMonthValue && rawMonthValue !== 'all') {
        selectedMonth = rawMonthValue;
    } else if (!rawMonthValue) {
        // value missing (custom-select didn't set a value) -> fall back to displayed text
        selectedMonth = rawMonthText || 'all';
    } else {
        // explicit 'all' selected - but sometimes the custom-select shows a different label
        // if the visible text does NOT say 'todos'/'todas', prefer the visible text
        const txt = (rawMonthText || '').toLowerCase();
        if (txt && !txt.includes('todo') && !txt.includes('todos') && !txt.includes('todas')) {
            selectedMonth = rawMonthText;
        } else {
            selectedMonth = 'all';
        }
    }

    const rawMarcaValue = marcaEl ? (marcaEl.value || '') : '';
    const rawMarcaText = marcaEl ? ((marcaEl.selectedOptions && marcaEl.selectedOptions[0] && marcaEl.selectedOptions[0].textContent) || '') : '';
    let selectedMarca;
    if (rawMarcaValue && rawMarcaValue !== 'all') {
        selectedMarca = rawMarcaValue;
    } else if (!rawMarcaValue) {
        // fallback to displayed option text only when the native value is not available
        selectedMarca = rawMarcaText || 'all';
    } else {
        // value is explicit 'all' but visible text may show a brand (custom-select overlay)
        const txtM = (rawMarcaText || '').toLowerCase();
        if (txtM && !txtM.includes('todas') && !txtM.includes('todas as') && !txtM.includes('todas as marcas')) {
            selectedMarca = rawMarcaText;
        } else {
            selectedMarca = 'all';
        }
    }

    const searchText = searchEl ? (searchEl.value || '') : '';

    // DEBUG: log values to help diagnose why filters may not run
    try {
        console.groupCollapsed('🔎 filterSoldMotorcycles debug');
        console.log('selectedMonth (raw):', selectedMonth, 'rawMonthValue:', rawMonthValue, 'rawMonthText:', rawMonthText);
        console.log('selectedMarca (raw):', selectedMarca, 'rawMarcaValue:', rawMarcaValue, 'rawMarcaText:', rawMarcaText);
        console.log('searchText (raw):', searchText);
        const monthOptions = monthEl ? Array.from(monthEl.options).map(o => o.textContent) : [];
        const marcaOptions = marcaEl ? Array.from(marcaEl.options).map(o => o.textContent) : [];
        console.log('month options:', monthOptions.slice(0,10));
        console.log('marca options sample:', marcaOptions.slice(0,10));
        const sourceListPreview = (Array.isArray(allMotos) && allMotos.length>0) ? allMotos.slice(0,6) : (window._soldMotosCache ? window._soldMotosCache.slice(0,6) : []);
        console.log('sourceList preview (first 6):', sourceListPreview);
        console.groupEnd();
    } catch (e) { console.warn('DEBUG logging failed', e); }

    // Inicializar dropdowns customizados se necessário (apenas uma vez)
    const monthFilter = monthEl;
    const marcaFilter = marcaEl;
    const isMobile = window.innerWidth <= 768;
    // Only initialize a custom dropdown if select exists and has options already
    if (!isMobile && monthFilter && monthFilter.options && monthFilter.options.length > 0 && !monthFilter.previousElementSibling?.classList.contains('custom-select')) {
        if (typeof createCustomSelect === 'function') {
            try { createCustomSelect(monthFilter); console.log('✅ Dropdown customizado criado para filtro de mês (vendas)'); } catch(e) { console.warn('createCustomSelect erro:', e); }
        } else {
            console.log('ℹ️ createCustomSelect não definido — usando select nativo para monthFilter');
        }
    }

    if (!isMobile && marcaFilter && marcaFilter.options && marcaFilter.options.length > 0 && !marcaFilter.previousElementSibling?.classList.contains('custom-select')) {
        if (typeof createCustomSelect === 'function') {
            try { createCustomSelect(marcaFilter); console.log('✅ Dropdown customizado criado para filtro de marca (vendas)'); } catch(e) { console.warn('createCustomSelect erro:', e); }
        } else {
            console.log('ℹ️ createCustomSelect não definido — usando select nativo para soldMarcaFilter');
        }
    }

    // Armazenar seleção atual
    selectedMonthFilter = selectedMonth;

    // Helper: normalizar strings para comparação (remove acentos, lower-case, trim)
    function normalize(str) {
        if (!str && str !== 0) return '';
        try {
            return String(str).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
        } catch (e) {
            return String(str).toLowerCase().replace(/[\u0300-\u036f]/g, '').trim();
        }
    }

    // Se o selectedMonth veio com contador (ex: "dezembro de 2025 (4)"), remover a parte entre parênteses
    const cleanSelectedMonth = (selectedMonth || 'all').replace(/\s*\([^\)]*\)\s*$/, '').trim();

    // Limpar marca selecionada (remover contadores em parênteses quando presentes)
    const cleanSelectedMarca = (selectedMarca && selectedMarca !== 'all') ? String(selectedMarca).replace(/\s*\([^\)]*\)\s*$/, '').trim() : 'all';

    // Filtrar motos baseado nos critérios
    // Preferir o cache de motos vendidas quando disponível (modal de vendas).
    const sourceList = (window._soldMotosCache && Array.isArray(window._soldMotosCache) && window._soldMotosCache.length > 0)
        ? window._soldMotosCache
        : (Array.isArray(allMotos) && allMotos.length > 0 ? allMotos : []);

    try { console.log(`🔎 sourceList length: ${sourceList.length} (using ${window._soldMotosCache && window._soldMotosCache.length>0 ? '_soldMotosCache' : 'allMotos/empty'})`); } catch(e){}

    // DEBUG: compute intermediate sets to diagnose ordering/precedence issues
    try {
        const onlySold = sourceList.filter(m => String(m.status).toLowerCase() === 'vendido');
        const monthOnly = cleanSelectedMonth && cleanSelectedMonth !== 'all' ? onlySold.filter(m => {
            const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
            const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            return normalize(mesAno) === normalize(cleanSelectedMonth);
        }) : onlySold.slice();

        const marcaOnly = (cleanSelectedMarca && cleanSelectedMarca !== 'all') ? onlySold.filter(m => normalize(m.marca) === normalize(cleanSelectedMarca)) : onlySold.slice();

        const monthThenMarca = monthOnly.filter(m => (cleanSelectedMarca && cleanSelectedMarca !== 'all') ? (normalize(m.marca) === normalize(cleanSelectedMarca)) : true);

        console.groupCollapsed('🔎 filterSoldMotorcycles intermediate sets');
        console.log('onlySold count:', onlySold.length);
        console.log('monthOnly count (after applying month):', monthOnly.length, 'cleanSelectedMonth:', cleanSelectedMonth);
        console.log('marcaOnly count (after applying marca):', marcaOnly.length, 'cleanSelectedMarca:', cleanSelectedMarca);
        console.log('monthThenMarca count (month ∩ marca):', monthThenMarca.length);
        // Show top brands present in monthOnly
        const brandsInMonth = Array.from(new Set(monthOnly.map(m => (m.marca||'').trim()))).slice(0,10);
        console.log('brands present in selected month (sample):', brandsInMonth);
        console.groupEnd();
    } catch (e) { console.warn('DEBUG intermediate sets failed', e); }

    // If a month is selected, restrict the marca filter options to brands present in that month
    try {
        if (cleanSelectedMonth && cleanSelectedMonth !== 'all') {
            // compute monthOnly locally (same logic as diagnostics above)
            const monthOnlyLocal = cleanSelectedMonth && cleanSelectedMonth !== 'all' ? sourceList.filter(m => {
                try {
                    const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
                    const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return normalize(mesAno) === normalize(cleanSelectedMonth);
                } catch (e) { return false; }
            }) : sourceList.slice();

            const marcaCounts = {};
            (monthOnlyLocal || []).forEach(m => {
                const mk = (m.marca || '').trim();
                if (!mk) return;
                marcaCounts[mk] = (marcaCounts[mk] || 0) + 1;
            });

            const marcaElems = Array.from(document.querySelectorAll('#soldMarcaFilter'));
            marcaElems.forEach(marcaSelect => {
                try {
                    const prevVal = marcaSelect.value;
                    // repopulate options
                    marcaSelect.innerHTML = '';
                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = 'all';
                    defaultOpt.textContent = `Todas as Marcas (${Object.values(marcaCounts).reduce((a,b)=>a+b,0)})`;
                    marcaSelect.appendChild(defaultOpt);
                    Object.keys(marcaCounts).sort().forEach(mk => {
                        const o = document.createElement('option'); o.value = mk; o.textContent = `${mk} (${marcaCounts[mk]})`; marcaSelect.appendChild(o);
                    });
                    try { updateCustomSelectForElement(marcaSelect); } catch(e) {}
                    // restore prev value when still available, else default to 'all'
                    try {
                        const optExists = Array.from(marcaSelect.options).some(o => o.value === prevVal || o.textContent === prevVal);
                        marcaSelect.value = optExists ? prevVal : 'all';
                    } catch(e) { marcaSelect.value = 'all'; }
                    // do NOT dispatch change to avoid recursive handlers — filter will run from month change
                } catch(e) { console.warn('Erro ao restringir marcas por mês:', e); }
            });
        }
    } catch (e) { console.warn('Erro ao atualizar filtro de marcas baseado no mês selecionado', e); }
    filteredSoldMotos = sourceList.filter(moto => {
        // ensure only sold entries are considered
        if (String(moto.status).toLowerCase() !== 'vendido') return false;

        // Filtro de mês (comparação normalizada)
        if (cleanSelectedMonth && cleanSelectedMonth !== 'all') {
            const date = moto.saleDate ? new Date(moto.saleDate) : new Date(moto.soldAt);
            const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            if (normalize(mesAno) !== normalize(cleanSelectedMonth)) return false;
        }

        // Filtro de marca (case-insensitive, normalizado)
        if (selectedMarca && selectedMarca !== 'all') {
            // Some select options include counts in the label (e.g. "Honda (4)").
            const cleanSelectedMarca = String(selectedMarca).replace(/\s*\([^\)]*\)\s*$/, '').trim();
            if (normalize(moto.marca) !== normalize(cleanSelectedMarca)) return false;
        }

        // Filtro de busca (normalizado)
        if (searchText) {
            const searchableText = `${moto.marca || ''} ${moto.modelo || moto.name || ''} ${moto.placa || ''}`;
            if (!normalize(searchableText).includes(normalize(searchText))) return false;
        }

        return true;
    });

    // Ordenar por data (mais recente primeiro)
    filteredSoldMotos.sort((a, b) => {
        const dateA = a.saleDate ? new Date(a.saleDate) : new Date(a.soldAt || 0);
        const dateB = b.saleDate ? new Date(b.saleDate) : new Date(b.soldAt || 0);
        return dateB - dateA;
    });

    // Calcular total de páginas
    totalSoldPages = Math.ceil(filteredSoldMotos.length / soldItemsPerPage);
    currentSoldPage = 1; // Reset para primeira página

    // Renderizar página atual
    renderSoldPage();

    console.log(`🔍 [DEBUG] Filtrando vendas: ${filteredSoldMotos.length} resultados, ${totalSoldPages} páginas`);
}

// Expor funções para debugging/global handlers
try {
    window.filterSoldMotorcycles = filterSoldMotorcycles;
    window.debounceFilterSoldMotorcycles = debounceFilterSoldMotorcycles;
} catch(e) {}

// Função para reverter venda (retornar ao catálogo)
async function revertSale(motoId) {
    const _revertMsg = 'Deseja retornar esta motocicleta ao catálogo como DISPONÍVEL?\n\nOs dados da venda serão removidos.';
    const confirmed = window.Toast && Toast.confirm
        ? await Toast.confirm(
            _revertMsg,
            {
                title: 'Reverter Venda',
                confirmText: 'Reverter',
                cancelText: 'Cancelar',
                icon: '↩️'
            }
          )
        : await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_revertMsg) : Promise.resolve(confirm(_revertMsg)));
    
    if (!confirmed) {
        return;
    }
    
    try {
        console.log('🔄 [DEBUG] Revertendo venda da moto:', motoId);
        
        // Salvar posição de scroll atual
        const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
        if (modalContent) {
            setSavedScrollPosition(modalContent.scrollTop, 'modal');
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
    const _msg_delete_sold = '⚠️ ATENÇÃO!\n\nDeseja EXCLUIR PERMANENTEMENTE esta motocicleta?\n\nEsta ação não pode ser desfeita!';
    const _confirmed_delete_sold = await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_msg_delete_sold) : Promise.resolve(confirm(_msg_delete_sold)));
    if (!_confirmed_delete_sold) return;
    
    try {
        console.log('🗑️ [DEBUG] Excluindo moto vendida:', motoId);
        
        // Salvar posição de scroll atual
        const modalContent = document.querySelector('#soldMotorcyclesModal .modal-body');
        if (modalContent) {
            setSavedScrollPosition(modalContent.scrollTop, 'modal');
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
    const _msg_delete = 'Tem certeza que deseja excluir esta motocicleta?';
    const _confirmed_delete = await (window.askConfirm && typeof askConfirm === 'function' ? askConfirm(_msg_delete) : Promise.resolve(confirm(_msg_delete)));
    if (!_confirmed_delete) return;
    
    // Salvar posição do scroll antes de excluir (origem: page)
    setSavedScrollPosition(window.scrollY || window.pageYOffset, 'page');
    
    try {
        const response = await fetch(`/api/motorcycles/${motoId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            await loadMotos();
            showSuccess('Motocicleta excluída com sucesso!');
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
    
    // Verificar se o elemento existe antes de adicionar listeners
    if (!uploadArea) {
        console.log('⚠️ Upload area não encontrada - pulando configuração');
        return;
    }
    
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
    try {
        console.log('🔍 applyAllFilters iniciando...');
        
        if (!allMotos || allMotos.length === 0) {
            console.warn('⚠️ allMotos está vazio ou indefinido');
            return;
        }
        
        const searchInput = document.getElementById('searchInput');
        searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        const estiloFilter = document.getElementById('estiloFilter');
        const selectedEstilo = estiloFilter ? estiloFilter.value : '';
        
        const statusFilter = document.getElementById('statusFilter');
        activeFilter = statusFilter ? statusFilter.value : 'disponivel';
        
        const marcaFilter = document.getElementById('marcaFilter');
        const selectedMarca = marcaFilter ? marcaFilter.value : '';
        
        const cilindradaFilter = document.getElementById('cilindradaFilter');
        const selectedCilindrada = cilindradaFilter ? cilindradaFilter.value : '';
        
        console.log(`🔍 applyAllFilters - activeFilter: "${activeFilter}", searchTerm: "${searchTerm}"`);
        
        let filtered = [...allMotos];
    
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
    if (activeFilter && activeFilter !== '') {
        if (activeFilter === 'VAZIO') {
            // Catálogo vazio - não mostra nenhuma moto
            filtered = [];
        } else {
            filtered = filtered.filter(moto => moto.status === activeFilter);
        }
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
    
    currentMotos = filtered;
    console.log(`✅ Filtros aplicados → ${currentMotos.length} motos`);
    renderMotos(filtered);
    
    } catch (error) {
        console.error('❌ [ERROR] Erro em applyAllFilters:', error);
        if (window.Toast) {
            Toast.error('Erro ao aplicar filtros: ' + error.message, 3000);
        }
    }
}

// Preencher filtro de marcas dinamicamente
function populateMarcaFilter(motos) {
    console.log('🔧 populateMarcaFilter chamada com', motos.length, 'motos');
    
    const marcaFilter = document.getElementById('marcaFilter');
    if (!marcaFilter) {
        console.error('❌ Elemento marcaFilter NÃO ENCONTRADO!');
        return;
    }
    
    console.log('✅ Elemento marcaFilter encontrado:', marcaFilter);
    
    // Filtrar apenas motos disponíveis
    const motosDisponiveis = motos.filter(moto => moto.status === 'disponivel' || !moto.status);
    console.log('🏍️ Motos disponíveis:', motosDisponiveis.length);
    
    // Extrair marcas únicas das motos disponíveis
    const marcasComDuplicatas = motosDisponiveis.map(moto => moto.marca);
    console.log('📋 Todas as marcas (com duplicatas):', marcasComDuplicatas);
    
    const marcas = [...new Set(marcasComDuplicatas.filter(marca => marca))];
    marcas.sort();
    
    console.log('📋 Marcas únicas encontradas:', marcas);
    console.log('📊 Total de marcas únicas:', marcas.length);
    
    // Limpar opções existentes
    marcaFilter.innerHTML = '';
    
    // Adicionar opção padrão
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas as Marcas';
    marcaFilter.appendChild(defaultOption);
    console.log('✅ Opção padrão adicionada');
    
    // Adicionar opções de marcas
    marcas.forEach((marca, index) => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        marcaFilter.appendChild(option);
        console.log(`  ${index + 1}. ${marca} adicionada ao select`);
    });
    
    console.log('✅ TOTAL de opções no select:', marcaFilter.options.length);
    
    // ATUALIZAR O DROPDOWN CUSTOMIZADO
    updateCustomSelectForElement(marcaFilter);
    
    console.log('✅ Filtro de marcas COMPLETAMENTE populado!');
}

// Populate filters inside sold modal: marcas and meses with counts
function populateSoldFilters(soldMotos, mesesDisponiveis, motosPorMes, totalVendas) {
    try {
        const modal = document.getElementById('soldMotorcyclesModal');
        const container = modal || document;

        // Brands
        const marcaElems = Array.from(container.querySelectorAll('#soldMarcaFilter'));
        const marcas = [...new Set((soldMotos || []).map(m => m.marca).filter(Boolean))].sort();
        marcaElems.forEach(marcaSelect => {
            try {
                marcaSelect.innerHTML = '';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = 'all';
                defaultOpt.textContent = 'Todas as Marcas';
                marcaSelect.appendChild(defaultOpt);
                marcas.forEach(m => {
                    const o = document.createElement('option');
                    o.value = m; o.textContent = m; marcaSelect.appendChild(o);
                });
                try { updateCustomSelectForElement(marcaSelect); } catch(e) {}
                marcaSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } catch(e) { console.warn('Erro ao popular soldMarcaFilter:', e); }
        });

        // Months
        const monthElems = Array.from(container.querySelectorAll('#monthFilter'));
        const meses = Array.isArray(mesesDisponiveis) ? mesesDisponiveis : Object.keys(motosPorMes||{});
        monthElems.forEach(monthSelect => {
            try {
                monthSelect.innerHTML = '';
                const defaultOpt = document.createElement('option');
                defaultOpt.value = 'all';
                defaultOpt.textContent = `Todos os meses (${totalVendas||0})`;
                monthSelect.appendChild(defaultOpt);
                meses.forEach(mes => {
                    const count = (motosPorMes && motosPorMes[mes]) ? motosPorMes[mes].length : 0;
                    const o = document.createElement('option');
                    o.value = mes;
                    o.textContent = `${mes} (${count})`;
                    monthSelect.appendChild(o);
                });
                try { updateCustomSelectForElement(monthSelect); } catch(e) {}
                monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } catch(e) { console.warn('Erro ao popular monthFilter:', e); }
        });
        
        // --- Sync logic: when marca changes, restrict month options to months where that marca had sales
        function normalizeForCompare(s) {
            if (!s && s !== 0) return '';
            try { return String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim(); } catch(e) { return String(s).toLowerCase().replace(/[\u0300-\u036f]/g,'').trim(); }
        }

        function stripCountLabel(str) {
            if (!str && str !== 0) return '';
            return String(str).replace(/\s*\([^\)]*\)\s*$/, '').trim();
        }

        marcaElems.forEach(marcaSelect => {
            try {
                marcaSelect.addEventListener('change', function() {
                    try {
                        const rawVal = marcaSelect.value || '';
                        const rawText = (marcaSelect.selectedOptions && marcaSelect.selectedOptions[0] && marcaSelect.selectedOptions[0].textContent) || '';
                        let selectedMarca;
                        if (rawVal && rawVal !== 'all') {
                            selectedMarca = rawVal;
                        } else {
                            const visible = stripCountLabel(rawText).toLowerCase();
                            if (/^todas?\b|^todas?\s+as\s+marcas/i.test(visible) || visible === 'todas as marcas' || visible === 'todas') {
                                selectedMarca = 'all';
                            } else {
                                selectedMarca = stripCountLabel(rawText) || 'all';
                            }
                        }

                        // Compute months where this marca has sales
                        const monthCounts = {};
                        let brandTotal = 0;
                        (soldMotos || []).forEach(m => {
                            const marcaName = m.marca || '';
                            if (!marcaName) return;
                            const matched = (selectedMarca === 'all') || (normalizeForCompare(marcaName) === normalizeForCompare(selectedMarca));
                            if (!matched) return;
                            const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
                            const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                            monthCounts[mesAno] = (monthCounts[mesAno] || 0) + 1;
                            brandTotal++;
                        });

                        // Update month selects accordingly
                        monthElems.forEach(monthSelect => {
                            try {
                                const prevValue = monthSelect.value;
                                monthSelect.innerHTML = '';
                                const defaultOpt = document.createElement('option');
                                defaultOpt.value = 'all';
                                defaultOpt.textContent = `Todos os meses (${brandTotal})`;
                                monthSelect.appendChild(defaultOpt);
                                Object.keys(monthCounts).forEach(mes => {
                                    const o = document.createElement('option');
                                    o.value = mes;
                                    o.textContent = `${mes} (${monthCounts[mes]})`;
                                    monthSelect.appendChild(o);
                                });
                                // restore previous selection if still present (set before recreating visual)
                                try { monthSelect.value = prevValue; } catch(e) { monthSelect.value = 'all'; }
                                // Force recreate/update of custom-select visual
                                try {
                                    const prevCustom = Array.from(document.querySelectorAll('.custom-select')).find(cs => cs.nextElementSibling === monthSelect);
                                    if (prevCustom && prevCustom.classList && prevCustom.classList.contains('custom-select')) prevCustom.remove();
                                } catch(e) {}
                                try { if (typeof createCustomSelect === 'function') createCustomSelect(monthSelect); else updateCustomSelectForElement(monthSelect); } catch(e) { try { updateCustomSelectForElement(monthSelect); } catch(_) {} }
                                // do not force dispatch here — debounce will trigger filter from user action
                            } catch (e) { console.warn('Erro ao atualizar monthSelect por marca change:', e); }
                        });
                    } catch (e) { console.warn('marca change handler failed', e); }
                });
            } catch (e) { console.warn('Erro ao bindar change em marcaSelect:', e); }
        });

        // When month changes, restrict marcas to those present in that month
        monthElems.forEach(monthSelect => {
            try {
                monthSelect.addEventListener('change', function() {
                    try {
                        const rawVal = monthSelect.value || '';
                        const rawText = (monthSelect.selectedOptions && monthSelect.selectedOptions[0] && monthSelect.selectedOptions[0].textContent) || '';
                        let selectedMonth;
                        if (rawVal && rawVal !== 'all') {
                            selectedMonth = rawVal;
                        } else {
                            const visible = stripCountLabel(rawText).toLowerCase();
                            if (/^todos?\b|^todos?\s+os\s+meses/i.test(visible) || visible === 'todos os meses' || visible === 'todos') {
                                selectedMonth = 'all';
                            } else {
                                selectedMonth = stripCountLabel(rawText) || 'all';
                            }
                        }

                        const marcaCounts = {};
                        let monthTotal = 0;
                        (soldMotos || []).forEach(m => {
                            const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
                            const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                            const matched = (selectedMonth === 'all') || (normalizeForCompare(mesAno) === normalizeForCompare(selectedMonth));
                            if (!matched) return;
                            const marcaName = m.marca || '';
                            if (!marcaName) return;
                            marcaCounts[marcaName] = (marcaCounts[marcaName] || 0) + 1;
                            monthTotal++;
                        });

                        marcaElems.forEach(marcaSelect => {
                            try {
                                const prevVal = marcaSelect.value;
                                marcaSelect.innerHTML = '';
                                const defaultOpt = document.createElement('option');
                                defaultOpt.value = 'all';
                                defaultOpt.textContent = `Todas as Marcas (${monthTotal})`;
                                marcaSelect.appendChild(defaultOpt);
                                Object.keys(marcaCounts).sort().forEach(marca => {
                                    const o = document.createElement('option'); o.value = marca; o.textContent = marca; marcaSelect.appendChild(o);
                                });
                                // If user selected 'all' months, ensure marcas reset to 'all'
                                try {
                                    if (selectedMonth === 'all') {
                                        marcaSelect.value = 'all';
                                    } else {
                                        marcaSelect.value = prevVal;
                                    }
                                } catch(e) { try { marcaSelect.value = 'all'; } catch(_) {} }
                                try { updateCustomSelectForElement(marcaSelect); } catch(e) {}
                                marcaSelect.dispatchEvent(new Event('change', { bubbles: true }));
                            } catch(e) { console.warn('Erro ao atualizar marcaSelect por month change:', e); }
                        });
                    } catch(e) { console.warn('month change handler failed', e); }
                });
            } catch(e) { console.warn('Erro ao bindar monthSelect change:', e); }
        });
        // Ensure global sync binding so filters remain interlinked
        try { connectSoldFilterSync(soldMotos); } catch(e) { console.warn('connectSoldFilterSync failed', e); }
    } catch (e) { console.warn('populateSoldFilters erro:', e); }
}

// Ensure the sold modal filters are synchronized (brand <-> month)
function connectSoldFilterSync(soldMotos) {
    try {
        const modal = document.getElementById('soldMotorcyclesModal');
        if (!modal) return;
        if (modal.dataset.soldFiltersSynced === '1') return; // only bind once

        const getFirst = (selector) => {
            const el = modal.querySelector(selector);
            return el || document.querySelector(selector);
        };

        const marcaSelect = getFirst('#soldMarcaFilter');
        const monthSelect = getFirst('#monthFilter');
        if (!marcaSelect || !monthSelect) return;

        const normalize = (s) => {
            if (!s && s !== 0) return '';
            try { return String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim(); } catch(e) { return String(s).toLowerCase().replace(/[\u0300-\u036f]/g,'').trim(); }
        };

        const recomputeMonthsForMarca = (selectedMarca) => {
            const monthCounts = {};
            let brandTotal = 0;
            (soldMotos || []).forEach(m => {
                const marcaName = m.marca || '';
                if (!marcaName) return;
                const matched = (selectedMarca === 'all') || (normalize(marcaName) === normalize(selectedMarca));
                if (!matched) return;
                const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
                const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                monthCounts[mesAno] = (monthCounts[mesAno] || 0) + 1;
                brandTotal++;
            });
            return { monthCounts, brandTotal };
        };

        const recomputeMarcasForMonth = (selectedMonth) => {
            const marcaCounts = {};
            let monthTotal = 0;
            (soldMotos || []).forEach(m => {
                const date = m.saleDate ? new Date(m.saleDate) : new Date(m.soldAt);
                const mesAno = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                const matched = (selectedMonth === 'all') || (normalize(mesAno) === normalize(selectedMonth));
                if (!matched) return;
                const marcaName = m.marca || '';
                if (!marcaName) return;
                marcaCounts[marcaName] = (marcaCounts[marcaName] || 0) + 1;
                monthTotal++;
            });
            return { marcaCounts, monthTotal };
        };

        const updateMonthSelect = (selectedMarca) => {
            const { monthCounts, brandTotal } = recomputeMonthsForMarca(selectedMarca);
            const prev = monthSelect.value;
            // repopulate
            monthSelect.innerHTML = '';
            const d = document.createElement('option'); d.value = 'all'; d.textContent = `Todos os meses (${brandTotal})`; monthSelect.appendChild(d);
            Object.keys(monthCounts).forEach(m => {
                const o = document.createElement('option'); o.value = m; o.textContent = `${m} (${monthCounts[m]})`; monthSelect.appendChild(o);
            });
            // Force recreate visual custom-select to ensure UI matches underlying select
            try {
                const prevCustom = monthSelect.previousElementSibling;
                if (prevCustom && prevCustom.classList && prevCustom.classList.contains('custom-select')) {
                    try { prevCustom.remove(); } catch(e) {}
                }
                if (typeof createCustomSelect === 'function') {
                    try { createCustomSelect(monthSelect); }
                    catch(e) { try { updateCustomSelectForElement(monthSelect); } catch(_) {} }
                } else {
                    try { updateCustomSelectForElement(monthSelect); } catch(e) {}
                }
            } catch(e) { try { updateCustomSelectForElement(monthSelect); } catch(_) {} }
            try { monthSelect.value = prev; } catch(e) {}
            monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const updateMarcaSelect = (selectedMonth) => {
            const { marcaCounts, monthTotal } = recomputeMarcasForMonth(selectedMonth);
            const prev = marcaSelect.value;
            marcaSelect.innerHTML = '';
            const d = document.createElement('option'); d.value = 'all'; d.textContent = `Todas as Marcas (${monthTotal})`; marcaSelect.appendChild(d);
            Object.keys(marcaCounts).sort().forEach(mk => {
                const o = document.createElement('option'); o.value = mk; o.textContent = mk; marcaSelect.appendChild(o);
            });
            // Force recreate visual custom-select
            try {
                const prevCustom = marcaSelect.previousElementSibling;
                if (prevCustom && prevCustom.classList && prevCustom.classList.contains('custom-select')) {
                    try { prevCustom.remove(); } catch(e) {}
                }
                if (typeof createCustomSelect === 'function') {
                    try { createCustomSelect(marcaSelect); }
                    catch(e) { try { updateCustomSelectForElement(marcaSelect); } catch(_) {} }
                } else {
                    try { updateCustomSelectForElement(marcaSelect); } catch(e) {}
                }
            } catch(e) { try { updateCustomSelectForElement(marcaSelect); } catch(_) {} }
            try { marcaSelect.value = prev; } catch(e) {}
            marcaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        };

        marcaSelect.addEventListener('change', function() {
            try {
                const rawVal = marcaSelect.value || '';
                const rawText = (marcaSelect.selectedOptions && marcaSelect.selectedOptions[0] && marcaSelect.selectedOptions[0].textContent) || '';
                const selectedMarca = (rawVal && rawVal !== 'all') ? rawVal : (rawText || 'all');
                updateMonthSelect(selectedMarca);
                debounceFilterSoldMotorcycles();
            } catch (e) { console.warn('marca change sync failed', e); }
        });

        monthSelect.addEventListener('change', function() {
            try {
                const rawVal = monthSelect.value || '';
                const rawText = (monthSelect.selectedOptions && monthSelect.selectedOptions[0] && monthSelect.selectedOptions[0].textContent) || '';
                const selectedMonth = (rawVal && rawVal !== 'all') ? rawVal : (rawText || 'all');
                updateMarcaSelect(selectedMonth);
                debounceFilterSoldMotorcycles();
            } catch (e) { console.warn('month change sync failed', e); }
        });

        modal.dataset.soldFiltersSynced = '1';
        console.log('✅ Sold filters synchronized (brand <-> month)');
    } catch (e) {
        console.warn('connectSoldFilterSync error', e);
    }
}



// Função para atualizar o dropdown customizado após mudança no select
function updateCustomSelectForElement(selectElement) {
    // Encontrar o dropdown customizado associado (ou criar se estiver ausente)
    // Algumas implementações podem inserir o elemento custom em posições diferentes,
    // portanto procuramos primeiro o previousElementSibling e, se não for válido,
    // buscamos qualquer `.custom-select` cujo `nextElementSibling` seja o select.
    let customSelect = selectElement.previousElementSibling;
    if (!customSelect || !customSelect.classList || !customSelect.classList.contains('custom-select')) {
        customSelect = Array.from(document.querySelectorAll('.custom-select')).find(cs => cs.nextElementSibling === selectElement) || null;
    }

    if (!customSelect || !customSelect.classList || !customSelect.classList.contains('custom-select')) {
        // Tentar criar o custom select se a função existir
        if (typeof createCustomSelect === 'function') {
            try {
                createCustomSelect(selectElement);
                customSelect = selectElement.previousElementSibling || Array.from(document.querySelectorAll('.custom-select')).find(cs => cs.nextElementSibling === selectElement) || null;
                console.log('ℹ️ custom-select criado automaticamente para atualização');
            } catch (e) {
                console.warn('⚠️ Falha ao criar custom-select automaticamente:', e);
            }
        }

        if (!customSelect || !customSelect.classList || !customSelect.classList.contains('custom-select')) {
            console.warn('⚠️ Custom select não encontrado para atualizar');
            return;
        }
    }
    
    console.log('🔄 Atualizando custom select...');
    
    // Encontrar o trigger e options container
    const trigger = customSelect.querySelector('.custom-select-trigger');
    const optionsContainer = customSelect.querySelector('.custom-select-options');
    
    if (!trigger || !optionsContainer) {
        console.error('❌ Trigger ou options container não encontrado');
        return;
    }
    
    // Limpar opções antigas
    optionsContainer.innerHTML = '';
    
    // Recriar opções baseado no select atualizado
    Array.from(selectElement.options).forEach((option, index) => {
        const customOption = document.createElement('div');
        customOption.className = 'custom-option';
        customOption.textContent = option.text;
        customOption.dataset.value = option.value;
        
        if (option.selected) {
            customOption.classList.add('selected');
            trigger.textContent = option.text;
        }
        
        // Click na opção
        customOption.addEventListener('click', () => {
            // Atualizar select original
            selectElement.selectedIndex = index;
            selectElement.dispatchEvent(new Event('change'));
            
            // Atualizar visual
            trigger.textContent = option.text;
            optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            customOption.classList.add('selected');
            
            // Fechar dropdown
            customSelect.classList.remove('open');
        });
        
        optionsContainer.appendChild(customOption);
    });
    // Ensure trigger shows the currently selected option (robust fallback)
    try {
        const selIndex = selectElement.selectedIndex >= 0 ? selectElement.selectedIndex : 0;
        const selOption = selectElement.options[selIndex];
        const triggerText = selOption ? selOption.text : (selectElement.options[0] ? selectElement.options[0].text : '');
        const allOptions = optionsContainer.querySelectorAll('.custom-option');
        allOptions.forEach((opt, i) => {
            opt.classList.toggle('selected', i === selIndex);
        });
        trigger.textContent = triggerText;
    } catch (e) {
        console.warn('Erro ao sincronizar trigger do custom-select:', e);
    }

    console.log('✅ Custom select atualizado com', selectElement.options.length, 'opções');
}

// Estatísticas
async function loadStats() {
    try {
        const totalElem = document.getElementById('totalMotos');
        if (totalElem) totalElem.textContent = allMotos.length;
        
        const disponiveis = allMotos.filter(m => m.status === 'disponivel' || !m.status).length;
        const disponiveisElem = document.getElementById('disponiveisCount');
        if (disponiveisElem) disponiveisElem.textContent = disponiveis;
        
        const vendidos = allMotos.filter(m => m.status === 'vendido').length;
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
}

// ----- Visual debugger para filtros de vendas (temporário) -----
function _showFilterDebugBadge(text) {
    try {
        let el = document.getElementById('_filter_debug_badge');
        if (!el) {
            el = document.createElement('div');
            el.id = '_filter_debug_badge';
            el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:999999;padding:10px 14px;background:rgba(0,0,0,0.75);color:#fff;border-radius:8px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;max-width:320px;';
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.style.opacity = '1';
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => { try { el.style.opacity = '0'; } catch(e){} }, 2200);
    } catch (e) { console.warn('_showFilterDebugBadge erro', e); }
}

function _attachSoldFilterVisualDebugger() {
    // Changes on selects
    ['soldMarcaFilter','monthFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                _showFilterDebugBadge(`${id}: ${this.value}`);
                try { debounceFilterSoldMotorcycles(); } catch(e){}
            });
        }
    });

    // Clicks on custom options inside sold modal
    document.addEventListener('click', function(ev) {
        try {
            const opt = ev.target.closest && ev.target.closest('.custom-option');
            if (!opt) return;
            // If option belongs to sold filters, show badge
            const wrapper = opt.closest('.filter-controls-wrapper') || opt.closest('.custom-select');
            if (wrapper) {
                _showFilterDebugBadge(`custom-option -> ${opt.dataset.value || opt.textContent}`);
                try { debounceFilterSoldMotorcycles(); } catch(e){}
            }
        } catch(e) {}
    }, true);
}

// Auto-attach when DOM está pronto
try {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(_attachSoldFilterVisualDebugger, 1200);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(_attachSoldFilterVisualDebugger, 1200));
    }
} catch (e) { console.warn('Erro ao anexar visual debugger dos filtros de vendas', e); }


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

function showMessage(message, type = 'info', duration = 5000) {
    // Usar o novo sistema Toast ao invés do antigo sistema de mensagens no topo
    if (window.Toast) {
        // Mapear tipos antigos para Toast
        const typeMap = {
            'success': 'success',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        
        const toastType = typeMap[type] || 'info';
        
        // Limpar HTML se necessário (Toast já formata)
        const cleanMessage = message.replace(/<[^>]*>/g, '');
        
        // Usar Toast moderno
        Toast[toastType](cleanMessage, duration);
    } else {
        // Fallback para sistema antigo caso Toast não esteja carregado
        console.warn('Toast não disponível, usando fallback');
        
        // Remove mensagens existentes
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // USAR TOAST AO INVÉS DE CRIAR DIV DE MENSAGEM!
        if (window.Toast) {
            switch(type) {
                case 'success':
                    Toast.success(message, duration);
                    break;
                case 'error':
                    Toast.error(message, duration);
                    break;
                case 'warning':
                    Toast.warning(message, duration);
                    break;
                case 'info':
                default:
                    Toast.info(message, duration);
                    break;
            }
        } else {
            // Fallback: criar mensagem antiga só se Toast NÃO existir
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = message;
            
            // Inserir no início do container
            const container = document.querySelector('.admin-container') || document.body;
            if (container.firstChild) {
                container.insertBefore(messageDiv, container.firstChild);
            } else {
                container.appendChild(messageDiv);
            }
            
            // Auto remover após duração especificada
            setTimeout(() => {
                messageDiv.remove();
            }, duration);
        }
    }
}

// Funções de loading antigas - não mais usadas
// SmartLoading controla o loading global da página
function showLoading() {
    // Removido - causava conflito com SmartLoading
}

function hideLoading() {
    // Removido - causava conflito com SmartLoading
}

async function logout() {
    const ok = (window.askConfirm && typeof askConfirm === 'function') ? await askConfirm('Tem certeza que deseja sair?') : confirm('Tem certeza que deseja sair?');
    if (ok) {
        localStorage.removeItem('userData');
        if (typeof SmartLoading !== 'undefined') {
            SmartLoading.navigateWithLoading('login.html');
        } else {
            window.location.href = 'login.html';
        }
    }
}

// Função para navegar para o catálogo/vitrine
function goToClient() {
    if (typeof SmartLoading !== 'undefined') {
        SmartLoading.navigateWithLoading('index.html');
    } else {
        window.location.href = 'index.html';
    }
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
        const soldModal = document.getElementById('soldMotorcyclesModal');
        const filterSelect = soldModal ? soldModal.querySelector('#monthFilter') : document.getElementById('monthFilter');
        if (filterSelect) {
            try { filterSelect.focus(); } catch(e) {}
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
    
    const moto = allMotos.find(m => m.id === id);
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
            pdfPath = `docs/${relativePath}`;
        } 
        // Se for caminho completo mas sem "DOCS Motos", extrair nome do arquivo
        else if (pdfPath.includes('\\') || pdfPath.includes('/')) {
            const fileName = pdfPath.split('\\').pop().split('/').pop();
            pdfPath = `docs/${fileName}`;
        } 
        // Se não tiver prefixo DOCS Motos/, adicionar
        else if (!pdfPath.startsWith('DOCS Motos/') && !pdfPath.startsWith('docs/')) {
            pdfPath = `docs/${pdfPath}`;
        }
        
        // Codificar espaços e caracteres especiais para URL
        pdfPath = encodeURI(pdfPath);
        
        console.log('📄 [DEBUG] Caminho processado do PDF:', pdfPath);
        
        // Armazenar caminho limpo
        const caminhoLimpo = moto.documentoPDF.replace(/^["']|["']$/g, '').trim();
        
        botaoPDF = `
            <button onclick="abrirCRLV(this.getAttribute('data-pdf-path'), '${moto.id}')" data-pdf-path="${caminhoLimpo.replace(/"/g, '&quot;')}" style="background: #9c27b0; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                📄 Ver CRLV
            </button>
        `;
    }
    
    // Botão de contrato se existir
    let botaoContrato = '';
    if (moto.contratoPath) {
        const contratoPathLimpo = moto.contratoPath.replace(/^["']|["']$/g, '').trim();
        
        botaoContrato = `
            <button onclick="abrirContrato(this.getAttribute('data-pdf-path'), '${moto.id}')" data-pdf-path="${contratoPathLimpo.replace(/"/g, '&quot;')}" style="background: #00bcd4; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                📜 Ver Contrato
            </button>
        `;
    }
    
    const botoesDocs = (botaoPDF || botaoContrato) ? `<div style="margin-top: 1rem; display: flex; gap: 10px; flex-wrap: wrap;">${botaoPDF}${botaoContrato}</div>` : '';
    
    viewContent.innerHTML = `
        <div class="view-modal-grid">
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
                <div class="details-grid">
                    <div><strong>Categoria:</strong> ${moto.category || 'Não informado'}</div>
                    <div><strong>Tipo:</strong> ${getCategoryName(moto.type || moto.tipo) || 'Não informado'}</div>
                    <div><strong>Marca:</strong> ${moto.marca || 'Não informado'}</div>
                    <div><strong>Ano:</strong> ${moto.year || 'Não informado'}</div>
                    <div><strong>Cilindrada:</strong> ${moto.engine_cc || moto.cc || moto.displacement || moto.cilindradas || 'Não informado'}cc</div>
                    <div><strong>Combustível:</strong> ${moto.fuel || 'Não informado'}</div>
                    ${moto.color || moto.cor ? `<div><strong>Cor:</strong> ${moto.color || moto.cor}</div>` : ''}
                    ${moto.mileage_display || moto.km || moto.mileage || moto.quilometragem ? `<div><strong>Quilometragem:</strong> ${moto.mileage_display || moto.km || formatarNumero(moto.mileage || moto.quilometragem || 0)} km</div>` : ''}
                    ${moto.placa ? `<div><strong>🏷️ Placa:</strong> ${moto.placa}</div>` : ''}
                    ${moto.renavam ? `<div><strong>📋 RENAVAM:</strong> ${moto.renavam}</div>` : ''}
                    ${moto.chassi ? `<div><strong>🔢 Chassi:</strong> ${moto.chassi}</div>` : ''}
                </div>
                ${moto.description || moto.desc || moto.descricao ? `<div style="margin-top: 1rem;"><strong>Descrição:</strong><br>${moto.description || moto.desc || moto.descricao}</div>` : ''}
                ${botoesDocs}
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
        if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
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
        if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = 'auto';
    }
    currentViewMoto = null;
    currentViewImageIndex = 0;
}

// Função para abrir o CRLV (PDF)
function abrirCRLV(caminhoCompleto, motoId) {
    console.log('📄 [CRLV] Tentando abrir CRLV:', { caminhoCompleto, motoId });
    
    if (!caminhoCompleto) {
        showMessage('❌ Caminho do CRLV não encontrado', 'error');
        return;
    }
    
    // Limpar aspas extras que podem vir do JSON
    caminhoCompleto = caminhoCompleto.replace(/^["']|["']$/g, '').trim();
    console.log('📄 [CRLV] Caminho limpo:', caminhoCompleto);
    
    // Usar o endereço atual do servidor (funciona tanto em localhost quanto via IP)
    const serverBase = `${window.location.protocol}//${window.location.host}`;
    let pdfUrl;
    
    // Se for um caminho completo do Windows (C:\...), extrair caminho relativo
    if (caminhoCompleto.match(/^[A-Za-z]:\\/)) {
        console.log('📄 [CRLV] Caminho absoluto detectado, convertendo para URL do servidor');
        
        // Extrair parte após "TCC - teste"
        if (caminhoCompleto.includes('TCC - teste')) {
            const parts = caminhoCompleto.split('TCC - teste');
            let relativePath = parts[parts.length - 1].replace(/^[\\\/]+/, '');
            
            // Converter barras invertidas para barras normais (URL)
            relativePath = relativePath.replace(/\\/g, '/');
            
            // URL do servidor
            pdfUrl = `${serverBase}/${encodeURI(relativePath)}`;
            console.log('📄 [CRLV] URL gerada:', pdfUrl);
        } else {
            // Tentar extrair só o nome do arquivo e assumir que está em DOCS Motos
            const fileName = caminhoCompleto.split('\\').pop();
            // server serves DOCS Motos at /docs
            pdfUrl = `${serverBase}/docs/${encodeURIComponent(fileName)}`;
            console.log('📄 [CRLV] URL gerada (fallback):', pdfUrl);
        }
    } 
    // Caminho relativo já está OK
    else {
        let pdfPath = caminhoCompleto;
        
        // Se tiver "DOCS Motos", converter para URL
            if (pdfPath.includes('DOCS Motos')) {
            pdfPath = pdfPath.replace(/\\/g, '/');
            pdfUrl = `${serverBase}/${encodeURI(pdfPath)}`;
        } else {
                // Se o usuário selecionou via file input, o helper formata como "documents/{filename}".
                // Nesse caso extraímos somente o nome do arquivo e apontamos para a pasta correta no servidor.
                if (pdfPath.startsWith('documents/') || pdfPath.startsWith('./documents/')) {
                    const fileName = pdfPath.split('/').pop();
                    pdfUrl = `${serverBase}/docs/${encodeURIComponent(fileName)}`;
                } else {
                    pdfUrl = `${serverBase}/docs/${encodeURIComponent(pdfPath)}`;
                }
        }
        
        console.log('📄 [CRLV] URL gerada (relativo):', pdfUrl);
    }
    
    // Abrir PDF em nova aba
    console.log('📄 [CRLV] Abrindo URL final:', pdfUrl);
    const resultado = window.open(pdfUrl, '_blank');
    
    if (!resultado) {
        showMessage(`📄 Navegador bloqueou a abertura automática.<br><br>URL: <small style="word-break: break-all;">${pdfUrl}</small><br><br>💡 Clique no botão novamente e permita pop-ups`, 'info', 10000);
    } else {
        showMessage('✅ Abrindo CRLV...', 'success');
    }
}

// Helpers: open hidden file selector and populate modal text fields with formatted path
function _formatSelectedFilePath(file, targetFieldId) {
    if (!file || !file.name) return '';
    const fileName = file.name;

    // Se o destino for um campo de contrato, retornar o caminho público servido pelo servidor
    if (targetFieldId && /contrato/i.test(targetFieldId)) {
        return `/docs/Contratos/${fileName}`;
    }

    // Se o destino for CRLV (documentoPDF), apontar para a rota pública /docs
    if (targetFieldId && /(documento|crlv)/i.test(targetFieldId)) {
        return `/docs/${fileName}`;
    }

    // Padrão legacy
    return `documents/${fileName}`;
}

function _handleFileSelection(fileInputId, targetFieldId) {
    const input = document.getElementById(fileInputId);
    if (!input) return;
    input.onchange = function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const formatted = _formatSelectedFilePath(file, targetFieldId);
        const target = document.getElementById(targetFieldId);
        if (target) target.value = formatted;
        // Reset value so the same file can be picked again if needed
        input.value = '';
    };
    input.click();
}

function selectCRLVFile() {
    _handleFileSelection('hiddenFileInputCRLV', 'documentoPDF');
}

function selectContratoFile() {
    _handleFileSelection('hiddenFileInputContrato', 'contratoPDF');
}

// Selecionar arquivo para o modal de edição de venda
function selectEditContratoFile() {
    _handleFileSelection('hiddenFileInputEditContrato', 'editContratoPDF');
}

// Função para abrir o Contrato (PDF)
function abrirContrato(caminhoCompleto, motoId) {
    console.log('📜 [CONTRATO] Tentando abrir Contrato:', { caminhoCompleto, motoId });
    
    if (!caminhoCompleto) {
        showMessage('❌ Caminho do Contrato não encontrado', 'error');
        return;
    }
    
    // Limpar aspas extras que podem vir do JSON
    caminhoCompleto = caminhoCompleto.replace(/^["']|["']$/g, '').trim();
    console.log('📜 [CONTRATO] Caminho limpo:', caminhoCompleto);
    
    // Primeiro: perguntar ao servidor se o caminho aponta para uma pasta com múltiplos PDFs
    const serverBase = `${window.location.protocol}//${window.location.host}`;
    const listUrl = `${serverBase}/api/list-contract-files?path=${encodeURIComponent(caminhoCompleto)}`;

    fetch(listUrl).then(r => r.json()).then(data => {
        if (data && data.success && Array.isArray(data.files) && data.files.length > 1) {
            // Mostrar modal com lista de PDFs
            showContractFilesModal(data.files, motoId);
            return;
        }

        if (data && data.success && Array.isArray(data.files) && data.files.length === 1) {
            // Abrir o único arquivo retornado
            const file = data.files[0];
            const resultado = window.open(file.url, '_blank');
            if (!resultado) {
                showMessage(`📜 Navegador bloqueou a abertura automática.<br><br>URL: <small style="word-break: break-all;">${file.url}</small><br><br>💡 Clique no botão novamente e permita pop-ups`, 'info', 10000);
            } else {
                showMessage('✅ Abrindo Contrato...', 'success');
            }
            return;
        }

        // Caso o servidor não retorne arquivos (ou erro), manter comportamento legado
        try {
            let pdfUrl;
            // Se for um caminho completo do Windows (C:\...), extrair caminho relativo
            if (caminhoCompleto.match(/^[A-Za-z]:\\/)) {
                if (caminhoCompleto.includes('TCC - teste')) {
                    const parts = caminhoCompleto.split('TCC - teste');
                    let relativePath = parts[parts.length - 1].replace(/^[\\\/]+/, '');
                    relativePath = relativePath.replace(/\\/g, '/');
                    pdfUrl = `${serverBase}/${encodeURI(relativePath)}`;
                } else {
                    const fileName = caminhoCompleto.split('\\').pop();
                    // server exposes DOCS Motos at /docs
                    pdfUrl = `${serverBase}/docs/Contratos/${encodeURIComponent(fileName)}`;
                }
            } else {
                let pdfPath = caminhoCompleto;
                if (pdfPath.includes('DOCS Motos')) {
                    // Extrair caminho relativo após 'DOCS Motos' e mapear para /docs
                    const rel = pdfPath.split('DOCS Motos')[1].replace(/^[\\\/]+/, '').replace(/\\/g, '/');
                    pdfUrl = `${serverBase}/docs/${encodeURI(rel)}`;
                } else {
                    // Tratar caminho gerado pelo file input: "documents/{filename}"
                    if (pdfPath.startsWith('documents/') || pdfPath.startsWith('./documents/')) {
                        const fileName = pdfPath.split('/').pop();
                        pdfUrl = `${serverBase}/docs/Contratos/${encodeURIComponent(fileName)}`;
                    } else {
                        pdfUrl = `${serverBase}/docs/Contratos/${encodeURIComponent(pdfPath)}`;
                    }
                }
            }

            console.log('📜 [CONTRATO] Abrindo URL final:', pdfUrl);
            const resultado = window.open(pdfUrl, '_blank');
            if (!resultado) {
                showMessage(`📜 Navegador bloqueou a abertura automática.<br><br>URL: <small style="word-break: break-all;">${pdfUrl}</small><br><br>💡 Clique no botão novamente e permita pop-ups`, 'info', 10000);
            } else {
                showMessage('✅ Abrindo Contrato...', 'success');
            }
        } catch (e) {
            console.error('❌ Erro abrindo contrato (fallback):', e);
            showMessage('❌ Não foi possível abrir o contrato', 'error');
        }
    }).catch(err => {
        console.error('❌ Erro ao consultar listagem de contratos:', err);
        showMessage('❌ Erro ao consultar arquivos do contrato', 'error');
    });
}

// Modal para exibir lista de arquivos de contrato
function showContractFilesModal(files, motoId) {
    // Remover modal antigo se existir
    const existing = document.getElementById('contractFilesModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'contractFilesModal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 99999;

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.borderRadius = '8px';
    box.style.padding = '18px';
    box.style.maxWidth = '760px';
    box.style.width = '90%';
    box.style.maxHeight = '80%';
    box.style.overflow = 'auto';

    const title = document.createElement('h3');
    title.textContent = '📜 Arquivos do Contrato';
    box.appendChild(title);

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '8px 0 16px 0';

    files.forEach(f => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid #eee';

        const name = document.createElement('span');
        name.textContent = f.name;
        name.style.flex = '1';
        li.appendChild(name);

        const openBtn = document.createElement('button');
        openBtn.textContent = 'Abrir';
        openBtn.className = 'btn-secondary';
        openBtn.onclick = () => window.open(f.url, '_blank');
        li.appendChild(openBtn);

        list.appendChild(li);
    });

    box.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.className = 'btn-primary';
    closeBtn.onclick = () => modal.remove();
    box.appendChild(closeBtn);

    modal.appendChild(box);
    document.body.appendChild(modal);
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
            setSavedScrollPosition(modalContent.scrollTop, 'modal');
            console.log('💾 Posição de scroll salva (modal):', savedScrollPosition);
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
        // Popular campo de contrato (se existir)
        try {
            const editContratoField = document.getElementById('editContratoPDF');
            if (editContratoField) editContratoField.value = moto.contratoPath || moto.contrato || '';
        } catch (e) { console.warn('Erro ao popular campo editContratoPDF:', e); }
        
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
        if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Erro ao abrir edição:', error);
        showMessage('❌ Erro ao carregar dados da venda', 'error');
    }
}

// Fechar modal de edição
function closeEditSoldMotoModal() {
    const modal = document.getElementById('editSoldMotoModal');
    modal.style.display = 'none';
    if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = 'auto';
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
                        // Salvar caminho do contrato se fornecido
                        contratoPath: (document.getElementById('editContratoPDF') && document.getElementById('editContratoPDF').value) ? document.getElementById('editContratoPDF').value : (moto?.contratoPath || moto?.contrato || ''),
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

// ===== MODAL DE BACKUPS (ESCOPO GLOBAL) =====
window.openBackupsModal = function() {
    console.log('🚀 openBackupsModal() chamada');
    const modal = document.getElementById('backupsModal');
    const iframe = document.getElementById('backupsIframe');
    console.log('Modal encontrado:', modal);
    console.log('Iframe encontrado:', iframe);
    
    if (modal && iframe) {
        console.log('Carregando admin-backups.html no iframe...');
        iframe.src = 'admin-backups.html';
        
        console.log('Adicionando classe active e display flex...');
        modal.classList.add('active');
        modal.style.display = 'flex';
        console.log('Modal classes:', Array.from(modal.classList));
        console.log('Modal display:', window.getComputedStyle(modal).display);
    } else {
        console.error('❌ Modal ou iframe de backups NÃO encontrado no DOM!');
    }
}

window.closeBackupsModal = function() {
    console.log('🔴 closeBackupsModal() chamada');
    const modal = document.getElementById('backupsModal');
    const iframe = document.getElementById('backupsIframe');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        // Limpar iframe ao fechar
        if (iframe) {
            iframe.src = '';
        }
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', function(event) {
    const modal = document.getElementById('backupsModal');
    if (event.target === modal) {
        window.closeBackupsModal();
    }
});

/* Auto-toggle admin filters fade when modal scrolls (safe, debounced, idempotent) */
(function(){
    if (window.__adminFiltersAutoToggleMounted) return;
    window.__adminFiltersAutoToggleMounted = true;

    function attachAutoToggle(modal){
        if(!modal) return;
        const body = modal.querySelector('.modal-body');
        if(!body) return;

        // All filters (inside modal and outside). We'll toggle modal-local and global filters.
        const modalLocalSelector = '#soldMotorcyclesModal .admin-filters';
        const globalFiltersSelector = '.admin-filters';

        let last = 0;
        const threshold = 60;

        const updateFilters = (scrollTop) => {
            // On small/mobile screens we avoid fading filters to keep controls visible
            try {
                if (typeof window !== 'undefined' && window.innerWidth && window.innerWidth <= 768) {
                    // Ensure filters are visible on mobile
                    const all = Array.from(document.querySelectorAll(globalFiltersSelector));
                    all.forEach(el => el.classList.remove('faded'));
                    return;
                }
            } catch (e) {
                // ignore and continue
            }

            const modalLocals = Array.from(document.querySelectorAll(modalLocalSelector));
            const globals = Array.from(document.querySelectorAll(globalFiltersSelector)).filter(el => !el.closest('#soldMotorcyclesModal'));

            const shouldFade = (scrollTop || 0) > threshold;

            modalLocals.forEach(el => {
                el.classList.toggle('faded', shouldFade);
            });
            globals.forEach(el => {
                el.classList.toggle('faded', shouldFade);
            });
        };

        // modal body scroll
        body.addEventListener('scroll', () => {
            const now = Date.now();
            if(now - last < 80) return; // throttle
            last = now;
            updateFilters(body.scrollTop || 0);
        }, { passive: true });

        // page/window scroll fallback (for filters outside modal)
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if(now - last < 120) return;
            last = now;
            // use pageYOffset as proxy
            updateFilters(window.pageYOffset || document.documentElement.scrollTop || 0);
        }, { passive: true });

        // run once to set initial state
        updateFilters(body.scrollTop || window.pageYOffset || 0);
    }

    // If modal exists now, attach
    const existing = document.querySelector('#soldMotorcyclesModal');
    if(existing) attachAutoToggle(existing);

    // Observe document for modal insertion (SPA friendly)
    const obs = new MutationObserver(muts => {
        for(const m of muts){
            for(const node of m.addedNodes){
                if(node && node.nodeType === 1){
                    if(node.id === 'soldMotorcyclesModal' || (node.querySelector && node.querySelector('#soldMotorcyclesModal'))){
                        const modal = node.id === 'soldMotorcyclesModal' ? node : node.querySelector('#soldMotorcyclesModal');
                        attachAutoToggle(modal);
                    }
                }
            }
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
})();

/* Relocator: remove qualquer .admin-filters que acabe dentro do modal de vendas */
(function(){
    if (window.__adminFiltersRelocatorMounted) return;
    window.__adminFiltersRelocatorMounted = true;

    function relocateMisplacedFilters(){
        const modal = document.querySelector('#soldMotorcyclesModal');
        if(!modal) return;

        const misplaced = modal.querySelectorAll('.admin-filters');
        if(!misplaced || misplaced.length === 0) return;

        misplaced.forEach(mf => {
            try {
                // Destination: prefer the first global .admin-filters outside the modal
                const primary = Array.from(document.querySelectorAll('.admin-filters')).find(el => !el.closest('#soldMotorcyclesModal')) || document.body;

                // Remove any local custom-select elements inside the misplaced container
                try {
                    const localCustoms = mf.querySelectorAll('.custom-select');
                    localCustoms.forEach(cs => cs.remove());
                } catch (e) { /* ignore */ }

                // move children safely to primary
                while (mf.firstChild) {
                    primary.appendChild(mf.firstChild);
                }

                // remove the now-empty misplaced container
                mf.remove();
                console.warn('⚠️ .admin-filters relocada do modal para:', primary);
            } catch (e) {
                console.error('Erro ao realocar .admin-filters:', e);
            }
        });
    }

    const obs = new MutationObserver((muts) => {
        muts.forEach(m => {
            // quick path: if added nodes include .admin-filters inside modal, relocate
            m.addedNodes.forEach(node => {
                if(node && node.nodeType === 1){
                    if(node.matches && node.matches('.admin-filters') && node.closest('#soldMotorcyclesModal')){
                        relocateMisplacedFilters();
                    } else if(node.querySelector && node.querySelector('.admin-filters')){
                        // if an added subtree contains filters
                        const found = node.querySelectorAll('.admin-filters');
                        for(const f of found){
                            if(f.closest && f.closest('#soldMotorcyclesModal')){
                                relocateMisplacedFilters();
                                break;
                            }
                        }
                    }
                }
            });
        });
    });

    obs.observe(document.body, { childList: true, subtree: true });

    // run once now in case something is already misplaced
    try{ relocateMisplacedFilters(); }catch(e){}
})();
