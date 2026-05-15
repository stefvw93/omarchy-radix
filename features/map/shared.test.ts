import { expect, test } from "bun:test";
import { Schema } from "effect";
import { NormalizedColorScaleFromRadixColorScale } from "./shared";

test("should normalize a radix color scale", () => {
  const result = Schema.decodeSync(NormalizedColorScaleFromRadixColorScale)({
    gray1: "#000000",
    gray2: "#111111",
    gray3: "#222222",
    gray4: "#333333",
    gray5: "#444444",
    gray6: "#555555",
    gray7: "#666666",
    gray8: "#777777",
    gray9: "#888888",
    gray10: "#999999",
    gray11: "#aaaaaa",
    gray12: "#bbbbbb",
  });

  expect(result[1]).toBe("#000000");
  expect(result[12]).toBe("#bbbbbb");
});

test("should fail to encode a normalized color scale", () => {
  const result = () =>
    Schema.encodeSync(NormalizedColorScaleFromRadixColorScale)({
      1: "#000000",
      2: "#111111",
      3: "#222222",
      4: "#333333",
      5: "#444444",
      6: "#555555",
      7: "#666666",
      8: "#777777",
      9: "#888888",
      10: "#999999",
      11: "#aaaaaa",
      12: "#bbbbbb",
    });

  expect(result).toThrow();
});
