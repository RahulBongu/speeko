'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-[#ffd9c2] bg-[#fff1e8] px-4 py-2 text-center text-sm font-extrabold text-fox-700"
    >
      You are offline. Progress stays on this device and syncs when you reconnect.
    </div>
  );
}