const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollToElement = (element) => element.scrollIntoView({
  behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'
});
document.querySelector('.back-to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  history.replaceState(null, '', window.location.pathname + window.location.search);
});

if (document.body.classList.contains('page-home')) {
  const homeSections = Array.from(document.querySelectorAll('nav a[href*="scroll="], nav a[href="#contact"]'), (link) => {
    const { hash, searchParams } = new URL(link.href);
    const id = searchParams.get('scroll') || hash.slice(1);
    return { link, section: document.getElementById(id) };
  }).filter(({ section }) => section);

  const contact = homeSections.find(({ section }) => section.id === 'contact');
  homeSections.filter(({ link }) => !link.hash).forEach(({ link, section }) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      scrollToElement(section);
      history.replaceState(null, '', '/');
    });
  });
  let storedTarget;
  try { storedTarget = sessionStorage.getItem('homeScrollTarget'); sessionStorage.removeItem('homeScrollTarget'); } catch { /* Query links still work when storage is unavailable. */ }
  const initialTarget = new URLSearchParams(window.location.search).get('scroll') || storedTarget;
  if (initialTarget && document.getElementById(initialTarget)) {
    // Wait for fonts so the target stays aligned after typography settles.
    document.fonts.ready.then(() => scrollToElement(document.getElementById(initialTarget)));
    history.replaceState(null, '', '/');
  }
  const updateActiveSection = () => {
    const readingLine = Math.min(window.innerHeight * .4, 225);
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const visible = homeSections.find(({ section }) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= readingLine && rect.bottom > readingLine;
    });
    const active = window.scrollY > 1 && ((atBottom && contact) || visible);
    homeSections.forEach(({ link }) => {
      if (active?.link === link) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateActiveSection(); scheduled = false; });
  }, { passive: true });
  window.addEventListener('resize', updateActiveSection);
  document.fonts.ready.then(updateActiveSection);
  updateActiveSection();
}

const filterButtons = document.querySelectorAll('.filter-chip');
const projects = document.querySelectorAll('#projects [data-categories]');
const filterStatus = document.querySelector('.filter-status');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filterButtons.forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    projects.forEach((project) => {
      project.hidden = selected !== 'all' && !project.dataset.categories.split(',').includes(selected);
      if (!project.hidden) count++;
    });
    if (filterStatus) filterStatus.textContent = selected === 'all'
      ? `Showing all ${count} projects`
      : `Showing ${count} ${button.textContent} project${count === 1 ? '' : 's'}`;
  });
});
