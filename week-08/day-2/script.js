const arena = document.querySelector('#arena');
const tank = document.querySelector('#tank');
const enemyTank = document.querySelector('#enemyTank');
const shootButton = document.querySelector('#shoot');
const resetButton = document.querySelector('#reset');
const statusText = document.querySelector('#status');
const hitsText = document.querySelector('#hits');
const shotsText = document.querySelector('#shots');
const armorText = document.querySelector('#armor');
const game = { x: 25, y: 72, tankAngle: 0, aim: 0, enemyX: 76, enemyY: 28, enemyAim: 90, hits: 0, shots: 0, armorHits: 0, locked: false, enemyDisabled: false, playerDisabled: false };

function renderTank() {
  tank.style.left = `${game.x}%`;
  tank.style.top = `${game.y}%`;
  tank.style.setProperty('--tank-angle', `${game.tankAngle}deg`);
  tank.style.setProperty('--barrel-angle', `${game.aim - game.tankAngle}deg`);
}
function renderEnemy() {
  enemyTank.style.left = `${game.enemyX}%`;
  enemyTank.style.top = `${game.enemyY}%`;
  enemyTank.style.setProperty('--barrel-angle', `${game.enemyAim}deg`);
}
function moveTank(direction) {
  const moveStep = 5;
  const turnStep = 15;
  const radians = game.tankAngle * Math.PI / 180;
  if (direction === 'forward' || direction === 'backward') {
    const distance = direction === 'forward' ? moveStep : -moveStep;
    game.x = Math.max(6, Math.min(94, game.x + Math.cos(radians) * distance));
    game.y = Math.max(10, Math.min(90, game.y + Math.sin(radians) * distance));
  }
  if (direction === 'turn-left') game.tankAngle -= turnStep;
  if (direction === 'turn-right') game.tankAngle += turnStep;
  renderTank();
}
function aimTank(event) {
  const arenaBox = arena.getBoundingClientRect();
  const tankBox = tank.getBoundingClientRect();
  const tankCenter = {
    x: tankBox.left + tankBox.width / 2,
    y: tankBox.top + tankBox.height / 2
  };
  game.aim = Math.atan2(event.clientY - tankCenter.y, event.clientX - tankCenter.x) * 180 / Math.PI;
  renderTank();
  statusText.textContent = `Barrel aimed at ${Math.round(event.clientX - arenaBox.left)}, ${Math.round(event.clientY - arenaBox.top)}`;
}
function moveEnemy() {
  if (game.enemyDisabled) return;
  game.enemyX = 10 + Math.random() * 80;
  game.enemyY = 12 + Math.random() * 76;
  renderEnemy();
  statusText.textContent = 'Enemy tank repositioned';
}
function shoot() {
  if (game.locked || game.enemyDisabled || game.playerDisabled) return;
  game.locked = true; game.shots += 1; shotsText.textContent = game.shots;
  const tankBox = tank.getBoundingClientRect();
  const targetBox = enemyTank.getBoundingClientRect();
  const arenaBox = arena.getBoundingClientRect();
  const tankCenter = { x: tankBox.left + tankBox.width / 2, y: tankBox.top + tankBox.height / 2 };
  const targetCenter = { x: targetBox.left + targetBox.width / 2, y: targetBox.top + targetBox.height / 2 };
  const targetAngle = Math.atan2(targetCenter.y - tankCenter.y, targetCenter.x - tankCenter.x) * 180 / Math.PI;
  const angleDifference = Math.abs(((targetAngle - game.aim + 540) % 360) - 180);
  const bullet = document.createElement('span'); bullet.className = 'shell';
  bullet.style.left = `${tankCenter.x - arenaBox.left}px`;
  bullet.style.top = `${tankCenter.y - arenaBox.top}px`;
  arena.appendChild(bullet); statusText.textContent = 'Firing...';
  const hit = angleDifference <= 18;
  requestAnimationFrame(() => {
    bullet.style.transition = 'left .45s linear, top .45s linear';
    bullet.style.left = `${targetCenter.x - arenaBox.left}px`;
    bullet.style.top = `${targetCenter.y - arenaBox.top}px`;
  });
  setTimeout(() => {
    bullet.remove();
    if (hit) {
      game.hits += 1; hitsText.textContent = game.hits; enemyTank.classList.add('hit');
      if (game.hits >= 4) {
        game.enemyDisabled = true;
        enemyTank.classList.add('disabled');
        statusText.textContent = 'Enemy tank disabled!';
      } else statusText.textContent = `Enemy hit! ${4 - game.hits} hits to disable`;
      setTimeout(() => enemyTank.classList.remove('hit'), 500);
    } else statusText.textContent = 'Missed. Adjust your position.';
    game.locked = false;
  }, 500);
}
function enemyShoot() {
  if (game.enemyDisabled || game.playerDisabled) return;
  const enemyBox = enemyTank.getBoundingClientRect();
  const tankBox = tank.getBoundingClientRect();
  const arenaBox = arena.getBoundingClientRect();
  const enemyCenter = { x: enemyBox.left + enemyBox.width / 2, y: enemyBox.top + enemyBox.height / 2 };
  const tankCenter = { x: tankBox.left + tankBox.width / 2, y: tankBox.top + tankBox.height / 2 };
  const targetAngle = Math.atan2(tankCenter.y - enemyCenter.y, tankCenter.x - enemyCenter.x) * 180 / Math.PI;
  const angleDifference = Math.abs(((targetAngle - game.enemyAim + 540) % 360) - 180);
  if (angleDifference > 12) {
    game.enemyAim = targetAngle;
    renderEnemy();
    statusText.textContent = 'Enemy is aiming...';
    return;
  }
  const bullet = document.createElement('span'); bullet.className = 'shell enemy-shell';
  bullet.style.left = `${enemyCenter.x - arenaBox.left}px`;
  bullet.style.top = `${enemyCenter.y - arenaBox.top}px`;
  arena.appendChild(bullet); statusText.textContent = 'Incoming enemy fire!';
  requestAnimationFrame(() => {
    bullet.style.transition = 'left .45s linear, top .45s linear';
    bullet.style.left = `${tankCenter.x - arenaBox.left}px`;
    bullet.style.top = `${tankCenter.y - arenaBox.top}px`;
  });
  setTimeout(() => {
    bullet.remove();
    game.armorHits += 1;
    armorText.textContent = Math.max(0, 5 - game.armorHits);
    tank.classList.add('hit');
    if (game.armorHits >= 5) {
      game.playerDisabled = true;
      tank.classList.add('disabled');
      statusText.textContent = 'Armor broken. Tank disabled.';
    } else statusText.textContent = `Armor hit! ${5 - game.armorHits} hits remaining`;
    setTimeout(() => tank.classList.remove('hit'), 500);
  }, 500);
}
function resetGame() {
  game.x = 25; game.y = 72; game.tankAngle = 0; game.aim = 0; game.enemyX = 76; game.enemyY = 28; game.enemyAim = 90; game.hits = 0; game.shots = 0; game.armorHits = 0; game.locked = false; game.enemyDisabled = false; game.playerDisabled = false;
  hitsText.textContent = '0'; shotsText.textContent = '0'; statusText.textContent = 'Enemy tank in range';
  armorText.textContent = '5'; tank.classList.remove('disabled', 'hit'); enemyTank.classList.remove('disabled', 'hit'); renderTank(); renderEnemy();
}
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => moveTank(button.dataset.move)));
arena.addEventListener('mousemove', aimTank);
document.addEventListener('keydown', event => {
  const moveKeys = { w: 'forward', s: 'backward', a: 'turn-left', d: 'turn-right' };
  if (moveKeys[event.key.toLowerCase()]) { event.preventDefault(); moveTank(moveKeys[event.key.toLowerCase()]); }
  if (event.key === ' ' || event.key === 'Enter') shoot();
});
shootButton.addEventListener('click', shoot);
resetButton.addEventListener('click', resetGame);
setInterval(enemyShoot, 5000);
setInterval(moveEnemy, 5000);
renderTank();
renderEnemy();
