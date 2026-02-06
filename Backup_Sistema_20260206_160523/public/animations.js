// Animations and loading utilities for MacDavis Motos

// Loading overlay functions
function showLoading(text = 'Processando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const loadingText = overlay.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = text;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Success notification
function showSuccess(message, duration = 3000) {
    const successMsg = document.createElement('div');
    successMsg.textContent = message;
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent);
        color: #000;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        font-family: var(--font-primary);
        box-shadow: 0 6px 20px rgba(255,122,24,0.3);
        animation: slideInRight 0.5s ease-out;
    `;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.style.animation = 'slideInRight 0.5s ease-out reverse';
        setTimeout(() => successMsg.remove(), 500);
    }, duration);
}

// Submissão de formulário aprimorada com loading
function enhanceFormSubmission(formElement, submitCallback) {
    formElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = formElement.querySelector('[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        
        // Add loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            submitBtn.textContent = 'Processando...';
        }
        
        showLoading('Processando solicitação...');
        
        try {
            // Add realistic delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Execute the callback
            await submitCallback(e, formElement);
            
            hideLoading();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.textContent = originalText;
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            hideLoading();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.textContent = originalText;
            }
            throw error;
        }
    });
}

// Card entrance animations
function animateCards() {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100 + 200);
    });
}

// Modal animations
function enhanceModal(modalElement) {
    if (!modalElement) return;
    
    const originalOpen = modalElement.classList.contains('open');
    
    // Override modal open/close
    window.openModalAnimated = function() {
        modalElement.classList.add('open');
        const content = modalElement.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'scale(0.9) translateY(20px)';
            content.style.opacity = '0';
            
            setTimeout(() => {
                content.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                content.style.transform = 'scale(1) translateY(0)';
                content.style.opacity = '1';
            }, 10);
        }
    };
    
    window.closeModalAnimated = function() {
        const content = modalElement.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'scale(0.9) translateY(20px)';
            content.style.opacity = '0';
            
            setTimeout(() => {
                modalElement.classList.remove('open');
            }, 300);
        } else {
            modalElement.classList.remove('open');
        }
    };
}

// Page entrance animation
function initPageAnimations() {
    document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('page-fade-in');
        
        // Animate main sections
        setTimeout(() => {
            const vitrine = document.querySelector('.vitrine');
            const agendamento = document.querySelector('.agendamento');
            
            if (vitrine) vitrine.style.animation = 'slideInLeft 0.6s ease-out 0.2s both';
            if (agendamento) agendamento.style.animation = 'slideInRight 0.6s ease-out 0.4s both';
        }, 100);
        
        // Animate cards when they appear
        setTimeout(animateCards, 500);
    });
}

// Initialize animations
initPageAnimations();