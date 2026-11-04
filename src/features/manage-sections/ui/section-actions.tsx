'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { assignmentQueries } from '@/entities/assignment';
import { learningMaterialQueries } from '@/entities/learning-material';
import {
  learningSectionMutations,
  learningSectionQueries,
  type LearningSection,
} from '@/entities/learning-section';
import { toApiError } from '@/shared/api';
import { swapPositions } from '@/shared/lib';
import { Button } from '@/shared/ui';

export function SectionActions({
  institutionId,
  spaceId,
  section,
  sections,
  onEdit,
}: {
  institutionId: string;
  spaceId: string;
  section: LearningSection;
  sections: readonly LearningSection[];
  onEdit: () => void;
}) {
  const t = useTranslations('outline');
  const queryClient = useQueryClient();
  const path = { path: { institutionId, spaceId } };
  const index = sections.findIndex(candidate => candidate.id === section.id);
  const above = sections[index - 1] ?? null;
  const below = sections[index + 1] ?? null;

  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };
  const refreshSections = () =>
    queryClient.invalidateQueries({ queryKey: learningSectionQueries.listKey(path) });

  const update = useMutation({ ...learningSectionMutations.update(), onError });
  const remove = useMutation({
    ...learningSectionMutations.remove(),
    onSuccess: async () => {
      toast.success(t('sectionRemoved', { title: section.title }));
      await Promise.all([
        refreshSections(),
        queryClient.invalidateQueries({
          queryKey: learningMaterialQueries.listKey(path),
        }),
        queryClient.invalidateQueries({ queryKey: assignmentQueries.listKey(path) }),
      ]);
    },
    onError,
  });

  const patch = (
    target: LearningSection,
    body: { position?: number; visible?: boolean },
  ) =>
    update.mutateAsync({ path: { institutionId, spaceId, sectionId: target.id }, body });

  const swapWith = async (other: LearningSection | null) => {
    if (other === null) return;

    const [mine, theirs] = swapPositions(
      section.position,
      other.position,
      other === above,
    );

    try {
      await patch(section, { position: mine });
      await patch(other, { position: theirs });
    } finally {
      await refreshSections();
    }
  };

  const busy = update.isPending || remove.isPending;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || above === null}
        aria-label={t('moveUpNamed', { title: section.title })}
        onClick={() => void swapWith(above)}
      >
        <ArrowUp className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || below === null}
        aria-label={t('moveDownNamed', { title: section.title })}
        onClick={() => void swapWith(below)}
      >
        <ArrowDown className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('editSectionNamed', { title: section.title })}
        onClick={onEdit}
      >
        {t('edit')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={
          section.visible
            ? t('hideSectionNamed', { title: section.title })
            : t('showSectionNamed', { title: section.title })
        }
        onClick={() => {
          void patch(section, { visible: !section.visible }).finally(() => {
            void refreshSections();
          });
        }}
      >
        {section.visible ? t('hide') : t('show')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={t('removeSectionNamed', { title: section.title })}
        onClick={() => {
          remove.mutate({ path: { institutionId, spaceId, sectionId: section.id } });
        }}
      >
        {t('remove')}
      </Button>
    </div>
  );
}
