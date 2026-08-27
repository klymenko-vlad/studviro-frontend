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
