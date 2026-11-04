import { describe, expect, it } from 'vitest';

import { bottomTabs, TAB_LIMIT } from './bottom-tabs';
import type { VisibleNavGroup } from './nav-groups';

const general: VisibleNavGroup = { key: 'general', items: ['dashboard', 'calendar'] };

describe('bottomTabs', () => {
  it('gives a student every screen they have, and no More', () => {
    const groups: VisibleNavGroup[] = [
      general,
      { key: 'studies', items: ['courses', 'exams', 'grades'] },
    ];

    expect(bottomTabs(groups)).toEqual({
      tabs: ['dashboard', 'calendar', 'courses', 'exams', 'grades'],
      more: false,
    });
  });

  it('gives a teacher their teaching beside home and the calendar', () => {
    expect(bottomTabs([general, { key: 'teaching', items: ['teaching'] }])).toEqual({
      tabs: ['dashboard', 'calendar', 'teaching'],
      more: false,
    });
  });

  it('gives an administrator home and their four hubs', () => {
    const groups: VisibleNavGroup[] = [
      { key: 'general', items: ['dashboard'] },
      { key: 'administration', items: ['structure', 'offer', 'people', 'settings'] },
    ];

    expect(bottomTabs(groups)).toEqual({
      tabs: ['dashboard', 'structure', 'offer', 'people', 'settings'],
      more: false,
    });
  });

  it('keeps the four that matter most and puts the rest under More', () => {
    const groups: VisibleNavGroup[] = [
      general,
      { key: 'teaching', items: ['teaching'] },
      { key: 'administration', items: ['structure', 'offer', 'people', 'settings'] },
    ];

    expect(bottomTabs(groups)).toEqual({
      tabs: ['dashboard', 'teaching', 'calendar', 'offer'],
      more: true,
    });
  });

  it('never offers more slots than a thumb can tell apart', () => {
    const groups: VisibleNavGroup[] = [
      general,
      { key: 'studies', items: ['courses', 'exams', 'grades'] },
      { key: 'teaching', items: ['teaching'] },
    ];

    const { tabs, more } = bottomTabs(groups);
    expect(tabs.length + (more ? 1 : 0)).toBeLessThanOrEqual(TAB_LIMIT);
    expect(tabs).toEqual(['dashboard', 'courses', 'teaching', 'calendar']);
  });
});
