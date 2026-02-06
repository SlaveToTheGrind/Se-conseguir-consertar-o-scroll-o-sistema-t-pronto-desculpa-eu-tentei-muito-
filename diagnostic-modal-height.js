// 🔬 DIAGNÓSTICO - ALTURA E BACKGROUND DO MODAL DE VENDAS
// Cole este script no Console (F12) quando o modal "Ver Vendas" estiver aberto

(function() {
    console.clear();
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c║   🔬 DIAGNÓSTICO - ALTURA DO MODAL DE VENDAS             ║', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #ff6600; font-weight: bold; font-size: 16px;');
    
    const modal = document.getElementById('soldMotorcyclesModal');
    if (!modal || modal.style.display === 'none') {
        console.error('❌ Modal não está aberto! Abra "Ver Vendas" primeiro.');
        return;
    }
    
    console.log('\n%c═══ 📏 ANÁLISE DE DIMENSÕES ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    const modalContent = modal.querySelector('.modal-content');
    const modalBody = modal.querySelector('.modal-body');
    const soldContent = document.getElementById('soldMotorcyclesContent');
    
    function analyzeDimensions(element, name) {
        if (!element) {
            console.log(`\n❌ ${name}: Elemento não encontrado!`);
            return null;
        }
        
        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        console.log(`\n📦 ${name}:`);
        console.log(`  ├─ Width: ${rect.width}px (computed: ${computed.width})`);
        console.log(`  ├─ Height: ${rect.height}px (computed: ${computed.height})`);
        console.log(`  ├─ Min-Height: ${computed.minHeight}`);
        console.log(`  ├─ Max-Height: ${computed.maxHeight}`);
        console.log(`  ├─ Top: ${rect.top}px`);
        console.log(`  ├─ Left: ${rect.left}px`);
        console.log(`  ├─ Bottom: ${rect.bottom}px (viewport: ${window.innerHeight}px)`);
        console.log(`  ├─ Display: ${computed.display}`);
        console.log(`  ├─ Position: ${computed.position}`);
        console.log(`  ├─ Background: ${computed.backgroundColor}`);
        console.log(`  ├─ Padding: ${computed.padding}`);
        console.log(`  ├─ Margin: ${computed.margin}`);
        console.log(`  └─ Overflow: ${computed.overflow} (X: ${computed.overflowX}, Y: ${computed.overflowY})`);
        
        // Verificar se cobre a viewport inteira
        const coversViewport = rect.height >= window.innerHeight;
        if (!coversViewport) {
            console.warn(`  ⚠️ PROBLEMA: Altura (${rect.height}px) < Viewport (${window.innerHeight}px)`);
            console.warn(`  ⚠️ Faltam ${window.innerHeight - rect.height}px para cobrir tudo!`);
        } else {
            console.log(`  ✅ Cobre a viewport completamente`);
        }
        
        return {
            element,
            name,
            width: rect.width,
            height: rect.height,
            minHeight: computed.minHeight,
            maxHeight: computed.maxHeight,
            top: rect.top,
            bottom: rect.bottom,
            background: computed.backgroundColor,
            coversViewport,
            deficit: coversViewport ? 0 : window.innerHeight - rect.height
        };
    }
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log(`\n🖥️  Viewport:`);
    console.log(`  ├─ Width: ${viewportWidth}px`);
    console.log(`  └─ Height: ${viewportHeight}px`);
    
    const modalAnalysis = analyzeDimensions(modal, 'Modal (#soldMotorcyclesModal)');
    const contentAnalysis = analyzeDimensions(modalContent, 'Modal Content (.modal-content)');
    const bodyAnalysis = analyzeDimensions(modalBody, 'Modal Body (.modal-body)');
    const soldAnalysis = analyzeDimensions(soldContent, 'Sold Content (#soldMotorcyclesContent)');
    
    // ========== ANÁLISE DO OVERLAY/BACKDROP ==========
    console.log('\n%c═══ 🎭 ANÁLISE DE OVERLAY/BACKDROP ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    const modalBackdrop = modal.style.background || modal.style.backgroundColor;
    const modalComputed = window.getComputedStyle(modal);
    
    console.log(`\n🎭 Modal Backdrop:`);
    console.log(`  ├─ Inline Background: ${modalBackdrop || 'none'}`);
    console.log(`  ├─ Computed Background: ${modalComputed.backgroundColor}`);
    console.log(`  ├─ Width: ${modal.getBoundingClientRect().width}px`);
    console.log(`  ├─ Height: ${modal.getBoundingClientRect().height}px`);
    console.log(`  ├─ Position: ${modalComputed.position}`);
    console.log(`  └─ Z-Index: ${modalComputed.zIndex}`);
    
    // ========== RESUMO DE PROBLEMAS ==========
    console.log('\n%c═══ 📋 RESUMO DE PROBLEMAS ═══', 'background: #ff0000; color: white; padding: 8px; font-size: 16px; font-weight: bold;');
    
    const problemas = [];
    
    [modalAnalysis, contentAnalysis, bodyAnalysis].forEach(analysis => {
        if (analysis && !analysis.coversViewport) {
            console.log(`\n❌ ${analysis.name}:`);
            console.log(`   Altura atual: ${analysis.height}px`);
            console.log(`   Viewport: ${viewportHeight}px`);
            console.log(`   Déficit: ${analysis.deficit}px`);
            problemas.push(analysis);
        }
    });
    
    if (problemas.length === 0) {
        console.log('\n✅ Todos os elementos cobrem a viewport corretamente!');
    }
    
    // ========== CORREÇÕES AUTOMÁTICAS ==========
    console.log('\n%c═══ 🔧 APLICANDO CORREÇÕES AUTOMÁTICAS ═══', 'background: #00ff00; color: black; padding: 8px; font-size: 16px; font-weight: bold;');
    
    let correcoes = 0;
    
    // Corrigir o modal principal
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('top', '0', 'important');
    modal.style.setProperty('left', '0', 'important');
    modal.style.setProperty('width', '100vw', 'important');
    modal.style.setProperty('height', '100vh', 'important');
    modal.style.setProperty('min-height', '100vh', 'important');
    modal.style.setProperty('background', 'rgba(0, 0, 0, 0.95)', 'important');
    modal.style.setProperty('z-index', '9998', 'important');
    console.log('✅ Modal principal corrigido (100vh)');
    correcoes++;
    
    // Corrigir modal-content
    if (modalContent) {
        modalContent.style.setProperty('width', '100vw', 'important');
        modalContent.style.setProperty('height', '100vh', 'important');
        modalContent.style.setProperty('min-height', '100vh', 'important');
        modalContent.style.setProperty('max-height', '100vh', 'important');
        modalContent.style.setProperty('margin', '0', 'important');
        modalContent.style.setProperty('background', '#0f0f0f', 'important');
        modalContent.style.setProperty('border-radius', '0', 'important');
        console.log('✅ Modal Content corrigido (100vh)');
        correcoes++;
    }
    
    // Corrigir modal-body
    if (modalBody) {
        modalBody.style.setProperty('min-height', '100%', 'important');
        modalBody.style.setProperty('background', '#0f0f0f', 'important');
        console.log('✅ Modal Body corrigido');
        correcoes++;
    }
    
    // Corrigir sold content
    if (soldContent) {
        soldContent.style.setProperty('min-height', '100%', 'important');
        soldContent.style.setProperty('background', '#0f0f0f', 'important');
        console.log('✅ Sold Content corrigido');
        correcoes++;
    }
    
    // ========== VERIFICAÇÃO PÓS-CORREÇÃO ==========
    console.log('\n%c═══ ✅ VERIFICAÇÃO PÓS-CORREÇÃO ═══', 'background: #0066ff; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
    
    setTimeout(() => {
        const modalRect = modal.getBoundingClientRect();
        const contentRect = modalContent?.getBoundingClientRect();
        
        console.log(`\n📊 Após correções:`);
        console.log(`  Modal: ${modalRect.height}px (deve ser ${viewportHeight}px)`);
        if (contentRect) {
            console.log(`  Content: ${contentRect.height}px (deve ser ${viewportHeight}px)`);
        }
        
        const success = modalRect.height >= viewportHeight - 5; // 5px de tolerância
        
        if (success) {
            console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold; font-size: 14px;');
            console.log(`%c║  ✅ ${correcoes} CORREÇÕES APLICADAS COM SUCESSO!                ║`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
            console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        } else {
            console.log('\n%c⚠️ ATENÇÃO: Modal ainda não cobre totalmente!', 'background: yellow; color: black; padding: 8px; font-size: 14px; font-weight: bold;');
            console.log(`Altura atual: ${modalRect.height}px`);
            console.log(`Necessário: ${viewportHeight}px`);
        }
        
        console.log('\n%c💡 PRÓXIMOS PASSOS:', 'background: #ff6600; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
        console.log('1. Verifique se o fundo escuro agora cobre toda a tela');
        console.log('2. Se funcionou, copie os estilos para o CSS');
        console.log('3. Procure por regras CSS conflitantes que estejam limitando a altura');
        console.log('4. Verifique o arquivo admin-styles-dark-modern.css');
    }, 100);
    
    // Retornar dados para inspeção
    return {
        viewport: { width: viewportWidth, height: viewportHeight },
        modal: modalAnalysis,
        content: contentAnalysis,
        body: bodyAnalysis,
        soldContent: soldAnalysis,
        problemas,
        correcoes
    };
})();
