'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  BULK_COLUMNS,
  BULK_EXAMPLE,
  BULK_KINDS,
  type BulkKind,
} from '@/features/bulk-entry';
import { usePermissions } from '@/entities/permission';
import { apiQueries, toApiError, type BulkImportResultDto } from '@/shared/api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/shared/ui';

/**
 * Preview first, always. The apply button only appears once a dry run has
 * come back, because the failure this screen exists to prevent is discovering
 * a typo in row 300 after 299 rows already exist.
 */
export function BulkEntry({ institutionId }: { institutionId: string }) {
  const t = useTranslations('bulkEntry');
  const { can } = usePermissions(institutionId);
  const [kind, setKind] = useState<BulkKind>('offerings');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<BulkImportResultDto | null>(null);

  const offerings = useMutation(apiQueries.bulkImportCourseOfferingsMutation());
  const members = useMutation(apiQueries.bulkImportProgramMembersMutation());
  const active = kind === 'offerings' ? offerings : members;

  const allowed = can(kind === 'offerings' ? 'offering:manage' : 'program:manage');

  const run = (dryRun: boolean) => {
    active.mutate(
      { path: { institutionId }, body: { text, dryRun } },
      {
        onSuccess: result => {
          setPreview(result);
          if (!dryRun) {
            toast.success(t('applied', { created: result.created }));
            setText('');
          }
        },
        onError: error => {
          setPreview(null);
          toast.error(toApiError(error).message);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bulk-kind">{t('field.kind')}</Label>
          <Select
            id="bulk-kind"
            value={kind}
            onValueChange={value => {
              setKind(value as BulkKind);
              setPreview(null);
            }}
          >
            {BULK_KINDS.map(option => (
              <SelectItem key={option} value={option}>
                {t(`kind.${option}`)}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="bulk-text">{t('field.text')}</Label>
          <p className="text-muted-foreground text-sm">
            {t('field.columns', { columns: BULK_COLUMNS[kind] })}
          </p>
          <Textarea
            id="bulk-text"
            rows={10}
            className="font-mono text-xs"
            placeholder={BULK_EXAMPLE[kind]}
            value={text}
            onChange={event => {
              setText(event.target.value);
              setPreview(null);
            }}
          />
        </div>

        {allowed ? null : (
          <Alert>
            <AlertTitle>{t('deniedTitle')}</AlertTitle>
            <AlertDescription>{t('deniedDescription')}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!allowed || text.trim() === '' || active.isPending}
            onClick={() => {
              run(true);
            }}
          >
            {active.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('preview')}
          </Button>

          <Button
            type="button"
            disabled={
              !allowed || preview === null || preview.created === 0 || active.isPending
            }
            onClick={() => {
              run(false);
            }}
          >
            {t('apply', { count: preview?.created ?? 0 })}
          </Button>
        </div>

        {preview === null ? null : <BulkResult result={preview} />}
      </CardContent>
    </Card>
  );
}

function BulkResult({ result }: { result: BulkImportResultDto }) {
  const t = useTranslations('bulkEntry');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={result.dryRun ? 'secondary' : 'default'}>
          {t(result.dryRun ? 'previewed' : 'written')}
        </Badge>
        <span className="text-sm">
          {t('summary', {
            total: result.total,
            created: result.created,
            skipped: result.skipped,
            failed: result.failed,
          })}
        </span>
      </div>

      <Table data-testid="bulk-rows">
        <TableHeader>
          <TableRow>
            <TableHead>{t('column.line')}</TableHead>
            <TableHead>{t('column.status')}</TableHead>
            <TableHead>{t('column.detail')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map(row => (
            <TableRow key={row.line}>
              <TableCell className="font-mono text-xs">{row.line}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === 'failed'
                      ? 'destructive'
                      : row.status === 'skipped'
                        ? 'outline'
                        : 'secondary'
                  }
                >
                  {t(`status.${row.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{row.detail}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
