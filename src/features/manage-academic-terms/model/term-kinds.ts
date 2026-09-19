import { apiSchemas } from '@/shared/api';

/** The enum the API accepts, read off its own schema rather than retyped. */
export const TERM_KINDS = apiSchemas.zCreateAcademicTermDto.shape.kind.unwrap().options;
