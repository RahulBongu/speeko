import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Speeko',
  description: 'Speeko — learn a new language, one lesson at a time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
