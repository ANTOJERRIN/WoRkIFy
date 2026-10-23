import { useEffect, useState } from 'react';

/** Refresh lifecycle presentation at clock boundaries without refetching data. */
export function useWorkshopClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
