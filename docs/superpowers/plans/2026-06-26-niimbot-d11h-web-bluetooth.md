# NIIMBOT D11_H Web Bluetooth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Chrome app that connects to a NIIMBOT D11_H over Web Bluetooth and prints centered, auto-sized text labels on `12x22mm` and `12x30mm` labels.

**Architecture:** Use Vite + TypeScript with a small DOM app. Keep label sizing/rendering pure and testable, and isolate NIIMBOT communication behind a `NiimbotPrinter` adapter that uses `@mmote/niimbluelib@0.0.1-alpha.40`.

**Tech Stack:** Vite, TypeScript, Vitest, Playwright, Web Bluetooth, Canvas API, `@mmote/niimbluelib@0.0.1-alpha.40`.

---

## File Structure

- `package.json`: scripts and pinned dependencies.
- `index.html`: Vite app shell.
- `src/main.ts`: app bootstrap.
- `src/App.ts`: DOM UI, event handlers, status log.
- `src/styles.css`: quiet tool UI for local Chrome use.
- `src/domain/labels.ts`: label size definitions and D11_H printer constants.
- `src/domain/renderLabel.ts`: text fitting, canvas drawing, monochrome bitmap extraction.
- `src/printer/NiimbotPrinter.ts`: printer interface and error helpers.
- `src/printer/WebBluetoothNiimbotPrinter.ts`: `@mmote/niimbluelib` Web Bluetooth implementation.
- `src/types/web-bluetooth.d.ts`: minimal Web Bluetooth type declarations if TypeScript needs them.
- `src/test/setup.ts`: DOM/canvas test setup.
- `src/domain/renderLabel.test.ts`: unit tests for fitting and bitmap boundaries.
- `tests/app.spec.ts`: browser smoke test for the local UI.
- `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.gitignore`: project tooling.

---

### Task 1: Scaffold Vite TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/App.ts`
- Create: `src/styles.css`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "web-niimbot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke": "playwright test"
  },
  "dependencies": {
    "@mmote/niimbluelib": "0.0.1-alpha.40"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create TypeScript and test configs**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "tests", "*.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"]
  }
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    ...devices["Desktop Chrome"]
  }
});
```

- [ ] **Step 3: Create app shell**

Create `.gitignore`:

```gitignore
node_modules
dist
coverage
.superpowers
.tmp
*.tgz
```

Create `index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NIIMBOT D11_H Printer</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `src/main.ts`:

```ts
import { App } from "./App";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Missing #app root element");
}

new App(root).render();
```

Create a temporary `src/App.ts`:

```ts
export class App {
  constructor(private readonly root: HTMLElement) {}

  render(): void {
    this.root.innerHTML = `
      <section class="app-shell">
        <h1>NIIMBOT D11_H</h1>
        <p class="subtitle">Local text label printer</p>
      </section>
    `;
  }
}
```

Create a temporary `src/styles.css`:

```css
:root {
  color: #1b1c1d;
  background: #f7f8fa;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.app-shell {
  width: min(720px, calc(100vw - 32px));
  margin: 48px auto;
}

.subtitle {
  color: #687076;
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit scaffold**

```bash
git add .gitignore index.html package.json package-lock.json tsconfig.json vitest.config.ts playwright.config.ts src/main.ts src/App.ts src/styles.css
git commit -m "feat: scaffold local niimbot web app"
```

---

### Task 2: Add Label Domain and Renderer Tests

**Files:**
- Create: `src/domain/labels.ts`
- Create: `src/domain/renderLabel.ts`
- Create: `src/test/setup.ts`
- Create: `src/domain/renderLabel.test.ts`

- [ ] **Step 1: Add label constants**

Create `src/domain/labels.ts`:

```ts
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

