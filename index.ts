import { Effect } from "effect";
import { run } from "./features/wizard/run";
import { BunRuntime, BunContext } from "@effect/platform-bun";

const main = run.pipe(Effect.provide(BunContext.layer));

BunRuntime.runMain(main);
