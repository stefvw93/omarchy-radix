import { Effect, pipe } from "effect";
import { BunRuntime, BunContext } from "@effect/platform-bun";
import { LifeCycle, MainLive } from "./features/wizard/shared";
import { emitColorsToml } from "./features/emit/emit-colors-toml";
import { emitBackgrounds } from "./features/emit/emit-backgrounds";
import { commitTheme, prepareTarget } from "./features/emit/emit-theme-dir";

const main = pipe(
  Effect.gen(function* () {
    if (process.env.NODE_ENV === "test") {
      yield* Effect.log("Running in test mode");
    }

    if (process.env.NODE_ENV === "development") {
      yield* Effect.log("Running in development mode");
    }

    const { onStart, onComplete } = yield* LifeCycle;

    yield* onStart;

    yield* prepareTarget;
    yield* emitColorsToml;
    yield* emitBackgrounds;
    yield* commitTheme;

    yield* onComplete;
  }),
  Effect.scoped,
  Effect.provide(MainLive),
  Effect.provide(BunContext.layer),
);

BunRuntime.runMain(main);
