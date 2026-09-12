import { useTranslations } from 'next-intl';

import type { OrgUnitNode } from '@/entities/org-unit';
import { Badge } from '@/shared/ui';

export function OrgUnitTreeNode({
  node,
  depth = 0,
}: {
  node: OrgUnitNode;
  depth?: number;
}) {
  const t = useTranslations('orgUnits');

  return (
    <li>
      <div
        className="flex items-center gap-2 py-1.5"
        style={{ paddingInlineStart: `${depth * 1.25}rem` }}
      >
        <span className="font-medium">{node.name}</span>
        <span className="text-muted-foreground font-mono text-xs">{node.code}</span>
        <Badge variant="secondary">{t(`type.${node.type}`)}</Badge>
      </div>

      {node.children.length > 0 ? (
        <ul>
          {node.children.map(child => (
            <OrgUnitTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
