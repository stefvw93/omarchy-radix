import { expect, test } from "bun:test";
import { Effect, Exit, Layer, pipe } from "effect";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { LifeCycle, Output } from "../wizard/shared";
import { MainTUITest } from "../app/shared";
import { commitTheme, prepareTarget } from "./emit-theme-dir";
import { OverwritePermission } from "./shared";

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
      Effect.provide(LifeCycleSilent),
      Effect.provide(MainTUITest),
      Effect.provide(BunContext.layer),
    ) as Effect.Effect<A, E, never>,
  );

test("prepareTarget is a no-op when the target does not exist", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const { themeDirectory } = yield* Output;
      yield* prepareTarget;
      expect(yield* fs.exists(themeDirectory)).toBe(false);
    }),
  ));

test("commitTheme moves the staging dir to the final target", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const { themeDirectory, stagingDirectory } = yield* Output;

      yield* fs.writeFileString(path.join(stagingDirectory, "marker.txt"), "hello");
      yield* commitTheme;

      expect(yield* fs.exists(themeDirectory)).toBe(true);
      expect(yield* fs.readFileString(path.join(themeDirectory, "marker.txt"))).toBe("hello");
    }),
  ));

test("commitTheme replaces an existing target directory", () =>
  runWith(
    true,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const { themeDirectory, stagingDirectory } = yield* Output;

      yield* fs.makeDirectory(themeDirectory, { recursive: true });
      yield* fs.writeFileString(path.join(themeDirectory, "stale.txt"), "stale");
      yield* fs.writeFileString(path.join(stagingDirectory, "fresh.txt"), "fresh");

      yield* prepareTarget.pipe(
        Effect.provide(Layer.succeed(OverwritePermission, () => Effect.succeed(true))),
      );
      yield* commitTheme;

      expect(yield* fs.exists(path.join(themeDirectory, "stale.txt"))).toBe(false);
      expect(yield* fs.readFileString(path.join(themeDirectory, "fresh.txt"))).toBe("fresh");
    }),
  ));

test("prepareTarget interrupts and leaves the target intact when overwrite is declined", () =>
  runWith(
    false,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const { themeDirectory } = yield* Output;
      yield* fs.makeDirectory(themeDirectory, { recursive: true });
      const stale = path.join(themeDirectory, "stale.txt");
      yield* fs.writeFileString(stale, "stale");

      const exit = yield* Effect.exit(
        prepareTarget.pipe(
          Effect.provide(Layer.succeed(OverwritePermission, () => Effect.succeed(false))),
        ),
      );
      expect(Exit.isInterrupted(exit)).toBe(true);
      expect(yield* fs.exists(stale)).toBe(true);
    }),
  ));
