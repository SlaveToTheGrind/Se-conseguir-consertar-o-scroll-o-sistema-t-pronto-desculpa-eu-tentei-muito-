// Efeitos visuais impressionantes e interatividade
document.addEventListener('DOMContentLoaded', function() {
    
    // Efeito de ondulação em botões
    function createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
    
    // Adicionar efeito de ondulação a todos os botões
    document.querySelectorAll('button, .btn').forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Efeito de paralaxe suave nos elementos flutuantes
    document.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.floating-shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const xPos = (x - 0.5) * speed * 20;
            const yPos = (y - 0.5) * speed * 20;
            
            shape.style.transform = `translate(${xPos}px, ${yPos}px)`;
        });
    });
    
    // Animação de entrada escalonada para cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, index * 100);
            }
        });
    }, observerOptions);
    
    // Observar cards quando aparecem na tela
    setTimeout(() => {
        document.querySelectorAll('.service-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px) scale(0.9)';
            observer.observe(card);
        });
    }, 500);
    
    // Efeito de brilho ao passar o mouse nos cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.background = 'rgba(255, 255, 255, 0.4)';
            card.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.25)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255, 255, 255, 0.25)';
            card.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
        });
    });
    
    // Efeito de digitação no título
    function typeWriter(element, text, speed = 100) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }
    
    // Aplicar efeito de digitação ao título principal
    const mainTitle = document.querySelector('.top h1');
    if (mainTitle) {
        const originalText = mainTitle.textContent;
        setTimeout(() => {
            typeWriter(mainTitle, originalText, 80);
        }, 1000);
    }
    
    // Adicionar classe CSS para ripple
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            pointer-events: none;
            animation: ripple-animation 0.6s linear;
        }
        
        @keyframes ripple-animation {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        button, .btn {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
});