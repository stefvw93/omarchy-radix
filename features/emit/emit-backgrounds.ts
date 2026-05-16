import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { resolveStagingDirectory } from "./shared";

export const BACKGROUND_ASSETS: readonly string[] = [
  "assets/backgrounds/liquid-art-paint-7680x4320-25904.jpg",
];

export const emitBackgrounds = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const stagingDir = yield* resolveStagingDirectory;
  const backgroundsDir = path.resolve(stagingDir, "backgrounds");

  yield* Effect.log(`Emitting backgrounds to staging at ${backgroundsDir}`);
  yield* fs.makeDirectory(backgroundsDir, { recursive: true });

  for (const asset of BACKGROUND_ASSETS) {
    const fileName = path.basename(asset);
    const targetPath = path.resolve(backgroundsDir, fileName);
    yield* Effect.log(`Copying background asset from ${asset} to ${targetPath}`);
    yield* fs.copyFile(asset, targetPath);
  }
});
