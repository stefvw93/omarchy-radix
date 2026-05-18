import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { ColorScalesProvider, Output } from "../wizard/shared";
import pkg from "../../package.json";

// notify-send -u low      "Low urgency"      "This is a low-priority notification"
// notify-send -u normal   "Normal urgency"   "This is the default style"
// notify-send -u critical "Critical urgency" "Sticky until dismissed, on overlay layer"

export const emitMakoIni = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stagingDirectory } = yield* Output;
  const colorScales = yield* ColorScalesProvider;
  const makoIniPath = path.resolve(stagingDirectory, "mako.ini");

  const makoIni = `
# Mako configuration by ${pkg.name}

include=~/.local/share/omarchy/default/mako/core.ini

text-color=${colorScales.base[12]}
border-color=${colorScales.base[8]}
background-color=${colorScales.base[3]}
progress-color=${colorScales.accent[10]}
border-radius=12
border-size=1
font=monospace 10

[urgency=low]
border-color=${colorScales.base[6]}

[urgency=critical]
background-color=${colorScales.semanticError[3]}
border-color=${colorScales.semanticError[8]}
`;

  yield* Effect.log(`Emitting mako.ini to staging at ${makoIniPath}`);
  yield* fs.writeFileString(makoIniPath, makoIni);
});
