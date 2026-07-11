import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'indigo' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-transparent',
      indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent',
      outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 shadow-sm',
      ghost: 'hover:bg-gray-100 text-gray-700 hover:text-gray-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3 text-xs',
      lg: 'h-11 px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
