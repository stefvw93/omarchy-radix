import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { recordToLines } from "./shared";
import { Output } from "../wizard/shared";

const FILE_NAME = "waybar.css";

export const emitWalker = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stagingDirectory } = yield* Output;
  const resolvedPath = path.resolve(stagingDirectory, FILE_NAME);
  const lines = yield* recordToLines(
    {
      key: "#ff0000",
    },
    (key, value) => `@define-color ${key} ${value};`,
  );

  yield* Effect.log(`Emitting ${FILE_NAME} to staging at ${resolvedPath}`);
  yield* fs.writeFileString(resolvedPath, lines.join("\n"));
});
