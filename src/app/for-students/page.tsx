import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ForStudentsView } from '@/views/for-students';
import { ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forStudents');

  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: ROUTES.forStudents },
    openGraph: { title, description, url: ROUTES.forStudents },
    twitter: { title, description },
  };
}

export default function ForStudentsPage() {
  return <ForStudentsView />;
}
