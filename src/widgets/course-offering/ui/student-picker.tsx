'use client';

import { useDeferredValue, useId, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { learningSpaceQueries } from '@/entities/learning-space';
import { Button, Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

const PAGE = 10;

export interface StudentChoice {
  asStudent: string | null;
  name: string | null;
}

export function StudentPicker({
  institutionId,
  spaceId,
  onChoose,
  onClose,
}: {
  institutionId: string;
  spaceId: string;
  onChoose: (choice: StudentChoice) => void;
  onClose: () => void;
}) {
  const t = useTranslations('studentView');
  const headingId = useId();
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());

  const students = useInfiniteQuery({
    ...learningSpaceQueries.students({
      path: { institutionId, spaceId },
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = students.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <section
      aria-labelledby={headingId}
      className="bg-muted/40 flex flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium">
          {t('pickerTitle')}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t('close')}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">{t('pickerDescription')}</p>

      <Button
        type="button"
        variant="outline"
        className="h-auto justify-start py-2 text-left whitespace-normal"
        onClick={() => {
          onChoose({ asStudent: null, name: null });
        }}
      >
        <span className="flex flex-col">
          <span>{t('newStudent')}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {t('newStudentHint')}
          </span>
        </span>
      </Button>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor={filterId}>{t('filter')}</Label>
        <Input
          id={filterId}
          type="search"
          autoComplete="off"
          placeholder={t('filterPlaceholder')}
          value={filter}
          onChange={event => {
            setFilter(event.target.value);
          }}
        />
      </div>

      {students.isPending ? (
        <ListSkeleton items={2} />
      ) : students.isError ? (
        <p className="text-muted-foreground text-sm">{t('studentsError')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map(student => (
            <li key={student.userId}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start py-2 text-left whitespace-normal"
                onClick={() => {
                  onChoose({ asStudent: student.userId, name: student.displayName });
                }}
              >
                <span className="flex min-w-0 flex-col">
                  <span>{student.displayName}</span>
                  <span className="text-muted-foreground truncate text-xs font-normal">
                    {student.email}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={students.hasNextPage}
        pending={students.isFetchingNextPage}
        onLoadMore={() => void students.fetchNextPage()}
      />
    </section>
  );
}
