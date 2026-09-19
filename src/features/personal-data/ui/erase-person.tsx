'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { personQueries } from '@/entities/person';
import { apiQueries, toApiError } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, Button, Input, Label } from '@/shared/ui';

/**
 * Erasure is irreversible and keeps the academic record (ADR 0030), so the
 * control says both of those before it will act, and makes the operator type
 * the person's address rather than press a button. That is the same posture
 * the restore script takes, for the same reason.
 */
export function ErasePerson({
  institutionId,
  userId,
  email,
  displayName,
}: {
  institutionId: string;
  userId: string;
  email: string;
  displayName: string;
}) {
  const t = useTranslations('personalData');
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState('');
  const confirmed = confirmation.trim().toLowerCase() === email.toLowerCase();

  const mutation = useMutation({
    ...apiQueries.erasePersonalDataMutation(),
    onSuccess: async () => {
      toast.success(t('erased', { name: displayName }));
      setConfirmation('');
      await queryClient.invalidateQueries({
        queryKey: personQueries.listForInstitutionKey({ path: { institutionId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="destructive">
        <AlertTitle>{t('eraseTitle', { name: displayName })}</AlertTitle>
        <AlertDescription>{t('eraseWarning')}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`erase-${userId}`}>{t('typeAddress', { email })}</Label>
        <Input
          id={`erase-${userId}`}
          autoComplete="off"
          placeholder={email}
          value={confirmation}
          onChange={event => {
            setConfirmation(event.target.value);
          }}
        />
      </div>

      <div>
        <Button
          type="button"
          variant="destructive"
          disabled={!confirmed || mutation.isPending}
          onClick={() => {
            mutation.mutate({ path: { institutionId, userId } });
          }}
        >
          {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('erase')}
        </Button>
      </div>
    </div>
  );
}
