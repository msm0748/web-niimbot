import { describe, expect, it } from "vitest";
import {
  clearPrintHistory,
  hasPrintedText,
  loadPrintHistory,
  removePrintedLabel,
  savePrintedLabel,
  sortPrintHistory,
  type PrintHistoryItem
} from "./printHistory";

describe("print history", () => {
  it("sorts Korean labels alphabetically", () => {
    const history: PrintHistoryItem[] = [
      { text: "문석민", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" },
      { text: "김철수", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" },
      { text: "라벨", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" },
      { text: "나나", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" }
    ];

    expect(sortPrintHistory(history).map((item) => item.text)).toEqual([
      "김철수",
      "나나",
      "라벨",
      "문석민"
    ]);
  });

  it("stores a printed label and updates duplicates", () => {
    const storage = new MemoryStorage();
    const first = savePrintedLabel([], " 문석민 ", "12x22", storage, new Date("2026-01-01T00:00:00.000Z"));
    const second = savePrintedLabel(
      first,
      "문석민",
      "12x22",
      storage,
      new Date("2026-01-02T00:00:00.000Z")
    );

    expect(second).toEqual([
      { text: "문석민", labelSize: "12x22", printedAt: "2026-01-02T00:00:00.000Z" }
    ]);
    expect(loadPrintHistory(storage)).toEqual(second);
  });

  it("removes one printed label", () => {
    const storage = new MemoryStorage();
    const history: PrintHistoryItem[] = [
      { text: "김철수", labelSize: "12x22", printedAt: "2026-01-01T00:00:00.000Z" },
      { text: "문석민", labelSize: "12x30", printedAt: "2026-01-02T00:00:00.000Z" }
    ];

    const next = removePrintedLabel(history, history[0], storage);

    expect(next).toEqual([
      { text: "문석민", labelSize: "12x30", printedAt: "2026-01-02T00:00:00.000Z" }
    ]);
    expect(loadPrintHistory(storage)).toEqual(next);
  });

  it("clears all printed labels", () => {
    const storage = new MemoryStorage();
    savePrintedLabel([], "문석민", "12x22", storage, new Date("2026-01-01T00:00:00.000Z"));

    expect(clearPrintHistory(storage)).toEqual([]);
    expect(loadPrintHistory(storage)).toEqual([]);
  });

  it("detects duplicate text regardless of label size", () => {
    const history: PrintHistoryItem[] = [
      { text: "문석민", labelSize: "12x22", printedAt: "2026-01-01T00:00:00.000Z" }
    ];

    expect(hasPrintedText(history, " 문석민 ")).toBe(true);
    expect(hasPrintedText(history, "김철수")).toBe(false);
  });
});

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
