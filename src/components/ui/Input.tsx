import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[var(--text-strong)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(82,185,234,0.25)] focus:border-transparent transition-all ${
            error ? 'border-red-400/60 focus:ring-red-300/40' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
