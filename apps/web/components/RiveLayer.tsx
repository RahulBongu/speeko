'use client';

import { useRive } from '@rive-app/react-canvas';

export function RiveLayer({ src }: { src: string }) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
    stateMachines: 'State Machine 1',
  });

  if (!RiveComponent) return null;
  return <RiveComponent className="h-full w-full" />;
}
