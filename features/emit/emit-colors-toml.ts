import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { mapColorsToToml } from "../map/map";
import { recordToLines, resolveStagingDirectory } from "./shared";

export const emitColorsToml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const colorsToml = yield* mapColorsToToml;
  const stagingDir = yield* resolveStagingDirectory;
  const resolvedPath = path.resolve(stagingDir, "colors.toml");
  const lines = yield* recordToLines(colorsToml, (key, value) => `${key} = "${value}"`);

  yield* Effect.log(`Emitting colors.toml to staging at ${resolvedPath}`);
  yield* fs.writeFileString(resolvedPath, lines.join("\n"));
});
