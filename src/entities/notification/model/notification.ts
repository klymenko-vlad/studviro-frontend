import type { NotificationResponseDto } from '@/shared/api';

export type Notification = NotificationResponseDto;
export type NotificationType = Notification['type'];

export function isUnread(notification: Notification): boolean {
  return notification.readAt === null;
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter(isUnread).length;
}

export function sortByNewest(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
