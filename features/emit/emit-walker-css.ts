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
  const { omarchyPath } = yield* Omarchy;
  const { stagingDirectory } = yield* Output;
  const colorScales = yield* ColorScalesProvider;
  const resolvedPath = path.resolve(stagingDirectory, "walker.css");
  const { accent, foreground, background } = yield* mapColorsToToml;

  // const walkerTemplatePath = path.resolve(omarchyPath, "default", "themed", "walker.css.tpl");
  // yield* Effect.log(`Found walker template at ${walkerTemplatePath}`);

  const defineColors = yield* recordToLines(
    {
      // Default Omarchy color definitions -- used as fallback values

      "selected-text": colorScales.base[12], // @define-color selected-text {{ accent }};
      text: colorScales.base[11], // @define-color text {{ foreground }};
      base: colorScales.base[2], // @define-color base {{ background }};
      border: colorScales.base[8], // @define-color border {{ foreground }};
      foreground: "#0000ff", // @define-color foreground {{ foreground }};
      background: "#ff0000", // @define-color background {{ background }};

      // Custom color definitions
    },
    (key, value) => /** css */ `@define-color ${key} ${value};`,
  );

  const _selectors = /* CSS */ `

/* Styles by ${pkg.name} */

window .box-wrapper {
  background: alpha(${colorScales.base[2]}, 0.6);
  border: 1px solid @border;
}

window .search-container {
  background: ${colorScales.baseAlpha[1]};
}

window child:selected {
  background: ${colorScales.baseAlpha[5]};
}

`;

  const selectors = yield* recordToLines(
    {
      // .box-wrapper {
      //   background: alpha(@base, 0.95);
      //   padding: 20px;
      //   border: 2px solid @border;
      // }
      // child:selected {
      //   background: alpha(@text, 0.07);
      // }
      "window child:selected": yield* recordToLines(
        {
          background: "#00ff00", // colorScales.base[5],
        },
        (key, value) => `${key}: ${value};`,
      ).pipe(Effect.map((lines) => ` {\n${lines.join("\n")}\n}`)),
    },
    (key, value) => `${key}${value}`,
  );

  const walkerCssContent = [...defineColors, "", _selectors.trim()].join("\n");

  yield* Effect.log(`Emitting walker.css to staging at ${resolvedPath}`);
  yield* fs.writeFileString(resolvedPath, walkerCssContent);
});
