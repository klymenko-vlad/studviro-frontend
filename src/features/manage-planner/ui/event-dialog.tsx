'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { plannerMutations, type PersonalEvent } from '@/entities/planner';
import { toApiError } from '@/shared/api';
import { DEFAULT_TIME_ZONE } from '@/shared/config';
import { toLocalInput, useZodResolver } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/ui';

import {
  emptyEvent,
  eventFormSchema,
  toEventPayload,
  toEventValues,
  type EventFormValues,
} from '../model/schema';
import { useRefreshPlanner } from '../model/use-refresh-planner';
import { DeleteConfirmation } from './delete-confirmation';

const HOUR_MS = 60 * 60 * 1000;

export function EventDialog({
  institutionId,
  event,
  open,
  onOpenChange,
}: {
  institutionId: string;
  event?: PersonalEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('planner');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event === undefined ? t('newEvent') : t('editEvent')}
          </DialogTitle>
          <DialogDescription>{t('privateHint')}</DialogDescription>
        </DialogHeader>
        <EventForm
          institutionId={institutionId}
          event={event}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function nextHour(timeZone: string): EventFormValues {
  const start = new Date(Math.ceil(Date.now() / HOUR_MS) * HOUR_MS);
  const end = new Date(start.getTime() + HOUR_MS);

  return emptyEvent(
    toLocalInput(start.toISOString(), timeZone),
    toLocalInput(end.toISOString(), timeZone),
  );
}

function EventForm({
  institutionId,
  event,
  onDone,
}: {
  institutionId: string;
  event?: PersonalEvent;
  onDone: () => void;
}) {
  const t = useTranslations('planner');
  const timeZone = useTimeZone() ?? DEFAULT_TIME_ZONE;
  const refresh = useRefreshPlanner();
  const form = useForm<EventFormValues>({
    resolver: useZodResolver(eventFormSchema),
    defaultValues:
      event === undefined ? nextHour(timeZone) : toEventValues(event, timeZone),
  });

  const settle = (message: string) => async () => {
    toast.success(message);
    await refresh();
    onDone();
  };
  const onError = (error: unknown) => {
    toast.error(toApiError(error).message);
  };

  const create = useMutation({
    ...plannerMutations.createEvent(),
    onSuccess: settle(t('eventCreated')),
    onError,
  });
  const update = useMutation({
    ...plannerMutations.updateEvent(),
    onSuccess: settle(t('eventSaved')),
    onError,
  });
  const remove = useMutation({
    ...plannerMutations.removeEvent(),
    onSuccess: settle(t('eventDeleted')),
    onError,
  });
  const busy = create.isPending || update.isPending;

  const onSubmit = form.handleSubmit(values => {
    const body = toEventPayload(values, timeZone);
    if (event === undefined) create.mutate({ path: { institutionId }, body });
    else update.mutate({ path: { institutionId, eventId: event.id }, body });
  });

  return (
    <Form {...form} schema={eventFormSchema}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('titleLabel')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('startsAtLabel')}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('endsAtLabel')}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('locationLabel')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('noteLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="flex-wrap gap-2">
          {event === undefined ? null : (
            <DeleteConfirmation
              question={t('confirmDeleteEvent')}
              pending={remove.isPending}
              onConfirm={() => {
                remove.mutate({ path: { institutionId, eventId: event.id } });
              }}
            />
          )}
          <Button type="button" variant="ghost" onClick={onDone}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {event === undefined ? t('create') : t('save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
