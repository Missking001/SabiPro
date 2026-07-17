import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-small font-medium text-neutral-700">
            {label}
            {required && <span className="text-error-base" aria-hidden="true"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-neutral-0 border border-surface-input rounded-component px-4 py-3 text-body text-neutral-900 placeholder:text-neutral-500 min-h-[44px] focus:outline-none focus:border-primary-base focus:ring-1 focus:ring-primary-base disabled:bg-surface-bg disabled:cursor-not-allowed ${
            error ? 'border-error-base ring-1 ring-error-base bg-error-bg' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-caption text-error-text" role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
