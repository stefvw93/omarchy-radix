import { Data } from "effect";
import { hexToAnsi } from "../../utils/hex-to-ansi";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import {
  SUPPORTED_COMPONENTS,
  type Accent,
  type BasePalette,
  type Components,
  type Mode,
  type Tone,
  type UserInput,
} from "./shared";
import * as p from "@clack/prompts";
import * as RadixColors from "@radix-ui/colors";

type PromptFactory<Result> = (opts: {
  results: Partial<typeof UserInput.Type>;
}) => Promise<Result | symbol>;

export class PromptError extends Data.TaggedError("PromptError")<{ message: string }> {}

export const promptMode: PromptFactory<typeof Mode.Type> = () =>
  p.select({
    message: "Choose a mode",
    options: [{ value: "dark" }, { value: "light" }],
    initialValue: "dark" as const,
  });

const DARK_ACCENTS = new Set<typeof Accent.Type>([
  "brown",
  "orange",
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
]);

const LIGHT_ACCENTS = new Set<typeof Accent.Type>(["sky", "mint", "lime", "yellow", "amber"]);

export const promptBasePalette: PromptFactory<typeof BasePalette.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before base palette." });
  }

  return p.select({
    message: "Choose a base palette",
    initialValue: "gray" as const,
    options: grayScaleNames.map((name) => {
      const radixColorKey =
        `${name}${results.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
      const radixColor = RadixColors[radixColorKey];
      const preview = Object.values(radixColor)
        .slice(7, 10) // show only a sub set of the shades for preview
        .map((shade) => hexToAnsi(shade) + "■\x1b[0m")
        .join("");

      return {
        value: name,
        label: `${name} ${preview}`,
      };
    }),
  });
};

export const promptAccent: PromptFactory<typeof Accent.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before accent color." });
  }

  const options = scaleNames
    .filter((name) => (results.mode === "dark" ? DARK_ACCENTS.has(name) : LIGHT_ACCENTS.has(name)))
    .map((name) => {
      const radixColorKey =
        `${name}${results.mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
      const radixColor = RadixColors[radixColorKey];
      const preview = Object.values(radixColor)
        .slice(7, 10) // show only a sub set of the shades for preview
        .map((shade) => hexToAnsi(shade) + "■\x1b[0m")
        .join("");
      return {
        value: name,
        label: `${name} ${preview}`,
      } as p.Option<typeof Accent.Type>;
    });

  return p.select({
    message: "Choose an accent color",
    initialValue: "blue" as const,
    options,
  });
};

export const promptTone: PromptFactory<typeof Tone.Type> = () =>
  p.select<typeof Tone.Type>({
    message: "Choose a tone",
    initialValue: "balanced",
    options: [{ value: "calm" }, { value: "balanced" }, { value: "high-contrast" }],
  });

export const promptComponents: PromptFactory<typeof Components.Type> = () =>
  p.multiselect<(typeof Components.Type)[number]>({
    message: "Component overrides (all selected by default)",
    initialValues: [...SUPPORTED_COMPONENTS] as const,
    options: SUPPORTED_COMPONENTS.map((component) => ({ value: component })),
    required: true,
  });

export const promptThemeDirectoryPath: (initialValue: string) => PromptFactory<string> =
  (initialValue) => () =>
    p.text({
      message: "What is your Omarchy themes directory path?",
      initialValue,
    });
