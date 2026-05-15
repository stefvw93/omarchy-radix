import { test } from "bun:test";
import { emitColorsToml } from "./emit-colors-toml";
import { Effect } from "effect";
import { MainTest } from "../wizard/shared";

test("should emit colors in toml format", () => {
  const program = Effect.provide(emitColorsToml, MainTest);
  return Effect.runPromise(program);
});
