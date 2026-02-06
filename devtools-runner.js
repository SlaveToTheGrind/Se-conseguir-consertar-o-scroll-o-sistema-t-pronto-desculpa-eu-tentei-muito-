/*
  DevTools Runner - unified script to run scroll diagnostics
  Usage: paste the file into the DevTools Console on the page (or include as a script temporarily).
  It will attempt to call existing diagnostics (DevScrollCheck, DeepScrollAudit, TouchDebug)
  and produce a JSON report downloadable from the page.

  Minimal, reversible quick-fixes are included for interactive testing:
    - DevToolsRunner.disableCenterOverlays()  -> hides elements covering center point (temporary)
    - DevToolsRunner.revertDisableOverlays()   -> restores previously hidden elements
    - DevToolsRunner.applyTouchFix()           -> sets touch-action: pan-y on likely containers
    - DevToolsRunner.revertTouchFix()          -> reverts the inline styles applied by applyTouchFix

  This script intentionally avoids UI buttons and works via console calls only.
*/
(function(){
  if (window.DevToolsRunner) return console.log('DevToolsRunner already installed');
  const runner = { report: null, _savedStyles: [], _disabledEls: [], lastStatus: null };

  function loadIfMissing(name, src){
    return new Promise((res)=>{
      if (window[name]){ runner.lastStatus = { ok:true, action:'loadIfMissing', name, reason:'already' }; return res({ ok:true, reason:'already' }); }
      try{
        const s = document.createElement('script'); s.src = src; s.async = false; s.setAttribute('data-devtools-runner', '1');
        s.onload = ()=>{ runner.lastStatus = { ok:true, action:'loadIfMissing', name }; res({ ok:true }); };
        s.onerror = ()=>{ runner.lastStatus = { ok:false, action:'loadIfMissing', name, reason:'loadfail' }; res({ ok:false, reason:'loadfail' }); };
        document.head.appendChild(s);
      }catch(e){ runner.lastStatus = { ok:false, action:'loadIfMissing', name, error: String(e) }; res({ ok:false, reason:String(e) }); }
    });
  }

  async function ensureDiagnostics(){
    // try to rely on in-repo filenames; if missing, proceed gracefully
    const wants = [
      { name:'DevScrollCheck', src:'/devtools-check-scroll.js' },
      { name:'DeepScrollAudit', src:'/devtools-deep-scroll-audit.js' },
      { name:'TouchDebug', src:'/touch-event-debug.js' }
    ];
    for (const w of wants){
      if (!window[w.name]){
        // attempt to load from same folder
        // eslint-disable-next-line no-await-in-loop
        await loadIfMissing(w.name, w.src);
      }
    }
  }

  function safeCall(fn, fallback){
    try{ return fn(); }catch(e){ return fallback || { error: String(e) }; }
  }

  runner.runAll = async function(){
    console.log('DevToolsRunner: ensuring diagnostics...');
    await ensureDiagnostics();
    const report = { when: new Date().toISOString(), url: location.href, results: {}, env: { ua: navigator.userAgent } };

    // DevScrollCheck.runAll / scan
    report.results.devScroll = safeCall(()=>{
      if (window.DevScrollCheck && typeof DevScrollCheck.runAll === 'function') return DevScrollCheck.runAll();
      if (window.DevScrollCheck && typeof DevScrollCheck.runAll === 'undefined') return { note:'DevScrollCheck present but runAll missing', availableMethods: Object.keys(DevScrollCheck || {}) };
      return { note:'DevScrollCheck not available' };
    });

    // Deep audit scanOnce and logs
    report.results.deepAudit = safeCall(()=>{
      const r = {};
      if (window.DeepScrollAudit){
        if (typeof DeepScrollAudit.scanOnce === 'function') r.scan = DeepScrollAudit.scanOnce();
        if (typeof DeepScrollAudit.getLogs === 'function') r.logs = DeepScrollAudit.getLogs().slice(-200);
      } else r.note = 'DeepScrollAudit not available';
      return r;
    });

    // Touch debug findings
    report.results.touchDebug = safeCall(()=>{
      const r = {};
      if (window.TouchDebug){
        if (typeof TouchDebug.findCoveringElements === 'function') r.covering = TouchDebug.findCoveringElements();
        if (typeof TouchDebug.findTouchActionIssues === 'function') r.touchActionIssues = TouchDebug.findTouchActionIssues();
        if (typeof TouchDebug.getLogs === 'function') r.logs = TouchDebug.getLogs().slice(-400);
      } else r.note = 'TouchDebug not available';
      return r;
    });

    // Perform a quick center-point elements snapshot (like the bookmarklet)
    report.results.centerPoint = safeCall(()=>{
      const center = { x: Math.round(innerWidth/2), y: Math.round(innerHeight/2) };
      const elems = document.elementsFromPoint(center.x, center.y) || [];
      return elems.slice(0,12).map(el=>{
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, id: el.id||null, class: el.className||null, rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }, position: cs.position, overflow: cs.overflow, touchAction: cs.touchAction, pointerEvents: cs.pointerEvents, zIndex: cs.zIndex };
      });
    });

    runner.report = report;
    runner.lastStatus = { ok:true, action:'runAll', when: report.when };
    console.log('DevToolsRunner: report ready — call DevToolsRunner.exportReport() to download or inspect DevToolsRunner.report');
    return report;
  };

  runner.exportReport = function(filename){
    try{
      const data = JSON.stringify(runner.report || { when:new Date().toISOString(), note:'no report run' }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = (filename||('devtools-report-'+(new Date().toISOString().replace(/[:.]/g,'-'))+'.json')); document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
      runner.lastStatus = { ok:true, action:'exportReport', filename: filename || null };
      return true;
    }catch(e){ console.warn('exportReport failed', e); return false; }
  };

  // Quick temporary overlay disable: hide elements that cover center point
  runner.disableCenterOverlays = function(filterFn){
    try{
      const center = { x: Math.round(innerWidth/2), y: Math.round(innerHeight/2) };
      const elems = document.elementsFromPoint(center.x, center.y) || [];
      const toDisable = elems.filter(el=> el && el.nodeType===1 && el !== document.documentElement && el !== document.body).slice(0,8);
      for (const el of toDisable){
        if (filterFn && !filterFn(el)) continue;
        runner._disabledEls.push({ el: el, style: el.getAttribute('style') || '' });
        el.style.pointerEvents = 'none'; el.style.visibility = 'hidden';
      }
      runner.lastStatus = { ok:true, action:'disableCenterOverlays', disabled: runner._disabledEls.length };
      console.log('DevToolsRunner: disabled', runner._disabledEls.length, 'elements — test scroll now. Call DevToolsRunner.revertDisableOverlays() to restore.');
      return runner._disabledEls.length;
    }catch(e){ console.warn('disableCenterOverlays failed', e); return 0; }
  };

  runner.revertDisableOverlays = function(){
    try{
      for (const rec of runner._disabledEls){ try{ if (rec.el){ if (rec.style) rec.el.setAttribute('style', rec.style); else rec.el.removeAttribute('style'); } }catch(e){} }
      const n = runner._disabledEls.length; runner._disabledEls = []; runner.lastStatus = { ok:true, action:'revertDisableOverlays', restored: n };
      console.log('DevToolsRunner: restored', n, 'elements'); return n;
    }catch(e){ console.warn('revertDisableOverlays failed', e); return 0; }
  };

  // Quick touch fix: set inline touch-action pan-y on likely containers; record previous styles for revert
  runner.applyTouchFix = function(){
    try{
      const sels = ['#appointmentsList', '.content-area', 'main', '.appointment-card', '.appointment-info'];
      runner._savedStyles = [];
      for (const s of sels){
        const els = document.querySelectorAll(s);
        for (const el of els){ runner._savedStyles.push({ el: el, style: el.getAttribute('style') || '' }); el.style.touchAction = 'pan-y'; el.style.webkitOverflowScrolling = 'touch'; }
      }
      runner.lastStatus = { ok:true, action:'applyTouchFix', affected: runner._savedStyles.length };
      console.log('DevToolsRunner: applied touch-action pan-y to', runner._savedStyles.length, 'elements. Call DevToolsRunner.revertTouchFix() to restore.');
      return runner._savedStyles.length;
    }catch(e){ console.warn('applyTouchFix failed', e); return 0; }
  };

  runner.revertTouchFix = function(){
    try{
      for (const rec of runner._savedStyles){ try{ if (rec.el){ if (rec.style) rec.el.setAttribute('style', rec.style); else rec.el.removeAttribute('style'); } }catch(e){} }
      const n = runner._savedStyles.length; runner._savedStyles = []; runner.lastStatus = { ok:true, action:'revertTouchFix', restored: n };
      console.log('DevToolsRunner: reverted touch-fix on', n, 'elements'); return n;
    }catch(e){ console.warn('revertTouchFix failed', e); return 0; }
  };

  // provide standardized status accessor (keeps backward-compatible return values)
  runner.getStatus = function(){ return runner.lastStatus || { ok:true, note:'no-status' }; };

  window.DevToolsRunner = runner;
  console.log('DevToolsRunner installed. Use DevToolsRunner.runAll() then DevToolsRunner.exportReport(). Quick fixes: DevToolsRunner.disableCenterOverlays(), DevToolsRunner.revertDisableOverlays(), DevToolsRunner.applyTouchFix(), DevToolsRunner.revertTouchFix()');
})();
