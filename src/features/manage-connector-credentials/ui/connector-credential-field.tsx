'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  connectorCredentialsMutations,
  connectorCredentialsQueries,
  type ConnectorCredentialField as ConnectorCredentialFieldModel,
  type ConnectorCredentialsKind,
} from '@/entities/connector-credential';
import { toApiError } from '@/shared/api';
import { Badge, Button, Input, Label } from '@/shared/ui';

import {
  connectorCredentialValueSchema,
  type ConnectorCredentialValueFormValues,
} from '../model/schema';

interface ConnectorCredentialFieldProps {
  institutionId: string;
  kind: ConnectorCredentialsKind;
  field: ConnectorCredentialFieldModel;
}

export function ConnectorCredentialField({
  institutionId,
  kind,
  field,
}: ConnectorCredentialFieldProps) {
  const t = useTranslations('institutionSettings');
  const queryClient = useQueryClient();

  const form = useForm<ConnectorCredentialValueFormValues>({
    resolver: zodResolver(connectorCredentialValueSchema),
    defaultValues: { value: '' },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: connectorCredentialsQueries.detailKey({ path: { institutionId, kind } }),
    });

  const setMutation = useMutation({
    ...connectorCredentialsMutations.set(),
    onSuccess: async () => {
      toast.success(t('credentialSaved'));
      form.reset({ value: '' });
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const clearMutation = useMutation({
    ...connectorCredentialsMutations.clear(),
    onSuccess: async () => {
      toast.success(t('credentialCleared'));
      form.reset({ value: '' });
      await invalidate();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    setMutation.mutate({
      path: { institutionId, kind },
      body: { values: { [field.key]: values.value } },
    });
  });

  const onClear = () => {
    clearMutation.mutate({ path: { institutionId, kind, fieldKey: field.key } });
  };

  const pending = form.formState.isSubmitting || setMutation.isPending;
  const inputId = `connector-credential-${kind}-${field.key}`;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 border-b pb-4 last:border-b-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={inputId}>{field.label}</Label>
          {field.required ? (
            <span aria-hidden className="text-destructive">
              *
            </span>
          ) : null}
        </div>
        <Badge variant={field.configured ? 'default' : 'outline'}>
          {field.configured ? t('credentialConfigured') : t('credentialNotSet')}
        </Badge>
      </div>

      {field.description ? (
        <p className="text-muted-foreground text-sm">{field.description}</p>
      ) : null}

      {field.configured && field.updatedAt ? (
        <p className="text-muted-foreground text-sm">
          {t('credentialUpdatedAt', {
            date: new Date(field.updatedAt).toLocaleString(),
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={inputId}
          type={field.secret ? 'password' : 'text'}
          key={field.updatedAt ?? 'unset'}
          autoComplete="off"
          aria-label={field.label}
          {...form.register('value')}
        />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {t('credentialSave')}
        </Button>
        {field.configured ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={clearMutation.isPending}
            onClick={onClear}
          >
            {t('credentialClear')}
          </Button>
        ) : null}
      </div>
      {form.formState.errors.value ? (
        <p role="alert" className="text-destructive text-sm">
          {t('credentialValueRequired')}
        </p>
      ) : null}
    </form>
  );
}
