// 🔧 FIX DEFINITIVO PARA DROPDOWNS SOBREPOSTOS - VERSÃO EXTREMA
// Coloque este script DEPOIS de carregar o admin.js

(function() {
    console.log('%c🔧 FIX EXTREMO DE Z-INDEX CARREGADO', 'background: #ff6600; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    
    function fixDropdowns() {
        const modal = document.getElementById('soldMotorcyclesModal');
        if (!modal || modal.style.display === 'none') {
            return;
        }
        
        console.log('%c🔧 APLICANDO CORREÇÕES EXTREMAS...', 'background: red; color: white; padding: 8px; font-size: 14px;');
        
        // 1. FORÇAR OVERFLOW VISIBLE EM ABSOLUTAMENTE TUDO
        const modalContent = modal.querySelector('.modal-content');
        const modalBody = modal.querySelector('.modal-body');
        const content = document.getElementById('soldMotorcyclesContent');
        
        [modal, modalContent, modalBody].forEach(el => {
            if (el) {
                el.style.setProperty('overflow', 'visible', 'important');
                el.style.setProperty('overflow-x', 'visible', 'important');
                el.style.setProperty('overflow-y', 'visible', 'important');
            }
        });
        
        if (content) {
            content.style.setProperty('overflow-y', 'auto', 'important');
            content.style.setProperty('overflow-x', 'hidden', 'important');
            content.style.setProperty('max-height', 'calc(100vh - 150px)', 'important');
        }
        
        // 2. FORÇAR Z-INDEX EXTREMO NOS FILTROS E TODA A ÁRVORE DE PAIS
        const filtros = [
            document.getElementById('soldMarcaFilter'),
            document.getElementById('monthFilter')
        ];
        
        filtros.forEach(filtro => {
            if (!filtro) return;
            
            console.log('🎯 Processando filtro:', filtro.id);
            
            // Forçar no próprio filtro
            filtro.style.setProperty('z-index', '2147483647', 'important');
            filtro.style.setProperty('position', 'relative', 'important');
            
            // Subir toda a árvore de pais forçando z-index
            let parent = filtro.parentElement;
            let level = 1;
            
            while (parent && parent !== document.body && level < 10) {
                parent.style.setProperty('z-index', `${2147483647 - level}`, 'important');
                parent.style.setProperty('position', 'relative', 'important');
                parent.style.setProperty('overflow', 'visible', 'important');
                parent.style.setProperty('overflow-x', 'visible', 'important');
                parent.style.setProperty('overflow-y', 'visible', 'important');
                
                if (level === 1 || level === 2) {
                    parent.style.setProperty('isolation', 'isolate', 'important');
                }
                
                console.log(`  ↑ Parent nível ${level}:`, parent.tagName, parent.className);
                parent = parent.parentElement;
                level++;
            }
        });
        
        // 3. FORÇAR Z-INDEX MÍNIMO EM TODOS OS CARDS E SEUS FILHOS
        const cards = modal.querySelectorAll('[data-marca], .motorcycle-card, .month-section');
        cards.forEach(card => {
            card.style.setProperty('z-index', '1', 'important');
            card.style.setProperty('position', 'relative', 'important');
            
            // Forçar em TODOS os filhos também
            const children = card.querySelectorAll('*');
            children.forEach(child => {
                child.style.setProperty('z-index', 'auto', 'important');
            });
        });
        
        console.log('%c✅ CORREÇÕES EXTREMAS APLICADAS!', 'background: green; color: white; padding: 8px; font-size: 14px;', {
            filtros: filtros.filter(f => f).length,
            cards: cards.length
        });
    }
    
    // EXECUTAR IMEDIATAMENTE quando DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(fixDropdowns, 100);
        });
    } else {
        setTimeout(fixDropdowns, 100);
    }
    
    // OBSERVAR MUDANÇAS NO MODAL
    const observer = new MutationObserver(() => {
        const modal = document.getElementById('soldMotorcyclesModal');
        if (modal && modal.style.display !== 'none') {
            fixDropdowns();
        }
    });
    
    setTimeout(() => {
        const modal = document.getElementById('soldMotorcyclesModal');
        if (modal) {
            observer.observe(modal, {
                attributes: true,
                childList: true,
                subtree: true
            });
            
            if (modal.style.display !== 'none') {
                fixDropdowns();
            }
        }
    }, 500);
    
    // EXECUTAR quando clicar em "Ver Vendas"
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.textContent?.includes('Ver Vendas') || 
            target.closest('button')?.textContent?.includes('Ver Vendas')) {
            setTimeout(fixDropdowns, 200);
            setTimeout(fixDropdowns, 500);
            setTimeout(fixDropdowns, 1000);
        }
    });
    
    // EXECUTAR quando abrir qualquer dropdown
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.id === 'soldMarcaFilter' || target.id === 'monthFilter') {
            setTimeout(fixDropdowns, 50);
        }
    });
    
    // FALLBACK: Re-executar periodicamente
    setInterval(() => {
        const modal = document.getElementById('soldMotorcyclesModal');
        if (modal && modal.style.display !== 'none') {
            fixDropdowns();
        }
    }, 3000);
    
    console.log('%c✅ FIX EXTREMO ATIVO! Monitorizando...', 'background: #ff6600; color: white; padding: 8px; font-size: 14px;');
})();
