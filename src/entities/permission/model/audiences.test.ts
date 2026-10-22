import { describe, expect, it } from 'vitest';

import { runsInstitution, studies, teaches } from './audiences';

describe('audiences', () => {
  it('counts every administrative role as running the institution', () => {
    for (const role of [
      'institution_admin',
      'org_unit_manager',
      'program_coordinator',
      'course_coordinator',
      'registrar',
    ] as const) {
      expect(runsInstitution([role])).toBe(true);
    }
    expect(runsInstitution(['teacher', 'student'])).toBe(false);
  });

  it('counts teachers and assistants as teaching', () => {
    expect(teaches(['teacher'])).toBe(true);
    expect(teaches(['teaching_assistant'])).toBe(true);
    expect(teaches(['institution_admin'])).toBe(false);
  });

  it('counts only students as studying', () => {
    expect(studies(['student'])).toBe(true);
    expect(studies(['teacher', 'institution_admin'])).toBe(false);
  });
});
