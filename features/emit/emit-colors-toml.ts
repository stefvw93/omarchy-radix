import { Effect } from "effect";
import { UserInputProvider } from "../wizard/shared";
import { mapColorsToToml } from "../map/map";

export const emitColorsToml = Effect.gen(function* () {
  const userInput = yield* UserInputProvider;
  const colorsToml = yield* mapColorsToToml;
});
