'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { GRANTABLE_ROLES } from '@/entities/role-assignment';
import {
  apiQueries,
  apiSchemas,
  toApiError,
  type CreateInvitationDto,
} from '@/shared/api';
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

/**
 * Institution-wide only: a narrower grant is still reachable afterwards
 * through the grant form once the person has claimed their account. Keeping
 * this screen to the one field the invite itself needs — who, and what role —
 * is what fits it in the client bundle budget.
 */
export function InvitePersonForm({ institutionId }: { institutionId: string }) {
  const t = useTranslations('roleAdmin');
  const labels = useTranslations('roles');
  const [devToken, setDevToken] = useState<string | undefined>(undefined);

  const form = useForm<CreateInvitationDto>({
    resolver: zodResolver(apiSchemas.zCreateInvitationDto),
    defaultValues: {
      address: '',
      role: GRANTABLE_ROLES[0] ?? 'institution_admin',
      scopeType: 'institution',
    },
  });

  const mutation = useMutation({
    ...apiQueries.createInvitationMutation(),
    onSuccess: response => {
      toast.success(t('invited'));
      setDevToken(response.devToken);
      form.reset();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ path: { institutionId }, body: values });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('inviteAddress')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('role')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  {GRANTABLE_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {labels(`role.${role}`)}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {pending ? t('inviting') : t('invite')}
        </Button>

        {devToken ? (
          <p className="text-muted-foreground text-sm" data-testid="invite-dev-token">
            {t('devTokenNotice', { token: devToken })}
          </p>
        ) : null}
      </form>
    </Form>
  );
}
