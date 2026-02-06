// 🔧 CORREÇÃO DEFINITIVA - POSIÇÃO DA CAIXA DE BUSCA
// Cole este script no Console (F12) quando o modal "Ver Vendas" estiver aberto

(function() {
    console.clear();
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c║    🔧 CORREÇÃO DEFINITIVA - CAIXA DE BUSCA               ║', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    
    const modal = document.getElementById('soldMotorcyclesModal');
    if (!modal || modal.style.display === 'none') {
        console.error('❌ Modal não está aberto! Abra "Ver Vendas" primeiro.');
        return;
    }
    
    console.log('\n%c═══ 🔍 ANÁLISE COMPLETA ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    // Encontrar TODAS as caixas de busca (incluindo as que estão em cada card)
    const allInputs = modal.querySelectorAll('input[type="text"]');
    
    console.log(`\n📊 Total de inputs encontrados: ${allInputs.length}`);
    
    const viewportHeight = window.innerHeight;
    
    let globalSearch = null;
    const cardSearches = [];
    
    allInputs.forEach((input, index) => {
        const rect = input.getBoundingClientRect();
        const placeholder = input.placeholder || '';
        const computed = window.getComputedStyle(input);
        
        console.log(`\n📌 Input ${index + 1}:`);
        console.log(`  Placeholder: "${placeholder}"`);
        console.log(`  Posição: Top ${rect.top.toFixed(0)}px, Left ${rect.left.toFixed(0)}px`);
        console.log(`  Width: ${rect.width.toFixed(0)}px × Height: ${rect.height.toFixed(0)}px`);
        console.log(`  Position: ${computed.position}`);
        console.log(`  Transform: ${computed.transform}`);
        
        // Identificar se é busca global ou busca de card
        const isCardSearch = placeholder.toLowerCase().includes('buscar') || 
                            input.closest('[data-marca]') !== null;
        
        if (isCardSearch) {
            cardSearches.push({ input, rect, index });
            console.log(`  🃏 BUSCA DE CARD`);
        } else {
            globalSearch = { input, rect, index };
            console.log(`  🔍 BUSCA GLOBAL`);
        }
        
        // Verificar problemas
        if (rect.top < 0) {
            console.warn(`  ⚠️ ACIMA da tela (${Math.abs(rect.top).toFixed(0)}px oculto)`);
        } else if (rect.top > viewportHeight) {
            console.warn(`  ⚠️ ABAIXO da tela (${(rect.top - viewportHeight).toFixed(0)}px fora)`);
        }
        
        // Mostrar parent
        const parent = input.parentElement;
        if (parent) {
            const parentRect = parent.getBoundingClientRect();
            console.log(`  Parent: <${parent.tagName}> ${parent.className.substring(0, 30)}`);
            console.log(`  Parent Top: ${parentRect.top.toFixed(0)}px`);
        }
    });
    
    console.log(`\n📋 Resumo:`);
    console.log(`  Busca Global: ${globalSearch ? 'Encontrada' : 'Não encontrada'}`);
    console.log(`  Buscas de Card: ${cardSearches.length}`);
    
    // ========== CORREÇÕES AUTOMÁTICAS ==========
    console.log('\n%c═══ 🔧 APLICANDO CORREÇÕES ═══', 'background: #00ff00; color: black; padding: 8px; font-size: 16px; font-weight: bold;');
    
    let correcoes = 0;
    
    // Corrigir cada caixa de busca individualmente
    allInputs.forEach((input, index) => {
        const parent = input.parentElement;
        const grandParent = parent?.parentElement;
        
        // RESETAR TODAS AS TRANSFORMAÇÕES E POSICIONAMENTOS
        
        // 1. Remover position: fixed que pode ter sido aplicado
        if (input.style.position === 'fixed') {
            input.style.removeProperty('position');
            console.log(`✅ Removido position:fixed do input ${index + 1}`);
            correcoes++;
        }
        
        // 2. Resetar top/left/transform
        input.style.setProperty('position', 'relative', 'important');
        input.style.setProperty('top', '0', 'important');
        input.style.setProperty('left', '0', 'important');
        input.style.setProperty('right', 'auto', 'important');
        input.style.setProperty('bottom', 'auto', 'important');
        input.style.setProperty('transform', 'none', 'important');
        input.style.setProperty('margin', '0', 'important');
        
        // 3. Corrigir o parent também
        if (parent) {
            parent.style.setProperty('position', 'relative', 'important');
            parent.style.setProperty('top', 'auto', 'important');
            parent.style.setProperty('left', 'auto', 'important');
            parent.style.setProperty('transform', 'none', 'important');
        }
        
        // 4. Corrigir o grandparent se necessário
        if (grandParent && grandParent !== modal) {
            const gpComputed = window.getComputedStyle(grandParent);
            if (gpComputed.position === 'fixed' || gpComputed.position === 'absolute') {
                grandParent.style.setProperty('position', 'relative', 'important');
                grandParent.style.setProperty('top', 'auto', 'important');
                grandParent.style.setProperty('transform', 'none', 'important');
            }
        }
        
        console.log(`✅ Input ${index + 1} corrigido`);
        correcoes++;
    });
    
    // Corrigir o modal principal se estiver com position: fixed
    const modalComputed = window.getComputedStyle(modal);
    if (modalComputed.position === 'fixed') {
        // Manter o modal como fixed PARA cobrir a tela toda
        // MAS garantir que o conteúdo interno flui normalmente
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('top', '0', 'important');
        modal.style.setProperty('left', '0', 'important');
        modal.style.setProperty('width', '100vw', 'important');
        modal.style.setProperty('height', '100vh', 'important');
        modal.style.setProperty('overflow', 'hidden', 'important'); // IMPORTANTE!
        
        console.log('✅ Modal mantido como fixed (correto para cobrir tela)');
        
        // Mas garantir que modal-content é relative
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.setProperty('position', 'relative', 'important');
            modalContent.style.setProperty('top', 'auto', 'important');
            modalContent.style.setProperty('left', 'auto', 'important');
            modalContent.style.setProperty('transform', 'none', 'important');
            console.log('✅ Modal content resetado para relative');
            correcoes++;
        }
        
        // E modal-body também
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.style.setProperty('position', 'relative', 'important');
            modalBody.style.setProperty('top', 'auto', 'important');
            modalBody.style.setProperty('transform', 'none', 'important');
            modalBody.style.setProperty('overflow-y', 'auto', 'important');
            console.log('✅ Modal body resetado para relative');
            correcoes++;
        }
        
        // Sold content com scroll
        const soldContent = document.getElementById('soldMotorcyclesContent');
        if (soldContent) {
            soldContent.style.setProperty('position', 'relative', 'important');
            soldContent.style.setProperty('top', 'auto', 'important');
            soldContent.style.setProperty('transform', 'none', 'important');
            console.log('✅ Sold content resetado');
            correcoes++;
        }
    }
    
    // ========== VERIFICAÇÃO PÓS-CORREÇÃO ==========
    console.log('\n%c═══ ✅ VERIFICAÇÃO PÓS-CORREÇÃO ═══', 'background: #0066ff; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
    
    setTimeout(() => {
        console.log(`\n📊 Após correções:`);
        
        allInputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.top < viewportHeight;
            
            console.log(`  Input ${index + 1}: Top ${rect.top.toFixed(0)}px ${isVisible ? '✅ OK' : '❌ FORA'}`);
        });
        
        console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        console.log(`%c║  ✅ ${correcoes} CORREÇÕES APLICADAS!                              ║`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
        console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        
        console.log('\n%c📋 REGRAS CSS PARA APLICAR PERMANENTEMENTE:', 'background: #ff6600; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
        console.log('\n/* No admin-styles-dark-modern.css: */');
        console.log(`
#soldMotorcyclesModal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    overflow: hidden !important;
}

#soldMotorcyclesModal .modal-content,
#soldMotorcyclesModal .modal-body,
#soldMotorcyclesModal #soldMotorcyclesContent {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
}

/* Corrigir TODAS as caixas de busca */
#soldMotorcyclesModal input[type="text"],
#soldMotorcyclesModal .search-input {
    position: relative !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
    margin: 0 !important;
}
        `);
        
        console.log('\n%c💡 PRÓXIMOS PASSOS:', 'background: #ff6600; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
        console.log('1. Verifique se TODAS as caixas de busca agora estão nos lugares corretos');
        console.log('2. Copie o CSS acima');
        console.log('3. Cole no arquivo admin-styles-dark-modern.css');
        console.log('4. Salve e recarregue a página');
    }, 150);
    
    return {
        totalInputs: allInputs.length,
        correcoes
    };
})();
