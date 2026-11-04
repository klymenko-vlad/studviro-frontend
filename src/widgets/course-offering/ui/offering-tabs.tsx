'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import type { OfferingSection } from '@/entities/course-offering';
import { usePathname, useRouter, useSearchParams } from '@/shared/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

/**
 * The open section is deep-linkable: `?section=` decides which tab is open, and
 * every change writes it back, so a colleague can be sent the roster rather
 * than the top of the page. A click paints from local state at once and the
 * address trails it; a link to another section of the same page (the
 * overview's _Up next_) moves the tab by changing the address.
 */
export function OfferingTabs({
  sections,
}: {
  sections: { key: OfferingSection; content: ReactNode }[];
}) {
  const t = useTranslations('courseOffering.section');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // `work` was the grades tab's name until 2026-10-22; old links still open it.
  const raw = params.get('section');
  const requested = raw === 'work' ? 'grades' : raw;
  const known = sections.find(section => section.key === requested);
  const active = known?.key ?? sections[0]?.key;

  const [open, setOpen] = useState(active);
  const [followed, setFollowed] = useState(active);
  if (followed !== active) {
    setFollowed(active);
    setOpen(active);
  }

  if (active === undefined || open === undefined) return null;

  return (
    <Tabs
      value={open}
      onValueChange={value => {
        setOpen(value as OfferingSection);
        const next = new URLSearchParams(params.toString());
        next.set('section', value);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      <TabsList scrollable>
        {sections.map(section => (
          <TabsTrigger key={section.key} value={section.key}>
            {t(section.key)}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map(section => (
        <TabsContent
          key={section.key}
          value={section.key}
          className="flex flex-col gap-6 pt-2"
        >
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