export function getCanvasSize(size: LabelSize): { width: number; height: number } {
  return {
    width: D11H_PRINTHEAD_PIXELS,
    height: mmToPixels(size.lengthMm)
  };
}
```

- [ ] **Step 2: Add renderer API skeleton**

Create `src/domain/renderLabel.ts`:

```ts
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
```

- [ ] **Step 3: Add canvas test setup**

Create `src/test/setup.ts`:

```ts
import { vi } from "vitest";

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
```

- [ ] **Step 4: Write renderer tests**

Create `src/domain/renderLabel.test.ts`:

```ts
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
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 6: Commit renderer**

```bash
git add src/domain/labels.ts src/domain/renderLabel.ts src/test/setup.ts src/domain/renderLabel.test.ts
git commit -m "feat: render centered D11_H text labels"
```

---

### Task 3: Add NIIMBOT Printer Adapter

**Files:**
- Create: `src/printer/NiimbotPrinter.ts`
- Create: `src/printer/WebBluetoothNiimbotPrinter.ts`
- Create: `src/types/web-bluetooth.d.ts`
- Modify: `src/domain/renderLabel.ts`

- [ ] **Step 1: Add printer interface**

Create `src/printer/NiimbotPrinter.ts`:

```ts
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
```

- [ ] **Step 2: Add rendered canvas export**

Modify `src/domain/renderLabel.ts` so `RenderedLabel` keeps the canvas, which `ImageEncoder.encodeCanvas` needs. The Task 2 version already does this, so verify this exact type exists:

```ts
export type RenderedLabel = {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
  width: number;
  height: number;
  fontSize: number;
};
```

- [ ] **Step 3: Add Web Bluetooth declarations if TypeScript reports missing globals**

Create `src/types/web-bluetooth.d.ts`:

```ts
interface BluetoothLEScanFilter {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
}
```

If `npm run build` reports duplicate Web Bluetooth declarations, delete this file and rely on TypeScript DOM declarations.

- [ ] **Step 4: Implement Web Bluetooth NIIMBOT adapter**

Create `src/printer/WebBluetoothNiimbotPrinter.ts`:

```ts
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
    this.currentDeviceName = info.deviceName ?? printerInfo.serialNumber ?? "NIIMBOT D11_H";
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
```

- [ ] **Step 5: Build to validate adapter types**

Run:

```bash
npm run build
```

Expected: build passes. If `PrinterInfo` property names differ, inspect `node_modules/@mmote/niimbluelib/dist/cjs/packets/dto.d.ts` and use an existing optional field for `currentDeviceName`.

- [ ] **Step 6: Commit adapter**

```bash
git add src/printer/NiimbotPrinter.ts src/printer/WebBluetoothNiimbotPrinter.ts src/types/web-bluetooth.d.ts src/domain/renderLabel.ts
git commit -m "feat: add web bluetooth niimbot adapter"
```

---

### Task 4: Build the Local Printing UI

**Files:**
- Modify: `src/App.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `App.ts` with working UI**

Replace `src/App.ts`:

```ts
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
```

- [ ] **Step 2: Replace CSS with usable tool styling**

Replace `src/styles.css`:

```css
:root {
  color: #202124;
  background: #f6f7f9;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(760px, calc(100vw - 32px));
  margin: 40px auto;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 28px;
  line-height: 1.1;
}

h2 {
  font-size: 15px;
  margin-bottom: 10px;
}

.subtitle {
  margin-top: 6px;
  color: #687076;
}

.connection-state {
  min-width: 136px;
  border: 1px solid #d8dde3;
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
  background: #ffffff;
  color: #4b5563;
  font-size: 14px;
}

.connection-state[data-status="connected"] {
  border-color: #2f9e44;
  color: #1f7a35;
}

.controls {
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 20px;
}

.field {
  display: grid;
  gap: 6px;
}

label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 650;
}

input,
select {
  height: 42px;
  border: 1px solid #cfd6dd;
  border-radius: 8px;
  padding: 0 12px;
  background: #ffffff;
  color: #202124;
}

.actions {
  display: flex;
  gap: 8px;
}

button {
  height: 42px;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 0 14px;
  background: #1f2937;
  color: #ffffff;
  cursor: pointer;
}

button:first-child {
  background: #ffffff;
  color: #1f2937;
}

