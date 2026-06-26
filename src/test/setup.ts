import { vi } from "vitest";

class TestImageData {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

Object.defineProperty(globalThis, "ImageData", {
  value: TestImageData,
  writable: true
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => ({
    fillStyle: "#000000",
    textAlign: "left",
    textBaseline: "alphabetic",
    font: "16px sans-serif",
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: (text: string) => ({
      width: text.length * 8,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 4
    }),
    getImageData: (_x: number, _y: number, width: number, height: number) =>
      new ImageData(width, height)
  })),
  writable: true
});
