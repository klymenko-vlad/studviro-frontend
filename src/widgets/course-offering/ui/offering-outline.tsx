'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { buildOutline } from '@/features/arrange-outline';
import { SectionForm } from '@/features/manage-sections';
import { assignmentQueries } from '@/entities/assignment';
import { authorsOffering } from '@/entities/course-offering';
import { learningMaterialQueries } from '@/entities/learning-material';
import { learningSectionQueries } from '@/entities/learning-section';
import type { CourseOfferingResponseDto } from '@/shared/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

import { OutlineGroupCard } from './outline-group';

export function OfferingOutline({
  institutionId,
  offeringId,
  spaceId,
  viewerRole,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  viewerRole: CourseOfferingResponseDto['viewerRole'];
}) {
  const t = useTranslations('outline');
  const manageable = authorsOffering(viewerRole);
  const path = { path: { institutionId, spaceId } };

  const sections = useQuery(learningSectionQueries.list(path));
  const materials = useQuery(learningMaterialQueries.list(path));
  const assignments = useQuery(assignmentQueries.list(path));

  if (sections.isPending || materials.isPending || assignments.isPending) {
    return <ListSkeleton items={3} data-testid="offering-outline-loading" />;
  }
  if (sections.isError || materials.isError || assignments.isError) {
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;
  }

  const groups = buildOutline(sections.data, materials.data, assignments.data);
  const shown = groups.filter(
    group => manageable || group.section !== null || group.entries.length > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {shown.length === 0 ? <EmptyState title={t('empty')} /> : null}

      {shown.map(group => (
        <OutlineGroupCard
          key={group.section?.id ?? 'general'}
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          group={group}
          sections={sections.data}
          manageable={manageable}
        />
      ))}

      {manageable ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('addSection')}</CardTitle>
            <CardDescription>{t('addSectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SectionForm institutionId={institutionId} spaceId={spaceId} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
