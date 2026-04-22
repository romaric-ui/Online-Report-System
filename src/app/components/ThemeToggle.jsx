'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-soft w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0"
      title={dark ? 'Passer en mode clair' : 'Passer en mode nuit'}
    >
      {dark
        ? <Sun className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
        : <Moon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
      }
    </button>
  );
}
