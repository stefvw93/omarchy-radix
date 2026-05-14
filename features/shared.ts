import { Schema } from "effect";
import { grayScaleNames, scaleNames } from "./colors/generate-radix-colors";

export const Mode = Schema.Literal("dark", "light");
export const BasePalette = Schema.Literal(...grayScaleNames);
export const Accent = Schema.Literal(...scaleNames);
export const Tone = Schema.Literal("calm", "balanced", "high-contrast");
export const Components = Schema.Array(
	Schema.Literal("waybar", "walker", "hyprland", "hyprlock"),
);
export const IdentityName = Schema.String.pipe(
	Schema.filter((s) => s.length > 0 || "Name must be a non-empty"),
);
export const IdentitySlug = Schema.String;

export const ThemeConfig = Schema.Struct({
	name: IdentityName,
	slug: IdentitySlug,
	mode: Mode,
	basePalette: BasePalette,
	accent: Accent,
	tone: Tone,
	components: Components,
});
