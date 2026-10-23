import { useEffect } from 'react';

export function useScrollToAnchor(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;

    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id === '') return;

    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, [ready]);
}
