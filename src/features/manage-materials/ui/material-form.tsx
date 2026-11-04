'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AvailabilityFields } from '@/entities/availability';
import { MATERIAL_COMPLETION_RULES } from '@/entities/completion';
import {
  learningMaterialMutations,
  learningMaterialQueries,
  MATERIAL_KINDS,
} from '@/entities/learning-material';
import { toApiError, uploadViaTicket, useUploadErrorMessage } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Progress,
  Select,
  SelectItem,
  Switch,
} from '@/shared/ui';

import {
  EMPTY_MATERIAL,
  materialFormSchema,
  toMaterialPayload,
  type MaterialFormValues,
} from '../model/schema';
import { MaterialContentFields } from './material-content-fields';

export function MaterialForm({
  institutionId,
  spaceId,
  sectionId = null,
  onDone,
}: {
  institutionId: string;
  spaceId: string;
  sectionId?: string | null;
  onDone?: () => void;
}) {
  const t = useTranslations('materials');
  const tCompletion = useTranslations('completion');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const queryClient = useQueryClient();
  const describeUploadError = useUploadErrorMessage();
  const [file, setFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [percent, setPercent] = useState<number | null>(null);

  const form = useForm<MaterialFormValues>({
    resolver: useZodResolver(materialFormSchema),
    defaultValues: EMPTY_MATERIAL,
  });

  const ticket = useMutation(learningMaterialMutations.uploadTicket());
  const create = useMutation(learningMaterialMutations.create());
  const addFolderFile = useMutation(learningMaterialMutations.addFolderFile());

  const kind = useWatch({ control: form.control, name: 'kind' });

  const reset = () => {
    form.reset(EMPTY_MATERIAL);
    setFile(null);
    setFolderFiles([]);
    setPercent(null);
  };

  const upload = (chosen: File) =>
    uploadViaTicket(
      body => ticket.mutateAsync({ path: { institutionId, spaceId }, body }),
      chosen,
      setPercent,
    );

  /**
   * Three steps, in this order and no other: ticket, `PUT` straight to the
   * store, then tell the API. Each failure stops before the next step, so a
   * material row never exists without the bytes it points at.
   */
  const onSubmit = form.handleSubmit(async values => {
    let uploaded: { storageKey: string; filename: string } | null = null;

    if (values.kind === 'file') {
      if (file === null) {
        form.setError('root', { message: t('upload.pickFirst') });
        return;
      }

      setPercent(0);

      try {
        uploaded = await upload(file);
      } catch (error) {
        const apiError = toApiError(error);

        setPercent(null);
        toast.error(
          apiError.code === 'UPLOAD_TOO_LARGE'
            ? t('upload.tooLarge')
            : t('upload.failed'),
        );
        return;
      }
    }

    let materialId: string;
    try {
      ({ id: materialId } = await create.mutateAsync({
        path: { institutionId, spaceId },
        body: toMaterialPayload(values, uploaded, timeZone, sectionId),
      }));
    } catch (error) {
      setPercent(null);
      toast.error(describeUploadError(error));
      return;
    }

    if (values.kind === 'folder') {
      try {
        for (const chosen of folderFiles) {
          const stored = await upload(chosen);
          await addFolderFile.mutateAsync({
            path: { institutionId, spaceId, materialId },
            body: stored,
          });
        }
      } catch (error) {
        toast.error(describeUploadError(error));
      }
    }

    toast.success(t('added'));
    reset();
    await queryClient.invalidateQueries({
      queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
    });
    onDone?.();
  });

  const pending =
    form.formState.isSubmitting ||
    ticket.isPending ||
    create.isPending ||
    addFolderFile.isPending;

  return (
    <Form {...form} schema={materialFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={t('formLabel')}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.kind')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {MATERIAL_KINDS.map(option => (
                    <SelectItem key={option} value={option}>
                      {t(`kind.${option}`)}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <MaterialContentFields kind={kind} control={form.control} />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.description')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.description')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {kind === 'file' ? (
          <FormItem>
            <FormLabel htmlFor="material-file">{t('field.file')}</FormLabel>
            <FormControl>
              <Input
                id="material-file"
                type="file"
                onChange={event => {
                  setFile(event.target.files?.[0] ?? null);
                  form.clearErrors('root');
                }}
              />
            </FormControl>
            <FormDescription>{t('field.fileHint')}</FormDescription>
          </FormItem>
        ) : null}

        {kind === 'folder' ? (
          <FormItem>
            <FormLabel htmlFor="material-folder-files">
              {t('field.folderFiles')}
            </FormLabel>
            <FormControl>
              <Input
                id="material-folder-files"
                type="file"
                multiple
                onChange={event => {
                  setFolderFiles([...(event.target.files ?? [])]);
                }}
              />
            </FormControl>
            <FormDescription>{t('field.folderFilesHint')}</FormDescription>
          </FormItem>
        ) : null}

        {percent === null ? null : (
          <Progress value={percent} aria-label={t('upload.progressLabel')} />
        )}

        <AvailabilityFields />

        {kind === 'label' ? null : (
          <FormField
            control={form.control}
            name="completionRule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCompletion('field.rule')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    {MATERIAL_COMPLETION_RULES.map(rule => (
                      <SelectItem key={rule} value={rule}>
                        {tCompletion(`rule.${rule}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
                <FormDescription>{tCompletion('field.ruleHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="visible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>{t('field.visible')}</FormLabel>
            </FormItem>
          )}
        />

        {form.formState.errors.root ? (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button type="submit" size="sm" className="self-start" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('add')}
        </Button>
      </form>
    </Form>
  );
}
