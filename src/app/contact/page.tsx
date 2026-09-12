import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ContactView } from '@/views/contact';
import { ROUTES } from '@/shared/config';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');

  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: ROUTES.contact },
    openGraph: { title, description, url: ROUTES.contact },
    twitter: { title, description },
  };
}

export default function ContactPage() {
  return <ContactView />;
}
