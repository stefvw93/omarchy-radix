import { isCancel, confirm } from "@clack/prompts";
import { Context, Effect, Layer } from "effect";
import { LifeCycle, Output } from "../wizard/shared";
import pkg from "../../package.json";

export const recordToLines = <T extends Record<string, unknown>>(
  record: T,
  lineFn: (key: keyof T, value: T[keyof T]) => string,
): Effect.Effect<string[]> =>
  Effect.sync(() => Object.entries(record).map(([key, value]) => lineFn(key, value as T[keyof T])));

export class OverwritePermission extends Context.Tag(
  `${pkg.name}/features/wizard/OverwritePermission`,
)<OverwritePermission, () => Effect.Effect<boolean>>() {}

export const OverwritePermissionLive = Layer.effect(
  OverwritePermission,
  Effect.gen(function* () {
    const { onCancel } = yield* LifeCycle;
    const { themeDirectory } = yield* Output;

    const overwritePermission = () =>
      Effect.async<boolean>((resume) => {
        confirm({
          message: `The directory ${themeDirectory} already exists. Do you want to overwrite it?`,
          initialValue: false,
        }).then((value) => {
          if (isCancel(value)) {
            return resume(Effect.zipRight(onCancel, Effect.interrupt));
          }
          resume(Effect.succeed(value));
        });
      });

    return overwritePermission;
  }),
);
