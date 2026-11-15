import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Speeko — learn Indian languages, one lesson at a time',
    template: '%s · Speeko',
  },
  description:
    'Speeko is a friendly, bite-size way to learn Hindi, Bengali, Marathi, Telugu, Tamil, Kannada, Malayalam, Gujarati, Punjabi, and Odia. Original lessons, streaks, and a fox called Speeko.',
  applicationName: 'Speeko',
  openGraph: {
    title: 'Speeko — learn Indian languages',
    description:
      'Bite-size lessons in ten Indian languages, with streaks, XP, and an encouraging fox.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#37b02c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-bark-800 antialiased">{children}</body>
    </html>
  );
}
