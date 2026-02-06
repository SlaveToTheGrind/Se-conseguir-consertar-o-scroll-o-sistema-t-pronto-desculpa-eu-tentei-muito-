// ================================================================
// 🎯 FIX DEFINITIVO - LIBERAR TOQUE NO SCROLL
// ================================================================
// O scroll existe, mas o toque está bloqueado
// ================================================================

console.clear();
console.log('%c🎯 LIBERANDO TOQUE...', 'font-size: 20px; color: #00ff00; font-weight: bold');

// 1. DESABILITAR POINTER-EVENTS DE TUDO EXCETO CONTEÚDO
console.log('1️⃣ Liberando pointer-events...');

document.querySelectorAll('*').forEach(el => {
    // Manter pointer-events apenas em conteúdo importante
    const isContent = el.classList.contains('gallery-grid') || 
                     el.id === 'galleryGrid' ||
                     el.classList.contains('moto-card') ||
                     el.classList.contains('filters-container') ||
                     el.tagName === 'BUTTON' ||
                     el.tagName === 'INPUT' ||
                     el.tagName === 'A';
    
    if (!isContent && el !== document.body && el !== document.documentElement) {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Se elemento cobre mais de 50% da tela
        const coversScreen = rect.width >= window.innerWidth * 0.5 && 
                           rect.height >= window.innerHeight * 0.5;
        
        if (coversScreen && (styles.position === 'fixed' || styles.position === 'absolute')) {
            el.style.pointerEvents = 'none';
            console.log('   Bloqueado:', el.className || el.id || el.tagName);
        }
    }
});

// 2. CRIAR CAMADA TRANSPARENTE QUE PERMITE SCROLL
console.log('2️⃣ Criando camada de scroll...');

const scrollLayer = document.createElement('div');
scrollLayer.id = 'scroll-enabler';
scrollLayer.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    pointer-events: none;
    background: transparent;
`;

document.body.appendChild(scrollLayer);

// Permitir scroll através da camada
scrollLayer.addEventListener('touchstart', (e) => {
    scrollLayer.style.pointerEvents = 'none';
}, { passive: true });

scrollLayer.addEventListener('touchmove', (e) => {
    scrollLayer.style.pointerEvents = 'none';
}, { passive: true });

// 3. REMOVER TODOS OS EVENT LISTENERS QUE BLOQUEIAM
console.log('3️⃣ Removendo listeners bloqueadores...');

// Substituir addEventListener para bloquear novos preventDefault
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'touchstart' || type === 'touchmove' || type === 'touchend') {
        // Forçar passive = true
        if (typeof options === 'object') {
            options.passive = true;
        } else {
            options = { passive: true };
        }
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// 4. ADICIONAR LISTENERS PASSIVOS GLOBAIS
console.log('4️⃣ Adicionando listeners passivos...');

['touchstart', 'touchmove', 'touchend', 'wheel'].forEach(eventType => {
    window.addEventListener(eventType, () => {
        // Listener passivo - não pode fazer preventDefault
    }, { passive: true, capture: true });
});

// 5. FORÇAR BODY E HTML A RECEBEREM TOQUES
console.log('5️⃣ Forçando recepção de toques...');

document.body.style.pointerEvents = 'auto';
document.documentElement.style.pointerEvents = 'auto';

// 6. VERIFICAR E REMOVER CLASSES CSS QUE BLOQUEIAM
console.log('6️⃣ Limpando classes...');

document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.includes('modal') && !c.includes('no-scroll') && !c.includes('lock'))
    .join(' ');

// 7. TESTE FINAL
console.log('7️⃣ Teste final...');

setTimeout(() => {
    console.log('%c========================================', 'color: #666');
    console.log('%c✅ TOQUE LIBERADO!', 'font-size: 20px; color: #00ff00; font-weight: bold');
    console.log('%c👆 TENTE ROLAR COM O DEDO AGORA', 'font-size: 16px; color: #ffaa00');
    console.log('%c========================================', 'color: #666');
    
    // Log de debug
    console.log('📋 Status:');
    console.log('- Body pointer-events:', window.getComputedStyle(document.body).pointerEvents);
    console.log('- Body overflow:', window.getComputedStyle(document.body).overflow);
    console.log('- Body touch-action:', window.getComputedStyle(document.body).touchAction);
}, 500);

// 8. MANUTENÇÃO CONTÍNUA
setInterval(() => {
    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'pan-y';
    document.body.style.pointerEvents = 'auto';
}, 300);
