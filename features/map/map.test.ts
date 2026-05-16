import { test } from "bun:test";
import { Effect } from "effect";
import { mapColorsToOmarchy } from "./map";
import { UserInputProvider } from "../wizard/shared";

test("should map palette to omarchy", () =>
  Effect.runPromise(
    mapColorsToOmarchy.pipe(
      Effect.provideService(
        UserInputProvider,
        Effect.succeed({
          slug: "my-theme",
          mode: "dark",
          basePalette: "slate",
          accent: "indigo",
          tone: "balanced",
          components: [],
          themeDirectoryPath: "/tmp/my-theme",
        }),
      ),
    ),
  ));
