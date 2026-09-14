const clock = document.querySelector('#clock');
const revealItems = document.querySelectorAll('.reveal');
const tiltCards = document.querySelectorAll('[data-tilt]');

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  }).format(new Date());
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => revealObserver.observe(item));
updateClock();
setInterval(updateClock, 30000);

tiltCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = card.getBoundingClientRect();
    const rotateX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -3;
    const rotateY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 3;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});
