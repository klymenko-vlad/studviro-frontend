'use client';

import { EventDialog, TaskDialog } from '@/features/manage-planner';
import type { PersonalEvent, PersonalTask } from '@/entities/planner';

export type PersonalEditing =
  { kind: 'event'; event?: PersonalEvent } | { kind: 'task'; task?: PersonalTask } | null;

export function PersonalEditor({
  institutionId,
  editing,
  onClose,
}: {
  institutionId: string;
  editing: PersonalEditing;
  onClose: () => void;
}) {
  const close = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <>
      <EventDialog
        key={editing?.kind === 'event' ? (editing.event?.id ?? 'new') : 'closed-event'}
        institutionId={institutionId}
        event={editing?.kind === 'event' ? editing.event : undefined}
        open={editing?.kind === 'event'}
        onOpenChange={close}
      />
      <TaskDialog
        key={editing?.kind === 'task' ? (editing.task?.id ?? 'new') : 'closed-task'}
        institutionId={institutionId}
        task={editing?.kind === 'task' ? editing.task : undefined}
        open={editing?.kind === 'task'}
        onOpenChange={close}
      />
    </>
  );
}
