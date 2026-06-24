import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-[11px] font-medium text-text-secondary tracking-wide ml-0.5 block"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            className={cn(
              "flex w-full rounded-[var(--radius)] border border-border bg-surface-raised px-3.5 py-2.5 text-[15px] text-text-primary",
              "transition-colors duration-100",
              "placeholder:text-text-secondary/40",
              "focus:border-accent focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-40",
              "min-h-[44px]",
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
