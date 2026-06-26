import { DEFAULT_LABEL_SIZE_ID, getLabelSize, LABEL_SIZES, type LabelSizeId } from "./domain/labels";
import {
  clearPrintHistory,
  loadPrintHistory,
  removePrintedLabel,
  savePrintedLabel,
  type PrintHistoryItem
} from "./domain/printHistory";
import { renderTextLabel } from "./domain/renderLabel";
import { describePrinterError } from "./printer/NiimbotPrinter";
import { WebBluetoothNiimbotPrinter } from "./printer/WebBluetoothNiimbotPrinter";

type LogLevel = "info" | "success" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
};

type PendingDelete =
  | { kind: "all" }
  | {
      kind: "one";
      item: PrintHistoryItem;
    };

export class App {
  private readonly printer = new WebBluetoothNiimbotPrinter();
  private selectedSize: LabelSizeId = DEFAULT_LABEL_SIZE_ID;
  private text = "";
  private printHistory: PrintHistoryItem[] = loadPrintHistory();
  private pendingDelete: PendingDelete | null = null;
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

        <section class="history" aria-label="Printed labels">
          <div class="section-heading">
            <h2>Printed Labels</h2>
            <div class="history-heading-actions">
              <span>${this.printHistory.length}</span>
              ${
                this.printHistory.length > 0
                  ? `<button class="text-button danger" id="clear-history-button" type="button">Clear All</button>`
                  : ""
              }
            </div>
          </div>
          ${
            this.printHistory.length > 0
              ? `<ol>
                  ${this.printHistory
                    .map(
                      (item, index) => `
                        <li>
                          <div class="history-row">
                            <button class="history-item" type="button" data-history-index="${index}">
                              <span>${escapeHtml(item.text)}</span>
                              <small>${LABEL_SIZES[item.labelSize].label}</small>
                            </button>
                            <button class="delete-history-button" type="button" data-delete-history-index="${index}" aria-label="Delete ${escapeHtml(item.text)}">Delete</button>
                          </div>
                        </li>`
                    )
                    .join("")}
                </ol>`
              : `<p class="empty-history">No printed labels yet.</p>`
          }
        </section>
        ${this.pendingDelete ? this.renderDeleteModal() : ""}
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
      this.updatePreviewText();
    });

    this.root.querySelector<HTMLInputElement>("#label-text")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) {
        return;
      }

      event.preventDefault();
      void this.print();
    });

    this.root.querySelector<HTMLButtonElement>("#connect-button")?.addEventListener("click", () => {
      void this.connect();
    });

    this.root.querySelector<HTMLButtonElement>("#print-button")?.addEventListener("click", () => {
      void this.print();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-history-index]").forEach((button) => {
      button.addEventListener("click", () => {
        this.loadHistoryItem(Number(button.dataset.historyIndex));
      });
    });

    this.root.querySelector<HTMLButtonElement>("#clear-history-button")?.addEventListener("click", () => {
      this.pendingDelete = { kind: "all" };
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-delete-history-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.printHistory[Number(button.dataset.deleteHistoryIndex)];

        if (!item) {
          return;
        }

        this.pendingDelete = { kind: "one", item };
        this.render();
      });
    });

    this.root.querySelector<HTMLButtonElement>("#cancel-delete-button")?.addEventListener("click", () => {
      this.closeDeleteModal();
    });

    this.root.querySelector<HTMLButtonElement>("#confirm-delete-button")?.addEventListener("click", () => {
      this.confirmDelete();
    });

    this.root.querySelector<HTMLDivElement>(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        this.closeDeleteModal();
      }
    });

    this.root.querySelector<HTMLDivElement>(".modal-backdrop")?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeDeleteModal();
      }
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
      this.printHistory = savePrintedLabel(this.printHistory, this.text, this.selectedSize);
      this.addLog("success", "Print finished.");
    } catch (error) {
      this.addLog("error", describePrinterError(error));
    }
  }

  private loadHistoryItem(index: number): void {
    const item = this.printHistory[index];

    if (!item) {
      return;
    }

    this.text = item.text;
    this.selectedSize = item.labelSize;
    this.render();
    this.root.querySelector<HTMLInputElement>("#label-text")?.focus();
  }

  private confirmDelete(): void {
    if (!this.pendingDelete) {
      return;
    }

    if (this.pendingDelete.kind === "all") {
      this.printHistory = clearPrintHistory();
      this.pendingDelete = null;
      this.addLog("info", "Printed label history cleared.");
      return;
    }

    this.printHistory = removePrintedLabel(this.printHistory, this.pendingDelete.item);
    this.pendingDelete = null;
    this.addLog("info", "Printed label removed.");
  }

  private closeDeleteModal(): void {
    this.pendingDelete = null;
    this.render();
  }

  private renderDeleteModal(): string {
    const pendingDelete = this.pendingDelete;
    const isAll = pendingDelete?.kind === "all";
    const title = isAll ? "Clear printed labels?" : "Delete printed label?";
    const body = isAll
      ? "This will remove every saved printed label from this browser."
      : `Delete "${escapeHtml(pendingDelete?.kind === "one" ? pendingDelete.item.text : "")}" from printed labels?`;

    return `
      <div class="modal-backdrop" role="presentation" tabindex="-1">
        <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <h2 id="delete-modal-title">${title}</h2>
          <p>${body}</p>
          <div class="modal-actions">
            <button class="text-button" id="cancel-delete-button" type="button">Cancel</button>
            <button class="danger-button" id="confirm-delete-button" type="button">Delete</button>
          </div>
        </section>
      </div>
    `;
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

  private updatePreviewText(): void {
    const previewText = this.root.querySelector<HTMLSpanElement>(".label-preview span");

    if (previewText) {
      previewText.textContent = this.text || "Preview";
    }
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
