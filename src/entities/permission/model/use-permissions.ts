'use client';

import { useQuery } from '@tanstack/react-query';

import type { MyPermissionsResponseDto } from '@/shared/api';

import { permissionQueries } from '../api/permission-queries';

export type Permission = MyPermissionsResponseDto['permissions'][number];
export type Role = MyPermissionsResponseDto['roles'][number];

const NO_ROLES: Role[] = [];

/**
 * What the signed-in person may do in one institution, as the server resolved
 * it. The role-to-permission map stays on the server; the client only asks.
 * `roles` says who the person is here, for screens shaped around that rather
 * than around one action — never use it to decide whether an action is allowed.
 */
export function usePermissions(institutionId: string): {
  can: (permission: Permission) => boolean;
  roles: Role[];
  isPending: boolean;
} {
  const { data, isPending } = useQuery(
    permissionQueries.inInstitution({ path: { institutionId } }),
  );

  return {
    can: permission => data?.permissions.includes(permission) ?? false,
    roles: data?.roles ?? NO_ROLES,
    isPending,
  };
}
