'use client';

import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { apiQueries, toApiError } from '@/shared/api';
import { useRouter } from '@/shared/config';
import { useZodResolver } from '@/shared/lib';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/shared/ui';

import { editProfileSchema, type EditProfileValues } from '../model/schema';

export function EditProfile({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const t = useTranslations('accountSettings.profile');
  const router = useRouter();

  const form = useForm<EditProfileValues>({
    resolver: useZodResolver(editProfileSchema),
    defaultValues: { displayName },
  });

  const mutation = useMutation({
    ...apiQueries.updateMeMutation(),
    onSuccess: user => {
      form.reset({ displayName: user.displayName });
      toast.success(t('saved'));
      router.refresh();
    },
    onError: error => {
      toast.error(toApiError(error).message);
    },
  });

  const onSubmit = form.handleSubmit(values => {
    mutation.mutate({ body: { displayName: values.displayName.trim() } });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form} schema={editProfileSchema}>
          <form onSubmit={onSubmit} noValidate className="flex max-w-sm flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t('email')}</span>
              <span className="text-muted-foreground text-sm">{email}</span>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('displayName')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : null}
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
