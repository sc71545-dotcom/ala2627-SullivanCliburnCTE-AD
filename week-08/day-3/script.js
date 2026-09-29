const canvas = document.querySelector('#screen');
const ctx = canvas.getContext('2d');
const scoreText = document.querySelector('#score');
const waveText = document.querySelector('#wave');
const livesText = document.querySelector('#lives');
const highScoreText = document.querySelector('#high-score');
const statusText = document.querySelector('#status');
const overlay = document.querySelector('#overlay');
const overlayKicker = document.querySelector('#overlay-kicker');
const overlayTitle = document.querySelector('#overlay-title');
const overlayText = document.querySelector('#overlay-text');
const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const pauseLabel = document.querySelector('#pause-label');

const width = canvas.width;
const height = canvas.height;
const keys = { left: false, right: false, fire: false };
const spriteRows = [
  ['00100100', '00011000', '00111100', '01111110', '11011011', '11111111', '10100101', '00100100'],
  ['00011000', '00111100', '01111110', '11011011', '11111111', '00100100', '01011010', '10100101'],
  ['00111100', '01111110', '11011011', '11111111', '10100101', '00100100', '01011010', '10000001']
];
const stars = Array.from({ length: 85 }, () => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() > 0.88 ? 2 : 1,
  alpha: 0.18 + Math.random() * 0.55
}));

let player;
let aliens = [];
let playerBullets = [];
let enemyBullets = [];
let phase = 'ready';
let score = 0;
let lives = 3;
let wave = 1;
let formationDirection = 1;
let enemyFireTimer = 1;
let shotCooldown = 0;
let invulnerable = 0;
let lastFrame = 0;
let highScore = Number(localStorage.getItem('orbit-breaker-high-score')) || 0;

function makeAliens() {
  aliens = [];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      aliens.push({ x: 113 + column * 57, y: 74 + row * 43, row, type: Math.min(2, Math.floor(row / 2)), alive: true });
    }
  }
  formationDirection = 1;
}

function updateStats() {
  scoreText.textContent = String(score).padStart(5, '0');
  waveText.textContent = String(wave).padStart(2, '0');
  livesText.textContent = String(lives);
  highScoreText.textContent = String(highScore).padStart(5, '0');
}

function setOverlay(kicker, title, text, buttonText) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.firstChild.textContent = buttonText;
  overlay.hidden = false;
}

function beginGame() {
  score = 0;
  lives = 3;
  wave = 1;
  player = { x: width / 2, y: height - 48, width: 34, height: 24 };
  playerBullets = [];
  enemyBullets = [];
  shotCooldown = 0;
  invulnerable = 0;
  enemyFireTimer = 1;
  makeAliens();
  updateStats();
  phase = 'running';
  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseLabel.textContent = 'Pause';
  statusText.textContent = 'WAVE 01 // ENGAGE';
  startButton.blur();
}

function pauseGame() {
  if (phase === 'running') {
    phase = 'paused';
    setOverlay('FLIGHT CONTROL', 'Mission paused', 'Your ship is holding position. Take a breath, then get back out there.', 'Resume mission');
    pauseLabel.textContent = 'Resume';
    statusText.textContent = 'MISSION PAUSED';
  } else if (phase === 'paused') {
    phase = 'running';
    overlay.hidden = true;
    pauseLabel.textContent = 'Pause';
    statusText.textContent = `WAVE ${String(wave).padStart(2, '0')} // ENGAGE`;
  }
}

function fire() {
  if (phase !== 'running' || shotCooldown > 0) return;
  playerBullets.push({ x: player.x, y: player.y - 12, speed: 430 });
  shotCooldown = 0.28;
}

function finishGame() {
  phase = 'gameover';
  pauseButton.disabled = true;
  keys.fire = false;
  statusText.textContent = 'SHIP LOST // SIGNAL ENDED';
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('orbit-breaker-high-score', String(highScore));
  }
  updateStats();
  setOverlay('TRANSMISSION LOST', 'Ship lost', `Final score: ${String(score).padStart(5, '0')}. The next wave is waiting.`, 'Play again');
}

function hitPlayer() {
  if (invulnerable > 0 || phase !== 'running') return;
  lives -= 1;
  invulnerable = 1.4;
  enemyBullets = [];
  updateStats();
  statusText.textContent = lives ? 'HULL HIT // KEEP MOVING' : 'HULL BREACH';
  if (lives <= 0) finishGame();
}

function nextWave() {
  wave += 1;
  makeAliens();
  enemyBullets = [];
  statusText.textContent = `WAVE ${String(wave).padStart(2, '0')} // INCOMING`;
  updateStats();
}

