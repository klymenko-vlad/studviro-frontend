const WARNINGS = [600, 300, 60, 30] as const;

export function clockParts(total: number) {
  const whole = Math.max(0, Math.floor(total));

  return {
    hours: Math.floor(whole / 3600),
    minutes: Math.floor((whole % 3600) / 60),
    seconds: whole % 60,
  };
}

export function crossedWarning(previous: number | null, current: number): number | null {
  if (previous === null) return null;

  return WARNINGS.find(mark => previous > mark && current <= mark) ?? null;
}
