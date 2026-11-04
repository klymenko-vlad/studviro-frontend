'use client';

import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  toApiError,
  type CourseImportReportDto,
  type ImportSourceDto,
} from '@/shared/api';
import { Button, Label, ListSkeleton, Switch } from '@/shared/ui';

import { importCourseQueries } from '../api/import-course-queries';
import { ImportReport } from './import-report';
import { ImportSourcePicker } from './import-source-picker';

export function ImportCourse({
  institutionId,
  spaceId,
  onClose,
}: {
  institutionId: string;
  spaceId: string;
  onClose: () => void;
}) {
  const t = useTranslations('courseImport');
  const headingId = useId();
  const [source, setSource] = useState<ImportSourceDto | null>(null);
  const [result, setResult] = useState<CourseImportReportDto | null>(null);

  return (
    <section
      aria-labelledby={headingId}
      className="bg-muted/40 flex flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium">
          {result !== null
            ? t('doneTitle', { name: result.source.name })
            : source !== null
              ? t('previewTitle', { name: source.name })
              : t('title')}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t('close')}
        </Button>
      </div>

      {result !== null ? (
        <ImportReport report={result} />
      ) : source === null ? (
        <>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <ImportSourcePicker
            institutionId={institutionId}
            spaceId={spaceId}
            onChoose={setSource}
          />
        </>
      ) : (
        <ImportPreview
          institutionId={institutionId}
          spaceId={spaceId}
          source={source}
          onBack={() => {
            setSource(null);
          }}
          onDone={setResult}
        />
      )}
    </section>
  );
}

function ImportPreview({
  institutionId,
  spaceId,
  source,
  onBack,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  source: ImportSourceDto;
  onBack: () => void;
  onDone: (report: CourseImportReportDto) => void;
}) {
  const t = useTranslations('courseImport');
  const switchId = useId();
  const queryClient = useQueryClient();
  const [keepVisibility, setKeepVisibility] = useState(false);
  const visibility = keepVisibility ? 'source' : 'hidden';
  const path = { institutionId, spaceId };

  const preview = useQuery(
    importCourseQueries.preview({ path, query: { from: source.spaceId, visibility } }),
  );
  const run = useMutation({
    ...importCourseQueries.run(),
    onSuccess: async report => {
      toast.success(t('done'));
      onDone(report);
      await queryClient.invalidateQueries({
        predicate: query => keyedTo(query.queryKey, spaceId),
      });
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Switch
          id={switchId}
          checked={keepVisibility}
          onCheckedChange={setKeepVisibility}
        />
        <Label htmlFor={switchId} className="leading-snug">
          {t('keepVisibility')}
        </Label>
      </div>

      {preview.isPending ? (
        <ListSkeleton items={2} />
      ) : preview.isError ? (
        <p className="text-muted-foreground text-sm">
          {toApiError(preview.error).message}
        </p>
      ) : (
        <ImportReport report={preview.data} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!preview.isSuccess || run.isPending}
          onClick={() => {
            run.mutate({ path, body: { from: source.spaceId, visibility } });
          }}
        >
          {run.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {run.isPending ? t('importing') : t('confirm')}
        </Button>
        <Button type="button" variant="outline" disabled={run.isPending} onClick={onBack}>
          {t('back')}
        </Button>
      </div>
    </div>
  );
}

function keyedTo(queryKey: readonly unknown[], spaceId: string): boolean {
  const [head] = queryKey;
  if (typeof head !== 'object' || head === null || !('path' in head)) return false;
  const { path } = head as { path?: { spaceId?: unknown } };

  return path?.spaceId === spaceId;
}
