const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollToElement = (element) => element.scrollIntoView({
  behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'
});
const onHome = ['/', '/index.html'].includes(window.location.pathname);
const homeLinks = document.querySelectorAll('nav a[href*="scroll="]');

function setActiveSection(id) {
  homeLinks.forEach((link) => {
    if (new URL(link.href).searchParams.get('scroll') === id) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

document.querySelector('.back-to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  history.replaceState(null, '', window.location.pathname + window.location.search);
});

if (onHome) {
  homeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = new URL(link.href).searchParams.get('scroll');
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      scrollToElement(target);
      history.replaceState(null, '', '/');
      setActiveSection(id);
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
    const active = ['timeline', 'skills'].find((id) => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return rect.top <= window.innerHeight * .4 && rect.bottom > window.innerHeight * .4;
    });
    setActiveSection(active);
  };
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateActiveSection(); scheduled = false; });
  }, { passive: true });
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
