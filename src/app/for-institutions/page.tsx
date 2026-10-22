import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ForInstitutionsView } from '@/views/for-institutions';
import { ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forInstitutions');

  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: ROUTES.forInstitutions },
    openGraph: { title, description, url: ROUTES.forInstitutions },
    twitter: { title, description },
  };
}

export default function ForInstitutionsPage() {
  return <ForInstitutionsView />;
}
