// Run before CSS to avoid a light flash when a dark preference is saved.
(() => {
  const key = 'connect-owner-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let explicit = saved === 'light' || saved === 'dark';
  const apply = theme => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#131813' : '#D6FF3D');
    document.dispatchEvent(new Event('connect-theme-change'));
  };
  window.connectTheme = {
    toggle() {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      explicit = true;
      try { localStorage.setItem(key, next); } catch {}
      apply(next);
    }
  };
  apply(explicit ? saved : system.matches ? 'dark' : 'light');
  system.addEventListener('change', event => { if (!explicit) apply(event.matches ? 'dark' : 'light'); });
})();
