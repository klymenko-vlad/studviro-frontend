import type { TeacherOfferingPageDto, TeacherProfileResponseDto } from '@/shared/api';

export type TeacherProfile = TeacherProfileResponseDto;
export type TeacherOffering = TeacherOfferingPageDto['items'][number];
