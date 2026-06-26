import { describe, expect, it } from "vitest";
import { ImageEncoder } from "@mmote/niimbluelib";
import { getCanvasSize, getLabelSize } from "./labels";
import { fitFontSize, renderTextLabel } from "./renderLabel";

describe("label sizing", () => {
  it("uses length x printhead canvas dimensions for 12x22 labels", () => {
    expect(getCanvasSize(getLabelSize("12x22"))).toEqual({
      width: 264,
      height: 144
    });
  });

  it("uses length x printhead canvas dimensions for 12x30 labels", () => {
    expect(getCanvasSize(getLabelSize("12x30"))).toEqual({
      width: 360,
      height: 144
    });
  });

  it("uses dimensions that the left-direction NIIMBOT encoder can pack into bytes", () => {
    expect(getCanvasSize(getLabelSize("12x22")).width % 8).toBe(0);
    expect(getCanvasSize(getLabelSize("12x22")).height % 8).toBe(0);
    expect(getCanvasSize(getLabelSize("12x30")).width % 8).toBe(0);
    expect(getCanvasSize(getLabelSize("12x30")).height % 8).toBe(0);
  });
});

describe("renderTextLabel", () => {
  it("rejects empty text", () => {
    expect(() => renderTextLabel("   ", getLabelSize("12x30"))).toThrow("Text is empty.");
  });

  it("creates a canvas matching the selected label size", () => {
    const rendered = renderTextLabel("Hello", getLabelSize("12x22"));

    expect(rendered.width).toBe(264);
    expect(rendered.height).toBe(144);
    expect(rendered.canvas.width).toBe(264);
    expect(rendered.canvas.height).toBe(144);
    expect(rendered.fontSize).toBeGreaterThan(0);
  });

  it("produces a canvas the NIIMBOT left-direction encoder accepts", () => {
    const rendered = renderTextLabel("문석민", getLabelSize("12x22"));

    expect(() => ImageEncoder.encodeCanvas(rendered.canvas, "left")).not.toThrow();
  });

  it("encodes label length as rows and printhead width as columns", () => {
    const rendered = renderTextLabel("문석민", getLabelSize("12x22"));
    const encoded = ImageEncoder.encodeCanvas(rendered.canvas, "left");

    expect(encoded.cols).toBe(144);
    expect(encoded.rows).toBe(264);
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
