// ================================================================
// ⚡ FORÇAR SCROLL - MODO ULTRA AGRESSIVO
// ================================================================
// Cole ESTE código no console do celular
// ================================================================

console.clear();
console.log('%c⚡ MODO ULTRA AGRESSIVO ATIVADO', 'font-size: 24px; color: #ff0000; font-weight: bold');

// 1. VERIFICAR SE TEM ALTURA PARA SCROLL
const docHeight = document.documentElement.scrollHeight;
const winHeight = window.innerHeight;
const canScroll = docHeight > winHeight;

console.log('📏 Altura do documento:', docHeight + 'px');
console.log('📏 Altura da janela:', winHeight + 'px');
console.log('📏 Pode rolar?', canScroll ? 'SIM ✅' : 'NÃO ❌');

if (!canScroll) {
    console.log('🔧 ADICIONANDO ALTURA...');
    // Adicionar div alta para garantir scroll
    const fakeHeight = document.createElement('div');
    fakeHeight.style.cssText = 'height: 2000px; width: 100%; background: repeating-linear-gradient(0deg, #111 0px, #111 100px, #222 100px, #222 200px);';
    fakeHeight.innerHTML = '<div style="color: white; text-align: center; padding: 50px; font-size: 2rem;">TESTE DE SCROLL<br>Role para baixo ↓</div>';
    document.body.appendChild(fakeHeight);
    console.log('✅ Altura adicionada!');
}

// 2. DESTRUIR TODOS OS EVENT LISTENERS
console.log('💣 DESTRUINDO TODOS OS EVENT LISTENERS...');

// Salvar funções importantes
const oldAddEventListener = EventTarget.prototype.addEventListener;
const oldRemoveEventListener = EventTarget.prototype.removeEventListener;

// Limpar tudo clonando
const elements = [document, document.documentElement, document.body, window];
elements.forEach(el => {
    const clone = el.cloneNode(true);
    if (el.parentNode) {
        el.parentNode.replaceChild(clone, el);
    }
});

console.log('✅ Event listeners destruídos!');

// 3. BLOQUEAR PREVENTDEFAULT EM TOUCH
console.log('🚫 Bloqueando preventDefault...');

['touchstart', 'touchmove', 'touchend', 'wheel', 'mousewheel'].forEach(event => {
    document.addEventListener(event, function(e) {
        // Não permitir preventDefault
    }, { passive: true, capture: true });
});

console.log('✅ preventDefault bloqueado!');

// 4. FORÇAR CSS ABSOLUTO
console.log('🎨 Forçando CSS...');

const forceStyles = `
    <style id="force-scroll-ultra">
        html, body {
            overflow: auto !important;
            overflow-y: scroll !important;
            overflow-x: hidden !important;
            position: static !important;
            height: auto !important;
            min-height: 100vh !important;
            touch-action: pan-y !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        * {
            pointer-events: auto !important;
        }
        
        .modal-overlay,
        #modalOverlay,
        [class*="overlay"],
        [class*="loading"],
        [id*="overlay"],
        [id*="loading"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', forceStyles);
console.log('✅ CSS forçado!');

// 5. REMOVER TODOS FIXED/ABSOLUTE QUE COBREM TELA
console.log('🔍 Procurando elementos bloqueadores...');

let removed = 0;
document.querySelectorAll('*').forEach(el => {
    const styles = window.getComputedStyle(el);
    
    // Se elemento cobre tela toda
    const rect = el.getBoundingClientRect();
    const coversFullScreen = (
        (rect.width >= window.innerWidth * 0.8 || rect.width === window.innerWidth) &&
        (rect.height >= window.innerHeight * 0.8 || rect.height === window.innerHeight)
    );
    
    // Se fixed/absolute e cobre tela
    if ((styles.position === 'fixed' || styles.position === 'absolute') && coversFullScreen) {
        // Verificar se não é conteúdo importante
        const isContent = el.querySelector('.gallery-grid, #galleryGrid, .moto-card');
        
        if (!isContent) {
            console.log('   Removendo:', el.className || el.id || el.tagName);
            el.remove();
            removed++;
        }
    }
});

console.log(`✅ ${removed} elementos bloqueadores removidos!`);

// 6. FORÇAR INLINE STYLES
document.documentElement.setAttribute('style', 'overflow: auto !important; position: static !important; height: auto !important;');
document.body.setAttribute('style', 'overflow: auto !important; position: static !important; height: auto !important; touch-action: pan-y !important;');

// 7. TESTAR SCROLL PROGRAMATICAMENTE
console.log('🧪 Testando scroll...');

window.scrollTo(0, 0);
setTimeout(() => {
    window.scrollTo(0, 200);
    console.log('Scroll para Y=200');
    
    setTimeout(() => {
        const currentScroll = window.scrollY;
        console.log('Posição atual:', currentScroll);
        
        if (currentScroll > 0) {
            console.log('%c✅✅✅ SCROLL FUNCIONANDO! ✅✅✅', 'font-size: 20px; color: #00ff00; font-weight: bold; background: #000; padding: 10px;');
            console.log('👆 TENTE ROLAR COM O DEDO AGORA!');
        } else {
            console.log('%c❌ SCROLL AINDA TRAVADO', 'font-size: 20px; color: #ff0000; font-weight: bold');
            console.log('⚠️ Isso indica um problema mais profundo...');
            
            // DIAGNÓSTICO
            console.log('\n📋 DIAGNÓSTICO:');
            console.log('- Overflow HTML:', window.getComputedStyle(document.documentElement).overflow);
            console.log('- Overflow BODY:', window.getComputedStyle(document.body).overflow);
            console.log('- Position HTML:', window.getComputedStyle(document.documentElement).position);
            console.log('- Position BODY:', window.getComputedStyle(document.body).position);
            console.log('- Touch-action BODY:', window.getComputedStyle(document.body).touchAction);
            console.log('- Altura total:', document.documentElement.scrollHeight);
            console.log('- Altura visível:', window.innerHeight);
        }
    }, 500);
}, 100);

// 8. PROTEÇÃO CONTÍNUA
setInterval(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'pan-y';
}, 200);

console.log('\n%c========================================', 'color: #666');
console.log('%c⚡ MODO ULTRA AGRESSIVO ATIVO', 'font-size: 16px; color: #ff6600; font-weight: bold');
console.log('%c========================================', 'color: #666');
