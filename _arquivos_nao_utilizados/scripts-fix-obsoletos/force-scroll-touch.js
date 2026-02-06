// ================================================================
// 🔧 FORÇAR SCROLL TOUCH - MacDavis Motos
// ================================================================
// Cole este código no Console do DevTools (F12) do celular
// ================================================================

(function() {
    console.clear();
    console.log('%c🔧 FORÇANDO SCROLL TOUCH', 'font-size: 20px; font-weight: bold; color: #ff6600');
    
    // 1. REMOVER EVENT LISTENERS DE TOUCH QUE BLOQUEIAM SCROLL
    console.log('%c1️⃣ Removendo event listeners de touch...', 'color: #00ff00');
    
    // Clonar body e html para remover todos os event listeners
    const oldBody = document.body;
    const newBody = oldBody.cloneNode(true);
    oldBody.parentNode.replaceChild(newBody, oldBody);
    
    // 2. FORÇAR CSS DE SCROLL
    console.log('%c2️⃣ Forçando CSS de scroll...', 'color: #00ff00');
    
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.documentElement.style.setProperty('touch-action', 'pan-y', 'important');
    document.documentElement.style.setProperty('position', 'static', 'important');

    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('touch-action', 'pan-y', 'important');
    document.body.style.setProperty('position', 'static', 'important');
    
    // 3. REMOVER CLASSES QUE BLOQUEIAM
    console.log('%c3️⃣ Removendo classes bloqueadoras...', 'color: #00ff00');
    
    document.body.classList.remove('modal-open', 'no-scroll', 'scroll-lock');
    document.documentElement.classList.remove('modal-open', 'no-scroll', 'scroll-lock');
    
    // 4. ESCONDER OVERLAYS
    console.log('%c4️⃣ Escondendo overlays...', 'color: #00ff00');
    
    const overlays = document.querySelectorAll(`
        .loading-overlay,
        .modal-overlay,
        .smart-loading-overlay,
        #smartLoadingOverlay,
        .page-transition-overlay,
        [class*="overlay"]
    `);
    
    overlays.forEach(el => {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
    });
    
    // 5. BLOQUEAR PREVENTDEFAULT EM TOUCHMOVE
    console.log('%c5️⃣ Bloqueando preventDefault em touchmove...', 'color: #00ff00');
    
    // Adicionar listener passivo que NÃO pode fazer preventDefault
    document.addEventListener('touchmove', function(e) {
        // Listener passivo - não bloqueia scroll
    }, { passive: true, capture: true });
    
    // 6. TESTAR SCROLL
    console.log('%c6️⃣ Testando scroll...', 'color: #00ff00');
    
    const scrollBefore = window.scrollY;
    window.scrollTo(0, 200);
    
    setTimeout(() => {
        const scrollAfter = window.scrollY;
        
        if (scrollAfter !== scrollBefore) {
            console.log('%c✅ SCROLL PROGRAMÁTICO OK!', 'font-size: 16px; color: #00ff00');
            console.log('%c👆 Agora tente fazer scroll com o dedo', 'font-size: 14px; color: #ffaa00');
        } else {
            console.log('%c❌ SCROLL AINDA BLOQUEADO', 'font-size: 16px; color: #ff0000');
        }
        
        window.scrollTo(0, scrollBefore);
    }, 300);
    
    console.log('%c========================================', 'color: #666');
    console.log('%c✅ CORREÇÃO APLICADA!', 'font-size: 18px; font-weight: bold; color: #00ff00');
    console.log('%c========================================', 'color: #666');
    
})();
