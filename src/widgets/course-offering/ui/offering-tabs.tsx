'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import type { OfferingSection } from '@/entities/course-offering';
import { usePathname, useRouter, useSearchParams } from '@/shared/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

/**
 * The open section is deep-linkable: `?section=` seeds which tab opens, and
 * every change writes it back, so a colleague can be sent the roster rather
 * than the top of the page. `defaultValue` rather than `value` on purpose —
 * the tab is owned by the tab group and the URL trails it, so a click does not
 * wait on a router round trip to paint.
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

  const requested = params.get('section');
  const known = sections.find(section => section.key === requested);
  const active = known?.key ?? sections[0]?.key;

  if (active === undefined) return null;

  return (
    <Tabs
      defaultValue={active}
      onValueChange={value => {
        const next = new URLSearchParams(params.toString());
        next.set('section', value);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      <TabsList className="max-w-full overflow-x-auto">
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
