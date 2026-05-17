import { Context, Effect, Layer, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import * as RadixColors from "@radix-ui/colors";
import { RadixColorScale, NormalizedColorScaleFromRadixColorScale } from "../map/shared";
import { run } from "./run";
import { FileSystem, Path } from "@effect/platform";
import pkg from "../../package.json";
import { cancel, intro, outro } from "@clack/prompts";

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
    onStart: Effect.Effect<void>;
    onCancel: Effect.Effect<void>;
    onComplete: Effect.Effect<void>;
  }
>() {}

export const LifeCycleLive = Layer.effect(
  LifeCycle,
  Effect.succeed({
    onStart: Effect.sync(() => {
      intro(
        `All colors are generated from Radix Colors.\nSee https://www.radix-ui.com/colors for accurate color previews.`,
      );
    }),
    onComplete: Effect.sync(() => {
      outro(`You're all set! Your theme has been generated based on your selections.`);
    }),
    onCancel: Effect.sync(() => {
      cancel("Operation cancelled.");
      process.exit(0);
    }),
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

export const UserInputLive = Layer.effect(UserInputProvider, run);

export const UserInputTest = Layer.scoped(
  UserInputProvider,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const tempDir = yield* fs.makeTempDirectoryScoped({
      prefix: "omarchy-radix-test-",
    });

    const mockInput = yield* Schema.decodeUnknown(UserInput)({
      slug: "my-theme",
      mode: "dark",
      basePalette: "slate",
      accent: "indigo",
      tone: "balanced",
      components: [],
      themeDirectoryPath: tempDir,
    });

    yield* Effect.log(`Created mock user input with temporary directory at ${tempDir}`);
    return mockInput;
  }),
);

export class Output extends Context.Tag(`${pkg.name}/features/wizard/Output`)<
  Output,
  {
    readonly themeDirectory: string;
    readonly stagingDirectory: string;
  }
>() {}

export const OutputLive = Layer.scoped(
  Output,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const userInput = yield* UserInputProvider;
    const stagingDirectory = yield* fs.makeTempDirectoryScoped({
      prefix: `${userInput.slug}-`,
    });

    const themeDirectory = path.resolve(userInput.themeDirectoryPath, userInput.slug);

    return { stagingDirectory, themeDirectory };
  }),
);

export class ColorScalesProvider extends Context.Tag(
  `${pkg.name}/features/colors/ColorScalesProvider`,
)<
  ColorScalesProvider,
  {
    readonly base: typeof NormalizedColorScaleFromRadixColorScale.Type;
    readonly accent: typeof NormalizedColorScaleFromRadixColorScale.Type;
  }
>() {}

export const ColorScalesLive = Layer.effect(
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
