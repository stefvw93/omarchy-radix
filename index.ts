import { Config, Effect, pipe } from "effect";
import { BunRuntime, BunContext } from "@effect/platform-bun";
import { LifeCycle, LifeCycleLive, MainLive } from "./features/wizard/shared";
import { emitColorsToml } from "./features/emit/emit-colors-toml";
import { emitBackgrounds } from "./features/emit/emit-backgrounds";
import { commitTheme, prepareTarget } from "./features/emit/emit-theme-dir";
import { FileSystem, Path } from "@effect/platform";

const main = pipe(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const omarchyVersion = yield* fs.readFileString(
      path.resolve(yield* Config.string("OMARCHY_PATH"), "version"),
    );

    yield* Effect.log(`Running in ${process.env.NODE_ENV} mode`);
    yield* Effect.log(`Using Omarchy v${omarchyVersion}`);

    const { onStart, onComplete } = yield* LifeCycle;
    const emitTheme = Effect.all([emitColorsToml, emitBackgrounds], { concurrency: "unbounded" });

    yield* pipe(
      onStart,
      Effect.andThen(prepareTarget),
      Effect.andThen(emitTheme),
      Effect.andThen(commitTheme),
      Effect.andThen(onComplete),
      Effect.provide(MainLive),
    );

    process.exit(0);
  }),
  Effect.scoped,
  Effect.provide(LifeCycleLive),
  Effect.provide(BunContext.layer),
);

BunRuntime.runMain(main);
