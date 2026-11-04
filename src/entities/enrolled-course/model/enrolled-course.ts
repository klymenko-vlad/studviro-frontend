import type { MyCourseResponseDto } from '@/shared/api';

export type EnrolledCourse = MyCourseResponseDto;
export type EnrolledCourseStatus = EnrolledCourse['status'];
export type EnrolledCourseTerm = EnrolledCourse['term'];
export type EnrolledCourseTeacher = EnrolledCourse['teachers'][number];

export interface TermCourses {
  term: EnrolledCourseTerm;
  courses: EnrolledCourse[];
}

/**
 * The API already orders by term start descending, then course code; grouping
 * preserves that order rather than imposing a second one.
 */
export function groupByTerm(courses: EnrolledCourse[]): TermCourses[] {
  const groups: TermCourses[] = [];

  for (const course of courses) {
    const current = groups.at(-1);

    if (current?.term.id === course.term.id) current.courses.push(course);
    else groups.push({ term: course.term, courses: [course] });
  }

  return groups;
}

export function totalCredits(courses: EnrolledCourse[]): number {
  return courses.reduce((sum, course) => sum + (course.course.credits ?? 0), 0);
}

export function primaryTeacher(
  course: EnrolledCourse,
): EnrolledCourseTeacher | undefined {
  return course.teachers.find(teacher => teacher.isPrimary) ?? course.teachers[0];
}

/** The statuses the server opens a course page for (`ENROLLMENT_RECORDED_STATUSES`). */
const OPENS_PAGE: readonly EnrolledCourseStatus[] = [
  'provisioning',
  'active',
  'completed',
];
/** Still being answered: worth seeing while the term runs, gone once it is over. */
const PENDING: readonly EnrolledCourseStatus[] = ['requested', 'waitlisted'];

export function opensCoursePage(status: EnrolledCourseStatus): boolean {
  return OPENS_PAGE.includes(status);
}

/**
 * What a student's course list leads with and what it keeps folded away.
 * `current` is every term not yet over — this one and any ahead — with the
 * courses taken and the requests still open. `earlier` is finished terms, and
 * only what still opens. A course the student left or was refused is in
 * neither: it is not theirs to return to.
 */
export function splitByTime(
  courses: EnrolledCourse[],
  now: Date,
): { current: TermCourses[]; earlier: TermCourses[] } {
  const isOver = (course: EnrolledCourse) => new Date(course.term.endsAt) < now;

  return {
    current: groupByTerm(
      courses.filter(
        course =>
          !isOver(course) &&
          (opensCoursePage(course.status) || PENDING.includes(course.status)),
      ),
    ),
    earlier: groupByTerm(
      courses.filter(course => isOver(course) && opensCoursePage(course.status)),
    ),
  };
}
