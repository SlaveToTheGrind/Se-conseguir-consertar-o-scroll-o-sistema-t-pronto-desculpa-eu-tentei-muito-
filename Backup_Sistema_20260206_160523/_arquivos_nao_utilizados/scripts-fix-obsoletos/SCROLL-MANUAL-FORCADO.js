// ================================================================
// 🚀 SCROLL MANUAL FORÇADO - ÚLTIMO RECURSO
// ================================================================
// Já que o toque funciona mas o scroll não, vamos CRIAR nosso próprio scroll
// ================================================================

console.clear();
console.log('%c🚀 ATIVANDO SCROLL MANUAL', 'font-size: 24px; color: #ff0000; font-weight: bold');

// 1. GARANTIR ALTURA SUFICIENTE
console.log('1️⃣ Garantindo altura...');
document.body.style.minHeight = '200vh';
document.documentElement.style.minHeight = '100%';

// 2. FORÇAR TOUCH-ACTION EM TUDO
console.log('2️⃣ Forçando touch-action...');
const forceTouch = document.createElement('style');
forceTouch.textContent = `
    *, *::before, *::after {
        touch-action: pan-y !important;
    }
    html, body {
        overflow: auto !important;
        overflow-y: scroll !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: none !important;
    }
`;
document.head.appendChild(forceTouch);

// 3. IMPLEMENTAR SCROLL MANUAL VIA TOUCH
console.log('3️⃣ Implementando scroll manual...');

let startY = 0;
let currentY = 0;
let isDragging = false;
let lastScrollTop = window.scrollY;

// Capturar início do toque
window.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
    currentY = startY;
    isDragging = true;
    lastScrollTop = window.scrollY;
}, { passive: true });

// Capturar movimento do toque e fazer scroll manual
window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    currentY = e.touches[0].pageY;
    const deltaY = startY - currentY;
    
    // Fazer scroll baseado no delta
    window.scrollTo({
        top: lastScrollTop + deltaY,
        behavior: 'auto'
    });
    
    console.log('Scroll manual:', lastScrollTop + deltaY);
}, { passive: true });

// Finalizar toque
window.addEventListener('touchend', () => {
    isDragging = false;
}, { passive: true });

// 4. REMOVER QUALQUER COISA QUE IMPEÇA SCROLL
console.log('4️⃣ Removendo bloqueios...');

// Forçar CSS inline
document.documentElement.setAttribute('style', 
    'overflow: auto !important; ' +
    'overflow-y: scroll !important; ' +
    'height: auto !important; ' +
    'min-height: 100% !important; ' +
    'touch-action: pan-y !important;'
);

document.body.setAttribute('style',
    'overflow: auto !important; ' +
    'overflow-y: scroll !important; ' +
    'min-height: 200vh !important; ' +
    'touch-action: pan-y !important; ' +
    'pointer-events: auto !important;'
);

// 5. TESTE
console.log('5️⃣ Testando...');

setTimeout(() => {
    console.log('%c========================================', 'color: #666');
    console.log('%c✅ SCROLL MANUAL ATIVADO!', 'font-size: 20px; color: #00ff00; font-weight: bold');
    console.log('%c👆 TENTE ARRASTAR A TELA AGORA', 'font-size: 16px; color: #ffaa00');
    console.log('%cQuando você tocar e arrastar, o scroll será forçado manualmente', 'font-size: 12px; color: #999');
    console.log('%c========================================', 'color: #666');
}, 500);

// 6. MANTER ATIVO
setInterval(() => {
    if (document.body.style.overflow !== 'auto') {
        document.body.style.overflow = 'auto';
        document.body.style.touchAction = 'pan-y';
    }
}, 500);

console.log('✅ Sistema de scroll manual instalado!');
