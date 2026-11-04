import { apiQueries } from '@/shared/api';

type ContentOptions = Parameters<
  typeof apiQueries.listStudyGroupContentInfiniteOptions
>[0];

interface ContentPage {
  meta: { page: number; hasNextPage: boolean };
}

export const studyGroupQueries = {
  list: apiQueries.listStudyGroupsOptions,
  listKey: apiQueries.listStudyGroupsQueryKey,
  content: (options: ContentOptions) => ({
    ...apiQueries.listStudyGroupContentInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ContentPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
} as const;

export const studyGroupMutations = {
  create: apiQueries.createStudyGroupMutation,
  update: apiQueries.updateStudyGroupMutation,
  remove: apiQueries.removeStudyGroupMutation,
  addMember: apiQueries.addStudyGroupMemberMutation,
  removeMember: apiQueries.removeStudyGroupMemberMutation,
} as const;
