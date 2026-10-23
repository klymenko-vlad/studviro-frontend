'use client';

import { useState } from 'react';

import { OutlineItemActions, type OutlineEntry } from '@/features/arrange-outline';
import {
  MaterialActions,
  MaterialAvailabilityForm,
  MaterialCompletionSelect,
} from '@/features/manage-materials';
import { MarkDoneToggle, useRecordView } from '@/features/track-completion';
import {
  CompletionRuleBadge,
  CompletionStatus,
  type ItemProgress,
} from '@/entities/completion';
import type { LearningSection } from '@/entities/learning-section';

import { OutlineAssignment } from './outline-assignment';
import { OutlineMaterial } from './outline-material';

export function OutlineEntryItem({
  institutionId,
  offeringId,
  spaceId,
  entry,
  entries,
  sectionId,
  sections,
  manageable,
  progress,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  entry: OutlineEntry;
  entries: readonly OutlineEntry[];
  sectionId: string | null;
  sections: readonly LearningSection[];
  manageable: boolean;
  progress?: ItemProgress;
}) {
  const recordView = useRecordView(institutionId, spaceId);
  const [scheduling, setScheduling] = useState(false);
  const closeScheduling = () => {
    setScheduling(false);
  };

  const authoring = manageable ? (
    <>
      {entry.kind === 'assignment' ? (
        <CompletionRuleBadge
          rule={entry.assignment.completionRule}
          passPoints={entry.assignment.completionPassPoints}
        />
      ) : null}
      <OutlineItemActions
        institutionId={institutionId}
        spaceId={spaceId}
        entry={entry}
        entries={entries}
        sectionId={sectionId}
        sections={sections}
      />
      {entry.kind === 'material' ? (
        <MaterialActions
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          scheduling={scheduling}
          onSchedule={() => {
            setScheduling(current => !current);
          }}
        />
      ) : null}
    </>
  ) : null;

  const tracking =
    progress === undefined ? null : progress.rule === 'manual' ? (
      <MarkDoneToggle
        institutionId={institutionId}
        spaceId={spaceId}
        item={progress}
        title={entry.title}
      />
    ) : (
      <CompletionStatus
        item={progress}
        passPoints={
          entry.kind === 'assignment' ? entry.assignment.completionPassPoints : null
        }
      />
    );

  const opensToRecord =
    progress?.rule === 'viewed' && progress.state === 'incomplete'
      ? recordView
      : undefined;

  return (
    <li className="flex flex-col gap-2">
      {entry.kind === 'material' ? (
        <OutlineMaterial
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          manageable={manageable}
          actions={authoring ?? tracking}
          onOpen={opensToRecord}
        />
      ) : (
        <OutlineAssignment
          institutionId={institutionId}
          offeringId={offeringId}
          assignment={entry.assignment}
          manageable={manageable}
          actions={authoring ?? tracking}
        />
      )}
      {manageable && entry.kind === 'material' ? (
        <MaterialCompletionSelect
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
        />
      ) : null}
      {manageable && scheduling && entry.kind === 'material' ? (
        <MaterialAvailabilityForm
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          onDone={closeScheduling}
        />
      ) : null}
    </li>
  );
}
