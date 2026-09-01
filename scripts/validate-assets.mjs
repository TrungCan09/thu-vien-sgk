import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadInventory } from "./inventory-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = await loadInventory();
const catalog = JSON.parse(await readFile(path.join(root, "src", "data", "catalog.generated.json"), "utf8"));
const pageCounts = JSON.parse(await readFile(path.join(root, "data", "page-counts.json"), "utf8"));
let totalBytes = 0;

if (catalog.length !== inventory.files.length) throw new Error(`Expected ${inventory.files.length} catalog entries.`);
if (new Set(catalog.map((book) => book.id)).size !== inventory.files.length) throw new Error("Duplicate catalog ID detected.");
if (new Set(catalog.map((book) => book.slug)).size !== inventory.files.length) throw new Error("Duplicate catalog slug detected.");

for (const file of inventory.files) {
  const pdfPath = path.join(root, "staging", "pdfs", `${file.id}.pdf`);
  const coverPath = path.join(root, "public", "covers", `${file.id}.webp`);
  const pdfStat = await stat(pdfPath);
  if (pdfStat.size !== Number(file.sizeBytes)) throw new Error(`PDF size mismatch: ${file.id}`);
  totalBytes += pdfStat.size;
  const handle = await open(pdfPath, "r");
  const signature = Buffer.alloc(5);
  await handle.read(signature, 0, 5, 0);
  await handle.close();
  if (signature.toString("ascii") !== "%PDF-") throw new Error(`Invalid PDF signature: ${file.id}`);
  if (!Number.isInteger(pageCounts[file.id]) || pageCounts[file.id] <= 0) throw new Error(`Invalid page count: ${file.id}`);
  const cover = await sharp(coverPath).metadata();
  if (cover.format !== "webp" || !cover.width || cover.width > 640) throw new Error(`Invalid cover: ${file.id}`);
}

const expectedBytes = inventory.files.reduce((sum, file) => sum + Number(file.sizeBytes), 0);
if (totalBytes !== expectedBytes) throw new Error(`Unexpected total size: ${totalBytes}`);
console.log(`Validated ${inventory.files.length} PDFs, covers, page counts and ${totalBytes} bytes.`);
