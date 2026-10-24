'use client';

import { useDeferredValue, useEffect, useId, useState } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  kilobytes,
  learningMaterialMutations,
  learningMaterialQueries,
  type LearningMaterial,
} from '@/entities/learning-material';
import { toApiError, uploadViaTicket, useUploadErrorMessage } from '@/shared/api';
import { Button, Input, Label, ListSkeleton, LoadMore } from '@/shared/ui';

import { MaterialDownload } from './material-download';

const PAGE = 10;

export function FolderFiles({
  institutionId,
  spaceId,
  material,
  manageable,
  readOnly = false,
  onOpen,
}: {
  institutionId: string;
  spaceId: string;
  material: LearningMaterial;
  manageable: boolean;
  readOnly?: boolean;
  onOpen?: (materialId: string) => void;
}) {
  const t = useTranslations('materials.folder');
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim());
  const path = { institutionId, spaceId, materialId: material.id };

  useEffect(() => {
    onOpen?.(material.id);
  }, [onOpen, material.id]);

  const files = useInfiniteQuery({
    ...learningMaterialQueries.folderFiles({
      path,
      query: { limit: PAGE, ...(q === '' ? {} : { q }) },
    }),
    placeholderData: keepPreviousData,
  });
  const rows = files.data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
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

      {files.isPending ? (
        <ListSkeleton items={2} />
      ) : files.isError ? (
        <p className="text-muted-foreground text-sm">{t('error')}</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q === '' ? t('empty') : t('noMatch')}
        </p>
      ) : (
        <ul
          className="flex flex-col gap-2"
          aria-label={t('listNamed', { title: material.title })}
        >
          {rows.map(file => (
            <li key={file.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 break-all">{file.filename}</span>
              <span className="text-muted-foreground">
                {file.sizeBytes === null
                  ? null
                  : t('size', { kilobytes: kilobytes(file.sizeBytes) })}
              </span>
              {readOnly ? null : (
                <MaterialDownload
                  institutionId={institutionId}
                  spaceId={spaceId}
                  materialId={material.id}
                  fileId={file.id}
                  title={file.filename}
                  scanStatus={file.scanStatus}
                />
              )}
              {manageable ? (
                <RemoveFolderFile path={path} fileId={file.id} filename={file.filename} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <LoadMore
        shown={rows.length}
        hasMore={files.hasNextPage}
        pending={files.isFetchingNextPage}
        onLoadMore={() => void files.fetchNextPage()}
      />

      {manageable ? <AddFolderFiles path={path} /> : null}
    </div>
  );
}

interface FolderPath {
  institutionId: string;
  spaceId: string;
  materialId: string;
}

function useRefreshFolder(path: FolderPath) {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: learningMaterialQueries.folderFilesKey({ path }),
    });
}

function RemoveFolderFile({
  path,
  fileId,
  filename,
}: {
  path: FolderPath;
  fileId: string;
  filename: string;
}) {
  const t = useTranslations('materials.folder');
  const refresh = useRefreshFolder(path);
  const remove = useMutation({
    ...learningMaterialMutations.removeFolderFile(),
    onSuccess: async () => {
      toast.success(t('removed', { filename }));
      await refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={remove.isPending}
      aria-label={t('removeNamed', { filename })}
      onClick={() => {
        remove.mutate({ path: { ...path, fileId } });
      }}
    >
      {remove.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {t('remove')}
    </Button>
  );
}

function AddFolderFiles({ path }: { path: FolderPath }) {
  const t = useTranslations('materials.folder');
  const inputId = useId();
  const describeUploadError = useUploadErrorMessage();
  const refresh = useRefreshFolder(path);
  const [pending, setPending] = useState(false);
  const ticket = useMutation(learningMaterialMutations.uploadTicket());
  const add = useMutation(learningMaterialMutations.addFolderFile());

  const upload = async (chosen: readonly File[]) => {
    setPending(true);
    try {
      for (const file of chosen) {
        const stored = await uploadViaTicket(
          body =>
            ticket.mutateAsync({
              path: { institutionId: path.institutionId, spaceId: path.spaceId },
              body,
            }),
          file,
        );
        await add.mutateAsync({ path, body: stored });
      }
      toast.success(t('added', { count: chosen.length }));
    } catch (error) {
      toast.error(describeUploadError(error));
    } finally {
      setPending(false);
      await refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:max-w-sm">
      <Label htmlFor={inputId}>{t('add')}</Label>
      <Input
        id={inputId}
        type="file"
        multiple
        disabled={pending}
        onChange={event => {
          const chosen = [...(event.target.files ?? [])];
          event.target.value = '';
          if (chosen.length > 0) void upload(chosen);
        }}
      />
      {pending ? (
        <p
          className="text-muted-foreground flex items-center gap-2 text-sm"
          role="status"
        >
          <LoaderCircle className="size-4 animate-spin" />
          {t('uploading')}
        </p>
      ) : null}
    </div>
  );
}
