import { describe, expect, it } from 'vitest';

import { dashboardSections } from './sections';

describe('dashboardSections', () => {
  it('gives a student their studies only', () => {
    expect(dashboardSections(['student'])).toEqual(['studies']);
  });

  it('gives a teacher their teaching rather than a student’s tiles', () => {
    expect(dashboardSections(['teacher'])).toEqual(['teaching']);
  });

  it('gives an administrator the institution rather than a student’s tiles', () => {
    expect(dashboardSections(['institution_admin'])).toEqual(['administration']);
  });

  it.each([
    'registrar',
    'course_coordinator',
    'program_coordinator',
    'org_unit_manager',
  ] as const)('counts a %s as running the institution', role => {
    expect(dashboardSections([role])).toEqual(['administration']);
  });

  it('leads with teaching for a teacher who also studies', () => {
    expect(dashboardSections(['student', 'teacher'])).toEqual(['teaching', 'studies']);
  });

  it('leads with studies for a student who assists on a course', () => {
    expect(dashboardSections(['teaching_assistant', 'student'])).toEqual([
      'studies',
      'teaching',
    ]);
  });

  it('shows teaching once for somebody who both teaches and assists', () => {
    expect(dashboardSections(['teacher', 'teaching_assistant'])).toEqual(['teaching']);
  });

  it('leads with administration for a coordinator who also teaches', () => {
    expect(dashboardSections(['teacher', 'course_coordinator'])).toEqual([
      'administration',
      'teaching',
    ]);
  });

  it('has nothing to show a person with no role here', () => {
    expect(dashboardSections([])).toEqual([]);
  });
});
