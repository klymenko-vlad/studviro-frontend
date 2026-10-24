import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALWAYS_AVAILABLE } from '@/shared/test';

import { readPage } from '../api/read-page';
import { CoursePageView } from './course-page-view';

vi.mock('../api/read-page', () => ({ readPage: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => `materials.page.${key}`)),
}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const address = {
  institutionId: '55555555-5555-4555-8555-555555555555',
  offeringId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  spaceId: '9a1f0b3c-1111-4111-8111-111111111111',
  materialId: 'ba5e0002-0000-4000-8000-000000000001',
};

const page = {
  ...ALWAYS_AVAILABLE,
  id: address.materialId,
  kind: 'page',
  title: 'Study guide',
  description: null,
  body: '## Week 1\n\nRead **chapter 4**.',
  url: null,
  filename: null,
  contentType: null,
  sizeBytes: null,
  scanStatus: 'unscanned',
  position: 0,
  visible: true,
  sectionId: null,
  completionRule: 'viewed',
} as const;

describe('CoursePageView', () => {
  beforeEach(() => {
    vi.mocked(readPage).mockReset();
  });

  it('renders the page’s Markdown under its title, with a way back to its place', async () => {
    vi.mocked(readPage).mockResolvedValue(page);

    render(await CoursePageView(address));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Study guide' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Week 1' })).toBeInTheDocument();
    expect(screen.getByText('chapter 4').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'materials.page.back' })).toHaveAttribute(
      'href',
      `/institutions/${address.institutionId}/courses/${address.offeringId}?section=materials#outline-material-${address.materialId}`,
    );
  });

  it('answers not found for a page the reader may not open', async () => {
    vi.mocked(readPage).mockResolvedValue(null);

    await expect(CoursePageView(address)).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
