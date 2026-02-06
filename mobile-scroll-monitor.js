// Mobile Scroll Monitor - paste into DevTools Console on the affected page
// Logs events prefixed with "MONITOR" so you can copy them back here.
(function(){
  if (window.__mobileScrollMonitorInstalled) return console.log('MONITOR already installed');
  window.__mobileScrollMonitorInstalled = true;

  function M(...args){ console.log('MONITOR', ...args); }

  // Patch window.scrollTo
  try{
    window.__orig_scrollTo = window.scrollTo;
    window.scrollTo = function(...a){ M('CALL window.scrollTo', ...a); try{ return window.__orig_scrollTo.apply(this,a); }catch(e){} };
  }catch(e){ M('ERROR patching window.scrollTo', String(e)); }

  // Patch Element.scrollIntoView
  try{
    const proto = Element.prototype;
    if (!proto.__orig_scrollIntoView){
      proto.__orig_scrollIntoView = proto.scrollIntoView;
      proto.scrollIntoView = function(...a){ M('CALL Element.scrollIntoView', this.tagName, this.id||'', this.className||'', ...a); try{ return proto.__orig_scrollIntoView.apply(this,a); }catch(e){} };
    }
  }catch(e){ M('ERROR patching Element.scrollIntoView', String(e)); }

  // Observe attribute changes on <body> and <html>
  try{
    const obs = new MutationObserver(muts=>{
      muts.forEach(m=>{
        if (m.type === 'attributes'){
          const t = m.target;
          const cs = getComputedStyle(t);
          M('ATTR-MUT', t.tagName, 'attr=', m.attributeName, 'position=', cs.position, 'overflow=', cs.overflow, 'inlineTop=', t.style.top||'', 'inlineOverflow=', t.style.overflow||'');
        }
      });
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['style','class'] });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class'] });
    window.__mobileScrollMonitor_observer = obs;
  }catch(e){ M('ERROR creating MutationObserver', String(e)); }

  // Poll for scroll changes (detect snapbacks)
  try{
    let last = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop || 0;
    window.__mobileScrollMonitor_poll = setInterval(()=>{
      const cur = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop || 0;
      if (cur !== last){ M('SCROLLCHANGE', 'from', last, 'to', cur); last = cur; }
    }, 120);
  }catch(e){ M('ERROR starting poller', String(e)); }

  // Detect large elements covering the viewport (helpful quick check)
  window.__mobileScrollMonitor_checkCover = function(){
    try{
      const ww = innerWidth, hh = innerHeight;
      const els = Array.from(document.querySelectorAll('body *')).filter(el=>{
        if (!(el instanceof Element)) return false;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        return (r.top <= 0 && r.left <= 0 && r.right >= ww && r.bottom >= hh) || (r.width >= ww*0.9 && r.height >= hh*0.9);
      }).slice(0,12).map(el=>({tag:el.tagName,id:el.id||null,cls:el.className||null,rect:el.getBoundingClientRect(),z:getComputedStyle(el).zIndex}));
      M('COVERING-CANDIDATES', els);
      return els;
    }catch(e){ M('ERROR checkCover', String(e)); return []; }
  };

  M('monitor installed — call window.__mobileScrollMonitor_checkCover() and reproduce the gesture; copy MONITOR logs here');
})();
