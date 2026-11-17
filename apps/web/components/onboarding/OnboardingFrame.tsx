import Link from 'next/link';
import { Brand } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';

export const ONBOARDING_STEPS = 5;

export function OnboardingFrame({
  step,
  title,
  subtitle,
  backHref,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <header className="border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <Link href="/learn" className="focus-ring rounded-xl px-3 py-2 font-display text-sm font-extrabold text-bark-400 hover:bg-cream-100 hover:text-bark-700">
            Browse instead
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-3xl border-2 border-cream-200 bg-white p-5 shadow-card sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Fox className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
            <div className="min-w-0">
              <p className="eyebrow">
                Step {step} of {ONBOARDING_STEPS}
              </p>
              <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-bark-800 sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-bark-500">{subtitle}</p>

          <div className="mt-4 flex gap-1.5" aria-label={`Step ${step} of ${ONBOARDING_STEPS}`}>
            {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
              <span
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index < step ? 'bg-speeko-500' : 'bg-cream-200'
                }`}
              />
            ))}
          </div>

          <div className="mt-5">{children}</div>
        </div>

        {backHref ? (
          <Link href={backHref} className="mt-4 text-xs font-bold text-bark-400 hover:text-bark-700">
            ← Back
          </Link>
        ) : null}
      </main>
    </div>
  );
}
