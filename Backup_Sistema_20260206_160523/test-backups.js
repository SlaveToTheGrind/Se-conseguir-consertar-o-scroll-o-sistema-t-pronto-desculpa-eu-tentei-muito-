// TESTE DO BOTÃO BACKUPS
console.log('🧪 Testando botão Backups...');

const btn = document.getElementById('backupsButton');
console.log('Botão encontrado:', btn);

if (btn) {
    console.log('Listeners registrados:', getEventListeners ? getEventListeners(btn) : 'Use Chrome DevTools');
    
    // Testar click manualmente
    console.log('Clicando no botão...');
    btn.click();
    
    // Testar abertura do modal
    console.log('Abrindo modal manualmente...');
    openBackupsModal();
    
    setTimeout(() => {
        const modal = document.getElementById('backupsModal');
        console.log('Modal:', modal);
        console.log('Display do modal:', modal ? window.getComputedStyle(modal).display : 'N/A');
        console.log('Classes do modal:', modal ? Array.from(modal.classList) : 'N/A');
    }, 500);
}
