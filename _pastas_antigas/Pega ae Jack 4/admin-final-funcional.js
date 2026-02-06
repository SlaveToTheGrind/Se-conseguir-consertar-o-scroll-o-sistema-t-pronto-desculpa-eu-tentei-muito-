// ===================================================
// PAINEL ADMIN - VERSÃO FINAL FUNCIONANDO
// ===================================================

console.log('🚀 ADMIN FINAL: Iniciando...');

// Variáveis globais
let currentMotos = [];
let editingMoto = null;

// ===== FUNÇÕES DE LOADING =====
function showAdminLoading(message = 'Processando') {
    const overlay = document.getElementById('adminLoadingOverlay');
    const text = document.getElementById('adminLoadingText');
    if (overlay && text) {
        text.innerHTML = `${message}<span class="loading-dots"><span></span><span></span><span></span></span>`;
        overlay.classList.add('show');
    }
}

function hideAdminLoading() {
    const overlay = document.getElementById('adminLoadingOverlay');
    if (overlay) {
        setTimeout(() => {
            overlay.classList.remove('show');
        }, 400);
    }
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', function() {
    console.log('✅ ADMIN FINAL: DOM carregado');
    
    // Criar usuário admin para testes
    localStorage.setItem('userData', JSON.stringify({
        tipo: 'admin', 
        nome: 'Admin', 
        loginTime: new Date().toISOString()
    }));
    
    inicializar();
});

async function inicializar() {
    try {
        console.log('🔧 ADMIN FINAL: Inicializando sistema...');
        
        // 1. Configurar eventos básicos
        configurarEventos();
        
        // 2. Carregar dados
        await carregarDados();
        
        console.log('✅ ADMIN FINAL: Sistema inicializado com sucesso!');
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro na inicialização:', erro);
        mostrarErro('Falha ao inicializar o painel administrativo');
    }
}

function configurarEventos() {
    console.log('🔗 ADMIN FINAL: Configurando eventos...');
    
    // Busca
    const busca = document.getElementById('searchMotos');
    if (busca) {
        busca.addEventListener('input', function() {
            realizarBusca(this.value);
        });
    }
    
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltro(this.dataset.categoria);
        });
    });
    
    // Formulário
    const form = document.getElementById('motoForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarMoto(e);
        });
    }
}

// ===== CARREGAMENTO DE DADOS =====
async function carregarDados() {
    console.log('📡 ADMIN FINAL: Carregando motocicletas...');
    
    try {
        mostrarCarregamento();
        
        const response = await fetch('/api/motorcycles');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const dados = await response.json();
        currentMotos = Array.isArray(dados) ? dados : [];
        
        console.log(`✅ ADMIN FINAL: ${currentMotos.length} motos carregadas`);
        
        renderizarMotos();
        atualizarEstatisticas();
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao carregar dados:', erro);
        mostrarErroCarregamento(erro.message);
    }
}

function mostrarCarregamento() {
    const grid = document.getElementById('motosGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: white;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                <h3>Carregando motocicletas...</h3>
            </div>
        `;
    }
}

function mostrarErroCarregamento(mensagem) {
    const grid = document.getElementById('motosGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #e74c3c;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3>Erro ao carregar dados</h3>
                <p>${mensagem}</p>
                <button onclick="location.reload()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 1rem;">
                    🔄 Recarregar Página
                </button>
            </div>
        `;
    }
}

