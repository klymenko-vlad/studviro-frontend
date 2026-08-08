import { type NextResponse } from 'next/server';

import type { AuthTokensDto } from '@/shared/api';
import {
  apiOrigin,
  forbidden,
  isSameOrigin,
  relayFailure,
  respondWithSession,
} from '@/shared/auth';

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) return forbidden();

  const response = await fetch(`${apiOrigin()}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });

  if (!response.ok) return relayFailure(response);

  return respondWithSession((await response.json()) as AuthTokensDto);
}
