// ===================================================================
// 🦊 OTIMIZAÇÕES DE PERFORMANCE JAVASCRIPT PARA FIREFOX
// ===================================================================

(function() {
    'use strict';
    
    // Detectar Firefox
    const isFirefox = typeof InstallTrigger !== 'undefined' || navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    if (!isFirefox) {
        console.log('✅ Navegador: Não é Firefox - otimizações não necessárias');
        return;
    }
    
    console.log('🦊 FIREFOX DETECTADO - Aplicando otimizações de performance...');
    
    // Adicionar classe ao body para controle via CSS
    document.documentElement.classList.add('firefox-browser');
    
    // === 1. THROTTLE/DEBOUNCE PARA EVENTOS PESADOS ===
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func(...args);
        };
    }
    
    // === 2. OTIMIZAR MOUSEMOVE (PRINCIPAL PROBLEMA) ===
    document.addEventListener('DOMContentLoaded', function() {
        // Remover listener de mousemove se existir
        const originalMouseMove = document.onmousemove;
        
        // Substituir por versão otimizada com throttle agressivo
        document.addEventListener('mousemove', throttle(function(e) {
            const shapes = document.querySelectorAll('.floating-shape');
            if (shapes.length === 0) return;
            
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            // RequestAnimationFrame para suavizar
            requestAnimationFrame(() => {
                shapes.forEach((shape, index) => {
                    if (index > 2) return; // Limitar a 3 shapes no Firefox
                    
                    const speed = (index + 1) * 0.2; // Reduzir velocidade
                    const xPos = (x - 0.5) * speed * 10; // Reduzir amplitude
                    const yPos = (y - 0.5) * speed * 10;
                    
                    // Usar translate3d para melhor performance
                    // Adicionar transição suave via style inline
                    shape.style.transition = 'transform 0.15s ease-out';
                    shape.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
                });
            });
        }, 50), { passive: true }); // 50ms throttle + passive listener
    });
    
    // === 3. DESABILITAR ANIMAÇÕES COMPLEXAS ===
    function disableHeavyAnimations() {
        const style = document.createElement('style');
        style.id = 'firefox-animation-override';
        style.textContent = `
            /* Animações mais suaves para Firefox */
            * {
                animation-timing-function: ease-in-out !important;
            }
            
            .floating-shape {
                animation-duration: 30s !important;
                animation-timing-function: ease-in-out !important;
            }
            
            body::before,
            body::after {
                animation: none !important;
            }
            
            /* Transições suaves globais */
            .moto-card,
            .filter-btn,
            .filter-btn-cil,
            button,
            a {
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // === 4. LAZY LOAD AGRESSIVO PARA IMAGENS ===
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        
        if ('loading' in HTMLImageElement.prototype) {
            images.forEach(img => {
                img.loading = 'lazy';
                img.decoding = 'async';
            });
        } else {
            // Fallback: Intersection Observer
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }
    
    // === 5. SCROLL SUAVE E MODERNO ===
    function enableSmoothScroll() {
        // Forçar scroll behavior suave
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Melhorar performance do scroll com requestAnimationFrame
        let ticking = false;
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', function() {
            lastScrollY = window.scrollY;
            
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    // Aplicar parallax suave apenas em elementos visíveis
                    const shapes = document.querySelectorAll('.floating-shape');
                    const scrollPercent = lastScrollY / (document.documentElement.scrollHeight - window.innerHeight);
                    
                    shapes.forEach((shape, index) => {
                        if (index > 2) return; // Limitar no Firefox
                        const speed = (index + 1) * 0.5;
                        const yPos = scrollPercent * 100 * speed;
                        shape.style.transform = `translate3d(0, ${yPos}px, 0)`;
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // Scroll suave para links âncora
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            });
        });
    }
    
    // === 6. DESABILITAR BACKDROP-FILTER VIA JS ===
    function removeBackdropFilters() {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none') {
                el.style.backdropFilter = 'none';
                el.style.webkitBackdropFilter = 'none';
                
                // Compensar com background mais opaco
                if (el.style.backgroundColor) {
                    const bgColor = el.style.backgroundColor;
                    if (bgColor.includes('rgba')) {
                        el.style.backgroundColor = bgColor.replace(/[\d.]+\)$/, '0.98)');
                    }
                }
            }
        });
    }
    
    // === 7. REMOVER TRANSFORMS COMPLEXOS ===
    function simplifyTransforms() {
        document.querySelectorAll('.moto-card, .filter-btn').forEach(el => {
            el.style.willChange = 'auto';
        });
    }
    
    // === 8. APLICAR OTIMIZAÇÕES ===
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🦊 Aplicando otimizações Firefox...');
        
        disableHeavyAnimations();
        optimizeImages();
        enableSmoothScroll(); // Ativar scroll suave
        
        setTimeout(() => {
            removeBackdropFilters();
            simplifyTransforms();
        }, 100);
        
        console.log('✅ Otimizações Firefox aplicadas!');
    });
    
    // === 9. PERFORMANCE MONITORING ===
    if (performance && performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1048576);
            const total = Math.round(memory.totalJSHeapSize / 1048576);
            
            if (used / total > 0.9) {
                console.warn('⚠️ Memória alta no Firefox:', used, 'MB /', total, 'MB');
            }
        }, 10000); // Check a cada 10s
    }
    
    // === 10. FORÇAR GARBAGE COLLECTION (SE DISPONÍVEL) ===
    window.addEventListener('beforeunload', function() {
        // Limpar event listeners
        document.querySelectorAll('*').forEach(el => {
            const clone = el.cloneNode(false);
            el.parentNode?.replaceChild(clone, el);
        });
    });
    
})();
