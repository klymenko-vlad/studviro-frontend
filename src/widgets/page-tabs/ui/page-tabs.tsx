'use client';

import { useState, type ReactNode } from 'react';

import { usePathname, useRouter, useSearchParams } from '@/shared/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

export interface PageTab<Key extends string> {
  key: Key;
  label: string;
  content: ReactNode;
}

/**
 * The tabs of a page that holds several related screens. The open tab lives in
 * `?tab=`, so Back returns to it and a link can open a page on the right one;
 * an unknown or missing value opens the first. A click paints from local
 * state at once and the address trails it; a link that changes `?tab=` moves
 * the tab.
 */
export function PageTabs<Key extends string>({
  tabs,
  label,
}: {
  tabs: PageTab<Key>[];
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const requested = params.get('tab');
  const active = tabs.find(tab => tab.key === requested)?.key ?? tabs[0]?.key;
  const [open, setOpen] = useState(active);
  const [followed, setFollowed] = useState(active);
  if (followed !== active) {
    setFollowed(active);
    setOpen(active);
  }

  if (active === undefined || open === undefined) return null;
  if (tabs.length === 1) return <>{tabs[0]?.content}</>;

  return (
    <Tabs
      value={open}
      onValueChange={value => {
        setOpen(value as Key);
        const next = new URLSearchParams(params.toString());
        next.set('tab', value);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      <TabsList aria-label={label} scrollable>
        {tabs.map(tab => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(tab => (
        <TabsContent key={tab.key} value={tab.key} className="flex flex-col gap-6 pt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
