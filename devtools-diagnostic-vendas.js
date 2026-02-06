// DIAGNÓSTICO ROBUSTO - PAINEL DE VENDAS
// Cole este código no console do navegador (F12)

(function() {
    console.clear();
    console.log('%c🔍 DIAGNÓSTICO INICIADO', 'font-size: 20px; color: #00ff00; font-weight: bold');
    
    // 1. VERIFICAR ESTRUTURA DO MODAL
    function checkModalStructure() {
        console.log('%c\n=== 1. ESTRUTURA DO MODAL ===', 'color: #ffaa00; font-weight: bold');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) {
            console.error('❌ Modal #soldMotorcyclesModal não encontrado!');
            return;
        }
        console.log('✅ Modal encontrado:', modal);
        
        const modalBody = modal.querySelector('.modal-body');
        console.log('Modal Body:', modalBody ? '✅' : '❌', modalBody);
        
        const statsGrid = modal.querySelector('.stats-grid');
        console.log('Stats Grid:', statsGrid ? '✅' : '❌', statsGrid);
        
        const adminFilters = modal.querySelector('.admin-filters');
        console.log('Admin Filters:', adminFilters ? '✅' : '❌', adminFilters);
        
        // Verificar duplicação
        const allStats = modal.querySelectorAll('.stats-grid');
        const allFilters = modal.querySelectorAll('.admin-filters');
        if (allStats.length > 1) console.warn('⚠️ DUPLICAÇÃO: Encontrados', allStats.length, '.stats-grid');
        if (allFilters.length > 1) console.warn('⚠️ DUPLICAÇÃO: Encontrados', allFilters.length, '.admin-filters');
    }
    
    // 2. VERIFICAR ESTILOS COMPUTADOS
    function checkComputedStyles() {
        console.log('%c\n=== 2. ESTILOS COMPUTADOS ===', 'color: #ffaa00; font-weight: bold');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) return;
        
        const statsGrid = modal.querySelector('.stats-grid');
        const adminFilters = modal.querySelector('.admin-filters');
        
        if (statsGrid) {
            const styles = window.getComputedStyle(statsGrid);
            console.log('%c📊 Stats Grid:', 'color: #00aaff; font-weight: bold');
            console.log('  position:', styles.position);
            console.log('  top:', styles.top);
            console.log('  left:', styles.left);
            console.log('  z-index:', styles.zIndex);
            console.log('  opacity:', styles.opacity);
            console.log('  transform:', styles.transform);
            console.log('  transition:', styles.transition);
            console.log('  will-change:', styles.willChange);
            console.log('  display:', styles.display);
            console.log('  visibility:', styles.visibility);
        }
        
        if (adminFilters) {
            const styles = window.getComputedStyle(adminFilters);
            console.log('%c🎛️ Admin Filters:', 'color: #00aaff; font-weight: bold');
            console.log('  position:', styles.position);
            console.log('  top:', styles.top);
            console.log('  left:', styles.left);
            console.log('  z-index:', styles.zIndex);
            console.log('  opacity:', styles.opacity);
            console.log('  transform:', styles.transform);
            console.log('  transition:', styles.transition);
            console.log('  will-change:', styles.willChange);
            console.log('  display:', styles.display);
            console.log('  visibility:', styles.visibility);
        }
    }
    
    // 3. MONITORAR SCROLL
    function monitorScroll() {
        console.log('%c\n=== 3. MONITORAMENTO DE SCROLL ===', 'color: #ffaa00; font-weight: bold');
        console.log('⏳ Aguardando scroll no modal...');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) return;
        
        const modalBody = modal.querySelector('.modal-body');
        if (!modalBody) {
            console.error('❌ Modal body não encontrado para monitorar scroll');
            return;
        }
        
        let scrollCount = 0;
        modalBody.addEventListener('scroll', function() {
            scrollCount++;
            if (scrollCount > 20) return; // Limitar logs
            
            const statsGrid = modal.querySelector('.stats-grid');
            const adminFilters = modal.querySelector('.admin-filters');
            
            console.log(`%c📜 SCROLL #${scrollCount}`, 'color: #ff00ff; font-weight: bold');
            console.log('  scrollTop:', this.scrollTop);
            console.log('  scrollHeight:', this.scrollHeight);
            console.log('  clientHeight:', this.clientHeight);
            
            if (statsGrid) {
                const styles = window.getComputedStyle(statsGrid);
                console.log('  Stats opacity:', styles.opacity);
                console.log('  Stats position:', styles.position);
                console.log('  Stats getBoundingClientRect:', statsGrid.getBoundingClientRect());
            }
            
            if (adminFilters) {
                const styles = window.getComputedStyle(adminFilters);
                console.log('  Filters opacity:', styles.opacity);
                console.log('  Filters position:', styles.position);
                console.log('  Filters getBoundingClientRect:', adminFilters.getBoundingClientRect());
            }
            
            if (scrollCount === 20) {
                console.log('%c⚠️ Limite de logs de scroll atingido (20)', 'color: #ffaa00');
            }
        }, { passive: true });
        
        console.log('✅ Monitoramento de scroll ativado');
    }
    
    // 4. VERIFICAR SCRIPTS INLINE
    function checkInlineScripts() {
        console.log('%c\n=== 4. SCRIPTS INLINE NO MODAL ===', 'color: #ffaa00; font-weight: bold');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) return;
        
        const scripts = modal.querySelectorAll('script');
        console.log('Total de scripts inline no modal:', scripts.length);
        
        scripts.forEach((script, index) => {
            console.log(`Script #${index + 1}:`, script.textContent.substring(0, 100) + '...');
        });
    }
    
    // 5. VERIFICAR LISTENERS DE EVENTOS
    function checkEventListeners() {
        console.log('%c\n=== 5. EVENT LISTENERS ===', 'color: #ffaa00; font-weight: bold');
        console.log('ℹ️ Para ver event listeners detalhados, use: getEventListeners(element) no console');
        console.log('Exemplo: getEventListeners(document.querySelector("#soldMotorcyclesModal .modal-body"))');
    }
    
    // 6. VERIFICAR HIERARQUIA DE ELEMENTOS
    function checkHierarchy() {
        console.log('%c\n=== 6. HIERARQUIA DE ELEMENTOS ===', 'color: #ffaa00; font-weight: bold');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) return;
        
        const statsGrid = modal.querySelector('.stats-grid');
        if (statsGrid) {
            console.log('%c📊 Stats Grid - Caminho:', 'color: #00aaff');
            let el = statsGrid;
            let level = 0;
            while (el && level < 10) {
                const tag = el.tagName ? el.tagName.toLowerCase() : 'text';
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                console.log(`  ${'  '.repeat(level)}↑ ${tag}${id}${classes}`);
                el = el.parentElement;
                level++;
            }
        }
        
        const adminFilters = modal.querySelector('.admin-filters');
        if (adminFilters) {
            console.log('%c🎛️ Admin Filters - Caminho:', 'color: #00aaff');
            let el = adminFilters;
            let level = 0;
            while (el && level < 10) {
                const tag = el.tagName ? el.tagName.toLowerCase() : 'text';
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                console.log(`  ${'  '.repeat(level)}↑ ${tag}${id}${classes}`);
                el = el.parentElement;
                level++;
            }
        }
    }
    
    // 7. DETECTAR MUDANÇAS NO DOM
    function observeDOM() {
        console.log('%c\n=== 7. OBSERVADOR DE MUDANÇAS NO DOM ===', 'color: #ffaa00; font-weight: bold');
        
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            console.log('%c➕ Elemento adicionado:', 'color: #00ff00', node);
                        }
                    });
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            console.log('%c➖ Elemento removido:', 'color: #ff0000', node);
                        }
                    });
                } else if (mutation.type === 'attributes') {
                    console.log('%c🔧 Atributo alterado:', 'color: #ffaa00', 
                        mutation.target, 
                        mutation.attributeName,
                        '→', 
                        mutation.target.getAttribute(mutation.attributeName)
                    );
                }
            });
        });
        
        observer.observe(modal, {
            childList: true,
            attributes: true,
            attributeOldValue: true,
            subtree: true
        });
        
        console.log('✅ Observador de DOM ativado');
    }
    
    // 8. TESTE VISUAL DE FADE
    function testFadeVisually() {
        console.log('%c\n=== 8. TESTE VISUAL DE FADE ===', 'color: #ffaa00; font-weight: bold');
        console.log('📝 Comandos disponíveis:');
        console.log('  window.testFade(0)    - Opacity 0 (invisível)');
        console.log('  window.testFade(0.5)  - Opacity 0.5 (meio transparente)');
        console.log('  window.testFade(1)    - Opacity 1 (totalmente visível)');
        
        window.testFade = function(opacity) {
            const modal = document.querySelector('#soldMotorcyclesModal');
            if (!modal) {
                console.error('❌ Modal não encontrado');
                return;
            }
            
            const statsGrid = modal.querySelector('.stats-grid');
            const adminFilters = modal.querySelector('.admin-filters');
            
            if (statsGrid) {
                statsGrid.style.opacity = opacity;
                console.log(`✅ Stats Grid opacity = ${opacity}`);
            }
            if (adminFilters) {
                adminFilters.style.opacity = opacity;
                console.log(`✅ Admin Filters opacity = ${opacity}`);
            }
        };
        
        console.log('✅ Função window.testFade() criada');
    }
    
    // EXECUTAR TODOS OS DIAGNÓSTICOS
    checkModalStructure();
    checkComputedStyles();
    checkInlineScripts();
    checkHierarchy();
    checkEventListeners();
    observeDOM();
    monitorScroll();
    testFadeVisually();
    
    console.log('%c\n✅ DIAGNÓSTICO COMPLETO!', 'font-size: 20px; color: #00ff00; font-weight: bold');
    console.log('%c📋 INSTRUÇÕES:', 'color: #ffaa00; font-weight: bold');
    console.log('1. Role o modal para ver logs de scroll');
    console.log('2. Use window.testFade(0.5) para testar opacidade manualmente');
    console.log('3. Observe mudanças automáticas no DOM');
    console.log('4. Copie TODOS os logs e envie para análise');
    
})();
