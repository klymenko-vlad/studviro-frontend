'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { buildOutline } from '@/features/arrange-outline';
import { ProgressMeter } from '@/entities/completion';
import { learningSpaceQueries } from '@/entities/learning-space';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  EmptyState,
  ListSkeleton,
} from '@/shared/ui';

import { OutlineGroupCard } from './outline-group';
import { StudentPicker, type StudentChoice } from './student-picker';

export function StudentViewOutline({
  institutionId,
  offeringId,
  spaceId,
  choice,
  onChoose,
  onExit,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  choice: StudentChoice;
  onChoose: (choice: StudentChoice) => void;
  onExit: () => void;
}) {
  const t = useTranslations('studentView');
  const tOutline = useTranslations('outline');
  const tCompletion = useTranslations('completion');
  const [choosing, setChoosing] = useState(false);

  const view = useQuery(
    learningSpaceQueries.studentView({
      path: { institutionId, spaceId },
      ...(choice.asStudent === null ? {} : { query: { asStudent: choice.asStudent } }),
    }),
  );

  const groups =
    view.data === undefined
      ? []
      : buildOutline(
          view.data.sections,
          view.data.materials,
          view.data.assignments,
        ).filter(group => group.section !== null || group.entries.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Eye aria-hidden />
        <AlertTitle>
          {choice.name === null
            ? t('viewingAsNew')
            : t('viewingAs', { name: choice.name })}
        </AlertTitle>
        <AlertDescription>{t('readOnly')}</AlertDescription>
        <div className="col-start-2 mt-2 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onExit}>
            {t('back')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-expanded={choosing}
            onClick={() => {
              setChoosing(current => !current);
            }}
          >
            {t('another')}
          </Button>
        </div>
      </Alert>

      {choosing ? (
        <StudentPicker
          institutionId={institutionId}
          spaceId={spaceId}
          onChoose={next => {
            setChoosing(false);
            onChoose(next);
          }}
          onClose={() => {
            setChoosing(false);
          }}
        />
      ) : null}

      {view.isPending ? (
        <ListSkeleton items={3} />
      ) : view.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : (
        <>
          {groups.length === 0 ? <EmptyState title={tOutline('empty')} /> : null}
          {view.data.progress.total > 0 ? (
            <Card>
              <CardContent>
                <ProgressMeter
                  tally={view.data.progress}
                  label={tCompletion('courseProgress')}
                />
              </CardContent>
            </Card>
          ) : null}
          {groups.map(group => (
            <OutlineGroupCard
              key={group.section?.id ?? 'general'}
              institutionId={institutionId}
              offeringId={offeringId}
              spaceId={spaceId}
              group={group}
              sections={view.data.sections}
              manageable={false}
              progress={view.data.progress}
              candidates={[]}
              readOnly
            />
          ))}
        </>
      )}
    </div>
  );
}
