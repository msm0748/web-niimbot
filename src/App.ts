import { DEFAULT_LABEL_SIZE_ID, getLabelSize, LABEL_SIZES, type LabelSizeId } from "./domain/labels";
import { renderTextLabel } from "./domain/renderLabel";
import { describePrinterError } from "./printer/NiimbotPrinter";
import { WebBluetoothNiimbotPrinter } from "./printer/WebBluetoothNiimbotPrinter";

type LogLevel = "info" | "success" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
};

export class App {
  private readonly printer = new WebBluetoothNiimbotPrinter();
  private selectedSize: LabelSizeId = DEFAULT_LABEL_SIZE_ID;
  private text = "";
  private logs: LogEntry[] = [
    { level: "info", message: "Ready. Open in Chrome on localhost.", timestamp: now() }
  ];

  constructor(private readonly root: HTMLElement) {}

  render(): void {
    this.root.innerHTML = `
      <section class="app-shell">
        <header class="toolbar">
          <div>
            <h1>NIIMBOT D11_H</h1>
            <p class="subtitle">Bluetooth text label printer</p>
          </div>
          <div class="connection-state" data-status="${this.printer.status}">
            ${this.printer.deviceName ?? this.statusLabel()}
          </div>
        </header>

        <section class="controls" aria-label="Label printer controls">
          <div class="field">
            <label for="label-size">Label size</label>
            <select id="label-size">
              ${Object.values(LABEL_SIZES)
                .map(
                  (size) =>
                    `<option value="${size.id}" ${size.id === this.selectedSize ? "selected" : ""}>${size.label}</option>`
                )
                .join("")}
            </select>
          </div>

          <div class="field">
            <label for="label-text">Text</label>
            <input id="label-text" maxlength="40" value="${escapeHtml(this.text)}" placeholder="라벨 문구 입력" />
          </div>

          <div class="actions">
            <button id="connect-button" type="button">${this.printer.status === "connected" ? "Reconnect" : "Connect"}</button>
            <button id="print-button" type="button">Print</button>
          </div>
        </section>

        <section class="preview" aria-label="Label preview">
          <div class="label-preview label-preview-${this.selectedSize}">
            <span>${escapeHtml(this.text || "Preview")}</span>
          </div>
        </section>

        <section class="log" aria-label="Status log">
          <h2>Status</h2>
          <ol>
            ${this.logs
              .map((entry) => `<li class="${entry.level}"><time>${entry.timestamp}</time>${escapeHtml(entry.message)}</li>`)
              .join("")}
          </ol>
        </section>
      </section>
    `;

    this.bind();
  }

  private bind(): void {
    this.root.querySelector<HTMLSelectElement>("#label-size")?.addEventListener("change", (event) => {
      this.selectedSize = (event.target as HTMLSelectElement).value as LabelSizeId;
      this.render();
    });

    this.root.querySelector<HTMLInputElement>("#label-text")?.addEventListener("input", (event) => {
      this.text = (event.target as HTMLInputElement).value;
      this.render();
    });

    this.root.querySelector<HTMLButtonElement>("#connect-button")?.addEventListener("click", () => {
      void this.connect();
    });

    this.root.querySelector<HTMLButtonElement>("#print-button")?.addEventListener("click", () => {
      void this.print();
    });
  }

  private async connect(): Promise<void> {
    try {
      this.addLog("info", "Opening Chrome Bluetooth picker...");
      await this.printer.connect();
      this.addLog("success", `Connected to ${this.printer.deviceName ?? "D11_H"}.`);
    } catch (error) {
      this.addLog("error", describePrinterError(error));
    }
  }

  private async print(): Promise<void> {
    try {
      const rendered = renderTextLabel(this.text, getLabelSize(this.selectedSize));
      this.addLog("info", `Printing ${LABEL_SIZES[this.selectedSize].label} label...`);
      await this.printer.print(rendered);
      this.addLog("success", "Print finished.");
    } catch (error) {
      this.addLog("error", describePrinterError(error));
    }
  }

  private addLog(level: LogLevel, message: string): void {
    this.logs = [{ level, message, timestamp: now() }, ...this.logs].slice(0, 8);
    this.render();
  }

  private statusLabel(): string {
    if (this.printer.status === "connecting") return "Connecting";
    if (this.printer.status === "printing") return "Printing";
    if (this.printer.status === "disconnected") return "Disconnected";
    return "Not connected";
  }
}

function now(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
