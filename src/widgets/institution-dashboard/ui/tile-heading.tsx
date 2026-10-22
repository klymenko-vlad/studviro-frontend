'use client';

import { createContext, useContext } from 'react';

/**
 * A tile is a page section of its own until the dashboard groups tiles under
 * section headings; then it sits one level below them.
 */
export const TileHeadingLevel = createContext<'h2' | 'h3'>('h2');

export function useTileHeading() {
  return useContext(TileHeadingLevel);
}
