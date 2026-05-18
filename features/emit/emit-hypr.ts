import { Effect } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { ColorScalesProvider, Output } from "../wizard/shared";
import pkg from "../../package.json";

export const emitHyprlandConf = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stagingDirectory } = yield* Output;
  const colorScales = yield* ColorScalesProvider;
  const hyprConfigPath = path.resolve(stagingDirectory, "hyprland.conf");

  const hyprConfig = `
# Hyprland configuration by ${pkg.name}
# Created at ${new Date().toISOString()}

# https://wiki.hyprland.org/Configuring/Variables/#general
general {
  gaps_in = 6
  gaps_out = 4, 12, 12, 12
  border_size = 1
  col.inactive_border = rgb(${colorScales.base[6].replace("#", "")})
  col.active_border = rgb(${colorScales.base[8].replace("#", "")})
}

# https://wiki.hyprland.org/Configuring/Variables/#decoration
decoration {
  # Use round window corners
  rounding = 14
  rounding_power = 3

  # Stronger blur behind transparent (inactive) windows
  blur {
    enabled = true
    size = 10
    passes = 2
    new_optimizations = true
  }

  # Focused windows get a darker shadow; unfocused windows fade back.
  shadow {
    enabled = true
    range = 80
    render_power = 4
    sharp = false
    offset = 0 8
    scale = 1.0
    color = rgba(00000055)
    color_inactive = rgba(00000022)
    ignore_window = true
  }
}

windowrule = opacity 1.0 0.85, match:tag default-opacity
windowrule = opacity 1.0 0.85, match:tag chromium-based-browser
windowrule = opacity 1.0 0.85, match:tag firefox-based-browser
windowrule = opacity 1.0 0.85, match:tag terminal

animation = workspacesIn, 1, 2, default
animation = workspacesOut, 1, 2, default
`;

  yield* Effect.log(`Emitting hyprland.conf to staging at ${hyprConfigPath}`);
  yield* fs.writeFileString(hyprConfigPath, hyprConfig, { flag: "a" });
});
