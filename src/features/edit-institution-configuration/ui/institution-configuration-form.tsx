'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  featureFlags,
  institutionConfigurationMutations,
  institutionConfigurationQueries,
  terminologyKeys,
  type InstitutionConfiguration,
} from '@/entities/institution-configuration';
import { toApiError } from '@/shared/api';
import { Button, Form, Separator } from '@/shared/ui';

import {
  institutionConfigurationFormSchema,
  type InstitutionConfigurationFormValues,
} from '../model/schema';
import { toFormValues, toUpdatePayload } from '../model/to-update-payload';
import { ConnectorFields } from './connector-fields';
import { FeatureFields } from './feature-fields';
import { RegionalFields } from './regional-fields';
import { TerminologyFields } from './terminology-fields';

interface InstitutionConfigurationFormProps {
  institutionId: string;
  configuration: InstitutionConfiguration;
}

export function InstitutionConfigurationForm({
  institutionId,
  configuration,
}: InstitutionConfigurationFormProps) {
  const t = useTranslations('institutionSettings');
  const queryClient = useQueryClient();

  const { data: connectorStatuses = [] } = useQuery(
    institutionConfigurationQueries.connectors({ path: { institutionId } }),
  );

  const form = useForm<InstitutionConfigurationFormValues>({
    resolver: zodResolver(institutionConfigurationFormSchema),
    defaultValues: toFormValues(configuration),
  });

  const mutation = useMutation({
    ...institutionConfigurationMutations.update(),
    onSuccess: async saved => {
      toast.success(t('saved'));
      form.reset(toFormValues(saved));
      await queryClient.invalidateQueries({
        queryKey: institutionConfigurationQueries.detailKey({ path: { institutionId } }),
      });
      await queryClient.invalidateQueries({
        queryKey: institutionConfigurationQueries.connectorsKey({
          path: { institutionId },
        }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 400) {
        form.setError('timezone', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { institutionId }, body: toUpdatePayload(values) });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">{t('regionalTitle')}</h3>
          <RegionalFields />
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">{t('terminologyTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('terminologyDescription')}</p>
          <TerminologyFields keys={terminologyKeys(configuration)} />
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">{t('featuresTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('featuresDescription')}</p>
          <FeatureFields flags={featureFlags(configuration)} />
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">{t('connectorsTitle')}</h3>
          <p className="text-muted-foreground text-sm">{t('connectorsDescription')}</p>
          <ConnectorFields statuses={connectorStatuses} />
        </section>

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {pending ? t('saving') : t('save')}
        </Button>
      </form>
    </Form>
  );
}
