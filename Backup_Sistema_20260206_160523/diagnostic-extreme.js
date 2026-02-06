// 🔬 DIAGNÓSTICO EXTREMO - PAINEL DE VENDAS
// Cole este script no Console (F12) quando o modal "Ver Vendas" estiver aberto

(function() {
    console.clear();
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'color: #ff6600; font-weight: bold; font-size: 14px;');
    console.log('%c║     🔬 DIAGNÓSTICO EXTREMO - PAINEL DE VENDAS            ║', 'color: #ff6600; font-weight: bold; font-size: 14px;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #ff6600; font-weight: bold; font-size: 14px;');
    
    const modal = document.getElementById('soldMotorcyclesModal');
    if (!modal || modal.style.display === 'none') {
        console.error('❌ Modal não está aberto! Abra "Ver Vendas" primeiro.');
        return;
    }
    
    // ========== PROBLEMA 1: BACKGROUND TRANSPARENTE ==========
    console.log('\n%c═══ 🎨 ANÁLISE DE BACKGROUND ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    const modalContent = modal.querySelector('.modal-content');
    const modalBody = modal.querySelector('.modal-body');
    const soldContent = document.getElementById('soldMotorcyclesContent');
    
    function analyzeBackground(element, name) {
        const computed = window.getComputedStyle(element);
        const bgColor = computed.backgroundColor;
        const bgImage = computed.backgroundImage;
        
        console.log(`\n📦 ${name}:`);
        console.log(`  Background Color: ${bgColor}`);
        console.log(`  Background Image: ${bgImage}`);
        console.log(`  Opacity: ${computed.opacity}`);
        console.log(`  Display: ${computed.display}`);
        console.log(`  Position: ${computed.position}`);
        console.log(`  Z-Index: ${computed.zIndex}`);
        
        // Verificar se é transparente
        const rgba = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgba) {
            const alpha = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;
            if (alpha < 1) {
                console.warn(`  ⚠️ PROBLEMA: Background semi-transparente (alpha: ${alpha})`);
                return { element, name, problem: 'transparent', alpha };
            }
        }
        
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
            console.warn(`  ⚠️ PROBLEMA: Background totalmente transparente`);
            return { element, name, problem: 'transparent', alpha: 0 };
        }
        
        console.log(`  ✅ Background opaco`);
        return null;
    }
    
    const bgProblems = [];
    const problem1 = analyzeBackground(modal, 'Modal');
    if (problem1) bgProblems.push(problem1);
    
    [[modalContent, 'Modal Content'], [modalBody, 'Modal Body'], [soldContent, 'Sold Content']].forEach(([el, name]) => {
        if (el) {
            const problem = analyzeBackground(el, name);
            if (problem) bgProblems.push(problem);
        }
    });
    
    // ========== PROBLEMA 2: DROPDOWNS SOBREPOSTOS ==========
    console.log('\n%c═══ 🎯 ANÁLISE DE DROPDOWNS E Z-INDEX ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    const filtros = [
        { id: 'soldMarcaFilter', name: 'Filtro Marca' },
        { id: 'monthFilter', name: 'Filtro Mês' }
    ];
    
    function analyzeZIndexHierarchy(element, name) {
        console.log(`\n🔍 ${name}:`);
        
        if (!element) {
            console.error('  ❌ Elemento não encontrado!');
            return null;
        }
        
        const computed = window.getComputedStyle(element);
        console.log(`  Position: ${computed.position}`);
        console.log(`  Z-Index: ${computed.zIndex}`);
        console.log(`  Display: ${computed.display}`);
        console.log(`  Visibility: ${computed.visibility}`);
        console.log(`  Opacity: ${computed.opacity}`);
        
        // Analisar toda cadeia de parents
        console.log(`  📊 Cadeia de Parents (10 níveis):`);
        let parent = element.parentElement;
        let level = 1;
        const chain = [];
        
        while (parent && parent !== document.body && level <= 10) {
            const parentComputed = window.getComputedStyle(parent);
            const info = {
                level,
                tag: parent.tagName,
                id: parent.id || '(sem id)',
                class: parent.className || '(sem class)',
                position: parentComputed.position,
                zIndex: parentComputed.zIndex,
                overflow: parentComputed.overflow,
                overflowX: parentComputed.overflowX,
                overflowY: parentComputed.overflowY,
                isolation: parentComputed.isolation,
                transform: parentComputed.transform,
                filter: parentComputed.filter,
                willChange: parentComputed.willChange,
                element: parent
            };
            
            chain.push(info);
            
            console.log(`    Nível ${level}: <${info.tag}> ${info.id !== '(sem id)' ? '#' + info.id : ''}`);
            console.log(`      Position: ${info.position} | Z-Index: ${info.zIndex}`);
            console.log(`      Overflow: ${info.overflow} (X: ${info.overflowX}, Y: ${info.overflowY})`);
            
            // Detectar stacking contexts
            if (info.isolation !== 'auto' || 
                info.position === 'fixed' || 
                info.position === 'sticky' ||
                (info.position !== 'static' && info.zIndex !== 'auto') ||
                info.transform !== 'none' ||
                info.filter !== 'none' ||
                info.willChange !== 'auto') {
                console.warn(`      ⚠️ Cria STACKING CONTEXT!`);
            }
            
            // Detectar overflow hidden
            if (info.overflow === 'hidden' || info.overflowX === 'hidden' || info.overflowY === 'hidden') {
                console.warn(`      ⚠️ OVERFLOW HIDDEN - pode clipar dropdown!`);
            }
            
            parent = parent.parentElement;
            level++;
        }
        
        return { element, name, computed, chain };
    }
    
    const filtroAnalysis = filtros.map(f => {
        const el = document.getElementById(f.id);
        return analyzeZIndexHierarchy(el, f.name);
    }).filter(Boolean);
    
    // ========== ANÁLISE DE CARDS ==========
    console.log('\n%c═══ 🃏 ANÁLISE DE CARDS ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    const cards = modal.querySelectorAll('[data-marca]');
    console.log(`📊 Total de cards encontrados: ${cards.length}`);
    
    if (cards.length > 0) {
        const firstCard = cards[0];
        const cardComputed = window.getComputedStyle(firstCard);
        console.log(`\n🃏 Primeiro Card (exemplo):`);
        console.log(`  Position: ${cardComputed.position}`);
        console.log(`  Z-Index: ${cardComputed.zIndex}`);
        console.log(`  Display: ${cardComputed.display}`);
        
        // Verificar parent do card
        const cardParent = firstCard.parentElement;
        const cardParentComputed = window.getComputedStyle(cardParent);
        console.log(`\n  📦 Parent do Card:`);
        console.log(`    Position: ${cardParentComputed.position}`);
        console.log(`    Z-Index: ${cardParentComputed.zIndex}`);
        console.log(`    Overflow: ${cardParentComputed.overflow}`);
    }
    
    // ========== DETECTAR STACKING CONTEXTS ==========
    console.log('\n%c═══ 🔬 STACKING CONTEXTS DETECTADOS ═══', 'background: #2a2a2a; color: #ff6600; padding: 8px; font-size: 14px; font-weight: bold;');
    
    function detectStackingContexts(container) {
        const all = container.querySelectorAll('*');
        const contexts = [];
        
        all.forEach(el => {
            const computed = window.getComputedStyle(el);
            const createsContext = 
                computed.isolation !== 'auto' ||
                computed.position === 'fixed' ||
                computed.position === 'sticky' ||
                (computed.position !== 'static' && computed.zIndex !== 'auto') ||
                computed.transform !== 'none' ||
                computed.filter !== 'none' ||
                computed.willChange !== 'auto' ||
                parseFloat(computed.opacity) < 1;
            
            if (createsContext) {
                contexts.push({
                    element: el,
                    tag: el.tagName,
                    id: el.id || '(sem id)',
                    class: el.className.substring(0, 30) || '(sem class)',
                    position: computed.position,
                    zIndex: computed.zIndex,
                    reason: []
                });
                
                const last = contexts[contexts.length - 1];
                if (computed.isolation !== 'auto') last.reason.push('isolation');
                if (computed.position === 'fixed') last.reason.push('position:fixed');
                if (computed.position === 'sticky') last.reason.push('position:sticky');
                if (computed.position !== 'static' && computed.zIndex !== 'auto') last.reason.push('position+z-index');
                if (computed.transform !== 'none') last.reason.push('transform');
                if (computed.filter !== 'none') last.reason.push('filter');
                if (computed.willChange !== 'auto') last.reason.push('will-change');
                if (parseFloat(computed.opacity) < 1) last.reason.push('opacity');
            }
        });
        
        return contexts;
    }
    
    const stackingContexts = detectStackingContexts(modal);
    console.log(`📊 Total de stacking contexts: ${stackingContexts.length}`);
    
    stackingContexts.slice(0, 10).forEach((ctx, i) => {
        console.log(`\n${i + 1}. <${ctx.tag}> ${ctx.id !== '(sem id)' ? '#' + ctx.id : ''}`);
        console.log(`   Position: ${ctx.position} | Z-Index: ${ctx.zIndex}`);
        console.log(`   Razão: ${ctx.reason.join(', ')}`);
    });
    
    if (stackingContexts.length > 10) {
        console.log(`\n... e mais ${stackingContexts.length - 10} stacking contexts`);
    }
    
    // ========== RESUMO DE PROBLEMAS ==========
    console.log('\n%c═══ 📋 RESUMO DE PROBLEMAS ═══', 'background: #ff0000; color: white; padding: 8px; font-size: 16px; font-weight: bold;');
    
    const problemas = [];
    
    if (bgProblems.length > 0) {
        console.log('\n🎨 PROBLEMAS DE BACKGROUND:');
        bgProblems.forEach(p => {
            console.log(`  ❌ ${p.name}: Background transparente (alpha: ${p.alpha})`);
            problemas.push({ tipo: 'background', ...p });
        });
    }
    
    // Verificar se filtros têm z-index menor que cards
    if (filtroAnalysis.length > 0 && cards.length > 0) {
        const filtroZIndex = parseInt(filtroAnalysis[0].computed.zIndex) || 0;
        const cardZIndex = parseInt(window.getComputedStyle(cards[0]).zIndex) || 0;
        
        console.log(`\n🎯 COMPARAÇÃO Z-INDEX:`);
        console.log(`  Filtros: ${filtroZIndex}`);
        console.log(`  Cards: ${cardZIndex}`);
        
        if (cardZIndex >= filtroZIndex) {
            console.log(`  ❌ Cards têm z-index >= filtros!`);
            problemas.push({ tipo: 'zindex', detail: 'cards >= filtros' });
        }
    }
    
    // Verificar overflow hidden na cadeia
    filtroAnalysis.forEach(f => {
        const overflowHidden = f.chain.filter(p => 
            p.overflow === 'hidden' || p.overflowX === 'hidden' || p.overflowY === 'hidden'
        );
        
        if (overflowHidden.length > 0) {
            console.log(`\n📦 ${f.name}: ${overflowHidden.length} parent(s) com overflow hidden:`);
            overflowHidden.forEach(p => {
                console.log(`  ❌ Nível ${p.level}: <${p.tag}> ${p.id !== '(sem id)' ? '#' + p.id : ''}`);
                problemas.push({ tipo: 'overflow', filtro: f.name, parent: p });
            });
        }
    });
    
    // ========== CORREÇÕES AUTOMÁTICAS ==========
    console.log('\n%c═══ 🔧 APLICANDO CORREÇÕES AUTOMÁTICAS ═══', 'background: #00ff00; color: black; padding: 8px; font-size: 16px; font-weight: bold;');
    
    let correcoes = 0;
    
    // Corrigir backgrounds
    bgProblems.forEach(p => {
        p.element.style.setProperty('background', '#0f0f0f', 'important');
        p.element.style.setProperty('background-color', '#0f0f0f', 'important');
        console.log(`✅ Corrigido background: ${p.name}`);
        correcoes++;
    });
    
    // Corrigir z-index dos filtros e toda cadeia
    filtroAnalysis.forEach(f => {
        f.element.style.setProperty('z-index', '10000', 'important');
        f.element.style.setProperty('position', 'relative', 'important');
        
        // Corrigir toda cadeia de parents
        f.chain.forEach((p, i) => {
            if (i < 3) { // Primeiros 3 níveis
                p.element.style.setProperty('z-index', `${10000 - i - 1}`, 'important');
                p.element.style.setProperty('position', 'relative', 'important');
                p.element.style.setProperty('overflow', 'visible', 'important');
                p.element.style.setProperty('overflow-x', 'visible', 'important');
                p.element.style.setProperty('overflow-y', 'visible', 'important');
            }
        });
        
        console.log(`✅ Corrigido z-index e overflow: ${f.name}`);
        correcoes++;
    });
    
    // Corrigir z-index dos cards
    cards.forEach(card => {
        card.style.setProperty('z-index', '1', 'important');
        card.style.setProperty('position', 'relative', 'important');
    });
    if (cards.length > 0) {
        console.log(`✅ Corrigido z-index de ${cards.length} cards`);
        correcoes++;
    }
    
    // ========== RESULTADO FINAL ==========
    console.log('\n%c╔════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold; font-size: 14px;');
    console.log(`%c║  ✅ ${correcoes} CORREÇÕES APLICADAS!                              ║`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold; font-size: 14px;');
    
    console.log('\n%c💡 INSTRUÇÕES:', 'background: #ff6600; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
    console.log('1. Verifique se os dropdowns agora aparecem corretamente');
    console.log('2. Verifique se o fundo está opaco (#0f0f0f)');
    console.log('3. Se funcionou, copie os valores de z-index acima para o CSS');
    console.log('4. Se ainda não funcionar, tire screenshot do console e mostre ao desenvolvedor');
    
    // Retornar dados para inspeção
    return {
        problemas,
        bgProblems,
        filtroAnalysis,
        stackingContexts,
        cards: cards.length,
        correcoes
    };
})();
