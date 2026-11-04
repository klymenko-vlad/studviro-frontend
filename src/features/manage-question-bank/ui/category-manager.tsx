'use client';

import { useDeferredValue, useId, useState } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  questionBankMutations,
  questionBankQueries,
  type QuestionCategory,
} from '@/entities/question-bank';
import { toApiError } from '@/shared/api';
import { Button, Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

const PAGE = 20;

interface SpacePath {
  institutionId: string;
  spaceId: string;
}

function useCategoryActions(path: SpacePath) {
  const queryClient = useQueryClient();
  const settle = () =>
    queryClient.invalidateQueries({
      queryKey: questionBankQueries.categoriesKey({ path }),
    });
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  return {
    create: useMutation({
      ...questionBankMutations.createCategory(),
      onSuccess: settle,
      onError,
    }),
    rename: useMutation({
      ...questionBankMutations.renameCategory(),
      onSuccess: settle,
      onError,
    }),
    remove: useMutation({
      ...questionBankMutations.removeCategory(),
      onSuccess: settle,
      onError,
    }),
  };
}

export function CategoryManager({
  institutionId,
  spaceId,
  selected,
  onSelect,
}: {
  institutionId: string;
  spaceId: string;
  selected: QuestionCategory | null;
  onSelect: (category: QuestionCategory | null) => void;
}) {
  const t = useTranslations('questionBank.categories');
  const id = useId();
  const path = { institutionId, spaceId };
  const [filter, setFilter] = useState('');
  const [name, setName] = useState('');
  const q = useDeferredValue(filter.trim());
  const actions = useCategoryActions(path);

  const categories = useInfiniteQuery({
    ...questionBankQueries.categories({
      path,
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = categories.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <form
        aria-label={t('addLabel')}
        className="flex flex-wrap items-end gap-2"
        onSubmit={event => {
          event.preventDefault();
          if (name.trim() === '') return;
          actions.create.mutate(
            { path, body: { name: name.trim() } },
            {
              onSuccess: () => {
                toast.success(t('added'));
                setName('');
              },
            },
          );
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-name`}>{t('newName')}</Label>
          <Input
            id={`${id}-name`}
            autoComplete="off"
            placeholder={t('newNamePlaceholder')}
            value={name}
            onChange={event => {
              setName(event.target.value);
            }}
          />
        </div>
        <Button type="submit" size="sm" disabled={actions.create.isPending}>
          {t('add')}
        </Button>
      </form>

      <div className="flex flex-col gap-1 sm:max-w-xs">
        <Label htmlFor={`${id}-filter`}>{t('filter')}</Label>
        <Input
          id={`${id}-filter`}
          type="search"
          autoComplete="off"
          value={filter}
          onChange={event => {
            setFilter(event.target.value);
          }}
        />
      </div>

      {categories.isPending ? (
        <ListSkeleton items={2} />
      ) : categories.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q === '' ? t('empty') : t('noMatch')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={t('listLabel')}>
          {rows.map(category => (
            <CategoryRow
              key={category.id}
              path={path}
              category={category}
              selected={selected?.id === category.id}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={categories.hasNextPage}
        pending={categories.isFetchingNextPage}
        onLoadMore={() => void categories.fetchNextPage()}
      />
    </div>
  );
}

function CategoryRow({
  path,
  category,
  selected,
  onSelect,
}: {
  path: SpacePath;
  category: QuestionCategory;
  selected: boolean;
  onSelect: (category: QuestionCategory | null) => void;
}) {
  const t = useTranslations('questionBank.categories');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(category.name);
  const actions = useCategoryActions(path);
  const categoryPath = { ...path, categoryId: category.id };

  return (
    <li className="flex flex-wrap items-center gap-2">
      {renaming ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={event => {
            event.preventDefault();
            actions.rename.mutate(
              { path: categoryPath, body: { name: name.trim() } },
              {
                onSuccess: () => {
                  setRenaming(false);
                },
              },
            );
          }}
        >
          <Input
            aria-label={t('renameNamed', { name: category.name })}
            value={name}
            onChange={event => {
              setName(event.target.value);
            }}
          />
          <Button type="submit" size="sm" disabled={actions.rename.isPending}>
            {t('save')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setRenaming(false);
              setName(category.name);
            }}
          >
            {t('cancel')}
          </Button>
        </form>
      ) : (
        <>
          <Button
            type="button"
            variant={selected ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={selected}
            onClick={() => {
              onSelect(selected ? null : category);
            }}
          >
            {t('row', { name: category.name, count: category.questionCount })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('renameNamed', { name: category.name })}
            onClick={() => {
              setRenaming(true);
            }}
          >
            {t('rename')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={actions.remove.isPending}
            aria-label={t('removeNamed', { name: category.name })}
            onClick={() => {
              actions.remove.mutate(
                { path: categoryPath },
                {
                  onSuccess: () => {
                    if (selected) onSelect(null);
                  },
                },
              );
            }}
          >
            {t('remove')}
          </Button>
        </>
      )}
    </li>
  );
}
