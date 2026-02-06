// ============================================
// SCRIPT PARA ENCONTRAR E REMOVER "750cc"
// Cole no DevTools Console (F12)
// ============================================

(function() {
    console.log('🔍 Procurando elemento "750cc"...');
    
    // 1. Procurar por texto "750"
    const allElements = document.querySelectorAll('*');
    const found = [];
    
    allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('750')) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            
            console.log('📦 Elemento encontrado:', {
                element: el,
                text: el.textContent.trim(),
                className: el.className,
                position: style.position,
                top: style.top,
                right: style.right,
                zIndex: style.zIndex,
                rect: rect
            });
            
            found.push(el);
        }
    });
    
    // 2. Procurar elementos position absolute no canto direito
    console.log('\n🎯 Procurando elementos position:absolute no topo direito...');
    
    allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Verificar se está posicionado absolute e no canto superior direito
        if (style.position === 'absolute' && 
            rect.top < 100 && 
            rect.right > window.innerWidth - 100) {
            
            console.log('📌 Position absolute encontrado:', {
                element: el,
                text: el.textContent.trim().substring(0, 50),
                className: el.className,
                top: rect.top,
                right: rect.right,
                zIndex: style.zIndex
            });
            
            if (!found.includes(el)) {
                found.push(el);
            }
        }
    });
    
    // 3. Perguntar qual remover
    if (found.length > 0) {
        console.log(`\n✅ ${found.length} elemento(s) encontrado(s)`);
        console.log('💡 Para remover, use: window.remove750cc(index)');
        console.log('   Exemplo: window.remove750cc(0)');
        
        // Criar função global para remover
        window.remove750cc = function(index) {
            if (found[index]) {
                console.log('🗑️ Removendo elemento:', found[index]);
                found[index].remove();
                console.log('✅ Elemento removido!');
            } else {
                console.log('❌ Índice inválido');
            }
        };
        
        // Criar função para remover TODOS
        window.removeAll750cc = function() {
            console.log(`🗑️ Removendo ${found.length} elementos...`);
            found.forEach((el, i) => {
                console.log(`  ${i}: ${el.textContent.trim().substring(0, 30)}...`);
                el.remove();
            });
            console.log('✅ Todos removidos!');
        };
        
        console.log('💡 Para remover TODOS: window.removeAll750cc()');
        
    } else {
        console.log('❌ Nenhum elemento encontrado');
    }
    
    // 4. Destacar elementos encontrados
    found.forEach((el, i) => {
        el.style.outline = '3px solid red';
        el.setAttribute('data-750cc-index', i);
    });
    
    console.log('\n🎨 Elementos destacados com borda vermelha');
    
})();
