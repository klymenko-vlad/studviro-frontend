import { NextResponse } from 'next/server';

import { apiOrigin, forbidden, getAccessToken, isSameOrigin } from '@/shared/auth';

/**
 * Same-origin gateway to the API for browser-side calls.
 *
 * The bearer token is attached here, on the server, so the browser never holds
 * a credential it could leak through XSS — and because every call is
 * same-origin, `connect-src` in the CSP stays `'self'` with no exception for
 * the API host.
 */

/** Hop-by-hop and identity headers that must not be forwarded verbatim. */
const STRIPPED_REQUEST_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  // Ours to set: a caller-supplied one would be an attempt to use a token of
  // their own choosing rather than the session's.
  'authorization',
  // The API is reached with a bearer token; forwarding our cookies would send
  // the session cookies to an origin that has no business seeing them.
  'cookie',
]);

const STRIPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'transfer-encoding',
  // The API cannot set cookies on this origin, and letting it try would let a
  // compromised backend overwrite the session cookies the BFF owns.
  'set-cookie',
]);

/**
 * Next decodes catch-all segments before handing them over, so `%2e%2e` arrives
 * as `..` — and `fetch` normalises it away when the URL is assembled. Without
 * this, `/api/proxy/api/v1/../../whatever` reaches API paths the browser was
 * never meant to address, with the session's bearer token attached.
 */
function isTraversalFree(path: string[]): boolean {
  return path.every(segment => segment !== '' && segment !== '.' && segment !== '..');
}

const TOKEN_ISSUING_PATHS = [
  ['api', 'v1', 'auth'],
  ['api', 'v1', 'users', 'me', 'password'],
];

/** Their responses carry a token pair, which `/api/auth/*` exists to keep out of the browser. */
function issuesTokens(path: string[]): boolean {
  return TOKEN_ISSUING_PATHS.some(prefix =>
    prefix.every((segment, index) => path[index] === segment),
  );
}

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  // Reads are safe cross-origin; writes are not. Blocking a cross-site GET
  // would break nothing but would also protect nothing.
  if (request.method !== 'GET' && !isSameOrigin(request)) return forbidden();

  const { path } = await context.params;
  if (!isTraversalFree(path)) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }
  if (issuesTokens(path)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const search = new URL(request.url).search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  }

  const accessToken = await getAccessToken();
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const upstream = await fetch(`${apiOrigin()}/${path.join('/')}${search}`, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    // Required by undici whenever a streamed body is passed through.
    duplex: 'half',
    redirect: 'manual',
    cache: 'no-store',
  } as RequestInit);

  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase()))
      responseHeaders.set(key, value);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
