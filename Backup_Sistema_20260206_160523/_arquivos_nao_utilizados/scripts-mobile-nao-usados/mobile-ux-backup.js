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

        // Toggle menu
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const nav = document.querySelector('.admin-nav');
            if (nav) nav.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Fecha ao clicar no overlay
        overlay.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            const nav = document.querySelector('.admin-nav');
            if (nav) nav.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Fecha ao clicar em link
        const navLinks = document.querySelectorAll('.admin-nav a, .admin-nav button');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                setTimeout(() => {
                    menuToggle.classList.remove('active');
                    const nav = document.querySelector('.admin-nav');
                    if (nav) nav.classList.remove('active');
                    overlay.classList.remove('active');
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
    function preventDoubleZoom() {
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
    function initPullToRefresh() {
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
        if (!('vibrate' in navigator)) return;

        document.querySelectorAll('button, .btn, .filter-btn, .nav-item').forEach(el => {
            el.addEventListener('click', function() {
                navigator.vibrate(10); // 10ms de vibração
            });
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
        preventDoubleZoom();
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
