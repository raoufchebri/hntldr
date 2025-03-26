'use client';

import { useTheme } from '@/context/ThemeContext';
import { useRef } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const lastThemeChangeTime = useRef<number>(0);
  const themeChangeThreshold = 5000; // 5 seconds between theme change events

  const handleToggleTheme = () => {
    const now = Date.now();
    const timeSinceLastChange = now - lastThemeChangeTime.current;
    
    // Only track theme changes if enough time has passed
    if (timeSinceLastChange > themeChangeThreshold) {
      lastThemeChangeTime.current = now;
    }
    
    // Toggle the theme
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggleTheme}
      className="px-4 py-2 font-pixel text-sm border-2 border-dashed transition-colors
                bg-primary text-primary hover:text-orange-500
                border-primary hover:border-orange-500"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
} 