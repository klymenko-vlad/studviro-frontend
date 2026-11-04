export function swapPositions(
  mine: number,
  theirs: number,
  theyAreAbove: boolean,
): [mine: number, theirs: number] {
  if (mine !== theirs) return [theirs, mine];

  return theyAreAbove ? [mine, mine + 1] : [mine + 1, mine];
}
