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

test("shows stored printed labels sorted in Korean order and reloads a label", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "web-niimbot.printHistory",
      JSON.stringify([
        { text: "문석민", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" },
        { text: "김철수", labelSize: "12x22", printedAt: "2026-01-01T00:00:00.000Z" },
        { text: "라벨", labelSize: "12x30", printedAt: "2026-01-01T00:00:00.000Z" }
      ])
    );
  });

  await page.goto("/");

  const labels = page.locator(".history-item span");
  await expect(labels).toHaveText(["김철수", "라벨", "문석민"]);

  await page.getByRole("button", { name: /김철수/ }).click();

  await expect(page.getByLabel("Text")).toHaveValue("김철수");
  await expect(page.getByLabel("Label size")).toHaveValue("12x22");
});
