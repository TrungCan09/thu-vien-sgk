import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseBookFile } from "./catalog-core.mjs";
import { loadInventory } from "./inventory-core.mjs";

const inventory = await loadInventory();
let pageCounts = {};
try {
  pageCounts = JSON.parse(await readFile(new URL("../data/page-counts.json", import.meta.url), "utf8"));
} catch {
  pageCounts = {};
}

const typeOrder = { sgk: 0, sgv: 1, sbt: 2, other: 3 };

const catalog = inventory.files
  .map((file) => parseBookFile({ ...file, pageCount: pageCounts[file.id] ?? 0 }))
  .sort((a, b) => a.grade - b.grade || typeOrder[a.type] - typeOrder[b.type] || a.subject.localeCompare(b.subject, "vi") || (a.volume ?? 0) - (b.volume ?? 0) || a.title.localeCompare(b.title, "vi"));

const publicCatalog = catalog.map(({ assetKey, ...book }) => book);
const totalBytes = catalog.reduce((sum, book) => sum + book.sizeBytes, 0);
const warningThresholdBytes = 9_500_000_000;
const ids = new Set(catalog.map((book) => book.id));
const slugs = new Set(catalog.map((book) => book.slug));
if (catalog.length !== inventory.files.length || ids.size !== inventory.files.length || slugs.size !== inventory.files.length) {
  throw new Error(`Catalog invariant failed: ${catalog.length} books, ${ids.size} IDs, ${slugs.size} slugs`);
}

await mkdir(new URL("../src/data", import.meta.url), { recursive: true });
await mkdir(new URL("../public", import.meta.url), { recursive: true });
await mkdir(new URL("../functions", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/catalog.generated.json", import.meta.url), `${JSON.stringify(publicCatalog, null, 2)}\n`);
await writeFile(new URL("../public/catalog.json", import.meta.url), `${JSON.stringify(publicCatalog)}\n`);
const mapRows = catalog.map((book) => `  ${JSON.stringify(book.id)}: ${JSON.stringify({ assetKey: book.assetKey, downloadFileName: book.downloadFileName, sizeBytes: book.sizeBytes })},`).join("\n");
await writeFile(new URL("../functions/_catalog.generated.ts", import.meta.url), `export const BOOK_ASSETS = {\n${mapRows}\n} as const;\n`);
console.log(`Generated ${catalog.length} books (${(totalBytes / 1e9).toFixed(2)} GB).`);
if (totalBytes > warningThresholdBytes) {
  console.warn(`R2 storage warning: catalog uses ${(totalBytes / 1e9).toFixed(2)} GB, above the 9.50 GB alert threshold.`);
}