function update(delta) {
  if (phase !== 'running') return;
  const moveSpeed = 330;
  if (keys.left) player.x -= moveSpeed * delta;
  if (keys.right) player.x += moveSpeed * delta;
  player.x = Math.max(24, Math.min(width - 24, player.x));
  shotCooldown = Math.max(0, shotCooldown - delta);
  invulnerable = Math.max(0, invulnerable - delta);
  if (keys.fire) fire();

  playerBullets.forEach((bullet) => { bullet.y -= bullet.speed * delta; });
  playerBullets = playerBullets.filter((bullet) => bullet.y > -10);

  const remaining = aliens.filter((alien) => alien.alive).length;
  const formationSpeed = 26 + wave * 4 + (50 - remaining) * 1.25;
  let leftEdge = width;
  let rightEdge = 0;
  aliens.forEach((alien) => {
    if (!alien.alive) return;
    alien.x += formationDirection * formationSpeed * delta;
    leftEdge = Math.min(leftEdge, alien.x - 17);
    rightEdge = Math.max(rightEdge, alien.x + 17);
  });
  if (rightEdge >= width - 22 || leftEdge <= 22) {
    formationDirection *= -1;
    aliens.forEach((alien) => {
      if (alien.alive) alien.y += 17;
    });
  }

  playerBullets.forEach((bullet) => {
    const target = aliens.find((alien) => alien.alive && Math.abs(bullet.x - alien.x) < 18 && Math.abs(bullet.y - alien.y) < 14);
    if (target) {
      target.alive = false;
      bullet.y = -20;
      score += (5 - target.row) * 10;
      updateStats();
    }
  });

  enemyFireTimer -= delta;
  if (enemyFireTimer <= 0) {
    const shooters = aliens.filter((alien) => alien.alive);
    if (shooters.length) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      enemyBullets.push({ x: shooter.x, y: shooter.y + 14, speed: 180 + wave * 10 });
    }
    enemyFireTimer = Math.max(0.28, 1.05 - wave * 0.04) + Math.random() * 0.8;
  }

  enemyBullets.forEach((bullet) => { bullet.y += bullet.speed * delta; });
  enemyBullets = enemyBullets.filter((bullet) => {
    if (bullet.y > player.y - 3 && bullet.y < player.y + 17 && Math.abs(bullet.x - player.x) < 17) {
      hitPlayer();
      return false;
    }
    return bullet.y < height + 10;
  });

  if (aliens.some((alien) => alien.alive && alien.y >= player.y - 25)) finishGame();
  if (phase === 'running' && remaining > 0 && !aliens.some((alien) => alien.alive)) nextWave();
}

function drawAlien(alien, time) {
  const sprite = spriteRows[alien.type];
  const cell = 4;
  ctx.fillStyle = ['#c7f36b', '#ffd36e', '#ff795b'][alien.type];
  sprite.forEach((row, rowIndex) => {
    [...row].forEach((pixel, columnIndex) => {
      if (pixel === '1') ctx.fillRect(Math.round(alien.x - 16 + columnIndex * cell), Math.round(alien.y - 12 + rowIndex * cell + (Math.floor(time / 280) % 2 && rowIndex > 5 ? 2 : 0)), cell - 1, cell - 1);
    });
  });
}

function draw(time) {
  ctx.fillStyle = '#0d150f';
  ctx.fillRect(0, 0, width, height);
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = '#dce8c9';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(199, 243, 107, .11)';
  ctx.beginPath();
  ctx.moveTo(20, height - 28);
  ctx.lineTo(width - 20, height - 28);
  ctx.stroke();

  aliens.forEach((alien) => { if (alien.alive) drawAlien(alien, time); });

  ctx.fillStyle = '#c7f36b';
  playerBullets.forEach((bullet) => ctx.fillRect(Math.round(bullet.x - 2), Math.round(bullet.y - 7), 4, 12));
  ctx.fillStyle = '#ff795b';
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(Math.round(bullet.x - 2), Math.round(bullet.y - 5), 4, 10);
    ctx.fillRect(Math.round(bullet.x - 4), Math.round(bullet.y - 1), 8, 3);
  });

  if (player && (invulnerable <= 0 || Math.floor(time / 100) % 2 === 0)) {
    ctx.fillStyle = '#ecebdc';
    ctx.fillRect(player.x - 4, player.y - 12, 8, 5);
    ctx.fillRect(player.x - 9, player.y - 7, 18, 5);
    ctx.fillStyle = '#c7f36b';
    ctx.fillRect(player.x - 17, player.y - 2, 34, 10);
    ctx.fillRect(player.x - 11, player.y + 8, 6, 4);
    ctx.fillRect(player.x + 5, player.y + 8, 6, 4);
  }
}

function frame(time) {
  const delta = Math.min((time - lastFrame) / 1000 || 0, 0.04);
  lastFrame = time;
  update(delta);
  draw(time);
  requestAnimationFrame(frame);
}

function setControl(name, pressed) {
  if (name === 'left' || name === 'right') keys[name] = pressed;
  if (name === 'fire') {
    keys.fire = pressed;
    if (pressed) fire();
  }
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', ' ', 'a', 'd'].includes(key)) event.preventDefault();
  if (key === 'arrowleft' || key === 'a') keys.left = true;
  if (key === 'arrowright' || key === 'd') keys.right = true;
  if (key === ' ' && !event.repeat) fire();
  if (key === 'p' && !event.repeat && (phase === 'running' || phase === 'paused')) pauseGame();
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') keys.left = false;
  if (key === 'arrowright' || key === 'd') keys.right = false;
});

document.querySelectorAll('[data-control]').forEach((button) => {
  const name = button.dataset.control;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setControl(name, true);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => {
    button.addEventListener(eventName, () => setControl(name, false));
  });
});

startButton.addEventListener('click', () => {
  if (phase === 'paused') pauseGame();
  else beginGame();
});
pauseButton.addEventListener('click', pauseGame);
window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
  keys.fire = false;
});

updateStats();
draw(0);
requestAnimationFrame(frame);
