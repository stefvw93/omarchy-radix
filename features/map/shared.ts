import { Context, identity, ParseResult, pipe, Schema } from "effect";
import type { Mutable } from "effect/Types";
import pkg from "../../package.json";

export class ColorScalesProvider extends Context.Tag(
  `${pkg.name}/features/colors/ColorScalesProvider`,
)<
  ColorScalesProvider,
  {
    readonly base: typeof NormalizedRadixColorScale.Type;
    readonly accent: typeof NormalizedRadixColorScale.Type;
  }
>() {}

export const HexColor = Schema.TemplateLiteral(
  "#",
  Schema.String.annotations({
    description: "A hex color string.",
    examples: ["#ff0000", "#f00"],
  }),
);

export const HexColorFromString = Schema.transform(Schema.String, HexColor, {
  decode: (str) => Schema.decodeUnknownSync(HexColor)(str),
  encode: identity,
});

export const RadixColorScaleStep = Schema.Union(
  Schema.Literal(1),
  Schema.Literal(2),
  Schema.Literal(3),
  Schema.Literal(4),
  Schema.Literal(5),
  Schema.Literal(6),
  Schema.Literal(7),
  Schema.Literal(8),
  Schema.Literal(9),
  Schema.Literal(10),
  Schema.Literal(11),
  Schema.Literal(12),
);

export const RadixNamedColorScaleKey = Schema.TemplateLiteral(Schema.String, RadixColorScaleStep);

export const RadixColorScale = Schema.Record({
  key: RadixNamedColorScaleKey,
  value: HexColor,
});

export const NormalizedRadixColorScale = Schema.Record({
  key: RadixColorScaleStep,
  value: HexColor,
});

export const NormalizedColorScaleFromRadixColorScale = Schema.transformOrFail(
  RadixColorScale,
  NormalizedRadixColorScale,
  {
    decode: (radixColorScale) => {
      const result = Object.entries(radixColorScale).reduce(
        (acc, [key, value]) => {
          const step = pipe(
            key.match(/\d+$/)?.[0],
            Schema.decodeUnknownSync(Schema.NumberFromString),
            Schema.decodeUnknownSync(RadixColorScaleStep),
          );

          acc[step] = value;
          return acc;
        },
        {} as Mutable<typeof NormalizedRadixColorScale.Type>,
      );

      return ParseResult.succeed(result);
    },
    encode: (normalizedColorScale, _, ast) =>
      ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          normalizedColorScale,
          "Encoding normalized color scales back to radix color scales is not possible.",
        ),
      ),
  },
);

export const ColorsToml = Schema.Struct({
  accent: HexColor,
  cursor: HexColor,
  foreground: HexColor,
  background: HexColor,
  selection_foreground: HexColor,
  selection_background: HexColor,
  color0: HexColor,
  color1: HexColor,
  color2: HexColor,
  color3: HexColor,
  color4: HexColor,
  color5: HexColor,
  color6: HexColor,
  color7: HexColor,
  color8: HexColor,
  color9: HexColor,
  color10: HexColor,
  color11: HexColor,
  color12: HexColor,
  color13: HexColor,
  color14: HexColor,
  color15: HexColor,
});

export const OmarchyMapping = Schema.Struct({
  colorsToml: ColorsToml,
});
