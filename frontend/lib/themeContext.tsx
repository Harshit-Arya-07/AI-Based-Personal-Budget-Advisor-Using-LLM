'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'budgetai-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  // Initialize theme
  useEffect(() => {
    const initializeTheme = async () => {
      setIsLoading(true);

      // First, try localStorage for immediate response
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      let initialTheme: Theme = 'dark'; // Default to dark

      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        initialTheme = stored;
      } else if (userId) {
        // Try Firestore if logged in
        try {
          const settingsDoc = await getDoc(
            doc(db, 'users', userId, 'settings', 'preferences')
          );
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.theme && ['light', 'dark', 'system'].includes(data.theme)) {
              initialTheme = data.theme;
            }
          }
        } catch (error) {
          console.error('Failed to fetch theme from Firestore:', error);
        }
      }

      setThemeState(initialTheme);

      const resolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;
      setResolvedTheme(resolved);
      applyTheme(resolved);

      setIsLoading(false);
    };

    initializeTheme();
  }, [userId]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);

      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
      setResolvedTheme(resolved);
      applyTheme(resolved);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, newTheme);

      // Save to Firestore if logged in
      if (userId) {
        try {
          await setDoc(
            doc(db, 'users', userId, 'settings', 'preferences'),
            { theme: newTheme, updatedAt: new Date() },
            { merge: true }
          );
        } catch (error) {
          console.error('Failed to save theme to Firestore:', error);
        }
      }
    },
    [userId]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme, isLoading }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
