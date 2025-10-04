document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('hero');

  // Toggle header style after hero scroll
  const toggleHeader = () => {
    const threshold = Math.max(0, (hero?.offsetHeight || 120) - (header?.offsetHeight || 64));
    header.classList.toggle('is-scrolled', window.scrollY > threshold);
  };
  toggleHeader();
  document.addEventListener('scroll', toggleHeader, { passive: true });

  // Category rail controls
  const rail = document.getElementById('categoryRail');
  const prevBtn = document.getElementById('scrollPrev');
  const nextBtn = document.getElementById('scrollNext');

  const getStep = () => Math.round(rail.clientWidth / 3); // show 3 at a time
  const scrollByStep = (dir) => rail.scrollBy({ left: dir * getStep(), behavior: 'smooth' });

  prevBtn?.addEventListener('click', () => scrollByStep(-1));
  nextBtn?.addEventListener('click', () => scrollByStep(1));

  // Keyboard support
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') scrollByStep(1);
    if (e.key === 'ArrowLeft') scrollByStep(-1);
  });
});