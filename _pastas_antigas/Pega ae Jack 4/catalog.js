// Catálogo Visual Interativo - MacDavis Motos

// Função para formatar números com separador de milhares
function formatarNumero(numero) {
    if (!numero) return '0';
    // Remove pontos se vier como string formatada
    const num = typeof numero === 'string' ? parseInt(numero.replace(/\./g, '')) : parseInt(numero);
    return num.toLocaleString('pt-BR');
}

let motorcycles = [];
let filteredMotorcycles = [];
let currentFilter = 'all';
let currentEstiloFilter = 'all';
let currentCilindradaFilter = 'all';

// Preload de imagens para transições suaves
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    checkUserLogin();
    
    // Carregar motocicletas
    await loadMotorcycles();
    
    // Configurar filtros
    setupFilters();
    
    // Configurar busca
    setupSearch();
    
    // Renderizar catálogo
    renderCatalog();
    
    // Configurar modal
    setupModal();
});

// Verificar login do usuário
function checkUserLogin() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        // Redirecionar para login se não estiver logado
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    document.getElementById('userName').textContent = user.nome || 'Visitante';
}

// Logout
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Carregar motocicletas da API
async function loadMotorcycles() {
    showLoading();
    
    try {
        const response = await fetch('/api/motorcycles');
        if (!response.ok) {
            throw new Error('Erro ao carregar motocicletas');
        }
        
        const todasMotos = await response.json();
        // Filtrar apenas motos disponíveis (não vendidas)
        motorcycles = todasMotos.filter(moto => moto.status !== 'vendido');
        filteredMotorcycles = [...motorcycles];
        
        // Atualizar contador
        document.getElementById('moto-count').textContent = motorcycles.length;
        
    } catch (error) {
        console.error('Erro:', error);
        // Fallback para localStorage se API falhar
        const stored = localStorage.getItem('motorcycles');
        if (stored) {
            const todasMotos = JSON.parse(stored);
            // Filtrar apenas motos disponíveis (não vendidas)
            motorcycles = todasMotos.filter(moto => moto.status !== 'vendido');
            filteredMotorcycles = [...motorcycles];
        }
    }
    
    hideLoading();
}

// Configurar filtros
function setupFilters() {
    // Filtros de estilo
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentEstiloFilter = btn.dataset.filter;
            applyAllFilters();
        });
    });
    
    // Filtros de cilindrada
    const filterBtnsCil = document.querySelectorAll('.filter-btn-cil');
    filterBtnsCil.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtnsCil.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCilindradaFilter = btn.dataset.filter;
            applyAllFilters();
        });
    });
}

// Aplicar todos os filtros combinados
function applyAllFilters() {
    let filtered = [...motorcycles];
    
    // Filtrar por estilo
    if (currentEstiloFilter && currentEstiloFilter !== 'all') {
        filtered = filtered.filter(moto => {
            const tipo = (moto.type || moto.tipo || '').toLowerCase();
            const categoria = (moto.categoria || '').toLowerCase();
            const modelo = (moto.modelo || moto.model || '').toLowerCase();
            const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
            
            if (currentEstiloFilter === 'scooter') {
                return tipo.includes('scooter') || categoria.includes('scooter') || modelo.includes('biz') || modelo.includes('elite');
            } else if (currentEstiloFilter === 'custom') {
                return tipo.includes('custom') || categoria.includes('custom') || modelo.includes('shadow') || modelo.includes('boulevard');
            } else if (currentEstiloFilter === 'trail') {
                return tipo.includes('trail') || categoria.includes('trail') || tipo.includes('enduro') || modelo.includes('xre') || modelo.includes('crosser');
            } else if (currentEstiloFilter === 'alta-cilindrada') {
                return cilindrada >= 500;
            } else if (currentEstiloFilter === 'street') {
                const isScooter = tipo.includes('scooter') || categoria.includes('scooter') || modelo.includes('biz') || modelo.includes('elite');
                const isCustom = tipo.includes('custom') || categoria.includes('custom');
                const isTrail = tipo.includes('trail') || tipo.includes('enduro');
                return cilindrada < 500 && !isScooter && !isCustom && !isTrail;
            }
            return true;
        });
    }
    
    // Filtrar por cilindrada
    if (currentCilindradaFilter && currentCilindradaFilter !== 'all') {
        if (currentCilindradaFilter.includes('-')) {
            const [min, max] = currentCilindradaFilter.split('-').map(n => parseInt(n));
            filtered = filtered.filter(moto => {
                const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                return cilindrada >= min && cilindrada <= max;
            });
        } else if (currentCilindradaFilter.includes('+')) {
            const min = parseInt(currentCilindradaFilter.replace('+', ''));
            filtered = filtered.filter(moto => {
                const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                return cilindrada >= min;
            });
        }
    }
    
    // Sempre excluir motos vendidas do resultado final
    filteredMotorcycles = filtered.filter(m => m.status !== 'vendido');
    renderCatalog();
}

