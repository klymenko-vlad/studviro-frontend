import type {
  ConnectorCredentialFieldDto,
  ConnectorCredentialsResponseDto,
} from '@/shared/api';

export type ConnectorCredentialsKind = ConnectorCredentialsResponseDto['kind'];
export type ConnectorCredentialField = ConnectorCredentialFieldDto;
export type ConnectorCredentials = ConnectorCredentialsResponseDto;

export const CONNECTOR_CREDENTIAL_KINDS: ConnectorCredentialsKind[] = [
  'academic',
  'learning',
];
