import type {
  ConnectorStatusResponseDto,
  InstitutionConfigurationResponseDto,
} from '@/shared/api';

export type InstitutionConfiguration = InstitutionConfigurationResponseDto;
export type ConnectorStatus = ConnectorStatusResponseDto;
export type ConnectorKind = ConnectorStatus['kind'];

/**
 * The server reports every key it knows, overridden or not, so the catalogue
 * lives there and the client never keeps a second copy of it.
 */
export function terminologyKeys(configuration: InstitutionConfiguration): string[] {
  return Object.keys(configuration.terminology).sort();
}

export function featureFlags(configuration: InstitutionConfiguration): string[] {
  return Object.keys(configuration.features).sort();
}

export function alternativesFor(
  statuses: readonly ConnectorStatus[],
  kind: ConnectorKind,
): string[] {
  return statuses.find(status => status.kind === kind)?.alternatives ?? [];
}
