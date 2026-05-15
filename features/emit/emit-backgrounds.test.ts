import { expect, test } from "bun:test";
import { Effect, Either, pipe } from "effect";
import { MainTest, UserInputProvider } from "../wizard/shared";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { BACKGROUND_ASSETS, emitBackgrounds } from "./emit-backgrounds";

test("should emit backgrounds", () =>
  Effect.runPromise(
    pipe(
      emitBackgrounds,
      Effect.andThen(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;
          const userInput = yield* UserInputProvider;

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
      ),
      Effect.provide(MainTest),
      Effect.provide(BunContext.layer),
    ),
  ));
