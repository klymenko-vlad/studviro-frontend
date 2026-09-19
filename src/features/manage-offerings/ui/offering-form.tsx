'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { academicTermQueries } from '@/entities/academic-term';
import { catalogueQueries } from '@/entities/catalogue';
import {
  offeringAdminMutations,
  offeringAdminQueries,
} from '@/entities/course-offering-admin';
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

import {
  OFFERING_STATUSES,
  offeringFormSchema,
  toCreatePayload,
  type OfferingFormValues,
} from '../model/schema';

const EMPTY: OfferingFormValues = {
  courseId: '',
  academicTermId: '',
  status: 'planned',
  capacity: '',
  language: '',
};

export function OfferingForm({ institutionId }: { institutionId: string }) {
  const t = useTranslations('offerings');
  const queryClient = useQueryClient();

  const courses = useQuery(catalogueQueries.courses({ path: { institutionId } }));
  const terms = useQuery(academicTermQueries.list({ path: { institutionId } }));

  const form = useForm<OfferingFormValues>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...offeringAdminMutations.create(),
    onSuccess: async () => {
      toast.success(t('created'));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: offeringAdminQueries.listKey({ path: { institutionId } }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('courseId', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { institutionId }, body: toCreatePayload(values) });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;
  const nothingToOffer =
    (courses.data ?? []).length === 0 || (terms.data ?? []).length === 0;

  if (nothingToOffer && !courses.isPending && !terms.isPending) {
    return <p className="text-muted-foreground text-sm">{t('nothingToOffer')}</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.course')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.chooseCourse')}</SelectItem>
                  {(courses.data ?? []).map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} — {course.title}
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
          name="academicTermId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.term')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.chooseTerm')}</SelectItem>
                  {(terms.data ?? []).map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
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
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.capacity')}</FormLabel>
              <FormControl>
                <Input type="number" min={0} inputMode="numeric" {...field} />
              </FormControl>
              <FormDescription>{t('field.capacityDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.status')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? 'planned'} onValueChange={field.onChange}>
                  {OFFERING_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
