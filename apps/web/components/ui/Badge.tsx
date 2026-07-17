interface BadgeProps {
  variant?: 'verified' | 'available' | 'unavailable' | 'success' | 'warning' | 'error' | 'default';
  children: React.ReactNode;
}

const styles = {
  verified: 'bg-secondary-tint text-secondary-deep',
  available: 'bg-primary-tint text-primary-deep',
  unavailable: 'bg-surface-bg text-neutral-500',
  success: 'bg-success-bg text-success-deep',
  warning: 'bg-warning-bg text-warning-deep',
  error: 'bg-error-bg text-error-deep',
  default: 'bg-surface-bg text-neutral-700',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-caption font-medium px-2.5 py-1 rounded-pill ${styles[variant]}`}>
      {children}
    </span>
  );
}
