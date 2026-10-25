const GRAPHEMES = new Intl.Segmenter();

/**
 * Initials from the parts that carry the name, so a single word still renders.
 * Segmented rather than indexed: a leading `Ľ` or `Č` is one grapheme and more
 * than one UTF-16 code unit.
 */
export function initials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';

  return parts
    .slice(0, 2)
    .map(part => [...GRAPHEMES.segment(part)][0]?.segment.toUpperCase() ?? '')
    .join('');
}
