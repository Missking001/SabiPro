interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-neutral-0 border border-surface-border rounded-card shadow-sm p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
}
