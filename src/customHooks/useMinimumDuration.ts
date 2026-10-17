// src/customHooks/useMinimumDuration.ts
import { useEffect, useState } from 'react';
export function useMinimumDuration(active: boolean, ms = 400): boolean {
  const [expired, setExpired] = useState(true);
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setExpired(false);
  }

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(timer);
  }, [active, ms]);

  return active || !expired;
}
