import { group } from "@clack/prompts";
import { Config, Effect, Schema } from "effect";
import { UserInput, LifeCycle } from "./shared";
import { Path } from "@effect/platform";
import pkg from "../../package.json";
import {
  promptAccent,
  promptBasePalette,
  promptComponents,
  promptMode,
  promptSemanticError,
  promptSemanticInfo,
  promptSemanticSuccess,
  promptSemanticWarning,
  promptThemeDirectoryPath,
} from "./prompts";

export const run = Effect.gen(function* () {
  const path = yield* Path.Path;
  const homeDir = yield* Config.string("HOME");
  const { onCancel: handleCancel } = yield* LifeCycle;

  const promptInputs = yield* Effect.async<Record<string, unknown>, Error>((resume) => {
    group(
      {
        mode: promptMode,
        basePalette: promptBasePalette,
        accent: promptAccent,
        semanticError: promptSemanticError,
        semanticSuccess: promptSemanticSuccess,
        semanticWarning: promptSemanticWarning,
        semanticInfo: promptSemanticInfo,
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

  const slug = slugify([pkg.name, userInput.accent, userInput.mode].join("-"));

  const compiledInput: typeof UserInput.Type = {
    ...userInput,
    slug,
  };

  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    yield* Effect.log(`User input: ${JSON.stringify(compiledInput, null, 2)}`);
  }

  return compiledInput;
});

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