// ===== RENDERIZAÇÃO =====
function renderizarMotos() {
    console.log('🎨 ADMIN FINAL: Renderizando motos...');
    
    const grid = document.getElementById('motosGrid');
    if (!grid) {
        console.error('❌ ADMIN FINAL: Grid não encontrado!');
        return;
    }
    
    if (currentMotos.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: white;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                <h3>Nenhuma motocicleta encontrada</h3>
                <button onclick="window.openAddMotoModal()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 1rem;">
                    ➕ Adicionar Primeira Moto
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    currentMotos.forEach(moto => {
        const nome = moto.name || moto.nome || 'Sem nome';
        const marca = moto.marca || 'N/A';
        const ano = moto.year || moto.ano || 'N/A';
        const cc = moto.displacement || moto.cilindradas || 0;
        const imagem = moto.image || moto.thumb || 'images/placeholder.svg';
        const desc = (moto.desc || moto.descricao || '').substring(0, 100);
        const km = moto.mileage_display || moto.km || '0';
        
        html += `
            <div class="moto-card" style="background: rgba(52, 73, 94, 0.8); border-radius: 8px; overflow: hidden; margin: 1rem;">
                <img src="${imagem}" alt="${nome}" style="width: 100%; height: 200px; object-fit: cover;" 
                     onerror="this.src='images/placeholder.svg'">
                
                <div style="padding: 1rem;">
                    <h3 style="color: white; margin: 0 0 0.5rem 0; font-size: 1.1rem;">${nome}</h3>
                    
                    <div style="color: #bdc3c7; font-size: 0.9rem; margin-bottom: 0.5rem;">
                        🏭 ${marca} • 📅 ${ano} • 🏍️ ${cc}cc • 📏 ${km}km
                    </div>
                    
                    ${desc ? `<p style="color: #ecf0f1; font-size: 0.8rem; margin: 0.5rem 0;">${desc}...</p>` : ''}
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                        <button onclick="window.editarMoto('${moto.id}')" 
                                style="background: #f39c12; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; flex: 1; min-width: 70px;">
                            ✏️ Editar
                        </button>
                        <button onclick="window.excluirMoto('${moto.id}')" 
                                style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; flex: 1; min-width: 70px;">
                            🗑️ Excluir
                        </button>
                        <button onclick="window.verMoto('${moto.id}')" 
                                style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; flex: 1; min-width: 70px;">
                            👁️ Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    console.log(`✅ ADMIN FINAL: ${currentMotos.length} motos renderizadas com botões inline`);
}

function atualizarEstatisticas() {
    const total = document.getElementById('totalMotos');
    if (total) {
        total.textContent = currentMotos.length;
    }
}

// ===== FUNÇÕES DOS BOTÕES =====
function editarMoto(id) {
    console.log(`✏️ ADMIN FINAL: Editando moto ${id}`);
    
    try {
        const moto = currentMotos.find(m => String(m.id) === String(id));
        if (!moto) {
            alert('❌ Motocicleta não encontrada!');
            return;
        }
        
        console.log('📝 ADMIN FINAL: Moto encontrada:', moto.name || moto.nome);
        
        editingMoto = moto;
        
        // Preencher formulário
        preencherFormulario(moto);
        
        // Configurar modal
        const title = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        
        if (title) title.textContent = 'Editar Motocicleta';
        if (submitBtn) submitBtn.textContent = 'Salvar Alterações';
        
        // Abrir modal
        abrirModal();
        
        console.log('✅ ADMIN FINAL: Modal de edição aberto');
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao editar:', erro);
        alert('❌ Erro ao abrir edição: ' + erro.message);
    }
}

function excluirMoto(id) {
    console.log(`🗑️ ADMIN FINAL: Excluindo moto ${id}`);
    
    try {
        const moto = currentMotos.find(m => String(m.id) === String(id));
        if (!moto) {
            alert('❌ Motocicleta não encontrada!');
            return;
        }
        
        const nome = moto.name || moto.nome || 'esta motocicleta';
        
        if (confirm(`🗑️ Tem certeza que deseja excluir "${nome}"?\n\nEsta ação não pode ser desfeita!`)) {
            showAdminLoading('Excluindo motocicleta');
            executarExclusao(id);
        }
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao excluir:', erro);
        hideAdminLoading();
        alert('❌ Erro ao excluir: ' + erro.message);
    }
}

function verMoto(id) {
    console.log(`👁️ ADMIN FINAL: Visualizando moto ${id}`);
    
    try {
        const moto = currentMotos.find(m => String(m.id) === String(id));
        if (!moto) {
            alert('❌ Motocicleta não encontrada!');
            return;
        }
        
        console.log('🔍 Moto encontrada:', moto);
        console.log('📄 documentoPDF:', moto.documentoPDF);
        
        // Criar botão PDF se existir documento
        let botaoPDF = '';
        if (moto.documentoPDF) {
            // Processar caminho do PDF
            let pdfPath = moto.documentoPDF;
            
            // Se contém "DOCS Motos", extrair tudo após essa pasta
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
            // Se não tiver prefixo docs/, adicionar
            else if (!pdfPath.startsWith('docs/')) {
                pdfPath = `docs/${pdfPath}`;
            }
            
            botaoPDF = `<button onclick="window.open('${pdfPath}', '_blank')" class="btn-pdf" style="background: #e74c3c; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 15px; display: inline-flex; align-items: center; gap: 8px;">
                📄 Ver CRLV (PDF)
            </button>`;
        }
        
        console.log('🔘 Botão PDF gerado:', botaoPDF ? 'SIM' : 'NÃO');
        
        const viewContent = document.getElementById('viewContent');
        if (viewContent) {
            viewContent.innerHTML = `
                <div style="color: white; line-height: 1.8;">
                    <h4 style="color: #ff6600; margin-bottom: 15px;">🏍️ ${moto.name || moto.nome || 'N/A'}</h4>
                    <p><strong>🏭 Marca:</strong> ${moto.marca || 'N/A'}</p>
                    <p><strong>📅 Ano:</strong> ${moto.year || moto.ano || 'N/A'}</p>
                    <p><strong>🔧 Cilindradas:</strong> ${moto.displacement || moto.cilindradas || 0}cc</p>
                    <p><strong>📏 Quilometragem:</strong> ${moto.mileage_display || moto.km || '0'} km</p>
                    <p><strong>🎨 Cor:</strong> ${moto.color || moto.cor || 'N/A'}</p>
                    <p><strong>🚦 Status:</strong> ${moto.status === 'vendido' ? '🔴 Vendido' : '🟢 Disponível'}</p>
                    ${moto.placa ? `<p><strong>🔖 Placa:</strong> ${moto.placa}</p>` : ''}
                    ${moto.renavam ? `<p><strong>📋 RENAVAM:</strong> ${moto.renavam}</p>` : ''}
                    ${moto.chassi ? `<p><strong>🔍 Chassi:</strong> ${moto.chassi}</p>` : ''}
                    <hr style="border-color: #444; margin: 15px 0;">
                    <p><strong>📋 Descrição:</strong></p>
                    <p style="color: #ccc;">${moto.desc || moto.descricao || 'Sem descrição disponível'}</p>
                    ${botaoPDF}
                </div>
            `;
            
            // Abrir modal
            const modal = document.getElementById('viewModal');
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao visualizar:', erro);
        alert('❌ Erro ao visualizar: ' + erro.message);
    }
}

// ===== MODAL =====
function openAddMotoModal() {
    console.log('➕ ADMIN FINAL: Adicionando nova moto');
    
    try {
        editingMoto = null;
        
        // Limpar formulário
        const form = document.getElementById('motoForm');
        if (form) form.reset();
        
        // Configurar modal
        const title = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        
        if (title) title.textContent = 'Adicionar Nova Motocicleta';
        if (submitBtn) submitBtn.textContent = 'Adicionar Motocicleta';
        
        abrirModal();
        
        console.log('✅ ADMIN FINAL: Modal de adição aberto');
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao abrir modal de adição:', erro);
        alert('❌ Erro ao abrir formulário: ' + erro.message);
    }
}

function closeMotoModal() {
    const modal = document.getElementById('motoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        editingMoto = null;
        console.log('✅ ADMIN FINAL: Modal fechado');
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('✅ ADMIN FINAL: Modal de visualização fechado');
    }
}

function abrirModal() {
    const modal = document.getElementById('motoModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        alert('❌ Modal não encontrado! Recarregue a página.');
    }
}

function preencherFormulario(moto) {
    const campos = {
        'modelo': moto.name || moto.nome || moto.modelo,
        'marca': moto.marca,
        'tipo': moto.type || moto.tipo || moto.categoria,
        'cilindradas': moto.displacement || moto.cilindradas,
        'ano': moto.year || moto.ano,
        'cor': moto.color || moto.cor,
        'placa': moto.placa,
        'quilometragem': moto.mileage || moto.quilometragem || moto.km,
        'renavam': moto.renavam,
        'chassi': moto.chassi,
        'combustivel': moto.combustivel || moto.fuel,
        'status': moto.status || 'disponivel',
        'descricao': moto.desc || moto.descricao,
        'imagem': moto.image || moto.imagem,
        'imagem2': moto.imagem2,
        'imagem3': moto.imagem3,
        'imagem4': moto.imagem4,
        'documentoPDF': moto.documentoPDF
    };
    
    for (const [id, valor] of Object.entries(campos)) {
        const campo = document.getElementById(id);
        if (campo && valor !== undefined && valor !== null) {
            campo.value = valor;
        }
    }
}

// ===== OPERAÇÕES DE DADOS =====
async function executarExclusao(id) {
    try {
        console.log(`🗑️ ADMIN FINAL: Executando exclusão de ${id}`);
        const loadingStart = Date.now();
        
        const response = await fetch(`/api/motorcycles/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Falha na exclusão');
        }
        
        // Garantir que o loading fique visível por pelo menos 500ms
        const loadingTime = Date.now() - loadingStart;
        if (loadingTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - loadingTime));
        }
        
        hideAdminLoading();
        alert('✅ Motocicleta excluída com sucesso!');
        await carregarDados(); // Recarregar lista
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro na exclusão:', erro);
        hideAdminLoading();
        alert('❌ Erro ao excluir: ' + erro.message);
    }
}

