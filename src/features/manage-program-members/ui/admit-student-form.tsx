'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { personQueries } from '@/entities/person';
import { programMemberMutations, programMemberQueries } from '@/entities/program-member';
import { toApiError } from '@/shared/api';
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
  Select,
  SelectItem,
} from '@/shared/ui';

import { admitFormSchema, toAdmitPayload, type AdmitFormValues } from '../model/schema';

const EMPTY: AdmitFormValues = { userId: '', studyYear: '1' };

export function AdmitStudentForm({
  institutionId,
  programId,
}: {
  institutionId: string;
  programId: string;
}) {
  const t = useTranslations('programMembers');
  const queryClient = useQueryClient();

  const people = useQuery(personQueries.listForInstitution({ path: { institutionId } }));

  const form = useForm<AdmitFormValues>({
    resolver: zodResolver(admitFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...programMemberMutations.admit(),
    onSuccess: async () => {
      toast.success(t('admitted'));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: programMemberQueries.listKey({ path: { institutionId, programId } }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409 || apiError.status === 404) {
        form.setError('userId', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { institutionId, programId }, body: toAdmitPayload(values) });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.person')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.choosePerson')}</SelectItem>
                  {(people.data ?? []).map(person => (
                    <SelectItem key={person.userId} value={person.userId}>
                      {person.displayName}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
              <FormDescription>{t('field.personDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studyYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.studyYear')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={t('placeholder.studyYear')}
                  className="w-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" className="mt-6" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {t('admit')}
        </Button>
      </form>
    </Form>
  );
}
