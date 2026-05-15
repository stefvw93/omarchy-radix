import { expect, test } from "bun:test";
import { Effect } from "effect";
import { recordToLines } from "./shared";

test("should convert record to lines", () => {
  const output = Effect.runSync(
    recordToLines({ a: 1, b: "two" }, (key, value) => `${key} = "${value}"`),
  );

  expect(output.join("\n")).toBe('a = "1"\nb = "two"');
});
