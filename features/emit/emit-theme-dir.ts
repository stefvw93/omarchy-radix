import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { resolveStagingDirectory, resolveThemeOutputDirectory } from "./shared";
import { LifeCycle, OverwriteConfirm } from "../wizard/shared";

export const prepareTarget = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const { onCancel } = yield* LifeCycle;
  const confirmOverwrite = yield* OverwriteConfirm;
  const themeOutputDir = yield* resolveThemeOutputDirectory;

  if (yield* fs.exists(themeOutputDir)) {
    const overwritePermission = yield* confirmOverwrite(themeOutputDir);

    if (!overwritePermission) {
      return yield* Effect.zipRight(onCancel, Effect.interrupt);
    }
  }
});

export const commitTheme = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const themeOutputDir = yield* resolveThemeOutputDirectory;
  const stagingDir = yield* resolveStagingDirectory;

  if (yield* fs.exists(themeOutputDir)) {
    yield* fs.remove(themeOutputDir, { recursive: true });
  }
  yield* fs.makeDirectory(path.dirname(themeOutputDir), { recursive: true });

  yield* Effect.log(`Committing theme from ${stagingDir} to ${themeOutputDir}`);
  yield* fs.copy(stagingDir, themeOutputDir);
});
