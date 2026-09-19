'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { PersonPicker, personQueries } from '@/entities/person';
import {
  teachingAssignmentMutations,
  teachingAssignmentQueries,
} from '@/entities/teaching-assignment';
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
  Select,
  SelectItem,
  Switch,
} from '@/shared/ui';

import {
  assignTeacherFormSchema,
  TEACHING_ROLES,
  type AssignTeacherFormValues,
} from '../model/schema';

const EMPTY: AssignTeacherFormValues = { userId: '', role: 'lecturer', isPrimary: false };

export function AssignTeacherForm({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('teaching');
  const queryClient = useQueryClient();

  const people = useQuery(personQueries.listForInstitution({ path: { institutionId } }));

  const form = useForm<AssignTeacherFormValues>({
    resolver: zodResolver(assignTeacherFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...teachingAssignmentMutations.assign(),
    onSuccess: async () => {
      toast.success(t('assigned'));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: teachingAssignmentQueries.listKey({
          path: { institutionId, offeringId },
        }),
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
    mutation.mutate({ path: { institutionId, offeringId }, body: values });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.person')}</FormLabel>
              <FormControl>
                <PersonPicker
                  people={people.data ?? []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('field.searchPerson')}
                  emptyLabel={t('field.noPersonMatches')}
                />
              </FormControl>
              <FormDescription>{t('field.personDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.role')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {TEACHING_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {t(`role.${role}`)}
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
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>{t('field.isPrimary')}</FormLabel>
                <FormDescription>{t('field.isPrimaryDescription')}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('assign')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
