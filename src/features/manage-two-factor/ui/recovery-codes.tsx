'use client';

import { Copy, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle, Button } from '@/shared/ui';

export function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const t = useTranslations('accountSettings.twoFactor.recoveryCodes');
  const text = `${codes.join('\n')}\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'studviro-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>{t('title')}</AlertTitle>
        <AlertDescription>{t('description')}</AlertDescription>
      </Alert>

      <ul
        aria-label={t('listLabel')}
        className="bg-muted grid max-w-sm grid-cols-2 gap-x-6 gap-y-1 rounded-md p-4 font-mono text-sm"
      >
        {codes.map(code => (
          <li key={code}>{code}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          <Copy aria-hidden />
          {t('copy')}
        </Button>
        <Button type="button" variant="outline" onClick={download}>
          <Download aria-hidden />
          {t('download')}
        </Button>
        <Button type="button" onClick={onDone}>
          {t('done')}
        </Button>
      </div>
    </div>
  );
}
