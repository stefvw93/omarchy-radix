import { test } from "bun:test";
import { emitColorsToml } from "./emit-colors-toml";
import { Effect, pipe } from "effect";
import { MainTest } from "../wizard/shared";
import { BunContext } from "@effect/platform-bun";

test("should emit colors in toml format", () =>
  Effect.runPromise(
    pipe(emitColorsToml, Effect.provide(MainTest), Effect.provide(BunContext.layer)),
  ));
