import { ExamRegistrationButton } from '@/features/exam-registration';
import { courseOfferingHref } from '@/entities/course-offering';
import { ExamTermCard, type ExamTerm } from '@/entities/exam-term';

export function ExamTermSection({
  heading,
  id,
  terms,
  institutionId,
}: {
  heading: string;
  id: string;
  terms: ExamTerm[];
  institutionId: string;
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={id}>
      <h2 id={id} className="text-lg font-semibold">
        {heading}
      </h2>

      <ul className="grid gap-3 md:grid-cols-2">
        {terms.map(term => (
          <li key={term.id}>
            <ExamTermCard
              term={term}
              href={courseOfferingHref(institutionId, term.offering.id, {
                section: 'schedule',
                item: { kind: 'exam-term', id: term.id },
              })}
              action={
                <ExamRegistrationButton institutionId={institutionId} term={term} />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
