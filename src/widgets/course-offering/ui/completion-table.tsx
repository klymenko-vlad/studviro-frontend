'use client';

import { Check, Circle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  isDone,
  type CompletionColumn,
  type CompletionState,
  type StudentCompletion,
} from '@/entities/completion';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

const STICKY = 'bg-card sticky left-0 z-10';

export function CompletionTable({
  columns,
  students,
}: {
  columns: readonly CompletionColumn[];
  students: readonly StudentCompletion[];
}) {
  const t = useTranslations('completion.report');

  return (
    <Table label={t('tableLabel')}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className={`${STICKY} align-bottom`}>
            {t('student')}
          </TableHead>
          <TableHead scope="col" className="align-bottom">
            {t('done')}
          </TableHead>
          {columns.map(column => (
            <TableHead
              key={column.id}
              scope="col"
              className="max-w-40 align-bottom whitespace-normal"
            >
              <span className="line-clamp-3">{column.title}</span>
              {column.visible ? null : (
                <Badge variant="outline" className="mt-1">
                  {t('hidden')}
                </Badge>
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.userId}>
            <TableHead scope="row" className={`${STICKY} font-medium`}>
              {student.displayName}
            </TableHead>
            <TableCell>
              {t('doneOf', { done: student.done, total: columns.length })}
            </TableCell>
            {student.cells.map(cell => (
              <TableCell key={cell.id}>
                <StateMark state={cell.state} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StateMark({ state }: { state: CompletionState }) {
  const t = useTranslations('completion.report');
  const Icon = isDone(state) ? Check : state === 'complete_fail' ? X : Circle;
  const tone = isDone(state)
    ? 'text-success'
    : state === 'complete_fail'
      ? 'text-warning'
      : 'text-muted-foreground';

  return (
    <span className="inline-flex items-center gap-1" title={t(`cell.${state}`)}>
      <Icon aria-hidden className={`size-4 ${tone}`} />
      <span className="sr-only">{t(`cell.${state}`)}</span>
    </span>
  );
}
