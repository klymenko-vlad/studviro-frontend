import { describe, expect, it } from 'vitest';

import { isUnread, sortByNewest, unreadCount, type Notification } from './notification';

const notification = (overrides: Partial<Notification>): Notification =>
  ({
    id: 'delivery-1',
    type: 'exam_term_rescheduled',
    occurredAt: '2026-05-18T09:00:00.000Z',
    occurrenceCount: 1,
    readAt: null,
    examTermId: 'exam-1',
    courseOfferingId: 'offering-1',
    courseCode: 'INF/ALG/22',
    courseTitle: 'Algorithms',
    startsAt: '2026-06-02T08:00:00.000Z',
    previousStartsAt: null,
    learningActivityId: null,
    dueAt: null,
    previousDueAt: null,
    activityName: null,
    grade: null,
    previousGrade: null,
    attempt: null,
    eventTitle: null,
    reason: null,
    ...overrides,
  }) satisfies Notification;

describe('notification', () => {
  it('treats a delivery without a read stamp as unread', () => {
    expect(isUnread(notification({}))).toBe(true);
    expect(isUnread(notification({ readAt: '2026-05-18T10:00:00.000Z' }))).toBe(false);
  });

  it('counts only the unread deliveries', () => {
    expect(
      unreadCount([
        notification({}),
        notification({ readAt: '2026-05-18T10:00:00.000Z' }),
      ]),
    ).toBe(1);
  });

  it('puts the most recent occurrence first', () => {
    const older = notification({ id: 'older', occurredAt: '2026-05-17T09:00:00.000Z' });
    const newer = notification({ id: 'newer', occurredAt: '2026-05-19T09:00:00.000Z' });

    expect(sortByNewest([older, newer]).map(item => item.id)).toEqual(['newer', 'older']);
  });
});
