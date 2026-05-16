import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { LifeCycle, Output, OverwritePermission } from "../wizard/shared";

export const prepareTarget = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const { onCancel } = yield* LifeCycle;
  const { themeDirectory } = yield* Output;

  if (yield* fs.exists(themeDirectory)) {
    const overwritePermission = yield* OverwritePermission;

    if (!overwritePermission) {
      return yield* Effect.zipRight(onCancel, Effect.interrupt);
    }
  }
});

export const commitTheme = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stagingDirectory, themeDirectory } = yield* Output;

  if (yield* fs.exists(themeDirectory)) {
    yield* fs.remove(themeDirectory, { recursive: true });
  }

  yield* Effect.log(`Committing theme from ${stagingDirectory} to ${themeDirectory}`);

  yield* fs.makeDirectory(path.dirname(themeDirectory), { recursive: true });
  yield* fs.copy(stagingDirectory, themeDirectory);
});
