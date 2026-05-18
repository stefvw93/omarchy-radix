import { Data } from "effect";
import { hexToAnsi } from "../../utils/hex-to-ansi";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import {
  SemanticError,
  SemanticInfo,
  SemanticSuccess,
  SemanticWarning,
  SUPPORTED_COMPONENTS,
  type Accent,
  type BasePalette,
  type Components,
  type Mode,
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

const SCALES_FOR_LIGHT_FOREGROUND = new Set<typeof Accent.Type>([
  // "bronze",
  "blue",
  "brown",
  "crimson",
  "cyan",
  "gold",
  "grass",
  "green",
  "indigo",
  "iris",
  "jade",
  "orange",
  "pink",
  "plum",
  "purple",
  "red",
  "ruby",
  "teal",
  "tomato",
  "violet",
]);

const SCALES_FOR_DARK_FOREGROUND = new Set<typeof Accent.Type>([
  "sky",
  "mint",
  "lime",
  "yellow",
  "amber",
]);

const NATURAL_PAIRING = new Map<typeof BasePalette.Type, Set<typeof Accent.Type>>([
  ["gray", new Set()],
  ["mauve", new Set(["crimson", "pink", "plum", "purple", "red", "ruby", "tomato", "violet"])],
  ["slate", new Set(["iris", "indigo", "blue", "sky", "cyan"])],
  ["sage", new Set(["mint", "teal", "jade", "green"])],
  ["olive", new Set(["grass", "lime"])],
  ["sand", new Set(["yellow", "amber", "orange", "brown"])],
]);

const makeColorOptions = <T extends readonly string[]>(
  colors: T,
  mode: typeof Mode.Type,
): p.Option<T[number]>[] =>
  colors.map((name) => {
    const radixColorKey = `${name}${mode === "dark" ? "Dark" : ""}` as keyof typeof RadixColors;
    const radixColor = RadixColors[radixColorKey];
    const preview = Object.values(radixColor)
      .slice(7, 10) // show only a sub set of the shades for preview
      .map((shade) => hexToAnsi(shade) + "■\x1b[0m")
      .join("");

    return {
      value: name,
      label: `${name} ${preview}`,
    } as p.Option<T[number]>;
  });

export const promptBasePalette: PromptFactory<typeof BasePalette.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before base palette." });
  }

  return p.select({
    message: "Choose a base palette",
    initialValue: "gray" as const,
    options: makeColorOptions(grayScaleNames, results.mode),
  });
};

export const promptAccent: PromptFactory<typeof Accent.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before accent color." });
  }

  if (!results.basePalette) {
    throw new PromptError({ message: "Base palette must be selected before accent color." });
  }

  const options = makeColorOptions(
    scaleNames.filter((key) => {
      const matchesMode =
        results.mode === "dark"
          ? SCALES_FOR_LIGHT_FOREGROUND.has(key)
          : SCALES_FOR_DARK_FOREGROUND.has(key);

      if (!matchesMode) return false;

      if (results.basePalette === "gray") return true; // gray pairs well with everything, no need to filter further

      const naturalPairing = NATURAL_PAIRING.get(results.basePalette!);

      if (!naturalPairing) {
        throw new PromptError({
          message: `No natural pairing found for base palette ${results.basePalette} in mode ${results.mode}`,
        });
      }

      return naturalPairing?.has(key);
    }),
    results.mode,
  );

  return p.select({
    message: "Choose an accent color",
    initialValue: "blue" as const,
    options,
  });
};

export const promptSemanticError: PromptFactory<typeof SemanticError.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before semantic error color." });
  }

  return p.select({
    message: "Choose a semantic error color",
    initialValue: "red" as const,
    options: makeColorOptions(["tomato", "red", "ruby", "crimson"] as const, results.mode),
  });
};

export const promptSemanticSuccess: PromptFactory<typeof SemanticSuccess.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before semantic success color." });
  }

  return p.select({
    message: "Choose a semantic success color",
    initialValue: "green" as const,
    options: makeColorOptions(["green", "teal", "jade", "grass", "mint"] as const, results.mode),
  });
};

export const promptSemanticWarning: PromptFactory<typeof SemanticWarning.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before semantic warning color." });
  }

  return p.select({
    message: "Choose a semantic warning color",
    initialValue: "yellow" as const,
    options: makeColorOptions(["yellow", "amber", "orange"] as const, results.mode),
  });
};

export const promptSemanticInfo: PromptFactory<typeof SemanticInfo.Type> = ({ results }) => {
  if (!results.mode) {
    throw new PromptError({ message: "Mode must be selected before semantic warning color." });
  }

  return p.select({
    message: "Choose a semantic info color",
    initialValue: "blue" as const,
    options: makeColorOptions(["blue", "indigo", "sky", "cyan"] as const, results.mode),
  });
};

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
