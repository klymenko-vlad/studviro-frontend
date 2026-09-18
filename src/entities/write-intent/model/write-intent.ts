import type { WriteIntentResponseDto } from '@/shared/api';

export type WriteIntent = WriteIntentResponseDto;
export type WriteIntentState = WriteIntent['state'];
export type WriteIntentKind = WriteIntent['kind'];

const LIVE_STATES: WriteIntentState[] = ['pending', 'in_flight'];

/** Still on its way. Nothing is wrong with it yet. */
export function isInFlight(intent: WriteIntent): boolean {
  return LIVE_STATES.includes(intent.state);
}

/** Stopped without landing: a human has to retry it or give up on it. */
export function isStuck(intent: WriteIntent): boolean {
  return intent.state === 'rejected' || intent.state === 'abandoned';
}

export function stuckIntents(intents: WriteIntent[]): WriteIntent[] {
  return intents.filter(isStuck);
}

export function writeIntentBadgeVariant(
  state: WriteIntentState,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'acknowledged') return 'default';
  if (state === 'rejected' || state === 'abandoned') return 'destructive';

  return 'secondary';
}
