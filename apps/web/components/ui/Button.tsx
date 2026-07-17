import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-primary-base hover:bg-primary-deep active:bg-primary-deep text-white',
  secondary: 'border border-primary-base text-primary-base hover:bg-primary-tint',
  ghost: 'text-primary-base hover:bg-primary-tint',
  danger: 'bg-error-base hover:bg-error-deep text-white',
};

const sizes = {
  sm: 'px-4 py-2 text-small',
  md: 'px-5 py-3 text-body',
  lg: 'px-6 py-4 text-body',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-medium rounded-component min-h-[44px] transition-colors duration-150 disabled:bg-surface-disabled disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
