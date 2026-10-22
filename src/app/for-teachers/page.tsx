import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ForTeachersView } from '@/views/for-teachers';
import { ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forTeachers');

  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: ROUTES.forTeachers },
    openGraph: { title, description, url: ROUTES.forTeachers },
    twitter: { title, description },
  };
}

export default function ForTeachersPage() {
  return <ForTeachersView />;
}
