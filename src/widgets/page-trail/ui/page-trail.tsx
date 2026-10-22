import { Fragment } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui';

export interface Crumb {
  label: string;
  href: string;
}

/** The trail above an inner page: the levels above it as links, then itself. */
export function PageTrail({ crumbs, current }: { crumbs: Crumb[]; current?: string }) {
  const t = useTranslations('common');

  return (
    <Breadcrumb label={t('breadcrumb')}>
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index === 0 ? null : <BreadcrumbSeparator />}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={crumb.href}>{crumb.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Fragment>
      ))}
      {current === undefined ? null : (
        <>
          {crumbs.length === 0 ? null : <BreadcrumbSeparator />}
          <BreadcrumbItem>
            <BreadcrumbPage>{current}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </Breadcrumb>
  );
}