// Aplicar filtro por cilindrada (legado - será substituído por applyAllFilters)
function applyFilter(filter) {
    currentFilter = filter;
    
    // Sempre excluir motos vendidas
    const disponíveis = motorcycles.filter(m => m.status !== 'vendido');
    
    if (filter === 'all') {
        filteredMotorcycles = [...disponíveis];
    } else {
        const displacement = parseInt(filter);
        filteredMotorcycles = disponíveis.filter(moto => {
            const motoDisplacement = moto.displacement || 0;
            
            if (filter === '200') {
                return motoDisplacement >= 200;
            } else {
                return motoDisplacement === displacement;
            }
        });
    }
    
    renderCatalog();
}

// Configurar busca
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    // Debounce para otimizar performance
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const term = e.target.value.toLowerCase().trim();
            
            if (term === '') {
                applyAllFilters();
            } else {
                // Aplicar busca sobre os filtros atuais
                let baseFiltered = [...motorcycles];
                
                // Aplicar filtros de estilo e cilindrada primeiro
                if (currentEstiloFilter && currentEstiloFilter !== 'all') {
                    baseFiltered = baseFiltered.filter(moto => {
                        const tipo = (moto.type || moto.tipo || '').toLowerCase();
                        const categoria = (moto.categoria || '').toLowerCase();
                    const modelo = (moto.modelo || moto.model || '').toLowerCase();
                    const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                    
                    if (currentEstiloFilter === 'scooter') {
                        return tipo.includes('scooter') || categoria.includes('scooter') || modelo.includes('biz') || modelo.includes('elite');
                    } else if (currentEstiloFilter === 'custom') {
                        return tipo.includes('custom') || categoria.includes('custom') || modelo.includes('shadow') || modelo.includes('boulevard');
                    } else if (currentEstiloFilter === 'trail') {
                        return tipo.includes('trail') || categoria.includes('trail') || tipo.includes('enduro') || modelo.includes('xre') || modelo.includes('crosser');
                    } else if (currentEstiloFilter === 'alta-cilindrada') {
                        return cilindrada >= 500;
                    } else if (currentEstiloFilter === 'street') {
                        const isScooter = tipo.includes('scooter') || categoria.includes('scooter') || modelo.includes('biz') || modelo.includes('elite');
                        const isCustom = tipo.includes('custom') || categoria.includes('custom');
                        const isTrail = tipo.includes('trail') || tipo.includes('enduro');
                        return cilindrada < 500 && !isScooter && !isCustom && !isTrail;
                    }
                    return true;
                });
            }
            
            if (currentCilindradaFilter && currentCilindradaFilter !== 'all') {
                if (currentCilindradaFilter.includes('-')) {
                    const [min, max] = currentCilindradaFilter.split('-').map(n => parseInt(n));
                    baseFiltered = baseFiltered.filter(moto => {
                        const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                        return cilindrada >= min && cilindrada <= max;
                    });
                } else if (currentCilindradaFilter.includes('+')) {
                    const min = parseInt(currentCilindradaFilter.replace('+', ''));
                    baseFiltered = baseFiltered.filter(moto => {
                        const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                        return cilindrada >= min;
                    });
                }
            }
            
            // Aplicar busca
            filteredMotorcycles = baseFiltered.filter(moto => {
                const nome = (moto.name || moto.nome || '').toLowerCase();
                const cor = (moto.color || moto.cor || '').toLowerCase();
                const ano = (moto.year || moto.ano || '').toString().toLowerCase();
                const desc = (moto.desc || '').toLowerCase();
                
                return nome.includes(term) ||
                       cor.includes(term) ||
                       ano.includes(term) ||
                       desc.includes(term);
            });
            renderCatalog();
        }
        }, 300); // 300ms de delay
    });
}

