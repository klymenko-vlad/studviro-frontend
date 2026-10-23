'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { OutlineItemActions, type OutlineGroup } from '@/features/arrange-outline';
import { AssignmentForm } from '@/features/manage-assignments';
import { MaterialActions, MaterialForm } from '@/features/manage-materials';
import { SectionActions, SectionForm } from '@/features/manage-sections';
import type { LearningSection } from '@/entities/learning-section';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

import { OutlineAssignment } from './outline-assignment';
import { OutlineMaterial } from './outline-material';

type Adding = 'material' | 'assignment' | 'edit' | null;

export function OutlineGroupCard({
  institutionId,
  offeringId,
  spaceId,
  group,
  sections,
  manageable,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  group: OutlineGroup;
  sections: readonly LearningSection[];
  manageable: boolean;
}) {
  const t = useTranslations('outline');
  const [open, setOpen] = useState<Adding>(null);
  const { section, entries } = group;
  const title = section?.title ?? t('general');
  const toggle = (next: Exclude<Adding, null>) => {
    setOpen(current => (current === next ? null : next));
  };
  const close = () => {
    setOpen(null);
  };

  return (
    <Card aria-label={title} role="region">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {section !== null && !section.visible ? (
            <Badge variant="outline">{t('hidden')}</Badge>
          ) : null}
          {manageable && section !== null ? (
            <SectionActions
              institutionId={institutionId}
              spaceId={spaceId}
              section={section}
              sections={sections}
              onEdit={() => {
                toggle('edit');
              }}
            />
          ) : null}
        </div>
        {section?.summary ? <CardDescription>{section.summary}</CardDescription> : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {manageable && section !== null && open === 'edit' ? (
          <SectionForm
            institutionId={institutionId}
            spaceId={spaceId}
            section={section}
            onDone={close}
          />
        ) : null}

        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('emptySection')}</p>
        ) : (
          <ul className="flex flex-col gap-4" aria-label={t('itemsOf', { title })}>
            {entries.map(entry => {
              const actions = manageable ? (
                <>
                  <OutlineItemActions
                    institutionId={institutionId}
                    spaceId={spaceId}
                    entry={entry}
                    entries={entries}
                    sectionId={section?.id ?? null}
                    sections={sections}
                  />
                  {entry.kind === 'material' ? (
                    <MaterialActions
                      institutionId={institutionId}
                      spaceId={spaceId}
                      material={entry.material}
                    />
                  ) : null}
                </>
              ) : null;

              return (
                <li key={entry.id} className="flex flex-col gap-2">
                  {entry.kind === 'material' ? (
                    <OutlineMaterial
                      institutionId={institutionId}
                      spaceId={spaceId}
                      material={entry.material}
                      actions={actions}
                    />
                  ) : (
                    <OutlineAssignment
                      institutionId={institutionId}
                      offeringId={offeringId}
                      assignment={entry.assignment}
                      actions={actions}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {manageable ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={open === 'material'}
                aria-label={t('addMaterialTo', { title })}
                onClick={() => {
                  toggle('material');
                }}
              >
                {open === 'material' ? t('cancel') : t('addMaterial')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={open === 'assignment'}
                aria-label={t('addAssignmentTo', { title })}
                onClick={() => {
                  toggle('assignment');
                }}
              >
                {open === 'assignment' ? t('cancel') : t('addAssignment')}
              </Button>
            </div>
            {open === 'material' ? (
              <MaterialForm
                institutionId={institutionId}
                spaceId={spaceId}
                sectionId={section?.id ?? null}
                onDone={close}
              />
            ) : null}
            {open === 'assignment' ? (
              <AssignmentForm
                institutionId={institutionId}
                spaceId={spaceId}
                sectionId={section?.id ?? null}
                onDone={close}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
