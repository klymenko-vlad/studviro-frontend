'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Button, Input, Label, Select, SelectItem } from '@/shared/ui';

import { questionBankQueries } from '../api/question-bank-queries';

const PAGE = 20;

export function CategoryPicker({
  institutionId,
  spaceId,
  value,
  onChange,
  label,
}: {
  institutionId: string;
  spaceId: string;
  value: string;
  onChange: (categoryId: string) => void;
  label: string;
}) {
  const t = useTranslations('questionBank.picker');
  const id = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());
  const categories = useInfiniteQuery({
    ...questionBankQueries.categories({
      path: { institutionId, spaceId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = categories.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-filter`} className="text-muted-foreground text-xs">
            {t('filter')}
          </Label>
          <Input
            id={`${id}-filter`}
            type="search"
            autoComplete="off"
            className="max-w-48"
            value={filter}
            onChange={event => {
              setFilter(event.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-select`} className="text-muted-foreground text-xs">
            {t('category')}
          </Label>
          <Select
            id={`${id}-select`}
            className="max-w-[75vw] sm:max-w-xs"
            value={value}
            onValueChange={onChange}
          >
            <SelectItem value="">{t('choose')}</SelectItem>
            {rows.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {t('option', { name: category.name, count: category.questionCount })}
              </SelectItem>
            ))}
          </Select>
        </div>
        {categories.hasNextPage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={categories.isFetchingNextPage}
            onClick={() => void categories.fetchNextPage()}
          >
            {t('more')}
          </Button>
        ) : null}
      </div>
    </fieldset>
  );
}
