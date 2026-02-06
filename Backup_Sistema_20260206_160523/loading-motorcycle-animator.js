/**
 * Animador de Motocicletas para Loading
 * Alterna entre 3 estilos de moto com silhuetas reais (cores originais)
 * 
 * Estilos:
 * - 0-1.5s: Cruiser/Custom
 * - 1.5-3s: Sport/Esportiva
 * - 3s+: Trail/Adventure
 */

class MotorcycleLoadingAnimator {
    constructor() {
        this.spinner = null;
        this.motorcycleImg = null;
        this.loadingText = null;
        this.currentStyle = 'cruiser';
        this.startTime = null;
        this.animationInterval = null;
        this.transitionTimeouts = [];
        this.isRunning = false;
        
        this.styles = [
            {
                name: 'cruiser',
                image: 'Cruiser-Custom sem fundo.png',
                duration: 1200,
                messages: ['Carregando...']
            },
            {
                name: 'sport',
                image: 'Silhueta esportiva sem fundo.png',
                duration: 1200,
                messages: ['Carregando...']
            },
            {
                name: 'trail',
                image: 'Trail sem fundo.png',
                duration: 1200,
                messages: ['Carregando...']
            }
        ];
        
        this.currentStyleIndex = 0;
    }
    
    /**
     * Inicializa o animador
     */
    init() {
        this.spinner = document.querySelector('.spinner');
        this.loadingText = document.querySelector('.loading-text');
        
        if (!this.spinner || !this.loadingText) {
            console.warn('Elementos de loading não encontrados');
            return false;
        }
        
        // Cria a imagem da moto se não existir
        this.motorcycleImg = this.spinner.querySelector('.motorcycle-image');
        if (!this.motorcycleImg) {
            console.log('📷 Criando elemento de imagem...');
            this.motorcycleImg = document.createElement('img');
            this.motorcycleImg.className = 'motorcycle-image';
            this.motorcycleImg.alt = 'Motorcycle Loading';
            this.motorcycleImg.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                transition: all 0.8s ease;
            `;
            
            // Log de erro de carregamento
            this.motorcycleImg.onerror = function() {
                console.error('❌ Erro ao carregar imagem:', this.src);
            };
            
            this.motorcycleImg.onload = function() {
                console.log('✅ Imagem carregada:', this.src);
            };
            
            this.spinner.innerHTML = '';
            this.spinner.appendChild(this.motorcycleImg);
            console.log('✅ Elemento de imagem criado e adicionado');
        }
        
        return true;
    }
    
    /**
     * Inicia a animação alternante
     */
    start() {
        console.log('🏍️ Iniciando animador de motos...');
        
        // Para qualquer animação anterior
        this.stop();
        
        if (!this.init()) {
            console.error('❌ Falha ao inicializar elementos');
            return;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // RANDOMIZA a ordem dos estilos
        this.shuffleStyles();
        
        this.currentStyleIndex = 0;
        this.applyStyle(0);
        
        console.log(`✅ Estilo inicial aplicado: ${this.styles[0].name}`);
        
        // Agenda as transições
        this.scheduleTransitions();
    }
    
    /**
     * Embaralha a ordem dos estilos para randomizar
     */
    shuffleStyles() {
        // Fisher-Yates shuffle
        for (let i = this.styles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.styles[i], this.styles[j]] = [this.styles[j], this.styles[i]];
        }
        console.log('🔀 Ordem randomizada:', this.styles.map(s => s.name).join(' → '));
    }
    
    /**
     * Agenda as transições entre estilos
     */
    scheduleTransitions() {
        let accumulatedTime = 0;
        
        this.styles.forEach((style, index) => {
            if (index === 0) return; // Pula o primeiro (já aplicado)
            
            accumulatedTime += this.styles[index - 1].duration;
            
            console.log(`⏱️ Agendando transição para ${style.name} em ${accumulatedTime}ms`);
            
            const timeout = setTimeout(() => {
                if (this.isRunning) {
                    this.transitionToStyle(index);
                    
                    // Se for a última moto, volta para a primeira
                    if (index === this.styles.length - 1) {
                        setTimeout(() => {
                            if (this.isRunning) {
                                this.transitionToStyle(0);
                            }
                        }, this.styles[index].duration);
                    }
                }
            }, accumulatedTime);
            
            this.transitionTimeouts.push(timeout);
        });
    }
    
    /**
     * Transiciona para um estilo específico
     */
    transitionToStyle(index) {
        if (!this.motorcycleImg || !this.loadingText) {
            console.error('❌ Elementos não encontrados para transição');
            return;
        }
        
        const previousStyle = this.styles[this.currentStyleIndex];
        const newStyle = this.styles[index];
        
        console.log(`🔄 Transição: ${previousStyle.name} → ${newStyle.name}`);
        
        // Fade out
        this.motorcycleImg.style.opacity = '0';
        
        setTimeout(() => {
            // Troca imagem (SEM FILTROS DE COR)
            this.motorcycleImg.src = newStyle.image;
            
            // Fade in
            this.motorcycleImg.style.opacity = '1';
            
            console.log(`  ✅ Moto alterada: ${newStyle.image}`);
        }, 300);
        
        // Atualiza texto com animação
        this.updateText(newStyle.messages);
        
        this.currentStyleIndex = index;
    }
    
    /**
     * Atualiza o texto com uma mensagem aleatória
     */
    updateText(messages) {
        if (!this.loadingText || !messages || messages.length === 0) return;
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Fade out
        this.loadingText.style.opacity = '0';
        
        setTimeout(() => {
            this.loadingText.textContent = randomMessage;
            // Fade in
            this.loadingText.style.opacity = '1';
        }, 300);
    }
    
    /**
     * Aplica um estilo específico imediatamente
     */
    applyStyle(index) {
        if (!this.motorcycleImg || !this.loadingText) return;
        
        const style = this.styles[index];
        
        // Configura a imagem (SEM FILTROS DE COR)
        this.motorcycleImg.src = style.image;
        this.motorcycleImg.style.opacity = '1';
        
        // Configura o texto
        this.updateText(style.messages);
        
        this.currentStyleIndex = index;
    }
    
    /**
     * Para a animação e reseta
     */
    stop() {
        console.log('⏹️ Parando animador de motos...');
        
        this.isRunning = false;
        
        // Limpa todos os timeouts agendados
        this.transitionTimeouts.forEach(timeout => clearTimeout(timeout));
        this.transitionTimeouts = [];
        
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        this.currentStyleIndex = 0;
    }
    
    /**
     * Obtém o tempo decorrido desde o início
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }
    
    /**
     * Obtém informações sobre o estilo atual
     */
    getCurrentStyleInfo() {
        return {
            index: this.currentStyleIndex,
            style: this.styles[this.currentStyleIndex],
            elapsedTime: this.getElapsedTime()
        };
    }
}

// Instância global
const motorcycleAnimator = new MotorcycleLoadingAnimator();

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.MotorcycleLoadingAnimator = MotorcycleLoadingAnimator;
    window.motorcycleAnimator = motorcycleAnimator;
    
    console.log('✅ MotorcycleLoadingAnimator carregado e pronto!');
}
