export interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  trackClassName?: string;
  label?: string;
}

/** A rounded progress bar. `value` is a 0–1 fraction. */
export function ProgressBar({
  value,
  className,
  barClassName,
  trackClassName,
  label,
}: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const percent = Math.round(clamped * 100);
  return (
    <div
      className={`relative h-3.5 w-full overflow-hidden rounded-full ${
        trackClassName ?? 'bg-cream-200'
      } ${className ?? ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label ?? 'Progress'}
    >
      <div
        className={`h-full rounded-full bg-speeko-400 transition-all duration-500 ease-out ${barClassName ?? ''}`}
        style={{ width: `${percent}%` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/25"
      />
    </div>
  );
}
