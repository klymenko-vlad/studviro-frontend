'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { RestrictionView } from '@/entities/restriction';
import { studyGroupQueries } from '@/entities/study-group';
import { toApiError } from '@/shared/api';
import { Button, Label, ListSkeleton, Select, SelectItem, Switch } from '@/shared/ui';

import {
  useSaveRestriction,
  type AccessChange,
  type RestrictionTarget,
} from '../model/use-save-restriction';

type Others = 'hidden' | 'locked';

export function GroupsEditor({
  institutionId,
  offeringId,
  spaceId,
  target,
  restriction,
  onDone,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  target: RestrictionTarget;
  restriction: RestrictionView | null;
  onDone: () => void;
}) {
  const t = useTranslations('restriction.groups');
  const id = useId();
  const audience = restriction?.audience ?? null;
  const [chosen, setChosen] = useState<readonly string[]>(
    () =>
      audience?.groups.filter(group => !group.missing).map(group => group.groupId) ?? [],
  );
  const [others, setOthers] = useState<Others>(
    audience === null || audience.hideFromOthers ? 'hidden' : 'locked',
  );
  const [empty, setEmpty] = useState(false);
  const { save, pending } = useSaveRestriction(institutionId, spaceId, target);
  const groups = useQuery(
    studyGroupQueries.list({ path: { institutionId, offeringId } }),
  );

  const submit = async (change: AccessChange, message: string) => {
    try {
      await save(change);
      toast.success(message);
      onDone();
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      aria-label={t('named', { title: target.title })}
      onSubmit={event => {
        event.preventDefault();
        if (chosen.length === 0) {
          setEmpty(true);
          return;
        }
        setEmpty(false);
        void submit(
          { audience: { groupIds: [...chosen], hideFromOthers: others === 'hidden' } },
          t('saved'),
        );
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t('legend')}</legend>
        {groups.isPending ? (
          <ListSkeleton items={2} />
        ) : (groups.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('none')}</p>
        ) : (
          (groups.data ?? []).map(group => (
            <div key={group.id} className="flex items-center gap-2">
              <Switch
                id={`${id}-${group.id}`}
                checked={chosen.includes(group.id)}
                onCheckedChange={on => {
                  setChosen(current =>
                    on ? [...current, group.id] : current.filter(at => at !== group.id),
                  );
                }}
              />
              <Label htmlFor={`${id}-${group.id}`}>{group.name ?? group.code}</Label>
            </div>
          ))
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-others`}>{t('others')}</Label>
        <Select
          id={`${id}-others`}
          value={others}
          onValueChange={value => {
            setOthers(value as Others);
          }}
        >
          <SelectItem value="hidden">{t('othersHidden')}</SelectItem>
          <SelectItem value="locked">{t('othersLocked')}</SelectItem>
        </Select>
      </div>

      <p className="text-muted-foreground text-sm">{t('hint')}</p>

      {empty ? (
        <p role="alert" className="text-destructive text-sm">
          {t('empty')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
        {audience === null ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void submit({ audience: null }, t('cleared'))}
          >
            {t('clear')}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
