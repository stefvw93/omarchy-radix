import * as RadixColors from "@radix-ui/colors";
import { Effect } from "effect";
import type { ThemeConfig } from "../shared";

export const mapPaletteToOmarchy: (
	config: typeof ThemeConfig.Type,
) => Effect.Effect<any> = (config) =>
	Effect.gen(function* () {
		const basePaletteRadixColorKey =
			`${config.basePalette}${config.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
		const basePaletteRadixColorMap = RadixColors[basePaletteRadixColorKey];
		const basePaletteShades = Object.values(basePaletteRadixColorMap);
		const accentRadixColorKey =
			`${config.accent}${config.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
		const accentRadixColorMap = RadixColors[accentRadixColorKey];
		const accentShades = Object.values(accentRadixColorMap);

		console.log({
			basePaletteRadixColorMap,
			accentRadixColorMap,
		});

		yield* Effect.void;
	});
