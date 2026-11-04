'use client';

import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { quizEditorHref, quizMutations, quizQueries, type Quiz } from '@/entities/quiz';
import { toApiError } from '@/shared/api';
import { Link } from '@/shared/config';
import { Button, Input, Label } from '@/shared/ui';

export function NewQuizForm({
  institutionId,
  offeringId,
  spaceId,
  sectionId,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  sectionId: string | null;
}) {
  const t = useTranslations('quiz.new');
  const id = useId();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [created, setCreated] = useState<Quiz | null>(null);

  const create = useMutation({
    ...quizMutations.create(),
    onSuccess: async quiz => {
      setCreated(quiz);
      setName('');
      await queryClient.invalidateQueries({
        queryKey: quizQueries.listKey({ path: { institutionId, spaceId } }),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  if (created !== null) {
    return (
      <div className="flex flex-col gap-2" role="status">
        <p className="text-sm">{t('created', { name: created.name })}</p>
        <Link
          href={quizEditorHref(institutionId, offeringId, spaceId, created.id)}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t('setUp', { name: created.name })}
        </Link>
      </div>
    );
  }

  return (
    <form
      aria-label={t('label')}
      className="flex flex-wrap items-end gap-2"
      onSubmit={event => {
        event.preventDefault();
        if (name.trim() === '') return;
        create.mutate({
          path: { institutionId, spaceId },
          body: { name: name.trim(), visible: false, sectionId },
        });
      }}
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <Label htmlFor={`${id}-name`}>{t('name')}</Label>
        <Input
          id={`${id}-name`}
          autoComplete="off"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={event => {
            setName(event.target.value);
          }}
        />
      </div>
      <Button type="submit" size="sm" disabled={create.isPending || name.trim() === ''}>
        {create.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {t('create')}
      </Button>
      <p className="text-muted-foreground w-full text-xs">{t('hint')}</p>
    </form>
  );
}
