import type { ExternalIdentityResponseDto } from '@/shared/api';

export type LinkedAccount = ExternalIdentityResponseDto;
export type SourceSystem = LinkedAccount['sourceSystem'];

/**
 * The issuer is a URL the provider chose; its host is the only part a person
 * recognises. An issuer that is not a URL is shown as it stands.
 */
export function issuerHost(issuer: string): string {
  try {
    return new URL(issuer).host;
  } catch {
    return issuer;
  }
}
