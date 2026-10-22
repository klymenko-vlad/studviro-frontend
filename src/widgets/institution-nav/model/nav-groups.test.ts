import { describe, expect, it } from 'vitest';

import type { Permission, Role } from '@/entities/permission';

import { visibleNavGroups } from './nav-groups';

const STUDENT: Permission[] = [
  'institution:read',
  'program:read',
  'course:read',
  'offering:read',
  'enrollment:read',
  'grade:read',
  'schedule:read',
  'notification:read',
  'exam:register',
  'course:enroll',
];
const TEACHER: Permission[] = [...STUDENT, 'role:read', 'grade:propose', 'grade:publish'];
const REGISTRAR: Permission[] = [
  ...STUDENT,
  'role:read',
  'enrollment:manage',
  'grade:publish',
];

function groupsFor(roles: Role[], granted: Permission[], disabled: string[] = []) {
  return visibleNavGroups({
    roles,
    can: permission => granted.includes(permission),
    isEnabled: feature => !disabled.includes(feature),
  });
}

describe('visibleNavGroups', () => {
  it('gives a student the general screens and their studies', () => {
    expect(groupsFor(['student'], STUDENT)).toEqual([
      { key: 'general', items: ['dashboard', 'calendar'] },
      { key: 'studies', items: ['courses', 'exams', 'grades'] },
    ]);
  });

  it('spares a teacher the student screens their permissions would also open', () => {
    expect(groupsFor(['teacher'], TEACHER).map(group => group.key)).toEqual([
      'general',
      'teaching',
    ]);
  });

  it('keeps people and org units out of a teacher’s nav, though role:read opens them', () => {
    const items = groupsFor(['teacher'], TEACHER).flatMap(group => group.items);

    expect(items).not.toContain('people');
    expect(items).not.toContain('orgUnits');
  });

  it('offers a registrar only the administration screens a registrar may open', () => {
    expect(groupsFor(['registrar'], REGISTRAR)).toContainEqual({
      key: 'administration',
      items: ['people', 'orgUnits'],
    });
  });

  it('shows every group to somebody who holds every kind of role', () => {
    const all: Permission[] = [
      ...TEACHER,
      'course:manage',
      'offering:manage',
      'role:assign',
      'audit:read',
      'institution:manage',
    ];

    expect(
      groupsFor(['student', 'teacher', 'institution_admin'], all).map(group => group.key),
    ).toEqual(['general', 'studies', 'teaching', 'administration']);
  });

  it('drops a screen whose feature the institution turned off', () => {
    const items = groupsFor(['student'], STUDENT, ['grades', 'timetable']).flatMap(
      group => group.items,
    );

    expect(items).not.toContain('grades');
    expect(items).not.toContain('calendar');
  });

  it('drops a group with nothing left in it', () => {
    expect(groupsFor(['registrar'], ['institution:read'])).toEqual([
      { key: 'general', items: ['dashboard'] },
    ]);
  });

  it('always keeps the dashboard, permissions or not', () => {
    expect(groupsFor([], [])).toEqual([{ key: 'general', items: ['dashboard'] }]);
  });
});
