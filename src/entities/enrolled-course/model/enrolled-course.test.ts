import { describe, expect, it } from 'vitest';

import { enrolledCourses } from '@/shared/test';

import {
  groupByTerm,
  opensCoursePage,
  primaryTeacher,
  splitByTime,
  totalCredits,
  type EnrolledCourse,
} from './enrolled-course';

describe('enrolled course model', () => {
  it('groups consecutive courses of the same term together', () => {
    const first = enrolledCourses[0]!;
    const groups = groupByTerm([first, { ...first, enrollmentId: 'second' }]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.courses).toHaveLength(2);
    expect(groups[0]!.term.name).toBe('Summer 2026');
  });

  it('keeps the order the API returned rather than merging distant terms', () => {
    const [current, past] = enrolledCourses as [
      (typeof enrolledCourses)[number],
      (typeof enrolledCourses)[number],
    ];
    const groups = groupByTerm([current, past, { ...current, enrollmentId: 'third' }]);

    expect(groups.map(group => group.term.code)).toEqual([
      '2026-SS',
      '2025-WS',
      '2026-SS',
    ]);
  });

  it('groups nothing into nothing', () => {
    expect(groupByTerm([])).toEqual([]);
  });

  it('sums credits and treats a course without credits as zero', () => {
    const first = enrolledCourses[0]!;
    const uncredited = {
      ...first,
      enrollmentId: 'uncredited',
      course: { ...first.course, credits: null },
    };

    expect(totalCredits([first, uncredited])).toBe(6);
  });

  it('prefers the primary teacher, then the first, then none', () => {
    const [withTeacher, withoutTeacher] = enrolledCourses as [
      (typeof enrolledCourses)[number],
      (typeof enrolledCourses)[number],
    ];
    const secondary = {
      ...withTeacher,
      teachers: [
        { ...withTeacher.teachers[0]!, displayName: 'Grace Hopper', isPrimary: false },
      ],
    };

    expect(primaryTeacher(withTeacher)?.displayName).toBe('Ada Lovelace');
    expect(primaryTeacher(secondary)?.displayName).toBe('Grace Hopper');
    expect(primaryTeacher(withoutTeacher)).toBeUndefined();
  });
});

describe('splitByTime', () => {
  const base = enrolledCourses[0]!;
  const NOW = new Date('2026-10-22T12:00:00.000Z');
  const course = (
    id: string,
    status: EnrolledCourse['status'],
    term: { id: string; startsAt: string; endsAt: string },
  ): EnrolledCourse => ({
    ...base,
    enrollmentId: id,
    status,
    term: { ...base.term, ...term, name: term.id, code: term.id },
  });
  const winter = {
    id: 'W26',
    startsAt: '2026-09-21T00:00:00.000Z',
    endsAt: '2027-02-08T00:00:00.000Z',
  };
  const summer = {
    id: 'S27',
    startsAt: '2027-02-15T00:00:00.000Z',
    endsAt: '2027-06-30T00:00:00.000Z',
  };
  const lastYear = {
    id: 'W25',
    startsAt: '2025-09-21T00:00:00.000Z',
    endsAt: '2026-02-08T00:00:00.000Z',
  };

  it('puts this term and anything ahead first, and finished terms after', () => {
    const { current, earlier } = splitByTime(
      [
        course('a', 'active', summer),
        course('b', 'active', winter),
        course('c', 'completed', lastYear),
      ],
      NOW,
    );

    expect(current.map(group => group.term.id)).toEqual(['S27', 'W26']);
    expect(earlier.map(group => group.term.id)).toEqual(['W25']);
  });

  it('keeps a pending request in view, since it is still being answered', () => {
    const { current } = splitByTime(
      [course('a', 'requested', winter), course('b', 'waitlisted', winter)],
      NOW,
    );

    expect(current[0]!.courses.map(c => c.enrollmentId)).toEqual(['a', 'b']);
  });

  it('drops courses the student left or was refused, wherever they fall', () => {
    const { current, earlier } = splitByTime(
      [
        course('a', 'withdrawn', winter),
        course('b', 'rejected', winter),
        course('c', 'withdrawn', lastYear),
      ],
      NOW,
    );

    expect(current).toEqual([]);
    expect(earlier).toEqual([]);
  });

  it('keeps of the past only what still opens — not a request nobody answered', () => {
    const { earlier } = splitByTime(
      [course('a', 'completed', lastYear), course('b', 'requested', lastYear)],
      NOW,
    );

    expect(earlier[0]!.courses.map(c => c.enrollmentId)).toEqual(['a']);
  });
});

describe('opensCoursePage', () => {
  it('opens for a student who takes or took the course, and not for one still asking', () => {
    expect(opensCoursePage('active')).toBe(true);
    expect(opensCoursePage('completed')).toBe(true);
    expect(opensCoursePage('requested')).toBe(false);
    expect(opensCoursePage('waitlisted')).toBe(false);
  });
});
