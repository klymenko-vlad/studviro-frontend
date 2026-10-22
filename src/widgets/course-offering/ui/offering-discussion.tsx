'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StartThreadForm } from '@/features/discuss-course';
import { usePathname, useRouter, useSearchParams } from '@/shared/config';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

import { DiscussionThreadView } from './offering-discussion-thread';
import { DiscussionThreadList } from './offering-discussion-threads';

/**
 * The open thread lives in `?thread=`, beside the page's `?section=`, so a
 * notification can link straight to the conversation it is about.
 */
export function OfferingDiscussion({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('discussion');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [composing, setComposing] = useState(false);
  const address = { institutionId, offeringId };
  const threadId = params.get('thread');

  const open = (next: string | null) => {
    const query = new URLSearchParams(params.toString());
    query.set('section', 'discussion');
    if (next === null) query.delete('thread');
    else query.set('thread', next);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('title')}</h2>
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {threadId === null ? (
          <>
            {composing ? (
              <StartThreadForm
                address={address}
                onStarted={id => {
                  setComposing(false);
                  open(id);
                }}
                onCancel={() => {
                  setComposing(false);
                }}
              />
            ) : (
              <div>
                <Button
                  type="button"
                  onClick={() => {
                    setComposing(true);
                  }}
                >
                  {t('newThread')}
                </Button>
              </div>
            )}
            <DiscussionThreadList address={address} onOpen={open} />
          </>
        ) : (
          <DiscussionThreadView
            address={address}
            threadId={threadId}
            onBack={() => {
              open(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
