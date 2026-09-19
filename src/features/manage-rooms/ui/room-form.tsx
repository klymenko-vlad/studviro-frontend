'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { orgUnitQueries } from '@/entities/org-unit';
import { roomMutations, roomQueries } from '@/entities/room';
import { toApiError } from '@/shared/api';
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

import { roomFormSchema, toCreatePayload, type RoomFormValues } from '../model/schema';

const EMPTY: RoomFormValues = {
  code: '',
  name: '',
  building: '',
  capacity: '',
  orgUnitId: '',
};

export function RoomForm({ institutionId }: { institutionId: string }) {
  const t = useTranslations('rooms');
  const queryClient = useQueryClient();

  const units = useQuery(orgUnitQueries.listForInstitution({ path: { institutionId } }));

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: EMPTY,
  });

  const mutation = useMutation({
    ...roomMutations.create(),
    onSuccess: async room => {
      toast.success(t('created', { code: room.code }));
      form.reset(EMPTY);
      await queryClient.invalidateQueries({
        queryKey: roomQueries.listKey({ path: { institutionId } }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('code', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { institutionId }, body: toCreatePayload(values) });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.code')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder="FEI-101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.name')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="building"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.building')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} />
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orgUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('field.orgUnit')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectItem value="">{t('field.noOrgUnit')}</SelectItem>
                  {(units.data ?? []).map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
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
