import type { Assignment } from '@/entities/assignment';
import type { LearningMaterial } from '@/entities/learning-material';
import type { LearningSection } from '@/entities/learning-section';

export type OutlineEntry =
  | {
      kind: 'material';
      id: string;
      title: string;
      position: number;
      material: LearningMaterial;
    }
  | {
      kind: 'assignment';
      id: string;
      title: string;
      position: number;
      assignment: Assignment;
    };

export interface OutlineGroup {
  section: LearningSection | null;
  entries: OutlineEntry[];
}

const byPosition = <T extends { position: number }>(left: T, right: T) =>
  left.position - right.position;

export function buildOutline(
  sections: readonly LearningSection[],
  materials: readonly LearningMaterial[],
  assignments: readonly Assignment[],
): OutlineGroup[] {
  const known = new Set(sections.map(section => section.id));
  const groupOf = (sectionId: string | null) =>
    sectionId !== null && known.has(sectionId) ? sectionId : null;

  const entries: (OutlineEntry & { sectionId: string | null })[] = [
    ...materials.map(material => ({
      kind: 'material' as const,
      id: material.id,
      title: material.title,
      position: material.position,
      material,
      sectionId: groupOf(material.sectionId),
    })),
    ...assignments.map(assignment => ({
      kind: 'assignment' as const,
      id: assignment.id,
      title: assignment.name,
      position: assignment.position ?? 0,
      assignment,
      sectionId: groupOf(assignment.sectionId),
    })),
  ];

  const inGroup = (sectionId: string | null): OutlineEntry[] =>
    entries
      .filter(entry => entry.sectionId === sectionId)
      .sort(byPosition)
      .map(({ sectionId: _placed, ...entry }) => entry);

  return [
    { section: null, entries: inGroup(null) },
    ...[...sections].sort(byPosition).map(section => ({
      section,
      entries: inGroup(section.id),
    })),
  ];
}

export function neighbourEntry(
  entries: readonly OutlineEntry[],
  id: string,
  direction: -1 | 1,
): OutlineEntry | null {
  const index = entries.findIndex(entry => entry.id === id);
  if (index === -1) return null;

  return entries[index + direction] ?? null;
}
