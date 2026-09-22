import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 outline-none select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
      outline: 'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
      ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 focus:ring-2 focus:ring-zinc-300',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 min-h-[32px]',
      md: 'text-sm px-4 py-2 min-h-[40px]',
      lg: 'text-base px-5 py-2.5 min-h-[48px]',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
