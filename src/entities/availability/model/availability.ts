import type { LearningSectionResponseDto } from '@/shared/api';

export type Availability = Pick<
  LearningSectionResponseDto,
  'availability' | 'availableFrom' | 'availableUntil' | 'hiddenUntilAvailable'
>;
