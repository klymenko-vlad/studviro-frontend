import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignmentMutations, assignmentQueries } from '@/entities/assignment';
import {
  learningMaterialMutations,
  learningMaterialQueries,
} from '@/entities/learning-material';
import {
  learningSectionMutations,
  learningSectionQueries,
} from '@/entities/learning-section';
import type { RestrictionPayload } from '@/entities/restriction';

export interface RestrictionTarget {
  kind: 'section' | 'material' | 'assignment';
  id: string;
  title: string;
}

export function useSaveRestriction(
  institutionId: string,
  spaceId: string,
  target: RestrictionTarget,
) {
  const queryClient = useQueryClient();
  const space = { institutionId, spaceId };
  const section = useMutation(learningSectionMutations.update());
  const material = useMutation(learningMaterialMutations.update());
  const assignment = useMutation(assignmentMutations.update());

  const refresh = async () => {
    const path = { path: space };
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: learningSectionQueries.listKey(path) }),
      queryClient.invalidateQueries({ queryKey: learningMaterialQueries.listKey(path) }),
      queryClient.invalidateQueries({ queryKey: assignmentQueries.listKey(path) }),
    ]);
  };

  const save = async (restriction: RestrictionPayload | null) => {
    const body = { restriction };
    if (target.kind === 'section') {
      await section.mutateAsync({ path: { ...space, sectionId: target.id }, body });
    } else if (target.kind === 'material') {
      await material.mutateAsync({ path: { ...space, materialId: target.id }, body });
    } else {
      await assignment.mutateAsync({ path: { ...space, assignmentId: target.id }, body });
    }
    await refresh();
  };

  return {
    save,
    pending: section.isPending || material.isPending || assignment.isPending,
  };
}
