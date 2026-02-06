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

// Variáveis da galeria de fotos (ESCOPO GLOBAL)
let currentImageIndex = 0;
let currentMotoImages = [];

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
    
    // Inicializar sistema de notificações Toast
    setTimeout(() => {
        console.log('🔍 [CATALOG] Verificando Toast...', {
            toastExists: !!window.Toast,
            toastType: typeof window.Toast,
            notification: typeof Notification !== 'undefined' ? Notification.permission : 'não suportado'
        });
        
        if (window.Toast) {
            console.log('✅ Toast disponível no catálogo!');
            console.log('🔔 Permissão atual:', Toast.notificationPermission);
            
            // Saudação ao usuário
            const userData = localStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                Toast.success(`Bem-vindo, ${user.nome || 'Cliente'}! 🏍️`, 3000);
            }
            
            // Mostrar banner pedindo permissão se necessário (mas só após 5 segundos)
            if (Toast.notificationPermission === 'default') {
                setTimeout(() => {
                    console.log('🔔 Mostrando banner de permissão...');
                    Toast.showNotificationBanner();
                }, 5000);
            }
        } else {
            console.error('❌ Toast NÃO está disponível no catálogo!');
        }
    }, 1000);
    
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
    
    // Configurar header scroll (mobile)
    setupHeaderScroll();
});

