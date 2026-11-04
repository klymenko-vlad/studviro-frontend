'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { OutlineGroup } from '@/features/arrange-outline';
import { AssignmentForm } from '@/features/manage-assignments';
import { MaterialForm } from '@/features/manage-materials';
import { NewQuizForm } from '@/features/manage-quizzes';
import { SectionActions, SectionForm } from '@/features/manage-sections';
import {
  GroupsEditor,
  RestrictionEditor,
  type RestrictionCandidate,
} from '@/features/restrict-access';
import { AvailabilityNote } from '@/entities/availability';
import {
  ProgressMeter,
  progressOf,
  sectionTally,
  type Progress,
} from '@/entities/completion';
import { outlineAnchor, type LearningSection } from '@/entities/learning-section';
import { RestrictionNote } from '@/entities/restriction';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

import { AccessButtons, type AccessPanel } from './access-buttons';
import { ItemSight } from './item-sight';
import { OutlineEntryItem } from './outline-entry';

type Adding =
  'material' | 'assignment' | 'quiz' | 'edit' | Exclude<AccessPanel, null> | null;

export function OutlineGroupCard({
  institutionId,
  offeringId,
  spaceId,
  group,
  sections,
  manageable,
  progress,
  candidates,
  readOnly = false,
}: {
  institutionId: string;
  offeringId: string;
  spaceId: string;
  group: OutlineGroup;
  sections: readonly LearningSection[];
  manageable: boolean;
  progress?: Progress;
  candidates: readonly RestrictionCandidate[];
  readOnly?: boolean;
}) {
  const t = useTranslations('outline');
  const tCompletion = useTranslations('completion');
  const [open, setOpen] = useState<Adding>(null);
  const { section, entries } = group;
  const title = section?.title ?? t('general');
  const tally = sectionTally(progress, section?.id ?? null);
  const toggle = (next: Exclude<Adding, null>) => {
    setOpen(current => (current === next ? null : next));
  };
  const close = () => {
    setOpen(null);
  };

  return (
    <Card
      aria-label={title}
      role="region"
      id={section === null ? undefined : outlineAnchor('section', section.id)}
      className="scroll-mt-24"
    >
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {section !== null && !section.visible ? (
            <Badge variant="outline">{t('hidden')}</Badge>
          ) : null}
          {section !== null && manageable ? (
            <AvailabilityNote item={section} audience="author" />
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
          {manageable && section !== null ? (
            <AccessButtons
              title={title}
              open={
                open === 'access' || open === 'groups' || open === 'sight' ? open : null
              }
              onToggle={panel => {
                setOpen(panel);
              }}
            />
          ) : null}
        </div>
        {section?.summary ? <CardDescription>{section.summary}</CardDescription> : null}
        {section !== null && !manageable ? (
          <AvailabilityNote item={section} audience="student" />
        ) : null}
        {section === null ? null : (
          <RestrictionNote
            restriction={section.restriction}
            audience={manageable ? 'author' : 'student'}
          />
        )}
        {tally === undefined ? null : (
          <ProgressMeter
            tally={tally}
            label={tCompletion('sectionProgress', { title })}
          />
        )}
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

        {manageable && section !== null && open === 'access' ? (
          <RestrictionEditor
            institutionId={institutionId}
            offeringId={offeringId}
            spaceId={spaceId}
            target={{ kind: 'section', id: section.id, title }}
            restriction={section.restriction}
            candidates={candidates}
            onDone={close}
          />
        ) : null}

        {manageable && section !== null && open === 'groups' ? (
          <GroupsEditor
            institutionId={institutionId}
            offeringId={offeringId}
            spaceId={spaceId}
            target={{ kind: 'section', id: section.id, title }}
            restriction={section.restriction}
            onDone={close}
          />
        ) : null}

        {manageable && section !== null && open === 'sight' ? (
          <ItemSight
            institutionId={institutionId}
            spaceId={spaceId}
            target={{ kind: 'section', id: section.id, title }}
            onDone={close}
          />
        ) : null}

        {entries.length === 0 ? (
          !manageable &&
          (section?.availability === 'scheduled' ||
            section?.restriction?.locked) ? null : (
            <p className="text-muted-foreground text-sm">{t('emptySection')}</p>
          )
        ) : (
          <ul className="flex flex-col gap-4" aria-label={t('itemsOf', { title })}>
            {entries.map(entry => (
              <OutlineEntryItem
                key={entry.id}
                institutionId={institutionId}
                offeringId={offeringId}
                spaceId={spaceId}
                entry={entry}
                entries={entries}
                sectionId={section?.id ?? null}
                sections={sections}
                manageable={manageable}
                progress={progressOf(progress, entry.id)}
                candidates={candidates}
                readOnly={readOnly}
              />
            ))}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={open === 'quiz'}
                aria-label={t('addQuizTo', { title })}
                onClick={() => {
                  toggle('quiz');
                }}
              >
                {open === 'quiz' ? t('cancel') : t('addQuiz')}
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
            {open === 'quiz' ? (
              <NewQuizForm
                institutionId={institutionId}
                offeringId={offeringId}
                spaceId={spaceId}
                sectionId={section?.id ?? null}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
