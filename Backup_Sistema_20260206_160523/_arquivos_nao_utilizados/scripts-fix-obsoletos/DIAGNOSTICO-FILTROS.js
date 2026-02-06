// ============================================
// DIAGNÓSTICO DE CLIQUES NOS FILTROS
// Cole no DevTools Console (F12)
// ============================================

(function() {
    console.log('🔍 Diagnosticando filtros...');
    
    // 1. Encontrar área de filtros
    const filtersContainer = document.querySelector('.filters-container');
    const filterGroups = document.querySelectorAll('.filter-group');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    console.log('📦 Elementos encontrados:', {
        filtersContainer,
        filterGroups: filterGroups.length,
        filterBtns: filterBtns.length
    });
    
    // 2. Verificar estilos dos filtros
    if (filtersContainer) {
        const style = window.getComputedStyle(filtersContainer);
        console.log('🎨 Estilos do container:', {
            position: style.position,
            zIndex: style.zIndex,
            pointerEvents: style.pointerEvents,
            top: style.top,
            display: style.display
        });
    }
    
    // 3. Verificar cada botão de filtro
    filterBtns.forEach((btn, i) => {
        const style = window.getComputedStyle(btn);
        console.log(`🔘 Botão ${i}:`, {
            text: btn.textContent.trim(),
            pointerEvents: style.pointerEvents,
            cursor: style.cursor,
            zIndex: style.zIndex
        });
    });
    
    // 4. Procurar elementos que possam estar cobrindo
    const rect = filtersContainer?.getBoundingClientRect();
    if (rect) {
        console.log('\n🎯 Procurando elementos sobre os filtros...');
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        
        console.log('📌 Elemento no centro dos filtros:', {
            element: elementAtPoint,
            className: elementAtPoint?.className,
            tagName: elementAtPoint?.tagName
        });
        
        // Verificar todos os elementos em diferentes pontos
        const points = [
            [rect.left + 50, rect.top + 50],
            [rect.right - 50, rect.top + 50],
            [centerX, centerY]
        ];
        
        points.forEach(([x, y], i) => {
            const el = document.elementFromPoint(x, y);
            console.log(`Ponto ${i} (${x}, ${y}):`, el?.className || el?.tagName);
        });
    }
    
    // 5. Criar função de teste
    window.testFilterClick = function() {
        console.log('🧪 Testando clique programático...');
        if (filterBtns.length > 0) {
            filterBtns[0].click();
            console.log('✅ Click() executado no primeiro botão');
        }
    };
    
    console.log('\n💡 Use: window.testFilterClick() para testar clique programático');
    
})();
