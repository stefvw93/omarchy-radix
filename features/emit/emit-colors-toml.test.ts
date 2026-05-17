import { expect, test } from "bun:test";
import { emitColorsToml } from "./emit-colors-toml";
import { Effect, Either, pipe } from "effect";
import { UserInputProvider } from "../wizard/shared";
import { MainTUITest } from "../app/shared";
import { BunContext } from "@effect/platform-bun";
import { FileSystem, Path } from "@effect/platform";
import { commitTheme } from "./emit-theme-dir";

test("should emit colors in toml format", () =>
  Effect.runPromise(
    pipe(
      Effect.gen(function* () {
        yield* emitColorsToml;
        yield* commitTheme;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const userInput = yield* UserInputProvider;
        const exists = yield* Effect.either(
          fs.exists(path.resolve(userInput.themeDirectoryPath, userInput.slug, "colors.toml")),
        );

        expect(Either.isRight(exists) && exists.right).toBe(true);
      }),
      Effect.scoped,
      Effect.provide(MainTUITest),
      Effect.provide(BunContext.layer),
    ),
  ));
