import { describe, expect, it } from "vitest";
import { getCanvasSize, getLabelSize } from "./labels";
import { fitFontSize, renderTextLabel } from "./renderLabel";

describe("label sizing", () => {
  it("uses the D11_H printhead width for 12x22 labels", () => {
    expect(getCanvasSize(getLabelSize("12x22"))).toEqual({
      width: 142,
      height: 260
    });
  });

  it("uses the D11_H printhead width for 12x30 labels", () => {
    expect(getCanvasSize(getLabelSize("12x30"))).toEqual({
      width: 142,
      height: 354
    });
  });
});

describe("renderTextLabel", () => {
  it("rejects empty text", () => {
    expect(() => renderTextLabel("   ", getLabelSize("12x30"))).toThrow("Text is empty.");
  });

  it("creates a canvas matching the selected label size", () => {
    const rendered = renderTextLabel("Hello", getLabelSize("12x22"));

    expect(rendered.width).toBe(142);
    expect(rendered.height).toBe(260);
    expect(rendered.canvas.width).toBe(142);
    expect(rendered.canvas.height).toBe(260);
    expect(rendered.fontSize).toBeGreaterThan(0);
  });
});

describe("fitFontSize", () => {
  it("shrinks longer text more than shorter text", () => {
    const context = document.createElement("canvas").getContext("2d");

    if (!context) {
      throw new Error("Missing test canvas context");
    }

    const shortText = fitFontSize(context, "ABC", 142, 260);
    const longText = fitFontSize(context, "ABCDEFGHIJKLMNO", 142, 260);

    expect(shortText).toBeGreaterThan(longText);
  });
});
