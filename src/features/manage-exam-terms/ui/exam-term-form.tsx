'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  offeringExamTermMutations,
  offeringExamTermQueries,
  type OfferingExamTerm,
} from '@/entities/offering-exam-term';
import { roomQueries } from '@/entities/room';
import { teachingAssignmentQueries } from '@/entities/teaching-assignment';
import { toApiError } from '@/shared/api';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectItem,
} from '@/shared/ui';

import {
  EMPTY_EXAM_TERM,
  EXAM_TERM_KINDS,
  examTermFormSchema,
  toExamTermPayload,
  toFormValues,
  type ExamTermFormValues,
} from '../model/schema';

/**
 * One form offers a term and edits one, because the two ask for the same
 * things and a second form would drift from the first.
 */
export function ExamTermForm({
  institutionId,
  offeringId,
  term,
  onDone,
}: {
  institutionId: string;
  offeringId: string;
  term?: OfferingExamTerm;
  onDone?: () => void;
}) {
  const t = useTranslations('examTermAdmin');
  const queryClient = useQueryClient();

  const rooms = useQuery(roomQueries.list({ path: { institutionId } }));
  const staff = useQuery(
    teachingAssignmentQueries.list({ path: { institutionId, offeringId } }),
  );

  const form = useForm<ExamTermFormValues>({
    resolver: useZodResolver(examTermFormSchema),
    defaultValues: term ? toFormValues(term) : EMPTY_EXAM_TERM,
  });

  const settled = {
    onSuccess: async () => {
      toast.success(term ? t('saved') : t('offered'));
      if (!term) form.reset(EMPTY_EXAM_TERM);
      await queryClient.invalidateQueries({
        queryKey: offeringExamTermQueries.listKey({
          path: { institutionId, offeringId },
        }),
      });
      onDone?.();
    },
    onError: (error: unknown) => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('date', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  };

  const create = useMutation({ ...offeringExamTermMutations.create(), ...settled });
  const update = useMutation({ ...offeringExamTermMutations.update(), ...settled });

  const onSubmit = form.handleSubmit(values => {
    const body = toExamTermPayload(values);

    if (term) {
      update.mutate({ path: { institutionId, offeringId, examTermId: term.id }, body });
      return;
    }

    create.mutate({ path: { institutionId, offeringId }, body });
  });

  const pending = form.formState.isSubmitting || create.isPending || update.isPending;

  return (
    <Form {...form} schema={examTermFormSchema}>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={term ? t('editLegend') : t('offerLegend')}
        className="grid gap-4 sm:grid-cols-3"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.date')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.from')}</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.to')}</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.kind')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {EXAM_TERM_KINDS.map(kind => (
                    <SelectItem key={kind} value={kind}>
                      {t(`kind.${kind}`)}
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
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('field.noLimit')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.room')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.noRoom')}</SelectItem>
                  {(rooms.data ?? []).map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code}
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
          name="examinerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.examiner')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.noExaminer')}</SelectItem>
                  {(staff.data ?? []).map(person => (
                    <SelectItem key={person.userId} value={person.userId}>
                      {person.displayName}
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
          name="opensOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.opensOn')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closesOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.closesOn')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 sm:col-span-3">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {term ? t('save') : t('offer')}
          </Button>
          {term && onDone ? (
            <Button type="button" variant="ghost" onClick={onDone}>
              {t('cancelEdit')}
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