// Controle do header no scroll (mobile)
function setupHeaderScroll() {
    const header = document.querySelector('.hero-header');
    
    if (!header) return;
    
    let isScrolled = false;
    let ticking = false;
    
    function updateHeader() {
        const scrollPos = window.pageYOffset;
        
        // Hysteresis: usa valores diferentes para subir e descer
        if (!isScrolled && scrollPos > 100) {
            header.classList.add('scrolled');
            isScrolled = true;
        } else if (isScrolled && scrollPos < 50) {
            header.classList.remove('scrolled');
            isScrolled = false;
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
}

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
        // Cache buster: adicionar timestamp na URL
        const cacheBuster = Date.now();
        const response = await fetch(`/api/motorcycles?_=${cacheBuster}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar motocicletas');
        }
        
        const todasMotos = await response.json();
        // Filtrar apenas motos disponíveis (não vendidas) E visíveis no catálogo
        motorcycles = todasMotos.filter(moto => 
            moto.status !== 'vendido' && 
            moto.showInCatalog !== false
        );
        filteredMotorcycles = [...motorcycles];
        
        // Atualizar contador
        document.getElementById('moto-count').textContent = motorcycles.length;
        
    } catch (error) {
        console.error('Erro:', error);
        
        // Notificar erro
        if (window.Toast) {
            Toast.warning('Usando dados em cache. Algumas informações podem estar desatualizadas.', 5000);
        }
        
        // Fallback para localStorage se API falhar
        const stored = localStorage.getItem('motorcycles');
        if (stored) {
            const todasMotos = JSON.parse(stored);
            // Filtrar apenas motos disponíveis (não vendidas) E visíveis no catálogo
            motorcycles = todasMotos.filter(moto => 
                moto.status !== 'vendido' && 
                moto.showInCatalog !== false
            );
            filteredMotorcycles = [...motorcycles];
        } else {
            if (window.Toast) {
                Toast.error('Erro ao carregar motocicletas. Por favor, recarregue a página.', 6000);
            }
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
                return tipo.includes('trail') || categoria.includes('trail') || tipo.includes('enduro') || modelo.includes('xre') || modelo.includes('crosser') || modelo.includes('nc');
            } else if (currentEstiloFilter === 'alta-cilindrada') {
                const isTrail = tipo.includes('trail') || categoria.includes('trail') || tipo.includes('enduro') || modelo.includes('xre') || modelo.includes('crosser') || modelo.includes('nc');
                return cilindrada >= 500 && !isTrail;
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
            const resultadoBusca = baseFiltered.filter(moto => {
                const nome = (moto.name || moto.nome || '').toLowerCase();
                const cor = (moto.color || moto.cor || '').toLowerCase();
                const ano = (moto.year || moto.ano || '').toString().toLowerCase();
                const desc = (moto.desc || '').toLowerCase();
                
                return nome.includes(term) ||
                       cor.includes(term) ||
                       ano.includes(term) ||
                       desc.includes(term);
            });
            
            // CRÍTICO: Sempre excluir motos vendidas do resultado final
            filteredMotorcycles = resultadoBusca.filter(m => m.status !== 'vendido');
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
                            <span class="detail-value">${getModelYear(moto) || 'N/A'}</span>
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

// ========================================
// SISTEMA DE GALERIA DE FOTOS DO MODAL
// ========================================

function updateModalImage() {
    console.log('🖼️ UPDATE MODAL IMAGE CHAMADO!');
    console.log('📍 Índice atual:', currentImageIndex);
    console.log('📍 Total de imagens:', currentMotoImages.length);
    
    const modalImage = document.getElementById('modalImage');
    const imageCounter = document.getElementById('imageCounter');
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    
    console.log('🔍 Elementos encontrados:', {
        modalImage: !!modalImage,
        imageCounter: !!imageCounter,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn
    });
    
    // Se não tem imagens
    if (currentMotoImages.length === 0) {
        console.log('❌ SEM FOTO - escondendo imagem completamente');
        modalImage.style.display = 'none';
        modalImage.removeAttribute('src');
        modalImage.src = '';
        if (imageCounter) imageCounter.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }
    
    // Tem imagens - carregar atual
    console.log('✅ COM FOTO - carregando imagem', currentImageIndex + 1, 'de', currentMotoImages.length);
    console.log('🔗 URL da imagem:', currentMotoImages[currentImageIndex]);
    const imageUrl = `${currentMotoImages[currentImageIndex]}?t=${Date.now()}`;
    
    // Primeiro esconder
    modalImage.style.display = 'none';
    modalImage.removeAttribute('src');
    
    // Depois carregar nova imagem
    modalImage.src = imageUrl;
    
    // Quando carregar, mostrar
    modalImage.onload = () => {
        modalImage.style.display = 'block';
    };
    
    // Se der erro, esconder
    modalImage.onerror = () => {
        console.error('❌ Erro ao carregar imagem');
        modalImage.style.display = 'none';
    };
    
    // Atualizar contador
    if (imageCounter) {
        if (currentMotoImages.length > 1) {
            imageCounter.textContent = `${currentImageIndex + 1} / ${currentMotoImages.length}`;
            imageCounter.style.display = 'block';
            console.log('✅ CONTADOR MOSTRADO:', imageCounter.textContent);
        } else {
            imageCounter.style.display = 'none';
            console.log('⚠️ CONTADOR ESCONDIDO (só 1 imagem)');
        }
    }
    
    // Atualizar botões
    if (prevBtn && nextBtn) {
        if (currentMotoImages.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            prevBtn.disabled = currentImageIndex === 0;
            nextBtn.disabled = currentImageIndex === currentMotoImages.length - 1;
            console.log('✅ BOTÕES MOSTRADOS!', {
                prevDisabled: prevBtn.disabled,
                nextDisabled: nextBtn.disabled
            });
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            console.log('⚠️ BOTÕES ESCONDIDOS (só 1 imagem)');
        }
    }
    console.log('='.repeat(50));
}

function prevImage() {
    console.log('◀️ PREV IMAGE CLICADO!');
    if (currentImageIndex > 0) {
        currentImageIndex--;
        console.log('✅ Indo para imagem', currentImageIndex);
        updateModalImage();
    } else {
        console.log('⚠️ Já está na primeira imagem');
    }
}

function nextImage() {
    console.log('▶️ NEXT IMAGE CLICADO!');
    if (currentImageIndex < currentMotoImages.length - 1) {
        currentImageIndex++;
        console.log('✅ Indo para imagem', currentImageIndex);
        updateModalImage();
    } else {
        console.log('⚠️ Já está na última imagem');
    }
}

function openMotoModal(motoId) {
    console.log('='.repeat(50));
    console.log('🔍 ABRINDO MODAL PARA MOTO:', motoId);
    const moto = motorcycles.find(m => m.id === motoId);
    
    if (!moto) {
        console.error('❌ MOTO NÃO ENCONTRADA!');
        return;
    }
    
    console.log('✅ MOTO ENCONTRADA:', moto.name || moto.nome);
    console.log('📋 Dados da moto:', {
        image: moto.image,
        imagem2: moto.imagem2,
        imagem3: moto.imagem3,
        imagem4: moto.imagem4,
        images: moto.images
    });
    
    // Coletar todas as imagens disponíveis
    currentMotoImages = [];
    currentImageIndex = 0;
    
    // Verificar array images (novo formato)
    if (moto.images && Array.isArray(moto.images) && moto.images.length > 0) {
        console.log('🔄 Usando array IMAGES (novo formato)');
        currentMotoImages = moto.images.filter(img => img && img.trim() !== '');
    } else {
        console.log('🔄 Usando campos individuais (formato antigo)');
        // Formato antigo (image, imagem2, etc)
        if (moto.image) currentMotoImages.push(moto.image);
        if (moto.imagem2) currentMotoImages.push(moto.imagem2);
        if (moto.imagem3) currentMotoImages.push(moto.imagem3);
        if (moto.imagem4) currentMotoImages.push(moto.imagem4);
    }
    
    console.log('📸 TOTAL DE IMAGENS COLETADAS:', currentMotoImages.length);
    console.log('📸 ARRAY DE IMAGENS:', currentMotoImages);
    
    // Preencher informações do modal
    document.getElementById('modalBrand').textContent = moto.brand || moto.marca || 'N/A';
    document.getElementById('modalModel').textContent = moto.model || moto.modelo || 'N/A';
    document.getElementById('modalYear').textContent = moto.year || moto.ano || 'N/A';
    document.getElementById('modalPlate').textContent = moto.plate || moto.placa || 'N/A';
    document.getElementById('modalChassi').textContent = moto.chassi || moto.chassis || 'N/A';
    document.getElementById('modalRenavam').textContent = moto.renavam || 'N/A';
    document.getElementById('modalPrice').textContent = `R$ ${formatarNumero(moto.price || moto.preco || 0)}`;
    document.getElementById('modalColor').textContent = moto.color || moto.cor || 'N/A';
    document.getElementById('modalMileage').textContent = formatarNumero(moto.mileage || moto.quilometragem || moto.km || 0) + ' km';
    document.getElementById('modalDisplacement').textContent = (moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A') + 'cc';
    
    // Atualizar imagem e controles da galeria
    updateModalImage();
    
    // Configurar botão de agendamento
    const scheduleBtn = document.getElementById('modalScheduleBtn');
    scheduleBtn.onclick = () => scheduleVisit(motoId);
    
    // Mostrar modal
    const modalOverlay = document.getElementById('modalOverlay');
    console.log('📦 Modal element:', modalOverlay);
    modalOverlay.classList.add('show');
    document.documentElement.classList.add('modal-open'); // HTML
    document.body.classList.add('modal-open'); // BODY - Empurra conteúdo
    // Removido overflow:hidden para permitir scroll e interação
    console.log('✅ Modal exibido!');
}

// Fechar modal
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.documentElement.classList.remove('modal-open'); // HTML
    document.body.classList.remove('modal-open'); // BODY - Restaura posição
}

// Agendar visita para motocicleta específica
function scheduleVisit(motoId) {
    const moto = motorcycles.find(m => m.id === motoId);
    
    if (moto) {
        // Salvar ID e dados completos da moto no localStorage
        localStorage.setItem('selectedMotoId', motoId);
        localStorage.setItem('selectedMotoData', JSON.stringify(moto));
        console.log('💾 Moto salva para agendamento:', moto.name);
        
        // Notificar sucesso
        if (window.Toast) {
            Toast.success(`${moto.name || moto.nome} selecionada! Redirecionando para agendamento...`, 2000);
        }
    } else {
        if (window.Toast) {
            Toast.error('Erro ao selecionar motocicleta. Tente novamente.', 4000);
        }
        return;
    }
    
    // Animação simples de fade out antes de navegar
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        window.location.href = 'agendamento.html';
    }, 300);
}

// Loading functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
        
        // Inicia animador de motos
        if (window.motorcycleAnimator) {
            setTimeout(() => window.motorcycleAnimator.start(), 100);
        }
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        // Para animador de motos
        if (window.motorcycleAnimator) {
            window.motorcycleAnimator.stop();
        }
        
        overlay.classList.remove('show');
        overlay.classList.add('hidden');
    }
}

// Efeitos visuais adicionais - Otimizado para Firefox
(function() {
    // Detectar Firefox
    const isFirefox = typeof InstallTrigger !== 'undefined';
    
    // Throttle function para melhor performance
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func.apply(this, args);
        };
    }
    
    const handleMouseMove = throttle((e) => {
        const shapes = document.querySelectorAll('.floating-shape');
        if (shapes.length === 0) return;
        
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        // Use requestAnimationFrame para suavizar
        requestAnimationFrame(() => {
            shapes.forEach((shape, index) => {
                // No Firefox, reduzir efeito e processar menos shapes
                if (isFirefox && index > 2) return;
                
                const speed = (index + 1) * (isFirefox ? 0.2 : 0.3);
                const xPos = (x - 0.5) * speed * (isFirefox ? 10 : 15);
                const yPos = (y - 0.5) * speed * (isFirefox ? 10 : 15);
                
                // Use translate3d para melhor performance com GPU
                shape.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
            });
        });
    }, isFirefox ? 50 : 16); // Firefox: 50ms throttle, outros: 16ms (60fps)
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
})();

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

// Retorna o ano do modelo (parte direita de "YYYY/YYYY") quando disponível.
function getModelYear(moto) {
    try {
        if (!moto) return 'N/A';
        const raw = moto.ano || moto.year || '';
        if (typeof raw === 'string' && raw.includes('/')) {
            const parts = raw.split('/').map(s => s.trim());
            if (parts[1]) return parts[1];
        }
        if (moto.modelYear) return String(moto.modelYear);
        if (moto.year) return String(moto.year);
        if (typeof raw === 'string' && raw.length) return raw;
        return 'N/A';
    } catch (e) {
        return 'N/A';
    }
}