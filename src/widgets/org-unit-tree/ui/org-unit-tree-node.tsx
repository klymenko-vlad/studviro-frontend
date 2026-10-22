import { useTranslations } from 'next-intl';

import { RetireOrgUnitButton } from '@/features/manage-org-units';
import {
  useTerminology,
  type TerminologyKey,
} from '@/entities/institution-configuration';
import type { OrgUnitNode } from '@/entities/org-unit';
import { usePermissions } from '@/entities/permission';
import { Badge } from '@/shared/ui';

/** The three unit types this institution may have its own word for. */
const OVERRIDABLE: Partial<Record<OrgUnitNode['type'], TerminologyKey>> = {
  faculty: 'faculty',
  department: 'department',
};

export function OrgUnitTreeNode({
  node,
  institutionId,
  depth = 0,
}: {
  node: OrgUnitNode;
  institutionId: string;
  depth?: number;
}) {
  const t = useTranslations('orgUnits');
  const term = useTerminology(institutionId);
  const { can } = usePermissions(institutionId);
  const overridable = OVERRIDABLE[node.type];

  return (
    <li>
      <div
        className="flex items-center gap-2 py-1.5"
        style={{ paddingInlineStart: `${depth * 1.25}rem` }}
      >
        <span className="font-medium">{node.name}</span>
        <span className="text-muted-foreground font-mono text-xs">{node.code}</span>
        <Badge variant="secondary">
          {overridable === undefined ? t(`type.${node.type}`) : term(overridable)}
        </Badge>

        {can('institution:manage') ? (
          <RetireOrgUnitButton
            institutionId={institutionId}
            orgUnitId={node.id}
            orgUnitName={node.name}
          />
        ) : null}
      </div>

      {node.children.length > 0 ? (
        <ul>
          {node.children.map(child => (
            <OrgUnitTreeNode
              key={child.id}
              node={child}
              institutionId={institutionId}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
