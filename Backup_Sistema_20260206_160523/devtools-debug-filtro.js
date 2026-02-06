// DevTools script: Diagnóstico de filtros flutuantes
// Cole no console do navegador na página admin.html

(function() {
    function logFilterState() {
        const filters = document.querySelector('.admin-filters');
        if (!filters) {
            console.warn('[Filtro Debug] .admin-filters não encontrado');
            return;
        }
        const rect = filters.getBoundingClientRect();
        const computed = window.getComputedStyle(filters);
        console.log('[Filtro Debug] ---');
        console.log('display:', computed.display);
        console.log('position:', computed.position);
        console.log('top:', computed.top);
        console.log('z-index:', computed.zIndex);
        console.log('background:', computed.background);
        console.log('box-shadow:', computed.boxShadow);
        console.log('parent:', filters.parentElement && filters.parentElement.className);
        console.log('offsetTop:', filters.offsetTop, 'offsetParent:', filters.offsetParent && filters.offsetParent.className);
        console.log('Bounding rect:', rect);
        console.log('ScrollY:', window.scrollY);
        // Check if inside any fixed or portal container
        let el = filters;
        while (el) {
            if (el.classList && el.classList.contains('filters-clone')) {
                console.warn('[Filtro Debug] Está dentro de .filters-clone!');
            }
            el = el.parentElement;
        }
    }

    window.addEventListener('scroll', logFilterState, { passive: true });
    window.addEventListener('resize', logFilterState, { passive: true });
    setTimeout(logFilterState, 100);
    console.log('[Filtro Debug] Script de diagnóstico de filtro carregado. Role a página e veja os logs.');
})();
