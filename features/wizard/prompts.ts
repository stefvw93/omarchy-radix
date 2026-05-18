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

const _DARK_ACCENTS = new Set<typeof Accent.Type>([
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

const _LIGHT_ACCENTS = new Set<typeof Accent.Type>(["sky", "mint", "lime", "yellow", "amber"]);

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

  return p.select({
    message: "Choose an accent color",
    initialValue: "blue" as const,
    options: makeColorOptions(scaleNames, results.mode),
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
