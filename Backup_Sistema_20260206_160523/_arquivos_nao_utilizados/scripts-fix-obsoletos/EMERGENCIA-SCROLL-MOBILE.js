// ================================================================
// 🚨 EMERGÊNCIA - FORÇAR SCROLL NO CELULAR
// ================================================================
// Cole este código no Console do DevTools do CELULAR (F12)
// ================================================================

(function() {
    console.clear();
    console.log('%c🚨 FORÇANDO SCROLL - MODO EMERGÊNCIA', 'font-size: 20px; font-weight: bold; color: #ff0000');
    
    // 1. FORÇAR OVERFLOW
    console.log('1️⃣ Forçando overflow...');
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.documentElement.style.setProperty('position', 'static', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('position', 'static', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('touch-action', 'pan-y', 'important');
    
    // 2. REMOVER CLASSES
    console.log('2️⃣ Removendo classes bloqueadoras...');
    document.body.classList.remove('modal-open', 'no-scroll', 'scroll-lock');
    document.documentElement.classList.remove('modal-open', 'no-scroll', 'scroll-lock');
    
    // 3. ESCONDER TODOS OS OVERLAYS
    console.log('3️⃣ Escondendo overlays...');
    const overlays = document.querySelectorAll(`
        .modal-overlay,
        #modalOverlay,
        .modal,
        .overlay,
        .loading-overlay,
        .smart-loading-overlay,
        #smartLoadingOverlay,
        [class*="overlay"],
        [id*="overlay"],
        [class*="modal"]
    `);
    
    overlays.forEach(el => {
        el.style.display = 'none';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.remove(); // REMOVE DO DOM
    });
    
    console.log(`   Removidos ${overlays.length} overlays`);
    
    // 4. DESABILITAR TODOS OS EVENT LISTENERS DE TOUCH
    console.log('4️⃣ Limpando event listeners...');
    
    // Clonar body para remover listeners
    const oldBody = document.body;
    const newBody = oldBody.cloneNode(true);
    oldBody.parentNode.replaceChild(newBody, oldBody);
    
    // 5. VERIFICAR ELEMENTOS FIXED/ABSOLUTE QUE COBREM TELA
    console.log('5️⃣ Verificando elementos que cobrem a tela...');
    
    const allElements = document.querySelectorAll('*');
    let blocking = [];
    
    allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const position = styles.position;
        
        if (position === 'fixed' || position === 'absolute') {
            const rect = el.getBoundingClientRect();
            const coversScreen = rect.width >= window.innerWidth * 0.9 && 
                               rect.height >= window.innerHeight * 0.9;
            
            if (coversScreen) {
                blocking.push(el);
                el.style.pointerEvents = 'none';
                el.style.display = 'none';
                console.log('   Bloqueado:', el.className || el.id || el.tagName);
            }
        }
    });
    
    console.log(`   ${blocking.length} elementos bloqueadores desabilitados`);
    
    // 6. FORÇAR SCROLL PROGRAMATICAMENTE
    console.log('6️⃣ Testando scroll...');
    
    const scrollBefore = window.scrollY;
    window.scrollTo(0, 100);
    
    setTimeout(() => {
        const scrollAfter = window.scrollY;
        
        if (scrollAfter !== scrollBefore) {
            console.log('%c✅ SCROLL FUNCIONANDO!', 'font-size: 18px; color: #00ff00; font-weight: bold');
        } else {
            console.log('%c❌ SCROLL AINDA TRAVADO', 'font-size: 18px; color: #ff0000; font-weight: bold');
            
            // ÚLTIMO RECURSO - RECARREGAR SEM CACHE
            console.log('🔄 Tentando recarregar sem cache...');
            setTimeout(() => {
                location.reload(true);
            }, 2000);
        }
        
        window.scrollTo(0, scrollBefore);
    }, 300);
    
    // 7. MANTER PROTEÇÃO ATIVA
    console.log('7️⃣ Ativando proteção permanente...');
    
    function keepScrollWorking() {
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.body.classList.remove('modal-open', 'no-scroll');
        document.documentElement.classList.remove('modal-open', 'no-scroll');
    }
    
    setInterval(keepScrollWorking, 500);
    
    console.log('%c========================================', 'color: #666');
    console.log('%c✅ CORREÇÃO DE EMERGÊNCIA APLICADA!', 'font-size: 18px; font-weight: bold; color: #00ff00');
    console.log('%c👆 Agora tente fazer scroll', 'font-size: 14px; color: #ffaa00');
    console.log('%c========================================', 'color: #666');
    
})();
