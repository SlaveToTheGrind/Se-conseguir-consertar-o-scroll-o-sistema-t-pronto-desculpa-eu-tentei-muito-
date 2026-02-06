// Touch Event Debugger
// Paste into Console or include as script, then reproduce the single-finger scroll.
// It will log any call to event.preventDefault and record touch event targets.
(function(){
  if (window.__TouchDebugInstalled) { console.log('Touch debug already installed'); return; }
  window.__TouchDebugInstalled = true;

  const logs = [];

  const origPrevent = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function(){
    try{
      const info = { when: Date.now(), type: this.type, target: this.target && (this.target.tagName + (this.target.id?('#'+this.target.id):'')), stack: (new Error()).stack.split('\n').slice(1,8).join('\n') };
      logs.push({ kind: 'preventDefault', info });
      console.warn('TouchDebug: preventDefault invoked', info);
    }catch(e){ console.warn('TouchDebug preventDefault wrap error', e); }
    return origPrevent.apply(this, arguments);
  };

  // capture and bubble listeners to log targets and whether default prevented
  function cap(ev){
    try{ logs.push({ kind: 'capture', type: ev.type, target: ev.target && (ev.target.tagName + (ev.target.id?('#'+ev.target.id):'')), when: Date.now() }); }
    catch(e){}
  }
  function bub(ev){
    try{
      const rec = { kind: 'bubble', type: ev.type, target: ev.target && (ev.target.tagName + (ev.target.id?('#'+ev.target.id):'')), defaultPrevented: !!ev.defaultPrevented, when: Date.now() };
      logs.push(rec);
      if (rec.defaultPrevented) console.warn('TouchDebug: event.defaultPrevented true', rec);
    }catch(e){}
  }

  ['touchstart','touchmove','pointerdown','pointermove'].forEach(t=>{
    document.addEventListener(t, cap, {capture:true, passive:false});
    document.addEventListener(t, bub, {capture:false, passive:false});
  });

  // helper: list large fixed elements that could cover viewport
  function findCoveringElements(){
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const els = Array.from(document.querySelectorAll('*')).filter(el=>{
      try{
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
        const r = el.getBoundingClientRect();
        return r.width >= vw*0.9 && r.height >= vh*0.9 && cs.pointerEvents !== 'none';
      }catch(e){ return false; }
    }).map(el=>({ tag: el.tagName, id: el.id, class: el.className, style: el.getAttribute('style'), rect: el.getBoundingClientRect() }));
    console.log('TouchDebug: covering elements', els);
    return els;
  }

  // helper: elements with touch-action:none or pointer-events set
  function findTouchActionIssues(){
    const res = [];
    Array.from(document.querySelectorAll('*')).forEach(el=>{
      try{
        const cs = getComputedStyle(el);
        if (/none|manipulation/.test(cs.touchAction || '') || /none/.test(cs.pointerEvents || '')){
          res.push({ tag: el.tagName, id: el.id, class: el.className, touchAction: cs.touchAction, pointerEvents: cs.pointerEvents });
        }
      }catch(e){}
    });
    console.log('TouchDebug: touch-action / pointer-events issues', res);
    return res;
  }

  window.TouchDebug = {
    getLogs: ()=>logs.slice(),
    clear: ()=>{ logs.length = 0; },
    findCoveringElements,
    findTouchActionIssues
  };

  console.log('TouchDebug installed. Use TouchDebug.getLogs(), TouchDebug.findCoveringElements(), TouchDebug.findTouchActionIssues()');

})();
