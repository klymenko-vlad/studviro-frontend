'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  learningMaterialMutations,
  learningMaterialQueries,
  MATERIAL_KINDS,
} from '@/entities/learning-material';
import { toApiError, uploadViaTicket } from '@/shared/api';
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
  Textarea,
} from '@/shared/ui';

import {
  EMPTY_MATERIAL,
  materialFormSchema,
  toMaterialPayload,
  type MaterialFormValues,
} from '../model/schema';

export function MaterialForm({
  institutionId,
  spaceId,
}: {
  institutionId: string;
  spaceId: string;
}) {
  const t = useTranslations('materials');
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState<number | null>(null);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: EMPTY_MATERIAL,
  });

  const ticket = useMutation(learningMaterialMutations.uploadTicket());
  const create = useMutation(learningMaterialMutations.create());

  const kind = useWatch({ control: form.control, name: 'kind' });

  const reset = () => {
    form.reset(EMPTY_MATERIAL);
    setFile(null);
    setPercent(null);
  };

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
        uploaded = await uploadViaTicket(
          body => ticket.mutateAsync({ path: { institutionId, spaceId }, body }),
          file,
          setPercent,
        );
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

    try {
      await create.mutateAsync({
        path: { institutionId, spaceId },
        body: toMaterialPayload(values, uploaded),
      });
    } catch (error) {
      setPercent(null);
      toast.error(toApiError(error).message);
      return;
    }

    toast.success(t('added'));
    reset();
    await queryClient.invalidateQueries({
      queryKey: learningMaterialQueries.listKey({ path: { institutionId, spaceId } }),
    });
  });

  const pending = form.formState.isSubmitting || ticket.isPending || create.isPending;

  return (
    <Form {...form}>
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

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.title')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder={t('placeholder.title')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {kind === 'link' ? (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.url')}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    inputMode="url"
                    placeholder={t('placeholder.url')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {kind === 'text' ? (
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.body')}</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder={t('placeholder.body')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

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

        {percent === null ? null : (
          <Progress value={percent} aria-label={t('upload.progressLabel')} />
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
