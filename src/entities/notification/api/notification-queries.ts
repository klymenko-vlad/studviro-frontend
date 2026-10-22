import { apiQueries } from '@/shared/api';

export const notificationQueries = {
  list: apiQueries.listMyNotificationsOptions,
  listKey: apiQueries.listMyNotificationsQueryKey,
  unreadCount: apiQueries.countMyUnreadNotificationsOptions,
  unreadCountKey: apiQueries.countMyUnreadNotificationsQueryKey,
} as const;

export const notificationMutations = {
  markRead: apiQueries.markMyNotificationReadMutation,
  markAllRead: apiQueries.markAllMyNotificationsReadMutation,
} as const;
