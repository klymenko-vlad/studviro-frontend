import type { UserResponseDto } from '@/shared/api';

/** The domain name the app uses; the DTO name is an API detail. */
export type User = UserResponseDto;

/**
 * Initials for avatar fallbacks. Display names are user-supplied, so this has to
 * survive empty strings, single words, and extra whitespace.
 */
export function getUserInitials(user: Pick<User, 'displayName' | 'email'>): string {
  const source = user.displayName.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();

  const first = parts[0]?.[0] ?? '';
  const last = parts.at(-1)?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}
