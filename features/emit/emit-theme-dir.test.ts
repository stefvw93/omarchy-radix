import { expect, test } from "bun:test";
import { Effect, Exit, Layer, pipe } from "effect";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { LifeCycle, MainTest, makeOverwriteConfirmTest } from "../wizard/shared";
import { emitThemeDir } from "./emit-theme-dir";
import { resolveThemeOutputDirectory } from "./shared";

const LifeCycleSilent = Layer.succeed(LifeCycle, {
  onStart: Effect.void,
  onComplete: Effect.void,
  onCancel: Effect.void,
});

const runWith = <A, E, R>(answer: boolean, self: Effect.Effect<A, E, R>) =>
  Effect.runPromise(
    pipe(
      self,
      Effect.provide(makeOverwriteConfirmTest(answer)),
      Effect.provide(LifeCycleSilent),
      Effect.provide(MainTest),
      Effect.provide(BunContext.layer),
    ) as Effect.Effect<A, E, never>,
  );

test("creates the theme directory when it does not exist", () =>
  runWith(
    false,
    Effect.gen(function* () {
      yield* emitThemeDir;
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* resolveThemeOutputDirectory;
      expect(yield* fs.exists(dir)).toBe(true);
      expect(yield* fs.readDirectory(dir)).toEqual([]);
    }),
  ));

test("empties the directory when overwrite is confirmed", () =>
  runWith(
    true,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const dir = yield* resolveThemeOutputDirectory;
      yield* fs.makeDirectory(dir, { recursive: true });
      const stale = path.join(dir, "stale.txt");
      yield* fs.writeFileString(stale, "stale");

      yield* emitThemeDir;

      expect(yield* fs.exists(dir)).toBe(true);
      expect(yield* fs.exists(stale)).toBe(false);
      expect(yield* fs.readDirectory(dir)).toEqual([]);
    }),
  ));

test("interrupts and leaves the directory intact when overwrite is declined", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const dir = yield* resolveThemeOutputDirectory;
      yield* fs.makeDirectory(dir, { recursive: true });
      const stale = path.join(dir, "stale.txt");
      yield* fs.writeFileString(stale, "stale");

      const exit = yield* Effect.exit(emitThemeDir);
      expect(Exit.isInterrupted(exit)).toBe(true);
      expect(yield* fs.exists(stale)).toBe(true);
    }),
  ));
