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
 * it sees one in the header. See `docs/adr/0009-nonce-based-csp.md`.
 *
 * `style-src` keeps `'unsafe-inline'` deliberately: Next's font optimisation and
 * React's inline `style` props emit style attributes that no nonce can reach.
 * Style injection is a far lower-severity sink than script injection, so this is
 * a considered trade rather than an oversight.
 */
export function buildContentSecurityPolicy(options: {
  isProduction: boolean;
  nonce: string;
}): string {
  const { isProduction, nonce } = options;

  const directives = [
    `default-src 'self'`,
    // 'unsafe-eval' is development-only — Turbopack's HMR runtime needs it.
    `script-src 'self' 'nonce-${nonce}'${isProduction ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    // `blob:`/`data:` cover next/image's optimiser output and inlined font subsets.
    `img-src 'self' blob: data:`,
    `font-src 'self' data:`,
    /**
     * `'self'` and nothing else. Browser-side API calls go through the BFF at
     * `/api/proxy`, which is same-origin — so the API's own origin never needs
     * to be reachable from the page, and an injected script has no allowed
     * destination to exfiltrate to.
     */
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];

  // Blocks passive mixed content in production without breaking plain-http dev.
  if (isProduction) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}

/**
 * 128 bits of CSPRNG output, base64-encoded. A nonce must be unguessable and
 * must never repeat across responses — a predictable one is worth no more than
 * `'unsafe-inline'`.
 */
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}
