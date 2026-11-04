'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountdown(initial: number | null) {
  const deadline = useRef<number | null>(null);
  const [left, setLeft] = useState(initial);
  const running = left !== null;

  const sync = (remaining: number | null) => {
    deadline.current = remaining === null ? null : Date.now() + remaining * 1000;
    setLeft(remaining);
  };

  useEffect(() => {
    deadline.current = initial === null ? null : Date.now() + initial * 1000;
  }, [initial]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      if (deadline.current === null) return;
      setLeft(Math.max(0, Math.floor((deadline.current - Date.now()) / 1000)));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [running]);

  return { left, sync };
}
