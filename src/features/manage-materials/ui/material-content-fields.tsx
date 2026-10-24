'use client';

import { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';

import type { MaterialKind } from '@/entities/learning-material';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/ui';

import type { MaterialEditValues } from '../model/schema';
import { PageBodyField } from './page-body-field';

export function MaterialContentFields<T extends MaterialEditValues>({
  kind,
  control,
}: {
  kind: MaterialKind;
  control: Control<T>;
}) {
  const t = useTranslations('materials');
  const content = control as unknown as Control<MaterialEditValues>;

  return (
    <>
      {kind === 'label' ? null : (
        <FormField
          control={content}
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
      )}

      {kind === 'link' || kind === 'video' ? (
        <FormField
          control={content}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t(kind === 'video' ? 'field.video' : 'field.url')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  inputMode="url"
                  placeholder={t(
                    kind === 'video' ? 'placeholder.video' : 'placeholder.url',
                  )}
                  {...field}
                />
              </FormControl>
              {kind === 'video' ? (
                <FormDescription>{t('field.videoHint')}</FormDescription>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {kind === 'text' || kind === 'label' ? (
        <FormField
          control={content}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t(kind === 'label' ? 'field.label' : 'field.body')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={kind === 'label' ? 2 : 4}
                  placeholder={t(
                    kind === 'label' ? 'placeholder.label' : 'placeholder.body',
                  )}
                  {...field}
                />
              </FormControl>
              {kind === 'label' ? (
                <FormDescription>{t('field.labelHint')}</FormDescription>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {kind === 'page' ? <PageBodyField control={content} /> : null}
    </>
  );
}
