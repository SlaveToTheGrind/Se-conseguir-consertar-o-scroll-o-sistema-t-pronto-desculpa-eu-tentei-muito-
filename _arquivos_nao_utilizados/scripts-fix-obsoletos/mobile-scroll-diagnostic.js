// ================================================================
// 🔍 DIAGNÓSTICO DE SCROLL MOBILE - MacDavis Motos
// ================================================================
// Cole este código no Console do DevTools (F12) do celular
// ================================================================

(function() {
    console.clear();
    console.log('%c🔍 DIAGNÓSTICO DE SCROLL MOBILE', 'font-size: 20px; font-weight: bold; color: #ff6600');
    console.log('%c================================================', 'color: #666');
    
    const results = {
        problemas: [],
        avisos: [],
        ok: []
    };
    
    // ===== 1. VERIFICAR HTML =====
    console.log('\n%c1️⃣ VERIFICANDO <html>', 'font-size: 16px; font-weight: bold; color: #00ff00');
    const html = document.documentElement;
    const htmlStyles = window.getComputedStyle(html);
    
    console.log('Overflow:', htmlStyles.overflow);
    console.log('Overflow-Y:', htmlStyles.overflowY);
    console.log('Overflow-X:', htmlStyles.overflowX);
    console.log('Position:', htmlStyles.position);
    console.log('Height:', htmlStyles.height);
    console.log('Max-Height:', htmlStyles.maxHeight);
    console.log('Touch-Action:', htmlStyles.touchAction);
    
    if (htmlStyles.overflow === 'hidden' || htmlStyles.overflowY === 'hidden') {
        results.problemas.push('❌ HTML com overflow hidden!');
    } else {
        results.ok.push('✅ HTML overflow ok');
    }
    
    if (htmlStyles.position === 'fixed') {
        results.problemas.push('❌ HTML com position fixed!');
    }
    
    // ===== 2. VERIFICAR BODY =====
    console.log('\n%c2️⃣ VERIFICANDO <body>', 'font-size: 16px; font-weight: bold; color: #00ff00');
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);
    
    console.log('Overflow:', bodyStyles.overflow);
    console.log('Overflow-Y:', bodyStyles.overflowY);
    console.log('Overflow-X:', bodyStyles.overflowX);
    console.log('Position:', bodyStyles.position);
    console.log('Height:', bodyStyles.height);
    console.log('Max-Height:', bodyStyles.maxHeight);
    console.log('Touch-Action:', bodyStyles.touchAction);
    console.log('Classes:', body.className);
    
    if (bodyStyles.overflow === 'hidden' || bodyStyles.overflowY === 'hidden') {
        results.problemas.push('❌ BODY com overflow hidden!');
    } else {
        results.ok.push('✅ BODY overflow ok');
    }
    
    if (bodyStyles.position === 'fixed') {
        results.problemas.push('❌ BODY com position fixed!');
    }
    
    if (body.classList.contains('modal-open')) {
        results.avisos.push('⚠️ BODY tem classe "modal-open"');
    }
    
    // ===== 3. VERIFICAR SCROLL HEIGHT =====
    console.log('\n%c3️⃣ VERIFICANDO SCROLL HEIGHT', 'font-size: 16px; font-weight: bold; color: #00ff00');
    console.log('document.documentElement.scrollHeight:', document.documentElement.scrollHeight);
    console.log('document.documentElement.clientHeight:', document.documentElement.clientHeight);
    console.log('document.body.scrollHeight:', document.body.scrollHeight);
    console.log('window.innerHeight:', window.innerHeight);
    
    const hasScroll = document.documentElement.scrollHeight > window.innerHeight;
    console.log('Tem conteúdo para scroll?', hasScroll);
    
    if (!hasScroll) {
        results.avisos.push('⚠️ Conteúdo não é maior que a viewport');
    } else {
        results.ok.push('✅ Há conteúdo suficiente para scroll');
    }
    
    // ===== 4. VERIFICAR ELEMENTOS FIXOS COBRINDO =====
    console.log('\n%c4️⃣ VERIFICANDO OVERLAYS/MODALS', 'font-size: 16px; font-weight: bold; color: #00ff00');
    
    const possibleOverlays = [
        '.loading-overlay',
        '.modal-overlay',
        '.smart-loading-overlay',
        '#smartLoadingOverlay',
        '.mobile-bottom-sheet',
        '.page-transition-overlay'
    ];
    
    possibleOverlays.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            const styles = window.getComputedStyle(el);
            const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
            
            if (isVisible) {
                console.log(`❌ ${selector} VISÍVEL:`, {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex,
                    pointerEvents: styles.pointerEvents
                });
                results.problemas.push(`❌ ${selector} está visível e pode bloquear scroll`);
            } else {
                console.log(`✅ ${selector} oculto`);
            }
        }
    });
    
    // ===== 5. VERIFICAR ELEMENTOS COM POINTER-EVENTS NONE =====
    console.log('\n%c5️⃣ VERIFICANDO POINTER-EVENTS', 'font-size: 16px; font-weight: bold; color: #00ff00');
    
    if (htmlStyles.pointerEvents === 'none') {
        results.problemas.push('❌ HTML com pointer-events: none');
    }
    
    if (bodyStyles.pointerEvents === 'none') {
        results.problemas.push('❌ BODY com pointer-events: none');
    }
    
    // ===== 6. VERIFICAR ELEMENTOS COM Z-INDEX ALTO =====
    console.log('\n%c6️⃣ VERIFICANDO Z-INDEX ALTO', 'font-size: 16px; font-weight: bold; color: #00ff00');
    
    const allElements = document.querySelectorAll('*');
    const highZIndex = [];
    
    allElements.forEach(el => {
        const z = window.getComputedStyle(el).zIndex;
        if (z && z !== 'auto' && parseInt(z) > 9000) {
            const rect = el.getBoundingClientRect();
            const coversViewport = rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;
            
            if (coversViewport) {
                highZIndex.push({
                    element: el.tagName,
                    class: el.className,
                    id: el.id,
                    zIndex: z,
                    display: window.getComputedStyle(el).display,
                    pointerEvents: window.getComputedStyle(el).pointerEvents
                });
            }
        }
    });
    
    if (highZIndex.length > 0) {
        console.log('Elementos com z-index alto cobrindo tela:', highZIndex);
        results.avisos.push(`⚠️ ${highZIndex.length} elemento(s) com z-index alto cobrindo viewport`);
    }
    
    // ===== 7. TESTAR SCROLL PROGRAMÁTICO =====
    console.log('\n%c7️⃣ TESTANDO SCROLL PROGRAMÁTICO', 'font-size: 16px; font-weight: bold; color: #00ff00');
    
    const scrollBefore = window.scrollY;
    window.scrollTo(0, 100);
    
    setTimeout(() => {
        const scrollAfter = window.scrollY;
        console.log('Scroll antes:', scrollBefore);
        console.log('Scroll depois:', scrollAfter);
        
        if (scrollAfter !== scrollBefore) {
            results.ok.push('✅ Scroll programático funciona');
        } else {
            results.problemas.push('❌ Scroll programático NÃO funciona');
        }
        
        // Voltar ao topo
        window.scrollTo(0, scrollBefore);
        
        // ===== RESUMO FINAL =====
        console.log('\n%c========================================', 'color: #666');
        console.log('%c📊 RESUMO DO DIAGNÓSTICO', 'font-size: 18px; font-weight: bold; color: #ff6600');
        console.log('%c========================================', 'color: #666');
        
        if (results.problemas.length > 0) {
            console.log('\n%c🔴 PROBLEMAS ENCONTRADOS:', 'font-size: 14px; font-weight: bold; color: #ff0000');
            results.problemas.forEach(p => console.log(p));
        }
        
        if (results.avisos.length > 0) {
            console.log('\n%c🟡 AVISOS:', 'font-size: 14px; font-weight: bold; color: #ffaa00');
            results.avisos.forEach(a => console.log(a));
        }
        
        if (results.ok.length > 0) {
            console.log('\n%c🟢 OK:', 'font-size: 14px; font-weight: bold; color: #00ff00');
            results.ok.forEach(o => console.log(o));
        }
        
        // ===== SUGESTÕES DE CORREÇÃO =====
        console.log('\n%c========================================', 'color: #666');
        console.log('%c🔧 CORREÇÕES SUGERIDAS:', 'font-size: 16px; font-weight: bold; color: #00aaff');
        console.log('%c========================================', 'color: #666');
        
        console.log('\nCole este código para FORÇAR scroll:');
        console.log('%c' + `
document.documentElement.style.overflow = 'auto';
document.documentElement.style.overflowY = 'auto';
document.documentElement.style.overflowX = 'hidden';
document.documentElement.style.position = 'static';
document.documentElement.style.height = 'auto';

document.body.style.overflow = 'auto';
document.body.style.overflowY = 'auto';
document.body.style.overflowX = 'hidden';
document.body.style.position = 'static';
document.body.style.height = 'auto';
document.body.style.touchAction = 'pan-y';

document.body.classList.remove('modal-open');
document.documentElement.classList.remove('modal-open');

console.log('✅ Scroll forçado! Tente rolar agora.');
        `.trim(), 'background: #1a1a1a; color: #00ff00; padding: 10px; font-family: monospace');
        
        console.log('\n%c========================================', 'color: #666');
        console.log('%c✅ DIAGNÓSTICO COMPLETO!', 'font-size: 18px; font-weight: bold; color: #00ff00');
        console.log('%c========================================', 'color: #666');
        
    }, 200);
    
})();
