import { apiQueries } from '@/shared/api';

/**
 * Thin, named wrappers over the generated query options.
 *
 * The generated names come from the backend's operation ids (`findAll`,
 * `findOne`) and mean nothing outside the users controller. Re-exporting them
 * here under domain names means a backend rename is absorbed in this one file
 * instead of rippling through every component that reads users.
 *
 * Nothing is reimplemented — query keys, fetchers and types all stay generated,
 * so the cache stays consistent with what the SDK actually calls.
 */
export const userQueries = {
  list: apiQueries.findAllOptions,
  listKey: apiQueries.findAllQueryKey,
  listInfinite: apiQueries.findAllInfiniteOptions,
  detail: apiQueries.findOneOptions,
  detailKey: apiQueries.findOneQueryKey,
} as const;

export const userMutations = {
  create: apiQueries.createMutation,
  deactivate: apiQueries.deactivateUserMutation,
} as const;
