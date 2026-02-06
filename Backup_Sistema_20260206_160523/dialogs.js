(function(){
  'use strict';
  function createDOM(){
    if (document.getElementById('mdialog-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'mdialog-overlay';
    overlay.className = 'modal-dialog-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="md-title" aria-describedby="md-body">
        <div class="md-title" id="md-title"></div>
        <div class="md-body" id="md-body"></div>
        <input class="md-input" id="md-input" style="display:none" />
        <div class="md-actions" id="md-actions">
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function openOverlay(){
    const o = document.getElementById('mdialog-overlay');
    if (!o) return;
    requestAnimationFrame(()=>o.classList.add('open'));
  }
  function closeOverlay(){
    const o = document.getElementById('mdialog-overlay');
    if (!o) return;
    o.classList.remove('open');
  }

  function clearActions(){
    const actions = document.getElementById('md-actions');
    actions.innerHTML = '';
  }

  function showDialog(type, message, opts){
    return new Promise((resolve)=>{
      createDOM();
      const titleEl = document.getElementById('md-title');
      const bodyEl = document.getElementById('md-body');
      const inputEl = document.getElementById('md-input');
      const actions = document.getElementById('md-actions');
      titleEl.textContent = '';
      bodyEl.textContent = message || '';
      inputEl.style.display = 'none';
      inputEl.value = (opts && opts.default) ? opts.default : '';
      clearActions();

      if (type === 'alert'){
        const ok = document.createElement('button'); ok.className='btn-md primary'; ok.textContent='OK';
        ok.addEventListener('click', ()=>{ closeOverlay(); resolve(); });
        actions.appendChild(ok);
        openOverlay();
        ok.focus();
        return;
      }

      if (type === 'confirm'){
        const cancel = document.createElement('button'); cancel.className='btn-md ghost'; cancel.textContent='Cancelar';
        const ok = document.createElement('button'); ok.className='btn-md primary'; ok.textContent='OK';
        cancel.addEventListener('click', ()=>{ closeOverlay(); resolve(false); });
        ok.addEventListener('click', ()=>{ closeOverlay(); resolve(true); });
        actions.appendChild(cancel); actions.appendChild(ok);
        openOverlay();
        ok.focus();
        return;
      }

      if (type === 'prompt'){
        inputEl.style.display = 'block';
        inputEl.focus();
        const cancel = document.createElement('button'); cancel.className='btn-md ghost'; cancel.textContent='Cancelar';
        const ok = document.createElement('button'); ok.className='btn-md primary'; ok.textContent='OK';
        cancel.addEventListener('click', ()=>{ closeOverlay(); resolve(null); });
        ok.addEventListener('click', ()=>{ closeOverlay(); resolve(inputEl.value); });
        actions.appendChild(cancel); actions.appendChild(ok);
        openOverlay();
        return;
      }

      // fallback: behave like alert
      const ok = document.createElement('button'); ok.className='btn-md primary'; ok.textContent='OK';
      ok.addEventListener('click', ()=>{ closeOverlay(); resolve(); });
      actions.appendChild(ok);
      openOverlay();
    });
  }

  // expose API
  window.MDDialog = {
    alert: function(msg){ return showDialog('alert', String(msg)); },
    confirm: function(msg){ return showDialog('confirm', String(msg)); },
    prompt: function(msg, def){ return showDialog('prompt', String(msg), {default: def}); }
  };

  // Helper that returns a Promise resolving to boolean. Falls back to native confirm if MDDialog is not available.
  window.askConfirm = async function(msg){
    try{
      if (window.MDDialog && typeof MDDialog.confirm === 'function'){
        return await MDDialog.confirm(String(msg));
      }
    }catch(e){
      console.warn('MDDialog.confirm failed, falling back to native confirm', e);
    }
    // native confirm is synchronous; wrap in Promise for consistent API
    return Promise.resolve(confirm(String(msg)));
  };

  // NOTE: Do NOT override native `alert/confirm/prompt` here.
  // Keep `window.MDDialog` available for async dialogs and let existing
  // synchronous code continue to use the native browser dialogs.

  // initialize DOM on load
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createDOM);
  else createDOM();
})();