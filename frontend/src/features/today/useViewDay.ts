import { useEffect, useState } from 'react';

/**
 * Which day the "Heute" tab shows: null = today, otherwise a past date (D-178). Whenever the app is opened
 * again or regains focus it jumps back to today, so nothing is logged into the wrong day by accident.
 */
export function useViewDay(): [string | null, (date: string | null) => void] {
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    const backToToday = () => {
      if (document.visibilityState === 'visible') {
        setDate(null);
      }
    };
    document.addEventListener('visibilitychange', backToToday);
    window.addEventListener('focus', backToToday);
    window.addEventListener('pageshow', backToToday);
    return () => {
      document.removeEventListener('visibilitychange', backToToday);
      window.removeEventListener('focus', backToToday);
      window.removeEventListener('pageshow', backToToday);
    };
  }, []);

  return [date, setDate];
}
