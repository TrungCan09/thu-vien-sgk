import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

test("home page offers all grades including the new grade 10 collection", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sách học, mở ngay khi cần." })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Lớp 1 21 tài liệu$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Lớp 10 50 tài liệu$/ })).toBeVisible();
});

test("grade catalog searches without Vietnamese accents", async ({ page }) => {
  await page.goto("/lop/1");
  await expect(page.getByRole("heading", { name: "Sách Lớp 1" })).toBeVisible();
  await page.getByRole("textbox", { name: "Tìm theo tên sách" }).fill("tieng viet");
  await expect(page.getByText(/kết quả/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tiếng Việt 1/ }).first()).toBeVisible();
});

test("grade 10 filters special-topic books", async ({ page }) => {
  await page.goto("/lop/10");
  await expect(page.getByRole("heading", { name: "Sách Lớp 10" })).toBeVisible();
  await page.getByLabel("Lọc sách chuyên đề").click();
  await page.getByRole("option", { name: "Sách chuyên đề" }).click();
  await expect(page.getByText("17 kết quả")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Chuyên đề học tập/ }).first()).toBeVisible();
});

test("classes without special-topic books do not show the special filter", async ({ page }) => {
  await page.goto("/lop/1");
  await expect(page.getByLabel("Lọc sách chuyên đề")).toHaveCount(0);
});

test("theme control switches the global theme", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Chuyển sang giao diện/ });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
});

test("local server downloads a staged PDF with its clean filename", async ({ page }) => {
  const pdfPath = path.resolve("staging", "pdfs", "10n59TbCjg-pVeX_qGzWCoKq5hO9pyPk1.pdf");
  test.skip(!existsSync(pdfPath), "Local staging PDF is not available in this environment.");
  await page.goto("/sach/sach-giao-khoa-am-nhac-1-10n59tbc");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Tải PDF" }).first().click();
  const download = await downloadEvent;
  expect(["Sách giáo khoa Âm nhạc 1.pdf", "Sach giao khoa Am nhac 1.pdf"]).toContain(download.suggestedFilename());
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  expect(statSync(downloadedPath!).size).toBe(statSync(pdfPath).size);
});

test("book reader renders a page, zooms, and exposes the download", async ({ page }) => {
  test.setTimeout(60_000);
  const pdf = await PDFDocument.create();
  pdf.addPage([420, 594]);
  pdf.addPage([420, 594]);
  const bytes = await pdf.save();
  await page.route("**/api/books/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/pdf",
    body: Buffer.from(bytes),
    headers: { "Accept-Ranges": "bytes", "Content-Length": String(bytes.length) },
  }));
  const book = {
    id: "10n59TbCjg-pVeX_qGzWCoKq5hO9pyPk1",
    slug: "sach-giao-khoa-am-nhac-1-10n59tbc",
    title: "Sách giáo khoa Âm nhạc 1",
  };
  await page.goto(`/sach/${book.slug}`);
  await expect(page.getByRole("heading", { name: book.title })).toBeVisible();
  await expect(page.getByLabel(`Trang 1 của ${book.title}`)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("/ 2")).toBeVisible();
  await expect(page.locator(".pdf-stage")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Phóng to" }).click({ force: true });
  await expect(page.getByText("115%")).toBeVisible();
  await expect(page.getByRole("link", { name: "Tải PDF" }).last()).toHaveAttribute("href", `/api/books/${book.id}?download=1`);
});
