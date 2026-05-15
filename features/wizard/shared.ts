import { Context, Effect, Layer, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import * as RadixColors from "@radix-ui/colors";
import {
  ColorScalesProvider,
  RadixColorScale,
  NormalizedColorScaleFromRadixColorScale,
} from "../map/shared";
import { run } from "./run";

export const Mode = Schema.Literal("dark", "light");
export const BasePalette = Schema.Literal(...grayScaleNames);
export const Accent = Schema.Literal(...scaleNames);
export const Tone = Schema.Literal("calm", "balanced", "high-contrast");
export const Components = Schema.Array(Schema.Literal("waybar", "walker", "hyprland", "hyprlock"));
export const IdentityName = Schema.String.pipe(Schema.nonEmptyString());
export const IdentitySlug = Schema.String.pipe(Schema.nonEmptyString());

export const UserInput = Schema.Struct({
  name: IdentityName,
  slug: IdentitySlug,
  mode: Mode,
  basePalette: BasePalette,
  accent: Accent,
  tone: Tone,
  components: Components,
});

export class UserInputProvider extends Context.Tag(
  "omarch-radix/features/wizard/UserInputProvider",
)<UserInputProvider, typeof UserInput.Type>() {}
export const UserInputLive = Layer.effect(
  UserInputProvider,
  Effect.gen(function* () {
    return yield* run;
  }),
);

const UserInputTest = Layer.succeed(UserInputProvider, {
  name: "My Theme",
  slug: "my-theme",
  mode: "dark",
  basePalette: "slate",
  accent: "indigo",
  tone: "balanced",
  components: [],
});

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
);

export const MainTest = ColorScalesLive.pipe(
  Layer.provide(ColorInputTest),
  Layer.provideMerge(UserInputTest),
);
