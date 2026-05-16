import { Context, Effect, Layer, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import * as RadixColors from "@radix-ui/colors";
import {
  ColorScalesProvider,
  RadixColorScale,
  NormalizedColorScaleFromRadixColorScale,
} from "../map/shared";
import { run } from "./run";
import { FileSystem } from "@effect/platform";
import pkg from "../../package.json";
import { cancel } from "@clack/prompts";

// TODO: support all of these
export const SUPPORTED_COMPONENTS = [
  // "waybar",
  "walker",
  // "hyprland",
  // "hyprlock",
  // "swayosd",
  // "mako",
] as const;

export const Mode = Schema.Literal("dark", "light");
export const BasePalette = Schema.Literal(...grayScaleNames);
export const Accent = Schema.Literal(...scaleNames);
export const Tone = Schema.Literal("calm", "balanced", "high-contrast");
export const Components = Schema.Array(Schema.Literal(...SUPPORTED_COMPONENTS));
export const IdentityName = Schema.String.pipe(Schema.nonEmptyString());
export const IdentitySlug = Schema.String.pipe(Schema.nonEmptyString());
export const ThemeDirectoryPath = Schema.String.pipe(Schema.nonEmptyString());

export class LifeCycle extends Context.Tag(`${pkg.name}/features/wizard/LifeCycle`)<
  LifeCycle,
  {
    onCancel: Effect.Effect<void>;
  }
>() {}

export const LifeCycleLive = Layer.effect(
  LifeCycle,
  Effect.succeed({
    onCancel: Effect.sync(() => {
      cancel("Operation cancelled.");
      process.exit(0);
    }),
  }),
);

export const LifeCycleTest = Layer.effect(
  LifeCycle,
  Effect.succeed({
    onCancel: Effect.void,
  }),
);

export const UserInput = Schema.Struct({
  slug: IdentitySlug,
  mode: Mode,
  basePalette: BasePalette,
  accent: Accent,
  tone: Tone,
  components: Components,
  themeDirectoryPath: ThemeDirectoryPath,
});

export class UserInputProvider extends Context.Tag(`${pkg.name}/features/wizard/UserInputProvider`)<
  UserInputProvider,
  typeof UserInput.Type
>() {}

export const UserInputLive = Layer.effect(
  UserInputProvider,
  Effect.gen(function* () {
    return yield* run;
  }),
);

const UserInputTest = Layer.scoped(
  UserInputProvider,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const tempDir = yield* fs.makeTempDirectoryScoped({
      prefix: "omarchy-radix-test-",
    });

    const mockInput = {
      name: "My Theme",
      slug: "my-theme",
      mode: "dark",
      basePalette: "slate",
      accent: "indigo",
      tone: "balanced",
      components: [],
      themeDirectoryPath: tempDir,
    } as const;

    yield* Effect.log(`Created mock user input with temporary directory at ${tempDir}`);
    return mockInput;
  }),
);

const ColorScalesLive = Layer.effect(
  ColorScalesProvider,
  Effect.gen(function* () {
    const { basePalette, accent, mode } = yield* UserInputProvider;

    const parseColorScale = Schema.encodeUnknown(RadixColorScale);
    const toNormalized = Schema.decode(NormalizedColorScaleFromRadixColorScale);
    const getRadixKey = (palette: string) =>
      `${palette}${mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;

    const baseRadixColorScale = yield* parseColorScale(RadixColors[getRadixKey(basePalette)]);
    const normalizedBasePaletteColorScale = yield* toNormalized(baseRadixColorScale);
    const accentRadixColorScale = yield* parseColorScale(RadixColors[getRadixKey(accent)]);
    const normalizedAccentColorScale = yield* toNormalized(accentRadixColorScale);

    return {
      base: normalizedBasePaletteColorScale,
      accent: normalizedAccentColorScale,
    };
  }),
);

const ColorInputLive = Layer.merge(ColorScalesLive, UserInputLive);
const ColorInputTest = Layer.merge(ColorScalesLive, UserInputTest);

export const MainLive = ColorScalesLive.pipe(
  Layer.provide(ColorInputLive),
  Layer.provideMerge(UserInputLive),
  Layer.provide(LifeCycleLive),
);

export const MainTest = ColorScalesLive.pipe(
  Layer.provide(ColorInputTest),
  Layer.provideMerge(UserInputTest),
);
