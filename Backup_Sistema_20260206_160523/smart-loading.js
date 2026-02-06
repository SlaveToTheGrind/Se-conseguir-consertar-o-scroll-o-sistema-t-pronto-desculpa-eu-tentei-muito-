// ================================================
// SISTEMA DE LOADING INTELIGENTE ENTRE TELAS
// ================================================
// Proporciona carregamento suave e completo antes de exibir conteúdo

const SmartLoading = {
    overlay: null,
    minLoadingTime: 800, // Mínimo 0.8s - tempo suficiente para ser visível sem parecer travado
    maxLoadingTime: 5000, // Máximo 5s
    initialized: false,
    startTime: null,
    
    // Inicializar sistema
    init() {
        if (this.initialized) return;
        
        // Se body ainda não existe, aguardar
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                setTimeout(() => this.init(), 10);
            }
            return;
        }
        
        this.createOverlay();
        this.initialized = true;
    },
    
    // Criar overlay de loading
    createOverlay() {
        if (this.overlay) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'smartLoadingOverlay';
        overlay.className = 'smart-loading-overlay';
        overlay.innerHTML = `
            <div class="smart-loading-content">
                <div class="smart-loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="smart-loading-text">Preparando conteúdo...</p>
                <div class="smart-loading-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    },
    
    // Mostrar loading
    show(message = 'Preparando conteúdo...') {
        // Garantir que overlay existe
        if (!this.initialized) {
            if (document.body) {
                this.createOverlay();
                this.initialized = true;
            } else {
                console.warn('SmartLoading: Body não disponível ainda');
                return;
            }
        }
        
        if (!this.overlay) {
            console.warn('SmartLoading: Overlay não disponível');
            return;
        }
        
        const text = this.overlay.querySelector('.smart-loading-text');
        if (text) text.textContent = message;
        
        // Reset progress bar
        const progressBar = this.overlay.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.transition = 'none';
        }
        
        // Mostrar overlay
        this.overlay.classList.add('active');
        if (typeof window.lockBodyScrollSafe === 'function') window.lockBodyScrollSafe(); else document.body.style.overflow = 'hidden';
        this.startTime = Date.now();
        
        // Animar progress bar de forma mais suave
        setTimeout(() => {
            if (progressBar) {
                progressBar.style.transition = 'width 2.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
                progressBar.style.width = '90%';
            }
        }, 100);
    },
    
    // Esconder loading com fade suave
    async hide() {
        if (!this.overlay) return;
        
        // Garantir tempo mínimo de exibição para transição suave
        const elapsedTime = Date.now() - (this.startTime || 0);
        const remainingTime = Math.max(0, this.minLoadingTime - elapsedTime);
        
        if (remainingTime > 0) {
            console.log(`⏳ SmartLoading: Aguardando ${remainingTime}ms para completar tempo mínimo`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        const progressBar = this.overlay.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.transition = 'width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
            progressBar.style.width = '100%';
        }
        
        // Aguardar progress bar completar + iniciar fade out
        await new Promise(resolve => setTimeout(resolve, 350));
        
        this.overlay.classList.remove('active');
        
        // FIX: Forçar overflow auto em mobile em vez de remover
        if (window.innerWidth <= 1024) {
            if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else { document.body.style.overflow = 'auto'; document.documentElement.style.overflow = 'auto'; }
        } else {
            if (typeof window.unlockBodyScrollSafe === 'function') window.unlockBodyScrollSafe(); else document.body.style.overflow = '';
        }
        
        // Reset após animação completa (600ms da transição CSS)
        setTimeout(() => {
            if (progressBar) {
                progressBar.style.transition = 'none';
                progressBar.style.width = '0%';
            }
        }, 650);
    },
    
    // Atualizar mensagem durante loading
    updateMessage(message) {
        if (!this.overlay) return;
        const text = this.overlay.querySelector('.smart-loading-text');
        if (text) {
            text.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            text.style.opacity = '0';
            setTimeout(() => {
                text.textContent = message;
                text.style.opacity = '1';
            }, 200);
        }
    },
    
    // Wrapper para navegação com loading
    async navigateWithLoading(url, prepareFunction = null) {
        const startTime = Date.now();
        
        try {
            // Mostrar loading
            this.show('Carregando...');
            
            // Se tem função de preparação, executar
            if (prepareFunction && typeof prepareFunction === 'function') {
                await prepareFunction();
            }
            
            // Garantir tempo mínimo de loading (evita flash)
            const elapsed = Date.now() - startTime;
            if (elapsed < this.minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, this.minLoadingTime - elapsed));
            }
            
            // Navegar
            window.location.href = url;
            
        } catch (error) {
            console.error('Erro ao navegar:', error);
            this.hide();
            alert('Erro ao carregar página. Tente novamente.');
        }
    },
    
    // Carregar página com pré-carregamento de dados
    async loadPageWithData(dataUrl, renderFunction) {
        const startTime = Date.now();
        
        try {
            this.show('Carregando dados...');
            
            // Buscar dados
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error('Erro ao carregar dados');
            
            this.updateMessage('Preparando conteúdo...');
            const data = await response.json();
            
            // Renderizar (escondido)
            if (renderFunction && typeof renderFunction === 'function') {
                await renderFunction(data);
            }
            
            // Garantir tempo mínimo
            const elapsed = Date.now() - startTime;
            if (elapsed < this.minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, this.minLoadingTime - elapsed));
            }
            
            // Esconder loading - conteúdo aparece completo!
            this.hide();
            
            return data;
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.hide();
            throw error;
        }
    },
    
    // Pré-carregar imagens antes de mostrar conteúdo
    async preloadImages(imageUrls) {
        if (!imageUrls || imageUrls.length === 0) return;
        
        this.updateMessage(`Carregando imagens (0/${imageUrls.length})...`);
        
        const promises = imageUrls.map((url, index) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.updateMessage(`Carregando imagens (${index + 1}/${imageUrls.length})...`);
                    resolve();
                };
                img.onerror = () => resolve(); // Continua mesmo se falhar
                img.src = url;
            });
        });
        
        await Promise.all(promises);
    }
};

// Inicializar automaticamente quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SmartLoading.init());
} else {
    SmartLoading.init();
}

// Exportar para uso global
window.SmartLoading = SmartLoading;
