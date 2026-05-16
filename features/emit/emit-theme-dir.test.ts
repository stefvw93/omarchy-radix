import { expect, test } from "bun:test";
import { Effect, Exit, Layer, pipe } from "effect";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { LifeCycle, MainTest, makeOverwriteConfirmTest } from "../wizard/shared";
import { commitTheme, prepareTarget } from "./emit-theme-dir";
import { resolveStagingDirectory, resolveThemeOutputDirectory } from "./shared";

const LifeCycleSilent = Layer.succeed(LifeCycle, {
  onStart: Effect.void,
  onComplete: Effect.void,
  onCancel: Effect.void,
});

const runWith = <A, E, R>(answer: boolean, self: Effect.Effect<A, E, R>) =>
  Effect.runPromise(
    pipe(
      self,
      Effect.scoped,
      Effect.provide(makeOverwriteConfirmTest(answer)),
      Effect.provide(LifeCycleSilent),
      Effect.provide(MainTest),
      Effect.provide(BunContext.layer),
    ) as Effect.Effect<A, E, never>,
  );

test("prepareTarget is a no-op when the target does not exist", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* resolveThemeOutputDirectory;
      yield* prepareTarget;
      expect(yield* fs.exists(dir)).toBe(false);
    }),
  ));

test("commitTheme moves the staging dir to the final target", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const dir = yield* resolveThemeOutputDirectory;
      const staging = yield* resolveStagingDirectory;

      yield* fs.writeFileString(path.join(staging, "marker.txt"), "hello");
      yield* commitTheme;

      expect(yield* fs.exists(dir)).toBe(true);
      expect(yield* fs.readFileString(path.join(dir, "marker.txt"))).toBe("hello");
    }),
  ));

test("commitTheme replaces an existing target directory", () =>
  runWith(
    true,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const dir = yield* resolveThemeOutputDirectory;
      const staging = yield* resolveStagingDirectory;

      yield* fs.makeDirectory(dir, { recursive: true });
      yield* fs.writeFileString(path.join(dir, "stale.txt"), "stale");
      yield* fs.writeFileString(path.join(staging, "fresh.txt"), "fresh");

      yield* prepareTarget;
      yield* commitTheme;

      expect(yield* fs.exists(path.join(dir, "stale.txt"))).toBe(false);
      expect(yield* fs.readFileString(path.join(dir, "fresh.txt"))).toBe("fresh");
    }),
  ));

test("prepareTarget interrupts and leaves the target intact when overwrite is declined", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const dir = yield* resolveThemeOutputDirectory;
      yield* fs.makeDirectory(dir, { recursive: true });
      const stale = path.join(dir, "stale.txt");
      yield* fs.writeFileString(stale, "stale");

      const exit = yield* Effect.exit(prepareTarget);
      expect(Exit.isInterrupted(exit)).toBe(true);
      expect(yield* fs.exists(stale)).toBe(true);
    }),
  ));
