import type { Metadata } from 'next';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export const metadata: Metadata = {
  title: 'Lesson',
  description: 'A bite-size Speeko lesson.',
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  return <LessonPlayer courseId={courseId} lessonId={lessonId} />;
}
