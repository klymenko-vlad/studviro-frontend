'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { courseOfferingHref } from '@/entities/course-offering';
import type { TermCourses } from '@/entities/enrolled-course';
import { Link } from '@/shared/config';
import { cn } from '@/shared/lib';
import { LinkRow, LinkRowChevron, ToneDot } from '@/shared/ui';

/**
 * Courses from finished terms, folded into one quiet row until someone needs
 * one. Open, it is a compact list by term rather than more cards — the past is
 * for looking something up, not for browsing.
 */
export function EarlierCourses({
  groups,
  institutionId,
}: {
  groups: TermCourses[];
  institutionId: string;
}) {
  const t = useTranslations('myCourses.earlier');
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const count = groups.reduce((sum, group) => sum + group.courses.length, 0);

  return (
    <section className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(value => !value);
        }}
        className="group hover:bg-secondary/60 focus-visible:ring-ring/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-300 outline-none focus-visible:ring-[3px]"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{t('title')}</span>
          <span className="text-muted-foreground text-sm">
            {t('summary', { courses: count, terms: groups.length })}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'text-muted-foreground size-5 shrink-0 transition-transform duration-500 ease-(--ease-premium) motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id={panelId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 ease-(--ease-premium) motion-reduce:transition-none',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-6 pt-3 pb-1">
            {groups.map(group => (
              <div key={group.term.id} className="flex flex-col gap-1">
                <h3 className="text-muted-foreground type-eyebrow px-0">
                  {group.term.name}
                </h3>
                <ul className="-mx-2 flex flex-col">
                  {group.courses.map(course => (
                    <li key={course.enrollmentId}>
                      <LinkRow asChild>
                        <Link
                          href={courseOfferingHref(institutionId, course.offering.id)}
                        >
                          <ToneDot code={course.course.code} />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {course.course.title}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {course.course.code}
                          </span>
                          <LinkRowChevron />
                        </Link>
                      </LinkRow>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
