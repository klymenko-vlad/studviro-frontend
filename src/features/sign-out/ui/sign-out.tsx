'use client';

import { useMutation } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { sessionApi } from '@/entities/session';
import { ROUTES, useRouter } from '@/shared/config';
import { Button } from '@/shared/ui';

interface SignOutProps {
  className?: string;
}

export function SignOut({ className }: SignOutProps) {
  const t = useTranslations('auth');
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: sessionApi.signOut,
    /**
     * `onSettled`, not `onSuccess`: the Route Handler clears the cookies even
     * when the API call behind it fails, so the browser is signed out either
     * way and staying on an authenticated-looking page would be a lie.
     */
    onSettled: () => {
      router.refresh();
      router.push(ROUTES.home);
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate();
      }}
    >
      <LogOut aria-hidden />
      {t('signOut')}
    </Button>
  );
}
