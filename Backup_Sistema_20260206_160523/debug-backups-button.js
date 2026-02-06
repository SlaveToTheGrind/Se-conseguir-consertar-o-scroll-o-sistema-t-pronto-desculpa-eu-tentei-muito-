// 🔍 DEBUG DO BOTÃO BACKUPS
console.log('=== INICIANDO DEBUG DO BOTÃO BACKUPS ===');

// 1. Encontrar o botão
const backupsBtn = document.querySelector('button[onclick*="admin-backups"]');
console.log('1️⃣ Botão encontrado:', backupsBtn);

if (backupsBtn) {
    // 2. Verificar propriedades computadas
    const styles = window.getComputedStyle(backupsBtn);
    console.log('2️⃣ Estilos computados:', {
        display: styles.display,
        visibility: styles.visibility,
        pointerEvents: styles.pointerEvents,
        zIndex: styles.zIndex,
        position: styles.position,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height,
        cursor: styles.cursor
    });

    // 3. Verificar posição na tela
    const rect = backupsBtn.getBoundingClientRect();
    console.log('3️⃣ Posição na tela:', {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        visível: rect.width > 0 && rect.height > 0
    });

    // 4. Verificar elementos que podem estar bloqueando
    const elementsAtClick = document.elementsFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
    );
    console.log('4️⃣ Elementos na posição do clique:', elementsAtClick.map(el => ({
        tag: el.tagName,
        classes: Array.from(el.classList),
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents
    })));

    // 5. Verificar onclick
    console.log('5️⃣ Atributo onclick:', backupsBtn.getAttribute('onclick'));
    console.log('5️⃣ Propriedade onclick:', backupsBtn.onclick);

    // 6. Tentar clicar programaticamente
    console.log('6️⃣ Tentando clicar programaticamente...');
    try {
        backupsBtn.click();
        console.log('✅ Clique programático executado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao clicar:', error);
    }

    // 7. Adicionar listeners de debug
    console.log('7️⃣ Adicionando listeners de debug...');
    
    backupsBtn.addEventListener('touchstart', (e) => {
        console.log('👆 TOUCHSTART detectado!', {
            target: e.target,
            touches: e.touches.length,
            changedTouches: e.changedTouches.length
        });
    }, { passive: false });

    backupsBtn.addEventListener('touchend', (e) => {
        console.log('👆 TOUCHEND detectado!', {
            target: e.target
        });
    }, { passive: false });

    backupsBtn.addEventListener('click', (e) => {
        console.log('🖱️ CLICK detectado!', {
            target: e.target,
            currentTarget: e.currentTarget,
            eventPhase: e.eventPhase,
            bubbles: e.bubbles,
            defaultPrevented: e.defaultPrevented
        });
    });

    // 8. Forçar estilos de debug visual
    console.log('8️⃣ Aplicando estilos de debug visual...');
    backupsBtn.style.cssText += `
        background: red !important;
        border: 5px solid yellow !important;
        z-index: 999999 !important;
        position: relative !important;
        pointer-events: auto !important;
        opacity: 1 !important;
    `;
    console.log('✅ Botão agora está VERMELHO com borda AMARELA');

    // 9. Criar botão de teste sobreposto
    console.log('9️⃣ Criando botão de teste...');
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 TESTE BACKUPS';
    testBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999999;
        padding: 20px;
        background: lime;
        border: 3px solid blue;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
    `;
    testBtn.onclick = () => {
        console.log('🧪 Botão de teste clicado!');
        window.location.href = 'admin-backups.html';
    };
    document.body.appendChild(testBtn);
    console.log('✅ Botão de teste criado no canto superior direito');

} else {
    console.error('❌ BOTÃO NÃO ENCONTRADO!');
    console.log('Procurando por outros métodos...');
    
    const allButtons = document.querySelectorAll('button');
    console.log('Total de botões na página:', allButtons.length);
    
    allButtons.forEach((btn, index) => {
        console.log(`Botão ${index}:`, {
            text: btn.textContent.trim(),
            onclick: btn.getAttribute('onclick'),
            classes: Array.from(btn.classList)
        });
    });
}

console.log('=== FIM DO DEBUG ===');
