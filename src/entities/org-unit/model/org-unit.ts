import type { OrgUnitResponseDto } from '@/shared/api';

export type OrgUnit = OrgUnitResponseDto;

export interface OrgUnitNode extends OrgUnit {
  readonly children: OrgUnitNode[];
}

/**
 * A parent that never arrived — deleted between calls, or from another
 * institution's data leaking in — is treated as a root rather than dropped, so
 * every unit still shows up somewhere.
 */
export function toTree(orgUnits: readonly OrgUnit[]): OrgUnitNode[] {
  const nodes = new Map<string, OrgUnitNode>(
    orgUnits.map(orgUnit => [orgUnit.id, { ...orgUnit, children: [] }]),
  );
  const roots: OrgUnitNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}
