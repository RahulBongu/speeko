import type { Metadata } from 'next';
import LeaguesClient from './LeaguesClient';

export const metadata: Metadata = { title: 'Leagues' };

export default function LeaguesPage() {
  return <LeaguesClient />;
}
