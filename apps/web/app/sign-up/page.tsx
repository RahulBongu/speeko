import type { Metadata } from 'next';
import { SiteHeader } from '@/components/AppHeader';
import { AuthForm } from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <AuthForm mode="sign-up" />
      </main>
    </div>
  );
}
