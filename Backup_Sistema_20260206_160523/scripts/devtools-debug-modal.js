/*
  DevTools helper to diagnose why a modal doesn't scroll on desktop.
  Usage: open DevTools Console, paste the entire file content and run it.
  It will:
    - locate the modal (#viewModal, #editModal or .modal)
    - print computed overflow/position for the modal and ancestors
    - detect visible overlay elements that may intercept events
    - attach listeners for 'wheel' and 'touchmove' to log event flow
    - expose a stop() to remove listeners

  After running, reproduce the scroll attempt and paste the console logs here.
*/
(function debugModalScroll(){
    const selectors = ['#viewModal', '#editModal', '.modal', '.modal.show'];

    function findModal(){
        for(const s of selectors){
            const el = document.querySelector(s);
            if(el) return el;
        }
        // fallback: any element with role=dialog
        return document.querySelector('[role="dialog"], [aria-modal="true"]');
    }

    function computedInfo(el){
        const cs = getComputedStyle(el);
        return {
            node: el.tagName.toLowerCase() + (el.id? '#'+el.id : '') + (el.className? ' class="'+el.className+'"' : ''),
            display: cs.display,
            position: cs.position,
            overflow: cs.overflow + ' / ' + cs.overflowY + ' / ' + cs.overflowX,
            pointerEvents: cs.pointerEvents,
            zIndex: cs.zIndex,
            height: el.getBoundingClientRect().height,
            visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
        };
    }

    function logAncestors(el){
        const list = [];
        let cur = el;
        while(cur && cur.nodeType===1){
            list.push(computedInfo(cur));
            cur = cur.parentElement;
        }
        console.group('Modal + ancestors computed styles');
        console.table(list);
        console.groupEnd();
    }

    function findOverlays(modal){
        const rect = modal.getBoundingClientRect();
        const els = Array.from(document.querySelectorAll('body *'));
        const overlappers = els.filter(e=>{
            if(!e || !e.getBoundingClientRect) return false;
            if(e===modal || modal.contains(e) || !e.offsetParent) return false; // skip children or invisible
            const r = e.getBoundingClientRect();
            const intersects = !(r.right < rect.left || r.left > rect.right || r.bottom < rect.top || r.top > rect.bottom);
            if(!intersects) return false;
            const cs = getComputedStyle(e);
            if(cs.pointerEvents==='none') return false;
            if(cs.visibility==='hidden' || cs.display==='none' || cs.opacity=== '0') return false;
            return true;
        });
        console.group('Potential overlays covering modal area');
        if(overlappers.length===0) console.log('Nenhum elemento encontrado que cubra a área do modal');
        overlappers.slice(0,30).forEach(e=> console.log(computedInfo(e), e));
        console.groupEnd();
        return overlappers;
    }

    function prettyTarget(t){
        return (t && t.tagName) ? (t.tagName.toLowerCase() + (t.id? '#'+t.id:'') + (t.className? ' class="'+t.className+'"':'')) : String(t);
    }

    const listeners = [];

    function addLogListener(node, type, opts){
        const fn = function(e){
            try{
                const info = {type, target:prettyTarget(e.target), deltaY: e.deltaY, defaultPrevented: e.defaultPrevented};
                // log capture-time info
                console.log('%c[DBG] ' + type + ' (capture)','color:teal;font-weight:600', info, e);
                // check after propagation
                setTimeout(()=>{
                    console.log('%c[DBG] ' + type + ' (post)','color:purple', {target: prettyTarget(e.target), defaultPrevented: e.defaultPrevented});
                }, 0);
            }catch(err){ console.error(err); }
        };
        node.addEventListener(type, fn, opts);
        listeners.push({node, type, fn, opts});
    }

    function addSimpleListener(node, type, opts){
        const fn = function(e){
            try{ console.log('%c[DBG] ' + type + ' on '+ prettyTarget(e.target),'color:orange', {defaultPrevented: e.defaultPrevented}); }catch(err){console.error(err);} }
        node.addEventListener(type, fn, opts);
        listeners.push({node, type, fn, opts});
    }

    function stop(){
        listeners.forEach(l=> l.node.removeEventListener(l.type, l.fn, l.opts));
        console.log('[DBG] Listeners removidos');
        delete window.__debugModalScroll;
    }

    const modal = findModal();
    if(!modal){ console.warn('Não encontrei modal com seletores padrão. Ajuste os seletores em scripts/devtools-debug-modal.js e tente novamente.'); return; }

    console.log('[DBG] Modal encontrado:', modal);
    logAncestors(modal);
    findOverlays(modal);

    // Attach listeners: capture and bubble quick checks
    addLogListener(document, 'wheel', {capture:true, passive:false});
    addSimpleListener(document, 'wheel', false);
    addLogListener(document, 'mousewheel', {capture:true, passive:false});
    addSimpleListener(window, 'wheel', false);
    addLogListener(document, 'touchmove', {capture:true, passive:false});
    addSimpleListener(document, 'touchmove', false);

    // Highlight modal visually to help user see stacking order
    const origOutline = modal.style.outline;
    modal.style.outline = '3px dashed red';

    // expose stop
    window.__debugModalScroll = { stop, modal, listenersCount: listeners.length };
    console.log('[DBG] debugModalScroll iniciado. Para parar: window.__debugModalScroll.stop()');
    console.log('[DBG] Para inspecionar modal use: window.__debugModalScroll.modal');

    // restore outline when user stops
    const origStop = stop;
    window.__debugModalScroll.stop = function(){ modal.style.outline = origOutline || ''; origStop(); };

})();
