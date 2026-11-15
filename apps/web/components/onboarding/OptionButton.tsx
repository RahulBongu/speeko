'use client';

export function OptionButton({
  selected,
  label,
  description,
  onClick,
  prefix,
}: {
  selected?: boolean;
  label: string;
  description: string;
  onClick: () => void;
  prefix?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected ?? undefined}
      className={`focus-ring flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition duration-200 sm:px-5 ${
        selected
          ? 'border-speeko-400 bg-speeko-50 shadow-card-sm'
          : 'border-cream-200 bg-white hover:border-speeko-300 hover:bg-cream-50'
      }`}
    >
      {prefix ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-100 font-display text-lg font-extrabold text-bark-500">
          {prefix}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-display text-base font-extrabold text-bark-800">
          {label}
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-bark-500">
          {description}
        </span>
      </span>
    </button>
  );
}
