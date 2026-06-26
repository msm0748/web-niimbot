import type { RenderedLabel } from "../domain/renderLabel";

export type PrinterStatus = "idle" | "connecting" | "connected" | "printing" | "disconnected";

export interface NiimbotPrinter {
  readonly status: PrinterStatus;
  readonly deviceName: string | undefined;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  print(label: RenderedLabel): Promise<void>;
}

export class PrinterUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrinterUserError";
  }
}

export function describePrinterError(error: unknown): string {
  if (error instanceof PrinterUserError) {
    return error.message;
  }

  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "Bluetooth selection was cancelled.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown printer error.";
}
