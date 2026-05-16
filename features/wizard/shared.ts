import { Context, Effect, Layer, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import * as RadixColors from "@radix-ui/colors";
import { RadixColorScale, NormalizedColorScaleFromRadixColorScale } from "../map/shared";
import { run } from "./run";
import { FileSystem } from "@effect/platform";
import pkg from "../../package.json";
import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";

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

export class OverwriteConfirm extends Context.Tag(`${pkg.name}/features/wizard/OverwriteConfirm`)<
  OverwriteConfirm,
  (themeOutputDir: string) => Effect.Effect<boolean>
>() {}

export const OverwriteConfirmLive = Layer.effect(
  OverwriteConfirm,
  Effect.gen(function* () {
    const { onCancel } = yield* LifeCycle;
    return (themeOutputDir: string) =>
      Effect.async<boolean>((resume) => {
        confirm({
          message: `The directory ${themeOutputDir} already exists. Do you want to overwrite it?`,
          initialValue: false,
        }).then((value) => {
          if (isCancel(value)) {
            return resume(Effect.zipRight(onCancel, Effect.interrupt));
          }
          resume(Effect.succeed(value));
        });
      });
  }),
);

export const makeOverwriteConfirmTest = (answer: boolean) =>
  Layer.succeed(OverwriteConfirm, () => Effect.succeed(answer));

export const UserInput = Schema.Struct({
  slug: IdentitySlug,
  mode: Mode,
  basePalette: BasePalette,
  accent: Accent,
  tone: Tone,
  components: Components,
  themeDirectoryPath: ThemeDirectoryPath,
});

const buildCached = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const cached = yield* Effect.cached(self);
    const ctx = yield* Effect.context<R>();
    return cached.pipe(Effect.provide(ctx));
  });

const userInputLiveCached = buildCached(run);

export class UserInputProvider extends Context.Tag(`${pkg.name}/features/wizard/UserInputProvider`)<
  UserInputProvider,
  Effect.Effect.Success<typeof userInputLiveCached>
>() {}

export const UserInputLive = Layer.effect(UserInputProvider, userInputLiveCached);

const UserInputTest = Layer.scoped(
  UserInputProvider,
  buildCached(
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
  ),
);

export class ColorScalesProvider extends Context.Tag(
  `${pkg.name}/features/colors/ColorScalesProvider`,
)<ColorScalesProvider, Effect.Effect.Success<typeof colorScalesCached>>() {}

const computeColorScales = Effect.gen(function* () {
  const { basePalette, accent, mode } = yield* yield* UserInputProvider;

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
});

const colorScalesCached = buildCached(computeColorScales);

const ColorScalesLive = Layer.effect(ColorScalesProvider, colorScalesCached);

const ColorInputLive = Layer.merge(ColorScalesLive, UserInputLive);
const ColorInputTest = Layer.merge(ColorScalesLive, UserInputTest);

export const MainLive = ColorScalesLive.pipe(
  Layer.provide(ColorInputLive),
  Layer.provideMerge(UserInputLive),
  Layer.provideMerge(OverwriteConfirmLive),
  Layer.provideMerge(LifeCycleLive),
);

export const MainTest = ColorScalesLive.pipe(
  Layer.provide(ColorInputTest),
  Layer.provideMerge(UserInputTest),
);
