const arena = document.querySelector('#arena');
const tank = document.querySelector('#tank');
const enemyTank = document.querySelector('#enemyTank');
const shootButton = document.querySelector('#shoot');
const resetButton = document.querySelector('#reset');
const statusText = document.querySelector('#status');
const hitsText = document.querySelector('#hits');
const shotsText = document.querySelector('#shots');
const armorText = document.querySelector('#armor');
const game = { x: 25, y: 72, aim: -90, enemyX: 76, enemyY: 28, enemyAim: 90, hits: 0, shots: 0, armorHits: 0, locked: false, enemyDisabled: false, playerDisabled: false };

function renderTank() {
  tank.style.left = `${game.x}%`;
  tank.style.top = `${game.y}%`;
  tank.style.setProperty('--barrel-angle', `${game.aim}deg`);
}
function renderEnemy() {
  enemyTank.style.left = `${game.enemyX}%`;
  enemyTank.style.top = `${game.enemyY}%`;
  enemyTank.style.setProperty('--barrel-angle', `${game.enemyAim}deg`);
}
function moveTank(direction) {
  const step = 8;
  if (direction === 'up') game.y = Math.max(15, game.y - step);
  if (direction === 'down') game.y = Math.min(88, game.y + step);
  if (direction === 'left') game.x = Math.max(8, game.x - step);
  if (direction === 'right') game.x = Math.min(92, game.x + step);
  renderTank();
}
function aimTank(direction) {
  const angles = { up: -90, down: 90, left: 180, right: 0 };
  game.aim = angles[direction];
  renderTank();
  statusText.textContent = `Barrel aimed ${direction}`;
}
function moveEnemy() {
  if (game.enemyDisabled) return;
  game.enemyX = 15 + Math.random() * 75;
  game.enemyY = 15 + Math.random() * 70;
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
  game.x = 25; game.y = 72; game.aim = -90; game.enemyX = 76; game.enemyY = 28; game.enemyAim = 90; game.hits = 0; game.shots = 0; game.armorHits = 0; game.locked = false; game.enemyDisabled = false; game.playerDisabled = false;
  hitsText.textContent = '0'; shotsText.textContent = '0'; statusText.textContent = 'Enemy tank in range';
  armorText.textContent = '5'; tank.classList.remove('disabled', 'hit'); enemyTank.classList.remove('disabled', 'hit'); renderTank(); renderEnemy();
}
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => moveTank(button.dataset.move)));
document.addEventListener('keydown', event => {
  const moveKeys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const aimKeys = { w: 'up', s: 'down', a: 'left', d: 'right' };
  if (moveKeys[event.key]) { event.preventDefault(); moveTank(moveKeys[event.key]); }
  if (aimKeys[event.key.toLowerCase()]) { event.preventDefault(); aimTank(aimKeys[event.key.toLowerCase()]); }
  if (event.key === ' ' || event.key === 'Enter') shoot();
});
shootButton.addEventListener('click', shoot);
resetButton.addEventListener('click', resetGame);
setInterval(enemyShoot, 5000);
setInterval(moveEnemy, 5000);
renderTank();
renderEnemy();
