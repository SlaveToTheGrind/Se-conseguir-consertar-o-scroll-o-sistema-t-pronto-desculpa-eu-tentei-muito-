/**
 * MacDavis Mobile UX Enhancement
 * Scripts para otimização mobile extrema
 */

(function() {
    'use strict';

    // Detecta se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;

    // ===== MENU HAMBURGER (ADMIN) =====
    function initMobileMenu() {
        // Verifica se já existe
        if (document.querySelector('.mobile-menu-toggle')) return;

        // Cria botão hamburger
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        menuToggle.setAttribute('aria-label', 'Menu');

        // Cria overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';

        // Adiciona ao body
        document.body.appendChild(menuToggle);
        document.body.appendChild(overlay);

        // Criar label discretto 'Nova Versão' sob o logo (apenas mobile)
        try {
            const nav = document.querySelector('.admin-nav');
            if (nav && !document.getElementById('adminVersionLabel')) {
                const logo = nav.querySelector('.logo');
                if (logo) {
                    const lbl = document.createElement('div');
                    lbl.id = 'adminVersionLabel';
                    lbl.className = 'mobile-only admin-version-label';
                    lbl.style.fontSize = '0.75rem';
                    lbl.style.opacity = '0.95';
                    lbl.style.margin = '6px 0 0';
                    lbl.style.color = '#ffffff';
                    lbl.style.display = 'none';
                    lbl.style.textAlign = 'center';
                    lbl.style.width = '100%';
                    lbl.style.padding = '2px 0';
                    lbl.innerText = 'Nova Versão';
                    // inserir o label após o bloco `.logo` para não empurrar o título ao lado
                    if (logo.parentNode) logo.parentNode.insertBefore(lbl, logo.nextSibling);

                    // show version numbers if available
                    try {
                        const ver = (window.ADMIN_CURRENT_VERSION || '').toString();
                        if (ver) lbl.innerText = `Nova Versão - ${ver}`;
                    } catch (e) {}

                    lbl.addEventListener('click', function(){
                        try { localStorage.setItem('admin-version-seen', window.ADMIN_CURRENT_VERSION || 'seen'); } catch(e){}
                        lbl.style.display = 'none';
                    });
                }
            }
        } catch (e) { /* silent */ }

        // (badge injection removed) -- no-op

        // Helper to open/close menu with consistent side-effects
        // Robust scroll lock helpers (store/restore, safety timeout and global restore hooks)
        function lockBodyScroll(){
            try{
                window.__menuPrev = window.__menuPrev || {};
                if (window.__menuPrev.scrollY === undefined) window.__menuPrev.scrollY = window.scrollY || 0;
                // mark locked
                if (!window.__menuPrev._locked){
                    window.__menuPrev._locked = true;
                    // apply fixed positioning to body preserving scroll
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${window.__menuPrev.scrollY}px`;
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    // safety: restore after 15s if something goes wrong
                    try{ clearTimeout(window.__menuPrev._safetyTimer); }catch(e){}
                    window.__menuPrev._safetyTimer = setTimeout(()=>{ try{ unlockBodyScroll(); }catch(e){} }, 15000);
                }
            }catch(e){}
        }

        function unlockBodyScroll(){
            try{
                if (!window.__menuPrev) window.__menuPrev = {};
                const prevScroll = window.__menuPrev && window.__menuPrev.scrollY ? window.__menuPrev.scrollY : 0;
                // remove fixed positioning
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                // restore scroll position
                window.scrollTo(0, prevScroll);
                // clear safety timer
                try{ clearTimeout(window.__menuPrev._safetyTimer); }catch(e){}
                window.__menuPrev._locked = false;
                try { delete window.__menuPrev.scrollY; } catch(e){}
            }catch(e){}
        }
        function openMenu() {
            menuToggle.classList.add('active');
            const nav = document.querySelector('.admin-nav');
            if (nav) nav.classList.add('open');
            overlay.classList.add('active');

            // show version label if needed
            try {
                const lbl = document.getElementById('adminVersionLabel');
                const current = window.ADMIN_CURRENT_VERSION || null;
                const seen = current ? localStorage.getItem('admin-version-seen') : null;
                if (lbl) {
                    if (current && seen !== current) lbl.style.display = 'block';
                    else lbl.style.display = 'none';
                }
            } catch (e) {}

            // lock body scroll (preserve scroll position)
            lockBodyScroll();

            // fix nav positioning and overlay z-index
            try {
                const nav = document.querySelector('.admin-nav');
                window.__menuPrev = window.__menuPrev || {};
                if (nav && !window.__menuPrev._navSaved) {
                    window.__menuPrev._navSaved = true;
                    window.__menuPrev.navPos = nav.style.position || '';
                    window.__menuPrev.navZ = nav.style.zIndex || '';
                    window.__menuPrev.navHeight = nav.style.height || '';
                }
                if (nav) {
                    nav.style.position = 'fixed';
                    nav.style.top = '0';
                    nav.style.left = '0';
                    nav.style.height = '100%';
                    nav.style.zIndex = '100000';
                }
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.zIndex = '99999';
            } catch(e) {}

            // lower problematic filter z-indexes
            try {
                const selectors = ['.admin-filters', '.filter-controls-wrapper', '.filter-pill-group', '.filter-pill-button', '.custom-select-options', '.custom-option'];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        if (!el.hasAttribute('data-prev-z')) el.setAttribute('data-prev-z', el.style.zIndex || '');
                        el.style.zIndex = '0';
                    });
                });
            } catch(e) {}
        }

        function closeMenu() {
            menuToggle.classList.remove('active');
            const nav = document.querySelector('.admin-nav');
            if (nav) nav.classList.remove('open');
            overlay.classList.remove('active');

            // unlock body scroll and restore position
            unlockBodyScroll();

            // restore nav styles
            try {
                const nav = document.querySelector('.admin-nav');
                if (nav && window.__menuPrev && window.__menuPrev._navSaved) {
                    nav.style.position = window.__menuPrev.navPos || '';
                    nav.style.zIndex = window.__menuPrev.navZ || '';
                    nav.style.height = window.__menuPrev.navHeight || '';
                    window.__menuPrev._navSaved = false;
                }
                overlay.style.position = '';
                overlay.style.zIndex = '';
            } catch(e) {}

            // restore filters z-index
            try {
                const selectors = ['.admin-filters', '.filter-controls-wrapper', '.filter-pill-group', '.filter-pill-button', '.custom-select-options', '.custom-option'];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        const prev = el.getAttribute('data-prev-z');
                        if (prev !== null) el.style.zIndex = prev;
                        el.removeAttribute('data-prev-z');
                    });
                });
            } catch(e) {}
        }

        // Toggle menu
        menuToggle.addEventListener('click', function() {
            const nav = document.querySelector('.admin-nav');
            if (nav && nav.classList.contains('open')) closeMenu(); else openMenu();
        });

        // Fecha ao clicar no overlay
        overlay.addEventListener('click', function() {
            closeMenu();
        });

            // Safety hooks: ensure unlock on pagehide/visibilitychange
            try{
                window.addEventListener('pagehide', unlockBodyScroll);
                document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') unlockBodyScroll(); });
                // also attempt unlock on beforeunload as a best-effort
                window.addEventListener('beforeunload', unlockBodyScroll);
            }catch(e){}

        // Fecha ao clicar em link
        const navLinks = document.querySelectorAll('.admin-nav a, .admin-nav button');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                setTimeout(() => {
                    closeMenu();
                }, 300);
            });
        });
    }

    // ===== BOTTOM NAVIGATION (CATALOG) =====
    function initBottomNav() {
        // Verifica se já existe
        if (document.querySelector('.mobile-bottom-nav')) return;

        // Só cria se for página de catálogo
        if (!document.getElementById('motorcycleGallery')) return;

        const bottomNav = document.createElement('nav');
        bottomNav.className = 'mobile-bottom-nav';
        bottomNav.innerHTML = `
            <a href="#top" class="nav-item active" data-section="catalog">
                <span class="nav-icon">🏍️</span>
                <span>Catálogo</span>
            </a>
            <a href="#filters" class="nav-item" data-section="filters">
                <span class="nav-icon">🔍</span>
                <span>Filtros</span>
            </a>
            <a href="agendamento.html" class="nav-item" data-section="schedule">
                <span class="nav-icon">📅</span>
                <span>Agendar</span>
            </a>
            <a href="#contact" class="nav-item" data-section="contact">
                <span class="nav-icon">📞</span>
                <span>Contato</span>
            </a>
        `;

        document.body.appendChild(bottomNav);

        // Atualiza item ativo ao clicar
        const navItems = bottomNav.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Remove active de todos
                navItems.forEach(i => i.classList.remove('active'));
                // Adiciona active no clicado
                this.classList.add('active');
            });
        });

        // Scroll spy - atualiza item ativo baseado no scroll
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveNavItem();
                    ticking = false;
                });
                ticking = true;
            }
        });

        function updateActiveNavItem() {
            const scrollPos = window.scrollY + window.innerHeight / 2;
            const filtersSection = document.querySelector('.filters-container');
            
            if (filtersSection && scrollPos < filtersSection.offsetTop + filtersSection.offsetHeight) {
                navItems.forEach(i => i.classList.remove('active'));
                navItems[0].classList.add('active'); // Catálogo
            }
        }
    }

    // ===== TOUCH SWIPE GESTURES =====
    function initSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        const sidePanel = document.querySelector('.side-panel');
        if (!sidePanel) return;

        sidePanel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, false);

        sidePanel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, false);

        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Swipe down para fechar painel
            if (deltaY > 100 && Math.abs(deltaX) < 50) {
                sidePanel.classList.remove('open');
            }
        }
    }

    // ===== SMOOTH SCROLL =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#top') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offsetTop = target.offsetTop - 80; // Offset para header
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            });
        });
    }

    // ===== PREVENT ZOOM ON DOUBLE TAP ===== 
    // DESATIVADO - estava bloqueando scroll
    function preventDoubleZoom() {
        // Função desativada temporariamente
        return;
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // ===== HIDE ADDRESS BAR ON SCROLL (iOS Safari) =====
    function hideAddressBar() {
        if (!/iPhone|iPod/.test(navigator.userAgent)) return;
        
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.scrollTo(0, 1);
            }, 0);
        });
    }

    // ===== PERFORMANCE: LAZY LOAD IMAGES =====
    function initLazyLoad() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observa todas as imagens com data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // ===== PULL TO REFRESH (EXPERIMENTAL) =====
    // DESATIVADO - estava interferindo com scroll touch
    function initPullToRefresh() {
        return; // Função desativada
        
        let startY = 0;
        let currentY = 0;
        let pulling = false;

        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        document.addEventListener('touchmove', function(e) {
            if (!pulling) return;
            currentY = e.touches[0].pageY;
            
            if (currentY - startY > 100) {
                // Pode mostrar indicador de refresh aqui
            }
        });

        document.addEventListener('touchend', function() {
            if (pulling && currentY - startY > 150) {
                location.reload();
            }
            pulling = false;
        });
    }

    // ===== VIBRAÇÃO AO CLICAR (FEEDBACK TÁTIL) =====
    function addHapticFeedback() {
        // Função universal de vibração (funciona em Android e iOS)
        function vibrate(duration = 10) {
            // Tentar vibração via navigator (Android)
            if (navigator.vibrate) {
                navigator.vibrate(duration);
                return;
            }
            
            // Fallback para iOS: usar animação + audio feedback
            if (window.AudioContext || window.webkitAudioContext) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    oscillator.frequency.value = 200;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.01);
                    
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.01);
                } catch (e) {
                    // Silenciosamente ignorar se não funcionar
                }
            }
        }

        // Adicionar feedback tátil a todos os elementos clicáveis
        document.querySelectorAll('button, .btn, .filter-btn, .nav-item, a.card, .card').forEach(el => {
            el.addEventListener('click', function(e) {
                vibrate(10);
            }, { passive: true });
            
            // Também adicionar ao touchstart para resposta mais rápida no mobile
            el.addEventListener('touchstart', function(e) {
                vibrate(10);
            }, { passive: true, once: false });
        });
    }

    // ===== STATUS BAR COLOR (PWA) =====
    function setStatusBarColor() {
        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = '#1a1a1a';
        document.head.appendChild(metaTheme);

        // Apple
        const metaApple = document.createElement('meta');
        metaApple.name = 'apple-mobile-web-app-status-bar-style';
        metaApple.content = 'black-translucent';
        document.head.appendChild(metaApple);
    }

    // ===== ORIENTATION CHANGE HANDLER =====
    function handleOrientationChange() {
        window.addEventListener('orientationchange', function() {
            // Reajusta layout após mudança de orientação
            setTimeout(function() {
                window.scrollTo(0, window.scrollY);
            }, 100);
        });
    }

    // ===== INIT TUDO =====
    function init() {
        if (!isSmallScreen && !isMobile) return;

        console.log('📱 MacDavis Mobile UX Enhancement initialized');

        // Inicia funcionalidades
        setStatusBarColor();
        // preventDoubleZoom(); // DESATIVADO - bloqueia scroll touch
        hideAddressBar();
        initSmoothScroll();
        initLazyLoad();
        handleOrientationChange();

        // Funcionalidades específicas
        if (document.querySelector('.admin-nav')) {
            initMobileMenu();
        }

        if (document.getElementById('motorcycleGallery')) {
            initBottomNav();
        }

        if (document.querySelector('.side-panel')) {
            initSwipeGestures();
        }

        // Feedback tátil (opcional)
        if (isMobile) {
            addHapticFeedback();
        }

        // Debug
        console.log('✅ Mobile features loaded:', {
            isMobile,
            isSmallScreen,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent.substring(0, 50) + '...'
        });
    }

    // Inicia quando DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-inicia em resize (debounced)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const nowSmallScreen = window.innerWidth <= 768;
            if (nowSmallScreen !== isSmallScreen) {
                location.reload(); // Reload se mudou de mobile/desktop
            }
        }, 250);
    });

})();
