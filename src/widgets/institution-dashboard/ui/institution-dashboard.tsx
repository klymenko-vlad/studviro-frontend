'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { useInstitutionFeatures } from '@/entities/institution-configuration';
import { usePermissions } from '@/entities/permission';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui';

import type { DashboardSection } from '../model/sections';
import { CalendarTile } from './calendar-tile';
import { RecentActivityTile } from './recent-activity-tile';
import { StudiesSection } from './studies-section';
import { TeachingTile } from './teaching-tile';
import { TermTile } from './term-tile';
import { TileHeadingLevel } from './tile-heading';

/**
 * One dashboard per person, made of the sections their roles call for. A
 * single section needs no heading of its own — the page header already says
 * what it is about — so headings appear only once there is more than one.
 */
export function InstitutionDashboard({
  institutionId,
  sections,
}: {
  institutionId: string;
  sections: DashboardSection[];
}) {
  const t = useTranslations('dashboard');
  const { can } = usePermissions(institutionId);
  const features = useInstitutionFeatures(institutionId);

  if (sections.length === 0) {
    return (
      <Alert>
        <AlertTitle>{t('noRoleTitle')}</AlertTitle>
        <AlertDescription>{t('noRoleDescription')}</AlertDescription>
      </Alert>
    );
  }

  const canReadSchedule = can('schedule:read') && features.isEnabled('timetable');
  const weekIn = sections.find(section => section !== 'administration');
  const titled = sections.length > 1;

  const render: Record<DashboardSection, () => ReactNode> = {
    administration: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <TermTile institutionId={institutionId} canManageTerms={can('course:manage')} />
        {can('audit:read') ? <RecentActivityTile institutionId={institutionId} /> : null}
      </div>
    ),
    teaching: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <TeachingTile institutionId={institutionId} />
        {canReadSchedule && weekIn === 'teaching' ? (
          <CalendarTile institutionId={institutionId} />
        ) : null}
      </div>
    ),
    studies: () => (
      <StudiesSection
        institutionId={institutionId}
        canReadCourses={can('enrollment:read')}
        canReadGrades={can('grade:read') && features.isEnabled('grades')}
        canReadSchedule={canReadSchedule}
        canReadExams={can('schedule:read') && features.isEnabled('examRegistration')}
        showWeek={weekIn === 'studies'}
      />
    ),
  };

  return (
    <div className="flex flex-col gap-10">
      {sections.map(section => (
        <section
          key={section}
          aria-labelledby={titled ? `dashboard-${section}` : undefined}
          className="flex flex-col gap-4"
        >
          {titled ? (
            <div className="flex flex-col gap-1">
              <h2 id={`dashboard-${section}`} className="type-section">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t(`sections.${section}.description`)}
              </p>
            </div>
          ) : null}
          <TileHeadingLevel value={titled ? 'h3' : 'h2'}>
            {render[section]()}
          </TileHeadingLevel>
        </section>
      ))}
    </div>
  );
}
