import { Path } from "@effect/platform";
import { Effect } from "effect";
import { UserInputProvider } from "../wizard/shared";

export const recordToLines = <T extends Record<string, unknown>>(
  record: T,
  lineFn: (key: keyof T, value: T[keyof T]) => string,
): Effect.Effect<string[]> =>
  Effect.sync(() => Object.entries(record).map(([key, value]) => lineFn(key, value as T[keyof T])));

export const resolveThemeOutputDirectory = Effect.gen(function* () {
  const path = yield* Path.Path;
  const userInput = yield* yield* UserInputProvider;
  const resolvedDir = path.resolve(userInput.themeDirectoryPath, userInput.slug);
  return resolvedDir;
});
