/**
 * 🚀 MacDavis Mobile Catalog Optimizer
 * Otimizações de fluidez APENAS para mobile
 * Não afeta o comportamento desktop
 */

(function() {
    'use strict';

        // Detecta se é mobile REAL - VERSÃO MAIS AGRESSIVA
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = () => window.innerWidth <= 900;
        
        console.log('🔍 Mobile Optimizer: Detecção');
        console.log('   User Agent:', navigator.userAgent);
        console.log('   isMobileDevice:', isMobileDevice);
        console.log('   window.innerWidth:', window.innerWidth);
        console.log('   isSmallScreen():', isSmallScreen());

        // FORÇAR para dispositivos móveis REAIS (não apenas tela pequena)
        if (!isMobileDevice) {
            console.log('📱 Mobile Optimizer: Desktop detectado, otimizações desativadas');
            return;
        }
        
        if (!isSmallScreen()) {
            console.log('📱 Mobile Optimizer: Tablet em paisagem, otimizações desativadas');
            return;
        }

        console.log('🚀 Mobile Optimizer: ATIVADO para melhor fluidez');

    // ===== VARIÁVEIS GLOBAIS =====
    let allMotorcyclesFiltered = [];  // Todas as motos filtradas
    let currentlyRendered = 0;         // Quantas já foram renderizadas
    let isLoading = false;             // Flag para evitar múltiplos loads
    let observer = null;               // IntersectionObserver para lazy loading

    // ===== INFINITE SCROLL =====
    function initInfiniteScroll() {
        // Substituir renderCatalog original APENAS no mobile
        if (window.originalRenderCatalog) return; // Já inicializado

        // Salvar função original
        window.originalRenderCatalog = window.renderCatalog;

        // Substituir com versão otimizada para mobile
        window.renderCatalog = function() {
            if (!isSmallScreen()) {
                // Desktop: usar versão original
                return window.originalRenderCatalog();
            }

            // Mobile: versão otimizada com infinite scroll
            const grid = document.getElementById('galleryGrid');
            if (!grid) return;

            // Pegar motos filtradas do contexto global
            allMotorcyclesFiltered = window.filteredMotorcycles || [];

            if (allMotorcyclesFiltered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px 20px;">
                        <h3 style="font-size: 1.2rem; margin-bottom: 8px;">🔍 Nenhuma moto encontrada</h3>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Tente ajustar os filtros ou busca</p>
                    </div>
                `;
                return;
            }

            // Ordenar motos (mesma lógica do original)
            const motosSorted = sortMotorcycles(allMotorcyclesFiltered);
            allMotorcyclesFiltered = motosSorted;

            // Resetar e renderizar primeiro lote
            currentlyRendered = 0;
            grid.innerHTML = '';
            renderNextBatch();

            // Setup scroll listener
            setupScrollListener();
        };

        console.log('✅ Infinite Scroll ativado');
    }

    // Ordenar motos (mesma lógica do original)
    function sortMotorcycles(motos) {
        return [...motos].sort((a, b) => {
            const getCategoria = (moto) => {
                const tipo = (moto.type || moto.tipo || '').toLowerCase();
                const categoria = (moto.categoria || '').toLowerCase();
                const cilindrada = parseInt(moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 0);
                
                if (tipo === 'scooter' || categoria === 'scooter') return 1;
                if (tipo === 'custom' || categoria === 'custom') return 4;
                if (cilindrada >= 500) return 3;
                return 2;
            };
            
            const catA = getCategoria(a);
            const catB = getCategoria(b);
            if (catA !== catB) return catA - catB;
            
            const cilA = parseInt(a.displacement || a.cilindradas || a.engine_cc || a.cc || 0);
            const cilB = parseInt(b.displacement || b.cilindradas || b.engine_cc || b.cc || 0);
            if (cilA !== cilB) return cilA - cilB;
            
            const anoA = parseInt(a.year || a.ano || 0);
            const anoB = parseInt(b.year || b.ano || 0);
            return anoA - anoB;
        });
    }

    // Renderizar próximo lote de cards
    function renderNextBatch() {
        if (isLoading) return;
        if (currentlyRendered >= allMotorcyclesFiltered.length) {
            showEndMessage();
            return;
        }

        isLoading = true;
        const grid = document.getElementById('galleryGrid');
        const nextBatch = allMotorcyclesFiltered.slice(
            currentlyRendered,
            currentlyRendered + CONFIG.CARDS_PER_PAGE
        );

        // Criar fragment para melhor performance
        const fragment = document.createDocumentFragment();

        nextBatch.forEach((moto, index) => {
            const card = createMotoCard(moto, currentlyRendered + index);
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        currentlyRendered += nextBatch.length;

        // Animar entrada dos cards
        animateCardEntrance(grid);

        // Setup lazy loading de imagens
        setupLazyImages();

        isLoading = false;

        console.log(`📦 Renderizados ${currentlyRendered}/${allMotorcyclesFiltered.length} cards`);
    }

    // Criar card de moto (HTML)
    function createMotoCard(moto, index) {
        const div = document.createElement('div');
        div.className = 'moto-card';
        div.dataset.motoId = moto.id;
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';

        // Usar mesma estrutura do original
        div.innerHTML = `
            <div class="moto-image">
                ${moto.image ? 
                    `<img data-src="${moto.image}" alt="${moto.name || moto.nome}" class="lazy-image" />` :
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
                        <span class="detail-value">${formatarNumeroHelper(moto.mileage || moto.quilometragem || moto.km || 0)} km</span>
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
        `;

        return div;
    }

    // Helper para formatar números
    function formatarNumeroHelper(numero) {
        if (!numero) return '0';
        const num = typeof numero === 'string' ? parseInt(numero.replace(/\./g, '')) : parseInt(numero);
        return num.toLocaleString('pt-BR');
    }

    // Animar entrada dos cards
    function animateCardEntrance(grid) {
        const newCards = grid.querySelectorAll('.moto-card[style*="opacity: 0"]');
        
        newCards.forEach((card, index) => {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    card.style.transition = 'opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            }, index * CONFIG.ANIMATION_DELAY);
        });
    }

    // Setup lazy loading de imagens
    function setupLazyImages() {
        const lazyImages = document.querySelectorAll('img.lazy-image:not(.loaded)');
        
        if (!observer) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src) {
                            img.src = src;
                            img.classList.add('loaded');
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: CONFIG.IMAGE_LAZY_OFFSET
            });
        }

        lazyImages.forEach(img => observer.observe(img));
    }

    // Setup scroll listener para infinite scroll
    function setupScrollListener() {
        let ticking = false;

        const scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollHeight = document.documentElement.scrollHeight;
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const clientHeight = document.documentElement.clientHeight;
                    
                    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
                    
                    if (scrollPercentage >= CONFIG.SCROLL_THRESHOLD) {
                        renderNextBatch();
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Remover listener anterior se existir
        window.removeEventListener('scroll', window.mobileScrollHandler);
        window.mobileScrollHandler = scrollHandler;
        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    // Mostrar mensagem de fim
    function showEndMessage() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        const existing = grid.querySelector('.end-message');
        if (existing) return;

        const endDiv = document.createElement('div');
        endDiv.className = 'end-message';
        endDiv.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 30px 20px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
        `;
        endDiv.innerHTML = '🏁 Todas as motos foram exibidas';
        
        grid.appendChild(endDiv);
    }

    // ===== BOTTOM SHEET (em vez de modal no mobile) =====
    function initBottomSheet() {
        // Substituir openMotoModal APENAS no mobile
        if (window.originalOpenMotoModal) return;

        window.originalOpenMotoModal = window.openMotoModal;

        window.openMotoModal = function(motoId) {
            console.log('🎯 openMotoModal chamado, motoId:', motoId);
            console.log('   Largura da tela:', window.innerWidth);
            console.log('   isSmallScreen():', isSmallScreen());
            
            if (!isSmallScreen()) {
                // Desktop: usar modal original
                console.log('   → Usando modal original (desktop)');
                return window.originalOpenMotoModal(motoId);
            }

            // Mobile: usar bottom sheet
            console.log('   → Usando BOTTOM SHEET (mobile)');
            const moto = window.motorcycles.find(m => m.id === motoId);
            if (!moto) {
                console.log('   ❌ Moto não encontrada!');
                return;
            }

            console.log('   ✅ Criando bottom sheet para:', moto.name || moto.nome);
            createBottomSheet(moto);
        };

        console.log('✅ Bottom Sheet ativado');
    }

    // Criar bottom sheet
    function createBottomSheet(moto) {
        // Remover sheet existente
        const existing = document.querySelector('.mobile-bottom-sheet');
        if (existing) existing.remove();

        const sheet = document.createElement('div');
        sheet.className = 'mobile-bottom-sheet';
        sheet.innerHTML = `
            <div class="bottom-sheet-overlay"></div>
            <div class="bottom-sheet-content" style="max-height: 55vh !important;">
                <div class="bottom-sheet-handle"></div>
                
                <div class="bottom-sheet-header">
                    <h2>${(moto.marca ? moto.marca + ' ' : '') + (moto.name || moto.nome || 'Sem nome')}</h2>
                    <button class="bottom-sheet-close" aria-label="Fechar">✕</button>
                </div>
                
                <div class="bottom-sheet-body">
                    ${moto.image ? 
                        `<img src="${moto.image}" alt="${moto.name || moto.nome}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;" />` :
                        `<div style="height: 120px; display: flex; align-items: center; justify-content: center; background: #1a1a1a; border-radius: 12px; margin-bottom: 10px;">📷 Sem Imagem</div>`
                    }
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px 8px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; text-transform: uppercase;">📅 Ano</div>
                            <div style="font-size: 0.85rem; color: #fff; font-weight: 600;">${moto.year || moto.ano || 'N/A'}</div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px 8px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; text-transform: uppercase;">🎨 Cor</div>
                            <div style="font-size: 0.85rem; color: #fff; font-weight: 600;">${moto.color || moto.cor || 'N/A'}</div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px 8px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; text-transform: uppercase;">📏 KM</div>
                            <div style="font-size: 0.85rem; color: #fff; font-weight: 600;">${formatarNumeroHelper(moto.mileage || moto.quilometragem || moto.km || 0)} km</div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px 8px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; text-transform: uppercase;">⚙️ Cilindrada</div>
                            <div style="font-size: 0.85rem; color: #fff; font-weight: 600;">${moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A'}cc</div>
                        </div>
                    </div>
                    
                    <button class="bottom-sheet-cta" data-moto-id="${moto.id}" style="width: 100%; height: 44px; background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%); border: none; border-radius: 12px; color: #fff; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                        📅 Agendar Visita
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(sheet);
        // FIX SCROLL: NÃO bloquear scroll ao abrir bottom sheet
        // document.body.style.overflow = 'hidden';

        // Animar entrada
        setTimeout(() => {
            sheet.classList.add('show');
        }, 10);

        // Event listeners
        setupBottomSheetEvents(sheet, moto.id);
    }

    // Setup eventos do bottom sheet
    function setupBottomSheetEvents(sheet, motoId) {
        const overlay = sheet.querySelector('.bottom-sheet-overlay');
        const closeBtn = sheet.querySelector('.bottom-sheet-close');
        const ctaBtn = sheet.querySelector('.bottom-sheet-cta');
        const content = sheet.querySelector('.bottom-sheet-content');

        // Fechar ao clicar no overlay
        overlay.addEventListener('click', () => closeBottomSheet(sheet));
        closeBtn.addEventListener('click', () => closeBottomSheet(sheet));

        // CTA agendar
        ctaBtn.addEventListener('click', () => {
            if (window.scheduleVisit) {
                window.scheduleVisit(motoId);
            }
        });

        // Swipe down para fechar
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        content.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            content.style.transition = 'none';
        }, { passive: true });

        content.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0) { // Apenas para baixo
                content.style.transform = `translateY(${diff}px)`;
            }
        }, { passive: true });

        content.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diff = currentY - startY;
            content.style.transition = '';

            if (diff > CONFIG.TOUCH_SWIPE_MIN) {
                closeBottomSheet(sheet);
            } else {
                content.style.transform = '';
            }

            isDragging = false;
        });
    }

    // Fechar bottom sheet
    function closeBottomSheet(sheet) {
        sheet.classList.remove('show');
        
        // FIX SCROLL: Forçar overflow auto em mobile em vez de apenas remover
        if (window.innerWidth <= 1024) {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        } else {
            document.body.style.overflow = '';
        }

        setTimeout(() => {
            sheet.remove();
        }, 300);
    }

    // ===== OTIMIZAÇÕES DE PERFORMANCE =====
    function optimizePerformance() {
        // Adicionar will-change apenas durante scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            document.body.style.willChange = 'scroll-position';
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.style.willChange = 'auto';
            }, 200);
        }, { passive: true });

        // Smooth scroll para âncoras
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        console.log('✅ Performance otimizada');
    }

    // ===== INICIALIZAÇÃO =====
    function init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Verificar novamente se é mobile
        if (!isMobile && !isSmallScreen()) return;

        console.log('🚀 Inicializando otimizações mobile...');

        // Pequeno delay para garantir que scripts originais carregaram
        setTimeout(() => {
            initInfiniteScroll();
            initBottomSheet();
            optimizePerformance();
            
            console.log('✅ MacDavis Mobile Optimizer carregado com sucesso!');
        }, 100);
    }

    // Iniciar
    init();

})();
