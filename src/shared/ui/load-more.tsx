'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from './button';

/**
 * The foot of a keyset-paginated list. A cursor knows whether there is another
 * page but not how many rows there are in total, so this says what has arrived
 * rather than inventing "100 of 164".
 *
 * The count stays when there is nothing more to fetch: a list that simply stops
 * reads as truncated, and the number is what says it is not.
 */
export function LoadMore({
  shown,
  hasMore,
  pending = false,
  onLoadMore,
}: {
  shown: number;
  hasMore: boolean;
  pending?: boolean;
  onLoadMore: () => void;
}) {
  const t = useTranslations('common');

  /**
   * The count is page furniture until somebody asks for more, and only then
   * the answer to what they just did. Live from the first paint, it announces
   * "50 shown" at a screen-reader user who did not ask.
   */
  const [asked, setAsked] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p
        className="text-muted-foreground text-sm tabular-nums"
        aria-live={asked ? 'polite' : 'off'}
      >
        {t('shownCount', { count: shown })}
      </p>

      {hasMore ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setAsked(true);
            onLoadMore();
          }}
        >
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {t('loadMore')}
        </Button>
      ) : null}
    </div>
  );
}
