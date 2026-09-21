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
  | 'enroll'
  | 'catalogue'
  | 'teaching'
  | 'grades'
  | 'calendar'
  | 'exams'
  | 'notifications'
  | 'learning'
  | 'roles'
  | 'orgUnits'
  | 'people'
  | 'search'
  | 'audit'
  | 'bulk'
  | 'settings';

/**
 * The dashboard is the institution itself and needs no permission; every other
 * tab is gated on the server's own answer for this institution, so the nav never
 * offers a screen that would refuse the person who clicks it.
 */
const GATES: Record<NavKey, Permission | null> = {
  dashboard: null,
  courses: 'enrollment:read',
  enroll: 'course:enroll',
  catalogue: 'course:manage',
  // `offering:read` gates the endpoint but every student holds it, so the tab
  // keys off the weakest permission only teaching staff are granted.
  teaching: 'grade:propose',
  grades: 'grade:read',
  calendar: 'schedule:read',
  exams: 'schedule:read',
  notifications: 'notification:read',
  // An index of every course page in the institution, including courses the
  // caller has nothing to do with. `offering:read` is held by every student,
  // which offered each of them a tab listing the whole university.
  learning: 'offering:manage',
  roles: 'role:assign',
  orgUnits: 'role:read',
  people: 'role:read',
  // Everybody with a place in the institution may search; the server decides
  // what they actually get back.
  search: 'institution:read',
  audit: 'audit:read',
  // Either half of bulk entry is enough to make the screen worth offering;
  // the screen itself refuses the half the caller cannot do.
  bulk: 'offering:manage',
  settings: 'institution:manage',
};

/**
 * A tab whose feature the institution turned off is not offered, because the
 * endpoint behind it now refuses. The permission gate above says who may; this
 * says whether the institution runs it at all.
 */
const FEATURES: Partial<Record<NavKey, FeatureFlag>> = {
  enroll: 'courseRegistration',
  grades: 'grades',
  calendar: 'timetable',
  exams: 'examRegistration',
};

const ORDER: NavKey[] = [
  'dashboard',
  'courses',
  'enroll',
  'teaching',
  'grades',
  'calendar',
  'exams',
  'notifications',
  'learning',
  'roles',
  'orgUnits',
  'people',
  'search',
  'catalogue',
  'bulk',
  'audit',
  'settings',
];

/**
 * The second row of one sticky chrome layer, not a separate bar: the same
 * translucent material as the header, offset by its height, with the page
 * passing underneath. The header's own `border-b` is the seam between the two
 * rows; `chrome-edge` is the soft outer edge of the stack, which is what a
 * hard 1px rule used to be.
 */
const CHROME = 'chrome-edge bg-background/80 sticky top-14 z-30 backdrop-blur-md';

export function InstitutionNav({ institutionId }: { institutionId: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { can, isPending } = usePermissions(institutionId);
  const features = useInstitutionFeatures(institutionId);
  const routes = institutionRoutes(institutionId);

  if (isPending) {
    return (
      <div data-translucent className={CHROME}>
        <div className="mx-auto w-full max-w-6xl px-6 py-2">
          <Skeleton
            className="h-[1.875rem] w-full max-w-md"
            data-testid="institution-nav-loading"
          />
        </div>
      </div>
    );
  }

  const visible = ORDER.filter(key => {
    const gate = GATES[key];
    const feature = FEATURES[key];

    if (gate !== null && !can(gate)) return false;

    return feature === undefined || features.isEnabled(feature);
  });

  return (
    <nav data-translucent aria-label={t('institutionLabel')} className={CHROME}>
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
                  'focus-visible:ring-ring/50 inline-flex rounded-md px-3 py-1.5 text-sm transition-[color,background-color] duration-100 ease-out outline-none focus-visible:ring-[3px] active:scale-[0.98]',
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
