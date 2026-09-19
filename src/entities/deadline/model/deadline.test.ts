import { describe, expect, it } from 'vitest';

import { deadlineState, nextDeadlines, sortByDueDate, type Deadline } from './deadline';

const deadline = (overrides: Partial<Deadline> = {}): Deadline => ({
  id: 'activity-1',
  type: 'assignment',
  name: 'Assignment 1',
  brief: null,
  opensAt: '2026-10-29T21:00:00.000Z',
  dueAt: '2026-11-05T21:00:00.000Z',
  isOpen: true,
  isOverdue: false,
  submission: null,
  attendance: 'enrolled',
  learningSpace: { id: 'space-1', name: 'Programming 2', brief: null },
  offering: { id: 'offering-1' },
  course: { id: 'course-1', code: 'INF/PF/22', title: 'Programming 2' },
  term: { id: 'term-1', code: '2026-WS', name: 'Winter 2026' },
  ...overrides,
});

describe('deadlineState', () => {
  it('calls an open, unexpired deadline open', () => {
    expect(deadlineState(deadline())).toBe('open');
  });

  it('calls a deadline that has not opened yet upcoming', () => {
    expect(deadlineState(deadline({ isOpen: false }))).toBe('upcoming');
  });

  it('calls a passed deadline missed whatever its open flag says', () => {
    expect(deadlineState(deadline({ isOpen: true, isOverdue: true }))).toBe('missed');
  });

  it('calls a passed deadline handed in once the learner submitted', () => {
    const submission = { state: 'submitted' as const, submittedAt: null, isLate: false };

    expect(deadlineState(deadline({ isOverdue: true, submission }))).toBe('handedIn');
  });

  it('prefers the hand-in over the clock even before the deadline passes', () => {
    const submission = { state: 'graded' as const, submittedAt: null, isLate: false };

    expect(deadlineState(deadline({ isOverdue: false, submission }))).toBe('handedIn');
  });

  it('says overdue rather than missed to the teacher, who hands nothing in', () => {
    expect(deadlineState(deadline({ isOverdue: true, attendance: 'teaching' }))).toBe(
      'overdue',
    );
  });
});

describe('sortByDueDate', () => {
  it('orders deadlines by the date they fall due', () => {
    const later = deadline({ id: 'b', dueAt: '2026-11-07T21:00:00.000Z' });
    const sooner = deadline({ id: 'a', dueAt: '2026-11-03T21:00:00.000Z' });

    expect(sortByDueDate([later, sooner]).map(item => item.id)).toEqual(['a', 'b']);
  });

  it('breaks a tie on the activity name', () => {
    const second = deadline({ id: 'b', name: 'Quiz 2' });
    const first = deadline({ id: 'a', name: 'Assignment 1' });

    expect(sortByDueDate([second, first]).map(item => item.id)).toEqual(['a', 'b']);
  });
});

describe('nextDeadlines', () => {
  it('keeps only what is still due, soonest first', () => {
    const passed = deadline({ id: 'past', isOverdue: true });
    const due = deadline({ id: 'due', dueAt: '2026-11-04T21:00:00.000Z' });

    expect(nextDeadlines([passed, due], 4).map(item => item.id)).toEqual(['due']);
  });

  it('never returns more than it was asked for', () => {
    const many = Array.from({ length: 6 }, (_, index) =>
      deadline({ id: `activity-${index}`, dueAt: `2026-11-0${index + 1}T21:00:00.000Z` }),
    );

    expect(nextDeadlines(many, 3)).toHaveLength(3);
  });

  it('returns nothing when every deadline has passed', () => {
    expect(nextDeadlines([deadline({ isOverdue: true })], 3)).toEqual([]);
  });
});
