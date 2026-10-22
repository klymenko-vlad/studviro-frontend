'use client';

import { useTranslations } from 'next-intl';

import { ExportMyData } from '@/features/personal-data';
import type { Institution } from '@/entities/institution';
import { usePermissions } from '@/entities/permission';
import { Link } from '@/shared/config';
import { Button } from '@/shared/ui';

export function InstitutionRow({ institution }: { institution: Institution }) {
  const t = useTranslations('account');
  const { can } = usePermissions(institution.id);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{institution.name}</span>
        <span className="text-muted-foreground text-sm">{institution.code}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/institutions/${institution.id}`}>
            {t('institutions.dashboard')}
          </Link>
        </Button>

        {can('enrollment:read') ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/institutions/${institution.id}/courses`}>
              {t('institutions.myCourses')}
            </Link>
          </Button>
        ) : null}

        {can('grade:read') ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/institutions/${institution.id}/grades`}>
              {t('institutions.myGrades')}
            </Link>
          </Button>
        ) : null}

        {can('role:assign') ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/institutions/${institution.id}/roles`}>
              {t('institutions.manageRoles')}
            </Link>
          </Button>
        ) : null}

        {can('institution:manage') ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/institutions/${institution.id}/settings`}>
              {t('institutions.manageSettings')}
            </Link>
          </Button>
        ) : null}

        {/*
          Self-service, and deliberately next to the institution it applies
          to: the export is scoped to one institution's record of the person,
          not to the whole account.
        */}
        <ExportMyData institutionId={institution.id} />
      </div>
    </li>
  );
}
