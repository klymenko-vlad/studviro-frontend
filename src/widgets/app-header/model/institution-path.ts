const INSTITUTION_PATH = /^\/institutions\/([0-9a-f-]{36})(?:\/|$)/;

/** The institution the address is inside, if any — the header is shared by every page. */
export function institutionIdIn(pathname: string | null): string | undefined {
  return pathname === null ? undefined : INSTITUTION_PATH.exec(pathname)?.[1];
}
