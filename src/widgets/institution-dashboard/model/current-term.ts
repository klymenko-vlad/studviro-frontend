interface Dated {
  startsAt: string;
  endsAt: string;
}

/**
 * The term running now, or failing that the next to start. A term that has
 * ended is history and is never the answer, whatever order the list is in.
 */
export function currentOrNextTerm<T extends Dated>(
  terms: readonly T[],
  now: Date,
): T | null {
  const time = now.getTime();
  const running = terms.find(
    term =>
      new Date(term.startsAt).getTime() <= time && time < new Date(term.endsAt).getTime(),
  );

  if (running !== undefined) return running;

  const upcoming = terms
    .filter(term => new Date(term.startsAt).getTime() > time)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return upcoming[0] ?? null;
}

/** The term to start after `term`, if one is on the books. */
export function termAfter<T extends Dated>(terms: readonly T[], term: T): T | null {
  const ends = new Date(term.endsAt).getTime();

  return (
    terms
      .filter(other => other !== term && new Date(other.startsAt).getTime() >= ends)
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0] ?? null
  );
}

/** How far through a term `now` is, 0–100. */
export function termProgress(term: Dated, now: Date): number {
  const starts = new Date(term.startsAt).getTime();
  const ends = new Date(term.endsAt).getTime();
  const share = (now.getTime() - starts) / (ends - starts);

  return Math.round(Math.min(1, Math.max(0, share)) * 100);
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** The teaching week `now` falls in, counted from one, and how many there are. */
export function termWeek(term: Dated, now: Date): { week: number; weeks: number } {
  const starts = new Date(term.startsAt).getTime();
  const weeks = Math.max(1, Math.ceil((new Date(term.endsAt).getTime() - starts) / WEEK));
  const week = Math.min(
    weeks,
    Math.max(1, Math.floor((now.getTime() - starts) / WEEK) + 1),
  );

  return { week, weeks };
}
