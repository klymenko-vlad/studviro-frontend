import { apiQueries } from '@/shared/api';

export const catalogueQueries = {
  programs: apiQueries.listProgramsOptions,
  programsKey: apiQueries.listProgramsQueryKey,
  courses: apiQueries.listCoursesOptions,
  coursesKey: apiQueries.listCoursesQueryKey,
} as const;

export const catalogueMutations = {
  createProgram: apiQueries.createProgramMutation,
  updateProgram: apiQueries.updateProgramMutation,
  removeProgram: apiQueries.removeProgramMutation,
  createCourse: apiQueries.createCourseMutation,
  updateCourse: apiQueries.updateCourseMutation,
  removeCourse: apiQueries.removeCourseMutation,
} as const;
