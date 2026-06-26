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
