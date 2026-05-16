import * as RadixColors from "@radix-ui/colors";
import { ColorsToml, HexColorFromString } from "./shared";
import { ColorScalesProvider, UserInputProvider } from "../wizard/shared";
import { Effect, Schema } from "effect";

export const mapColorsToToml = Effect.gen(function* () {
  const { base, accent } = yield* ColorScalesProvider;
  const userInput = yield* UserInputProvider;
  const hex = Schema.decode(HexColorFromString);
  const dark = userInput.mode === "dark";

  const color1 = yield* hex(dark ? RadixColors.redDark.red9 : RadixColors.red.red9);
  const color2 = yield* hex(dark ? RadixColors.greenDark.green9 : RadixColors.green.green9);
  const color3 = yield* hex(dark ? RadixColors.amberDark.amber9 : RadixColors.amber.amber9);
  const color4 = yield* hex(accent[9]);
  const color5 = yield* hex(dark ? RadixColors.plumDark.plum9 : RadixColors.plum.plum9);
  const color6 = yield* hex(dark ? RadixColors.cyanDark.cyan9 : RadixColors.cyan.cyan9);
  const color9 = yield* hex(dark ? RadixColors.redDark.red10 : RadixColors.red.red10);
  const color10 = yield* hex(dark ? RadixColors.greenDark.green10 : RadixColors.green.green10);
  const color11 = yield* hex(dark ? RadixColors.amberDark.amber10 : RadixColors.amber.amber10);
  const color12 = yield* hex(accent[10]);
  const color13 = yield* hex(dark ? RadixColors.plumDark.plum10 : RadixColors.plum.plum10);
  const color14 = yield* hex(dark ? RadixColors.cyanDark.cyan10 : RadixColors.cyan.cyan10);

  const colorsToml = yield* Schema.decode(ColorsToml)({
    background: base[1],
    foreground: base[12],
    cursor: base[12],
    selection_background: base[4],
    selection_foreground: base[12],
    // accent: accent[9],
    accent: base[9],
    color0: base[3],
    color7: base[11],
    color8: base[8],
    color15: base[12],

    // ascii stuff
    color1,
    color2,
    color3,
    color4,
    color5,
    color6,
    color9,
    color10,
    color11,
    color12,
    color13,
    color14,
  });

  return colorsToml;
});
