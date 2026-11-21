import Link from 'next/link';
import { AuthMenu } from './AuthMenu';
import { SingingFox } from './SingingFox';
import { FlameIcon, ShopIcon, TrophyIcon } from './icons';

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="focus-ring flex items-center gap-2 rounded-2xl" aria-label="Speeko home">
      <SingingFox className="h-10 w-10" />
      <span className="font-display text-2xl font-extrabold tracking-tight text-speeko-600">
        Speeko
      </span>
    </Link>
  );
}

export function SiteHeader({
  active,
}: {
  active?: 'learn' | 'practice' | 'habits' | 'shop' | 'leagues' | 'studio' | 'account';
}) {
  const linkClass = (isActive: boolean) =>
    `focus-ring whitespace-nowrap rounded-xl px-1.5 py-2 font-display text-sm font-bold transition sm:px-3 ${
      isActive ? 'bg-speeko-100 text-speeko-700' : 'text-bark-500 hover:bg-cream-100 hover:text-bark-700'
    }`;
  const current = (isActive: boolean) => (isActive ? ('page' as const) : undefined);
  return (
    <header className="border-b border-cream-200/80 bg-cream-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5">
        <Brand />
        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main">
          <Link href="/learn" className={linkClass(active === 'learn')} aria-current={current(active === 'learn')}>
            Learn
          </Link>
          <Link href="/practice" className={linkClass(active === 'practice')} aria-current={current(active === 'practice')}>
            Practice
          </Link>
          <Link
            href="/habits"
            aria-current={current(active === 'habits')}
            className={`${linkClass(active === 'habits')} inline-flex items-center gap-1.5`}
          >
            <FlameIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Habits</span>
          </Link>
          <Link
            href="/shop"
            aria-current={current(active === 'shop')}
            className={`${linkClass(active === 'shop')} inline-flex items-center gap-1.5`}
          >
            <ShopIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Shop</span>
          </Link>
          <Link
            href="/leagues"
            aria-current={current(active === 'leagues')}
            className={`${linkClass(active === 'leagues')} inline-flex items-center gap-1.5`}
          >
            <TrophyIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Leagues</span>
          </Link>
          <Link
            href="/studio"
            className={`${linkClass(active === 'studio')} hidden sm:inline-block`}
            aria-current={current(active === 'studio')}
          >
            Studio
          </Link>
          <span className="mx-1 hidden h-5 w-px bg-cream-200 sm:block" aria-hidden="true" />
          <AuthMenu />
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
    streak: 'bg-fox-100 text-fox-700 border-fox-200',
    xp: 'bg-gold-100 text-gold-700 border-gold-200',
    goal: 'bg-speeko-50 text-speeko-700 border-speeko-200',
  } as const;
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-1.5 ${tones[tone]}`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="font-display text-sm font-extrabold leading-none">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
