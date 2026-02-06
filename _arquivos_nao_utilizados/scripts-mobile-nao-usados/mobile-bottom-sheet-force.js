// FORÇAR Bottom Sheet - Versão Direta
(function() {
    'use strict';
    
    // Detectar se é REALMENTE mobile (não apenas tela pequena)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = () => window.innerWidth <= 900;
    
    // Só ativar em dispositivos móveis REAIS
    if (!isMobileDevice) {
        console.log('Desktop detectado - bottom sheet desativado, usando modal normal');
        return;
    }
    
    if (!isSmallScreen()) {
        console.log('Tablet em modo paisagem - bottom sheet desativado');
        return;
    }
    
    console.log('🚀 FORÇANDO Bottom Sheet para mobile...', 'Largura:', window.innerWidth);
    
    // Injetar CSS para garantir
    const style = document.createElement('style');
    style.textContent = `
        .mobile-bottom-sheet { position: fixed !important; inset: 0 !important; z-index: 9999 !important; background: rgba(0,0,0,0.7) !important; }
        .bs-grid-2x2 { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    `;
    document.head.appendChild(style);
    
    // Substituir IMEDIATAMENTE
    const originalOpen = window.openMotoModal;
    
    window.openMotoModal = function(motoId) {
        console.log('🎯 BOTTOM SHEET FORÇADO - ID:', motoId);
        console.log('✅ VERSÃO DOM PURO ATIVADA!');
        
        const moto = window.motorcycles?.find(m => m.id === motoId);
        if (!moto) {
            console.log('Moto não encontrada');
            return;
        }
        
        // Remover qualquer sheet existente
        document.querySelectorAll('.mobile-bottom-sheet').forEach(el => el.remove());
        
        // Criar sheet com DOM direto
        const sheet = document.createElement('div');
        sheet.className = 'mobile-bottom-sheet';
        sheet.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.7);';
        
        const content = document.createElement('div');
        content.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; max-height: 55vh; background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%); border-radius: 24px 24px 0 0; padding: 12px 14px; overflow-y: auto;';
        
        // Handle
        const handle = document.createElement('div');
        handle.style.cssText = 'width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 12px;';
        content.appendChild(handle);
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;';
        const title = document.createElement('h2');
        title.style.cssText = 'margin: 0; font-size: 0.95rem; color: #fff;';
        title.textContent = (moto.marca ? moto.marca + ' ' : '') + (moto.name || moto.nome || 'Sem nome');
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; color: #fff; font-size: 1.1rem; cursor: pointer;';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => { 
            sheet.remove(); 
            // FIX SCROLL: Forçar auto em mobile
            if (window.innerWidth <= 1024) {
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
            } else {
                document.body.style.overflow = '';
            }
        };
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(header);
        
        // Image
        if (moto.image) {
            const img = document.createElement('img');
            img.src = moto.image;
            img.style.cssText = 'width: 100%; max-height: 120px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;';
            content.appendChild(img);
        }
        
        // GRID 2x2 - DOM DIRETO
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; margin-bottom: 14px !important;';
        console.log('✅ GRID 2x2 CRIADO COM SUCESSO!');
        
        const specs = [
            { icon: '📅', label: 'Ano', value: moto.year || moto.ano || 'N/A' },
            { icon: '🎨', label: 'Cor', value: moto.color || moto.cor || 'N/A' },
            { icon: '📏', label: 'KM', value: (moto.mileage || moto.quilometragem || moto.km || 0).toLocaleString('pt-BR') + ' km' },
            { icon: '⚙️', label: 'Cilindrada', value: (moto.displacement || moto.cilindradas || moto.engine_cc || moto.cc || 'N/A') + 'cc' }
        ];
        
        specs.forEach(spec => {
            const box = document.createElement('div');
            box.style.cssText = 'background: rgba(255,255,255,0.05) !important; padding: 10px 8px !important; border-radius: 10px !important; border: 1px solid rgba(255,255,255,0.08) !important;';
            
            const label = document.createElement('div');
            label.style.cssText = 'font-size: 0.65rem !important; color: rgba(255,255,255,0.6) !important; margin-bottom: 4px !important; text-transform: uppercase !important;';
            label.textContent = spec.icon + ' ' + spec.label;
            
            const value = document.createElement('div');
            value.style.cssText = 'font-size: 0.85rem !important; color: #fff !important; font-weight: 600 !important;';
            value.textContent = spec.value;
            
            box.appendChild(label);
            box.appendChild(value);
            grid.appendChild(box);
        });
        
        content.appendChild(grid);
        
        // Button
        const btn = document.createElement('button');
        btn.style.cssText = 'width: 100%; height: 44px; background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%); border: none; border-radius: 12px; color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer;';
        btn.textContent = '📅 Agendar Visita';
        btn.onclick = () => { localStorage.setItem('selectedMotoId', moto.id); window.location.href = 'agendamento.html'; };
        content.appendChild(btn);
        
        sheet.appendChild(content);
        document.body.appendChild(sheet);
        // FIX SCROLL: NÃO bloquear overflow
        // document.body.style.overflow = 'hidden';
        
        // Fechar ao clicar no overlay
        sheet.addEventListener('click', (e) => {
            if (e.target === sheet) {
                sheet.remove();
                // FIX SCROLL: Forçar auto em mobile
                if (window.innerWidth <= 1024) {
                    document.body.style.overflow = 'auto';
                    document.documentElement.style.overflow = 'auto';
                } else {
                    document.body.style.overflow = '';
                }
            }
        });
    };
    
    console.log('✅ Bottom Sheet FORÇADO com sucesso');
})();