.preview {
  display: grid;
  place-items: center;
  min-height: 260px;
  border: 1px solid #d8dde3;
  border-radius: 8px;
  background: #ffffff;
  margin-bottom: 18px;
}

.label-preview {
  display: grid;
  place-items: center;
  border: 1px dashed #6b7280;
  background: #fbfbfb;
  color: #111827;
  overflow: hidden;
}

.label-preview span {
  display: block;
  max-width: calc(100% - 16px);
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 750;
}

.label-preview-12x22 {
  width: 176px;
  height: 96px;
}

.label-preview-12x30 {
  width: 240px;
  height: 96px;
}

.log {
  border: 1px solid #d8dde3;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.log ol {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.log li {
  display: flex;
  gap: 10px;
  color: #4b5563;
  font-size: 13px;
}

.log time {
  min-width: 74px;
  color: #87909a;
}

.log li.success {
  color: #1f7a35;
}

.log li.error {
  color: #b42318;
}

@media (max-width: 680px) {
  .toolbar,
  .controls {
    grid-template-columns: 1fr;
  }

  .toolbar {
    display: grid;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

- [ ] **Step 3: Build and test**

Run:

```bash
npm run build
npm test
```

Expected: both commands pass.

- [ ] **Step 4: Commit UI**

```bash
git add src/App.ts src/styles.css
git commit -m "feat: add local label printing ui"
```

---

### Task 5: Add Browser Smoke Test

**Files:**
- Create: `tests/app.spec.ts`

- [ ] **Step 1: Add Playwright smoke test**

Create `tests/app.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("renders the local D11_H printer UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "NIIMBOT D11_H" })).toBeVisible();
  await expect(page.getByLabel("Label size")).toHaveValue("12x30");
  await expect(page.getByLabel("Text")).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  await expect(page.getByText("Ready. Open in Chrome on localhost.")).toBeVisible();
});

test("updates preview text", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Text").fill("Kitchen");

  await expect(page.locator(".label-preview span")).toHaveText("Kitchen");
});
```

- [ ] **Step 2: Install Playwright browser if missing**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium browser is installed or already present.

- [ ] **Step 3: Run smoke tests**

Run:

```bash
npm run smoke
```

Expected: both Playwright tests pass.

- [ ] **Step 4: Commit smoke tests**

```bash
git add tests/app.spec.ts
git commit -m "test: add browser smoke coverage"
```

---

### Task 6: Final Local Verification and Handoff

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add usage instructions**

Create `README.md`:

```md
# web-niimbot

Local Chrome web app for printing plain text labels to a NIIMBOT D11_H over Bluetooth.

## Requirements

- Chrome with Web Bluetooth support
- NIIMBOT D11_H powered on and near the computer
- `localhost` development server

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in Chrome.

## Print

1. Select `12 x 22 mm` or `12 x 30 mm`.
2. Type the label text.
3. Click `Connect`.
4. Select the NIIMBOT printer in Chrome's Bluetooth picker.
5. Click `Print`.

## Verify

```bash
npm run build
npm test
npm run smoke
```

Real D11_H output must be validated with the printer because Web Bluetooth cannot be exercised in automated tests.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run build
npm test
npm run smoke
```

Expected: build, unit tests, and smoke tests pass.

- [ ] **Step 3: Start local dev server**

Run:

```bash
npm run dev -- --port 5173
```

Expected: Vite prints `http://127.0.0.1:5173/`. Keep the session running for user testing.

- [ ] **Step 4: Commit docs**

```bash
git add README.md
git commit -m "docs: add local printer usage"
```

---

## Self-Review

- Spec coverage: local Chrome app, Web Bluetooth, D11_H, text-only printing, `12x22mm`, `12x30mm`, `12x30mm` default, centered auto-sized text, status log, and real-device validation are covered.
- Placeholder scan: no placeholders are present.
- Type consistency: `LabelSizeId`, `RenderedLabel`, `NiimbotPrinter`, and adapter method names are consistent across tasks.
