'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  blankCondition,
  draftIsComplete,
  draftOf,
  hasConditions,
  payloadOf,
  type RestrictionDraft,
  type RestrictionView,
} from '@/entities/restriction';
import { studyGroupQueries } from '@/entities/study-group';
import { toApiError } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { Button, Label, Select, SelectItem, Switch } from '@/shared/ui';

import {
  useSaveRestriction,
  type RestrictionTarget,
} from '../model/use-save-restriction';
import { ConditionFields, type RestrictionCandidate } from './condition-fields';

export function RestrictionEditor({
  institutionId,
  offeringId,
  spaceId,
  target,
  restriction,
  candidates,
  onDone,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  target: RestrictionTarget;
  restriction: RestrictionView | null;
  candidates: readonly RestrictionCandidate[];
  onDone: () => void;
}) {
  const t = useTranslations('restriction');
  const id = useId();
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const [draft, setDraft] = useState<RestrictionDraft>(() =>
    draftOf(restriction, timeZone),
  );
  const [incomplete, setIncomplete] = useState(false);
  const { save, pending } = useSaveRestriction(institutionId, spaceId, target);
  const groups = useQuery(
    studyGroupQueries.list({ path: { institutionId, offeringId } }),
  );
  const groupOptions = (groups.data ?? []).map(group => ({
    id: group.id,
    name: group.name ?? group.code,
  }));
  const others = candidates.filter(candidate => candidate.id !== target.id);

  const submit = async (payload: Parameters<typeof save>[0], message: string) => {
    try {
      await save(payload);
      toast.success(message);
      onDone();
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      aria-label={t('editNamed', { title: target.title })}
      onSubmit={event => {
        event.preventDefault();
        if (!draftIsComplete(draft)) {
          setIncomplete(true);
          return;
        }
        setIncomplete(false);
        void submit({ restriction: payloadOf(draft, timeZone) }, t('saved'));
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-match`}>{t('match')}</Label>
        <Select
          id={`${id}-match`}
          value={draft.match}
          onValueChange={match => {
            setDraft({ ...draft, match: match as RestrictionDraft['match'] });
          }}
        >
          <SelectItem value="all">{t('matchAll')}</SelectItem>
          <SelectItem value="any">{t('matchAny')}</SelectItem>
        </Select>
      </div>

      <ul className="flex flex-col gap-3">
        {draft.conditions.map((condition, index) => (
          <ConditionFields
            key={condition.id}
            condition={condition}
            candidates={others}
            groups={groupOptions}
            nested={false}
            onChange={next => {
              setDraft({ ...draft, conditions: draft.conditions.with(index, next) });
            }}
            onRemove={() => {
              setDraft({
                ...draft,
                conditions: draft.conditions.filter((_, at) => at !== index),
              });
            }}
          />
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft({ ...draft, conditions: [...draft.conditions, blankCondition()] });
          }}
        >
          {t('addCondition')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft({
              ...draft,
              conditions: [...draft.conditions, blankCondition('set')],
            });
          }}
        >
          {t('addSet')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={`${id}-hide`}
          checked={draft.hideWhenLocked}
          onCheckedChange={hideWhenLocked => {
            setDraft({ ...draft, hideWhenLocked });
          }}
        />
        <Label htmlFor={`${id}-hide`}>{t('hideWhenLocked')}</Label>
      </div>

      {incomplete ? (
        <p role="alert" className="text-destructive text-sm">
          {t('incomplete')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
        {!hasConditions(restriction) ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void submit({ restriction: null }, t('cleared'))}
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
