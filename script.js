class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameArea = document.getElementById('gameArea');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.highScoreElement = document.getElementById('highScore');
        
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Configurações do jogo
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Estado do jogo
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.gameSpeed = 150; // ms entre movimentos
        
        // Cobra
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;
        
        // Comida
        this.food = {x: 15, y: 15};
        
        // Sistema de recordes
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        
        // Sistema de áudio
        this.audioContext = null;
        this.initAudio();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showStartScreen();
        this.updateHighScore();
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API não suportada');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playEatSound() {
        this.playSound(800, 0.2, 'square');
    }
    
    playGameOverSound() {
        this.playSound(200, 0.5, 'triangle');
    }
    
    activateAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setupEventListeners() {
        // Botões
        this.startBtn.addEventListener('click', () => {
            this.activateAudioContext();
            this.startGame();
        });
        this.restartBtn.addEventListener('click', () => {
            this.activateAudioContext();
            this.restartGame();
        });
        
        // Controles
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                this.handleInput(e);
            }
        });
        
        // Controles do Game Boy (D-Pad)
        document.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                // D-Pad
                const dpadBtn = e.target.closest('.dpad-btn');
                if (dpadBtn) {
                    const direction = dpadBtn.dataset.direction;
                    this.handleMobileInput(direction);
                    return;
                }
            }
        });
    }
    
    showStartScreen() {
        this.gameState = 'start';
        this.startScreen.classList.remove('hidden');
        this.gameOverOverlay.classList.remove('show');
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.generateFood();
        
        this.updateScore();
        this.startScreen.classList.add('hidden');
        this.gameOverOverlay.classList.remove('show');
        
        // Não iniciar o loop automaticamente - aguardar primeira tecla
        this.draw();
    }
    
    restartGame() {
        this.startGame();
    }
    
    handleInput(e) {
        // Se ainda não começou a se mover, iniciar o jogo
        if (this.dx === 0 && this.dy === 0) {
            this.gameLoop();
        }
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    handleMobileInput(direction) {
        // Se ainda não começou a se mover, iniciar o jogo
        if (this.dx === 0 && this.dy === 0) {
            this.gameLoop();
        }
        
        switch(direction) {
            case 'up':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'down':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'left':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'right':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
    }
    
    moveSnake() {
        // Se não há direção definida, não mover
        if (this.dx === 0 && this.dy === 0) {
            return;
        }
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Verificar colisão com paredes
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Verificar colisão com o próprio corpo
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Verificar se comeu a comida
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.updateScore();
            this.playEatSound();
            this.generateFood();
            
            // Aumentar velocidade gradualmente
            if (this.score % 5 === 0) {
                this.gameSpeed = Math.max(80, this.gameSpeed - 10);
            }
        } else {
            this.snake.pop();
        }
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    draw() {
        // Limpar canvas
        this.ctx.fillStyle = '#1A252F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grade
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Desenhar cobra
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Cabeça da cobra
                this.ctx.fillStyle = '#27AE60';
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
                
                // Olhos
                this.ctx.fillStyle = '#2C3E50';
                this.ctx.fillRect(segment.x * this.gridSize + 6, segment.y * this.gridSize + 6, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 11, segment.y * this.gridSize + 6, 3, 3);
            } else {
                // Corpo da cobra
                this.ctx.fillStyle = '#2ECC71';
                this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 3, this.gridSize - 6, this.gridSize - 6);
            }
        });
        
        // Desenhar comida
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // Desenhar pausa se necessário
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ECF0F1';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Pressione ESPAÇO para continuar', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        
        // Efeito visual na pontuação
        this.scoreElement.style.transform = 'scale(1.2)';
        this.scoreElement.style.color = '#F39C12';
        setTimeout(() => {
            this.scoreElement.style.transform = 'scale(1)';
            this.scoreElement.style.color = '#ECF0F1';
        }, 200);
    }
    
    checkRecords() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
            this.updateHighScore();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.playGameOverSound();
        this.checkRecords();
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverOverlay.classList.add('show');
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.moveSnake();
        this.draw();
        
        setTimeout(() => {
            this.gameLoop();
        }, this.gameSpeed);
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// Prevenir scroll da página quando pressionar setas
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});