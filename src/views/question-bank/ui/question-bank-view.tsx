'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PageTrail } from '@/widgets/page-trail';
import { CategoryManager, QuestionList } from '@/features/manage-question-bank';
import {
  authorsOffering,
  courseOfferingHref,
  courseOfferingQueries,
} from '@/entities/course-offering';
import type { QuestionCategory } from '@/entities/question-bank';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ListSkeleton,
  PageHeader,
  PageShell,
} from '@/shared/ui';

export function QuestionBankView({
  institutionId,
  offeringId,
  spaceId,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
}) {
  const t = useTranslations('questionBank');
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const offering = useQuery(
    courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
  );
  const course = courseOfferingHref(institutionId, offeringId, { section: 'materials' });

  return (
    <PageShell>
      <PageTrail
        crumbs={
          offering.data === undefined
            ? []
            : [{ label: offering.data.course.title, href: course }]
        }
        current={t('title')}
      />
      <PageHeader title={t('title')} description={t('description')} />

      {offering.isPending ? (
        <ListSkeleton items={3} />
      ) : offering.isError || !authorsOffering(offering.data.viewerRole) ? (
        <Alert>
          <AlertDescription>{t('denied')}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('categories.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager
                institutionId={institutionId}
                spaceId={spaceId}
                selected={category}
                onSelect={setCategory}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('questions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionList
                institutionId={institutionId}
                spaceId={spaceId}
                category={category}
                onClearCategory={() => {
                  setCategory(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
