/**
 * detect-duplicate-selects.js
 *
 * Script robusto para detectar criação / adição de <select> duplicados
 * - Monitora chamadas a Document.createElement / createElementNS para capturar stack traces
 * - Usa MutationObserver para detectar selects adicionados ao DOM (subtree)
 * - Mantém registros e expõe API em window.__duplicateSelectDetector
 *
 * Uso rápido: cole este arquivo no console da página ou inclua como <script src="/detect-duplicate-selects.js"></script>
 */
(function(){
    if (window.__duplicateSelectDetector) {
        console.warn('duplicateSelectDetector já instalado');
        return;
    }

    const createdInfo = new WeakMap(); // element -> {stack, ts}
    const records = []; // lista ordenada de eventos de adição
    const byId = new Map(); // id -> array of records
    const bySignature = new Map(); // signature -> array of records (detect duplicates without id)
    const byCustom = new Map(); // for custom-select duplicates

    function timestamp(){ return new Date().toISOString(); }

    function shortStack(stack){
        if (!stack) return '';
        return stack.split('\n').slice(0,6).join('\n');
    }

    function getCssPath(el){
        if (!el || !el.tagName) return '';
        const path = [];
        let cur = el;
        while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== 'html') {
            let part = cur.tagName.toLowerCase();
            if (cur.id) part += `#${cur.id}`;
            else if (cur.className && typeof cur.className === 'string') {
                const cls = cur.className.trim().split(/\s+/).slice(0,2).join('.');
                if (cls) part += `.${cls}`;
            }
            path.unshift(part);
            cur = cur.parentElement;
            if (path.length > 12) break;
        }
        return path.join(' > ');
    }

    function recordCreation(el){
        try{
            const stack = (new Error()).stack || '';
            createdInfo.set(el, {stack, ts: Date.now()});
            // try store readable marker for easier inspection
            try { el.dataset.__detector_created = Date.now().toString(); } catch(e){}
        } catch(e) { console.warn('recordCreation failed', e); }
    }

    // Monkey-patch createElement and createElementNS to capture stacks
    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options){
        const el = origCreateElement.call(this, tagName, options);
        try{
            if (String(tagName).toLowerCase() === 'select') recordCreation(el);
        } catch(e) {}
        return el;
    };

    const origCreateElementNS = Document.prototype.createElementNS;
    Document.prototype.createElementNS = function(ns, tagName, options){
        const el = origCreateElementNS.call(this, ns, tagName, options);
        try{
            if (String(tagName).toLowerCase() === 'select') recordCreation(el);
        } catch(e) {}
        return el;
    };

    function makeSignature(el){
        try{
            const tag = (el.tagName || '').toLowerCase();
            const id = el.id || '';
            const name = el.name || '';
            const outer = (el.outerHTML || '').slice(0,500);
            const parent = getCssPath(el.parentElement) || '';
            // simple fingerprint: tag|name|parent|outer length + start
            const outerPreview = outer.slice(0,80);
            return `${tag}|${name}|${parent}|${outerPreview}|len:${outer.length}|id:${id}`;
        } catch(e){ return 'sig_error'; }
    }

    // Handle a select element that appears in the document (either added or preexisting)
    function handleSelectAdded(el, reason='mutation'){
        if (!(el instanceof HTMLSelectElement)) return;
        const rec = {
            ts: Date.now(),
            time: timestamp(),
            reason,
            id: el.id || null,
            name: el.name || null,
            outer: (el.outerHTML || '').slice(0,2000),
            path: getCssPath(el),
            parentTag: el.parentElement ? el.parentElement.tagName : null,
            created: createdInfo.get(el) || null,
            node: el // keep reference
        };
        records.push(rec);
        // signature-based grouping (detect duplicates without id)
        try{
            const sig = makeSignature(el);
            const arrSig = bySignature.get(sig) || [];
            arrSig.push(rec);
            bySignature.set(sig, arrSig);
            if (arrSig.length > 1) {
                console.groupCollapsed(`⚠️ Duplicate signature for selects detected (${arrSig.length} occurrences)`);
                arrSig.forEach((r,i)=>{
                    console.log(`--- Instance #${i+1} @ ${r.time} (${r.reason}) path:${r.path}`);
                    console.log('outerHTML (trim):', r.outer.slice(0,300));
                    console.log('created stack (short):\n', shortStack(r.created && r.created.stack));
                });
                console.groupEnd();
            }
        } catch(e) { console.warn('signature grouping failed', e); }
        if (rec.id) {
            const arr = byId.get(rec.id) || [];
            arr.push(rec);
            byId.set(rec.id, arr);
            if (arr.length > 1) {
                // Found duplicates for same id
                console.groupCollapsed(`⚠️ Duplicate select id="${rec.id}" detected (${arr.length} occurrences)`);
                arr.forEach((r,i)=>{
                    console.log(`--- Instance #${i+1} @ ${r.time} (${r.reason})`);
                    console.log('path:', r.path);
                    console.log('parent:', r.parentTag);
                    console.log('outerHTML (trim):', r.outer);
                    console.log('created stack (short):\n', shortStack(r.created && r.created.stack));
                    try{ console.log('element:', r.node); } catch(e){}
                });
                // also print a unified combined stack hint (first non-empty)
                const firstStack = arr.map(a=>a.created && a.created.stack).find(Boolean);
                if (firstStack) console.log('First creation stack (full):\n', firstStack);
                console.groupEnd();
            }
        }
    }

    // MutationObserver to detect added selects
    const observer = new MutationObserver(function(mutations){
        for (const mu of mutations) {
            for (const node of mu.addedNodes) {
                try {
                    if (node.nodeType !== 1) continue;
                    if (node.tagName && node.tagName.toLowerCase() === 'select') {
                        handleSelectAdded(node, 'mutation_addedNode');
                    }
                    // detect custom-select wrappers added directly
                    try { if (node.classList && node.classList.contains('custom-select')) handleCustomSelectAdded(node, 'mutation_custom_addedNode'); } catch(e){}
                    // find nested selects
                    const nested = node.querySelectorAll ? node.querySelectorAll('select') : [];
                    if (nested && nested.length) {
                        nested.forEach(s => handleSelectAdded(s, 'mutation_nested'));
                    }
                    // find nested custom-selects
                    const nestedCustom = node.querySelectorAll ? node.querySelectorAll('.custom-select') : [];
                    if (nestedCustom && nestedCustom.length) {
                        nestedCustom.forEach(s => handleCustomSelectAdded(s, 'mutation_custom_nested'));
                    }
                } catch(e) { console.warn('observer loop error', e); }
            }
            // also handle attribute changes that might clone/duplicate via innerHTML swaps
        }
    });

    // Start observing the whole document
    try{
        observer.observe(document.documentElement || document, { childList: true, subtree: true });
    } catch(e){ console.warn('Falha ao iniciar MutationObserver', e); }

    // Initial scan of existing selects to populate baseline
    function initialScan(){
        try{
            document.querySelectorAll('select').forEach(s => handleSelectAdded(s, 'initialScan'));
            // also scan for custom-select wrappers
            try { document.querySelectorAll('.custom-select').forEach(c => handleCustomSelectAdded(c, 'initialScan_custom')); } catch(e){}
        } catch(e) { console.warn('initialScan failed', e); }
    }
    initialScan();

    function makeReport(){
        const dupes = [];
        for (const [id, arr] of byId.entries()) {
            if (id && arr.length > 1) dupes.push({id, count: arr.length, instances: arr});
        }
        const sigDupes = [];
        for (const [sig, arr] of bySignature.entries()) {
            if (arr.length > 1) sigDupes.push({signature: sig, count: arr.length, instances: arr});
        }
        const customDupes = [];
        for (const [k, arr] of byCustom.entries()) {
            if (arr.length > 1) customDupes.push({key: k, count: arr.length, instances: arr});
        }
        return {
            timestamp: timestamp(),
            totalFound: records.length,
            duplicates: dupes,
            signatureDuplicates: sigDupes,
            customDuplicates: customDupes,
            rawRecordsCount: records.length
        };
    }

    function prettyReport(){
        const r = makeReport();
        if (!r.duplicates.length) {
            console.log('✅ duplicateSelectDetector: nenhum duplicado por id encontrado até agora.');
            console.log(`Total selects observados: ${r.totalFound}`);
            return r;
        }
        console.groupCollapsed('🔍 duplicateSelectDetector report');
        console.log('timestamp:', r.timestamp);
        console.log('total selects observed:', r.totalFound);
        console.log('duplicate ids found:', r.duplicates.length);
        r.duplicates.forEach(d => {
            console.groupCollapsed(`id="${d.id}" — ${d.count} ocorrências`);
            d.instances.forEach((inst, idx) => {
                console.log(`#${idx+1} @ ${inst.time}`);
                console.log('path:', inst.path);
                console.log('outerHTML (trim):', inst.outer);
                console.log('created stack (short):\n', shortStack(inst.created && inst.created.stack));
            });
            console.groupEnd();
        });
        console.groupEnd();
        return r;
    }

    // Expose API
    window.__duplicateSelectDetector = {
        createdInfo,
        records,
        byId,
        stop: function(){ observer.disconnect(); console.log('duplicateSelectDetector stopped'); },
        start: function(){ observer.observe(document.documentElement || document, { childList: true, subtree: true }); console.log('duplicateSelectDetector started'); },
        report: prettyReport,
        rawReport: makeReport,
        scanNow: function(){ initialScan(); return makeReport(); },
        _internal: { shortStack, getCssPath }
    };

    console.log('✅ duplicateSelectDetector instalado — chame window.__duplicateSelectDetector.report() para um relatório');
})();
