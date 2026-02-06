/*
  DevTools deep scroll auditor
  - Instruments CSS property changes (setProperty), classList mutations, setAttribute
  - Observes subtree attribute changes and logs events with stack traces
  - Exposes API: DeepScrollAudit.start(), .stop(), .getLogs(), .forceRevert(), .scanOnce()
  Usage: paste into Console or serve and include as script, then run DeepScrollAudit.start()
*/
(function(){
  if (window.DeepScrollAudit) return;

  const auditLog = [];
  const wraps = {};
  let observer = null;
  const interestingProps = ['overflow','overflow-y','overflow-x','position','touch-action','top','height'];

  function now(){ return (new Date()).toISOString(); }

  function makeRecord(kind, el, details){
    const stack = (new Error()).stack.split('\n').slice(1,10).join('\n');
    const rec = { time: Date.now(), when: now(), kind, target: el && (el.tagName + (el.id?('#'+el.id):('' + (el.className?('.'+el.className):'')))) , details, stack };
    auditLog.push(rec);
    console.warn('DeepScrollAudit:', kind, rec);
    return rec;
  }

  // wrap CSSStyleDeclaration.setProperty to catch style changes like el.style.overflow = 'hidden' and setProperty
  function wrapSetProperty(){
    if (wraps.setProperty) return;
    const proto = CSSStyleDeclaration && CSSStyleDeclaration.prototype;
    if (!proto) return;
    const orig = proto.setProperty;
    proto.setProperty = function(prop, value, priority){
      try{
        const low = (prop || '').toLowerCase();
        if (interestingProps.includes(low) || /overflow|position|touch-action/i.test(low)){
          makeRecord('style.setProperty', this && this.ownerElement ? this.ownerElement : {desc: 'unknown-style-owner'}, { prop: low, value });
        }
      }catch(e){ console.warn('DeepScrollAudit setProperty wrap error', e); }
      return orig.apply(this, arguments);
    };
    wraps.setProperty = true;
  }

  // wrap classList methods
  function wrapClassList(){
    if (wraps.classList) return;
    const methods = ['add','remove','toggle','replace'];
    methods.forEach(m=>{
      const orig = DOMTokenList.prototype[m];
      if (!orig) return;
      DOMTokenList.prototype[m] = function(){
        try{
          const el = this && this.ownerElement ? this.ownerElement : this;
          makeRecord('classList.'+m, el, { args: Array.from(arguments) });
        }catch(e){}
        return orig.apply(this, arguments);
      };
    });
    wraps.classList = true;
  }

  // wrap setAttribute (also catches style/class set via setAttribute)
  function wrapSetAttribute(){
    if (wraps.setAttribute) return;
    const orig = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value){
      try{
        const lname = (name||'').toLowerCase();
        if (lname === 'style' || lname === 'class'){
          makeRecord('setAttribute', this, { attr: lname, value });
        }
      }catch(e){}
      return orig.apply(this, arguments);
    };
    wraps.setAttribute = true;
  }

  // MutationObserver capturing attribute changes in subtree
  function startObserver(){
    if (observer) return { ok:false, reason:'already observing' };
    observer = new MutationObserver(muts=>{
      for (const m of muts){
        try{
          if (m.type === 'attributes'){
            const el = m.target;
            const name = m.attributeName;
            const cs = window.getComputedStyle && window.getComputedStyle(el) || {};
            const overflow = cs.overflow || '';
            const position = cs.position || '';
            const touch = cs['touch-action'] || '';
            const matches = /hidden/.test(overflow) || /fixed/.test(position) || /none/.test(touch);
            if (matches || name === 'style' || name === 'class'){
              makeRecord('mutation', el, { attribute: name, overflow, position, touch });
            }
          }
        }catch(e){ console.warn('DeepScrollAudit observer error', e); }
      }
    });
    try{
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class'], subtree: true });
      observer.observe(document.body, { attributes: true, attributeFilter: ['style','class'], subtree: true });
    }catch(e){
      try{ observer.observe(document, { attributes: true, attributeFilter:['style','class'], subtree: true }); }catch(e){}
    }
    return { ok:true };
  }

  function stopObserver(){
    if (observer){ observer.disconnect(); observer = null; }
    return { ok:true, logs: auditLog.slice() };
  }

  // periodic snapshot monitor for html/body computed differences
  let snapshotInterval = null;
  let lastSnapshot = null;
  function snapshotOnce(){
    try{
      const html = window.getComputedStyle(document.documentElement) || {};
      const body = window.getComputedStyle(document.body) || {};
      const snap = { when: Date.now(), html: { overflow: html.overflow, position: html.position }, body: { overflow: body.overflow, position: body.position } };
      if (!lastSnapshot || snap.html.overflow !== lastSnapshot.html.overflow || snap.html.position !== lastSnapshot.html.position || snap.body.overflow !== lastSnapshot.body.overflow || snap.body.position !== lastSnapshot.body.position){
        lastSnapshot = snap;
        makeRecord('snapshot', document.documentElement, snap);
      }
      return snap;
    }catch(e){ return null; }
  }

  function startSnapshotPolling(ms){
    if (snapshotInterval) return;
    snapshotInterval = setInterval(snapshotOnce, ms || 500);
  }
  function stopSnapshotPolling(){ if (snapshotInterval){ clearInterval(snapshotInterval); snapshotInterval = null; } }

  // force revert last relevant changes (best-effort)
  function forceRevert(){
    // Walk auditLog backwards and try to revert style/class changes on elements
    for (let i = auditLog.length -1; i >=0; i--){
      const r = auditLog[i];
      try{
        if (r.kind === 'style.setProperty' && r.details && r.details.prop){
          const el = r.details && r.details.ownerElement || document.body; // ownerElement is not always set
          // best-effort: clear the property
          if (r.details.prop === 'overflow' || r.details.prop === 'overflow-y' || r.details.prop === 'overflow-x'){
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
          }
          if (r.details.prop === 'position'){
            document.body.style.position = 'static';
          }
        }
        if (r.kind === 'setAttribute' && r.details && r.details.attr === 'style'){
          // best-effort clear style on target
          const t = findElementByDescriptor(r.target);
          if (t && t.style) t.style.cssText = '';
        }
      }catch(e){}
    }
    // final restore
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    return { ok:true };
  }

  function findElementByDescriptor(desc){
    // desc format tag#id or tag.class...
    try{
      if (!desc) return null;
      if (typeof desc !== 'string') return null;
      const idMatch = desc.match(/#([\w-]+)/);
      if (idMatch){ return document.getElementById(idMatch[1]); }
      const tag = desc.split(/[.#]/)[0] || null;
      if (tag) return document.getElementsByTagName(tag)[0] || null;
    }catch(e){}
    return null;
  }

  function scanOnce(){
    // run existing lightweight scans
    const results = { computed: {}, inline: [], sheets: [] };
    try{ results.computed.html = { overflow: window.getComputedStyle(document.documentElement).overflow, position: window.getComputedStyle(document.documentElement).position }; }catch(e){}
    try{ results.computed.body = { overflow: window.getComputedStyle(document.body).overflow, position: window.getComputedStyle(document.body).position }; }catch(e){}
    // inline styles with 'overflow' or 'position'
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all){
      const s = el.getAttribute && el.getAttribute('style');
      if (!s) continue;
      const low = s.toLowerCase();
      if (low.includes('overflow') || low.includes('position') || low.includes('touch-action')) results.inline.push({ who: el.tagName + (el.id?('#'+el.id):''), style: s });
    }
    // stylesheets
    for (const ss of Array.from(document.styleSheets || [])){
      let href = ss.href || '<inline>';
      try{
        const rules = ss.cssRules || ss.rules;
        if (!rules) continue;
        for (const r of Array.from(rules)){
          try{
            const text = r.cssText || '';
            if (/overflow\s*:\s*hidden/i.test(text) || /position\s*:\s*fixed/i.test(text) || /touch-action/i.test(text)){
              results.sheets.push({ sheet: href, text: text.slice(0,200) });
            }
          }catch(e){}
        }
      }catch(e){ results.sheets.push({ sheet: href, error: 'CORS' }); }
    }
    makeRecord('scanOnce', document.documentElement, results);
    return results;
  }

  // initialize wrappers
  function init(){ wrapSetProperty(); wrapClassList(); wrapSetAttribute(); }

  window.DeepScrollAudit = {
    start: function(){ init(); startObserver(); startSnapshotPolling(400); return { ok:true }; },
    stop: function(){ stopSnapshotPolling(); return stopObserver(); },
    getLogs: function(){ return auditLog.slice(); },
    forceRevert: forceRevert,
    scanOnce: scanOnce
  };

  console.log('DeepScrollAudit installed. Use DeepScrollAudit.start() then reproduce the issue. When done, call DeepScrollAudit.stop()');

})();
