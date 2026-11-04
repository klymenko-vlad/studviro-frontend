'use client';

import { useEffect, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Card, CardContent } from '@/shared/ui';

export function SubmitConfirmation({
  unanswered,
  pending,
  onGoTo,
  onSubmit,
  onBack,
}: {
  unanswered: readonly number[];
  pending: boolean;
  onGoTo: (number: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('quiz.take.confirm');
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Card>
      <CardContent>
        <section aria-labelledby="submit-confirmation" className="flex flex-col gap-4">
          <h2
            id="submit-confirmation"
            ref={heading}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            {t('title')}
          </h2>
          {unanswered.length === 0 ? (
            <p>{t('allAnswered')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p>{t('unanswered', { count: unanswered.length })}</p>
              <ul className="flex flex-wrap gap-2">
                {unanswered.map(number => (
                  <li key={number}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onGoTo(number);
                      }}
                    >
                      {t('goTo', { number })}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-muted-foreground text-sm">{t('note')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={pending} onClick={onSubmit}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {t('submit')}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
              {t('back')}
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
