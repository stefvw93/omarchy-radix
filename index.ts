import { Effect, pipe } from "effect";
import { BunRuntime, BunContext } from "@effect/platform-bun";
import { LifeCycle, LifeCycleLive } from "./features/wizard/shared";
import { MainTUILive, Omarchy, OmarchyLive } from "./features/app/shared";
import { emitColorsToml } from "./features/emit/emit-colors-toml";
import { emitBackgrounds } from "./features/emit/emit-backgrounds";
import { commitTheme, prepareTarget } from "./features/emit/emit-theme-dir";
import { emitWalker } from "./features/emit/emit-walker";

const main = pipe(
  Effect.gen(function* () {
    const { version: omarchyVersion } = yield* Omarchy;

    yield* Effect.log(`Running in ${process.env.NODE_ENV} mode`);
    yield* Effect.log(`Using Omarchy v${omarchyVersion}`);

    const { onStart, onComplete } = yield* LifeCycle;
    const emitTheme = Effect.all([emitColorsToml, emitBackgrounds, emitWalker], {
      concurrency: "unbounded",
    });

    yield* pipe(
      onStart,
      Effect.andThen(prepareTarget),
      Effect.andThen(emitTheme),
      Effect.andThen(commitTheme),
      Effect.andThen(onComplete),
      Effect.provide(MainTUILive),
    );

    process.exit(0);
  }),
  Effect.scoped,
  Effect.provide(OmarchyLive),
  Effect.provide(LifeCycleLive),
  Effect.provide(BunContext.layer),
);

BunRuntime.runMain(main);
