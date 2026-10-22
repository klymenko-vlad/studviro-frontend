'use client';

import { useTranslations } from 'next-intl';

import {
  institutionRoutes,
  LANDING_ROUTE,
  Link,
  ROUTES,
  usePathname,
} from '@/shared/config';
import { Logo } from '@/shared/ui';

import { institutionIdIn } from '../model/institution-path';

/**
 * The logo goes home — and home depends on who is asking: the public landing
 * page for a visitor, the person's own landing for someone signed in, and the
 * dashboard of the institution they are working in when they are inside one.
 */
export function BrandLink({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('nav');
  const institutionId = institutionIdIn(usePathname());

  const href = !signedIn
    ? ROUTES.home
    : institutionId === undefined
      ? LANDING_ROUTE
      : institutionRoutes(institutionId).dashboard;

  return (
    <Link
      href={href}
      aria-label={t('home')}
      className="focus-visible:ring-ring/50 rounded-md outline-none focus-visible:ring-[3px]"
    >
      <Logo />
    </Link>
  );
}
