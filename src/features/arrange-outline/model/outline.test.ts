import { describe, expect, it } from 'vitest';

import {
  learningMaterials,
  learningSections,
  offeringAssignments,
  offeringQuizzes,
} from '@/shared/test';

import { buildOutline, neighbourEntry } from './outline';

const [week] = learningSections;
const [slides, repository, rules] = learningMaterials;
const [exercise] = offeringAssignments;

const titlesOf = (outline: ReturnType<typeof buildOutline>) =>
  outline.map(group => ({
    section: group.section?.title ?? null,
    items: group.entries.map(entry => entry.title),
  }));

describe('buildOutline', () => {
  it('puts the general area first, then each section with its items in position order', () => {
    const outline = buildOutline(
      learningSections,
      learningMaterials,
      offeringAssignments,
    );

    expect(titlesOf(outline)).toEqual([
      { section: null, items: ['The course repository', 'How marking works'] },
      {
        section: 'Week 1 — sorting',
        items: ['Lecture 1 — slides', 'Assignment 1 — sorting'],
      },
    ]);
  });

  it('interleaves materials and assignments by their shared position', () => {
    const outline = buildOutline(
      learningSections,
      [{ ...slides!, position: 2 }],
      [{ ...exercise!, position: 0 }],
    );

    expect(outline[1]!.entries.map(entry => entry.kind)).toEqual([
      'assignment',
      'material',
    ]);
  });

  it('places a quiz among materials and assignments by the same position', () => {
    const [quiz] = offeringQuizzes;
    const outline = buildOutline(
      learningSections,
      [{ ...slides!, position: 0 }],
      [{ ...exercise!, position: 2 }],
      [{ ...quiz!, position: 1 }],
    );

    expect(outline[1]!.entries.map(entry => [entry.kind, entry.title])).toEqual([
      ['material', 'Lecture 1 — slides'],
      ['quiz', 'Foundations quiz'],
      ['assignment', 'Assignment 1 — sorting'],
    ]);
  });

  it('orders sections by their own position', () => {
    const later = { ...week!, id: 'later', title: 'Week 2', position: 1 };
    const outline = buildOutline([later, week!], [], []);

    expect(outline.map(group => group.section?.title ?? null)).toEqual([
      null,
      'Week 1 — sorting',
      'Week 2',
    ]);
  });

  it('keeps an item whose section the reader was not sent in the general area', () => {
    const outline = buildOutline([], [slides!], []);

    expect(titlesOf(outline)).toEqual([{ section: null, items: ['Lecture 1 — slides'] }]);
  });

  it('is an empty general area for an empty course', () => {
    expect(titlesOf(buildOutline([], [], []))).toEqual([{ section: null, items: [] }]);
  });
});

describe('neighbourEntry', () => {
  const [general] = buildOutline(
    learningSections,
    learningMaterials,
    offeringAssignments,
  );

  it('finds the entry above and below', () => {
    expect(neighbourEntry(general!.entries, rules!.id, -1)?.id).toBe(repository!.id);
    expect(neighbourEntry(general!.entries, repository!.id, 1)?.id).toBe(rules!.id);
  });

  it('has nothing past either end', () => {
    expect(neighbourEntry(general!.entries, repository!.id, -1)).toBeNull();
    expect(neighbourEntry(general!.entries, rules!.id, 1)).toBeNull();
    expect(neighbourEntry(general!.entries, 'missing', 1)).toBeNull();
  });
});
