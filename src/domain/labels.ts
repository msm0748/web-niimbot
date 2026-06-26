export type LabelSizeId = "12x22" | "12x30";

export type LabelSize = {
  id: LabelSizeId;
  label: string;
  widthMm: number;
  lengthMm: number;
};

export const D11H_DPI = 300;
export const D11H_PRINTHEAD_PIXELS = 142;

export const LABEL_SIZES: Record<LabelSizeId, LabelSize> = {
  "12x22": { id: "12x22", label: "12 x 22 mm", widthMm: 12, lengthMm: 22 },
  "12x30": { id: "12x30", label: "12 x 30 mm", widthMm: 12, lengthMm: 30 }
};

export const DEFAULT_LABEL_SIZE_ID: LabelSizeId = "12x30";

export function getLabelSize(id: LabelSizeId): LabelSize {
  return LABEL_SIZES[id];
}

export function mmToPixels(mm: number, dpi = D11H_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}

export function nextMultipleOf8(value: number): number {
  return Math.ceil(value / 8) * 8;
}

export function getCanvasSize(size: LabelSize): { width: number; height: number } {
  return {
    width: nextMultipleOf8(mmToPixels(size.lengthMm)),
    height: nextMultipleOf8(D11H_PRINTHEAD_PIXELS)
  };
}
