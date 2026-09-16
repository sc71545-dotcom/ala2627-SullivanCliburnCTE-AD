const arena = document.querySelector('#arena');
const tank = document.querySelector('#tank');
const target = document.querySelector('#target');
const shootButton = document.querySelector('#shoot');
const resetButton = document.querySelector('#reset');
const statusText = document.querySelector('#status');
const hitsText = document.querySelector('#hits');
const shotsText = document.querySelector('#shots');
const game = { x: 25, y: 72, hits: 0, shots: 0, locked: false };

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
  if (game.locked) return;
  game.locked = true; game.shots += 1; shotsText.textContent = game.shots;
  const tankBox = tank.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
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
      game.hits += 1; hitsText.textContent = game.hits; target.classList.add('hit');
      statusText.textContent = 'Direct hit! New target incoming';
      setTimeout(() => { target.classList.remove('hit'); moveTarget(); }, 500);
    } else statusText.textContent = 'Missed. Adjust your position.';
    game.locked = false;
  }, 500);
}
function resetGame() {
  game.x = 25; game.y = 72; game.hits = 0; game.shots = 0; game.locked = false;
  hitsText.textContent = '0'; shotsText.textContent = '0'; statusText.textContent = 'Target acquired';
  target.classList.remove('hit'); renderTank(); moveTarget();
}
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => moveTank(button.dataset.move)));
document.addEventListener('keydown', event => {
  const keys = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  if (keys[event.key]) { event.preventDefault(); moveTank(keys[event.key]); }
  if (event.key === ' ' || event.key === 'Enter') shoot();
});
shootButton.addEventListener('click', shoot);
resetButton.addEventListener('click', resetGame);
renderTank();
