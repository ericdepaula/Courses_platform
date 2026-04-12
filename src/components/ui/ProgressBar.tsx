interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, className = '', showLabel = true }: ProgressBarProps) {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {percentage}% concluído
          </span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-soft)]">
        <div
          className="h-full rounded-full bg-[var(--brand-teal)] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
