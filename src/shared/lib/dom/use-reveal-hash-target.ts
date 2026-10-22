'use client';

import { useEffect } from 'react';

const SETTLE_MS = 1500;
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;

/**
 * Brings the item the address's fragment names into view once the list that
 * holds it has rendered. The browser's own fragment scroll runs before a
 * client-fetched list exists, so a link to one exam term would otherwise land
 * at the top of the tab. Panels above the item keep loading after it appears
 * and push it down, so it is held in place until the page settles or the
 * reader takes over the scrolling.
 */
export function useRevealHashTarget(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;

    const id = window.location.hash.slice(1);
    if (id === '') return;

    const target = document.getElementById(id);
    if (target === null) return;

    const pin = () => {
      target.scrollIntoView({ block: 'start' });
    };
    pin();
    target.focus({ preventScroll: true });

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(pin) : undefined;
    observer?.observe(document.body);

    const release = () => {
      observer?.disconnect();
      window.clearTimeout(timer);
      USER_SCROLL_EVENTS.forEach(event => {
        window.removeEventListener(event, release);
      });
    };
    const timer = window.setTimeout(release, SETTLE_MS);
    USER_SCROLL_EVENTS.forEach(event => {
      window.addEventListener(event, release, { once: true, passive: true });
    });

    return release;
  }, [ready]);
}

export const revealTargetClassName =
  'scroll-mt-24 rounded-md outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4 focus:ring-offset-card';
