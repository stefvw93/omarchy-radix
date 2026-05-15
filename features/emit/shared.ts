import { Effect } from "effect";

export const recordToLines = <T extends Record<string, unknown>>(
  record: T,
  lineFn: (key: keyof T, value: T[keyof T]) => string,
): Effect.Effect<string[]> =>
  Effect.sync(() => Object.entries(record).map(([key, value]) => lineFn(key, value as T[keyof T])));
