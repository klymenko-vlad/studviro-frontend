import type { RoomResponseDto } from '@/shared/api';

export type Room = RoomResponseDto;

/** Rooms read best grouped by building; the ones with none go last, together. */
export function byBuilding(rooms: readonly Room[]): [string | null, Room[]][] {
  const grouped = new Map<string | null, Room[]>();

  for (const room of rooms) {
    const key = room.building ?? null;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(room);
    else grouped.set(key, [room]);
  }

  return [...grouped.entries()].sort(([a], [b]) => {
    if (a === null) return 1;
    if (b === null) return -1;

    return a.localeCompare(b);
  });
}
