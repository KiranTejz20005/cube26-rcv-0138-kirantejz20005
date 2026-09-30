'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface FormattedDateProps {
  date: string | Date;
  format?: 'time' | 'date' | 'full';
  className?: string;
}

export function FormattedDate({ date, format = 'time', className }: FormattedDateProps) {
  const isHydrated = useIsHydrated();
  const d = new Date(date);

  if (!isHydrated) {
    // Deterministic fallback rendered on SSR to guarantee hydration match
    const isoString = d.toISOString().slice(0, 16).replace('T', ' ');
    return <span className={className} suppressHydrationWarning>{isoString}</span>;
  }

  if (format === 'time') {
    return (
      <span className={className} suppressHydrationWarning>
        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  }

  if (format === 'date') {
    return (
      <span className={className} suppressHydrationWarning>
        {d.toLocaleDateString()}
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {d.toLocaleString()}
    </span>
  );
}

