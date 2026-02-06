// Modal Dialog System MacDavis
const ModalDialog = {
    // Confirmar ação
    confirm: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirmar',
                message = 'Tem certeza?',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                icon = '❓',
                type = 'question'
            } = options;

            const overlay = this.createOverlay();
            const dialog = this.createDialog({
                title,
                message,
                icon,
                type,
                buttons: [
                    {
                        text: cancelText,
                        class: 'modal-btn-secondary',
                        onClick: () => {
                            this.close(overlay);
                            resolve(false);
                        }
                    },
                    {
                        text: confirmText,
                        class: 'modal-btn-primary',
                        onClick: () => {
                            this.close(overlay);
                            resolve(true);
                        }
                    }
                ]
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Focar no botão de confirmar
            setTimeout(() => {
                const confirmBtn = dialog.querySelector('.modal-btn-primary');
                if (confirmBtn) confirmBtn.focus();
            }, 100);
        });
    },

    // Alerta
    alert: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Aviso',
                message = '',
                okText = 'OK',
                icon = 'ℹ️',
                type = 'info'
            } = options;

            const overlay = this.createOverlay();
            const dialog = this.createDialog({
                title,
                message,
                icon,
                type,
                buttons: [
                    {
                        text: okText,
                        class: 'modal-btn-primary',
                        onClick: () => {
                            this.close(overlay);
                            resolve();
                        }
                    }
                ]
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            setTimeout(() => {
                const okBtn = dialog.querySelector('.modal-btn-primary');
                if (okBtn) okBtn.focus();
            }, 100);
        });
    },

    // Prompt com input
    prompt: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Entrada',
                message = '',
                placeholder = '',
                defaultValue = '',
                confirmText = 'OK',
                cancelText = 'Cancelar',
                icon = '✏️',
                type = 'question',
                inputType = 'text',
                multiline = false,
                required = false
            } = options;

            const overlay = this.createOverlay();
            const inputId = 'modal-input-' + Date.now();
            
            const inputHTML = multiline 
                ? `<textarea id="${inputId}" placeholder="${placeholder}" ${required ? 'required' : ''}>${defaultValue}</textarea>`
                : `<input type="${inputType}" id="${inputId}" placeholder="${placeholder}" value="${defaultValue}" ${required ? 'required' : ''}>`;

            const dialog = this.createDialog({
                title,
                message,
                icon,
                type,
                extraHTML: `<div class="modal-input">${inputHTML}</div>`,
                buttons: [
                    {
                        text: cancelText,
                        class: 'modal-btn-secondary',
                        onClick: () => {
                            this.close(overlay);
                            resolve(null);
                        }
                    },
                    {
                        text: confirmText,
                        class: 'modal-btn-primary',
                        onClick: () => {
                            const input = dialog.querySelector(`#${inputId}`);
                            const value = input.value.trim();
                            
                            if (required && !value) {
                                input.focus();
                                input.style.borderColor = '#f87171';
                                setTimeout(() => {
                                    input.style.borderColor = '';
                                }, 2000);
                                return;
                            }

                            this.close(overlay);
                            resolve(value);
                        }
                    }
                ]
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Focar no input
            setTimeout(() => {
                const input = dialog.querySelector(`#${inputId}`);
                if (input) {
                    input.focus();
                    if (!multiline && defaultValue) {
                        input.select();
                    }
                }

                // Enter para confirmar
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !multiline) {
                        const confirmBtn = dialog.querySelector('.modal-btn-primary');
                        if (confirmBtn) confirmBtn.click();
                    }
                });
            }, 100);
        });
    },

    // Criar overlay
    createOverlay: function() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Fechar ao clicar no overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const cancelBtn = overlay.querySelector('.modal-btn-secondary');
                if (cancelBtn) cancelBtn.click();
            }
        });

        return overlay;
    },

    // Criar dialog
    createDialog: function(options) {
        const {
            title,
            message,
            icon,
            type,
            extraHTML = '',
            buttons = []
        } = options;

        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        const iconClass = type || 'info';
        
        dialog.innerHTML = `
            <div class="modal-header">
                <div class="modal-icon ${iconClass}">${icon}</div>
                <div class="modal-title">
                    <h3>${title}</h3>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-message">${message}</div>
                ${extraHTML}
            </div>
            <div class="modal-footer"></div>
        `;

        const footer = dialog.querySelector('.modal-footer');
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal-btn ${btn.class}`;
            button.textContent = btn.text;
            button.onclick = btn.onClick;
            footer.appendChild(button);
        });

        // ESC para fechar
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                const cancelBtn = dialog.querySelector('.modal-btn-secondary');
                if (cancelBtn) cancelBtn.click();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        return dialog;
    },

    // Fechar modal
    close: function(overlay) {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
        }, 200);
    },

    // Sucesso
    success: function(message, title = 'Sucesso!') {
        return this.alert({
            title,
            message,
            icon: '✅',
            type: 'success',
            okText: 'Entendi'
        });
    },

    // Erro
    error: function(message, title = 'Erro!') {
        return this.alert({
            title,
            message,
            icon: '❌',
            type: 'error',
            okText: 'Entendi'
        });
    },

    // Aviso
    warning: function(message, title = 'Atenção!') {
        return this.alert({
            title,
            message,
            icon: '⚠️',
            type: 'warning',
            okText: 'Entendi'
        });
    }
};

// Exportar para uso global
window.ModalDialog = ModalDialog;
