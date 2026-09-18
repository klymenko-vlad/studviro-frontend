'use client';

import { useTranslations } from 'next-intl';

import {
  useInstitutionFeatures,
  type FeatureFlag,
} from '@/entities/institution-configuration';
import { usePermissions, type Permission } from '@/entities/permission';
import { institutionRoutes, Link, usePathname } from '@/shared/config';
import { cn } from '@/shared/lib';
import { Skeleton } from '@/shared/ui';

type NavKey =
  | 'dashboard'
  | 'courses'
  | 'teaching'
  | 'grades'
  | 'calendar'
  | 'exams'
  | 'notifications'
  | 'learning'
  | 'sync'
  | 'roles'
  | 'orgUnits'
  | 'people'
  | 'settings';

/**
 * The dashboard is the institution itself and needs no permission; every other
 * tab is gated on the server's own answer for this institution, so the nav never
 * offers a screen that would refuse the person who clicks it.
 */
const GATES: Record<NavKey, Permission | null> = {
  dashboard: null,
  courses: 'enrollment:read',
  // `offering:read` gates the endpoint but every student holds it, so the tab
  // keys off the weakest permission only teaching staff are granted.
  teaching: 'grade:propose',
  grades: 'grade:read',
  calendar: 'schedule:read',
  exams: 'schedule:read',
  notifications: 'notification:read',
  // The endpoint behind this screen answers to `offering:read`, which every
  // student holds; the screen itself reports import provenance, so the tab is
  // offered to the staff who run the imports.
  learning: 'sync:read',
  sync: 'sync:read',
  roles: 'role:assign',
  orgUnits: 'role:read',
  people: 'role:read',
  settings: 'institution:manage',
};

/**
 * A tab whose feature the institution turned off is not offered, because the
 * endpoint behind it now refuses. The permission gate above says who may; this
 * says whether the institution runs it at all.
 */
const FEATURES: Partial<Record<NavKey, FeatureFlag>> = {
  grades: 'grades',
  calendar: 'timetable',
  exams: 'examRegistration',
};

const ORDER: NavKey[] = [
  'dashboard',
  'courses',
  'teaching',
  'grades',
  'calendar',
  'exams',
  'notifications',
  'learning',
  'sync',
  'roles',
  'orgUnits',
  'people',
  'settings',
];

export function InstitutionNav({ institutionId }: { institutionId: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { can, isPending } = usePermissions(institutionId);
  const features = useInstitutionFeatures(institutionId);
  const routes = institutionRoutes(institutionId);

  if (isPending) {
    return (
      <Skeleton className="h-9 w-full max-w-md" data-testid="institution-nav-loading" />
    );
  }

  const visible = ORDER.filter(key => {
    const gate = GATES[key];
    const feature = FEATURES[key];

    if (gate !== null && !can(gate)) return false;

    return feature === undefined || features.isEnabled(feature);
  });

  return (
    <nav aria-label={t('institutionLabel')} className="border-border/60 border-b">
      <ul className="mx-auto flex w-full max-w-6xl flex-wrap gap-1 px-6 py-2">
        {visible.map(key => {
          const href = routes[key];
          /**
           * The dashboard is a prefix of every other tab, so it may only match
           * exactly — otherwise it stays current on every screen in the section.
           */
          const current =
            key === 'dashboard' ? pathname === href : pathname.startsWith(href);

          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'ring-offset-background focus-visible:ring-ring inline-flex rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  current
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                )}
              >
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
