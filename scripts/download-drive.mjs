import { createWriteStream } from "node:fs";
import { access, mkdir, open, rename, rm, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadInventory } from "./inventory-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventory = await loadInventory();
const staging = path.join(root, "staging", "pdfs");
const onlyId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const concurrency = Math.max(1, Math.min(6, Number(process.env.DRIVE_CONCURRENCY ?? 3)));
const selected = onlyId ? inventory.files.filter((file) => file.id === onlyId) : inventory.files;
let completed = 0;
let downloadedBytes = 0;

await mkdir(staging, { recursive: true });

async function isComplete(filePath, expectedSize) {
  try {
    return (await stat(filePath)).size === expectedSize;
  } catch {
    return false;
  }
}

async function assertPdf(filePath) {
  const handle = await open(filePath, "r");
  try {
    const signature = Buffer.alloc(5);
    await handle.read(signature, 0, signature.length, 0);
    if (signature.toString("ascii") !== "%PDF-") throw new Error("Downloaded response is not a PDF");
  } finally {
    await handle.close();
  }
}

async function download(file) {
  const expectedSize = Number(file.sizeBytes);
  const target = path.join(staging, `${file.id}.pdf`);
  const partial = `${target}.part`;
  if (await isComplete(target, expectedSize)) {
    await assertPdf(target);
    completed += 1;
    console.log(`[${completed}/${selected.length}] Reused ${file.id}`);
    return;
  }

  try {
    await access(target);
    await rename(target, `${target}.invalid-${Date.now()}`);
  } catch {
    // No existing target to preserve.
  }

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await rm(partial, { force: true });
      const url = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(file.id)}&export=download&confirm=t`;
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok || !response.body) throw new Error(`Drive returned HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
      const actualSize = (await stat(partial)).size;
      if (actualSize !== expectedSize) throw new Error(`Expected ${expectedSize} bytes, received ${actualSize}`);
      await assertPdf(partial);
      await rename(partial, target);
      downloadedBytes += actualSize;
      completed += 1;
      console.log(`[${completed}/${selected.length}] Downloaded ${file.id} (${(actualSize / 1e6).toFixed(1)} MB)`);
      return;
    } catch (error) {
      lastError = error;
      await rm(partial, { force: true });
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(`Failed ${file.id}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

const queue = [...selected];
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
  while (queue.length) {
    const file = queue.shift();
    if (file) await download(file);
  }
}));

console.log(`Ready ${completed} PDF files. Downloaded ${(downloadedBytes / 1e9).toFixed(2)} GB in this run.`);
