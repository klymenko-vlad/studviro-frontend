import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { courseResultQueries } from '@/entities/course-result';
import { deadlineQueries } from '@/entities/deadline';
import { enrolledCourseQueries } from '@/entities/enrolled-course';
import { examTermQueries } from '@/entities/exam-term';

import { deadlineHorizon } from './deadline-horizon';

export function useGlanceQueries({
  institutionId,
  canReadCourses,
  canReadGrades,
  canReadSchedule,
  canReadExams,
  now,
}: {
  institutionId: string;
  canReadCourses: boolean;
  canReadGrades: boolean;
  canReadSchedule: boolean;
  canReadExams: boolean;
  now: Date;
}) {
  const path = { institutionId };
  const [deadlineRange] = useState(() => deadlineHorizon(now));
  const [examRange] = useState(() => ({ from: now.toISOString() }));

  const courses = useQuery({
    ...enrolledCourseQueries.list({ path }),
    enabled: canReadCourses,
  });
  const progress = useQuery({
    ...courseResultQueries.summary({ path }),
    enabled: canReadGrades,
  });
  const deadlines = useQuery({
    ...deadlineQueries.list({ path, query: deadlineRange }),
    enabled: canReadSchedule,
  });
  const exams = useQuery({
    ...examTermQueries.list({ path, query: examRange }),
    enabled: canReadExams,
  });

  const isPending =
    (canReadCourses && courses.isPending) ||
    (canReadGrades && progress.isPending) ||
    (canReadSchedule && deadlines.isPending) ||
    (canReadExams && exams.isPending);

  return { courses, progress, deadlines, exams, isPending };
}
