(function(){
  // DevTools helper to audit scroll-blocking issues end-to-end
  // Usage (paste into Console or include as <script src="/devtools-check-scroll.js"></script>):
  //   DevScrollCheck.run();
  //   DevScrollCheck.scanInline();
  //   DevScrollCheck.scanStyleSheets();
  //   DevScrollCheck.startObserver(); // interact with UI to capture who changes styles
  //   DevScrollCheck.stopObserver();

  if (window.DevScrollCheck) return; // don't double-define

  function computedInfo(el){
    try{
      const cs = window.getComputedStyle(el);
      return {
        overflow: (cs.overflow || '') + ' / ' + (cs.overflowY || '') + ' / ' + (cs.overflowX || ''),
        position: cs.position,
        top: cs.top,
        height: cs.height
      };
    }catch(e){ return {error: String(e)}; }
  }

  function isFullscreenFixed(el){
    try{
      const cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed') return false;
      const r = el.getBoundingClientRect();
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      return (r.width >= vw * 0.85 && r.height >= vh * 0.85) || (Math.abs(r.top) < 2 && Math.abs(r.left) < 2 && Math.abs(r.bottom - vh) < 2 && Math.abs(r.right - vw) < 2);
    }catch(e){ return false; }
  }

  function scanInline(){
    const findings = [];
    // html/body computed
    findings.push({ who: 'html', info: computedInfo(document.documentElement) });
    findings.push({ who: 'body', info: computedInfo(document.body) });

    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all){
      const s = el.getAttribute && el.getAttribute('style');
      if (!s) continue;
      const low = s.toLowerCase();
      if (low.includes('overflow:hidden') || low.includes('overflow: hidden') || low.includes('position:fixed') || low.includes('position: fixed') || low.includes('position: absolute')){
        findings.push({ who: (el.tagName || '').toLowerCase() + (el.id?('#'+el.id):''), style: s, computed: computedInfo(el), isFullscreenFixed: isFullscreenFixed(el), el });
      }
    }
    return findings;
  }

  function scanStyleSheets(){
    const hits = [];
    for (const ss of Array.from(document.styleSheets)){
      let href = ss.href || '<inline>'; 
      try{
        const rules = ss.cssRules || ss.rules;
        if (!rules) continue;
        for (const r of Array.from(rules)){
          try{
            const text = r.cssText || '';
            const sel = r.selectorText || '';
            if (/overflow\s*:\s*hidden/i.test(text) || /position\s*:\s*fixed/i.test(text)){
              hits.push({ sheet: href, selector: sel || text.split('{')[0].trim(), text });
            }
          }catch(e){}
        }
      }catch(ex){
        // cross-origin stylesheet
        hits.push({ sheet: href, error: 'CORS/cross-origin stylesheet - cannot read rules' });
      }
    }
    return hits;
  }

  // observer & instrumentation
  let observer = null;
  const mutationLog = [];

  function startObserver(opts){
    if (!document.body) return { ok: false, reason: 'no body' };
    opts = opts || {};
    if (observer) return { ok: false, reason: 'already observing' };
    observer = new MutationObserver(muts=>{
      for (const m of muts){
        try{
          if (m.type === 'attributes' && (m.attributeName === 'style' || m.attributeName === 'class')){
            const el = m.target;
            const cs = window.getComputedStyle(el);
            const overflow = (cs && cs.overflow) || '';
            const position = (cs && cs.position) || '';
            const matches = /hidden/.test(overflow) || /fixed/.test(position);
            if (matches){
              const stack = (new Error()).stack.split('\n').slice(1,8).join('\n');
              const rec = { time: Date.now(), target: el.tagName + (el.id?('#'+el.id):''), overflow, position, mutation: m, stack };
              mutationLog.push(rec);
              console.warn('DevScrollCheck observer: blocking change detected', rec);
            }
          }
        }catch(e){ console.warn('DevScrollCheck observer error', e); }
      }
    });

    // observe both root and body for attribute changes
    try{
      // Observe subtree=true so attribute changes on descendant elements are captured
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class'], subtree: true });
      observer.observe(document.body, { attributes: true, attributeFilter: ['style','class'], subtree: true });
    }catch(e){
      try{ observer.observe(document, { attributes: true, attributeFilter:['style','class'], subtree: true }); }catch(e){}
    }

    // wrap setAttribute to catch style attr changes faster
    if (!Element.prototype.__devscroll_setattr_wrapped){
      Element.prototype.__devscroll_orig_setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, val){
        try{
          if (name === 'style' || name === 'class'){
            const stack = (new Error()).stack.split('\n').slice(1,8).join('\n');
            mutationLog.push({ time: Date.now(), target: this.tagName + (this.id?('#'+this.id):''), attr: name, value: val, stack, note: 'via setAttribute' });
          }
        }catch(e){}
        return Element.prototype.__devscroll_orig_setAttribute.apply(this, arguments);
      };
      Element.prototype.__devscroll_setattr_wrapped = true;
    }

    return { ok: true };
  }

  function stopObserver(){
    if (observer){ observer.disconnect(); observer = null; }
    return { ok: true, logs: mutationLog.slice() };
  }

  function getLogs(){ return mutationLog.slice(); }

  function forceFix(){
    try{
      // Try to use existing helpers if available
      if (window.ScrollDiag && typeof window.ScrollDiag.forceScroll === 'function'){
        return window.ScrollDiag.forceScroll();
      }
      if (typeof window.unlockBodyScrollSafe === 'function'){
        window.unlockBodyScrollSafe(); return true;
      }
      // last resort: set body/html inline
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      return true;
    }catch(e){ console.warn('DevScrollCheck forceFix error', e); return false; }
  }

  function runAll(){
    return { computed: { html: computedInfo(document.documentElement), body: computedInfo(document.body) }, inline: scanInline(), sheets: scanStyleSheets() };
  }

  window.DevScrollCheck = {
    computedInfo,
    scanInline,
    scanStyleSheets,
    startObserver,
    stopObserver,
    getLogs,
    forceFix,
    runAll
  };

  console.log('DevScrollCheck installed. Use `DevScrollCheck.runAll()` and `DevScrollCheck.startObserver()`');
})();
