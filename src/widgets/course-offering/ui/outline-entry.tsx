'use client';

import { useState } from 'react';

import {
  entryRow,
  OutlineItemActions,
  type OutlineEntry,
} from '@/features/arrange-outline';
import {
  MaterialActions,
  MaterialAvailabilityForm,
  MaterialCompletionSelect,
  MaterialEditForm,
} from '@/features/manage-materials';
import {
  GroupsEditor,
  RestrictionEditor,
  type RestrictionCandidate,
} from '@/features/restrict-access';
import { MarkDoneToggle, useRecordView } from '@/features/track-completion';
import {
  CompletionRuleBadge,
  CompletionStatus,
  type ItemProgress,
} from '@/entities/completion';
import { outlineAnchor, type LearningSection } from '@/entities/learning-section';
import { RestrictionNote } from '@/entities/restriction';

import { AccessButtons, type AccessPanel } from './access-buttons';
import { ItemSight } from './item-sight';
import { OutlineAssignment } from './outline-assignment';
import { OutlineMaterial } from './outline-material';
import { OutlineQuiz } from './outline-quiz';

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
  candidates,
  readOnly = false,
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
  candidates: readonly RestrictionCandidate[];
  readOnly?: boolean;
}) {
  const recordView = useRecordView(institutionId, spaceId);
  const [scheduling, setScheduling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [panel, setPanel] = useState<AccessPanel>(null);
  const closePanel = () => {
    setPanel(null);
  };
  const target = { kind: entry.kind, id: entry.id, title: entry.title };
  const closeScheduling = () => {
    setScheduling(false);
  };
  const row = entryRow(entry);
  const restriction = row.restriction;

  const authoring = manageable ? (
    <>
      {entry.kind === 'material' ? null : (
        <CompletionRuleBadge
          rule={row.completionRule}
          passPoints={row.completionPassPoints}
        />
      )}
      <OutlineItemActions
        institutionId={institutionId}
        spaceId={spaceId}
        entry={entry}
        entries={entries}
        sectionId={sectionId}
        sections={sections}
      />
      <AccessButtons title={entry.title} open={panel} onToggle={setPanel} />
      {entry.kind === 'material' ? (
        <MaterialActions
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          scheduling={scheduling}
          onSchedule={() => {
            setScheduling(current => !current);
          }}
          editing={editing}
          onEdit={() => {
            setEditing(current => !current);
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
        disabled={readOnly}
      />
    ) : (
      <CompletionStatus item={progress} passPoints={row.completionPassPoints} />
    );

  const opensToRecord =
    !readOnly && progress?.rule === 'viewed' && progress.state === 'incomplete'
      ? recordView
      : undefined;

  return (
    <li
      id={outlineAnchor(entry.kind, entry.id)}
      className="flex scroll-mt-24 flex-col gap-2"
    >
      {entry.kind === 'material' ? (
        <OutlineMaterial
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          material={entry.material}
          manageable={manageable}
          actions={authoring ?? tracking}
          onOpen={opensToRecord}
          readOnly={readOnly}
        />
      ) : entry.kind === 'quiz' ? (
        <OutlineQuiz
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          quiz={entry.quiz}
          manageable={manageable}
          actions={authoring ?? tracking}
          readOnly={readOnly}
        />
      ) : (
        <OutlineAssignment
          institutionId={institutionId}
          offeringId={offeringId}
          assignment={entry.assignment}
          manageable={manageable}
          actions={authoring ?? tracking}
          readOnly={readOnly}
        />
      )}
      {manageable && entry.kind === 'material' && editing ? (
        <MaterialEditForm
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          onDone={() => {
            setEditing(false);
          }}
        />
      ) : null}
      {manageable && entry.kind === 'material' && entry.material.kind !== 'label' ? (
        <MaterialCompletionSelect
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
        />
      ) : null}
      <RestrictionNote
        restriction={restriction}
        audience={manageable ? 'author' : 'student'}
      />
      {manageable && panel === 'access' ? (
        <RestrictionEditor
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          target={target}
          restriction={restriction}
          candidates={candidates}
          onDone={closePanel}
        />
      ) : null}
      {manageable && panel === 'groups' ? (
        <GroupsEditor
          institutionId={institutionId}
          offeringId={offeringId}
          spaceId={spaceId}
          target={target}
          restriction={restriction}
          onDone={closePanel}
        />
      ) : null}
      {manageable && panel === 'sight' ? (
        <ItemSight
          institutionId={institutionId}
          spaceId={spaceId}
          target={target}
          onDone={closePanel}
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
