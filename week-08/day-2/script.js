const arena = document.querySelector('#arena');
const tank = document.querySelector('#tank');
const enemyTank = document.querySelector('#enemyTank');
const target = document.querySelector('#target');
const shootButton = document.querySelector('#shoot');
const resetButton = document.querySelector('#reset');
const statusText = document.querySelector('#status');
const hitsText = document.querySelector('#hits');
const shotsText = document.querySelector('#shots');
const armorText = document.querySelector('#armor');
const game = { x: 25, y: 72, hits: 0, shots: 0, armorHits: 0, locked: false, enemyDisabled: false, playerDisabled: false };

function renderTank() { tank.style.left = `${game.x}%`; tank.style.top = `${game.y}%`; }
function moveTank(direction) {
  const step = 4;
  if (direction === 'up') game.y = Math.max(15, game.y - step);
  if (direction === 'down') game.y = Math.min(88, game.y + step);
  if (direction === 'left') game.x = Math.max(8, game.x - step);
  if (direction === 'right') game.x = Math.min(92, game.x + step);
  renderTank();
}
function moveTarget() { target.style.left = `${58 + Math.random() * 30}%`; target.style.top = `${22 + Math.random() * 55}%`; }
function shoot() {
  if (game.locked || game.enemyDisabled || game.playerDisabled) return;
  game.locked = true; game.shots += 1; shotsText.textContent = game.shots;
  const tankBox = tank.getBoundingClientRect();
  const targetBox = enemyTank.getBoundingClientRect();
  const arenaBox = arena.getBoundingClientRect();
  const bullet = document.createElement('span'); bullet.className = 'shell';
  bullet.style.left = `${tankBox.left - arenaBox.left + tankBox.width / 2}px`;
  bullet.style.top = `${tankBox.top - arenaBox.top + tankBox.height / 2}px`;
  arena.appendChild(bullet); statusText.textContent = 'Firing...';
  const hit = Math.abs((tankBox.left + tankBox.width / 2) - (targetBox.left + targetBox.width / 2)) < 90 && tankBox.top < targetBox.bottom;
  requestAnimationFrame(() => {
    bullet.style.transition = 'left .45s linear, top .45s linear';
    bullet.style.left = `${targetBox.left - arenaBox.left + targetBox.width / 2}px`;
    bullet.style.top = `${targetBox.top - arenaBox.top + targetBox.height / 2}px`;
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
  const bullet = document.createElement('span'); bullet.className = 'shell enemy-shell';
  bullet.style.left = `${enemyBox.left - arenaBox.left + enemyBox.width / 2}px`;
  bullet.style.top = `${enemyBox.top - arenaBox.top + enemyBox.height / 2}px`;
  arena.appendChild(bullet); statusText.textContent = 'Incoming enemy fire!';
  requestAnimationFrame(() => {
    bullet.style.transition = 'left .45s linear, top .45s linear';
    bullet.style.left = `${tankBox.left - arenaBox.left + tankBox.width / 2}px`;
    bullet.style.top = `${tankBox.top - arenaBox.top + tankBox.height / 2}px`;
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
  game.x = 25; game.y = 72; game.hits = 0; game.shots = 0; game.armorHits = 0; game.locked = false; game.enemyDisabled = false; game.playerDisabled = false;
  hitsText.textContent = '0'; shotsText.textContent = '0'; statusText.textContent = 'Target acquired';
  armorText.textContent = '5'; tank.classList.remove('disabled', 'hit'); enemyTank.classList.remove('disabled', 'hit'); renderTank(); moveTarget();
}
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => moveTank(button.dataset.move)));
document.addEventListener('keydown', event => {
  const keys = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  if (keys[event.key]) { event.preventDefault(); moveTank(keys[event.key]); }
  if (event.key === ' ' || event.key === 'Enter') shoot();
});
shootButton.addEventListener('click', shoot);
resetButton.addEventListener('click', resetGame);
setInterval(enemyShoot, 15000);
renderTank();
