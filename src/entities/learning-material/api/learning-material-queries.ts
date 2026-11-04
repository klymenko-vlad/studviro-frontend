import { apiQueries } from '@/shared/api';

type FolderFilesOptions = Parameters<typeof apiQueries.listFolderFilesInfiniteOptions>[0];

interface FolderFilesPage {
  meta: { page: number; hasNextPage: boolean };
}

export const learningMaterialQueries = {
  list: apiQueries.listLearningMaterialsOptions,
  listKey: apiQueries.listLearningMaterialsQueryKey,
  detail: apiQueries.getLearningMaterialOptions,
  detailKey: apiQueries.getLearningMaterialQueryKey,
  downloadUrl: apiQueries.getLearningMaterialDownloadUrlOptions,
  folderFiles: (options: FolderFilesOptions) => ({
    ...apiQueries.listFolderFilesInfiniteOptions(options),
    initialPageParam: 1,
    getNextPageParam: (lastPage: FolderFilesPage): number | undefined =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  }),
  folderFilesKey: apiQueries.listFolderFilesInfiniteQueryKey,
  folderFileDownloadUrl: apiQueries.getFolderFileDownloadUrlOptions,
} as const;

export const learningMaterialMutations = {
  create: apiQueries.createLearningMaterialMutation,
  update: apiQueries.updateLearningMaterialMutation,
  remove: apiQueries.removeLearningMaterialMutation,
  uploadTicket: apiQueries.createMaterialUploadTicketMutation,
  addFolderFile: apiQueries.addFolderFileMutation,
  removeFolderFile: apiQueries.removeFolderFileMutation,
} as const;
