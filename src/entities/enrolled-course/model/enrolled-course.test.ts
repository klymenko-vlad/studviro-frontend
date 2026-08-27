import { describe, expect, it } from 'vitest';

import { enrolledCourses } from '@/shared/test';

import { groupByTerm, primaryTeacher, totalCredits } from './enrolled-course';

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
