import type { Instrumentation } from 'next';

/**
 * Next.js instrumentation hook — the one place server-side observability is
 * initialised, and the seam an APM vendor plugs into.
 *
 * It runs once per server process, before any request is handled, in every
 * runtime the app is served from.
 */
export async function register(): Promise<void> {
  const { logger } = await import('@/shared/lib');

  /**
   * The Edge runtime has no Node APIs, so a vendor SDK that needs them can only
   * be initialised on the `nodejs` runtime. Branching here rather than at the
   * import site keeps the edge bundle from pulling the Node build in at all.
   */
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    logger.info('server instrumentation registered', {
      runtime: 'nodejs',
      env: process.env['NEXT_PUBLIC_ENV'] ?? 'unknown',
    });
  }
}

/**
 * Called for every uncaught error thrown during a server render or a Route
 * Handler, including errors an `error.tsx` boundary swallows on the client's
 * behalf. Without this, those errors reach nothing but the container's stdout.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const { logger } = await import('@/shared/lib');

  logger.error('unhandled server error', {
    error,
    path: request.path,
    method: request.method,
    // Distinguishes a failed page render from a failed Route Handler or an
    // error surfaced during static generation.
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    /**
     * The backend stamps every response with `x-request-id`; carrying it here is
     * what lets a frontend stack trace be joined to the backend's pino logs for
     * the same request.
     */
    requestId: request.headers['x-request-id'],
  });
};
