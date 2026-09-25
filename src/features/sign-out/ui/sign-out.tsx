'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { sessionApi } from '@/entities/session';
import { ROUTES, useRouter } from '@/shared/config';
import { DropdownMenuItem } from '@/shared/ui';

export function SignOutMenuItem() {
  const t = useTranslations('auth');
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: sessionApi.signOut,
    /**
     * `onSettled`, not `onSuccess`: the Route Handler clears the cookies even
     * when the API call behind it fails, so the browser is signed out either
     * way and staying on an authenticated-looking page would be a lie.
     */
    onSettled: () => {
      // Every cached answer was fetched as the person leaving — their courses,
      // their grades, their permissions. Left in memory, the next person to sign
      // in on this tab is shown the previous one's navigation until a reload.
      queryClient.removeQueries();
      // `push` before `refresh`, for the same reason as signing in: the cached
      // tree still holds the signed-in header until the destination itself is
      // invalidated.
      router.push(ROUTES.home);
      router.refresh();
    },
  });

  return (
    <DropdownMenuItem
      disabled={mutation.isPending}
      onSelect={() => {
        mutation.mutate();
      }}
    >
      <LogOut aria-hidden className="text-muted-foreground" />
      {t('signOut')}
    </DropdownMenuItem>
  );
}
