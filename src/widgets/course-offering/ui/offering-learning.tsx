'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import {
  LearningSpaceForm,
  LearningSpaceSettings,
} from '@/features/manage-learning-space';
import { authorsOffering } from '@/entities/course-offering';
import { learningSpaceQueries, spaceForOffering } from '@/entities/learning-space';
import type { CourseOfferingResponseDto } from '@/shared/api';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

import { OfferingAssignments } from './offering-assignments';
import { OfferingOutline } from './offering-outline';

/**
 * The course page. A space is authored per offering rather than derived from
 * anything (ADR 0028), so when there is none the panel offers to open one —
 * to whoever may author it — instead of reporting an absence.
 */
export function OfferingLearning({
  institutionId,
  offeringId,
  courseTitle,
  viewerRole,
}: {
  institutionId: string;
  offeringId: string;
  courseTitle: string;
  viewerRole: CourseOfferingResponseDto['viewerRole'];
}) {
  const t = useTranslations('learningSpace');
  const manageable = authorsOffering(viewerRole);

  const spaces = useQuery(
    learningSpaceQueries.list({ path: { institutionId }, query: { offeringId } }),
  );

  const space =
    spaces.data === undefined ? null : spaceForOffering(spaces.data, offeringId);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {spaces.isPending ? (
            <ListSkeleton items={2} data-testid="offering-learning-loading" />
          ) : spaces.isError ? (
            <p className="text-muted-foreground text-sm">{t('error')}</p>
          ) : space === null ? (
            manageable ? (
              <LearningSpaceForm
                institutionId={institutionId}
                offeringId={offeringId}
                defaultName={courseTitle}
              />
            ) : (
              <EmptyState size="inline" title={t('empty')} />
            )
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{space.name}</span>
                {space.shortName === null ? null : (
                  <span className="text-muted-foreground font-mono text-xs">
                    {space.shortName}
                  </span>
                )}
                <Badge variant={space.visible ? 'secondary' : 'outline'}>
                  {space.visible ? t('published') : t('unpublished')}
                </Badge>
              </div>

              {space.summary === null ? null : (
                <p className="text-muted-foreground text-sm">{space.summary}</p>
              )}

              {manageable ? (
                <LearningSpaceSettings
                  institutionId={institutionId}
                  offeringId={offeringId}
                  space={space}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {space === null ? null : (
        <OfferingOutline
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={space.id}
          viewerRole={viewerRole}
        />
      )}
    </div>
  );
}

/**
 * The work to hand in, on its own tab rather than under the reading list.
 * Assignments belong to the course's learning space; until there is one, say
 * where it is opened instead of showing an empty list.
 */
export function OfferingAssignmentsSection({
  institutionId,
  offeringId,
  viewerRole,
}: {
  institutionId: string;
  offeringId: string;
  viewerRole: CourseOfferingResponseDto['viewerRole'];
}) {
  const t = useTranslations('learningSpace');
  const spaces = useQuery(
    learningSpaceQueries.list({ path: { institutionId }, query: { offeringId } }),
  );
  const space =
    spaces.data === undefined ? null : spaceForOffering(spaces.data, offeringId);

  if (spaces.isPending) {
    return <ListSkeleton items={2} data-testid="offering-assignments-section-loading" />;
  }
  if (space === null) {
    return (
      <EmptyState
        title={t('noAssignmentsYet')}
        description={authorsOffering(viewerRole) ? t('openSpaceFirst') : undefined}
      />
    );
  }

  return (
    <OfferingAssignments
      institutionId={institutionId}
      spaceId={space.id}
      viewerRole={viewerRole}
    />
  );
}
