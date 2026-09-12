/**
 * Navigation primitives, re-exported under one name so call sites do not have
 * to know where they come from.
 *
 * They used to be next-intl's locale-aware wrappers, which rewrote every href
 * to carry a `/sk` prefix. The locale now lives in a cookie, so there is no
 * prefix to add and the plain Next primitives are correct. Keeping the barrel
 * means switching strategies again touches this file and nothing else.
 */
export { default as Link } from 'next/link';
export { redirect, usePathname, useRouter } from 'next/navigation';
