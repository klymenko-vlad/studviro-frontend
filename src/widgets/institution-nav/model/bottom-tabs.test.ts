import { describe, expect, it } from 'vitest';

import { bottomTabs } from './bottom-tabs';
import type { VisibleNavGroup } from './nav-groups';

const general: VisibleNavGroup = {
  key: 'general',
  items: ['dashboard', 'calendar', 'notifications', 'search'],
};

describe('bottomTabs', () => {
  it('gives a student home, their courses, the calendar and notifications', () => {
    const groups: VisibleNavGroup[] = [
      general,
      { key: 'studies', items: ['courses', 'enroll', 'grades', 'exams'] },
    ];

    expect(bottomTabs(groups)).toEqual([
      'dashboard',
      'courses',
      'calendar',
      'notifications',
    ]);
  });

  it('gives a teacher their teaching in place of a student’s courses', () => {
    const groups: VisibleNavGroup[] = [general, { key: 'teaching', items: ['teaching'] }];

    expect(bottomTabs(groups)).toEqual([
      'dashboard',
      'teaching',
      'calendar',
      'notifications',
    ]);
  });

  it('gives an administrator the catalogue and people', () => {
    const groups: VisibleNavGroup[] = [
      { key: 'general', items: ['dashboard', 'notifications', 'search'] },
      { key: 'administration', items: ['catalogue', 'people', 'roles', 'settings'] },
    ];

    expect(bottomTabs(groups)).toEqual([
      'dashboard',
      'catalogue',
      'people',
      'notifications',
    ]);
  });

  it('never offers more than four, whatever the person may open', () => {
    const groups: VisibleNavGroup[] = [
      general,
      { key: 'studies', items: ['courses', 'grades'] },
      { key: 'teaching', items: ['teaching'] },
      { key: 'administration', items: ['catalogue', 'people'] },
    ];

    expect(bottomTabs(groups)).toHaveLength(4);
  });

  it('offers nothing it was not given', () => {
    expect(bottomTabs([{ key: 'general', items: ['dashboard'] }])).toEqual(['dashboard']);
  });
});
