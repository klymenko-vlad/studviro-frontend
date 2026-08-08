/**
 * Public API of the session slice.
 *
 * Everything importable from outside this slice is listed here. Deep imports
 * are an ESLint error, so an export missing from this file is invisible.
 */
export { sessionApi, type SessionResponse } from './api/session.api';
export { SessionProvider, useSession, type SessionUser } from './model/session';
