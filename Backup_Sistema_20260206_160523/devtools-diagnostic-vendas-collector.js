// Diagnostic collector for Painel Vendas
// Paste this full file into the browser console (F12) and run `runDiagnosticCollector()`
(function(){
    // Safe serializer for console args
    function safeSerialize(v){
        try{
            if (typeof v === 'string') return v;
            return JSON.parse(JSON.stringify(v, function(key, value){
                if (typeof value === 'function') return `[Function: ${value.name||'anonymous'}]`;
                return value;
            }));
        }catch(e){
            try{ return String(v); }catch(e2){ return '[[unserializable]]'; }
        }
    }

    const originalConsole = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: console.debug ? console.debug.bind(console) : console.log.bind(console)
    };

    const logs = [];
    function pushLog(level, args){
        try{
            logs.push({
                time: new Date().toISOString(),
                level,
                args: Array.from(args).map(a=>safeSerialize(a)),
                url: location.href,
                userAgent: navigator.userAgent
            });
        }catch(e){ /* ignore */ }
    }

    // Override console to capture future logs
    ['log','info','warn','error','debug'].forEach((m)=>{
        console[m] = function(){
            pushLog(m, arguments);
            originalConsole[m].apply(console, arguments);
        };
    });

    // Capture global errors and unhandled rejections
    window.addEventListener('error', function(ev){
        pushLog('error', [`Window error: ${ev.message}`, ev.filename+':'+ev.lineno+':'+ev.colno, ev.error && ev.error.stack]);
    });
    window.addEventListener('unhandledrejection', function(ev){
        pushLog('error', ['UnhandledRejection', ev.reason && (ev.reason.stack || safeSerialize(ev.reason))]);
    });

    // Provide export helpers
    window._diagnosticLogs = logs;
    window.exportDiagnosticLogs = function(){
        const blob = new Blob([JSON.stringify({metadata:{url:location.href,ua:navigator.userAgent,ts:new Date().toISOString()},logs}, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagnostic-logs-'+(new Date().toISOString().replace(/[:.]/g,'-'))+'.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    window.copyDiagnosticLogsToClipboard = async function(){
        try{ await navigator.clipboard.writeText(JSON.stringify({metadata:{url:location.href,ua:navigator.userAgent,ts:new Date().toISOString()},logs}, null, 2)); console.log('✅ Logs copiados para clipboard'); }
        catch(e){ console.warn('⚠️ Falha ao copiar para clipboard:', e); }
    };

    // --- original diagnostic functions (kept behaviour but using captured console) ---
    function checkModalStructure() {
        console.log('\n=== 1. ESTRUTURA DO MODAL ===');
        const modal = document.querySelector('#soldMotorcyclesModal');
        if (!modal) { console.error('❌ Modal #soldMotorcyclesModal não encontrado!'); return; }
        console.log('✅ Modal encontrado:', modal);
        const modalBody = modal.querySelector('.modal-body');
        console.log('Modal Body:', modalBody ? '✅' : '❌', modalBody);
        const statsGrid = modal.querySelector('.stats-grid');
        const salesStats = modal.querySelector('.sales-stats-grid');
        console.log('Stats Grid (.stats-grid):', statsGrid ? '✅' : '❌', statsGrid);
        console.log('Sales Stats Grid (.sales-stats-grid):', salesStats ? '✅' : '❌', salesStats);
        const adminFilters = modal.querySelector('.admin-filters');
        console.log('Admin Filters (inside modal):', adminFilters ? '✅' : '❌', adminFilters);
        // also list any .admin-filters in the document and indicate location
        const allAdminFilters = Array.from(document.querySelectorAll('.admin-filters'));
        if (allAdminFilters.length) {
            console.log(`Encontradas ${allAdminFilters.length} .admin-filters no documento:`);
            allAdminFilters.forEach((el,i)=>{
                const inside = !!el.closest('#soldMotorcyclesModal');
                console.log(`  [${i}] ${inside ? 'inside modal' : 'outside modal'}`, el);
            });
        }
        const allStats = modal.querySelectorAll('.stats-grid');
        const allFilters = modal.querySelectorAll('.admin-filters');
        if (allStats.length > 1) console.warn('⚠️ DUPLICAÇÃO: Encontrados', allStats.length, '.stats-grid');
        if (allFilters.length > 1) console.warn('⚠️ DUPLICAÇÃO: Encontrados', allFilters.length, '.admin-filters');
    }

    function checkComputedStyles() {
        console.log('\n=== 2. ESTILOS COMPUTADOS ===');
        const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) return;
        const statsGrid = modal.querySelector('.stats-grid'); const salesStats = modal.querySelector('.sales-stats-grid');
        const adminFilters = modal.querySelector('.admin-filters');
        if (statsGrid || salesStats) {
            const target = statsGrid || salesStats;
            const styles = window.getComputedStyle(target);
            console.log('📊 Stats Grid (computed for found element):', target);
            console.log('  position:', styles.position);
            console.log('  top:', styles.top);
            console.log('  left:', styles.left);
            console.log('  z-index:', styles.zIndex);
            console.log('  opacity:', styles.opacity);
            console.log('  transform:', styles.transform);
            console.log('  transition:', styles.transition);
            console.log('  will-change:', styles.willChange);
            console.log('  display:', styles.display);
            console.log('  visibility:', styles.visibility);
        }
        if (adminFilters) {
            const styles = window.getComputedStyle(adminFilters);
            console.log('🎛️ Admin Filters (inside modal):');
            console.log('  position:', styles.position);
            console.log('  top:', styles.top);
            console.log('  left:', styles.left);
            console.log('  z-index:', styles.zIndex);
            console.log('  opacity:', styles.opacity);
            console.log('  transform:', styles.transform);
            console.log('  transition:', styles.transition);
            console.log('  will-change:', styles.willChange);
            console.log('  display:', styles.display);
            console.log('  visibility:', styles.visibility);
        }
    }

    function monitorScroll() {
        console.log('\n=== 3. MONITORAMENTO DE SCROLL ===');
        console.log('⏳ Aguardando scroll no modal...');
        const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) return;
        const modalBody = modal.querySelector('.modal-body'); if (!modalBody) { console.error('❌ Modal body não encontrado para monitorar scroll'); return; }
        let scrollCount = 0;
        modalBody.addEventListener('scroll', function() {
            scrollCount++; if (scrollCount > 200) return; // mais logs permitidos
            const statsGrid = modal.querySelector('.stats-grid'); const adminFilters = modal.querySelector('.admin-filters');
            console.log(`📜 SCROLL #${scrollCount}`);
            console.log('  scrollTop:', this.scrollTop);
            console.log('  scrollHeight:', this.scrollHeight);
            console.log('  clientHeight:', this.clientHeight);
            if (statsGrid) {
                const styles = window.getComputedStyle(statsGrid);
                console.log('  Stats opacity:', styles.opacity);
                console.log('  Stats position:', styles.position);
                console.log('  Stats getBoundingClientRect:', statsGrid.getBoundingClientRect());
            }
            if (adminFilters) {
                const styles = window.getComputedStyle(adminFilters);
                console.log('  Filters opacity:', styles.opacity);
                console.log('  Filters position:', styles.position);
                console.log('  Filters getBoundingClientRect:', adminFilters.getBoundingClientRect());
            }
        }, { passive: true });
        console.log('✅ Monitoramento de scroll ativado');
    }

    function checkInlineScripts() {
        console.log('\n=== 4. SCRIPTS INLINE NO MODAL ===');
        const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) return;
        const scripts = modal.querySelectorAll('script');
        console.log('Total de scripts inline no modal:', scripts.length);
        scripts.forEach((script, index) => {
            console.log(`Script #${index + 1}:`, (script.textContent||'').substring(0, 200) + '...');
        });
    }

    function checkEventListeners() {
        console.log('\n=== 5. EVENT LISTENERS ===');
        console.log('ℹ️ Para ver event listeners detalhados, use: getEventListeners(element) no console');
    }

    function checkHierarchy() {
        console.log('\n=== 6. HIERARQUIA DE ELEMENTOS ===');
        const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) return;
        const statsGrid = modal.querySelector('.stats-grid');
        if (statsGrid) {
            console.log('📊 Stats Grid - Caminho:');
            let el = statsGrid; let level = 0;
            while (el && level < 20) {
                const tag = el.tagName ? el.tagName.toLowerCase() : 'text';
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                console.log(`  ${'  '.repeat(level)}↑ ${tag}${id}${classes}`);
                el = el.parentElement; level++;
            }
        }
        const adminFilters = modal.querySelector('.admin-filters');
        if (adminFilters) {
            console.log('🎛️ Admin Filters - Caminho:');
            let el = adminFilters; let level = 0;
            while (el && level < 20) {
                const tag = el.tagName ? el.tagName.toLowerCase() : 'text';
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                console.log(`  ${'  '.repeat(level)}↑ ${tag}${id}${classes}`);
                el = el.parentElement; level++;
            }
        }
    }

    function observeDOM() {
        console.log('\n=== 7. OBSERVADOR DE MUDANÇAS NO DOM ===');
        const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => { if (node.nodeType === 1) console.log('➕ Elemento adicionado:', node); });
                    mutation.removedNodes.forEach(node => { if (node.nodeType === 1) console.log('➖ Elemento removido:', node); });
                } else if (mutation.type === 'attributes') {
                    console.log('🔧 Atributo alterado:', mutation.target, mutation.attributeName, '→', mutation.target.getAttribute(mutation.attributeName));
                }
            });
        });
        observer.observe(modal, { childList: true, attributes: true, attributeOldValue: true, subtree: true });
        console.log('✅ Observador de DOM ativado');
    }

    function testFadeVisually() {
        console.log('\n=== 8. TESTE VISUAL DE FADE ===');
        window.testFade = function(opacity) {
            const modal = document.querySelector('#soldMotorcyclesModal'); if (!modal) { console.error('❌ Modal não encontrado'); return; }
            const statsGrid = modal.querySelector('.stats-grid'); const adminFilters = modal.querySelector('.admin-filters');
            if (statsGrid) { statsGrid.style.opacity = opacity; console.log(`✅ Stats Grid opacity = ${opacity}`); }
            if (adminFilters) { adminFilters.style.opacity = opacity; console.log(`✅ Admin Filters opacity = ${opacity}`); }
        };
        console.log('✅ Função window.testFade() criada');
    }

    // Runner used by user
    window.runDiagnosticCollector = function(){
        console.clear();
        console.log('%c🔍 DIAGNÓSTICO INICIADO (collector)', 'font-size: 16px; color: #00ff00; font-weight: bold');
        try{
            checkModalStructure();
            checkComputedStyles();
            checkInlineScripts();
            checkHierarchy();
            checkEventListeners();
            observeDOM();
            monitorScroll();
            testFadeVisually();
            console.log('%c\n✅ DIAGNÓSTICO COLETOR INICIADO!', 'font-size: 16px; color: #00ff00; font-weight: bold');
            console.log('Use `exportDiagnosticLogs()` para baixar os logs ou `copyDiagnosticLogsToClipboard()` para copiar.');
        }catch(e){ console.error('Erro ao executar diagnóstico:', e); }
    };
    // Try to expose on top frame as well (if same-origin) so console context mismatches are less problematic
    try{
        if (window.top && window.top !== window) {
            window.top.runDiagnosticCollector = window.runDiagnosticCollector;
            window.top.exportDiagnosticLogs = window.exportDiagnosticLogs;
            window.top.copyDiagnosticLogsToClipboard = window.copyDiagnosticLogsToClipboard;
        }
    }catch(e){ /* cross-origin or unavailable, ignore */ }

    console.log('Diagnostic collector instalado. Se `runDiagnosticCollector()` não estiver definido, cole o arquivo como Snippet (Sources → Snippets) e execute lá.');
})();
