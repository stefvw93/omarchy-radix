import { Effect, Exit } from "effect";
import { run } from "./features/wizard/run";

Effect.runPromiseExit(run)
  .then((exit) => {
    Exit.match(exit, {
      onFailure(cause) {
        if (process.env.NODE_ENV !== "development") return;
        console.error("Wizard failed with error:", cause);
      },
      onSuccess(a) {
        if (process.env.NODE_ENV !== "development") return;
        console.log("Wizard completed successfully with result:", a);
      },
    });
  })
  .catch((reason) => {
    if (process.env.NODE_ENV !== "development") return;
    console.error("An unexpected error occurred while running the wizard:", reason);
  });
