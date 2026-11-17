import type { Metadata } from 'next';
import HabitsClient from './HabitsClient';

export const metadata: Metadata = { title: 'Habits' };

export default function HabitsPage() {
  return <HabitsClient />;
}
