// ================================================================
// 🔥 DIAGNÓSTICO TOTAL + FIX NUCLEAR
// ================================================================

console.clear();
console.log('%c🔥 DIAGNÓSTICO TOTAL', 'font-size: 24px; color: #ff0000; font-weight: bold');

// === DIAGNÓSTICO ===
console.log('\n📋 VERIFICANDO TUDO:\n');

const html = document.documentElement;
const body = document.body;
const htmlStyles = getComputedStyle(html);
const bodyStyles = getComputedStyle(body);

console.log('HTML:');
console.log('  overflow:', htmlStyles.overflow);
console.log('  overflow-y:', htmlStyles.overflowY);
console.log('  height:', htmlStyles.height);
console.log('  position:', htmlStyles.position);
console.log('  touch-action:', htmlStyles.touchAction);

console.log('\nBODY:');
console.log('  overflow:', bodyStyles.overflow);
console.log('  overflow-y:', bodyStyles.overflowY);
console.log('  height:', bodyStyles.height);
console.log('  min-height:', bodyStyles.minHeight);
console.log('  position:', bodyStyles.position);
console.log('  touch-action:', bodyStyles.touchAction);
console.log('  pointer-events:', bodyStyles.pointerEvents);

console.log('\nDIMENSÕES:');
console.log('  scrollHeight:', html.scrollHeight);
console.log('  clientHeight:', html.clientHeight);
console.log('  window.innerHeight:', window.innerHeight);
console.log('  Pode rolar?', html.scrollHeight > window.innerHeight ? 'SIM ✅' : 'NÃO ❌');

console.log('\nSCROLL:');
console.log('  scrollY atual:', window.scrollY);
console.log('  scrollTop:', html.scrollTop);

// === FIX NUCLEAR ===
console.log('\n%c🔥 APLICANDO FIX NUCLEAR', 'font-size: 20px; color: #ff6600; font-weight: bold');

// 1. REMOVER TODOS OS ESTILOS
console.log('1️⃣ Removendo todos os CSS...');
document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
    if (!el.id || !el.id.includes('force')) {
        el.disabled = true;
    }
});

// 2. ADICIONAR CSS MÍNIMO
const minimalCSS = document.createElement('style');
minimalCSS.id = 'minimal-scroll-css';
minimalCSS.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
        overflow: auto !important;
        overflow-y: scroll !important;
        overflow-x: hidden !important;
        position: static !important;
        height: auto !important;
        min-height: 100% !important;
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch !important;
        pointer-events: auto !important;
    }
    body {
        background: #0f0f0f !important;
        color: white !important;
        padding: 20px !important;
    }
    .test-scroll {
        height: 3000px;
        background: repeating-linear-gradient(
            0deg,
            #1a1a1a 0px,
            #1a1a1a 100px,
            #ff6600 100px,
            #ff6600 102px
        );
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        text-align: center;
    }
`;
document.head.appendChild(minimalCSS);

// 3. SIMPLIFICAR BODY
console.log('2️⃣ Simplificando conteúdo...');
const originalContent = body.innerHTML;

// Adicionar área de teste ENORME
const testArea = document.createElement('div');
testArea.className = 'test-scroll';
testArea.innerHTML = `
    <div>
        <h1 style="margin-bottom: 20px;">🎯 TESTE DE SCROLL</h1>
        <p style="font-size: 1.5rem;">Arraste esta área com o dedo</p>
        <p style="font-size: 1.2rem; margin-top: 20px;">↓ Desça ↓</p>
    </div>
`;
body.appendChild(testArea);

// 4. FORÇAR ATRIBUTOS INLINE
console.log('3️⃣ Forçando inline styles...');
html.setAttribute('style', 'overflow:auto!important;height:auto!important;touch-action:pan-y!important');
body.setAttribute('style', 'overflow:auto!important;min-height:300vh!important;touch-action:pan-y!important;pointer-events:auto!important');

// 5. TESTAR SCROLL
console.log('4️⃣ Testando scroll...');
window.scrollTo(0, 0);

setTimeout(() => {
    window.scrollTo(0, 500);
    
    setTimeout(() => {
        const scrolled = window.scrollY;
        console.log('\n📊 RESULTADO:');
        console.log('  Scroll Y:', scrolled);
        console.log('  scrollHeight:', html.scrollHeight);
        console.log('  Scrollou?', scrolled > 0 ? '✅ SIM' : '❌ NÃO');
        
        if (scrolled > 0) {
            console.log('\n%c✅✅✅ SCROLL FUNCIONA! ✅✅✅', 'font-size: 20px; color: #00ff00; font-weight: bold; background: #000; padding: 10px;');
            console.log('%c👆 TENTE ROLAR A ÁREA LARANJA COM O DEDO', 'font-size: 16px; color: #ffaa00');
            console.log('\nSe funcionar, o problema estava no CSS original.');
            console.log('Para voltar ao normal, recarregue a página (F5)');
        } else {
            console.log('\n%c❌ SCROLL CONTINUA TRAVADO', 'font-size: 20px; color: #ff0000; font-weight: bold');
            console.log('\n🔍 Isso indica um problema no NAVEGADOR ou DISPOSITIVO:');
            console.log('1. Tente abrir em modo anônimo');
            console.log('2. Tente outro navegador (Firefox, Edge)');
            console.log('3. Verifique se não tem extensões bloqueando');
            console.log('4. Verifique configurações de acessibilidade do Android');
        }
    }, 500);
}, 100);

console.log('\n%c========================================', 'color: #666');
console.log('%c🔥 FIX NUCLEAR APLICADO', 'font-size: 16px; color: #ff6600; font-weight: bold');
console.log('%c========================================', 'color: #666');
