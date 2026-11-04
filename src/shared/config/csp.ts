import { THEME_STORAGE_KEY } from './app';

/**
 * The blocking inline script that applies the stored theme before first paint.
 *
 * It lives here rather than inline in the layout so it reads the same storage
 * key as the Zustand store.
 *
 * Keep it dependency-free and synchronous — it runs before any module loads.
 */
export const THEME_INIT_SCRIPT =
  `(function(){try{` +
  `var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
  `var t=s?JSON.parse(s).state.theme:'system';` +
  `var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);` +
  `document.documentElement.classList.toggle('dark',d);` +
  `document.documentElement.style.colorScheme=d?'dark':'light';` +
  `}catch(e){}})();`;

/** Request header the proxy passes the nonce to the render through. */
export const NONCE_HEADER = 'x-nonce';

/**
 * Builds the policy. Split from the proxy so it can be unit-tested without
 * constructing a request, and so the e2e header assertions have one source to
 * compare against.
 *
 * **`script-src` is nonce-based.** It cannot be hash-based: the App Router
 * serves its RSC payload through inline `self.__next_f.push(...)` scripts whose
 * contents differ per render, so no committed hash can cover them — and the
 * moment any hash appears in `script-src`, the spec requires browsers to ignore
 * `'unsafe-inline'`, which blocks those bootstrap scripts and leaves the page
 * unhydrated. Next injects the nonce into its own script tags automatically once
 * it sees one in the header.
 *
 * `style-src` keeps `'unsafe-inline'` deliberately: Next's font optimisation and
 * React's inline `style` props emit style attributes that no nonce can reach.
 * Style injection is a far lower-severity sink than script injection, so this is
 * a considered trade rather than an oversight.
 */
export function buildContentSecurityPolicy(options: {
  isProduction: boolean;
  isSecureOrigin: boolean;
  nonce: string;
  storageOrigin?: string | undefined;
}): string {
  const { isProduction, isSecureOrigin, nonce, storageOrigin } = options;
  const connectSources = ["'self'"];
  if (storageOrigin !== undefined) connectSources.push(toHttpOrigin(storageOrigin));

  const directives = [
    `default-src 'self'`,
    // 'unsafe-eval' is development-only — Turbopack's HMR runtime needs it.
    `script-src 'self' 'nonce-${nonce}'${isProduction ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    // `blob:`/`data:` cover next/image's optimiser output and inlined font subsets.
    `img-src 'self' blob: data:`,
    `font-src 'self' data:`,
    /**
     * `'self'` plus the object store, and nothing else. Browser-side API calls
     * go through the BFF at `/api/proxy`, which is same-origin. The one
     * cross-origin write is a file upload: the browser `PUT`s the bytes straight
     * to a presigned store URL (ADR 0027), so that origin has to be reachable.
     */
    `connect-src ${connectSources.join(' ')}`,
    // The privacy embeds a video material is normalised to on the server (ADR 0049).
    `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  /**
   * Blocks passive mixed content — but only where the page itself arrived over
   * https. On a plain-http origin the directive rewrites every subresource to
   * https, and nothing answers there: Chromium exempts localhost, WebKit does
   * not, so a production build served over http (CI's e2e run, a bare
   * `next start`) loads no JS at all and never hydrates. `NODE_ENV` alone
   * cannot tell those apart.
   */
  if (isProduction && isSecureOrigin) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}

/**
 * Throws on anything but an http(s) URL, so a mistyped variable fails the
 * request loudly instead of quietly widening the policy.
 */
function toHttpOrigin(url: string): string {
  const { origin, protocol } = new URL(url);
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error(`Object store origin must be http(s), got ${protocol}`);
  }
  return origin;
}

/**
 * 128 bits of CSPRNG output, base64-encoded. A nonce must be unguessable and
 * must never repeat across responses — a predictable one is worth no more than
 * `'unsafe-inline'`.
 */
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}
