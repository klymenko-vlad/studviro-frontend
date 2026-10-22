export interface Dated {
  id: string;
  at: string;
}

/** The soonest item still ahead of `now`, or null when everything is past. */
export function soonest<T extends Dated>(items: T[], now: Date): T | null {
  return (
    items
      .filter(item => new Date(item.at).getTime() > now.getTime())
      .sort((left, right) => left.at.localeCompare(right.at))[0] ?? null
  );
}
