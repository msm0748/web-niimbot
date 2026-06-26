import { describe, expect, it } from "vitest";
import { ImageEncoder } from "@mmote/niimbluelib";
import { getCanvasSize, getLabelSize } from "./labels";
import { fitFontSize, renderTextLabel } from "./renderLabel";

describe("label sizing", () => {
  it("uses the D11_H printhead width for 12x22 labels", () => {
    expect(getCanvasSize(getLabelSize("12x22"))).toEqual({
      width: 142,
      height: 264
    });
  });

  it("uses the D11_H printhead width for 12x30 labels", () => {
    expect(getCanvasSize(getLabelSize("12x30"))).toEqual({
      width: 142,
      height: 360
    });
  });

  it("uses a length pixel count that the NIIMBOT encoder can pack into bytes", () => {
    expect(getCanvasSize(getLabelSize("12x22")).height % 8).toBe(0);
    expect(getCanvasSize(getLabelSize("12x30")).height % 8).toBe(0);
  });
});

describe("renderTextLabel", () => {
  it("rejects empty text", () => {
    expect(() => renderTextLabel("   ", getLabelSize("12x30"))).toThrow("Text is empty.");
  });

  it("creates a canvas matching the selected label size", () => {
    const rendered = renderTextLabel("Hello", getLabelSize("12x22"));

    expect(rendered.width).toBe(142);
    expect(rendered.height).toBe(264);
    expect(rendered.canvas.width).toBe(142);
    expect(rendered.canvas.height).toBe(264);
    expect(rendered.fontSize).toBeGreaterThan(0);
  });

  it("produces a canvas the NIIMBOT left-direction encoder accepts", () => {
    const rendered = renderTextLabel("문석민", getLabelSize("12x22"));

    expect(() => ImageEncoder.encodeCanvas(rendered.canvas, "left")).not.toThrow();
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
