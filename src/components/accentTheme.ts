export type AccentTheme = 'black' | 'green' | 'white';

const STORAGE_KEY = 'paqueteo-accent-theme';
const THEMES: AccentTheme[] = ['black', 'green', 'white'];

export function getAccentTheme(): AccentTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved as AccentTheme) ? saved as AccentTheme : 'black';
  } catch {
    return 'black';
  }
}

export function applyAccentTheme(theme: AccentTheme) {
  document.documentElement.dataset.accentTheme = theme;
  window.dispatchEvent(new CustomEvent<AccentTheme>('paqueteo-accent-theme-change', { detail: theme }));
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The selection still applies for the current page when storage is unavailable.
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.dataset.accentTheme = getAccentTheme();
}
