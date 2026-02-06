/* Reversible scroll fix: applies `touch-action: pan-y` and enables -webkit-overflow-scrolling on likely containers.
   Exposes `window.ScrollFix.apply()` and `window.ScrollFix.revert()` for quick testing and rollback.
*/
(function(){
  const sels = ['#appointmentsList', '.content-area', 'main'];
  let _saved = [];

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
