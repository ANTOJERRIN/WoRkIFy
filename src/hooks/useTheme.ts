import { useCallback, useEffect, useState } from 'react';

const storageKey = 'workify-theme';
export function useTheme() {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'dark'; }
    catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(storageKey, darkMode ? 'dark' : 'light'); }
    catch { /* Theme still works when browser storage is unavailable. */ }
  }, [darkMode]);
  const toggleDarkMode = useCallback(() => setDarkMode(previous => !previous), []);
  return { darkMode, toggleDarkMode };
}
