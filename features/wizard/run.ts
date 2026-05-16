import type { Option as SelectOption } from "@clack/prompts";
import { cancel, group, intro, multiselect, outro, select, text } from "@clack/prompts";
import * as RadixColors from "@radix-ui/colors";
import { Config, Effect, Option, pipe, Schema } from "effect";
import { grayScaleNames, scaleNames } from "../map/generate-radix-colors";
import {
  type Accent,
  type BasePalette,
  type Components,
  IdentityName,
  type Mode,
  UserInput,
  type Tone,
  SUPPORTED_COMPONENTS,
  LifeCycle,
} from "./shared";
import { Path } from "@effect/platform";
import pkg from "../../package.json";
import {
  promptAccent,
  promptBasePalette,
  promptComponents,
  promptMode,
  promptThemeDirectoryPath,
  promptTone,
} from "./prompts";
import { hexToAnsi } from "../../utils/hex-to-ansi";

export const run = Effect.gen(function* () {
  intro(
    `All colors are generated from Radix Colors.\nSee https://www.radix-ui.com/colors for accurate color previews.`,
  );

  const path = yield* Path.Path;
  const homeDir = yield* Config.string("HOME");
  const { onCancel: handleCancel } = yield* LifeCycle;

  const promptInputs = yield* Effect.async<Record<string, unknown>, Error>((resume) => {
    group(
      {
        mode: promptMode,
        basePalette: promptBasePalette,
        accent: promptAccent,
        tone: promptTone,
        components: promptComponents,
        themeDirectoryPath: promptThemeDirectoryPath(
          path.resolve(homeDir, ".config/omarchy/themes"),
        ),
      },
      {
        onCancel() {
          resume(Effect.zipRight(handleCancel, Effect.interrupt));
        },
      },
    ).then((results) => resume(Effect.succeed(results)));
  });

  const userInput = yield* Schema.encodeUnknown(UserInput.pipe(Schema.omit("slug")))({
    ...promptInputs,
  });

  const slug = slugify(
    [pkg.name, userInput.accent, userInput.basePalette, userInput.tone, userInput.mode].join("-"),
  );

  const compiledInput: typeof UserInput.Type = {
    ...userInput,
    slug,
  };

  console.log(compiledInput);

  outro(`You're all set!`);

  return compiledInput;
});

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
