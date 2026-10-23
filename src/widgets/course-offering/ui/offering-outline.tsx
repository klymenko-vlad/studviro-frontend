'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { buildOutline, type OutlineEntry } from '@/features/arrange-outline';
import { SectionForm } from '@/features/manage-sections';
import type { RestrictionCandidate } from '@/features/restrict-access';
import { assignmentQueries } from '@/entities/assignment';
import { completionQueries, ProgressMeter } from '@/entities/completion';
import { authorsOffering } from '@/entities/course-offering';
import { learningMaterialQueries } from '@/entities/learning-material';
import { learningSectionQueries } from '@/entities/learning-section';
import type { CourseOfferingResponseDto } from '@/shared/api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

import { OutlineGroupCard } from './outline-group';
import { StudentPicker, type StudentChoice } from './student-picker';
import { StudentViewOutline } from './student-view-outline';
import { useScrollToAnchor } from './use-scroll-to-anchor';

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
  const tCompletion = useTranslations('completion');
  const manageable = authorsOffering(viewerRole);
  const tView = useTranslations('studentView');
  const path = { path: { institutionId, spaceId } };
  const [choosing, setChoosing] = useState(false);
  const [viewAs, setViewAs] = useState<StudentChoice | null>(null);

  const sections = useQuery(learningSectionQueries.list(path));
  const materials = useQuery(learningMaterialQueries.list(path));
  const assignments = useQuery(assignmentQueries.list(path));
  const progress = useQuery({
    ...completionQueries.myProgress(path),
    enabled: !manageable,
  });

  useScrollToAnchor(sections.isSuccess && materials.isSuccess && assignments.isSuccess);

  if (manageable && viewAs !== null) {
    return (
      <StudentViewOutline
        institutionId={institutionId}
        offeringId={offeringId}
        spaceId={spaceId}
        choice={viewAs}
        onChoose={setViewAs}
        onExit={() => {
          setViewAs(null);
        }}
      />
    );
  }

  if (sections.isPending || materials.isPending || assignments.isPending) {
    return <ListSkeleton items={3} data-testid="offering-outline-loading" />;
  }
  if (sections.isError || materials.isError || assignments.isError) {
    return <p className="text-muted-foreground text-sm">{t('error')}</p>;
  }

  const groups = buildOutline(sections.data, materials.data, assignments.data);
  const candidates = groups.flatMap(group => group.entries.map(candidateOf));
  const shown = groups.filter(
    group => manageable || group.section !== null || group.entries.length > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {manageable ? (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            aria-expanded={choosing}
            onClick={() => {
              setChoosing(current => !current);
            }}
          >
            {tView('open')}
          </Button>
          {choosing ? (
            <StudentPicker
              institutionId={institutionId}
              spaceId={spaceId}
              onChoose={choice => {
                setChoosing(false);
                setViewAs(choice);
              }}
              onClose={() => {
                setChoosing(false);
              }}
            />
          ) : null}
        </div>
      ) : null}

      {shown.length === 0 ? <EmptyState title={t('empty')} /> : null}

      {progress.data !== undefined && progress.data.total > 0 ? (
        <Card>
          <CardContent>
            <ProgressMeter tally={progress.data} label={tCompletion('courseProgress')} />
          </CardContent>
        </Card>
      ) : null}

      {shown.map(group => (
        <OutlineGroupCard
          key={group.section?.id ?? 'general'}
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          group={group}
          sections={sections.data}
          manageable={manageable}
          progress={progress.data}
          candidates={candidates}
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

function candidateOf(entry: OutlineEntry): RestrictionCandidate {
  const rule =
    entry.kind === 'material'
      ? entry.material.completionRule
      : entry.assignment.completionRule;

  return { kind: entry.kind, id: entry.id, title: entry.title, tracked: rule !== 'none' };
}
