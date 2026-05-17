import { OverwritePermissionLive } from "../emit/shared";
import { ColorScalesLive, OutputLive, UserInputLive, UserInputTest } from "../wizard/shared";
import { Config, Context, Effect, Layer } from "effect";
import pkg from "../../package.json";
import { FileSystem, Path } from "@effect/platform";

export class Omarchy extends Context.Tag(`${pkg.name}/features/app/Omarchy`)<
  Omarchy,
  {
    readonly version: string;
    readonly omarchyDirectory: string;
    readonly homeDirectory: string;
  }
>() {}

export const OmarchyLive = Layer.effect(
  Omarchy,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const homeDirectory = yield* Config.string("HOME");
    const omarchyDirectory = yield* Config.string("OMARCHY_PATH");
    const version = yield* fs.readFileString(path.resolve(omarchyDirectory, "version"));

    return {
      omarchyDirectory,
      homeDirectory,
      version,
    };
  }),
);

export const MainTUILive = ColorScalesLive.pipe(
  Layer.provideMerge(OverwritePermissionLive),
  Layer.provideMerge(OutputLive),
  Layer.provideMerge(ColorScalesLive),
  Layer.provideMerge(UserInputLive),
);

export const MainTUITest = ColorScalesLive.pipe(
  Layer.provideMerge(OutputLive),
  Layer.provideMerge(ColorScalesLive),
  Layer.provideMerge(UserInputTest),
);
