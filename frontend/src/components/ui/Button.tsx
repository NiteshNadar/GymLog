import * as React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  showSuccess?: boolean;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  showSuccess,
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-accent text-accent-foreground active:brightness-90',
    secondary: 'bg-surface-raised text-text-primary border border-border active:bg-surface',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary active:bg-surface',
    danger: 'bg-danger/10 text-danger active:bg-danger/20 border border-danger/20',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[13px] min-h-[36px]',
    md: 'px-4 py-2.5 text-[14px] min-h-[44px]',
    lg: 'px-5 py-3.5 text-[15px] min-h-[48px]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-40 disabled:pointer-events-none',
        'active:scale-[0.97] select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {showSuccess ? (
        <span className="check-appear inline-flex items-center gap-1.5">
          <Check size={16} strokeWidth={3} />
          Logged
        </span>
      ) : isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {!showSuccess && children}
    </button>
  );
}