async function salvarMoto(evento) {
    try {
        console.log('💾 ADMIN FINAL: Salvando moto...');
        
        const formData = new FormData(evento.target);
        
        // Converter FormData para objeto
        const dados = {};
        for (let [key, value] of formData.entries()) {
            dados[key] = value;
        }
        
        console.log('📦 Dados a enviar:', dados);
        
        if (!dados.modelo && !dados.nome) {
            alert('❌ Nome/Modelo é obrigatório!');
            return;
        }
        
        showAdminLoading(editingMoto ? 'Atualizando motocicleta' : 'Adicionando motocicleta');
        const loadingStart = Date.now();
        
        const metodo = editingMoto ? 'PUT' : 'POST';
        const url = editingMoto ? `/api/motorcycles/${editingMoto.id}` : '/api/motorcycles';
        
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Falha ao salvar');
        }
        
        // Garantir que o loading fique visível por pelo menos 500ms
        const loadingTime = Date.now() - loadingStart;
        if (loadingTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - loadingTime));
        }
        
        hideAdminLoading();
        alert('✅ Motocicleta salva com sucesso!');
        closeMotoModal();
        await carregarDados(); // Recarregar lista
        
    } catch (erro) {
        console.error('❌ ADMIN FINAL: Erro ao salvar:', erro);
        hideAdminLoading();
        alert('❌ Erro ao salvar: ' + erro.message);
    }
}

