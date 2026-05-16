import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { resolveThemeOutputDirectory } from "./shared";
import { LifeCycle, OverwriteConfirm } from "../wizard/shared";

export const emitThemeDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const { onCancel } = yield* LifeCycle;
  const confirmOverwrite = yield* OverwriteConfirm;
  const themeOutputDir = yield* resolveThemeOutputDirectory;

  if (yield* fs.exists(themeOutputDir)) {
    const overwritePermission = yield* confirmOverwrite(themeOutputDir);

    if (!overwritePermission) {
      return yield* Effect.zipRight(onCancel, Effect.interrupt);
    }

    yield* fs.remove(themeOutputDir, { recursive: true });
  }

  yield* fs.makeDirectory(themeOutputDir, { recursive: true });
});
