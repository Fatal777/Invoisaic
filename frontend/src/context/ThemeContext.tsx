import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    
    // Default to dark mode
    return 'dark';
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update document class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    
    // Add smooth transition class to body
    document.documentElement.style.setProperty('--theme-transition-duration', '500ms');
    
    setTimeout(() => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
      
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.style.removeProperty('--theme-transition-duration');
      }, 500);
    }, 50);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
