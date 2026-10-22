import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

import { OfferingGrades } from './offering-grades';

export function OfferingGradeEntry({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('gradeEntry');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('panelTitle')}</CardTitle>
        <CardDescription>{t('panelDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <OfferingGrades institutionId={institutionId} offeringId={offeringId} />
      </CardContent>
    </Card>
  );
}
