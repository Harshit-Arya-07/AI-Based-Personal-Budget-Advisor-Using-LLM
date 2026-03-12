'use client';

import { motion } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md';
  variant?: 'button' | 'switch' | 'selector';
}

export default function ThemeToggle({
  showLabel = true,
  size = 'md',
  variant = 'switch',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Simple toggle switch
  if (variant === 'switch') {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
        <div className="flex items-center gap-3">
          {isDark ? (
            <Moon className="w-5 h-5 text-[#8B5CF6]" />
          ) : (
            <Sun className="w-5 h-5 text-[#F59E0B]" />
          )}
          {showLabel && (
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
            </div>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={cn(
            'w-12 h-7 rounded-full p-1 transition-colors',
            isDark ? 'bg-[#8B5CF6]' : 'bg-accent border border-border'
          )}
        >
          <motion.div
            layout
            className="w-5 h-5 bg-white rounded-full shadow-sm"
            animate={{ x: isDark ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>
    );
  }

  // Icon button (for header)
  if (variant === 'button') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleTheme}
        className="p-2.5 rounded-xl hover:bg-accent transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Sun className="w-4 h-4 text-muted-foreground" />
        )}
      </motion.button>
    );
  }

  // Theme selector (light/dark/system)
  if (variant === 'selector') {
    const options = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'system', icon: Monitor, label: 'System' },
    ] as const;

    return (
      <div className="flex gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2',
                isActive
                  ? 'bg-[#4F6EF7] text-white'
                  : 'bg-accent border border-border text-foreground hover:bg-accent/80'
              )}
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return null;
}
