'use client';

import {
  BookOpen,
  ClipboardPaste,
  KeyRound,
  LibraryBig,
  Network,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { usePermissions, type Permission } from '@/entities/permission';
import { institutionRoutes, Link } from '@/shared/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

import { useTileHeading } from './tile-heading';

type ShortcutKey =
  | 'catalogue'
  | 'bulk'
  | 'people'
  | 'roles'
  | 'orgUnits'
  | 'learning'
  | 'audit'
  | 'settings';

/**
 * The same gate each screen sits behind in the institution nav, so a shortcut
 * is never a door that refuses the person who opens it.
 */
const SHORTCUTS: { key: ShortcutKey; icon: LucideIcon; gate: Permission }[] = [
  { key: 'catalogue', icon: BookOpen, gate: 'course:manage' },
  { key: 'bulk', icon: ClipboardPaste, gate: 'offering:manage' },
  { key: 'people', icon: Users, gate: 'role:read' },
  { key: 'roles', icon: KeyRound, gate: 'role:assign' },
  { key: 'orgUnits', icon: Network, gate: 'role:read' },
  { key: 'learning', icon: LibraryBig, gate: 'offering:manage' },
  { key: 'audit', icon: ScrollText, gate: 'audit:read' },
  { key: 'settings', icon: Settings, gate: 'institution:manage' },
];

export function AdminShortcuts({ institutionId }: { institutionId: string }) {
  const t = useTranslations('dashboard.shortcuts');
  const heading = useTileHeading();
  const { can } = usePermissions(institutionId);
  const routes = institutionRoutes(institutionId);

  const visible = SHORTCUTS.filter(shortcut => can(shortcut.gate));

  if (visible.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle as={heading}>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Link
                href={routes[key]}
                className="hover:bg-secondary/60 hover:border-border focus-visible:ring-ring/50 flex h-full items-start gap-3 rounded-lg border border-transparent p-3 transition-colors outline-none focus-visible:ring-[3px] motion-reduce:transition-none"
              >
                <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t(`${key}.title`)}</span>
                  <span className="text-muted-foreground text-xs text-pretty">
                    {t(`${key}.description`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
