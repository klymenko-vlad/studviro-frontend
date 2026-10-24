'use server';

import type { ReactNode } from 'react';

import { Markdown } from '@/shared/markdown';

const MAX_PAGE = 100_000;

export async function previewPage(source: string): Promise<ReactNode> {
  const text = typeof source === 'string' ? source.slice(0, MAX_PAGE) : '';

  return Promise.resolve(<Markdown source={text} />);
}
