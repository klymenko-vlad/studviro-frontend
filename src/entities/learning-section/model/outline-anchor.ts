export type OutlineKind = 'section' | 'material' | 'assignment';

export function outlineAnchor(kind: OutlineKind, id: string): string {
  return `outline-${kind}-${id}`;
}
