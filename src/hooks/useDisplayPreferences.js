import { useEffect } from 'react';

export const useDisplayPreferences = (settings) => {
  useEffect(() => {
    const light = settings.theme === 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', light ? '#fafafa' : '#09090b');
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);
};
