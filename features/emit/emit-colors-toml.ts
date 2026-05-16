import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { mapColorsToToml } from "../map/map";
import { recordToLines } from "./shared";
import { Output } from "../wizard/shared";

export const emitColorsToml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const colorsToml = yield* mapColorsToToml;
  const { stagingDirectory } = yield* Output;
  const resolvedPath = path.resolve(stagingDirectory, "colors.toml");
  const lines = yield* recordToLines(colorsToml, (key, value) => `${key} = "${value}"`);

  yield* Effect.log(`Emitting colors.toml to staging at ${resolvedPath}`);
  yield* fs.writeFileString(resolvedPath, lines.join("\n"));
});
