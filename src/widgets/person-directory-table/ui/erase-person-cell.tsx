'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { ErasePerson } from '@/features/personal-data';
import type { Person } from '@/entities/person';
import { Button } from '@/shared/ui';

/**
 * The confirmation is kept behind a disclosure rather than shown on every
 * row: a destructive form repeated down a directory of 170 people invites
 * exactly the mistake it is meant to prevent.
 */
export function ErasePersonCell({
  institutionId,
  person,
}: {
  institutionId: string;
  person: Person;
}) {
  const t = useTranslations('personalData');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('eraseTitle', { name: person.displayName })}
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('erase')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <ErasePerson
        institutionId={institutionId}
        userId={person.userId}
        email={person.email}
        displayName={person.displayName}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(false);
        }}
      >
        {t('cancel')}
      </Button>
    </div>
  );
}
