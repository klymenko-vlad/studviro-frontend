'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Control, ControllerRenderProps } from 'react-hook-form';

import {
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from '@/shared/ui';

import { previewPage } from '../api/preview-page';

interface WithBody {
  body: string;
}

export function PageBodyField<T extends WithBody>({ control }: { control: Control<T> }) {
  const bodyControl = control as unknown as Control<WithBody>;

  return (
    <FormField
      control={bodyControl}
      name="body"
      render={({ field }) => <PageBody field={field} />}
    />
  );
}

/**
 * The preview is rendered by a Server Action, so the Markdown renderer never
 * ships to the browser; the page itself is rendered the same way, on the server.
 */
function PageBody({ field }: { field: ControllerRenderProps<WithBody, 'body'> }) {
  const t = useTranslations('materials');
  const [preview, setPreview] = useState<ReactNode>(null);
  const [previewing, setPreviewing] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    if (previewing) {
      setPreviewing(false);
      return;
    }
    startTransition(async () => {
      const rendered = await previewPage(field.value);
      setPreview(rendered);
      setPreviewing(true);
    });
  };

  return (
    <FormItem>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FormLabel>{t('field.page')}</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={previewing}
          disabled={pending}
          onClick={toggle}
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('page.preview')}
        </Button>
      </div>
      {previewing ? (
        <section
          aria-label={t('page.previewLabel')}
          className="border-border min-h-24 rounded-md border p-3 text-sm"
        >
          {preview}
        </section>
      ) : (
        <FormControl>
          <Textarea rows={12} placeholder={t('placeholder.page')} {...field} />
        </FormControl>
      )}
      <FormDescription>{t('field.pageHint')}</FormDescription>
      <FormMessage />
    </FormItem>
  );
}
