'use client';

import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  CANONICAL_ROLES,
  ROLE_SCOPES,
  roleAssignmentMutations,
  roleAssignmentQueries,
} from '@/entities/role-assignment';
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

import { buildGrantRoleFormSchema, type GrantRoleFormValues } from '../model/schema';

export function GrantRoleForm({ institutionId }: { institutionId: string }) {
  const t = useTranslations('roleAdmin');
  const labels = useTranslations('roles');
  const queryClient = useQueryClient();

  const schema = useMemo(
    () =>
      buildGrantRoleFormSchema({
        scopeIdRequired: t('scopeIdRequired'),
        scopeIdNotAllowed: t('scopeIdNotAllowed'),
      }),
    [t],
  );

  const form = useForm<GrantRoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', role: 'student', scopeType: 'institution', scopeId: '' },
  });

  const mutation = useMutation({
    ...roleAssignmentMutations.grant(),
    onSuccess: async () => {
      toast.success(t('granted'));
      form.reset();
      await queryClient.invalidateQueries({
        queryKey: roleAssignmentQueries.listForInstitutionKey({
          path: { institutionId },
        }),
      });
    },
    onError: error => {
      const apiError = toApiError(error);

      if (apiError.status === 409) {
        form.setError('role', { message: apiError.message });
        return;
      }

      toast.error(apiError.message);
    },
  });

  const scopeType = useWatch({ control: form.control, name: 'scopeType' });
  const scoped = scopeType !== 'institution';

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({
      path: { institutionId },
      body: {
        userId: values.userId,
        role: values.role,
        scopeType: values.scopeType,
        ...(values.scopeId ? { scopeId: values.scopeId } : {}),
      },
    });
  });

  const pending = form.formState.isSubmitting || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('userId')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{t('userIdHint')}</FormDescription>
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
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CANONICAL_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {labels(`role.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scopeType')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_SCOPES.map(scope => (
                    <SelectItem key={scope} value={scope}>
                      {labels(`scope.${scope}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {scoped ? (
          <FormField
            control={form.control}
            name="scopeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('scopeId')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>{t('scopeIdHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {pending ? t('granting') : t('grant')}
        </Button>
      </form>
    </Form>
  );
}
