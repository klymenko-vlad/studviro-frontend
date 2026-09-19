import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config';
import { Button } from '@/shared/ui';

export default function NotFound() {
  const t = useTranslations('error');

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="text-muted-foreground max-w-prose">{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </main>
  );
}
