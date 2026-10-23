'use client';

import { useState } from 'react';

import { OutlineItemActions, type OutlineEntry } from '@/features/arrange-outline';
import { MaterialActions, MaterialAvailabilityForm } from '@/features/manage-materials';
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
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  entry: OutlineEntry;
  entries: readonly OutlineEntry[];
  sectionId: string | null;
  sections: readonly LearningSection[];
  manageable: boolean;
}) {
  const [scheduling, setScheduling] = useState(false);
  const closeScheduling = () => {
    setScheduling(false);
  };

  const actions = manageable ? (
    <>
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

  return (
    <li className="flex flex-col gap-2">
      {entry.kind === 'material' ? (
        <OutlineMaterial
          institutionId={institutionId}
          spaceId={spaceId}
          material={entry.material}
          manageable={manageable}
          actions={actions}
        />
      ) : (
        <OutlineAssignment
          institutionId={institutionId}
          offeringId={offeringId}
          assignment={entry.assignment}
          manageable={manageable}
          actions={actions}
        />
      )}
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
