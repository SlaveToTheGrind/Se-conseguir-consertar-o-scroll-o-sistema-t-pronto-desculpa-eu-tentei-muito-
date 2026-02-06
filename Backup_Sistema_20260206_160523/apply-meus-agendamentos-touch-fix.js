(function applyMeusAgendamentosTouchFix(){
  const STYLE_ID = 'meus-agendamentos-touch-fix-style';
  function apply(){
    if (document.getElementById(STYLE_ID)) return {applied:true};
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `html, body { touch-action: pan-y !important; overscroll-behavior-y: auto !important; }`;
    (document.head || document.documentElement).appendChild(s);
    return {
      applied: true,
      revert: function(){ const el = document.getElementById(STYLE_ID); if(el) el.remove(); }
    };
  }
  const res = apply();
  // Expose revert handle for Console convenience
  window.__meusAgendamentosTouchFix = res;
  return res;
})();
