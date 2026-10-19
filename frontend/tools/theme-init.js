// Primed: applies the theme chosen in the menu before the first paint (roadmap 7.2, D-148).
// Classic blocking script in <head>, loaded from 'self' (no inline script, CSP stays unchanged).
// Reads only a non-sensitive copy of the theme setting; the server value stays authoritative.
(function () {
  try {
    var theme = localStorage.getItem('primed.theme');
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    // Browser UI colour: use the colour of the chosen theme for every theme-color meta.
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    var color = null;
    for (var i = 0; i < metas.length; i++) {
      if ((metas[i].getAttribute('media') || '').indexOf(theme) !== -1) {
        color = metas[i].getAttribute('content');
      }
    }
    for (var j = 0; j < metas.length && color !== null; j++) {
      metas[j].setAttribute('data-color', metas[j].getAttribute('content') || '');
      metas[j].setAttribute('content', color);
    }
  } catch {
    // Storage blocked (e.g. private mode): follow the device until the settings load.
  }
})();
