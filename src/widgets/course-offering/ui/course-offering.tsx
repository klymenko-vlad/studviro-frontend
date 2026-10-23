'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { courseOfferingQueries, takesPartInDiscussion } from '@/entities/course-offering';
import { toApiError } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, Skeleton } from '@/shared/ui';

import { OfferingAssessments } from './offering-assessments';
import { OfferingDiscussion } from './offering-discussion';
import { OfferingEnrollment } from './offering-enrollment';
import { OfferingExamTerms } from './offering-exam-terms';
import { OfferingExams } from './offering-exams';
import { OfferingGradeEntry } from './offering-grade-entry';
import { OfferingHeader } from './offering-header';
import { OfferingAssignmentsSection, OfferingLearning } from './offering-learning';
import { OfferingResults } from './offering-results';
import { OfferingRoster } from './offering-roster';
import { OfferingStaff } from './offering-staff';
import { OfferingStudyGroups } from './offering-study-groups';
import { OfferingTabs } from './offering-tabs';
import { OfferingTimetable } from './offering-timetable';
import { OfferingUpNext } from './offering-up-next';
import { OfferingWaitlist } from './offering-waitlist';

export function CourseOffering({
  institutionId,
  offeringId,
}: {
  institutionId: string;
  offeringId: string;
}) {
  const t = useTranslations('courseOffering');
  const { data, isPending, error } = useQuery(
    courseOfferingQueries.detail({ path: { institutionId, offeringId } }),
  );

  if (isPending)
    return <Skeleton className="h-96 w-full" data-testid="course-offering-loading" />;

  if (error) {
    const { status } = toApiError(error);
    const reason = status === 404 ? 'notFound' : status === 403 ? 'denied' : 'error';

    return (
      <Alert variant={reason === 'error' ? 'destructive' : 'default'}>
        <AlertTitle>{t(`${reason}Title`)}</AlertTitle>
        <AlertDescription>{t(`${reason}Description`)}</AlertDescription>
      </Alert>
    );
  }

  const teaching = data.viewerRole !== 'student';

  return (
    <div className="flex flex-col gap-6">
      <OfferingHeader offering={data} />

      <OfferingTabs
        sections={[
          {
            key: 'overview',
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <OfferingUpNext
                  institutionId={institutionId}
                  offeringId={offeringId}
                  teaching={teaching}
                />
                <OfferingStaff
                  offering={data}
                  institutionId={institutionId}
                  offeringId={offeringId}
                />
                <OfferingEnrollment offering={data} />
              </div>
            ),
          },
          {
            key: 'materials',
            content: (
              <OfferingLearning
                institutionId={institutionId}
                offeringId={offeringId}
                courseTitle={data.course.title}
                viewerRole={data.viewerRole}
              />
            ),
          },
          {
            key: 'assignments',
            content: (
              <OfferingAssignmentsSection
                institutionId={institutionId}
                offeringId={offeringId}
                viewerRole={data.viewerRole}
              />
            ),
          },
          {
            key: 'schedule',
            content: teaching ? (
              <>
                <OfferingTimetable
                  institutionId={institutionId}
                  offeringId={offeringId}
                />
                <OfferingExamTerms
                  institutionId={institutionId}
                  offeringId={offeringId}
                />
              </>
            ) : (
              <OfferingExams institutionId={institutionId} offeringId={offeringId} />
            ),
          },
          {
            key: 'grades',
            content: (
              <>
                {teaching ? (
                  <OfferingGradeEntry
                    institutionId={institutionId}
                    offeringId={offeringId}
                  />
                ) : null}
                <OfferingResults institutionId={institutionId} offeringId={offeringId} />
                <OfferingAssessments
                  institutionId={institutionId}
                  offeringId={offeringId}
                />
              </>
            ),
          },
          ...(takesPartInDiscussion(data)
            ? ([
                {
                  key: 'discussion',
                  content: (
                    <OfferingDiscussion
                      institutionId={institutionId}
                      offeringId={offeringId}
                    />
                  ),
                },
              ] as const)
            : []),
          ...(teaching
            ? ([
                {
                  key: 'people',
                  content: (
                    <>
                      <OfferingRoster
                        institutionId={institutionId}
                        offeringId={offeringId}
                      />
                      <OfferingWaitlist
                        institutionId={institutionId}
                        offeringId={offeringId}
                      />
                      <OfferingStudyGroups
                        institutionId={institutionId}
                        offeringId={offeringId}
                      />
                    </>
                  ),
                },
              ] as const)
            : []),
        ]}
      />
    </div>
  );
}
