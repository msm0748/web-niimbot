import { getCanvasSize, type LabelSize } from "./labels";

export type RenderedLabel = {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  width: number;
  height: number;
  fontSize: number;
};

export function renderTextLabel(text: string, size: LabelSize): RenderedLabel {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Text is empty.");
  }

  const { width, height } = getCanvasSize(size);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#000000";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const fontSize = fitFontSize(context, trimmed, width, height);
  context.font = `700 ${fontSize}px system-ui, sans-serif`;
  context.fillText(trimmed, width / 2, height / 2);

  return {
    canvas,
    imageData: context.getImageData(0, 0, width, height),
    width,
    height,
    fontSize
  };
}

export function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number
): number {
  const horizontalPadding = 12;
  const verticalPadding = 8;
  const maxWidth = width - horizontalPadding * 2;
  const maxHeight = height - verticalPadding * 2;

  for (let size = Math.min(96, maxHeight); size >= 8; size -= 1) {
    context.font = `700 ${size}px system-ui, sans-serif`;
    const metrics = context.measureText(text);
    const actualHeight =
      Math.abs(metrics.actualBoundingBoxAscent || size * 0.75) +
      Math.abs(metrics.actualBoundingBoxDescent || size * 0.25);

    if (metrics.width <= maxWidth && actualHeight <= maxHeight) {
      return size;
    }
  }

  return 8;
}
