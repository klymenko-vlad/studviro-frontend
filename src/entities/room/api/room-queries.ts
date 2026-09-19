import { apiQueries } from '@/shared/api';

export const roomQueries = {
  list: apiQueries.listRoomsOptions,
  listKey: apiQueries.listRoomsQueryKey,
} as const;

export const roomMutations = {
  create: apiQueries.createRoomMutation,
  update: apiQueries.updateRoomMutation,
  remove: apiQueries.removeRoomMutation,
} as const;
