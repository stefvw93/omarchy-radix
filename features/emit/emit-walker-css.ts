import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { Omarchy } from "../app/shared";
import { mapColorsToToml } from "../map/map";
import { recordToLines } from "./shared";
import { ColorScalesProvider, Output } from "../wizard/shared";
import pkg from "../../package.json";

export const emitWalkerCss = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stagingDirectory } = yield* Output;
  const colorScales = yield* ColorScalesProvider;
  const walkerCssPath = path.resolve(stagingDirectory, "walker.css");
  const hyprConfigPath = path.resolve(stagingDirectory, "hyprland.conf");

  const walkerCss = /* CSS */ `

/* Colors by ${pkg.name} -- defined for default Omarchy configs. */

@define-color selected-text ${colorScales.base[12]};
@define-color text ${colorScales.base[11]};
@define-color base ${colorScales.base[2]};
@define-color border ${colorScales.base[8]};
@define-color foreground ${colorScales.base[11]};
@define-color background ${colorScales.base[1]};

:root {
  --gtk-layout-spacing: 10px;
  --space: 16px;
}

/* Styles by ${pkg.name} */

window .box-wrapper {
  background: alpha(${colorScales.base[2]}, 0.6);
  border: 1px solid ${colorScales.base[8]};
  border-radius: 14px;
  padding: var(--space) var(--space) 0 var(--space);
  margin: 40px;
  box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.35);
}

window .search-container {
  background: alpha(#000, 0);
  border-bottom: 1px solid ${colorScales.baseAlpha[2]};
}

window .input text {
  color: ${colorScales.base[12]};
}

window .input placeholder {
  opacity: 1;
  color: ${colorScales.base[11]};
}

window .list {
  margin-top: calc(var(--gtk-layout-spacing) * -1);
  padding: var(--space) 0;
}

window child {
  border-radius: 8px;
}

window child:selected {
  background: ${colorScales.baseAlpha[5]};
}

window .content-container .placeholder {
  margin-bottom: var(--space);
}
`.trim();

  const hyprConfig = /* Hyprland config */ `

layerrule = blur on, match:namespace walker
layerrule = ignore_alpha 0.5, match:namespace walker

`.trim();

  yield* Effect.log(`Emitting walker.css to staging at ${walkerCssPath}`);
  yield* fs.writeFileString(walkerCssPath, walkerCss);
  yield* fs.writeFileString(hyprConfigPath, hyprConfig, { flag: "a" });
});
