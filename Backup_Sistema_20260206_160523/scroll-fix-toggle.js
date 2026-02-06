/* Reversible scroll fix: applies `touch-action: pan-y` and enables -webkit-overflow-scrolling on likely containers.
   Exposes `window.ScrollFix.apply()` and `window.ScrollFix.revert()` for quick testing and rollback.
*/
(function(){
  const sels = ['#appointmentsList', '.content-area', 'main'];
  let _saved = [];

  const overlaySelectors = ['.modal-overlay', '.mobile-overlay', '.modal-dialog-overlay', '.smart-loading-overlay', '.mobile-overlay.active'];

  function apply(){
    try{
      _saved = [];
      for(const s of sels){
        document.querySelectorAll(s).forEach(el=>{
          _saved.push({ el: el, style: el.getAttribute('style') || '' });
          try{
            el.style.setProperty('touch-action','pan-y','important');
            el.style.setProperty('-webkit-overflow-scrolling','touch');
          }catch(e){}
        });
      }
      // Overlay safety: disable fullscreen overlays that are present but don't host a dialog
      try{
        overlaySelectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(ov => {
            if(!ov || ov.nodeType!==1) return;
            // if overlay contains a visible modal/dialog, skip
            const hasDialog = ov.querySelector('.modal-dialog, .modal, .modal-content, .dialog');
            const rect = ov.getBoundingClientRect();
            const coversViewport = rect.width > 20 && rect.height > 20; // likely covers area
            if(!hasDialog && coversViewport){
              _saved.push({ el: ov, style: ov.getAttribute('style') || '' });
              try{ ov.style.setProperty('pointer-events','none','important'); ov.style.visibility='hidden'; }catch(e){}
            }
          });
        });
      }catch(e){}

      // Unlock body fixed positioning if left locked accidentally
      try{
        const bodyPos = document.body && document.body.style && document.body.style.position;
        if(bodyPos === 'fixed'){
          // if menu not open, revert the lock
          const menuOpen = !!document.querySelector('.mobile-menu-toggle.active, .admin-nav.open, .admin-nav.open *');
          if(!menuOpen){
            _saved.push({ el: document.body, style: document.body.getAttribute('style') || '' });
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
          }
        }
      }catch(e){}
      console.log('ScrollFix: applied to', _saved.length, 'elements');
      return _saved.length;
    }catch(e){ console.warn('ScrollFix.apply failed', e); return 0; }
  }

  function revert(){
    try{
      for(const rec of _saved){
        try{
          if(!rec.el) continue;
          if(rec.style) rec.el.setAttribute('style', rec.style);
          else rec.el.removeAttribute('style');
        }catch(e){}
      }
      const n = _saved.length; _saved = [];
      console.log('ScrollFix: reverted', n, 'elements');
      return n;
    }catch(e){ console.warn('ScrollFix.revert failed', e); return 0; }
  }

  window.ScrollFix = { apply, revert };

  // Auto-apply once DOM is ready so consumers on mobile get the fix instantly
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ try{ apply(); }catch(e){} });
  } else {
    try{ apply(); }catch(e){}
  }
})();
