(() => {
  const section = document.getElementById('roseReveal');
  const holder = document.getElementById('roseRevealCards');
  const replay = document.getElementById('roseRevealReplay');
  if (!section || !holder || !replay) return;
  const palette = [
    ['#d84a4b', -3], ['#bbc7d2', -2], ['#d4a84e', -1],
    ['#ff8548', 0], ['#328df3', 1], ['#24b976', 2], ['#9653d7', 3]
  ];
  palette.forEach(([tone, slot], order) => {
    const card = document.createElement('div');
    card.className = `rose-variant${slot === 0 ? ' rose-variant--hero' : ''}`;
    card.style.setProperty('--tone', tone);
    card.style.setProperty('--slot', slot);
    card.style.setProperty('--order', Math.abs(slot));
    card.style.setProperty('--depth', Math.abs(slot));
    card.innerHTML = `<div class="rose-variant__top"><span class="rose-variant__mark">✿</span>Rose<span class="rose-variant__dot"></span></div>
      <div class="rose-variant__tabs"><span>Chat</span><span>Voice</span></div>
      <div class="rose-variant__orb"></div>
      <p class="rose-variant__copy">Ready when you are</p>
      <span class="rose-variant__sub">Your assistant is here</span>
      <span class="rose-variant__cta">Start talking</span>`;
    holder.append(card);
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let replayTimer;
  function reveal() { section.classList.add('expanded'); }
  function onView(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    if (reduced.matches) reveal();
    else replayTimer = setTimeout(reveal, 420);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(onView, {threshold: 0.3}).observe(section);
  } else reveal();
  replay.addEventListener('click', () => {
    clearTimeout(replayTimer);
    section.classList.remove('expanded');
    // Let the one-card state paint before sending the colours back out.
    replayTimer = setTimeout(reveal, reduced.matches ? 0 : 600);
  });
})();
