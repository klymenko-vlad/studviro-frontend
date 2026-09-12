'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib';

import { Input } from './input';

/**
 * A password field with a reveal toggle.
 *
 * The toggle only flips the input's `type`, so the value stays owned by the
 * caller (react-hook-form, in practice) and autofill keeps working. It is a
 * `button` with a label rather than an icon-only div so screen readers and
 * keyboards reach it like any other control.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  const t = useTranslations('common');
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative w-full min-w-0">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-9', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => {
          setVisible(shown => !shown);
        }}
        disabled={props.disabled}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export { PasswordInput };
