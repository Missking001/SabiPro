interface StatusBannerProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const styles = {
  error: 'bg-error-bg border-l-4 border-error-base text-error-deep',
  success: 'bg-success-bg border-l-4 border-success-base text-success-deep',
  warning: 'bg-warning-bg border-l-4 border-warning-base text-warning-deep',
  info: 'bg-info-bg border-l-4 border-info-base text-info-deep',
};

export function StatusBanner({ variant, children, className = '' }: StatusBannerProps) {
  return (
    <div className={`${styles[variant]} px-4 py-3 rounded-component text-small ${className}`} role="alert">
      {children}
    </div>
  );
}
