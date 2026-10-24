'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PageTrail } from '@/widgets/page-trail';
import { QuizActions, QuizForm, QuizQuestions } from '@/features/manage-quizzes';
import { QuizAttempts, QuizRegrade, QuizResults } from '@/features/review-quiz-attempts';
import {
  authorsOffering,
  courseOfferingHref,
  courseOfferingQueries,
} from '@/entities/course-offering';
import { outlineAnchor } from '@/entities/learning-section';
import { questionBankHref, quizQueries } from '@/entities/quiz';
import { Link, useRouter } from '@/shared/config';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListSkeleton,
  PageHeader,
  PageShell,
} from '@/shared/ui';

export function QuizEditorView({
  institutionId,
  offeringId,
  spaceId,
  quizId,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  quizId: string;
}) {
  const t = useTranslations('quiz.editor');
  const tQuestions = useTranslations('quiz.questions');
  const tAttempts = useTranslations('quiz.attemptList');
  const tResults = useTranslations('quiz.results');
  const router = useRouter();
  const offering = useQuery(
    courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
  );
  const authors =
    offering.data !== undefined && authorsOffering(offering.data.viewerRole);
  const quiz = useQuery({
    ...quizQueries.detail({ path: { institutionId, spaceId, quizId } }),
    enabled: authors,
  });
  const content = courseOfferingHref(institutionId, offeringId, { section: 'materials' });

  return (
    <PageShell>
      <PageTrail
        crumbs={
          offering.data === undefined
            ? []
            : [{ label: offering.data.course.title, href: content }]
        }
        current={quiz.data?.name ?? t('title')}
      />

      {offering.isPending || (authors && quiz.isPending) ? (
        <ListSkeleton items={3} />
      ) : !authors ? (
        <Alert>
          <AlertDescription>{t('denied')}</AlertDescription>
        </Alert>
      ) : quiz.data === undefined ? (
        <Alert>
          <AlertDescription>{t('error')}</AlertDescription>
        </Alert>
      ) : (
        <>
          <PageHeader title={quiz.data.name} description={t('description')} />
          <div className="flex flex-wrap items-center gap-2">
            <QuizActions
              institutionId={institutionId}
              spaceId={spaceId}
              quiz={quiz.data}
              onRemoved={() => {
                router.push(content);
              }}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={questionBankHref(institutionId, offeringId, spaceId)}>
                {t('bank')}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`${content}#${outlineAnchor('quiz', quizId)}`}>
                {t('back')}
              </Link>
            </Button>
          </div>
          <QuizRegrade institutionId={institutionId} spaceId={spaceId} quiz={quiz.data} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tQuestions('title')}</CardTitle>
              <CardDescription>{tQuestions('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizQuestions
                institutionId={institutionId}
                spaceId={spaceId}
                quiz={quiz.data}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tAttempts('title')}</CardTitle>
              <CardDescription>{tAttempts('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizAttempts
                institutionId={institutionId}
                offeringId={offeringId}
                spaceId={spaceId}
                quiz={quiz.data}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tResults('title')}</CardTitle>
              <CardDescription>{tResults('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizResults
                institutionId={institutionId}
                spaceId={spaceId}
                quiz={quiz.data}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuizForm
                key={quiz.data.id}
                institutionId={institutionId}
                spaceId={spaceId}
                quiz={quiz.data}
              />
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}
