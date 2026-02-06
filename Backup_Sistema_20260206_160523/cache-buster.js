// ========================================
// CACHE BUSTER - MacDavis Motos
// Adiciona timestamp automático em TODOS os CSS/JS
// ========================================

(function() {
    'use strict';
    
    const timestamp = Date.now();
    
    // Função para adicionar timestamp em links e scripts
    function bustCache() {
        // CSS
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('://')) { // Apenas arquivos locais
                const separator = href.includes('?') ? '&' : '?';
                link.href = `${href.split('?')[0]}${separator}t=${timestamp}`;
            }
        });
        
        // JS
        document.querySelectorAll('script[src]').forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.includes('://') && !src.includes('cache-buster.js')) {
                const separator = src.includes('?') ? '&' : '?';
                const newScript = document.createElement('script');
                newScript.src = `${src.split('?')[0]}${separator}t=${timestamp}`;
                newScript.type = script.type || 'text/javascript';
                script.parentNode.replaceChild(newScript, script);
            }
        });
        
        console.log('🧹 Cache busted:', new Date(timestamp).toLocaleTimeString());
    }
    
    // Executar quando DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bustCache);
    } else {
        bustCache();
    }
    
    // Limpar cache do navegador no load
    window.addEventListener('load', () => {
        // Tentar limpar cache via Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            });
        }
        
        // Limpar cache storage
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
    });
    
    // Detectar reload e forçar hard refresh
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('lastVisit', Date.now());
    });
    
    const lastVisit = sessionStorage.getItem('lastVisit');
    if (lastVisit && (Date.now() - parseInt(lastVisit)) < 2000) {
        console.log('🔄 Reload detectado - limpando cache...');
        location.reload(true);
    }
    
})();
