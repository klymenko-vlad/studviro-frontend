'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useThemeStore } from '@/shared/model';

/**
 * Local deviation from upstream shadcn: the theme comes from our Zustand store
 * rather than `next-themes`, which this app does not use — the theme is applied
 * before first paint by `THEME_INIT_SCRIPT`. Keep this on re-generation.
 *
 * Colours come from the same design tokens as everything else, so a toast in
 * dark mode is the same surface as a popover in dark mode.
 */
function Toaster({ ...props }: ToasterProps) {
  const theme = useThemeStore(state => state.theme);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
