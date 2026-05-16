import { expect, test } from "bun:test";
import { Effect, Either, pipe } from "effect";
import { MainTest, UserInputProvider } from "../wizard/shared";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { BACKGROUND_ASSETS, emitBackgrounds } from "./emit-backgrounds";
import { commitTheme } from "./emit-theme-dir";

test("should emit backgrounds", () =>
  Effect.runPromise(
    pipe(
      Effect.gen(function* () {
        yield* emitBackgrounds;
        yield* commitTheme;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const userInput = yield* yield* UserInputProvider;

        for (const asset of BACKGROUND_ASSETS) {
          const exists = yield* Effect.either(
            fs.exists(
              path.resolve(
                userInput.themeDirectoryPath,
                userInput.slug,
                "backgrounds",
                path.basename(asset),
              ),
            ),
          );

          expect(Either.isRight(exists) && exists.right).toBe(true);
        }
      }),
      Effect.scoped,
      Effect.provide(MainTest),
      Effect.provide(BunContext.layer),
    ),
  ));
