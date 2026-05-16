import { Effect, pipe } from "effect";
import { BunRuntime, BunContext } from "@effect/platform-bun";
import { LifeCycle, LifeCycleLive, MainLive } from "./features/wizard/shared";
import { emitColorsToml } from "./features/emit/emit-colors-toml";
import { emitBackgrounds } from "./features/emit/emit-backgrounds";
import { commitTheme, prepareTarget } from "./features/emit/emit-theme-dir";
import { FileSystem } from "@effect/platform";

const main = pipe(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const omarchyVersion = yield* fs.readFileString(`${process.env.OMARCHY_PATH}/version`);

    if (process.env.NODE_ENV === "test") {
      yield* Effect.log("Running in test mode");
    }

    if (process.env.NODE_ENV === "development") {
      yield* Effect.log("Running in development mode");
      yield* Effect.log(`Using Omarchy v${omarchyVersion}`);
    }

    const { onStart, onComplete } = yield* LifeCycle;

    yield* onStart;

    yield* Effect.all([prepareTarget, emitColorsToml, emitBackgrounds, commitTheme]).pipe(
      Effect.provide(MainLive),
    );

    yield* onComplete;
  }),
  Effect.scoped,
  Effect.provide(LifeCycleLive),
  Effect.provide(BunContext.layer),
);

BunRuntime.runMain(main);
