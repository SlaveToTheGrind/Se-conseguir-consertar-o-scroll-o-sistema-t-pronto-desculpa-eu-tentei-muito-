// Debug Console - MacDavis Motos
// Adiciona um console visual na página para debug

(function() {
    'use strict';
    
    // Criar container do console
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'debugConsole';
    consoleDiv.innerHTML = `
        <div style="position: fixed; bottom: 0; right: 0; width: 400px; max-height: 50vh; background: #1e1e1e; color: #d4d4d4; border: 2px solid #667eea; border-bottom: none; border-right: none; border-top-left-radius: 10px; z-index: 99999; font-family: 'Courier New', monospace; font-size: 11px; overflow: hidden; box-shadow: 0 -5px 20px rgba(0,0,0,0.5);">
            <div style="background: #667eea; color: white; padding: 8px 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: move;" id="debugConsoleHeader">
                <span>🐛 Debug Console</span>
                <div>
                    <button onclick="document.getElementById('debugConsoleContent').innerHTML=''" style="background: transparent; border: none; color: white; cursor: pointer; padding: 0 8px; font-size: 14px;" title="Limpar">🗑️</button>
                    <button onclick="document.getElementById('debugConsole').style.display='none'" style="background: transparent; border: none; color: white; cursor: pointer; padding: 0 8px; font-size: 14px;" title="Fechar">✖</button>
                </div>
            </div>
            <div id="debugConsoleContent" style="padding: 10px; max-height: calc(50vh - 40px); overflow-y: auto; overflow-x: hidden; word-wrap: break-word;">
                <div style="color: #4ec9b0;">Console iniciado...</div>
            </div>
        </div>
    `;
    
    // Adicionar ao DOM quando carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(consoleDiv);
            makeHeaderDraggable();
        });
    } else {
        document.body.appendChild(consoleDiv);
        makeHeaderDraggable();
    }
    
    // Função para tornar o header arrastável
    function makeHeaderDraggable() {
        const header = document.getElementById('debugConsoleHeader');
        const console = document.getElementById('debugConsole');
        
        if (!header || !console) return;
        
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            initialX = e.clientX - (parseInt(console.style.left) || 0);
            initialY = e.clientY - (parseInt(console.style.top) || 0);
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                console.style.left = currentX + 'px';
                console.style.top = currentY + 'px';
                console.style.right = 'auto';
                console.style.bottom = 'auto';
            }
        }
        
        function dragEnd() {
            isDragging = false;
        }
    }
    
    // Interceptar console.log
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    function addToDebugConsole(message, type = 'log') {
        const content = document.getElementById('debugConsoleContent');
        if (!content) return;
        
        const line = document.createElement('div');
        line.style.margin = '2px 0';
        line.style.padding = '2px 0';
        line.style.borderBottom = '1px solid #333';
        
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const timeSpan = document.createElement('span');
        timeSpan.style.color = '#858585';
        timeSpan.textContent = `[${timestamp}] `;
        line.appendChild(timeSpan);
        
        const messageSpan = document.createElement('span');
        
        // Formatação por tipo
        switch (type) {
            case 'error':
                messageSpan.style.color = '#f48771';
                break;
            case 'warn':
                messageSpan.style.color = '#ce9178';
                break;
            case 'success':
                messageSpan.style.color = '#4ec9b0';
                break;
            case 'info':
                messageSpan.style.color = '#9cdcfe';
                break;
            default:
                messageSpan.style.color = '#d4d4d4';
        }
        
        // Converter objetos para string
        let msgText = message;
        if (typeof message === 'object') {
            try {
                msgText = JSON.stringify(message, null, 2);
            } catch (e) {
                msgText = String(message);
            }
        }
        
        messageSpan.textContent = msgText;
        line.appendChild(messageSpan);
        
        content.appendChild(line);
        content.scrollTop = content.scrollHeight;
        
        // Limitar a 100 linhas
        while (content.children.length > 100) {
            content.removeChild(content.firstChild);
        }
    }
    
    // Wrapper para console.log
    console.log = function(...args) {
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        // Detectar tipo pela mensagem
        let type = 'log';
        if (message.includes('✅') || message.includes('SUCCESS')) type = 'success';
        if (message.includes('⚠️') || message.includes('WARN')) type = 'warn';
        if (message.includes('❌') || message.includes('ERROR')) type = 'error';
        if (message.includes('📋') || message.includes('INFO')) type = 'info';
        
        addToDebugConsole(message, type);
        originalLog.apply(console, args);
    };
    
    console.warn = function(...args) {
        const message = args.join(' ');
        addToDebugConsole('⚠️ ' + message, 'warn');
        originalWarn.apply(console, args);
    };
    
    console.error = function(...args) {
        const message = args.join(' ');
        addToDebugConsole('❌ ' + message, 'error');
        originalError.apply(console, args);
    };
    
    // Função global para mostrar o console
    window.showDebugConsole = function() {
        const console = document.getElementById('debugConsole');
        if (console) console.style.display = 'block';
    };
    
    // Atalho de teclado: Ctrl+Shift+D para mostrar/ocultar
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            const console = document.getElementById('debugConsole');
            if (console) {
                console.style.display = console.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
    
    console.log('🐛 Debug Console ativado! (Ctrl+Shift+D para mostrar/ocultar)');
})();
