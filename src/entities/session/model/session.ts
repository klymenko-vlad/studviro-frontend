'use client';

import { createContext, use } from 'react';

import type { UserResponseDto } from '@/shared/api';

/**
 * The signed-in user, handed down from the server render.
 *
 * Deliberately a context rather than a query: the server already resolved the
 * session to decide what to render, and refetching it on the client would add a
 * round trip to produce an answer we were given for free. Mutations that change
 * the user (sign-in, sign-out, a profile edit) revalidate the route, which
 * re-renders this from the server.
 */
export type SessionUser = UserResponseDto;

const SessionContext = createContext<SessionUser | null>(null);

export const SessionProvider = SessionContext.Provider;

/** The current user, or `null` when signed out. */
export function useSession(): SessionUser | null {
  return use(SessionContext);
}
