'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

export type AccessPanel = 'access' | 'groups' | 'sight' | null;

export function AccessButtons({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: AccessPanel;
  onToggle: (panel: AccessPanel) => void;
}) {
  const t = useTranslations('restriction');
  const toggle = (panel: Exclude<AccessPanel, null>) => {
    onToggle(open === panel ? null : panel);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open === 'access'}
        aria-label={t('editNamed', { title })}
        onClick={() => {
          toggle('access');
        }}
      >
        {t('edit')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open === 'groups'}
        aria-label={t('groups.named', { title })}
        onClick={() => {
          toggle('groups');
        }}
      >
        {t('groups.button')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open === 'sight'}
        aria-label={t('sight.named', { title })}
        onClick={() => {
          toggle('sight');
        }}
      >
        {t('sight.button')}
      </Button>
    </>
  );
}
