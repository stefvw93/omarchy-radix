import type { Option as SelectOption } from "@clack/prompts";
import {
	cancel,
	group,
	intro,
	multiselect,
	outro,
	select,
	text,
} from "@clack/prompts";
import * as RadixColors from "@radix-ui/colors";
import { Effect, Option, pipe, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../colors/generate-radix-colors";

const StageBasePalette = Schema.Literal(...grayScaleNames);
const StageAccent = Schema.Literal(...scaleNames);
const StageTone = Schema.Literal("calm", "balanced", "high-contrast");
const StageComponents = Schema.Array(
	Schema.Literal("waybar", "walker", "hyprland", "hyprlock"),
);
const StageIdentityName = Schema.String.pipe(
	Schema.filter((s) => s.length > 0 || "Name must be a non-empty"),
);
const StageIdentitySlug = Schema.String;
const StageIdentityMode = Schema.Literal("dark", "light");
const StageIdentity = Schema.Struct({
	name: StageIdentityName,
	slug: StageIdentitySlug,
	mode: StageIdentityMode,
});

export const run = Effect.gen(function* () {
	intro(
		`All colors are generated from Radix Colors.\nSee https://www.radix-ui.com/colors for accurate color previews.`,
	);

	const { mode, basePalette, accent, tone, components, name } =
		yield* Effect.promise(() =>
			group(
				{
					mode: () =>
						select<typeof StageIdentityMode.Type>({
							message: "Choose a mode",
							options: [{ value: "dark" }, { value: "light" }],
							initialValue: "dark" as const,
						}),

					basePalette: (
						// biome-ignore lint/suspicious/noExplicitAny: have to type cast because of bug https://github.com/bombshell-dev/clack/issues/234
						{ results }: { results: Record<string, any> },
					) =>
						select<typeof StageBasePalette.Type>({
							message: "Choose a base palette",
							options: grayScaleNames.map((name) => {
								const radixColorKey =
									`${name}${results.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
								const radixColor = RadixColors[radixColorKey];
								const shades = Object.values(radixColor);
								// biome-ignore lint/style/noNonNullAssertion: it exists because it's a Radix color scale with 12 shades
								const hex = shades[0]!;
								const ansi = hexToAnsi(hex);
								return {
									value: name,
									label: `${name} ${ansi}■\x1b[0m`,
								} as SelectOption<typeof StageBasePalette.Type>;
							}),
							initialValue: "slate" as const,
						}),

					accent: (
						// biome-ignore lint/suspicious/noExplicitAny: have to type cast because of bug https://github.com/bombshell-dev/clack/issues/234
						{ results }: { results: Record<string, any> },
					) =>
						select<typeof StageAccent.Type>({
							message: "Choose an accent color",
							options: scaleNames.map((name) => {
								const radixColorKey =
									`${name}${results.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
								const radixColor = RadixColors[radixColorKey];
								const shades = Object.values(radixColor);
								// biome-ignore lint/style/noNonNullAssertion: it exists because it's a Radix color scale with 12 shades
								const hex = shades[8]!;
								const ansi = hexToAnsi(hex);
								return {
									value: name,
									label: `${name} ${ansi}■\x1b[0m`,
								} as SelectOption<typeof StageAccent.Type>;
							}),
							initialValue: "indigo" as const,
						}),

					tone: () =>
						select<typeof StageTone.Type>({
							message: "Choose a tone",
							initialValue: "balanced",
							options: [
								{ value: "calm" },
								{ value: "balanced" },
								{ value: "high-contrast" },
							],
						}),

					components: () =>
						multiselect<(typeof StageComponents.Type)[number]>({
							message: "Component overrides (all selected by default)",
							initialValues: [
								"hyprland",
								"hyprlock",
								"waybar",
								"walker",
							] as const,
							options: [
								{ value: "hyprland" as const },
								{ value: "hyprlock" as const },
								{ value: "waybar" as const },
								{ value: "walker" as const },
							],
							required: true,
						}),

					name: (
						// biome-ignore lint/suspicious/noExplicitAny: have to type cast because of bug https://github.com/bombshell-dev/clack/issues/234
						{ results }: { results: Record<string, any> },
					) =>
						text({
							message: "Name your theme",
							initialValue: [
								"Radix",
								[results.accent, results.basePalette]
									.filter((s): s is NonNullable<typeof s> => !!s)
									// biome-ignore lint/style/noNonNullAssertion: nullable and empty values are filtered out
									.map((s) => s[0]!.toUpperCase() + s.slice(1))
									.join("/"),
								results.tone,
								results.mode,
							]
								.filter((s): s is string => !!s)
								// biome-ignore lint/style/noNonNullAssertion: nullable and empty values are filtered out
								.map((s) => s[0]!.toUpperCase() + s.slice(1))
								.join(" ") as string,
							validate: (value) =>
								pipe(
									Schema.decodeUnknownOption(StageIdentityName)(value),
									Option.match({
										onNone: () => "Name must be a non-empty string",
										onSome: () => undefined,
									}),
								),
						}),
				},
				{
					onCancel() {
						cancel("Operation cancelled.");
						process.exit(0);
					},
				},
			),
		);

	const slug = slugify(name);

	const identity = yield* Schema.encode(StageIdentity)({
		name,
		slug,
		mode,
	});

	console.log({ identity, basePalette, accent, tone, components });
	outro(`You're all set!`);
});

const hexToAnsi = (hex: string) => {
	const h = hex.replace(/^#/, "");
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	return `[38;2;${r};${g};${b}m`;
};

const slugify = (str: string) =>
	str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