// Renderizar catálogo
function renderCatalog() {
    const grid = document.getElementById('galleryGrid');
    
    if (filteredMotorcycles.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 60px;">
                <h3>Nenhuma motocicleta encontrada</h3>
                <p>Tente ajustar os filtros ou o termo de busca.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar motos seguindo a lógica do admin
    const motosSorted = [...filteredMotorcycles].sort((a, b) => {
        // Função para determinar categoria
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
    
    // Renderizar motos ordenadas
    grid.innerHTML = motosSorted.map((moto, index) => {
        return `
            <div class="moto-card" data-moto-id="${moto.id}">
                <div class="moto-image">
                    ${moto.image ? 
                        `<img src="${moto.image}" alt="${moto.name || moto.nome}" loading="lazy" />` :
                        `<div class="no-image">📷 Sem Imagem</div>`
                    }
                    <div class="moto-badge">${moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A'}cc</div>
                </div>
                
                <div class="moto-info">
                    <h3 class="moto-title">${moto.marca ? moto.marca + ' ' : ''}${moto.name || moto.nome || 'Sem nome'}</h3>
                    
                    <div class="moto-details">
                        <div class="detail-row">
                            <span class="detail-label">Ano:</span>
                            <span class="detail-value">${moto.year || moto.ano || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Cor:</span>
                            <span class="detail-value">${moto.color || moto.cor || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">KM:</span>
                            <span class="detail-value">${formatarNumero(moto.mileage || moto.quilometragem || moto.km || 0)} km</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Cilindrada:</span>
                            <span class="detail-value">${moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A'}cc</span>
                        </div>
                    </div>
                    
                    <button class="view-btn" onclick="openMotoModal('${moto.id}')">
                        <span>👁️</span>
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Aplicar animações suaves apenas no hover
    const cards = grid.querySelectorAll('.moto-card');
    cards.forEach((card, index) => {
        // Pequeno delay para entrada suave
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 30);
    });
}

// Configurar modal
function setupModal() {
    const modal = document.getElementById('modalOverlay');
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Abrir modal da motocicleta
function openMotoModal(motoId) {
    const moto = motorcycles.find(m => m.id === motoId);
    if (!moto) return;
    
    // Preencher dados do modal
    document.getElementById('modalImage').src = moto.image || '';
    document.getElementById('modalTitle').textContent = (moto.marca ? moto.marca + ' ' : '') + (moto.name || moto.nome || 'Sem nome');
    document.getElementById('modalYear').textContent = moto.year || moto.ano || 'N/A';
    document.getElementById('modalColor').textContent = moto.color || moto.cor || 'N/A';
    document.getElementById('modalMileage').textContent = formatarNumero(moto.mileage || moto.quilometragem || moto.km || 0) + ' km';
    document.getElementById('modalDisplacement').textContent = (moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A') + 'cc';
    
    // Configurar botão de agendamento
    const scheduleBtn = document.getElementById('scheduleBtn');
    scheduleBtn.onclick = () => scheduleVisit(motoId);
    
    // Mostrar modal
    document.getElementById('modalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Fechar modal
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Agendar visita para motocicleta específica
function scheduleVisit(motoId) {
    const moto = motorcycles.find(m => m.id === motoId);
    
    if (moto) {
        // Salvar ID e dados completos da moto no localStorage
        localStorage.setItem('selectedMotoId', motoId);
        localStorage.setItem('selectedMotoData', JSON.stringify(moto));
        console.log('💾 Moto salva para agendamento:', moto.name);
    }
    
    // Redirecionar para página de agendamento
    window.location.href = 'agendamento.html';
}

// Loading functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// Efeitos visuais adicionais
document.addEventListener('mousemove', (e) => {
    const shapes = document.querySelectorAll('.floating-shape');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.3;
        const xPos = (x - 0.5) * speed * 15;
        const yPos = (y - 0.5) * speed * 15;
        
        shape.style.transform += ` translate(${xPos}px, ${yPos}px)`;
    });
});

// Contador animado para estatísticas
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (target - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}