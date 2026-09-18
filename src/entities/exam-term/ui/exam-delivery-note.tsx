import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui';

import { isRegistered, type ExamTerm } from '../model/exam-term';

/**
 * Where the student's registration stands with the university's own system.
 * Silence would let the platform imply it had told the registrar when it had
 * not, which is the disagreement write-back exists to stop.
 */
export function ExamDeliveryNote({ term }: { term: ExamTerm }) {
  const t = useTranslations('exams.delivery');
  const delivery = term.myRegistration?.delivery;

  if (delivery === undefined || !isRegistered(term)) return null;

  return (
    <div className="flex flex-col gap-1" data-testid="exam-delivery-note">
      <Badge
        variant={
          delivery === 'refused' || delivery === 'stuck' ? 'destructive' : 'outline'
        }
      >
        {t(`${delivery}.label`)}
      </Badge>
      <p className="text-muted-foreground text-xs">{t(`${delivery}.description`)}</p>
    </div>
  );
}
