import {
  ImageEncoder,
  LabelType,
  NiimbotBluetoothClient,
  PrinterModel
} from "@mmote/niimbluelib";
import type { RenderedLabel } from "../domain/renderLabel";
import { type NiimbotPrinter, PrinterUserError, type PrinterStatus } from "./NiimbotPrinter";

export class WebBluetoothNiimbotPrinter implements NiimbotPrinter {
  private client: NiimbotBluetoothClient | undefined;
  private currentStatus: PrinterStatus = "idle";
  private currentDeviceName: string | undefined;

  get status(): PrinterStatus {
    return this.currentStatus;
  }

  get deviceName(): string | undefined {
    return this.currentDeviceName;
  }

  async connect(): Promise<void> {
    if (!("bluetooth" in navigator)) {
      throw new PrinterUserError("Chrome Web Bluetooth is unavailable. Open this app in Chrome on localhost.");
    }

    this.currentStatus = "connecting";
    const client = new NiimbotBluetoothClient();
    client.setPacketInterval(20);

    const info = await client.connect();
    const printerInfo = client.getPrinterInfo();
    const metadata = client.getModelMetadata();

    if (metadata?.model && metadata.model !== PrinterModel.D11_H && metadata.model !== PrinterModel.D11) {
      await client.disconnect();
      this.currentStatus = "disconnected";
      throw new PrinterUserError(`Connected printer is ${metadata.model}, not D11_H.`);
    }

    this.client = client;
    this.currentDeviceName = info.deviceName ?? printerInfo.serial ?? "NIIMBOT D11_H";
    this.currentStatus = "connected";
  }

  async disconnect(): Promise<void> {
    if (this.client?.isConnected()) {
      await this.client.disconnect();
    }

    this.client = undefined;
    this.currentStatus = "disconnected";
  }

  async print(label: RenderedLabel): Promise<void> {
    const client = this.client;

    if (!client?.isConnected()) {
      throw new PrinterUserError("Connect the D11_H before printing.");
    }

    this.currentStatus = "printing";
    const encoded = ImageEncoder.encodeCanvas(label.canvas, "left");
    const taskName = client.getPrintTaskType() ?? "D11_V1";
    const task = client.abstraction.newPrintTask(taskName, {
      labelType: LabelType.WithGaps,
      density: 3,
      totalPages: 1,
      statusPollIntervalMs: 400,
      statusTimeoutMs: 15000,
      pageTimeoutMs: 15000
    });

    try {
      await task.printInit();
      await task.printPage(encoded, 1);
      await task.waitForFinished();
    } finally {
      await task.printEnd().catch(() => false);
      this.currentStatus = client.isConnected() ? "connected" : "disconnected";
    }
  }
}
