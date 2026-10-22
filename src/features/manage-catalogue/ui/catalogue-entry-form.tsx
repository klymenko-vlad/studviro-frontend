'use client';

import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { catalogueMutations, catalogueQueries } from '@/entities/catalogue';
import { toApiError } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';

export type CatalogueKind = 'program' | 'course';

export function CatalogueEntryForm({
  institutionId,
  kind,
}: {
  institutionId: string;
  kind: CatalogueKind;
}) {
  const t = useTranslations('catalogue');
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey:
        kind === 'program'
          ? catalogueQueries.programsKey({ path: { institutionId } })
          : catalogueQueries.coursesKey({ path: { institutionId } }),
    });

  const settled = {
    onSuccess: async () => {
      toast.success(t(`${kind}s.added`));
      setCode('');
      setName('');
      await invalidate();
    },
    onError: (error: unknown) => {
      toast.error(toApiError(error).message);
    },
  };

  const createProgram = useMutation({
    ...catalogueMutations.createProgram(),
    ...settled,
  });
  const createCourse = useMutation({ ...catalogueMutations.createCourse(), ...settled });
  const pending = createProgram.isPending || createCourse.isPending;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (code.trim() === '' || name.trim() === '') return;

    if (kind === 'program') {
      createProgram.mutate({ path: { institutionId }, body: { code, name } });
    } else {
      createCourse.mutate({ path: { institutionId }, body: { code, title: name } });
    }
  };

  const codeId = `${kind}-code`;
  const nameId = `${kind}-name`;

  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={codeId}>{t('column.code')}</Label>
        <Input
          id={codeId}
          placeholder={t(`${kind}s.codePlaceholder`)}
          value={code}
          onChange={event => {
            setCode(event.target.value);
          }}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={nameId}>
          {kind === 'program' ? t('column.name') : t('column.title')}
        </Label>
        <Input
          id={nameId}
          placeholder={t(`${kind}s.namePlaceholder`)}
          value={name}
          onChange={event => {
            setName(event.target.value);
          }}
          className="w-64"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {t(`${kind}s.add`)}
      </Button>
    </form>
  );
}
