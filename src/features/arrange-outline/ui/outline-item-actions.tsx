'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { assignmentMutations, assignmentQueries } from '@/entities/assignment';
import {
  learningMaterialMutations,
  learningMaterialQueries,
} from '@/entities/learning-material';
import type { LearningSection } from '@/entities/learning-section';
import { toApiError } from '@/shared/api';
import { swapPositions } from '@/shared/lib';
import { Button, Select, SelectItem } from '@/shared/ui';

import { neighbourEntry, type OutlineEntry } from '../model/outline';

const GENERAL = 'general';

interface Placement {
  position?: number;
  sectionId?: string | null;
}

function usePlaceEntry(institutionId: string, spaceId: string) {
  const queryClient = useQueryClient();
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };
  const material = useMutation({ ...learningMaterialMutations.update(), onError });
  const assignment = useMutation({ ...assignmentMutations.update(), onError });

  const place = (entry: OutlineEntry, body: Placement) =>
    entry.kind === 'material'
      ? material.mutateAsync({
          path: { institutionId, spaceId, materialId: entry.id },
          body,
        })
      : assignment.mutateAsync({
          path: { institutionId, spaceId, assignmentId: entry.id },
          body,
        });

  const refresh = async () => {
    const path = { path: { institutionId, spaceId } };
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: learningMaterialQueries.listKey(path) }),
      queryClient.invalidateQueries({ queryKey: assignmentQueries.listKey(path) }),
    ]);
  };

  return { place, refresh, busy: material.isPending || assignment.isPending };
}

export function OutlineItemActions({
  institutionId,
  spaceId,
  entry,
  entries,
  sectionId,
  sections,
}: {
  institutionId: string;
  spaceId: string;
  entry: OutlineEntry;
  entries: readonly OutlineEntry[];
  sectionId: string | null;
  sections: readonly LearningSection[];
}) {
  const t = useTranslations('outline');
  const { place, refresh, busy } = usePlaceEntry(institutionId, spaceId);
  const above = neighbourEntry(entries, entry.id, -1);
  const below = neighbourEntry(entries, entry.id, 1);

  const swapWith = async (other: OutlineEntry | null) => {
    if (other === null) return;

    const [mine, theirs] = swapPositions(entry.position, other.position, other === above);

    try {
      await place(entry, { position: mine });
      await place(other, { position: theirs });
    } finally {
      await refresh();
    }
  };

  const moveTo = async (target: string) => {
    try {
      await place(entry, { sectionId: target === GENERAL ? null : target });
      toast.success(t('moved', { title: entry.title }));
    } finally {
      await refresh();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || above === null}
        aria-label={t('moveUpNamed', { title: entry.title })}
        onClick={() => void swapWith(above)}
      >
        <ArrowUp className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || below === null}
        aria-label={t('moveDownNamed', { title: entry.title })}
        onClick={() => void swapWith(below)}
      >
        <ArrowDown className="size-4" aria-hidden />
      </Button>
      {sections.length === 0 ? null : (
        <Select
          uiSize="sm"
          value={sectionId ?? GENERAL}
          disabled={busy}
          aria-label={t('sectionOfNamed', { title: entry.title })}
          onValueChange={target => void moveTo(target)}
        >
          <SelectItem value={GENERAL}>{t('general')}</SelectItem>
          {sections.map(section => (
            <SelectItem key={section.id} value={section.id}>
              {section.title}
            </SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
}
