import { Data, Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { UserInputProvider } from "../wizard/shared";
import { mapColorsToToml } from "../map/map";
import { recordToLines } from "./shared";

export class FileAlreadyExistsError extends Data.TaggedError("FileAlreadyExistsError") {
  constructor(public file: string) {
    super();
    this.message = `${file} already exists!`;
  }
}

export const emitColorsToml = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const userInput = yield* UserInputProvider;
  const colorsToml = yield* mapColorsToToml;
  const resolvedDir = path.resolve(userInput.themeDirectoryPath);
  const resolvedPath = path.resolve(resolvedDir, "colors.toml");
  const fileExists = yield* fs.exists(resolvedPath);

  if (fileExists) {
    yield* fs.makeDirectory(resolvedDir, { recursive: true });
    return yield* Effect.fail(new FileAlreadyExistsError(resolvedPath));
  }

  const lines = yield* recordToLines(colorsToml, (key, value) => `${key} = "${value}"`);

  yield* Effect.log(`Emitting colors.toml to ${resolvedPath}`);
  yield* fs.makeDirectory(resolvedDir, { recursive: true });
  yield* fs.writeFileString(resolvedPath, lines.join("\n"));
});
