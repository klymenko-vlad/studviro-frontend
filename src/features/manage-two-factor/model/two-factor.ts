import { apiQueries, apiSchemas } from '@/shared/api';

export const twoFactorQueries = {
  status: apiQueries.getMyTwoFactorStatusOptions,
  statusKey: apiQueries.getMyTwoFactorStatusQueryKey,
} as const;

export const currentPasswordSchema = apiSchemas.zCurrentPasswordDto;
export const twoFactorCodeSchema = apiSchemas.zTwoFactorCodeDto;

export const CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT';
export const LOW_RECOVERY_CODES = 3;

export function groupSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}
