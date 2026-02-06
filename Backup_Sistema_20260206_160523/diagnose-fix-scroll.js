(function(){
  // Diagnóstico e correção de bloqueio de scroll móvel
  // Como usar: inclua <script src="/diagnose-fix-scroll.js"></script> no final do <body>

  const ID = 'scroll-diagnostic-overlay';
  if (document.getElementById(ID)) return; // evitar duplicação

  // elementos internos (pre-declarados para evitar ReferenceError antes da init)
  let box, statusEl, listEl, btnScan, btnFix, btnObs, btnHide;

  // garante que a API exista mesmo que init falhe
  window.ScrollDiag = window.ScrollDiag || {};

  // Cria stylesheet de força (usa !important) para habilitar scroll
  const forceStyle = document.createElement('style');
  forceStyle.id = 'scroll-diagnostic-force-style';
  forceStyle.textContent = `
    html.dsd-force-scroll, body.dsd-force-scroll { overflow: auto !important; height: auto !important; position: static !important; top: auto !important; }
    .dsd-suspect { outline: 2px dashed rgba(255,0,0,.85) !important; }
    #${ID} { position: fixed; right: 10px; bottom: 10px; z-index: 2147483647; background: rgba(0,0,0,.7); color: #fff; font-family: sans-serif; font-size: 12px; padding: 8px; border-radius: 6px; max-width: 320px; box-shadow: 0 2px 8px rgba(0,0,0,.4); }
    #${ID} button { margin-left:6px; font-size:11px; }
    #${ID} .list { max-height:160px; overflow:auto; margin-top:6px; background:rgba(255,255,255,0.03); padding:6px; border-radius:4px; }
    #${ID} .small { opacity:.9; font-size:11px; }
  `;
  document.head.appendChild(forceStyle);

  // Overlay UI initialization (safe: waits for body)
  function initScrollDiag(){
    if (document.getElementById(ID)) return; // evitar duplicação
    box = document.createElement('div');
    box.id = ID;
    box.innerHTML = `
      <div><strong>ScrollDiag</strong> <span class="small">(mobile)</span></div>
      <div class="small" id="sd-status">Status: iniciando...</div>
      <div style="margin-top:6px">
        <button id="sd-scan">Scan</button>
        <button id="sd-fix">Forçar scroll</button>
        <button id="sd-observe">Observer ON</button>
        <button id="sd-hide">Fechar</button>
      </div>
      <div class="list" id="sd-list"></div>
    `;

    // Anexa ao body (mais confiável que documentElement) e permite alternar visibilidade
    document.body.appendChild(box);
    box.style.display = 'none';

    // Botão flutuante para abrir/fechar o painel (visível mesmo quando regras globais escondem o overlay)
    const toggle = document.createElement('button');
    toggle.id = 'sd-toggle';
    toggle.textContent = 'SD';
    toggle.title = 'Abrir ScrollDiag';
    toggle.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483648;background:#ff7a18;color:#111;border:none;padding:8px 10px;border-radius:8px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,0.35);cursor:pointer;';
    toggle.onclick = ()=>{ box.style.display = (box.style.display === 'none' ? 'block' : 'none'); };
    document.body.appendChild(toggle);

    statusEl = box.querySelector('#sd-status');
    listEl = box.querySelector('#sd-list');
    btnScan = box.querySelector('#sd-scan');
    btnFix = box.querySelector('#sd-fix');
    btnObs = box.querySelector('#sd-observe');
    btnHide = box.querySelector('#sd-hide');

    // expose these to outer scope via closure helpers
    window.__ScrollDiag_internal = { box, statusEl, listEl, btnScan, btnFix, btnObs, btnHide };

    // wire existing event listeners (re-attach) — reuse function definitions below
    btnScan.addEventListener('click', ()=>{
      const res = scan();
      console.log('ScrollDiag.scan ->', res);
      if (Array.isArray(res)) setStatus('scan: ' + res.length + ' items');
      return res;
    });
    btnFix.addEventListener('click', ()=>{
      const ok = forceScroll();
      console.log('ScrollDiag.forceScroll ->', ok);
      const res = scan();
      console.log('ScrollDiag.scan (after force) ->', res);
      setStatus(ok? ('forçado — ' + (Array.isArray(res)? res.length + ' items':'scan done')) : 'força falhou');
      return ok;
    });
    btnObs.addEventListener('click', ()=>{
      const wasObserving = observing;
      const r = wasObserving? stopObserver() : startObserver();
      console.log('ScrollDiag.observer ->', r, 'wasObserving:', wasObserving, 'nowObserving:', observing);
      return r;
    });
    btnHide.addEventListener('click', ()=>{ box.style.display='none'; return true; });

    console.log('ScrollDiag initialized — toggle button SD should appear bottom-right');
    // update exported API overlay ref
    Object.assign(window.ScrollDiag, { overlay: box });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initScrollDiag); else initScrollDiag();

  function setStatus(txt){ if (statusEl) statusEl.textContent = 'Status: ' + txt; else console.log('ScrollDiag status:', txt); }

  function computedInfo(el){
    const cs = window.getComputedStyle(el);
    return {
      overflow: cs.overflow + ' / ' + cs.overflowY + ' / ' + cs.overflowX,
      position: cs.position,
      top: cs.top,
      height: cs.height
    };
  }

  function isFullscreenFixed(el){
    try{
      const cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed') return false;
      const r = el.getBoundingClientRect();
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      // considera full-screen se cobre >= 85% da viewport em ambas dimensões
      const covers = (r.width >= vw * 0.85 && r.height >= vh * 0.85) || (Math.abs(r.top) < 2 && Math.abs(r.left) < 2 && Math.abs(r.bottom - vh) < 2 && Math.abs(r.right - vw) < 2);
      return covers;
    }catch(e){ return false; }
  }

  function disableOverlay(el){
    if (!el) return false;
    // store previous
    el.dataset.__dsd_prev_display = el.style.display || '';
    el.dataset.__dsd_prev_pointer = el.style.pointerEvents || '';
    el.style.pointerEvents = 'none';
    // hide visually as well to test
    el.style.display = 'none';
    return true;
  }

  function restoreOverlay(el){
    if (!el) return false;
    if (el.dataset.__dsd_prev_display !== undefined) el.style.display = el.dataset.__dsd_prev_display;
    if (el.dataset.__dsd_prev_pointer !== undefined) el.style.pointerEvents = el.dataset.__dsd_prev_pointer;
    delete el.dataset.__dsd_prev_display;
    delete el.dataset.__dsd_prev_pointer;
    return true;
  }

  function scan(){
    if (!listEl) initScrollDiag();
    if (!listEl) { console.warn('ScrollDiag: painel não inicializado'); return []; }
    listEl.innerHTML = '';
    const findings = [];

    const htmlInfo = computedInfo(document.documentElement);
    const bodyInfo = computedInfo(document.body);
    findings.push({who:'html', info:htmlInfo, el:document.documentElement});
    findings.push({who:'body', info:bodyInfo, el:document.body});

    // procura elementos com inline style contendo overflow:hidden ou position:fixed
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all){
      const s = el.getAttribute && el.getAttribute('style');
      if (!s) continue;
      const low = s.toLowerCase();
      if (low.includes('overflow:hidden') || low.includes('position:fixed') || low.includes('position: absolute')){
        findings.push({who:el.tagName.toLowerCase() + (el.id?('#'+el.id):''), info:{style:s}, el});
      }
    }

    // Render findings
    if (findings.length === 0){
      listEl.textContent = 'Nenhum elemento suspeito encontrado.';
      setStatus('nenhum suspeito');
      return;
    }

    for (const f of findings){
      const item = document.createElement('div');
      item.style.padding = '4px 0';
      const who = document.createElement('div'); who.textContent = f.who; who.style.fontWeight='600';
      const info = document.createElement('div'); info.textContent = JSON.stringify(f.info); info.style.fontSize='11px'; info.style.opacity='.95';
      const btn = document.createElement('button'); btn.textContent = 'Marcar'; btn.onclick = ()=>{ f.el.classList.add('dsd-suspect'); window.scrollTo(0,0); };
      item.appendChild(who); item.appendChild(info); item.appendChild(btn);

      // if element is full-screen fixed overlay, add disable button
      if (isFullscreenFixed(f.el)){
        const dbtn = document.createElement('button'); dbtn.textContent = 'Desabilitar overlay'; dbtn.style.marginLeft='8px';
        dbtn.onclick = ()=>{
          const ok = disableOverlay(f.el);
          console.log('ScrollDiag.disableOverlay ->', ok, f.el);
          setStatus(ok? 'overlay desabilitado' : 'falha ao desabilitar');
        };
        const rbtn = document.createElement('button'); rbtn.textContent = 'Restaurar'; rbtn.style.marginLeft='6px';
        rbtn.onclick = ()=>{ const ok = restoreOverlay(f.el); console.log('ScrollDiag.restoreOverlay ->', ok, f.el); setStatus(ok? 'overlay restaurado':'falha restaurar'); };
        item.appendChild(dbtn); item.appendChild(rbtn);
      }
      listEl.appendChild(item);
    }
    setStatus('scan completo — ' + findings.length + ' items');
    return findings;
  }

  // força scroll: aplica classes e remove inline styles perigosos de html/body
  function forceScroll(){
    document.documentElement.classList.add('dsd-force-scroll');
    document.body.classList.add('dsd-force-scroll');
    // tentar limpar inline styles comuns
    try{ document.documentElement.style.overflow = 'auto'; document.documentElement.style.position = 'static'; document.documentElement.style.height = 'auto'; }catch(e){}
    try{ document.body.style.overflow = 'auto'; document.body.style.position = 'static'; document.body.style.top = 'auto'; document.body.style.height = 'auto'; }catch(e){}
    setStatus('forçado (classes aplicadas)');
    return true;
  }

  // MutationObserver que reverte mudanças prejudiciais em html/body
  let observer = null;
  let observing = false;
  function startObserver(){
    if (!document.body) initScrollDiag();
    if (observing) return;
    observer = new MutationObserver(muts=>{
      for (const m of muts){
        if (m.type === 'attributes' && (m.target === document.body || m.target === document.documentElement) && (m.attributeName === 'style' || m.attributeName === 'class')){
          const el = m.target;
          const cs = window.getComputedStyle(el);
          if (/(hidden)/.test(cs.overflow) || /(fixed)/.test(cs.position)){
            // reverter
            try{
              el.style.overflow = 'auto';
              el.style.position = 'static';
              el.style.top = 'auto';
            }catch(e){}
            // destacar e logar
            el.classList.add('dsd-suspect');
            console.warn('ScrollDiag reverted styles on', el, 'computed:', cs.overflow, cs.position, '\nMutation:', m);
            // append short trace
            const trace = (new Error()).stack.split('\n').slice(1,6).join('\n');
            const note = document.createElement('div'); note.style.fontSize='11px'; note.style.marginTop='4px'; note.textContent = 'Revertido em: ' + new Date().toLocaleTimeString();
            listEl.prepend(note);
            setStatus('observer revertido mudança');
          }
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter:['style','class'], subtree:false });
    observer.observe(document.body, { attributes: true, attributeFilter:['style','class'], subtree:false });
    observing = true;
    btnObs.textContent = 'Observer ON';
    setStatus('observer ativo');
    return true;
  }
  function stopObserver(){
    if (!observing) return;
    observer.disconnect(); observer = null; observing = false; btnObs.textContent = 'Observer OFF'; setStatus('observer parado');
    return true;
  }

  // roda scan inicial e ativa observer por padrão
  setTimeout(()=>{ scan(); startObserver(); }, 300);

  // disponibiliza API para debugging manual (merge into existing object to avoid accidental overwrite)
  Object.assign(window.ScrollDiag, {
    scan, forceScroll, startObserver, stopObserver,
    // helper para leitura rápida do estado computado
    getComputedStatus: function(){
      return { html: computedInfo(document.documentElement), body: computedInfo(document.body) };
    },
    overlay: function(){ return document.getElementById(ID); }
  });

  // Publish a stable mapping of local functions into the global `ScrollDiag` object.
  // This avoids race conditions and makes methods like `getComputedStatus` reliably available.
  (function exposeStableApi(){
    const apiMap = { scan, forceScroll, startObserver, stopObserver, getComputedStatus };
    for (const [name, fn] of Object.entries(apiMap)){
      try{
        if (typeof window.ScrollDiag[name] !== 'function'){
          window.ScrollDiag[name] = function(...args){
            if (!document.getElementById(ID)) initScrollDiag();
            if (typeof fn === 'function') return fn.apply(null, args);
            return undefined;
          };
        }
      }catch(e){ console.warn('ScrollDiag expose error for', name, e); }
    }
  })();
})();
