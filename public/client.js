
let player = null;
let gameArea = null;
let score = 0;
let enemies = [];
let gameRunning = false;

function initGame() {
  gameArea = document.getElementById('gameArea');
  player = document.getElementById('player');
  
  if (!gameArea || !player) return;
  
  // Add event listeners for player movement
  document.addEventListener('keydown', movePlayer);
  document.addEventListener('mousemove', movePlayerMouse);
  
  startGame();
}

function movePlayer(e) {
  if (!gameRunning) return;
  
  const playerRect = player.getBoundingClientRect();
  const gameRect = gameArea.getBoundingClientRect();
  
  let newX = parseInt(player.style.left) || 185;
  let newY = parseInt(player.style.top) || 185;
  
  const speed = 20;
  
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
      newY = Math.max(0, newY - speed);
      break;
    case 'ArrowDown':
    case 's':
      newY = Math.min(370, newY + speed);
      break;
    case 'ArrowLeft':
    case 'a':
      newX = Math.max(0, newX - speed);
      break;
    case 'ArrowRight':
    case 'd':
      newX = Math.min(370, newX + speed);
      break;
  }
  
  player.style.left = newX + 'px';
  player.style.top = newY + 'px';
}

function movePlayerMouse(e) {
  if (!gameRunning) return;
  
  const gameRect = gameArea.getBoundingClientRect();
  const x = e.clientX - gameRect.left - 15; // Center the player
  const y = e.clientY - gameRect.top - 15;
  
  // Keep player within bounds
  const boundedX = Math.max(0, Math.min(370, x));
  const boundedY = Math.max(0, Math.min(370, y));
  
  player.style.left = boundedX + 'px';
  player.style.top = boundedY + 'px';
}

function createEnemy() {
  const enemy = document.createElement('div');
  enemy.className = 'enemy';
  
  // Random position on edges
  const side = Math.floor(Math.random() * 4);
  switch(side) {
    case 0: // top
      enemy.style.left = Math.random() * 380 + 'px';
      enemy.style.top = '0px';
      break;
    case 1: // right
      enemy.style.left = '380px';
      enemy.style.top = Math.random() * 380 + 'px';
      break;
    case 2: // bottom
      enemy.style.left = Math.random() * 380 + 'px';
      enemy.style.top = '380px';
      break;
    case 3: // left
      enemy.style.left = '0px';
      enemy.style.top = Math.random() * 380 + 'px';
      break;
  }
  
  gameArea.appendChild(enemy);
  enemies.push(enemy);
}

function moveEnemies() {
  const playerX = parseInt(player.style.left) || 185;
  const playerY = parseInt(player.style.top) || 185;
  
  enemies.forEach((enemy, index) => {
    const enemyX = parseInt(enemy.style.left);
    const enemyY = parseInt(enemy.style.top);
    
    // Move enemy towards player
    const dx = playerX - enemyX;
    const dy = playerY - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 2;
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;
    
    enemy.style.left = (enemyX + moveX) + 'px';
    enemy.style.top = (enemyY + moveY) + 'px';
    
    // Check collision
    if (distance < 25) {
      gameOver();
      return;
    }
  });
}

function gameLoop() {
  if (!gameRunning) return;
  
  moveEnemies();
  
  // Randomly spawn enemies
  if (Math.random() < 0.02) {
    createEnemy();
  }
  
  // Update score
  score += 1;
  document.getElementById('score').textContent = 'Score: ' + score;
  
  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameRunning = true;
  score = 0;
  enemies = [];
  
  // Clear existing enemies
  document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
  
  // Reset player position
  player.style.left = '185px';
  player.style.top = '185px';
  
  gameLoop();
}

function gameOver() {
  gameRunning = false;
  alert(`Game Over! Your score: ${score}`);
  
  // Clear enemies
  enemies.forEach(enemy => enemy.remove());
  enemies = [];
  
  // Restart after a delay
  setTimeout(startGame, 2000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);
