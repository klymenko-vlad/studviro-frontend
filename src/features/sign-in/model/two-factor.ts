import { apiSchemas } from '@/shared/api';

export const TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED';
export const TWO_FACTOR_CHALLENGE_EXPIRED = 'TWO_FACTOR_CHALLENGE_EXPIRED';

export const twoFactorCodeSchema = apiSchemas.zTwoFactorCodeDto;
