import type { LabelSizeId } from "./labels";

export type PrintHistoryItem = {
  text: string;
  labelSize: LabelSizeId;
  printedAt: string;
};

const STORAGE_KEY = "web-niimbot.printHistory";
const collator = new Intl.Collator("ko-KR", { sensitivity: "base" });

export function loadPrintHistory(storage: Storage = localStorage): PrintHistoryItem[] {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PrintHistoryItem[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortPrintHistory(
      parsed.filter(
        (item) =>
          typeof item.text === "string" &&
          (item.labelSize === "12x22" || item.labelSize === "12x30") &&
          typeof item.printedAt === "string"
      )
    );
  } catch {
    return [];
  }
}

export function savePrintedLabel(
  history: PrintHistoryItem[],
  text: string,
  labelSize: LabelSizeId,
  storage: Storage = localStorage,
  now = new Date()
): PrintHistoryItem[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return sortPrintHistory(history);
  }

  const printedAt = now.toISOString();
  const withoutDuplicate = history.filter(
    (item) => !(item.text === trimmed && item.labelSize === labelSize)
  );
  const next = sortPrintHistory([{ text: trimmed, labelSize, printedAt }, ...withoutDuplicate]);

  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function sortPrintHistory(history: PrintHistoryItem[]): PrintHistoryItem[] {
  return [...history].sort((a, b) => {
    const textOrder = collator.compare(a.text, b.text);

    if (textOrder !== 0) {
      return textOrder;
    }

    return collator.compare(a.labelSize, b.labelSize);
  });
}
