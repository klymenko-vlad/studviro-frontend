import { describe, expect, it } from 'vitest';

import type { Deadline } from '@/entities/deadline';
import type { PersonalTask } from '@/entities/planner';

import { upcomingDue } from './upcoming-due';

const deadline = (id: string, dueAt: string) =>
  ({ id, name: `Assignment ${id}`, dueAt, course: { code: 'INF/ALG' } }) as Deadline;
const task = (id: string, dueAt: string | null, done = false) =>
  ({ id, title: `Task ${id}`, dueAt, done }) as PersonalTask;

describe('upcomingDue', () => {
  it('interleaves course deadlines and own tasks by due time and keeps the first few', () => {
    const items = upcomingDue(
      [
        deadline('a', '2026-06-03T10:00:00.000Z'),
        deadline('b', '2026-06-05T10:00:00.000Z'),
      ],
      [task('x', '2026-06-04T10:00:00.000Z'), task('y', '2026-06-06T10:00:00.000Z')],
      3,
    );

    expect(items.map(item => item.key)).toEqual(['deadline-a', 'task-x', 'deadline-b']);
    expect(items[1]).toMatchObject({ title: 'Task x', courseCode: null });
  });

  it('leaves out an undated or finished task', () => {
    expect(
      upcomingDue([], [task('x', null), task('y', '2026-06-04T10:00:00.000Z', true)], 4),
    ).toEqual([]);
  });
});