// ===== BUSCA E FILTROS =====
function realizarBusca(termo) {
    if (!termo.trim()) {
        renderizarMotos();
        return;
    }
    
    const termoLower = termo.toLowerCase();
    const motosOriginais = [...currentMotos];
    
    currentMotos = motosOriginais.filter(moto => {
        const nome = (moto.name || moto.nome || '').toLowerCase();
        const marca = (moto.marca || '').toLowerCase();
        return nome.includes(termoLower) || marca.includes(termoLower);
    });
    
    renderizarMotos();
    
    // Restaurar lista original após um tempo
    setTimeout(() => {
        currentMotos = motosOriginais;
    }, 100);
}

function aplicarFiltro(categoria) {
    // Por enquanto apenas recarregar todas
    renderizarMotos();
}

// ===== NAVEGAÇÃO =====
function goToClient() {
    if (confirm('Deseja sair do painel administrativo?')) {
        window.location.href = 'catalog.html';
    }
}

function logout() {
    if (confirm('🚪 Deseja fazer logout e voltar à tela de login?')) {
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

// ===== UTILITÁRIOS =====
function mostrarErro(mensagem) {
    alert('❌ ' + mensagem);
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
// Isso é CRÍTICO para que o HTML funcione
window.editarMoto = editarMoto;
window.excluirMoto = excluirMoto;
window.verMoto = verMoto;
window.openAddMotoModal = openAddMotoModal;
window.closeMotoModal = closeMotoModal;
window.closeViewModal = closeViewModal;
window.goToClient = goToClient;
window.logout = logout;

console.log('✅ ADMIN FINAL: Script carregado completamente - TODAS AS FUNÇÕES EXPORTADAS');
console.log('✅ ADMIN FINAL: Funções disponíveis globalmente:', {
    editarMoto: typeof window.editarMoto,
    excluirMoto: typeof window.excluirMoto,
    verMoto: typeof window.verMoto,
    openAddMotoModal: typeof window.openAddMotoModal,
    closeMotoModal: typeof window.closeMotoModal,
    goToClient: typeof window.goToClient,
    logout: typeof window.logout
});

// ===== FIM DO SCRIPT =====