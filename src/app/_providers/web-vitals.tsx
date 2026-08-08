'use client';

import { useReportWebVitals } from 'next/web-vitals';

import { logger } from '@/shared/lib';

/**
 * Thresholds Google treats as "needs improvement" — anything worse is worth a
 * warning rather than an info line. Metrics not listed here are reported at
 * info level only.
 *
 * https://web.dev/articles/defining-core-web-vitals-thresholds
 */
/**
 * Structural type for the reported metric.
 *
 * `useReportWebVitals` types its callback against the `web-vitals` package,
 * which is a transitive dependency of Next rather than one of ours — the type
 * does not resolve here. Declaring the fields we read keeps the callback fully
 * typed without taking a direct dependency for four properties.
 */
interface WebVitalMetric {
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
}

const POOR_THRESHOLDS: Record<string, number> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  TTFB: 800,
  FCP: 1800,
};

/**
 * Reports Core Web Vitals from real sessions.
 *
 * The size-limit budget in CI catches a bundle getting bigger; it cannot tell you
 * whether that translated into a slower page for someone on a mid-range phone.
 * This closes that gap — it is field data, not lab data.
 *
 * Renders nothing, so it can sit anywhere inside the client tree.
 */
export function WebVitals(): null {
  useReportWebVitals((metric: WebVitalMetric) => {
    const threshold = POOR_THRESHOLDS[metric.name];
    const isPoor = threshold !== undefined && metric.value > threshold;

    /**
     * `info`, not `debug`, for the healthy case: the logger's floor is `info`
     * in every deployed environment, so reporting at `debug` would drop exactly
     * the baseline these numbers are only meaningful against — leaving the
     * field data as a stream of failures with nothing to compare them to.
     */
    const report = isPoor ? logger.warn : logger.info;

    report(`web-vital:${metric.name}`, {
      // CLS is unitless; every other metric is milliseconds.
      value: metric.name === 'CLS' ? metric.value : Math.round(metric.value),
      rating: metric.rating,
      // `navigate` vs `back-forward-cache` changes what a number means entirely.
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });
  });

  return null;
}
