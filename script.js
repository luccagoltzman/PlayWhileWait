class PulaPulaGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.gameScreen = document.getElementById('gameScreen');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.frog = document.getElementById('frog');
        this.obstacles = document.getElementById('obstacles');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Estado do jogo
        this.gameState = 'start'; // 'start', 'countdown', 'playing', 'gameOver'
        this.score = 0;
        this.gameSpeed = 3;
        this.gravity = 0.2; // Ainda mais reduzido para dar tempo de reação
        this.jumpPower = -5; // Pulo mais suave
        
        // Posição do sapinho
        this.frogY = 250;
        this.frogVelocity = 0;
        this.frogElement = this.frog;
        
        // Obstáculos
        this.obstacleList = [];
        this.obstacleSpawnRate = 0.02;
        this.lastObstacleTime = 0;
        this.obstacleSpawnInterval = 2500; // Intervalo entre obstáculos em ms
        
        // Configurações do jogo
        this.gameAreaHeight = 520;
        this.groundHeight = 60;
        this.frogSize = 48;
        this.gameLoopRunning = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showStartScreen();
    }
    
    setupEventListeners() {
        // Botões
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Controles
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJump();
            }
        });
        
        // Toque para dispositivos móveis
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });
        
        // Clique para desktop
        this.gameArea.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                e.preventDefault();
                this.handleJump();
            }
        });
    }
    
    showStartScreen() {
        this.gameState = 'start';
        this.startScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.frog.classList.add('idle');
    }
    
    showGameScreen() {
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.frog.classList.remove('idle');
    }
    
    showGameOverScreen() {
        this.gameState = 'gameOver';
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.finalScoreElement.textContent = this.score;
    }
    
    startGame() {
        // Garantir que o estado está limpo
        this.clearGameState();
        
        // Configurar estado inicial
        this.gameState = 'countdown';
        this.gameLoopRunning = false;
        
        this.updateScore();
        this.showGameScreen();
        this.startCountdown();
    }
    
    restartGame() {
        // Simplesmente chamar startGame que já limpa o estado
        this.startGame();
    }
    
    clearGameState() {
        // Parar o loop do jogo
        this.gameLoopRunning = false;
        
        // Limpar todos os obstáculos existentes
        this.obstacleList.forEach(obstacle => {
            if (obstacle.element && obstacle.element.parentNode) {
                obstacle.element.remove();
            }
        });
        this.obstacleList = [];
        
        // Limpar elementos de contagem regressiva que possam ter ficado
        const existingCountdown = this.gameScreen.querySelector('.countdown');
        if (existingCountdown) {
            existingCountdown.remove();
        }
        
        // Resetar posição do sapo
        this.frogY = 250;
        this.frogVelocity = 0;
        this.frog.style.top = this.frogY + 'px';
        this.frog.classList.remove('jumping', 'falling');
        
        // Resetar variáveis do jogo
        this.score = 0;
        this.gameSpeed = 3;
        this.lastObstacleTime = 0;
        
        // Atualizar pontuação na tela
        this.updateScore();
    }
    
    startCountdown() {
        let count = 3;
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        countdownElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4em;
            font-weight: bold;
            color: #FF6B6B;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
            z-index: 20;
            animation: countdownPulse 0.5s ease-in-out;
        `;
        
        this.gameScreen.appendChild(countdownElement);
        
        const countdownInterval = setInterval(() => {
            if (count > 0) {
                countdownElement.textContent = count;
                count--;
            } else {
                countdownElement.textContent = 'GO!';
                setTimeout(() => {
                    countdownElement.remove();
                    this.gameState = 'playing';
                    // Iniciar o loop do jogo apenas uma vez
                    if (!this.gameLoopRunning) {
                        this.gameLoopRunning = true;
                        this.gameLoop();
                    }
                }, 500);
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    handleJump() {
        if (this.gameState === 'playing') {
            this.frogVelocity = this.jumpPower;
            this.frog.classList.remove('falling');
            this.frog.classList.add('jumping');
            
            setTimeout(() => {
                this.frog.classList.remove('jumping');
            }, 150);
        }
    }
    
    updateFrog() {
        // Aplicar gravidade
        this.frogVelocity += this.gravity;
        this.frogY += this.frogVelocity;
        
        // Limitar posição do sapinho
        const maxY = this.gameAreaHeight - this.groundHeight - this.frogSize;
        const minY = 0;
        
        if (this.frogY > maxY) {
            this.frogY = maxY;
            this.frogVelocity = 0;
            this.frog.classList.add('falling');
        } else if (this.frogY < minY) {
            this.frogY = minY;
            this.frogVelocity = 0;
        }
        
        // Atualizar posição visual
        this.frogElement.style.top = this.frogY + 'px';
        
        // Verificar colisão com o chão
        if (this.frogY >= maxY) {
            this.gameOver();
        }
    }
    
    spawnObstacle() {
        const now = Date.now();
        if (now - this.lastObstacleTime > this.obstacleSpawnInterval) { // Spawn com intervalo configurável
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            
            // Altura aleatória do obstáculo
            const minHeight = 100;
            const maxHeight = 300;
            const height = Math.random() * (maxHeight - minHeight) + minHeight;
            
            obstacle.style.height = height + 'px';
            obstacle.style.right = '-50px';
            obstacle.style.top = '0px';
            
            this.obstacles.appendChild(obstacle);
            
            this.obstacleList.push({
                element: obstacle,
                x: this.gameArea.offsetWidth,
                height: height,
                passed: false
            });
            
            this.lastObstacleTime = now;
        }
    }
    
    updateObstacles() {
        // Usar for loop reverso para evitar problemas ao remover elementos
        for (let i = this.obstacleList.length - 1; i >= 0; i--) {
            const obstacle = this.obstacleList[i];
            
            // Mover obstáculo
            obstacle.x -= this.gameSpeed;
            obstacle.element.style.right = (this.gameArea.offsetWidth - obstacle.x) + 'px';
            
            // Verificar se o sapinho passou pelo obstáculo (apenas uma vez)
            if (!obstacle.passed && obstacle.x + 40 < 80) { // Obstáculo completamente passou
                obstacle.passed = true;
                this.score++;
                this.updateScore();
                
                // Aumentar velocidade gradualmente
                if (this.score % 5 === 0) {
                    this.gameSpeed += 0.2;
                }
            }
            
            // Verificar colisão apenas se o obstáculo ainda está na área de colisão
            if (obstacle.x < 120 && obstacle.x + 40 > 80) { // Área de colisão
                if (this.checkCollision(obstacle)) {
                    this.gameOver();
                    return; // Parar a verificação se houve colisão
                }
            }
            
            // Remover obstáculo apenas se saiu completamente da tela
            // Usar a posição x diretamente para determinar se saiu da tela
            if (obstacle.x < -150) { // Aumentado para -150 para dar mais tempo na tela
                obstacle.element.remove();
                this.obstacleList.splice(i, 1);
            }
        }
    }
    
    checkCollision(obstacle) {
        const frogLeft = 80;
        const frogRight = 80 + this.frogSize;
        const frogTop = this.frogY;
        const frogBottom = this.frogY + this.frogSize;
        
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + 40;
        const obstacleTop = 0;
        const obstacleBottom = obstacle.height;
        
        // Verificar sobreposição com margem de erro menor
        const collision = frogRight > obstacleLeft + 5 && 
                         frogLeft < obstacleRight - 5 && 
                         frogBottom > obstacleTop + 5 && 
                         frogTop < obstacleBottom - 5;
        
        return collision;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.gameLoopRunning = false; // Parar o loop
        this.showGameOverScreen();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.updateFrog();
        this.spawnObstacle();
        this.updateObstacles();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new PulaPulaGame();
});

// Prevenir scroll da página quando pressionar espaço
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// Prevenir zoom em dispositivos móveis
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
});

// Adicionar efeitos sonoros visuais (opcional)
function createJumpEffect() {
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = '80px';
    effect.style.top = '250px';
    effect.style.width = '48px';
    effect.style.height = '48px';
    effect.style.borderRadius = '50%';
    effect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)';
    effect.style.pointerEvents = 'none';
    effect.style.animation = 'jumpEffect 0.3s ease-out forwards';
    
    document.getElementById('gameScreen').appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 300);
}

// CSS para efeito de pulo
const style = document.createElement('style');
style.textContent = `
    @keyframes jumpEffect {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
