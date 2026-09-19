import { apiQueries } from '@/shared/api';

export const learningMaterialQueries = {
  list: apiQueries.listLearningMaterialsOptions,
  listKey: apiQueries.listLearningMaterialsQueryKey,
  downloadUrl: apiQueries.getLearningMaterialDownloadUrlOptions,
} as const;

export const learningMaterialMutations = {
  create: apiQueries.createLearningMaterialMutation,
  update: apiQueries.updateLearningMaterialMutation,
  remove: apiQueries.removeLearningMaterialMutation,
  uploadTicket: apiQueries.createMaterialUploadTicketMutation,
} as const;
