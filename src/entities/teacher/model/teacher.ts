import type { TeacherProfileResponseDto } from '@/shared/api';

export type TeacherProfile = TeacherProfileResponseDto;
export type TeacherOffering = TeacherProfile['offerings'][number];
