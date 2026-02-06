;(function(){
  // Safe global scroll lock helpers used by pages
  function lock(){
    try{
      window.__scrollLock = window.__scrollLock || {};
      if (window.__scrollLock._locked) return;
      window.__scrollLock._locked = true;
      window.__scrollLock.scrollY = window.scrollY || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.__scrollLock.scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      try{ clearTimeout(window.__scrollLock._safety); }catch(e){}
      window.__scrollLock._safety = setTimeout(()=>{ try{ unlock(); }catch(e){} }, 15000);
    }catch(e){}
  }
  function unlock(){
    try{
      if (!window.__scrollLock) window.__scrollLock = {};
      const s = window.__scrollLock.scrollY || 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, s);
      try{ clearTimeout(window.__scrollLock._safety); }catch(e){}
      window.__scrollLock._locked = false;
      try{ delete window.__scrollLock.scrollY; }catch(e){}
    }catch(e){}
  }
  window.lockBodyScrollSafe = lock;
  window.unlockBodyScrollSafe = unlock;
})();
