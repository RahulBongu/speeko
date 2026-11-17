import type { Metadata } from 'next';
import { SiteHeader } from '@/components/AppHeader';
import { AccountPanel } from '@/components/AccountPanel';

export const metadata: Metadata = { title: 'Account' };

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <SiteHeader active="account" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <p className="eyebrow mb-3">
          Your account
        </p>
        <AccountPanel />
      </main>
    </div>
  );
}
