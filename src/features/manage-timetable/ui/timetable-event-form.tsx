'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  offeringTimetableMutations,
  offeringTimetableQueries,
} from '@/entities/offering-timetable';
import { roomQueries } from '@/entities/room';
import { studyGroupQueries } from '@/entities/study-group';
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
  Switch,
} from '@/shared/ui';

import {
  TIMETABLE_EVENT_TYPES,
  timetableFormSchema,
  toCreatePayload,
  type TimetableFormValues,
} from '../model/schema';

const EMPTY: TimetableFormValues = {
  type: 'lecture',
  title: '',
  date: '',
  from: '09:00',
  to: '11:00',
  roomId: '',
  studyGroupId: '',
  repeatWeekly: true,
};

export function TimetableEventForm({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('timetableAdmin');
  const queryClient = useQueryClient();

  const rooms = useQuery(roomQueries.list({ path: { institutionId } }));
  const groups = useQuery(
    studyGroupQueries.list({ path: { institutionId, offeringId } }),
  );

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...offeringTimetableMutations.create(),
    onSuccess: async result => {
      toast.success(t('scheduled', { count: result.created }));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: offeringTimetableQueries.listKey({
          path: { institutionId, offeringId },
        }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('from', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { institutionId, offeringId },
      body: toCreatePayload(values),
    });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-3">
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.type')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {TIMETABLE_EVENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {t(`type.${type}`)}
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
          name="studyGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.group')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.wholeCourse')}</SelectItem>
                  {(groups.data ?? []).map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name ?? group.code}
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
            <FormItem className="sm:col-span-2">
              <FormLabel>{t('field.title')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repeatWeekly"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4">
              <div>
                <FormLabel>{t('field.repeatWeekly')}</FormLabel>
                <FormDescription>{t('field.repeatWeeklyDescription')}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="sm:col-span-3">
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('schedule')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
