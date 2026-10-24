import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { outlineAnchor } from '@/entities/learning-section';
import { institutionRoutes, Link } from '@/shared/config';
import { Markdown } from '@/shared/markdown';
import { PageShell } from '@/shared/ui';

import { readPage, type PageAddress } from '../api/read-page';

export async function CoursePageView({
  offeringId,
  ...address
}: PageAddress & { offeringId: string }) {
  const page = await readPage(address);
  if (page === null) notFound();

  const t = await getTranslations('materials.page');
  const course = `${institutionRoutes(address.institutionId).courses}/${offeringId}?section=materials#${outlineAnchor('material', page.id)}`;

  return (
    <PageShell width="prose">
      <Link
        href={course}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>
      <article className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        {page.description === null ? null : (
          <p className="text-muted-foreground">{page.description}</p>
        )}
        <Markdown source={page.body ?? ''} />
      </article>
    </PageShell>
  );
}
