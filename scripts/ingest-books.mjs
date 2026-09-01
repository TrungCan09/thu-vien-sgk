import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { parseBookFile } from "./catalog-core.mjs";
import { loadInventory } from "./inventory-core.mjs";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = await loadInventory();
const upload = process.argv.includes("--upload");
const keepStaging = process.argv.includes("--keep-staging");
const onlyId = process.argv.find((arg) => arg.startsWith("--id="))?.slice(5);
const onlyGrade = Number(process.argv.find((arg) => arg.startsWith("--grade="))?.slice(8));
const staging = path.join(root, "staging", "pdfs");
const coverTmp = path.join(root, "tmp", "covers");
const covers = path.join(root, "public", "covers");
const r2Verify = path.join(root, "tmp", "r2-verify");
await mkdir(coverTmp, { recursive: true });
await mkdir(covers, { recursive: true });
await mkdir(r2Verify, { recursive: true });
const pageCounts = {};
const missing = [];
const selected = onlyId
  ? inventory.files.filter((file) => file.id === onlyId)
  : Number.isInteger(onlyGrade) && onlyGrade >= 1 && onlyGrade <= 12
    ? inventory.files.filter((file) => Number(file.grade) === onlyGrade)
    : inventory.files;
const concurrency = Math.max(1, Math.min(4, Number(process.env.INGEST_CONCURRENCY ?? (upload ? 2 : 3))));
let processed = 0;

async function sha256(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function processFile(file) {
  const pdfPath = path.join(staging, `${file.id}.pdf`);
  try {
    await access(pdfPath);
  } catch {
    missing.push(file.id);
    return;
  }
  const localSize = (await stat(pdfPath)).size;
  if (localSize !== Number(file.sizeBytes)) {
    throw new Error(`Size mismatch for ${file.id}: expected ${file.sizeBytes}, found ${localSize}`);
  }
  const { stdout } = await run("pdfinfo", [pdfPath], { maxBuffer: 1024 * 1024 });
  const pages = Number(stdout.match(/^Pages:\s+(\d+)/mu)?.[1] ?? 0);
  if (!pages) throw new Error(`Cannot read page count for ${file.id}`);
  pageCounts[file.id] = pages;
  const prefix = path.join(coverTmp, file.id);
  await run("pdftoppm", ["-f", "1", "-singlefile", "-png", "-r", "120", pdfPath, prefix]);
  await sharp(`${prefix}.png`).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(covers, `${file.id}.webp`));
  await rm(`${prefix}.png`, { force: true });
  if (upload) {
    const book = parseBookFile(file);
    const wrangler = process.platform === "win32" ? "npx.cmd" : "npx";
    const objectPath = `thu-vien-sgk/${book.assetKey}`;
    const expectedHash = await sha256(pdfPath);
    const verifyPath = path.join(r2Verify, `${file.id}.pdf`);
    await run(wrangler, ["wrangler", "r2", "object", "put", objectPath, "--file", pdfPath, "--content-type", "application/pdf", "--remote"], { maxBuffer: 8 * 1024 * 1024 });
    await run(wrangler, ["wrangler", "r2", "object", "get", objectPath, "--file", verifyPath, "--remote"], { maxBuffer: 8 * 1024 * 1024 });
    const verifiedSize = (await stat(verifyPath)).size;
    const verifiedHash = await sha256(verifyPath);
    await rm(verifyPath, { force: true });
    if (verifiedSize !== localSize || verifiedHash !== expectedHash) {
      throw new Error(`R2 verification failed for ${file.id}; staging copy was preserved.`);
    }
    if (!keepStaging) await rm(pdfPath, { force: true });
  }
  processed += 1;
  console.log(`[${processed}/${selected.length}] Processed ${file.id}`);
}

const queue = [...selected];
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
  while (queue.length) {
    const file = queue.shift();
    if (file) await processFile(file);
  }
}));

let existing = {};
try {
  existing = JSON.parse(await readFile(path.join(root, "data", "page-counts.json"), "utf8"));
} catch {
  existing = {};
}
await writeFile(path.join(root, "data", "page-counts.json"), `${JSON.stringify({ ...existing, ...pageCounts }, null, 2)}\n`);
console.log(`Processed ${Object.keys(pageCounts).length} PDF files. Missing from staging: ${missing.length}.`);
if (missing.length && !onlyId && !onlyGrade) console.log("Place PDFs at staging/pdfs/<drive-file-id>.pdf before a full ingest.");
