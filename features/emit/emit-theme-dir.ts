import { Effect, Either } from "effect";
import { FileSystem } from "@effect/platform";
import { resolveThemeOutputDirectory } from "./shared";
import * as p from "@clack/prompts";
import { LifeCycle } from "../wizard/shared";

export const emitThemeDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const { onCancel } = yield* LifeCycle;
  const themeOutputDir = yield* resolveThemeOutputDirectory;

  const exists = yield* fs.exists(themeOutputDir);

  if (exists) {
    const overwritePermission = yield* Effect.async<boolean>((resume) => {
      p.confirm({
        message: `The directory ${themeOutputDir} already exists. Do you want to overwrite it?`,
        initialValue: false,
      }).then((value) => {
        if (p.isCancel(value)) {
          return resume(Effect.zipRight(onCancel, Effect.interrupt));
        }

        resume(Effect.succeed(value));
      });
    });

    if (!overwritePermission) {
      return yield* Effect.zipRight(onCancel, Effect.interrupt);
    }
  }

  yield* fs.makeDirectory(themeOutputDir, { recursive: true });
});
