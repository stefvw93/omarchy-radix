import { Effect, pipe } from "effect";
import { BunRuntime, BunContext } from "@effect/platform-bun";
import { MainLive, UserInputProvider } from "./features/wizard/shared";
import { emitColorsToml } from "./features/emit/emit-colors-toml";
import { emitBackgrounds } from "./features/emit/emit-backgrounds";

const main = pipe(
  Effect.gen(function* () {
    const userInput = yield* UserInputProvider;

    yield* Effect.log(`User input: ${JSON.stringify(userInput, null, 2)}`);

    yield* emitColorsToml;
    yield* emitBackgrounds;
  }),
  Effect.provide(MainLive),
  Effect.provide(BunContext.layer),
);

BunRuntime.runMain(main);
