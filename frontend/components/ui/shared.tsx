'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, animate = true, onClick }: CardProps) {
  const Wrapper = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Wrapper
      {...animationProps}
      onClick={onClick}
      className={cn(
        'bg-card rounded-2xl border border-border p-6 transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/30',
        className
      )}
    >
      {children}
    </Wrapper>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconBg?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  icon,
  title,
  description,
  iconBg = 'bg-primary/10',
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  activeColor?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = 'bg-[#4F6EF7]',
}: ToggleSwitchProps) {
  const sizes = {
    sm: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 16 },
    md: { track: 'w-12 h-7', thumb: 'w-5 h-5', translate: 20 },
  };

  const { track, thumb, translate } = sizes[size];

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        track,
        'rounded-full p-1 transition-colors relative',
        checked ? activeColor : 'bg-accent border border-border',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.div
        layout
        className={cn(thumb, 'bg-white rounded-full shadow-sm')}
        animate={{ x: checked ? translate : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export function Avatar({ src, name, size = 'md', className, showBorder = false }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0',
        sizes[size],
        showBorder && 'ring-2 ring-border ring-offset-2 ring-offset-background',
        className
      )}
      style={{ background: 'linear-gradient(135deg, #0B1A3E 0%, #4F6EF7 100%)' }}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-white">{getInitials(name)}</span>
      )}
    </div>
  );
}

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
      className={cn(
        'px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium',
        className
      )}
    >
      Verified
    </motion.div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#4F6EF7] to-[#8B5CF6] text-white hover:opacity-90',
    secondary: 'bg-accent border border-border text-foreground hover:bg-accent/80',
    danger: 'border border-[#DC3545]/30 text-[#DC3545] hover:bg-[#DC3545]/10',
    ghost: 'hover:bg-accent text-foreground',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4',
    lg: 'h-12 px-6',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.99 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'rounded-xl font-medium transition-all flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
}

export { cn };
