import { expect, test } from "bun:test";
import { emitColorsToml } from "./emit-colors-toml";
import { Effect, Either, pipe } from "effect";
import { MainTest, UserInputProvider } from "../wizard/shared";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";

test("should emit colors in toml format", () =>
  Effect.runPromise(
    pipe(
      emitColorsToml,
      Effect.andThen(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;
          const userInput = yield* yield* UserInputProvider;
          const exists = yield* Effect.either(
            fs.exists(path.resolve(userInput.themeDirectoryPath, userInput.slug, "colors.toml")),
          );

          expect(Either.isRight(exists) && exists.right).toBe(true);
        }),
      ),
      Effect.provide(MainTest),
      Effect.provide(BunContext.layer),
    ),
  ));
