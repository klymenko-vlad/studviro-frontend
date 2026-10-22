'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  isFull,
  studyGroupMutations,
  studyGroupQueries,
  type StudyGroup,
} from '@/entities/study-group';
import { toApiError } from '@/shared/api';
import { Button, Select, SelectItem } from '@/shared/ui';

interface RosterStudent {
  readonly userId: string;
  readonly displayName: string;
}

export function AddToStudyGroup({
  institutionId,
  offeringId,
  group,
  candidates,
  rosterSize,
}: {
  institutionId: string;
  offeringId: string;
  group: StudyGroup;
  candidates: readonly RosterStudent[];
  rosterSize: number;
}) {
  const t = useTranslations('studyGroups');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...studyGroupMutations.addMember(),
    onSuccess: async () => {
      toast.success(t('memberAdded'));
      await queryClient.invalidateQueries({
        queryKey: studyGroupQueries.listKey({ path: { institutionId, offeringId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (isFull(group)) return <p className="text-muted-foreground text-sm">{t('full')}</p>;

  // An empty roster and a fully assigned one are different problems, and the
  // fix for each is somewhere else on the screen.
  if (rosterSize === 0)
    return <p className="text-muted-foreground text-sm">{t('nobodyEnrolled')}</p>;

  if (candidates.length === 0)
    return <p className="text-muted-foreground text-sm">{t('everyoneAssigned')}</p>;

  return (
    <Select
      uiSize="sm"
      aria-label={t('addTo', { code: group.code })}
      value=""
      disabled={mutation.isPending}
      onValueChange={userId => {
        if (userId === '') return;
        mutation.mutate({
          path: { institutionId, offeringId, groupId: group.id },
          body: { userId },
        });
      }}
    >
      <SelectItem value="">{t('addSomeone')}</SelectItem>
      {candidates.map(student => (
        <SelectItem key={student.userId} value={student.userId}>
          {student.displayName}
        </SelectItem>
      ))}
    </Select>
  );
}

export function RemoveFromStudyGroup({
  institutionId,
  offeringId,
  groupId,
  userId,
  displayName,
}: {
  institutionId: string;
  offeringId: string;
  groupId: string;
  userId: string;
  displayName: string;
}) {
  const t = useTranslations('studyGroups');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...studyGroupMutations.removeMember(),
    onSuccess: async () => {
      toast.success(t('memberRemoved', { name: displayName }));
      await queryClient.invalidateQueries({
        queryKey: studyGroupQueries.listKey({ path: { institutionId, offeringId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={mutation.isPending}
      aria-label={t('removeNamed', { name: displayName })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, offeringId, groupId, userId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('remove')}
    </Button>
  );
}

export function CloseStudyGroup({
  institutionId,
  offeringId,
  groupId,
  code,
}: {
  institutionId: string;
  offeringId: string;
  groupId: string;
  code: string;
}) {
  const t = useTranslations('studyGroups');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...studyGroupMutations.remove(),
    onSuccess: async () => {
      toast.success(t('closed', { code }));
      await queryClient.invalidateQueries({
        queryKey: studyGroupQueries.listKey({ path: { institutionId, offeringId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={mutation.isPending}
      aria-label={t('closeNamed', { code })}
      onClick={() => {
        mutation.mutate({ path: { institutionId, offeringId, groupId } });
      }}
    >
      {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('close')}
    </Button>
  );
}
