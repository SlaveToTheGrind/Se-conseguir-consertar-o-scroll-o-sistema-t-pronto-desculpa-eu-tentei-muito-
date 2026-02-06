// 🔍 DIAGNÓSTICO - LOCALIZAÇÃO DA CAIXA DE BUSCA
// Cole este script no Console (F12) quando o modal "Ver Vendas" estiver aberto

(function() {
    console.clear();
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c║      🔍 DIAGNÓSTICO - CAIXA DE BUSCA                    ║', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    
    const modal = document.getElementById('soldMotorcyclesModal');
    if (!modal || modal.style.display === 'none') {
        console.error('❌ Modal não está aberto! Abra "Ver Vendas" primeiro.');
        return;
    }
    
    console.log('\n%c═══ 🔍 PROCURANDO CAIXAS DE BUSCA ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    // Procurar por todos os possíveis elementos de busca
    const searchElements = [
        ...modal.querySelectorAll('input[type="text"]'),
        ...modal.querySelectorAll('input[type="search"]'),
        ...modal.querySelectorAll('.search-input'),
        ...modal.querySelectorAll('[placeholder*="uscar"]'),
        ...modal.querySelectorAll('[placeholder*="marca"]'),
        ...modal.querySelectorAll('[placeholder*="modelo"]')
    ];
    
    const uniqueSearches = [...new Set(searchElements)];
    
    console.log(`\n📊 Encontrados ${uniqueSearches.length} elemento(s) de busca:`);
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log(`\n🖥️  Viewport: ${viewportWidth}px × ${viewportHeight}px`);
    
    uniqueSearches.forEach((input, index) => {
        const computed = window.getComputedStyle(input);
        const rect = input.getBoundingClientRect();
        
        console.log(`\n🔍 Elemento ${index + 1}:`);
        console.log(`  ├─ Tag: <${input.tagName.toLowerCase()}>`);
        console.log(`  ├─ ID: ${input.id || '(sem id)'}`);
        console.log(`  ├─ Class: ${input.className || '(sem class)'}`);
        console.log(`  ├─ Placeholder: "${input.placeholder || '(sem placeholder)'}"`);
        console.log(`  ├─ Posição: Top ${rect.top}px, Left ${rect.left}px`);
        console.log(`  ├─ Tamanho: ${rect.width}px × ${rect.height}px`);
        console.log(`  ├─ Display: ${computed.display}`);
        console.log(`  ├─ Visibility: ${computed.visibility}`);
        console.log(`  ├─ Opacity: ${computed.opacity}`);
        console.log(`  ├─ Position: ${computed.position}`);
        console.log(`  └─ Z-Index: ${computed.zIndex}`);
        
        // Verificar se está visível na viewport
        const isVisible = rect.top >= 0 && 
                         rect.left >= 0 && 
                         rect.bottom <= viewportHeight && 
                         rect.right <= viewportWidth &&
                         computed.display !== 'none' &&
                         computed.visibility !== 'hidden' &&
                         parseFloat(computed.opacity) > 0;
        
        if (!isVisible) {
            console.warn(`  ⚠️ PROBLEMA: Elemento está FORA DA VIEWPORT ou INVISÍVEL!`);
            
            if (rect.top < 0) console.warn(`     - Está ${Math.abs(rect.top)}px ACIMA da tela`);
            if (rect.top > viewportHeight) console.warn(`     - Está ${rect.top - viewportHeight}px ABAIXO da tela`);
            if (rect.left < 0) console.warn(`     - Está ${Math.abs(rect.left)}px À ESQUERDA da tela`);
            if (rect.right > viewportWidth) console.warn(`     - Está ${rect.right - viewportWidth}px À DIREITA da tela`);
            if (computed.display === 'none') console.warn(`     - Display: none`);
            if (computed.visibility === 'hidden') console.warn(`     - Visibility: hidden`);
            if (parseFloat(computed.opacity) === 0) console.warn(`     - Opacity: 0`);
        } else {
            console.log(`  ✅ Visível na viewport`);
        }
        
        // Mostrar cadeia de parents
        console.log(`  📊 Parents (5 níveis):`);
        let parent = input.parentElement;
        let level = 1;
        while (parent && parent !== modal && level <= 5) {
            const parentComputed = window.getComputedStyle(parent);
            const parentRect = parent.getBoundingClientRect();
            console.log(`    ${level}. <${parent.tagName.toLowerCase()}> ${parent.id ? '#' + parent.id : ''}`);
            console.log(`       Position: ${parentComputed.position}, Top: ${parentRect.top}px`);
            parent = parent.parentElement;
            level++;
        }
    });
    
    // ========== CORREÇÕES AUTOMÁTICAS ==========
    console.log('\n%c═══ 🔧 APLICANDO CORREÇÕES AUTOMÁTICAS ═══', 'background: #00ff00; color: black; padding: 8px; font-size: 16px; font-weight: bold;');
    
    let correcoes = 0;
    
    uniqueSearches.forEach((input, index) => {
        const rect = input.getBoundingClientRect();
        
        // Se está fora da viewport, tentar corrigir
        if (rect.top < 0 || rect.top > viewportHeight) {
            // Encontrar o container mais próximo
            let container = input.parentElement;
            while (container && container !== modal) {
                const containerRect = container.getBoundingClientRect();
                if (containerRect.top < 0 || containerRect.top > viewportHeight) {
                    // Resetar posição do container
                    container.style.setProperty('position', 'relative', 'important');
                    container.style.setProperty('top', 'auto', 'important');
                    container.style.setProperty('transform', 'none', 'important');
                    console.log(`✅ Corrigido container do elemento ${index + 1}`);
                    correcoes++;
                    break;
                }
                container = container.parentElement;
            }
            
            // Resetar o próprio input
            input.style.setProperty('position', 'relative', 'important');
            input.style.setProperty('top', 'auto', 'important');
            input.style.setProperty('left', 'auto', 'important');
            input.style.setProperty('transform', 'none', 'important');
            input.style.setProperty('margin-top', '0', 'important');
            console.log(`✅ Corrigido elemento ${index + 1}`);
            correcoes++;
        }
        
        // Garantir que está visível
        input.style.setProperty('display', 'block', 'important');
        input.style.setProperty('visibility', 'visible', 'important');
        input.style.setProperty('opacity', '1', 'important');
    });
    
    // Verificar se há um header/topo que pode estar empurrando a busca
    const modalHeader = modal.querySelector('.modal-header');
    const salesHeader = modal.querySelector('.sales-panel-header');
    
    if (modalHeader) {
        const headerRect = modalHeader.getBoundingClientRect();
        console.log(`\n📌 Modal Header encontrado:`);
        console.log(`  Position: Top ${headerRect.top}px, Height ${headerRect.height}px`);
        
        if (headerRect.height > 200) {
            console.warn(`  ⚠️ Header muito alto (${headerRect.height}px)! Pode estar empurrando conteúdo.`);
            modalHeader.style.setProperty('max-height', '120px', 'important');
            correcoes++;
        }
    }
    
    if (salesHeader) {
        const salesRect = salesHeader.getBoundingClientRect();
        console.log(`\n📌 Sales Header encontrado:`);
        console.log(`  Position: Top ${salesRect.top}px, Height ${salesRect.height}px`);
        
        if (salesRect.height > 200) {
            console.warn(`  ⚠️ Sales header muito alto (${salesRect.height}px)!`);
            salesHeader.style.setProperty('max-height', '120px', 'important');
            correcoes++;
        }
    }
    
    // ========== VERIFICAÇÃO PÓS-CORREÇÃO ==========
    console.log('\n%c═══ ✅ VERIFICAÇÃO PÓS-CORREÇÃO ═══', 'background: #0066ff; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
    
    setTimeout(() => {
        console.log(`\n📊 Após correções:`);
        
        uniqueSearches.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            const isVisible = rect.top >= 0 && 
                             rect.top < viewportHeight && 
                             rect.left >= 0 && 
                             rect.left < viewportWidth;
            
            console.log(`  Elemento ${index + 1}: Top ${rect.top.toFixed(0)}px ${isVisible ? '✅' : '❌'}`);
        });
        
        if (correcoes > 0) {
            console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold; font-size: 14px;');
            console.log(`%c║  ✅ ${correcoes} CORREÇÕES APLICADAS!                              ║`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
            console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        }
        
        console.log('\n%c💡 PRÓXIMOS PASSOS:', 'background: #ff6600; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
        console.log('1. Verifique se a caixa de busca agora está visível');
        console.log('2. Se funcionou, identifique qual CSS está causando o problema');
        console.log('3. Procure por "transform", "top", "position: absolute" no CSS');
        console.log('4. Ajuste o admin-styles-dark-modern.css permanentemente');
    }, 100);
    
    return {
        totalElements: uniqueSearches.length,
        elements: uniqueSearches.map((el, i) => ({
            index: i + 1,
            tag: el.tagName,
            id: el.id,
            placeholder: el.placeholder,
            rect: el.getBoundingClientRect()
        })),
        correcoes
    };
})();
