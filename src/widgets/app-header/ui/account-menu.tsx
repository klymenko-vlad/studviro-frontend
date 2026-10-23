'use client';

import { CirclePlus, Settings, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SignOutMenuItem } from '@/features/sign-out';
import { LocaleMenuItems } from '@/features/switch-locale';
import { ThemeMenuItems } from '@/features/theme-toggle';
import { Link, ROUTES } from '@/shared/config';
import { initials } from '@/shared/lib';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

/**
 * One trigger for everything about the person rather than the place: their
 * account, the two settings they change once, and the way out. The header used
 * to spend five always-visible buttons on the language and the theme alone.
 */
export function AccountMenu({
  displayName,
  email,
  isPlatformOperator,
}: {
  displayName: string;
  email: string;
  isPlatformOperator: boolean;
}) {
  const t = useTranslations('nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('accountMenu')}
          className="rounded-full"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="flex flex-col px-2 py-1.5">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="text-muted-foreground truncate text-xs">{email}</span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.account}>
              <UserRound aria-hidden className="text-muted-foreground" />
              {t('account')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={ROUTES.accountSettings}>
              <Settings aria-hidden className="text-muted-foreground" />
              {t('accountSettings')}
            </Link>
          </DropdownMenuItem>

          {isPlatformOperator ? (
            <DropdownMenuItem asChild>
              <Link href={ROUTES.createInstitution}>
                <CirclePlus aria-hidden className="text-muted-foreground" />
                {t('createInstitution')}
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <ThemeMenuItems />
        <DropdownMenuSeparator />
        <LocaleMenuItems />
        <DropdownMenuSeparator />

        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
