import { ROUTES } from '@/shared/config';

export const MARKETING_LINKS = [
  { key: 'forStudents', href: ROUTES.forStudents },
  { key: 'forTeachers', href: ROUTES.forTeachers },
  { key: 'forInstitutions', href: ROUTES.forInstitutions },
] as const;
