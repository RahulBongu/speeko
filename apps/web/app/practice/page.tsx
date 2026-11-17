import type { Metadata } from 'next';
import PracticeClient from './PracticeClient';

export const metadata: Metadata = { title: 'Practice' };

export default function PracticePage() {
  return <PracticeClient />;
}
