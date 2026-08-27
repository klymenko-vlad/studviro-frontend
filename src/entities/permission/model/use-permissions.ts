'use client';

import { useQuery } from '@tanstack/react-query';

import type { MyPermissionsResponseDto } from '@/shared/api';

import { permissionQueries } from '../api/permission-queries';

export type Permission = MyPermissionsResponseDto['permissions'][number];

/**
 * What the signed-in person may do in one institution, as the server resolved
 * it. The role-to-permission map stays on the server; the client only asks.
 */
export function usePermissions(institutionId: string): {
  can: (permission: Permission) => boolean;
  isPending: boolean;
} {
  const { data, isPending } = useQuery(
    permissionQueries.inInstitution({ path: { institutionId } }),
  );

  return {
    can: permission => data?.permissions.includes(permission) ?? false,
    isPending,
  };
}
