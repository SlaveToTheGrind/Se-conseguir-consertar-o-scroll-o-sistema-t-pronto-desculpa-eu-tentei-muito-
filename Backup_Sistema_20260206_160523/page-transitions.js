// ============================================
// 🎬 SISTEMA DE TRANSIÇÕES E LOADING
// MacDavis Motos - Universal Page Transitions
// ============================================

/**
 * Sistema universal de transições entre páginas
 * Uso: incluir este script em todas as páginas HTML
 */

// Configuração do sistema
const PageTransitions = {
    duration: 400, // ms
    enabled: true,
    
    // Criar overlay de transição
    createOverlay() {
        if (document.getElementById('pageTransitionOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'pageTransitionOverlay';
        overlay.className = 'page-transition-overlay';
        overlay.innerHTML = `
            <div class="transition-content">
                <div class="transition-spinner"></div>
                <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Carregando...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },
    
    // Iniciar transição de saída
    start(callback) {
        if (!this.enabled) {
            callback();
            return;
        }
        
        this.createOverlay();
        const overlay = document.getElementById('pageTransitionOverlay');
        
        // Adicionar classe de saída ao body
        document.body.classList.add('page-exit');
        
        // Mostrar overlay
        setTimeout(() => {
            overlay.classList.add('active');
        }, 50);
        
        // Executar callback após animação
        setTimeout(callback, this.duration);
    },
    
    // Finalizar transição de entrada
    end() {
        const overlay = document.getElementById('pageTransitionOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 400);
        }
        document.body.classList.remove('page-exit');
    },
    
    // Navegar para outra página com transição
    navigateTo(url) {
        this.start(() => {
            window.location.href = url;
        });
    }
};

// Sistema de Loading Moderno
const ModernLoading = {
    overlay: null,
    progressBar: null,
    messageElement: null,
    currentProgress: 0,
    
    // Criar estrutura do loading
    create() {
        if (document.getElementById('modernLoadingOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'modernLoadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="moto-animation">🏍️</div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-ripple">
                    <div class="ripple-circle"></div>
                    <div class="ripple-circle"></div>
                    <div class="ripple-circle"></div>
                </div>
                <h3 id="loadingTitle">🏍️ MacDavis Motos</h3>
                <p id="loadingMessage">Carregando<span class="loading-dots"><span></span><span></span><span></span></span></p>
                <div class="loading-progress">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        this.overlay = overlay;
        this.progressBar = document.getElementById('progressBar');
        this.messageElement = document.getElementById('loadingMessage');
    },
    
    // Mostrar loading
    show(message = 'Carregando') {
        this.create();
        if (this.messageElement) {
            this.messageElement.innerHTML = `${message}<span class="loading-dots"><span></span><span></span><span></span></span>`;
        }
        this.overlay.classList.remove('hidden');
        this.setProgress(0);
    },
    
    // Esconder loading
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            setTimeout(() => {
                this.currentProgress = 0;
                if (this.progressBar) {
                    this.progressBar.style.width = '0%';
                }
            }, 400);
        }
    },
    
    // Atualizar mensagem
    setMessage(message) {
        if (this.messageElement) {
            this.messageElement.innerHTML = `${message}<span class="loading-dots"><span></span><span></span><span></span></span>`;
        }
    },
    
    // Atualizar progresso (0-100)
    setProgress(percent) {
        this.currentProgress = Math.min(100, Math.max(0, percent));
        if (this.progressBar) {
            this.progressBar.style.width = `${this.currentProgress}%`;
        }
    },
    
    // Incrementar progresso
    incrementProgress(amount = 10) {
        this.setProgress(this.currentProgress + amount);
    },
    
    // Simular progresso automático
    autoProgress(duration = 3000, steps = 10) {
        const increment = 100 / steps;
        const interval = duration / steps;
        let step = 0;
        
        const timer = setInterval(() => {
            if (step >= steps) {
                clearInterval(timer);
                return;
            }
            this.incrementProgress(increment);
            step++;
        }, interval);
        
        return timer;
    }
};

// Interceptar navegação de links
function setupPageTransitions() {
    // Criar overlay ao carregar
    PageTransitions.createOverlay();
    
    // Interceptar cliques em links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (link && link.href && !link.target && 
            link.href.startsWith(window.location.origin) &&
            !link.hasAttribute('data-no-transition')) {
            
            e.preventDefault();
            PageTransitions.navigateTo(link.href);
        }
    });
    
    // Interceptar botões de navegação
    const navButtons = document.querySelectorAll('[onclick*="location.href"]');
    navButtons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('location.href')) {
            button.removeAttribute('onclick');
            
            // Extrair URL do onclick
            const urlMatch = onclickAttr.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (urlMatch) {
                const url = urlMatch[1];
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    PageTransitions.navigateTo(url);
                });
            }
        }
    });
}

// Substituir funções globais de navegação
const originalNavigateTo = window.navigateTo;
window.navigateTo = function(url) {
    PageTransitions.navigateTo(url);
};

// Melhorar função de logout com transição
const originalLogout = window.logout;
window.logout = function() {
    PageTransitions.start(() => {
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
};

// Sequência de loading com mensagens
class LoadingSequence {
    constructor(messages, interval = 800) {
        this.messages = messages;
        this.interval = interval;
        this.currentIndex = 0;
        this.timer = null;
    }
    
    start() {
        ModernLoading.show(this.messages[0]);
        this.currentIndex = 0;
        
        this.timer = setInterval(() => {
            this.currentIndex++;
            if (this.currentIndex < this.messages.length) {
                ModernLoading.setMessage(this.messages[this.currentIndex]);
                ModernLoading.setProgress((this.currentIndex / this.messages.length) * 100);
            } else {
                this.stop();
            }
        }, this.interval);
        
        return this;
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        ModernLoading.setProgress(100);
    }
    
    complete() {
        this.stop();
        setTimeout(() => {
            ModernLoading.hide();
        }, 300);
    }
}

// Utilitários de animação
const AnimationUtils = {
    // Adicionar animação de entrada a elementos
    fadeInUp(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    },
    
    // Animar lista com efeito cascata
    staggerFadeIn(elements, delayIncrement = 100) {
        elements.forEach((element, index) => {
            this.fadeInUp(element, index * delayIncrement);
        });
    },
    
    // Adicionar classe com delay
    addClassWithDelay(element, className, delay = 0) {
        setTimeout(() => {
            element.classList.add(className);
        }, delay);
    }
};

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupPageTransitions();
        PageTransitions.end(); // Finalizar transição de entrada
    });
} else {
    setupPageTransitions();
    PageTransitions.end();
}

// Exportar para uso global
window.PageTransitions = PageTransitions;
window.ModernLoading = ModernLoading;
window.LoadingSequence = LoadingSequence;
window.AnimationUtils = AnimationUtils;

// Adicionar suporte para histórico do navegador
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Página foi restaurada do cache (botão voltar)
        PageTransitions.end();
        ModernLoading.hide();
    }
});
