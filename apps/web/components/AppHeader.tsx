import Link from 'next/link';
import { Fox } from './Fox';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="focus-ring flex items-center gap-2 rounded-2xl" aria-label="Speeko home">
      <Fox className="h-10 w-10" />
      <span className="font-display text-2xl font-extrabold tracking-tight text-speeko-600">
        Speeko
      </span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: 'learn' | 'studio' }) {
  const linkClass = (isActive: boolean) =>
    `focus-ring rounded-xl px-3 py-2 font-display text-sm font-bold transition ${
      isActive ? 'bg-speeko-100 text-speeko-700' : 'text-bark-500 hover:bg-cream-100 hover:text-bark-700'
    }`;
  return (
    <header className="border-b border-cream-200/80 bg-cream-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Brand />
        <nav className="flex items-center gap-1" aria-label="Main">
          <Link href="/learn" className={linkClass(active === 'learn')}>
            Learn
          </Link>
          <Link href="/studio" className={linkClass(active === 'studio')}>
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StatPill({
  icon,
  value,
  label,
  tone = 'default',
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: 'default' | 'streak' | 'xp' | 'goal';
}) {
  const tones = {
    default: 'bg-white text-bark-700 border-cream-200',
    streak: 'bg-[#fff1e8] text-fox-700 border-[#ffd9c2]',
    xp: 'bg-[#fff9e0] text-[#a06b00] border-[#ffe9a8]',
    goal: 'bg-speeko-50 text-speeko-700 border-speeko-200',
  } as const;
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-1.5 ${tones[tone]}`}
      title={label}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="font-display text-sm font-extrabold leading-none">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
