import { useEffect } from 'react';

export const useDisplayPreferences = (settings) => {
  useEffect(() => {
    const light = settings.theme === 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.documentElement.dataset.accent = settings.accentTheme === 'rose' ? 'rose' : 'cyan';
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', light ? '#fafafa' : settings.accentTheme === 'rose' ? '#190d14' : '#09090b');
  }, [settings.theme, settings.accentTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);
};
