import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { mapColorsToToml } from "../map/map";
import { recordToLines, resolveThemeOutputDirectory } from "./shared";

export const emitColorsToml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const colorsToml = yield* mapColorsToToml;
  const resolvedDir = yield* resolveThemeOutputDirectory;
  const resolvedPath = path.resolve(resolvedDir, "colors.toml");
  const lines = yield* recordToLines(colorsToml, (key, value) => `${key} = "${value}"`);

  yield* Effect.log(`Emitting colors.toml to ${resolvedPath}`);
  yield* fs.makeDirectory(resolvedDir, { recursive: true });
  yield* fs.writeFileString(resolvedPath, lines.join("\n"));
});
