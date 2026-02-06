// Mobile Debug Injector
// Usage: include this script in the page (temporary) to get an on-screen Debug button
// that loads deep auditors (devtools-deep-scroll-audit.js and touch-event-debug.js) and
// lets you start/stop and view logs on the device without Console access.
(function(){
  if (window.MobileDebugInjector) return;
  window.MobileDebugInjector = true;

  // Dynamic fallback: enforce touch-action: pan-y on appointment-related elements
  // This helps when CSS specificity or inline styles prevent panning on mobile.
  function installTouchActionFallback(){
    try{
      const SEL = '.appointment-card, .appointment-card *, .appointment-info, .motorcycle-info, .info-row, #appointmentsList, .content-area, main';
      function applyTo(el){
        try{
          if (!el || !el.style) return;
          // only change if not already permissive (avoid overwriting explicit pan-y)
          el.style.touchAction = 'pan-y';
          el.style.msTouchAction = 'pan-y';
        }catch(e){}
      }
      function sweep(){
        try{ document.querySelectorAll(SEL).forEach(applyTo); }catch(e){}
      }
      sweep();
      // observe additions to DOM and reapply
      if (window.__touchActionFallback && window.__touchActionFallback.observer) return;
      const obs = new MutationObserver((mutations)=>{ sweep(); });
      obs.observe(document.documentElement || document.body, { childList:true, subtree:true });
      window.__touchActionFallback = { observer: obs, selector: SEL };
      console.log('TouchActionFallback installed for', SEL);
    }catch(e){ console.warn('installTouchActionFallback error', e); }
  }

  function uninstallTouchActionFallback(){
    try{
      if (window.__touchActionFallback && window.__touchActionFallback.observer){ window.__touchActionFallback.observer.disconnect(); }
      window.__touchActionFallback = null;
      console.log('TouchActionFallback removed');
    }catch(e){ console.warn('uninstallTouchActionFallback error', e); }
  }

  function createButton(){
    const btn = document.createElement('button');
    btn.id = 'mobile-debug-btn';
    btn.textContent = 'DBG';
    Object.assign(btn.style, { position:'fixed', right:'12px', bottom:'12px', zIndex:2147483646, background:'#ff7a18', color:'#111', border:'none', padding:'10px 12px', borderRadius:'10px', fontWeight:700, boxShadow:'0 6px 18px rgba(0,0,0,0.35)', touchAction:'none' });
    btn.addEventListener('click', togglePanel);
    // make draggable for touch
    makeDraggable(btn);
    document.body.appendChild(btn);
    // adjust if SD toggle exists (avoid overlap)
    adjustButtonForSd(btn);
    // install dynamic touch-action fallback so mobile panning is allowed
    try{ installTouchActionFallback(); }catch(e){ console.warn('installTouchActionFallback failed', e); }
  }

  function adjustButtonForSd(btn){
    try{
      const sd = document.getElementById('sd-toggle') || document.querySelector('.sd-toggle') || document.querySelector('#SD') || document.querySelector('[id^="sd"]');
      if (!sd) return;
      const r = sd.getBoundingClientRect();
      // move btn above the sd element
      const extra = 8;
      const newBottom = (window.innerHeight - r.top) + extra;
      btn.style.bottom = (newBottom)+'px';
    }catch(e){}
    // observe changes on sd visibility/position
    try{
      const ro = new MutationObserver(()=>{ adjustButtonForSd(btn); });
      ro.observe(document.body, { attributes:true, subtree:true, attributeFilter:['style','class'] });
    }catch(e){}
  }

  function makeDraggable(el){
    let startY=0, startX=0, origBottom=0, origRight=0, touching=false;
    function toFixedPx(v){ return Math.max(6, Math.round(v))+'px'; }
    el.addEventListener('touchstart', function(e){
      touching = true;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      origBottom = parseInt(getComputedStyle(el).bottom || '12px',10);
      origRight = parseInt(getComputedStyle(el).right || '12px',10);
    }, {passive:false});
    el.addEventListener('touchmove', function(e){
      if (!touching) return;
      const t = e.touches[0];
      const dy = startY - t.clientY; // drag up increases bottom
      const dx = startX - t.clientX; // drag left increases right
      el.style.bottom = toFixedPx(origBottom + dy);
      el.style.right = toFixedPx(origRight + dx);
      e.preventDefault();
    }, {passive:false});
    el.addEventListener('touchend', function(){ touching = false; }, {passive:true});
  }

  function loadScriptOnce(src){
    return new Promise((res,rej)=>{
      if (document.querySelector('script[data-src="'+src+'"]')) return res();
      const s = document.createElement('script');
      s.setAttribute('data-src', src);
      s.src = src;
      s.onload = ()=>res();
      s.onerror = (e)=>rej(e);
      document.head.appendChild(s);
    });
  }

  // panel UI
  let panel = null;
  function createPanel(){
    panel = document.createElement('div');
    panel.id = 'mobile-debug-panel';
    Object.assign(panel.style, { position:'fixed', right:'12px', bottom:'64px', zIndex:2147483646, width:'92vw', maxWidth:'420px', height:'40vh', background:'rgba(0,0,0,0.85)', color:'#fff', borderRadius:'12px', padding:'8px', boxSizing:'border-box', overflow:'auto', fontSize:'12px', display:'flex', flexDirection:'column', gap:'8px' });
    // make the panel non-blocking by default so touches pass through to the page
    panel.style.pointerEvents = 'none';

    const header = document.createElement('div');
    header.style.display='flex'; header.style.gap='8px'; header.style.alignItems='center';
    const title = document.createElement('div'); title.textContent = 'Debug Mobile'; title.style.fontWeight='700'; header.appendChild(title);

    const startBtn = document.createElement('button'); startBtn.textContent='Start'; Object.assign(startBtn.style,{marginLeft:'auto'});
    startBtn.addEventListener('click', startAudits);
    const stopBtn = document.createElement('button'); stopBtn.textContent='Stop'; stopBtn.addEventListener('click', stopAudits);
    header.appendChild(startBtn); header.appendChild(stopBtn);

    // allow interaction with header controls
    header.style.pointerEvents = 'auto';
    panel.appendChild(header);

      // close button (small X) for mobile — place inside header to avoid overlap
      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label','Fechar debug');
      closeBtn.textContent = '✕';
      Object.assign(closeBtn.style, { background:'transparent', border:'none', color:'#fff', fontSize:'18px', padding:'4px', cursor:'pointer', marginLeft:'8px' });
      closeBtn.addEventListener('click', ()=>{ panel.style.display='none'; });
      // add to header so layout avoids overlapping header controls
      header.appendChild(closeBtn);

    const out = document.createElement('pre'); out.id='mobile-debug-output'; out.style.flex='1'; out.style.margin='0'; out.style.whiteSpace='pre-wrap'; out.style.overflow='auto'; out.style.fontSize='12px'; panel.appendChild(out);

    const footer = document.createElement('div'); footer.style.display='flex'; footer.style.gap='8px'; footer.style.alignItems='center';
      const revert = document.createElement('button'); revert.textContent='Revert'; revert.addEventListener('click', ()=>{ try{ if (window.DeepScrollAudit) window.DeepScrollAudit.forceRevert(); if (window.DevScrollCheck) DevScrollCheck.forceFix(); removeInjectedFix(); try{ uninstallTouchActionFallback(); }catch(e){} }catch(e){ console.warn(e); } });
      const fixBtn = document.createElement('button'); fixBtn.textContent = 'Fix Scroll'; fixBtn.addEventListener('click', ()=>{ applyQuickFix(); }); fixBtn.style.pointerEvents='auto';
    const clear = document.createElement('button'); clear.textContent='Clear'; clear.addEventListener('click', ()=>{ out.textContent=''; });
    const copyBtn = document.createElement('button'); copyBtn.textContent = 'Copiar'; copyBtn.addEventListener('click', ()=>{ copyOutput(); });
    const downloadBtn = document.createElement('button'); downloadBtn.textContent = 'Baixar'; downloadBtn.addEventListener('click', ()=>{ downloadOutput(); });
    const inspectBtn = document.createElement('button'); inspectBtn.id = 'mobile-inspect-btn'; inspectBtn.textContent = 'Inspecionar toque'; inspectBtn.addEventListener('click', ()=>{ enableInspectMode(); });
    const findScrollBtn = document.createElement('button'); findScrollBtn.textContent = 'Find Scrollable'; findScrollBtn.addEventListener('click', ()=>{ enableFindScrollableMode(); }); findScrollBtn.style.pointerEvents='auto';
    const touchTraceBtn = document.createElement('button'); touchTraceBtn.textContent = 'Log Touch Trace'; touchTraceBtn.addEventListener('click', ()=>{ toggleTouchTrace(touchTraceBtn); }); touchTraceBtn.style.pointerEvents='auto';
      footer.appendChild(revert); footer.appendChild(clear); footer.appendChild(copyBtn); footer.appendChild(downloadBtn); footer.appendChild(inspectBtn); footer.appendChild(fixBtn); footer.appendChild(findScrollBtn); footer.appendChild(touchTraceBtn);
    // make footer controls interactive
    footer.style.pointerEvents = 'auto';
    // ensure individual buttons accept pointer events even though panel is passthrough
    revert.style.pointerEvents = 'auto'; clear.style.pointerEvents = 'auto'; copyBtn.style.pointerEvents = 'auto'; downloadBtn.style.pointerEvents = 'auto'; inspectBtn.style.pointerEvents = 'auto';
    panel.appendChild(footer);

    document.body.appendChild(panel);
  }

  function copyOutput(){
    try{
      const out = panel && panel.querySelector('#mobile-debug-output');
      if (!out) return alert('Nada para copiar');
      const text = out.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(()=> alert('Logs copiados para a área de transferência'))
        .catch(()=> fallbackCopy(text));
      } else fallbackCopy(text);
    }catch(e){ console.warn(e); }
  }

  function fallbackCopy(text){
    try{
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Logs copiados (método fallback)');
    }catch(e){ alert('Falha ao copiar. Use Baixar para salvar o arquivo.'); }
  }

  function downloadOutput(){
    try{
      const out = panel && panel.querySelector('#mobile-debug-output');
      if (!out) return alert('Nada para baixar');
      const text = out.textContent || '';
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'dev-logs.txt'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); document.body.removeChild(a); }, 1500);
    }catch(e){ console.warn(e); alert('Falha ao baixar logs'); }
  }

  // Inspect-on-touch: one-shot capture of top elements at touch point
  let inspectMode = false;
  function enableInspectMode(){
    if (!panel) return; const btn = panel.querySelector('#mobile-inspect-btn');
    inspectMode = true;
    if (btn) btn.textContent = 'Toque para inspecionar...';
    appendOutput('Inspect mode enabled: toque na página para capturar elementos no ponto tocado.');
    function handler(e){
      try{
        const t = (e.touches && e.touches[0]) || e;
        const x = t.clientX, y = t.clientY;
        const elems = document.elementsFromPoint(x,y) || [];
        const records = elems.slice(0,8).map(el=>{
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { tag: el.tagName, id: el.id||null, class: el.className||null, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, position: cs.position, overflow: cs.overflow, touchAction: cs.touchAction||cs['-ms-touch-action']||null, pointerEvents: cs.pointerEvents, zIndex: cs.zIndex };
        });
        appendOutput('Inspect at '+x+','+y+':\n'+JSON.stringify(records, null, 2));
      }catch(err){ appendOutput('Inspect error: '+String(err)); }
      finally{
        inspectMode = false;
        if (btn) btn.textContent = 'Inspecionar toque';
        document.removeEventListener('touchstart', handler, true);
        document.removeEventListener('pointerdown', handler, true);
      }
    }
    document.addEventListener('touchstart', handler, true);
    document.addEventListener('pointerdown', handler, true);
  }

  // Find nearest scrollable ancestor at touch point (one-shot)
  let findScrollMode = false;
  function enableFindScrollableMode(){
    if (!panel) return; const btn = panel.querySelector('#mobile-debug-output');
    findScrollMode = true;
    appendOutput('FindScroll mode enabled: toque na página para identificar o ancestral rolável mais próximo.');
    function handler(e){
      try{
        const t = (e.touches && e.touches[0]) || e;
        const x = t.clientX, y = t.clientY;
        const elems = document.elementsFromPoint(x,y) || [];
        // for each element, climb ancestors to find first scrollable
        const results = [];
        for (let el of elems.slice(0,8)){
          let cur = el;
          while(cur && cur !== document.documentElement){
            const cs = getComputedStyle(cur);
            const overflowY = cs.overflowY || cs.overflow;
            const scrollable = (overflowY === 'auto' || overflowY === 'scroll' || cur.scrollHeight > cur.clientHeight);
            if (scrollable){
              results.push({ startElement: el.tagName, candidate: cur.tagName, id: cur.id||null, class: cur.className||null, overflowY, scrollHeight: cur.scrollHeight, clientHeight: cur.clientHeight });
              break;
            }
            cur = cur.parentElement;
          }
        }
        appendOutput('FindScroll at '+x+','+y+':\n'+JSON.stringify(results, null, 2));
      }catch(err){ appendOutput('FindScroll error: '+String(err)); }
      finally{
        findScrollMode = false;
        document.removeEventListener('touchstart', handler, true);
        document.removeEventListener('pointerdown', handler, true);
      }
    }
    document.addEventListener('touchstart', handler, true);
    document.addEventListener('pointerdown', handler, true);
  }

  // Touch trace: capture-phase listener to log which element receives touchmove/pointermove
  let __touchTrace = { onMove:null, onStart:null, enabled:false };
  function toggleTouchTrace(btn){
    if (!__touchTrace.enabled){
      btn.textContent = 'Tracing... (tap to stop)'; __touchTrace.enabled = true;
      __touchTrace.onMove = function(e){
        try{
          const t = (e.touches && e.touches[0]) || e;
          const x = t.clientX, y = t.clientY;
          const target = e.target;
          const elems = document.elementsFromPoint(x,y) || [];
          const top = elems[0] || target;
          const cs = getComputedStyle(top);
          const info = {
            time: Date.now(),
            eventType: e.type,
            targetTag: top.tagName,
            id: top.id||null,
            class: top.className||null,
            rect: (function(){ try{ const r=top.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)} }catch(e){return null;} })(),
            position: cs.position, overflow: cs.overflow, touchAction: cs.touchAction||cs['-ms-touch-action'], pointerEvents: cs.pointerEvents, zIndex: cs.zIndex
          };
          appendOutput('TouchTrace: '+JSON.stringify(info));
        }catch(err){ appendOutput('TouchTrace error: '+String(err)); }
      };
      __touchTrace.onStart = function(e){
        // start listening to moves at capture
        document.addEventListener('touchmove', __touchTrace.onMove, {passive:true, capture:true});
        document.addEventListener('pointermove', __touchTrace.onMove, {passive:true, capture:true});
      };
      document.addEventListener('touchstart', __touchTrace.onStart, {capture:true});
      document.addEventListener('pointerdown', __touchTrace.onStart, {capture:true});
      appendOutput('Touch trace enabled: perform the gesture (first moves will be logged).');
    } else {
      btn.textContent = 'Log Touch Trace'; __touchTrace.enabled = false;
      try{
        document.removeEventListener('touchstart', __touchTrace.onStart, {capture:true});
        document.removeEventListener('pointerdown', __touchTrace.onStart, {capture:true});
        document.removeEventListener('touchmove', __touchTrace.onMove, {capture:true});
        document.removeEventListener('pointermove', __touchTrace.onMove, {capture:true});
      }catch(e){}
      appendOutput('Touch trace disabled');
    }
  }

    // Quick CSS fix for scroll: inject touch-action and -webkit-overflow-scrolling
    function applyQuickFix(){
      try{
        const id = 'mobile-debug-scroll-fix';
        if (document.getElementById(id)) { appendOutput('Quick fix already applied'); return; }
        const css = '\n/* Mobile debug injected scroll fix */\n#appointmentsList, .content-area, main { -webkit-overflow-scrolling: touch; touch-action: pan-y !important; }\n#appointmentsList * { touch-action: auto !important; }\n.appointment-card { touch-action: auto !important; }\n';
        const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
        appendOutput('Quick scroll fix applied (injected CSS id='+id+').');
        // also install overflow guard for .content-area to avoid creating an empty scroll container
        try{ installOverflowGuard(); }catch(e){ /* ignore */ }
      }catch(e){ appendOutput('applyQuickFix error: '+String(e)); }
    }

    function removeInjectedFix(){
      try{
        const id = 'mobile-debug-scroll-fix'; const el = document.getElementById(id); if (el){ el.parentNode.removeChild(el); appendOutput('Removed injected quick scroll fix.'); }
        try{ uninstallOverflowGuard(); }catch(e){}
      }catch(e){ /* ignore */ }
    }

    // Overflow guard: toggle content-area overflow between auto and visible when content doesn't need scrolling
    let __overflowGuard = { target: null, original: null, ro: null, onResize: null };
    function installOverflowGuard(){
      const target = document.querySelector('.content-area') || document.querySelector('main');
      if (!target) return;
      if (__overflowGuard.target === target) return;
      __overflowGuard.target = target;
      __overflowGuard.original = target.style.overflowY || '';
      function update(){
        try{
          if (!__overflowGuard.target) return;
          const t = __overflowGuard.target;
          if (t.scrollHeight <= t.clientHeight) {
            t.style.overflowY = 'visible';
          } else {
            t.style.overflowY = 'auto';
          }
        }catch(e){}
      }
      update();
      __overflowGuard.onResize = ()=>{ update(); };
      window.addEventListener('resize', __overflowGuard.onResize);
      // observe mutations that may change size/content
      try{
        __overflowGuard.ro = new MutationObserver(()=>{ update(); });
        __overflowGuard.ro.observe(document.body, { childList:true, subtree:true, attributes:true, characterData:true });
      }catch(e){}
      appendOutput('Overflow guard installed for '+(__overflowGuard.target.tagName||'element'));
    }

    function uninstallOverflowGuard(){
      try{
        if (__overflowGuard.onResize) window.removeEventListener('resize', __overflowGuard.onResize);
        if (__overflowGuard.ro) { __overflowGuard.ro.disconnect(); __overflowGuard.ro = null; }
        if (__overflowGuard.target) { __overflowGuard.target.style.overflowY = __overflowGuard.original || ''; __overflowGuard.target = null; }
        appendOutput('Overflow guard removed');
      }catch(e){}
    }

  async function startAudits(){
    try{
      // try to load deep auditor and touch debug from same folder
      await loadScriptOnce('/devtools-deep-scroll-audit.js').catch(()=>loadScriptOnce('/devtools-deep-scroll-audit.js'));
      await loadScriptOnce('/touch-event-debug.js').catch(()=>loadScriptOnce('/touch-event-debug.js'));
      // also ensure DevScrollCheck available (lighter auditor)
      await loadScriptOnce('/devtools-check-scroll.js').catch(()=>{});

      if (window.DeepScrollAudit) DeepScrollAudit.start();
      if (window.TouchDebug) { /* TouchDebug installs listeners on load */ }
      appendOutput('Auditors started. Reproduce interaction now.');
    }catch(e){ appendOutput('Failed to load auditors: '+String(e)); }
  }

  function stopAudits(){
    try{
      let logs = [];
      if (window.DeepScrollAudit){ const r = DeepScrollAudit.stop(); logs.push('DeepScrollAudit.stop -> '+JSON.stringify(r)); logs = logs.concat(DeepScrollAudit.getLogs().map(l=>JSON.stringify(l).slice(0,800))); }
      if (window.TouchDebug){ logs.push('TouchDebug logs:'); logs = logs.concat(TouchDebug.getLogs().map(l=>JSON.stringify(l).slice(0,400))); }
      if (window.DevScrollCheck){ const r = DevScrollCheck.stopObserver(); logs.push('DevScrollCheck.stopObserver -> '+JSON.stringify(r)); }
      appendOutput(logs.join('\n\n'));
    }catch(e){ appendOutput('stopAudits error: '+String(e)); }
  }

  function appendOutput(txt){
    if (!panel) return; const out = panel.querySelector('#mobile-debug-output'); if (!out) return; out.textContent += '\n'+txt; out.scrollTop = out.scrollHeight;
  }

  function togglePanel(){
    // preserve scroll positions to avoid layout jump when showing the panel
    const content = document.querySelector('.content-area') || document.querySelector('main');
    const state = { docScroll: document.documentElement.scrollTop || document.body.scrollTop, bodyScroll: document.body.scrollTop, contentScroll: content ? content.scrollTop : null };
    if (!panel) createPanel();
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    // restore scroll after panel is added (delay to allow layout tasks)
    setTimeout(()=>{
      try{
        if (content && state.contentScroll !== null) content.scrollTop = state.contentScroll;
        document.documentElement.scrollTop = state.docScroll || 0;
        document.body.scrollTop = state.bodyScroll || 0;
      }catch(e){}
    }, 20);
  }

  // init UI after DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{ createButton(); }); else createButton();

  console.log('MobileDebugInjector ready — use the orange DBG button to open the debug panel.');

})();
